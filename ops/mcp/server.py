"""MCP de la VM: un conector de Claude con una lista cerrada de acciones sobre el servidor (ver readme.md).

Sirve en 127.0.0.1:8770 detras del Caddy de la VM (https://mcp.<host>/mcp). Es su propio servidor OAuth: Claude se
registra solo (DCR) y el dueno entra con la contrasena que puso install.sh (solo su hash scrypt queda en la VM).
Ninguna herramienta abre una terminal libre: cada una corre comandos fijos con argumentos validados, y todo queda en
audit.log.
"""
from __future__ import annotations

import asyncio
import hashlib
import hmac
import html
import json
import os
import re
import secrets
import shlex
import sqlite3
import subprocess
import time
from pathlib import Path

from pydantic import AnyHttpUrl
from starlette.requests import Request
from starlette.responses import HTMLResponse, RedirectResponse, Response

from mcp.server.auth.provider import (AccessToken, AuthorizationCode, AuthorizationParams, AuthorizeError,
                                      RefreshToken, TokenError, construct_redirect_uri)
from mcp.server.auth.settings import AuthSettings, ClientRegistrationOptions, RevocationOptions
from mcp.server.mcpserver.server import MCPServer
from mcp.server.transport_security import TransportSecuritySettings
from mcp.shared.auth import OAuthClientInformationFull, OAuthToken

HOST = os.environ.get('MU_MCP_HOST', 'mcp.155-181-133-84.sslip.io')
BASE = os.environ.get('MU_MCP_BASE', f'https://{HOST}')
STATE = Path(os.environ.get('MU_MCP_STATE', '/var/lib/mu-mcp'))
PASSWORD_FILE = Path(os.environ.get('MU_MCP_PASSWORD_FILE', '/etc/mu-mcp/password'))
HOME = Path(os.environ.get('MU_MCP_HOME', str(Path.home())))
REPO = 'https://raw.githubusercontent.com/Jonatks/mu-web-client'
DBS = ('openmu_probe', 'openmu')
ACCESS_TTL, REFRESH_TTL, CODE_TTL, LOGIN_TTL = 3600, 30 * 86400, 300, 600
STATE.mkdir(parents=True, exist_ok=True)
(STATE / 'jobs').mkdir(exist_ok=True)


# ---- estado (sqlite) -------------------------------------------------------------------------------------------

def db() -> sqlite3.Connection:
    c = sqlite3.connect(STATE / 'state.db')
    c.execute('create table if not exists kv (kind text, key text, value text, expires real, primary key (kind, key))')
    return c


def put(kind: str, key: str, value: dict, ttl: float | None) -> None:
    with db() as c:
        c.execute('insert or replace into kv values (?, ?, ?, ?)', (kind, key, json.dumps(value), time.time() + ttl if ttl else None))


def get(kind: str, key: str) -> dict | None:
    with db() as c:
        row = c.execute('select value, expires from kv where kind = ? and key = ?', (kind, key)).fetchone()
    if not row or (row[1] and row[1] < time.time()):
        return None
    return json.loads(row[0])


def drop(kind: str, key: str) -> None:
    with db() as c:
        c.execute('delete from kv where kind = ? and key = ?', (kind, key))


def digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def audit(event: str, **data) -> None:
    with open(STATE / 'audit.log', 'a') as f:
        f.write(json.dumps({'t': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'e': event, **data}, ensure_ascii=False) + '\n')


# ---- OAuth: registro automatico, pagina de contrasena, tokens ---------------------------------------------------

def check_password(password: str) -> bool:
    salt_hex, hash_hex = PASSWORD_FILE.read_text().strip().split(':')
    got = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), n=2 ** 15, r=8, p=1, maxmem=2 ** 26)
    return hmac.compare_digest(got.hex(), hash_hex)


