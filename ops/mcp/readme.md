# mcp

Un conector de Claude para la VM: Claude actua sobre el servidor sin depender de Cloud Shell ni de Chrome.

```
server.py   el servidor MCP (SDK oficial `mcp` 2.3.0): su propio OAuth y la lista cerrada de herramientas
install.sh  se corre en la VM: instala o actualiza, cambia la contrasena, o lo quita
```

## Como esta armado
- Corre como servicio `mu-mcp` en `127.0.0.1:8770`, detras del Caddy que ya sirve el 443
  (`release/vm/https-caddy.sh`): `https://mcp.155-181-133-84.sslip.io/mcp`. No abre puertos nuevos.
- Inicio de sesion: Claude se registra solo (DCR) y la pagina `/login` pide la contrasena del dueno. En la VM queda solo
  su hash scrypt (`/etc/mu-mcp/password`). Tokens de 1 hora, refresco de 30 dias que rota, 10 intentos fallidos por hora.
  Los tokens se guardan como sha256 en `/var/lib/mu-mcp/state.db`.
- No se queda caido: systemd lo reintenta siempre (`StartLimitIntervalSec=0`), Linux no lo elige ante falta de
  memoria (`OOMScoreAdjust=-800`) y el temporizador `mu-mcp-vigia` lo reinicia si `/salud` no responde en un minuto.
- Ninguna herramienta es una terminal libre. Cada una corre comandos fijos con argumentos validados, y cada llamada queda
  en `/var/lib/mu-mcp/audit.log`.

## Herramientas
| Herramienta | Que hace |
|---|---|
| `estado` | carga, memoria, disco, contenedores, version del cliente y de mu-assets |
| `logs` | registro de un contenedor, con filtro y `desde` |
| `sql_consulta` | solo lectura en `openmu_probe` u `openmu`, con el rol `mu_mcp_ro` (sin permisos de escritura) |
| `sql_aplicar` | un `.sql` de mu-assets (`s19/server/...`); en `openmu` pide `confirmar_produccion` y respalda antes |
| `accion` | desplegar o volver plugins, publicar el cliente, copiar assets S19, s10 y s12, reiniciar OpenMU, respaldar, actualizar mu-assets |
| `trabajo` | avance de una accion larga (corren en segundo plano) |
| `leer_archivo`, `listar` | `/opt/openmu`, `~/mu-assets` y `/var/log`, nunca archivos de claves o `.env` |

Lo que cambia lo que usan los jugadores pide `confirmar_produccion=true`. Las acciones bajan los scripts de este
repositorio en el commit que se indique, como ya hacian `deploy.sh` y `s10_apply.sh`.

## Instalar
En la VM: `curl -fsSL https://raw.githubusercontent.com/Jonatks/mu-web-client/<sha>/ops/mcp/install.sh -o install.sh && bash install.sh <sha>`.
La primera vez pide la contrasena (minimo 12 caracteres). Luego, en Claude: Personalizar > Conectores > Agregar
conector personalizado, con la URL de arriba, y al conectar se abre `/login`.

Actualizar: lo mismo con otro `sha`. Cambiar la contrasena: `bash install.sh contrasena`. Quitar: `bash install.sh quitar`.

## Lo que no hace
Nada que pida las cuentas del dueno (consola de Oracle, GitHub), aceptar terminos ni captchas. Tampoco captura el juego
con tarjeta grafica: queda para una version siguiente (Playwright por software).