class Provider:
    async def get_client(self, client_id: str) -> OAuthClientInformationFull | None:
        v = get('client', client_id)
        return OAuthClientInformationFull.model_validate(v) if v else None

    async def register_client(self, client_info: OAuthClientInformationFull) -> None:
        put('client', client_info.client_id, client_info.model_dump(mode='json'), None)
        audit('registro', client=client_info.client_id, nombre=client_info.client_name)

    async def authorize(self, client: OAuthClientInformationFull, params: AuthorizationParams) -> str:
        req = secrets.token_urlsafe(24)
        put('login', req, {'client_id': client.client_id, 'params': params.model_dump(mode='json')}, LOGIN_TTL)
        return f'{BASE}/login?req={req}'

    async def load_authorization_code(self, client, authorization_code: str) -> AuthorizationCode | None:
        v = get('code', digest(authorization_code))
        return AuthorizationCode.model_validate(v) if v and v['client_id'] == client.client_id else None

    def _issue(self, client_id: str, scopes: list[str], resource: str | None) -> OAuthToken:
        access, refresh = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
        now = int(time.time())
        put('access', digest(access), AccessToken(token='', client_id=client_id, scopes=scopes, expires_at=now + ACCESS_TTL,
                                                   resource=resource, subject='owner').model_dump(mode='json'), ACCESS_TTL)
        put('refresh', digest(refresh), RefreshToken(token='', client_id=client_id, scopes=scopes, expires_at=now + REFRESH_TTL,
                                                     resource=resource, subject='owner').model_dump(mode='json'), REFRESH_TTL)
        return OAuthToken(access_token=access, token_type='Bearer', expires_in=ACCESS_TTL, refresh_token=refresh,
                          scope=' '.join(scopes) or None)

    async def exchange_authorization_code(self, client, authorization_code: AuthorizationCode) -> OAuthToken:
        drop('code', digest(authorization_code.code))
        audit('token', client=client.client_id)
        return self._issue(client.client_id, authorization_code.scopes, authorization_code.resource)

    async def load_refresh_token(self, client, refresh_token: str) -> RefreshToken | None:
        v = get('refresh', digest(refresh_token))
        if not v or v['client_id'] != client.client_id:
            return None
        return RefreshToken.model_validate({**v, 'token': refresh_token})

    async def exchange_refresh_token(self, client, refresh_token: RefreshToken, scopes: list[str]) -> OAuthToken:
        drop('refresh', digest(refresh_token.token))  # rotacion: el viejo deja de servir
        return self._issue(client.client_id, scopes or refresh_token.scopes, refresh_token.resource)

    async def load_access_token(self, token: str) -> AccessToken | None:
        v = get('access', digest(token))
        return AccessToken.model_validate({**v, 'token': token}) if v else None

    async def revoke_token(self, token) -> None:
        drop('access', digest(token.token))
        drop('refresh', digest(token.token))


mcp = MCPServer(
    name='mu-vm',
    instructions='Acciones sobre la VM del servidor MU (OpenMU S19 y el cliente web). Lo que cambia la base openmu '
                 '(produccion) pide confirmar_produccion=true; probar antes en openmu_probe. Los trabajos largos '
                 'devuelven un id: leer su avance con trabajo(id).',
    auth_server_provider=Provider(),
    auth=AuthSettings(issuer_url=AnyHttpUrl(BASE), resource_server_url=AnyHttpUrl(f'{BASE}/mcp'),
                      validate_token_resource=True,
                      client_registration_options=ClientRegistrationOptions(enabled=True),
                      revocation_options=RevocationOptions(enabled=True)),
)

FAILS: list[float] = []
PAGE = """<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>MU VM</title><body style="font-family:system-ui;max-width:26rem;margin:4rem auto;padding:0 1rem">
<h2>Conectar Claude a la VM de MU</h2><p>{msg}</p>
<form method=post><input type=hidden name=req value="{req}">
<input type=password name=password autofocus required placeholder="Contrasena" style="width:100%;padding:.6rem;font-size:1rem">
<button style="margin-top:1rem;padding:.6rem 1.2rem;font-size:1rem">Autorizar</button></form>"""


@mcp.custom_route('/login', methods=['GET', 'POST'])
async def login(request: Request) -> Response:
    if request.method == 'GET':
        req = request.query_params.get('req', '')
        if not get('login', req):
            return HTMLResponse('Pedido vencido. Vuelve a conectar desde Claude.', status_code=400)
        return HTMLResponse(PAGE.format(req=html.escape(req), msg='Claude pide acceso a las acciones de la VM.'))
    form = await request.form()
    req, password = str(form.get('req', '')), str(form.get('password', ''))
    pending = get('login', req)
    if not pending:
        return HTMLResponse('Pedido vencido. Vuelve a conectar desde Claude.', status_code=400)
    now = time.time()
    FAILS[:] = [t for t in FAILS if now - t < 3600]
    if len(FAILS) >= 10:
        audit('login_bloqueado')
        return HTMLResponse('Demasiados intentos fallidos. Espera una hora.', status_code=429)
    if not check_password(password):
        FAILS.append(now)
        audit('login_fallido', ip=request.headers.get('x-forwarded-for'))
        await asyncio.sleep(1)
        return HTMLResponse(PAGE.format(req=html.escape(req), msg='Contrasena incorrecta.'), status_code=401)
    drop('login', req)
    params = pending['params']
    code = secrets.token_urlsafe(32)
    put('code', digest(code), AuthorizationCode(
        code=code, scopes=params.get('scopes') or [], expires_at=now + CODE_TTL, client_id=pending['client_id'],
        code_challenge=params['code_challenge'], redirect_uri=params['redirect_uri'],
        redirect_uri_provided_explicitly=params['redirect_uri_provided_explicitly'], resource=params.get('resource'),
        subject='owner').model_dump(mode='json'), CODE_TTL)
    audit('login_ok', client=pending['client_id'])
    return RedirectResponse(construct_redirect_uri(params['redirect_uri'], code=code, state=params.get('state')), status_code=302)


@mcp.custom_route('/salud', methods=['GET'])
async def health(_: Request) -> Response:
    return Response('ok')


# ---- ejecucion -------------------------------------------------------------------------------------------------

def run(cmd: list[str] | str, timeout: int = 60, stdin: str | None = None) -> str:
    shell = isinstance(cmd, str)
    p = subprocess.run(cmd, shell=shell, input=stdin, capture_output=True, text=True, timeout=timeout,
                       executable='/bin/bash' if shell else None)
    out = (p.stdout + ('\n' + p.stderr if p.stderr.strip() else '')).strip()
    return f'{out[-20000:]}\n[salida {p.returncode}]'


def job(name: str, script: str, env: dict[str, str] | None = None) -> str:
    """Corre `script` (bash) en segundo plano: devuelve el id para trabajo()."""
    jid = time.strftime('%m%d-%H%M%S-') + secrets.token_hex(2) + '-' + name
    log = STATE / 'jobs' / f'{jid}.log'
    wrapped = f'( {script} ) > {shlex.quote(str(log))} 2>&1; echo "[salida $?]" >> {shlex.quote(str(log))}'
    # Fuera del servicio (su propia unidad de systemd): una tarea pesada no cuenta contra el tope de memoria del MCP,
    # y si el MCP se reinicia la tarea sigue (un despliegue no pierde su vuelta atras).
    sets = [f'--setenv={k}={v}' for k, v in {'HOME': str(HOME), 'PATH': os.environ.get('PATH', ''), **(env or {})}.items()]
    subprocess.Popen(['sudo', 'systemd-run', '--quiet', '--collect', f'--unit=mu-job-{jid}', f'--uid={os.getuid()}',
                      f'--gid={os.getgid()}', f'--working-directory={HOME}', *sets, '/bin/bash', '-c', wrapped],
                     start_new_session=True)
    audit('trabajo', id=jid, script=script, env=env)
    return f'trabajo {jid} en marcha. Leer con trabajo("{jid}").'


SHA = re.compile(r'^[0-9a-f]{7,40}$')
PULL = 'GIT_SSH_COMMAND="ssh -i ~/.ssh/mu_assets -o IdentitiesOnly=yes" git -C ~/mu-assets pull -q'


def need_sha(sha: str) -> str:
    if not SHA.match(sha):
        raise ValueError('sha debe ser el hash hexadecimal de un commit de mu-web-client')
    return sha


def fetch(sha: str, path: str) -> str:
    """Comando que baja un archivo del repo en ese commit a /tmp y deja su ruta en $F."""
    return f'F=$(mktemp); curl -fsSL {REPO}/{need_sha(sha)}/{path} -o "$F"'


# ---- herramientas ----------------------------------------------------------------------------------------------

@mcp.tool()
def estado() -> str:
    """Estado de la VM: carga, memoria, disco, contenedores, version del cliente publicado y del repo de assets."""
    audit('estado')
    return run('uptime; free -m; df -h / | tail -1; sudo docker ps --format "{{.Names}}\\t{{.Status}}\\t{{.Image}}"; '
               'echo; cat /opt/openmu/web/client/build.json 2>/dev/null; echo; '
               'git -C ~/mu-assets log --oneline -1 2>/dev/null; '
               'sudo docker image inspect munique/openmu --format "openmu oficial: {{.Created}} {{index .RepoDigests 0}}" 2>/dev/null; '
               'sudo docker exec openmu sh -c "grep -ao \'InformationalVersion[^,]*\' /app/MUnique.OpenMU.GameLogic.dll | head -1" 2>/dev/null')


@mcp.tool()
def logs(contenedor: str = 'openmu', lineas: int = 200, filtro: str = '', desde: str = '') -> str:
    """Ultimas lineas del registro de un contenedor (openmu, database, web, caddy, ...). `filtro`: texto a buscar
    (sin distinguir mayusculas). `desde`: por ejemplo 30m o 2h."""
    names = run(['sudo', 'docker', 'ps', '-a', '--format', '{{.Names}}']).split('\n')[:-1]
    if contenedor not in names:
        return f'contenedor desconocido; hay: {", ".join(names)}'
    if desde and not re.match(r'^\d+[smh]$', desde):
        return 'desde debe ser como 30m o 2h'
    audit('logs', contenedor=contenedor, filtro=filtro)
    cmd = ['sudo', 'docker', 'logs', '--tail', str(min(max(lineas, 1), 5000))] + (['--since', desde] if desde else []) + [contenedor]
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    text = (p.stdout + p.stderr).splitlines()
    if filtro:
        text = [l for l in text if filtro.lower() in l.lower()]
    return '\n'.join(text)[-30000:] or '(sin lineas)'


@mcp.tool()
def sql_consulta(base: str, consulta: str) -> str:
    """Una consulta de solo lectura (rol mu_mcp_ro, sin permiso de escritura) en openmu_probe u openmu."""
    if base not in DBS:
        return f'base debe ser una de {DBS}'
    audit('sql_consulta', base=base, consulta=consulta)
    return run(['sudo', 'docker', 'exec', '-i', 'database', 'psql', '-U', 'mu_mcp_ro', '-d', base, '-v', 'ON_ERROR_STOP=1',
                '-P', 'pager=off'], timeout=60, stdin=consulta)


@mcp.tool()
def sql_aplicar(base: str, archivo: str, confirmar_produccion: bool = False) -> str:
    """Aplica un .sql del repositorio privado mu-assets (ruta dentro de s19/server, p. ej. s12/s12_mapa91.sql) tras
    actualizarlo. En openmu (produccion) pide confirmar_produccion=true y saca antes una copia de la base."""
    if base not in DBS:
        return f'base debe ser una de {DBS}'
    if base == 'openmu' and not confirmar_produccion:
        return 'openmu es produccion: repetir con confirmar_produccion=true (despues de probar en openmu_probe)'
    if not re.match(r'^[\w./-]+\.sql$', archivo) or '..' in archivo:
        return 'archivo invalido'
    path = HOME / 'mu-assets/s19/server' / archivo
    backup = '(/usr/local/bin/mu-db-backup run || true) && ' if base == 'openmu' else ''
    return job('sql', f'{PULL} && test -f {shlex.quote(str(path))} && {backup}'
                      f'sudo docker exec -i database psql -U postgres -d {base} -v ON_ERROR_STOP=1 < {shlex.quote(str(path))}')


ACCIONES = {
    'desplegar_plugins': 'Compila los plugins de mu-web-client en `sha` y recrea openmu (ops/fase0/deploy.sh, vuelve solo atras si falla).',
    'volver_plugins': 'Vuelve a la imagen de OpenMU anterior a los plugins (deploy.sh rollback de cualquier `sha`).',
    'publicar_cliente': 'Corre el autodeploy del cliente web (toma la rama release).',
    'copiar_assets_s19': 'Copia los assets S19 de mu-assets sobre el cliente (apply_client_s19.sh). `args`: rollback.',
    'aplicar_s10': 'ops/faseS/s10_apply.sh en `sha`. `args`: PROD=1, UNDO=1, RESTORE=1.',
    'aplicar_s12': 'ops/faseS/s12_apply.sh en `sha` (mapas nuevos). `args`: MAPA=91, PROD=1, UNDO=1, RESTORE=1.',
    'reiniciar_openmu': 'Reinicia el contenedor openmu.',
    'respaldar_base': 'Copia de todas las bases (mu-db-backup run).',
    'actualizar_mu_assets': 'git pull de mu-assets.',
    'actualizar_mcp': 'Este mismo servidor y su servicio desde ops/mcp en `sha` (install.sh; guarda server.py.prev).',
}


@mcp.tool()
def accion(nombre: str, sha: str = '', args: str = '', confirmar_produccion: bool = False) -> str:
    """Una accion de la lista cerrada; corre en segundo plano y devuelve el id para trabajo(). Lista:
    desplegar_plugins, volver_plugins, publicar_cliente, copiar_assets_s19, aplicar_s10, aplicar_s12,
    reiniciar_openmu, respaldar_base, actualizar_mu_assets, actualizar_mcp. Las que tocan produccion piden confirmar_produccion=true."""
    if nombre not in ACCIONES:
        return 'acciones: ' + '; '.join(f'{k}: {v}' for k, v in ACCIONES.items())
    env = {}
    for kv in args.split():
        k, _, v = kv.partition('=')
        if k not in ('PROD', 'UNDO', 'RESTORE', 'MAPA', 'rollback') or not re.match(r'^\w*$', v):
            return f'argumento no permitido: {kv}'
        env[k] = v
    prod = nombre in ('desplegar_plugins', 'volver_plugins', 'publicar_cliente', 'copiar_assets_s19', 'reiniciar_openmu') \
        or env.get('PROD') == '1'
    if prod and not confirmar_produccion:
        return f'{nombre} cambia lo que usan los jugadores: repetir con confirmar_produccion=true'
    script = {
        'desplegar_plugins': lambda: f'{fetch(sha, "ops/fase0/deploy.sh")} && sh "$F" {need_sha(sha)}',
        'volver_plugins': lambda: f'{fetch(sha, "ops/fase0/deploy.sh")} && sh "$F" rollback',
        'publicar_cliente': lambda: 'sudo /usr/local/bin/mu-web-autodeploy',
        'copiar_assets_s19': lambda: f'bash ~/apply_client_s19.sh {"rollback" if "rollback" in env else ""}',
        'aplicar_s10': lambda: f'{fetch(sha, "ops/faseS/s10_apply.sh")} && SHA={sha} bash "$F"',
        'aplicar_s12': lambda: f'{fetch(sha, "ops/faseS/s12_apply.sh")} && SHA={sha} bash "$F"',
        'reiniciar_openmu': lambda: 'sudo docker restart openmu',
        'respaldar_base': lambda: '/usr/local/bin/mu-db-backup run',
        'actualizar_mu_assets': lambda: PULL,
        'actualizar_mcp': lambda: f'{fetch(sha, "ops/mcp/server.py")} && /opt/mu-mcp/venv/bin/python -m py_compile "$F" '
                                  f'&& cp /opt/mu-mcp/server.py /opt/mu-mcp/server.py.prev '
                                  f'&& curl -fsSL {REPO}/{need_sha(sha)}/ops/mcp/install.sh -o ~/mcp-install.sh '
                                  f'&& bash ~/mcp-install.sh {need_sha(sha)}',
    }[nombre]
    try:
        return job(nombre, script(), {k: v for k, v in env.items() if k != 'rollback'})
    except ValueError as e:
        return str(e)


@mcp.tool()
def trabajo(id: str = '', lineas: int = 80) -> str:
    """Avance de un trabajo: sus ultimas lineas y "[salida N]" al terminar. Sin id, lista los ultimos."""
    jobs = sorted((STATE / 'jobs').glob('*.log'))
    if not id:
        return '\n'.join(p.stem for p in jobs[-20:]) or '(ninguno)'
    p = STATE / 'jobs' / f'{id}.log'
    if not re.match(r'^[\w-]+$', id) or not p.exists():
        return 'trabajo desconocido'
    text = p.read_text(errors='replace').splitlines()
    done = any(l.startswith('[salida ') for l in text[-2:])
    return ('TERMINADO\n' if done else 'EN MARCHA\n') + '\n'.join(text[-min(max(lineas, 1), 2000):])


SECRET = re.compile(r'(\.env|secret|password|passwd|\.pem|\.key|id_|token|credential)', re.I)
ROOTS = ('/opt/openmu', str(HOME / 'mu-assets'), '/var/log')


@mcp.tool()
def leer_archivo(ruta: str, desde: int = 1, lineas: int = 200) -> str:
    """Lee un archivo de texto de /opt/openmu, ~/mu-assets o /var/log (nunca claves ni .env; los valores de
    contrasenas, tokens y claves dentro de un archivo salen como [oculto])."""
    p = os.path.realpath(os.path.expanduser(ruta))
    if not any(p == r or p.startswith(r + '/') for r in ROOTS) or SECRET.search(p):
        return f'ruta no permitida (solo {", ".join(ROOTS)}, sin secretos)'
    audit('leer_archivo', ruta=p)
    return redact(run(['sudo', 'sed', '-n', f'{max(desde, 1)},{max(desde, 1) + min(max(lineas, 1), 2000) - 1}p', p]))


# El valor de toda clave cuyo nombre suena a secreto (PASSWORD, _PW, SECRET, TOKEN, KEY...) en YAML, .ini, JSON o env.
SECRET_VALUE = re.compile(r'''(?im)^(\s*["']?[\w.-]*(?:pass(?:word)?|_pw|pw_|secret|token|api[_-]?key|private[_-]?key|credential)[\w.-]*["']?\s*[:=]\s*)(\S.*)$''')


def redact(text: str) -> str:
    return SECRET_VALUE.sub(lambda m: m.group(1) + '[oculto]', text)


@mcp.tool()
def listar(ruta: str) -> str:
    """Lista una carpeta de /opt/openmu, ~/mu-assets o /var/log."""
    p = os.path.realpath(os.path.expanduser(ruta))
    if not any(p == r or p.startswith(r + '/') for r in ROOTS):
        return f'ruta no permitida (solo {", ".join(ROOTS)})'
    return run(['sudo', 'ls', '-la', p])


app = mcp.streamable_http_app(transport_security=TransportSecuritySettings(
    enable_dns_rebinding_protection=True, allowed_hosts=[HOST, '127.0.0.1:8770', '127.0.0.1:*'], allowed_origins=[BASE]))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=int(os.environ.get('MU_MCP_PORT', '8770')), proxy_headers=True,
                forwarded_allow_ips='127.0.0.1', timeout_graceful_shutdown=2)
