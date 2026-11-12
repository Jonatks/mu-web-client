// Admin page: plain JS, no build. Every call goes through /api/mu (the Vercel function that holds the key).
// The page CSP forbids inline styles, so every style here is set through the CSSOM (el.style), never as an attribute.
const $ = s => document.querySelector(s);
const view = $('#view');
let toastTimer;

function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
/** replaceChildren that skips null and false, which the native one would print as text. */
const fill = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter(c => c != null && c !== false));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const num = n => Number(n ?? 0).toLocaleString('es');

function toast(msg, bad = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show' + (bad ? ' bad' : '');
  try { t.hidePopover(); t.showPopover(); } catch { /* old browser: the fixed position still works */ }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; try { t.hidePopover(); } catch { /* not open */ } }, bad ? 6500 : 2800);
}

async function api(method, path, body, signal) {
  const r = await fetch('/api/mu?p=' + encodeURIComponent(path), {
    method,
    signal,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401) { showLogin(); throw new Error('Sesión vencida.'); }
  if (!r.ok) throw Object.assign(new Error(data.error || `Error ${r.status}`), { code: data.code });
  return data;
}

/** Runs an action and tells the result; the error text comes from the service. */
async function act(fn, ok) {
  try { const r = await fn(); if (ok) toast(ok); return r; } catch (e) { if (e.name !== 'AbortError') { toast(e.code === 'players_connected' ? e.message + '. Toca el aviso rojo de arriba para desconectarlos.' : e.message, true); refreshGate(); } }
}

/* ----------------------------------------------------------------- dialogs */
const dlg = $('#dlg');
function openDialog(...content) { fill(dlg, h('div', { class: 'dlg' }, ...content)); if (!dlg.open) dlg.showModal(); }
function closeDialog() { if (dlg.open) dlg.close(); }

/** Asks yes/no inside the page. Resolves true only on the confirm button. */
function confirmBox(title, text, label, danger = false) {
  return new Promise(resolve => {
    let done = false;
    const end = v => { done = true; resolve(v); closeDialog(); };
    dlg.addEventListener('close', () => { if (!done) resolve(false); }, { once: true });
    openDialog(h('h3', {}, title), text ? h('p', { class: 'mute' }, text) : null,
      h('div', { class: 'actions' }, h('button', { onclick: () => end(false) }, 'Cancelar'), h('button', { class: danger ? 'primary danger-fill' : 'primary', onclick: () => end(true) }, label)));
  });
}

/** Asks the owner to type the exact name before a delete. Resolves true only on a match. */
function typedConfirm(title, text, expected) {
  return new Promise(resolve => {
    let done = false;
    const end = v => { done = true; resolve(v); closeDialog(); };
    dlg.addEventListener('close', () => { if (!done) resolve(false); }, { once: true });
    const input = h('input', { autocomplete: 'off', 'aria-label': 'Escribe el nombre para confirmar' });
    const go = h('button', { class: 'primary danger-fill', disabled: true, onclick: () => end(true) }, 'Borrar');
    input.addEventListener('input', () => { go.disabled = input.value !== expected; });
    openDialog(h('h3', {}, title), h('p', { class: 'mute' }, text), h('label', {}, `Escribe ${expected} para confirmar`, input),
      h('div', { class: 'actions' }, h('button', { onclick: () => end(false) }, 'Cancelar'), go));
    input.focus();
  });
}

/* ----------------------------------------------------------------- session */
function showLogin() { $('#app').hidden = true; $('#login').hidden = false; }
async function enter(user) {
  $('#login').hidden = true; $('#app').hidden = false; $('#who').textContent = user;
  refreshGate(); go(location.hash.slice(1) || 'accounts');
}
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const r = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user: f.get('user'), password: f.get('password') }) });
  const d = await r.json().catch(() => ({}));
  if (r.ok) { e.target.reset(); $('#loginErr').textContent = ''; enter(d.user); } else $('#loginErr').textContent = d.error || 'No se pudo entrar.';
});
$('#logout').addEventListener('click', async () => { await fetch('/api/logout', { method: 'POST' }); showLogin(); });

/** Closes every player's connection (OpenMU saves each one) so edits can proceed. */
async function disconnectAll() {
  if (!(await confirmBox('Desconectar a todos los jugadores', 'Se corta la conexión de todos los que estén en el juego (vuelven a la pantalla de entrada). El servidor guarda a cada personaje al salir. Tarda unos 20 segundos.', 'Desconectar a todos', true))) return false;
  toast('Desconectando…');
  const r = await act(() => api('POST', '/players/disconnect', {}));
  await refreshGate();
  if (r) toast(r.done ? (r.connected ? `Desconectados (${r.connected}). Ya puedes editar.` : 'No había nadie conectado.') : 'Aún quedan conexiones. Prueba otra vez en unos segundos.', !r.done);
  return !!r?.done;
}

/** Closes one account's connection (needs the bridge plugin). */
async function disconnectOne(login, who = login) {
  if (!(await confirmBox(`Desconectar a ${who}`, 'Solo se corta la conexión de esta cuenta (vuelve a la pantalla de entrada). El servidor guarda al personaje al salir. Tarda unos 15 segundos.', 'Desconectar', true))) return false;
  toast('Desconectando…');
  const r = await act(() => api('POST', '/players/disconnect', { login }));
  await refreshGate();
  if (r) toast(r.done ? (r.connected ? `${who} desconectado.` : `${who} ya no estaba conectado.`) : 'Sigue conectado. Prueba otra vez en unos segundos.', !r.done);
  return !!r?.done;
}

/** Who is online, with a button per player when the bridge plugin runs. */
async function onlineDialog() {
  const o = await act(() => api('GET', '/players/online'));
  if (!o) return;
  const again = () => { closeDialog(); onlineDialog(); };
  openDialog(h('h3', {}, 'Jugadores conectados'),
    o.bridge ? null : h('p', { class: 'mute' }, 'El plugin de desconexión no está instalado: no se ve quién está conectado y solo se puede desconectar a todos.'),
    o.bridge && !o.players.length ? h('p', { class: 'empty' }, 'No hay nadie conectado.') : null,
    o.players.length ? h('table', {}, h('thead', {}, h('tr', {}, ['Cuenta', 'Personaje', 'Mapa', ''].map(t => h('th', {}, t)))),
      h('tbody', {}, o.players.map(p => h('tr', {}, h('td', {}, p.login), h('td', {}, p.character ?? '-'), h('td', { class: 'mute' }, p.map ? `${p.map} ${p.x},${p.y}` : '-'),
        h('td', { class: 'actions' }, h('button', { class: 'small danger', onclick: async () => { if (await disconnectOne(p.login, p.character ?? p.login)) again(); } }, 'Desconectar')))))) : null,
    h('div', { class: 'actions' }, h('button', { onclick: closeDialog }, 'Cerrar'), h('button', { class: 'danger', onclick: async () => { if (await disconnectAll()) again(); } }, 'Desconectar a todos')));
}

async function refreshGate() {
  try {
    const s = await api('GET', '/status');
    const g = $('#gate');
    g.textContent = s.gate.ok ? 'Servidor vacío: se puede editar' : 'Edición bloqueada: toca para ver quién está';
    g.className = 'pill click ' + (s.gate.ok ? 'ok' : 'bad');
    g.title = s.gate.message;
    g.onclick = onlineDialog;
    g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onlineDialog(); } };
    g.tabIndex = 0;
    g.setAttribute('role', 'button');
  } catch { $('#gate').textContent = 'Sin conexión con la VM'; $('#gate').className = 'pill warn'; }
}
setInterval(() => { if (!$('#app').hidden && !document.hidden) refreshGate(); }, 20_000);

/* ------------------------------------------------------------------- pages */
const PAGES = { accounts, account, characters, audit };
let shown = '';
const setHash = path => { shown = path; location.hash = path; };
function go(path) {
  const [name, ...rest] = path.split('/');
  const page = PAGES[name] ? name : 'accounts';
  setHash(page === name ? path : page);
  for (const b of document.querySelectorAll('#tabs button')) b.classList.toggle('on', b.dataset.tab === (page === 'account' ? 'accounts' : page));
  fill(view, );
  PAGES[page](decodeURIComponent(rest.join('/')));
  scrollTo(0, 0);
}
$('#tabs').addEventListener('click', e => e.target.dataset.tab && go(e.target.dataset.tab));

const head = (title, sub, ...right) => h('div', { class: 'page-head' }, h('div', {}, h('h2', {}, title), sub ? h('p', {}, sub) : null), h('div', { class: 'row' }, ...right));

/* ------------------------------------------------------------ page helpers */
/** A row of tabs over one pane. `items` is [[key, label, build]]; build() returns the pane content. */
function tabset(items, start, onShow) {
  const bar = h('div', { class: 'tabs', role: 'tablist' });
  const pane = h('div', { class: 'pane' });
  const show = key => {
    for (const b of bar.children) { b.classList.toggle('on', b.dataset.t === key); b.setAttribute('aria-selected', String(b.dataset.t === key)); }
    fill(pane, (items.find(i => i[0] === key) ?? items[0])[2]());
    onShow?.(key);
  };
  bar.append(...items.map(([k, label]) => h('button', { 'data-t': k, role: 'tab', onclick: () => show(k) }, label)));
  show(items.some(i => i[0] === start) ? start : items[0][0]);
  return h('div', {}, bar, pane);
}

/** Fields that remember what they started with, so only what changed is saved. */
function formKit(onDirty) {
  const reg = {};
  const read = ({ el, orig }) => (el.type === 'checkbox' ? el.checked : typeof orig === 'number' ? Number(el.value) : el.value);
  function field(key, label, el, orig, hint) {
    reg[key] = { el, orig };
    const box = el.type === 'checkbox' ? h('label', { class: 'f inline' }, el, label) : h('label', { class: 'f' }, label, el, hint ? h('small', {}, hint) : null);
    const upd = () => { box.classList.toggle('dirty', read(reg[key]) !== orig); onDirty(); };
    el.addEventListener('input', upd);
    el.addEventListener('change', upd);
    return box;
  }
  const changes = () => Object.fromEntries(Object.entries(reg).map(([k, r]) => [k, read(r)]).filter(([k, v]) => v !== reg[k].orig));
  return { field, changes };
}

/** A titled group of fields. */
const card = (title, note, ...body) => h('section', { class: 'card' }, h('h4', {}, title), note ? h('p', { class: 'hint' }, note) : null, ...body);
const sticky = (...kids) => h('div', { class: 'savebar sticky' }, ...kids);
const pillFor = s => h('span', { class: 'pill ' + (s === 'banned' ? 'bad' : s === 'gm' ? 'warn' : '') }, STATE_LABEL[s] ?? s);

/* ---------------------------------------------------------------- accounts */
const STATE_LABEL = { normal: 'Normal', gm: 'GM', banned: 'Baneada' };

function accounts() {
  const list = h('div');
  const q = h('input', { type: 'search', placeholder: 'Buscar cuenta...', 'aria-label': 'Buscar cuenta', autocomplete: 'off' });
  let seq = 0;
  async function load() {
    const my = ++seq;
    const rows = await act(() => api('GET', '/accounts?q=' + encodeURIComponent(q.value.trim())));
    if (!rows || my !== seq) return;
    if (!rows.length) return fill(list, h('p', { class: 'empty' }, q.value ? 'Ninguna cuenta se llama así.' : 'Todavía no hay cuentas. Crea la primera arriba.'));
    fill(list, h('table', {},
      h('thead', {}, h('tr', {}, ['Cuenta', 'Estado', 'Personajes', 'Registro', ''].map(t => h('th', {}, t)))),
      h('tbody', {}, rows.map(a => h('tr', {},
        h('td', {}, h('button', { class: 'link mono', onclick: () => go('account/' + a.login) }, a.login)),
        h('td', {}, pillFor(a.stateName)),
        h('td', {}, a.characters),
        h('td', { class: 'mute' }, String(a.registered).slice(0, 10)),
        h('td', { class: 'actions' }, h('button', { class: 'small', onclick: () => go('account/' + a.login) }, 'Abrir')))))));
  }
  const login = h('input', { maxlength: 10, placeholder: '4-10 letras o números', autocomplete: 'off', 'aria-label': 'Login' });
  const pass = h('input', { type: 'password', maxlength: 10, placeholder: '4-10 caracteres', autocomplete: 'new-password', 'aria-label': 'Contraseña' });
  const state = h('select', { 'aria-label': 'Tipo' }, h('option', { value: 'normal' }, 'Jugador'), h('option', { value: 'gm' }, 'GM'));
  q.addEventListener('input', debounce(load, 200));
  view.append(
    head('Cuentas', 'Abre una cuenta para editar sus datos, su baúl, sus clases y su tienda cash.'),
    h('section', { class: 'panel' }, h('h3', {}, 'Crear cuenta'), h('div', { class: 'row' },
      h('label', {}, 'Login', login), h('label', {}, 'Contraseña', pass), h('label', {}, 'Tipo', state),
      h('button', { class: 'primary', onclick: async () => {
        if (await act(() => api('POST', '/accounts', { login: login.value, password: pass.value, state: state.value }), 'Cuenta creada')) { login.value = pass.value = ''; load(); }
      } }, 'Crear cuenta'))),
    h('section', { class: 'panel' }, h('div', { class: 'row' }, h('div', { class: 'suggest' }, q)), list));
  load();
}

let accountTab = 'data';

/** One account: its data, vault, unlocked classes, cash shop storage and characters, each in its own tab. */
async function account(login) {
  if (!login) return go('accounts');
  const a = await act(() => api('GET', '/accounts/' + login));
  if (!a) return go('accounts');
  view.append(
    head(`Cuenta ${a.login}`, `Registrada el ${String(a.registered).slice(0, 10)}`, pillFor(a.stateName), h('button', { onclick: () => go('accounts') }, 'Volver a cuentas')),
    tabset([
      ['data', 'Datos', () => accountData(a)],
      ['vault', 'Baúl', () => h('section', { class: 'panel' }, storagePanel('vault', a.login))],
      ['classes', 'Clases', () => classesPanel(a.login)],
      ['cash', 'Tienda cash', () => cashPanel(a.login)],
      ['chars', 'Personajes', () => accountChars(a.login)],
    ], accountTab, k => { accountTab = k; }));
}

function accountData(a) {
  const login = a.login;
  const dirty = () => { const n = Object.keys(kit.changes()).length; save.disabled = !n; note.textContent = n ? `${n} cambio(s) sin guardar` : 'Sin cambios'; };
  const kit = formKit(dirty);
  const save = h('button', { class: 'primary', disabled: true }, 'Guardar cambios');
  const note = h('span', { class: 'hint' }, 'Sin cambios');
  const nums = (k, label, lo, hi) => (a[k] === undefined ? null : kit.field(k, label, h('input', { type: 'number', min: lo, max: hi, value: a[k] }), a[k]));
  const local = v => (v ? new Date(new Date(v).getTime() - new Date(v).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
  const st = h('select', {}, [['normal', 'Jugador'], ['gm', 'GM (game master)'], ['banned', 'Baneada']].map(([v, t]) => h('option', { value: v }, t)));
  st.value = a.stateName;
  const bigCard = (...x) => h('div', { class: 'cards' }, ...x);
  const body = h('div', {},
    bigCard(
      card('Acceso', 'Quién es y cómo entra.',
        h('div', { class: 'fields' },
          kit.field('login', 'Login', h('input', { value: a.login, maxlength: 10 }), a.login),
          kit.field('email', 'Correo', h('input', { type: 'email', value: a.email ?? '', maxlength: 120 }), a.email ?? ''),
          kit.field('state', 'Estado de la cuenta', st, a.stateName, 'Baneada: no puede entrar al juego.'),
          kit.field('_password', 'Contraseña nueva', h('input', { type: 'password', maxlength: 10, autocomplete: 'new-password', placeholder: 'Vacío = no cambiar' }), ''),
          kit.field('securityCode', 'Código de seguridad', h('input', { inputmode: 'numeric', maxlength: 7, placeholder: a.hasSecurityCode ? 'Ya tiene (escribe otro para cambiarlo)' : 'Sin código' }), ''))),
      card('Monedas y juego', 'Cash shop y preferencias de la cuenta.',
        h('div', { class: 'fields' },
          nums('wcoinC', 'WCoin C (cash)', 0, 2147483647), nums('wcoinP', 'WCoin P (prepago)', 0, 2147483647), nums('goblinPoints', 'Puntos Goblin', 0, 2147483647),
          nums('timeZone', 'Zona horaria (-12 a 14)', -12, 14),
          a.language === undefined ? null : kit.field('language', 'Idioma (en, es, de...)', h('input', { value: a.language, maxlength: 3 }), a.language))),
      card('Baúl y chat', 'Ajustes del almacén y del chat.',
        h('div', { class: 'checks' },
          kit.field('vaultExtended', 'Baúl ampliado (el doble de espacio)', Object.assign(h('input', { type: 'checkbox' }), { checked: a.vaultExtended }), a.vaultExtended),
          a.hasVaultPassword ? kit.field('clearVaultPassword', 'Quitar la clave del baúl (si el jugador la olvidó)', h('input', { type: 'checkbox' }), false) : h('p', { class: 'hint' }, 'El baúl no tiene clave.')),
        a.chatBanUntil === undefined ? null : h('div', { class: 'fields' }, kit.field('chatBanUntil', 'Chat silenciado hasta (vacío = no)', h('input', { type: 'datetime-local', value: local(a.chatBanUntil) }), local(a.chatBanUntil))))),
    card('Zona de peligro', 'Solo se puede borrar una cuenta sin personajes. Se borra también su baúl. Se puede deshacer desde Registro.',
      h('button', { class: 'danger', onclick: async () => {
        if (!(await typedConfirm(`Borrar la cuenta ${login}`, 'Esta acción borra la cuenta y su baúl.', login))) return;
        if (await act(() => api('DELETE', '/accounts/' + login, { confirm: login }), 'Cuenta borrada')) go('accounts');
      } }, 'Borrar cuenta')),
    sticky(save, note));
  save.addEventListener('click', async () => {
    const ch = kit.changes();
    if (ch.state === 'banned' && !(await confirmBox(`¿Banear ${login}?`, 'No podrá entrar al juego hasta que la desbanees.', 'Banear', true))) return;
    const { state, _password, ...patch } = ch;
    if (patch.chatBanUntil !== undefined) patch.chatBanUntil = patch.chatBanUntil ? new Date(patch.chatBanUntil).toISOString() : null;
    if (patch.securityCode === '') delete patch.securityCode;
    let ok = true;
    if (Object.keys(patch).length) ok = !!(await act(() => api('PATCH', '/accounts/' + login, patch)));
    if (ok && _password) ok = !!(await act(() => api('POST', `/accounts/${login}/password`, { password: _password })));
    if (ok && state) ok = !!(await act(() => api('POST', `/accounts/${login}/state`, { state })));
    if (ok) { toast('Cuenta guardada'); fill(view, ); account(patch.login ?? login); if (patch.login) setHash('account/' + patch.login); }
  });
  return body;
}

async function accountChars(login) {
  const box = h('section', { class: 'panel' }, h('h3', {}, 'Personajes de la cuenta'));
  const rows = await act(() => api('GET', '/characters?account=' + encodeURIComponent(login)));
  box.append(rows?.length ? h('div', { class: 'roster' }, rows.map(c => h('button', { class: 'char', onclick: () => go('characters/' + c.name) }, h('div', { class: 'lv' }, c.level), h('div', {}, h('b', {}, c.name), h('span', {}, `${c.class} · ${c.map ?? 'sin mapa'}`))))) : h('p', { class: 'empty' }, 'Esta cuenta no tiene personajes. Se crean en el juego.'));
  return box;
}

/** Base classes this account may create (the ones that need unlocking, like Summoner or Rage Fighter). */
function classesPanel(login) {
  const box = h('section', { class: 'panel' }, h('h3', {}, 'Clases desbloqueadas'), h('p', { class: 'hint' }, 'Marca las clases que esta cuenta puede crear. Las que ya se crean sin desbloqueo no necesitan marca.'));
  (async () => {
    const list = await act(() => api('GET', `/accounts/${login}/classes`));
    if (!list) return;
    const boxes = list.map(k => Object.assign(h('input', { type: 'checkbox' }), { checked: k.unlocked }));
    const save = h('button', { class: 'primary', onclick: async () => {
      const ids = list.filter((_, i) => boxes[i].checked).map(k => k.id);
      if (await act(() => api('POST', `/accounts/${login}/classes`, { classIds: ids }), 'Clases guardadas')) { box.replaceWith(classesPanel(login)); }
    } }, 'Guardar clases');
    box.append(h('div', { class: 'checks grid' }, list.map((k, i) => h('label', { class: 'inline' }, boxes[i], k.name, k.createdByDefault ? h('small', { class: 'mute' }, ' (se crea sin desbloqueo)') : null))), h('div', { class: 'savebar' }, save));
  })();
  return box;
}

/** What the account has bought in the cash shop and not yet taken out. */
function cashPanel(login) {
  const box = h('section', { class: 'panel' }, h('h3', {}, 'Tienda cash: ítems guardados'));
  async function load() {
    const rows = await act(() => api('GET', `/accounts/${login}/cashshop`));
    if (!rows) return;
    const product = h('input', { type: 'number', min: 0, placeholder: 'Número del producto' });
    const price = h('input', { type: 'number', min: 0, value: 0 });
    fill(box, h('h3', {}, 'Tienda cash: ítems guardados'),
      h('p', { class: 'hint' }, 'Son compras o regalos que el jugador aún no recogió. El número del producto es el del catálogo de la tienda del juego.'),
      rows.length ? h('table', {}, h('thead', {}, h('tr', {}, ['Producto', 'Precio', 'Regalo', 'Fecha', ''].map(t => h('th', {}, t)))),
        h('tbody', {}, rows.map(r => h('tr', {}, h('td', {}, r.product), h('td', {}, r.price), h('td', {}, r.gift ? `de ${r.sender || '?'}${r.message ? ': ' + r.message : ''}` : 'No'), h('td', { class: 'mute' }, String(r.addedAt).slice(0, 10)),
          h('td', { class: 'actions' }, h('button', { class: 'small danger', onclick: async () => { if (await confirmBox('¿Quitar este ítem?', 'Se puede deshacer desde Registro.', 'Quitar', true) && (await act(() => api('DELETE', `/accounts/${login}/cashshop/${r.id}`), 'Ítem quitado'))) load(); } }, 'Quitar'))))))
        : h('p', { class: 'empty' }, 'No hay ítems guardados.'),
      h('div', { class: 'row bar' }, h('label', {}, 'Producto', product), h('label', {}, 'Precio', price),
        h('button', { class: 'primary', onclick: async () => { if (await act(() => api('POST', `/accounts/${login}/cashshop`, { product: Number(product.value), price: Number(price.value) }), 'Ítem añadido')) load(); } }, 'Añadir ítem')));
  }
  load();
  return box;
}

/* ------------------------------------------------------------- item looks */
const GROUPS = ['Espadas', 'Hachas', 'Mazas', 'Lanzas', 'Arcos', 'Bastones', 'Escudos', 'Cascos', 'Armaduras', 'Pantalones', 'Guantes', 'Botas', 'Alas y orbes', 'Mascotas y joyas', 'Pociones y jewels', 'Pergaminos'];
// One hue per group: weapons warm, armour cool, wings violet, consumables green.
const HUE = [8, 18, 28, 38, 100, 280, 215, 205, 195, 185, 175, 165, 265, 330, 135, 55];
const tint = g => `hsl(${HUE[g] ?? 220} 55% 50%)`;
// Small item icons (items/<group>_<number>.webp); the list says which exist, the rest show only the name.
const ICONS = new Set();
fetch('items/index.json').then(r => (r.ok ? r.json() : [])).then(l => l.forEach(k => ICONS.add(k))).catch(() => {});
const iconOf = (it, cls = 'ico') => (ICONS.has(`${it.group}_${it.number}`) ? h('img', { class: cls, src: `items/${it.group}_${it.number}.webp`, alt: '', loading: 'lazy', draggable: 'false' }) : null);
const isExc = i => i.options.some(o => /^Excellent/.test(o.type));
const isAnc = i => i.options.some(o => /Ancient/i.test(o.type));
const hasLuck = i => i.options.some(o => /^Luck/.test(o.type));

function optionText(o) {
  if (/^Luck/.test(o.type)) return 'Suerte (+25% éxito en combinar, +5% crítico)';
  if (o.type === 'Option') return `Opción adicional +${o.level * 4}${o.label ? ` (${o.label})` : ''}`;
  if (/^Excellent/.test(o.type)) return o.label ? `Excelente: ${o.label}` : `Excelente ${o.number}`;
  if (/Ancient/i.test(o.type)) return `Ancient${o.label ? ': ' + o.label : ''}`;
  return `${o.type} ${o.number}${o.level ? ` +${o.level}` : ''}${o.label ? ` (${o.label})` : ''}`;
}

function tile(item, onclick, selected) {
  const ic = iconOf(item, 'tile-ico');
  const t = h('button', { class: 'tile' + (ic ? ' has-ico' : '') + (isExc(item) ? ' exc' : '') + (isAnc(item) ? ' anc' : '') + (selected ? ' sel' : ''), title: item.name, onclick },
    ic, h('span', { class: 'nm' }, item.name),
    item.level ? h('span', { class: 'lvl' }, '+' + item.level) : null,
    hasLuck(item) || item.skill ? h('span', { class: 'flags' }, (hasLuck(item) ? 'S' : '') + (item.skill ? ' H' : '')) : null);
  t.style.setProperty('--tint', tint(item.group));
  return t;
}

/* ------------------------------------------------------ item autocomplete */
const rank = (defs, q) => {
  const k = q.toLowerCase();
  return [...defs].sort((a, b) => Number(b.name.toLowerCase().startsWith(k)) - Number(a.name.toLowerCase().startsWith(k)));
};
function marked(text, q) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  return i < 0 || !q ? text : [text.slice(0, i), h('mark', {}, text.slice(i, i + q.length)), text.slice(i + q.length)];
}

/** Item picker: category chips (only what this server has for the class and slot), a search box and a grid with icons. */
function itemPicker(onPick, extra = {}) {
  const slotMode = extra.slot !== undefined && extra.slot !== null;
  const who = () => (extra.character ? '&character=' + encodeURIComponent(extra.character() ?? '') : '');
  const slotQ = slotMode ? '&slot=' + extra.slot : '';
  const need = d => (d.needsEvolve ? ` · requiere ${d.requires}` : '');
  const input = h('input', { placeholder: 'Busca por nombre, o elige una categoría', autocomplete: 'off', 'aria-label': 'Buscar ítem' });
  const chips = h('div', { class: 'chips cats', role: 'group', 'aria-label': 'Categorías' });
  const grid = h('div', { class: 'picks', role: 'listbox' });
  const chosen = h('div', { class: 'chosen', hidden: true });
  const browse = h('div', {}, chips, input, grid);
  let cat = '', found = [], ctl, cats = [];
  function drawChips() {
    const mk = (key, name, n) => h('button', { type: 'button', class: 'chip' + (cat === key ? ' on' : ''), 'aria-pressed': String(cat === key), onclick: () => { cat = key; drawChips(); search(); } }, name, n === undefined ? null : h('small', {}, ` ${n}`));
    fill(chips, mk('', 'Todo'), ...cats.map(c => mk(c.key, c.name, c.count)));
  }
  function draw() {
    fill(grid, ...(found.length ? found.map(d => h('button', { type: 'button', class: 'pick', role: 'option', title: d.name, onmousedown: e => e.preventDefault(), onclick: () => pick(d) },
      iconOf(d, 'pick-ico') ?? h('span', { class: 'pick-ico none' }, '?'), h('span', { class: 'pn' }, marked(d.name, input.value.trim())),
      h('span', { class: 'meta' }, `${d.w}x${d.h}${need(d)}`))) : [h('p', { class: 'meta' }, 'Nada coincide.')]));
  }
  function pick(d) {
    browse.hidden = true; chosen.hidden = false;
    fill(chosen, iconOf(d, 'pick-ico'), h('div', {}, h('strong', {}, d.name), h('div', { class: 'meta' }, `${(cats.find(c => c.key === d.cat) ?? {}).name ?? ''} · ${d.w}x${d.h}${need(d)}`)),
      h('button', { type: 'button', class: 'small', onclick: () => { chosen.hidden = true; browse.hidden = false; onPick(null); input.focus(); } }, 'Cambiar'));
    onPick(d);
  }
  const search = debounce(async () => {
    ctl?.abort(); ctl = new AbortController();
    const q = input.value.trim();
    const r = await act(() => api('GET', '/items/definitions?q=' + encodeURIComponent(q) + (cat ? '&cat=' + cat : '') + slotQ + who(), undefined, ctl.signal));
    if (r) { found = rank(r, q); draw(); }
  }, 120);
  async function refresh() {
    const c = await act(() => api('GET', '/items/categories?' + (slotQ + who()).replace(/^&/, '')));
    cats = c ?? []; if (cat && !cats.some(x => x.key === cat)) cat = '';
    drawChips(); search();
  }
  input.addEventListener('input', search);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && found[0]) { pick(found[0]); e.preventDefault(); } });
  refresh();
  return { el: h('div', { class: 'picker' }, browse, chosen), input, refresh };
}

/* ---------------------------------------------------------- insert dialog */
/** Where: { kind: 'inventory'|'vault', id }. slot null = first free place. */
function insertDialog(where, slot, done) {
  const classOf = { current: where.kind === 'inventory' ? where.id : where.forChar ?? null };
  const isInv = where.kind === 'inventory';
  const worn = isInv && slot !== null && slot < 12;
  const bodySlot = worn ? DOLL.find(([n]) => n === slot)?.[1] : '';
  const dest = worn ? `${where.id}: ${bodySlot.toLowerCase()}` : isInv ? `el inventario de ${where.id}` : `el baúl de ${where.id}`;
  const url = isInv ? `/characters/${where.id}/items` : `/accounts/${where.id}/vault/items`;
  const form = h('div');
  const go = h('button', { class: 'primary', disabled: true }, worn ? 'Equipar' : `Insertar en ${isInv ? 'el inventario' : 'el baúl'}`);
  let def = null;

  async function configure(d) {
    def = d; go.disabled = !d;
    if (!d) return fill(form, );
    const opts = (await act(() => api('GET', '/items/definitions/' + d.id))) ?? [];
    if (def !== d) return;
    const level = h('input', { type: 'number', min: 0, max: d.maxLevel, value: 0 });
    const dur = h('input', { type: 'number', min: 0, max: 255, placeholder: String(d.durability) });
    const luck = h('input', { type: 'checkbox' }), skill = h('input', { type: 'checkbox' });
    const option = h('select', {}, [0, 1, 2, 3, 4].map(n => h('option', { value: n }, n ? `+${n * 4}` : 'Sin opción')));
    const exc = opts.filter(o => /^Excellent/.test(o.type)).map(o => ({ o, on: false }));
    const chips = exc.map(x => h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: e => { x.on = !x.on; e.currentTarget.classList.toggle('on', x.on); e.currentTarget.setAttribute('aria-pressed', String(x.on)); } }, x.o.label ?? `Opción ${x.o.number}`));
    fill(form, h('div', {},
      h('p', { class: 'mute' }, `${GROUPS[d.group] ?? ''} · ocupa ${d.w}x${d.h}`),
      d.needsEvolve ? h('p', {}, h('span', { class: 'pill warn' }, `Requiere ser ${d.requires}: ${where.kind === 'inventory' ? where.id : where.forChar} aún no puede usarlo`)) : null,
      h('div', { class: 'fields' },
        d.maxLevel > 0 ? h('label', {}, `Nivel (0-${d.maxLevel})`, level) : null,
        h('label', {}, 'Durabilidad', dur),
        opts.some(o => o.type === 'Option') ? h('label', {}, 'Opción adicional', option) : null),
      h('div', { class: 'chips' },
        opts.some(o => /^Luck/.test(o.type)) ? h('label', { class: 'inline' }, luck, 'Suerte') : null,
        d.hasSkill ? h('label', { class: 'inline' }, skill, 'Con habilidad') : null),
      exc.length ? h('div', {}, h('p', { class: 'mute' }, 'Opciones excelentes'), h('div', { class: 'chips' }, chips)) : null));
    form._read = () => {
      const body = { definitionId: d.id, level: Number(level.value) };
      if (dur.value) body.durability = Number(dur.value);
      if (luck.checked) body.luck = true;
      if (skill.checked) body.skill = true;
      if (Number(option.value)) body.option = Number(option.value);
      const ex = exc.filter(x => x.on).map(x => x.o.number);
      if (ex.length) body.excellent = ex;
      if (slot !== null) body.slot = slot;
      return body;
    };
  }
  const s = itemPicker(configure, { slot: worn ? slot : null, character: () => classOf.current });
  go.addEventListener('click', async () => {
    if (!def || !form._read) return;
    go.disabled = true;
    if (def.needsEvolve && !(await confirmBox(`${def.name} necesita ${def.requires}`, 'Lo puedes poner igual, pero solo lo podrá usar cuando evolucione a esa clase.', 'Poner igual'))) { go.disabled = false; return; }
    const r = await act(() => api('POST', url, form._read()), `Ítem insertado en ${isInv ? 'el inventario' : 'el baúl'}`);
    go.disabled = false;
    if (r) { closeDialog(); done(); }
  });
  openDialog(
    h('h3', {}, worn ? `Equipar ítem: ${bodySlot}` : `Insertar ítem en ${dest}`),
    h('p', { class: 'mute' }, worn ? `Se equipa directo en la ranura «${bodySlot}». Solo salen los ítems que se pueden llevar ahí.` : slot === null ? 'Va al primer hueco libre.' : `Va a la casilla ${isInv ? slot - 11 : slot + 1}.`),
    where.forChar ? h('label', { class: 'inline' }, Object.assign(h('input', { type: 'checkbox' }), { onchange: e => { classOf.current = e.target.checked ? null : where.forChar; s.refresh(); } }), 'Ver también ítems de otras clases (el baúl es de toda la cuenta)') : null,
    s.el, form,
    h('div', { class: 'actions' }, h('button', { onclick: closeDialog }, 'Cancelar'), go));
  s.input.focus();
}

/* -------------------------------------------------------------- item editor */
/** Edits an item that is already placed. Only the fields that changed are sent; unknown options (ancient, socket) are kept. */
async function editItemDialog(it, done) {
  const opts = (await act(() => api('GET', '/items/definitions/' + it.definitionId))) ?? [];
  const level = h('input', { type: 'number', min: 0, max: it.maxLevel, value: it.level });
  const dur = h('input', { type: 'number', min: 0, max: 255, step: 'any', value: it.durability });
  const luck = h('input', { type: 'checkbox' }); luck.checked = hasLuck(it);
  const skill = h('input', { type: 'checkbox' }); skill.checked = !!it.skill;
  const curOpt = it.options.find(o => o.type === 'Option')?.level ?? 0;
  const option = h('select', {}, [0, 1, 2, 3, 4].map(n => h('option', { value: n }, n ? `+${n * 4}` : 'Sin opción'))); option.value = curOpt;
  const exc = opts.filter(o => /^Excellent/.test(o.type)).map(o => ({ o, on: it.options.some(x => /^Excellent/.test(x.type) && x.number === o.number) }));
  const was = new Set(exc.filter(x => x.on).map(x => x.o.number));
  const chips = exc.map(x => h('button', { type: 'button', class: 'chip' + (x.on ? ' on' : ''), 'aria-pressed': String(x.on), onclick: e => { x.on = !x.on; e.currentTarget.classList.toggle('on', x.on); e.currentTarget.setAttribute('aria-pressed', String(x.on)); } }, x.o.label ?? `Opción ${x.o.number}`));
  const sockets = h('input', { type: 'number', min: 0, max: 5, value: it.socketCount });
  const pet = h('input', { type: 'number', min: 0, value: it.petExperience });
  const canLuck = opts.some(o => /^Luck/.test(o.type));
  openDialog(
    h('h3', {}, `Editar ${it.name}`),
    h('div', { class: 'fields' },
      it.maxLevel > 0 ? h('label', {}, `Nivel (0-${it.maxLevel})`, level) : null,
      h('label', {}, 'Durabilidad', dur),
      opts.some(o => o.type === 'Option') ? h('label', {}, 'Opción adicional', option) : null),
    h('div', { class: 'chips' }, canLuck ? h('label', { class: 'inline' }, luck, 'Suerte') : null, it.canSkill ? h('label', { class: 'inline' }, skill, 'Con habilidad') : null),
    exc.length ? h('div', {}, h('p', { class: 'mute' }, 'Opciones excelentes'), h('div', { class: 'chips' }, chips)) : null,
    h('details', { class: 'adv' }, h('summary', {}, 'Más opciones'),
      h('div', { class: 'fields' }, h('label', {}, 'Ranuras (socket, 0-5)', sockets), it.group === 13 ? h('label', {}, 'Experiencia de mascota', pet) : null),
      h('p', { class: 'hint' }, 'Las opciones ancient, socket y harmony que el ítem ya tenga se conservan.')),
    h('div', { class: 'actions' }, h('button', { onclick: closeDialog }, 'Cancelar'), h('button', {
      class: 'primary', onclick: async () => {
        const body = {};
        if (Number(level.value) !== it.level) body.level = Number(level.value);
        if (Number(dur.value) !== Number(it.durability)) body.durability = Number(dur.value);
        if (canLuck && luck.checked !== hasLuck(it)) body.luck = luck.checked;
        if (it.canSkill && skill.checked !== !!it.skill) body.skill = skill.checked;
        if (Number(option.value) !== curOpt) body.option = Number(option.value);
        const now = exc.filter(x => x.on).map(x => x.o.number);
        if (now.length !== was.size || now.some(n => !was.has(n))) body.excellent = now;
        if (Number(sockets.value) !== it.socketCount) body.socketCount = Number(sockets.value);
        if (it.group === 13 && Number(pet.value) !== it.petExperience) body.petExperience = Number(pet.value);
        if (!Object.keys(body).length) return toast('No cambiaste nada');
        if (await act(() => api('PATCH', '/items/' + it.id, body), 'Ítem guardado')) { closeDialog(); done(); }
      },
    }, 'Guardar ítem')));
}

/* ------------------------------------------------------- inventory / vault */
const DOLL = [[7, 'Alas'], [2, 'Casco'], [8, 'Mascota'], [0, 'Mano izq.'], [3, 'Armadura'], [1, 'Mano der.'], [5, 'Guantes'], [4, 'Pantalón'], [9, 'Collar'], [10, 'Anillo'], [6, 'Botas'], [11, 'Anillo']];

/** The visual storage: kind 'inventory' (equipment + 8x8 bag) or 'vault' (account warehouse). */
function storagePanel(kind, id, forChar) {
  const isInv = kind === 'inventory';
  const box = h('div');
  const where = { kind, id, forChar };
  let data, sel = null, moving = null;
  const stop = e => { if (e.key === 'Escape' && moving) { moving = null; draw(); } };
  addEventListener('keydown', stop);

  async function load() {
    const r = await act(() => api('GET', isInv ? `/characters/${id}/items` : `/accounts/${id}/vault`));
    if (!r) return;
    data = isInv ? { items: r, rows: 8, cols: 8, first: 12, zen: null } : { items: r.items, rows: r.rows, cols: r.cols, first: 0, zen: r.zen };
    draw();
  }

  function grid() {
    const { items, rows, cols, first } = data;
    const g = h('div', { class: 'cells' });
    g.style.gridTemplateColumns = `repeat(${cols}, var(--cell))`;
    g.style.gridTemplateRows = `repeat(${rows}, var(--cell))`;
    for (let i = 0; i < rows * cols; i++) {
      const c = h('button', { class: 'cell', 'aria-label': `Insertar en la casilla ${i + 1}`, title: `Casilla ${i + 1}: insertar aquí`, onclick: () => (moving ? moveTo(first + i) : insertDialog(where, first + i, load)) }, '+');
      c.style.gridColumn = String((i % cols) + 1);
      c.style.gridRow = String(Math.floor(i / cols) + 1);
      g.append(c);
    }
    for (const it of items.filter(x => x.slot >= first)) {
      const i = it.slot - first;
      const t = tile(it, () => { sel = it.id; draw(); }, sel === it.id);
      t.style.gridColumn = `${(i % cols) + 1} / span ${it.w}`;
      t.style.gridRow = `${Math.floor(i / cols) + 1} / span ${it.h}`;
      g.append(t);
    }
    return g;
  }

  function doll() {
    const d = h('div', { class: 'doll' });
    for (const [slot, label] of DOLL) {
      const it = data.items.find(x => x.slot === slot);
      d.append(h('div', { class: 'slot' }, h('i', {}, label), it ? tile(it, () => { sel = it.id; draw(); }, sel === it.id)
        : h('button', { class: 'slot-add', title: `Poner un ítem en: ${label}`, 'aria-label': `Poner un ítem en ${label}`, onclick: () => (moving ? moveTo(slot) : insertDialog(where, slot, load)) }, '+')));
    }
    return d;
  }

  function detail() {
    const it = data.items.find(x => x.id === sel);
    if (!it) return h('div', { class: 'detail panel' }, h('h3', {}, 'Ítem'), h('p', { class: 'hint' }, 'Toca un ítem para ver sus datos. Toca una casilla vacía (+) para insertar uno justo ahí.'),
      isInv ? h('p', { class: 'hint' }, 'Las casillas del cuerpo (cabeza, manos, anillos, alas...) muestran lo que lleva puesto. Toca una vacía (+) para equipar un ítem directo ahí.') : null);
    return h('div', { class: 'detail panel' },
      iconOf(it, 'detail-ico'),
      h('h3', {}, it.name, it.level ? ` +${it.level}` : ''),
      h('p', { class: 'mute' }, `${GROUPS[it.group] ?? ''} · ${it.w}x${it.h} · durabilidad ${it.durability}${it.skill ? ' · con habilidad' : ''}`),
      it.options.length ? h('ul', {}, it.options.map(o => h('li', { class: /^Excellent/.test(o.type) ? 'exc' : /^Luck/.test(o.type) ? 'luck' : '' }, optionText(o)))) : h('p', { class: 'hint' }, 'Sin opciones.'),
      h('div', { class: 'row' },
        h('button', { onclick: () => editItemDialog(it, load) }, 'Editar'),
        h('button', { onclick: () => { moving = it.id; draw(); } }, 'Mover de casilla'),
        isInv ? h('button', { onclick: () => transfer(it, 'vault') }, 'Pasar al baúl') : h('button', { onclick: () => transfer(it, 'inventory') }, 'Pasar a un personaje'),
        h('button', { class: 'danger', onclick: async () => {
          if (!(await confirmBox(`¿Borrar ${it.name}?`, 'Se puede deshacer desde Registro mientras no haya nadie conectado.', 'Borrar', true))) return;
          sel = null;
          if (await act(() => api('DELETE', isInv ? `/characters/${id}/items/${it.id}` : `/accounts/${id}/vault/items/${it.id}`), 'Ítem borrado')) load();
        } }, 'Borrar')));
  }

  async function moveTo(slot) {
    const it = data.items.find(x => x.id === moving);
    moving = null;
    if (it && (await act(() => api('POST', `/items/${it.id}/move`, { slot }), 'Ítem movido'))) load(); else draw();
  }

  async function transfer(it, to) {
    if (to === 'vault') { if (await act(() => api('POST', `/items/${it.id}/move`, { to }), 'Ítem pasado al baúl')) { sel = null; load(); } return; }
    const chars = (await act(() => api('GET', '/characters?account=' + encodeURIComponent(id)))) ?? [];
    if (!chars.length) return toast('Esa cuenta no tiene personajes.', true);
    const pick = h('select', {}, chars.map(c => h('option', { value: c.name }, c.name)));
    openDialog(h('h3', {}, `Pasar ${it.name} a un personaje`), h('label', {}, 'Personaje', pick), h('p', { class: 'hint' }, 'Va al primer hueco libre de su mochila.'),
      h('div', { class: 'actions' }, h('button', { onclick: closeDialog }, 'Cancelar'), h('button', { class: 'primary', onclick: async () => {
        if (await act(() => api('POST', `/items/${it.id}/move`, { to: 'inventory', character: pick.value }), `Ítem pasado a ${pick.value}`)) { closeDialog(); sel = null; load(); }
      } }, 'Pasar')));
  }

  function draw() {
    const bar = h('div', { class: 'row bar' },
      h('button', { class: 'primary', onclick: () => insertDialog(where, null, load) }, isInv ? 'Insertar ítem en el inventario' : 'Insertar ítem en el baúl'),
      h('span', { class: 'mute' }, `${data.items.filter(x => x.slot >= data.first).length} ítems ${isInv ? 'en la mochila' : 'en el baúl'}`));
    let zenRow = null;
    if (!isInv) {
      const zen = h('input', { type: 'number', min: 0, max: 2147483647, value: data.zen });
      zenRow = h('div', { class: 'row' }, h('label', {}, 'Zen del baúl', zen), h('button', { onclick: async () => { if (await act(() => api('PATCH', `/accounts/${id}/vault`, { zen: Number(zen.value) }), 'Zen del baúl guardado')) load(); } }, 'Guardar zen'));
    }
    const banner = moving ? h('p', { class: 'banner' }, 'Toca la casilla vacía de destino (sirve también una ranura del cuerpo). Esc cancela.') : null;
    fill(box, ...[bar, banner, zenRow, h('div', { class: 'bench' }, ...[isInv ? doll() : null, grid(), detail()].filter(Boolean))].filter(Boolean));
  }
  load();
  return box;
}

/* ------------------------------------------------------------------ skills */
// What kind of skill it is, from the server data: label, glyph and colour class.
const skillKind = (t, d) => (t === 20 ? ['Pasiva', '◆', 'pas'] : t === 30 ? ['Invocación', '♜', 'sum'] : t === 40 ? ['Apoyo', '✚', 'sup']
  : d === 1 ? ['Magia', '✦', 'mag'] : d === 2 ? ['Maldición', '☠', 'cur'] : d === 4 ? ['Fenrir', '✧', 'mag'] : d === -1 ? ['Efecto', '●', 'sup'] : ['Ataque físico', '⚔', 'phy']);
const glyph = (t, d) => { const [label, g, c] = skillKind(t, d); return h('span', { class: 'glyph g-' + c, title: label }, g); };

function skillsPanel(name) {
  const box = h('div');
  let term = '';
  async function load() {
    const [list, av] = await Promise.all([act(() => api('GET', `/characters/${name}/skills`)), act(() => api('GET', `/characters/${name}/skills/available`))]);
    if (!list || !av) return;
    const meta = new Map(av.skills.map(s => [s.id, s]));
    const add = async (id, label, level = 0) => (await act(() => api('POST', `/characters/${name}/skills`, { skillId: id, level }), `${label} añadida`)) && load();

    const learned = h('section', { class: 'panel' }, h('h3', {}, `Habilidades aprendidas (${list.length})`),
      list.length
        ? h('table', {}, h('thead', {}, h('tr', {}, ['Habilidad', 'N.º', 'Nivel', ''].map(t => h('th', {}, t)))),
          h('tbody', {}, list.map(e => {
            const l = h('input', { type: 'number', min: 0, max: 255, value: e.level, 'aria-label': `Nivel de ${e.name}` });
            const m = meta.get(e.skillId);
            return h('tr', {}, h('td', {}, m ? glyph(m.skillType, m.damageType) : h('span', { class: 'glyph' }, '•'), ' ', e.name), h('td', { class: 'mute' }, e.number), h('td', {}, l),
              h('td', { class: 'actions' },
                h('button', { class: 'small', onclick: async () => { if (await act(() => api('PATCH', `/characters/${name}/skills/${e.id}`, { level: Number(l.value) }), 'Nivel guardado')) load(); } }, 'Guardar nivel'),
                h('button', { class: 'small danger', onclick: async () => { if (await confirmBox(`¿Quitar ${e.name}?`, 'Se puede deshacer desde Registro.', 'Quitar', true) && (await act(() => api('DELETE', `/characters/${name}/skills/${e.id}`), 'Habilidad quitada'))) load(); } }, 'Quitar')));
          })))
        : h('p', { class: 'empty' }, 'Este personaje no tiene habilidades aprendidas.'));

    const q = h('input', { type: 'search', placeholder: 'Filtrar por nombre...', 'aria-label': 'Filtrar habilidades', value: term });
    const grid = h('div', { class: 'skill-grid' });
    const draw = () => {
      term = q.value;
      const rows = av.skills.filter(s => s.name.toLowerCase().includes(term.trim().toLowerCase()));
      fill(grid, ...(rows.length ? rows.map(s => {
        const [label] = skillKind(s.skillType, s.damageType);
        return h('div', { class: 'skill-card' + (s.has ? ' has' : '') + (s.needsEvolve ? ' locked' : '') },
          glyph(s.skillType, s.damageType),
          h('div', { class: 'sk-main' }, h('b', {}, s.name), h('span', { class: 'mute' }, `${label} · n.º ${s.number}`),
            s.needsEvolve ? h('span', { class: 'pill warn' }, `Requiere ${s.requires}`) : null),
          s.has ? h('span', { class: 'mute' }, 'La tiene') : h('button', { class: 'small', onclick: async () => {
            if (s.needsEvolve && !(await confirmBox(`${s.name} necesita ${s.requires}`, `${name} es ${av.current}. Puedes dársela ya, pero solo la podrá usar cuando evolucione a ${s.requires}.`, 'Añadir igual'))) return;
            add(s.id, s.name);
          } }, 'Añadir'));
      }) : [h('p', { class: 'empty' }, 'Nada coincide.')]));
    };
    q.addEventListener('input', draw);
    draw();

    fill(box, 
      learned,
      h('section', { class: 'panel' }, h('h3', {}, 'Habilidades de su clase'),
        h('div', { class: 'chain' }, av.chain.map((c, i) => [i ? h('span', { class: 'arrow' }, '→') : null, h('span', { class: 'chip' + (c === av.current ? ' on' : '') }, c)])),
        h('p', { class: 'hint' }, 'Solo salen las habilidades que puede usar su clase y sus evoluciones. Las marcadas con "Requiere" son de una evolución que todavía no tiene. Los iconos: ⚔ físico, ✦ magia, ☠ maldición, ✚ apoyo, ♜ invocación, ◆ pasiva.'),
        h('div', { class: 'row bar' }, h('div', { class: 'suggest' }, q)), grid));
  }
  load();
  return box;
}

/* ------------------------------------------------------------------ quests */
function questsPanel(name) {
  const box = h('div');
  async function load() {
    const d = await act(() => api('GET', `/characters/${name}/quests`));
    if (!d) return;
    const groups = new Map();
    for (const q of d.quests) { if (!groups.has(q.group)) groups.set(q.group, []); groups.get(q.group).push(q); }
    const state = new Map(d.states.map(s => [s.group, s]));
    const cards = [...groups].map(([g, qs]) => {
      const st = state.get(g);
      const tag = q => (q.needsEvolve ? ` · requiere ${q.class}` : q.tooLow ? ` · desde el nivel ${q.minLevel}` : q.class ? ` (${q.class})` : '');
      const opts = () => [h('option', { value: '' }, 'Ninguna'), ...qs.map(q => h('option', { value: q.id }, `${q.name}${tag(q)}`))];
      const locked = qs.filter(q => q.needsEvolve);
      const lf = h('select', {}, opts()), ac = h('select', {}, opts());
      lf.value = st?.lastFinished ?? ''; ac.value = st?.active ?? '';
      return h('section', { class: 'card' },
        h('h4', {}, `Grupo ${g}`, ' ', h('span', { class: 'pill ' + (st ? 'ok' : '') }, st ? 'Con progreso' : 'Sin empezar'), locked.length === qs.length ? h('span', { class: 'pill warn' }, `Requiere ${locked[0].class}`) : null),
        h('p', { class: 'hint' }, `${qs.length} misión(es) de este grupo.${locked.length && locked.length < qs.length ? ` ${locked.length} necesitan una evolución que aún no tiene.` : ''}`),
        h('div', { class: 'fields' }, h('label', {}, 'Última terminada', lf), h('label', {}, 'Activa ahora', ac)),
        h('div', { class: 'row' },
          h('button', { class: 'small primary', onclick: async () => {
            const pickedLocked = qs.find(q => q.needsEvolve && (q.id === lf.value || q.id === ac.value));
            if (pickedLocked && !(await confirmBox(`${pickedLocked.name} es de ${pickedLocked.class}`, `${name} aún no tiene esa evolución. Se guarda igual, pero el juego puede no mostrarla hasta que evolucione.`, 'Guardar igual'))) return;
            if (await act(() => api('POST', `/characters/${name}/quests/${g}`, { lastFinished: lf.value || null, active: ac.value || null }), 'Misión guardada')) load(); } }, 'Guardar'),
          st ? h('button', { class: 'small danger', onclick: async () => { if (await confirmBox(`¿Reiniciar el grupo ${g}?`, 'Empieza esas misiones de nuevo. Se puede deshacer desde Registro.', 'Reiniciar', true) && (await act(() => api('DELETE', `/characters/${name}/quests/${g}`), 'Grupo reiniciado'))) load(); } }, 'Reiniciar') : null));
    });
    fill(box, 
      h('section', { class: 'panel' }, h('div', { class: 'row bar' },
        h('div', {}, h('h3', {}, 'Misiones'), h('p', { class: 'hint' }, 'Solo salen las misiones de su clase (y sus evoluciones) y las generales, por grupo. Elige cuál terminó por última vez y cuál tiene activa.')),
        d.states.length ? h('button', { class: 'danger', onclick: async () => { if (await confirmBox('¿Reiniciar todas las misiones?', 'Pierde todo su progreso de misiones. Se puede deshacer desde Registro.', 'Reiniciar todo', true) && (await act(() => api('DELETE', `/characters/${name}/quests`), 'Misiones reiniciadas'))) load(); } }, 'Reiniciar todas') : null),
        cards.length ? h('div', { class: 'cards' }, cards) : h('p', { class: 'empty' }, 'No hay misiones definidas para esta clase.')));
  }
  load();
  return box;
}

/* ------------------------------------------------------------------ letters */
function lettersPanel(name) {
  const box = h('div');
  async function load() {
    const rows = await act(() => api('GET', `/characters/${name}/letters`));
    if (!rows) return;
    const sender = h('input', { value: 'Admin', maxlength: 10 });
    const subject = h('input', { maxlength: 32, placeholder: 'Asunto' });
    const message = h('textarea', { rows: 4, maxlength: 1000, placeholder: 'Mensaje' });
    fill(box, 
      h('section', { class: 'panel' }, h('h3', {}, 'Enviar una carta'),
        h('div', { class: 'fields' }, h('label', {}, 'Remitente', sender), h('label', { class: 'wide' }, 'Asunto', subject)),
        h('label', {}, 'Mensaje', message),
        h('div', { class: 'savebar' }, h('button', { class: 'primary', onclick: async () => {
          if (await act(() => api('POST', `/characters/${name}/letters`, { sender: sender.value, subject: subject.value, message: message.value }), 'Carta enviada')) load();
        } }, 'Enviar carta'), h('span', { class: 'hint' }, 'Le llega en el buzón del juego la próxima vez que entre.'))),
      h('section', { class: 'panel' }, h('h3', {}, `Buzón (${rows.length})`),
        rows.length ? h('div', { class: 'letters' }, rows.map(r => h('article', { class: 'letter' + (r.read ? '' : ' unread') },
          h('div', { class: 'row' }, h('b', {}, r.subject), h('span', { class: 'mute' }, `de ${r.sender} · ${String(r.date).slice(0, 16).replace('T', ' ')}${r.read ? '' : ' · sin leer'}`),
            h('button', { class: 'small danger', onclick: async () => { if (await confirmBox('¿Borrar la carta?', 'Se puede deshacer desde Registro.', 'Borrar', true) && (await act(() => api('DELETE', `/characters/${name}/letters/${r.id}`), 'Carta borrada'))) load(); } }, 'Borrar')),
          h('p', {}, r.message ?? '')))) : h('p', { class: 'empty' }, 'El buzón está vacío.')));
  }
  load();
  return box;
}

/* --------------------------------------------------------------------- Gens */
function gensPanel(name) {
  const box = h('section', { class: 'panel' });
  async function load() {
    const g = await act(() => api('GET', `/characters/${name}/gens`));
    if (!g) return;
    const fam = h('select', {}, [[1, 'Duprian'], [2, 'Vanert']].map(([v, t]) => h('option', { value: v }, t)));
    fam.value = String(g.gens || 1);
    const con = h('input', { type: 'number', min: 0, value: g.contribution });
    const rank = h('input', { type: 'number', min: 0, max: 255, value: g.rank });
    const pos = h('input', { type: 'number', min: 0, value: g.rankingPosition });
    fill(box, h('h3', {}, 'Gens'),
      h('p', { class: 'hint' }, g.gens ? `Es de la familia ${g.family}.` : 'No pertenece a ninguna familia Gens. Al guardar, entra a la que elijas.'),
      h('div', { class: 'fields' }, h('label', {}, 'Familia', fam), h('label', {}, 'Contribución', con), h('label', {}, 'Rango', rank), h('label', {}, 'Posición en el ranking', pos)),
      h('div', { class: 'savebar' },
        h('button', { class: 'primary', onclick: async () => { if (await act(() => api('POST', `/characters/${name}/gens`, { gens: Number(fam.value), contribution: Number(con.value), rank: Number(rank.value), rankingPosition: Number(pos.value) }), g.gens ? 'Gens guardado' : 'Ahora está en Gens')) load(); } }, g.gens ? 'Guardar' : 'Unir a Gens'),
        g.gens ? h('button', { class: 'danger', onclick: async () => { if (await confirmBox('¿Sacarlo de Gens?', 'Pierde su familia, contribución y rango. Se puede deshacer desde Registro.', 'Sacar de Gens', true) && (await act(() => api('DELETE', `/characters/${name}/gens`), 'Ya no está en Gens'))) load(); } }, 'Sacar de Gens') : null));
  }
  load();
  return box;
}

/* -------------------------------------------------------------- characters */
let charTab = 'sheet';

function characters(selected) {
  const roster = h('div', { class: 'roster' });
  const sheet = h('div', {});
  const q = h('input', { type: 'search', placeholder: 'Nombre o cuenta...', 'aria-label': 'Buscar personaje', autocomplete: 'off' });
  let seq = 0, current = selected || null;

  async function load() {
    const my = ++seq;
    const term = q.value.trim();
    const [byName, byAcc] = await Promise.all([
      act(() => api('GET', '/characters?q=' + encodeURIComponent(term))),
      term ? act(() => api('GET', '/characters?account=' + encodeURIComponent(term))) : [],
    ]);
    if (!byName || my !== seq) return;
    const seen = new Set();
    const rows = [...byName, ...(byAcc ?? [])].filter(c => !seen.has(c.id) && seen.add(c.id));
    if (!rows.length) return fill(roster, h('p', { class: 'empty' }, term ? 'Ningún personaje coincide.' : 'Todavía no hay personajes.'));
    fill(roster, ...rows.map(c => h('button', { class: 'char' + (c.name === current ? ' on' : ''), onclick: () => open(c.name) },
      h('div', { class: 'lv' }, c.level),
      h('div', {}, h('b', {}, c.name), h('span', {}, `${c.class} · ${c.account}`)))));
  }

  async function open(name) {
    current = name;
    setHash('characters/' + encodeURIComponent(name));
    for (const b of roster.children) b.classList.toggle('on', b.querySelector('b')?.textContent === name);
    const [c, maps, classes] = await Promise.all([act(() => api('GET', '/characters/' + name)), act(() => api('GET', '/maps')), act(() => api('GET', '/classes'))]);
    if (!c) return;

    const dirty = () => { const n = Object.keys(kit.changes()).length; save.disabled = !n; note.textContent = n ? `${n} cambio(s) sin guardar` : 'Sin cambios'; };
    const kit = formKit(dirty);
    const save = h('button', { class: 'primary', disabled: true }, 'Guardar cambios');
    const note = h('span', { class: 'hint' }, 'Sin cambios');
    const has = k => c[k] !== undefined && c[k] !== null;
    const num = (k, label, max, hint) => (has(k) ? kit.field(k, label, h('input', { type: 'number', min: k === 'level' ? 1 : 0, max, value: c[k] }), Number(c[k]), hint) : null);
    const pick = (list, value) => { const s = h('select', {}, list.map(o => h('option', { value: o.id }, o.name))); s.value = value; return s; };
    const fixed = (pairs, value) => { const s = h('select', {}, pairs.map(([v, t]) => h('option', { value: v }, t))); s.value = String(value); return s; };

    // The class line (e.g. Dark Wizard -> Soul Master -> Grand Master): tap a step to evolve or go back.
    const classSel = h('select', {});
    const inLine = new Set();
    {
      const all = classes ?? [];
      const byId0 = new Map(all.map(k => [k.id, k]));
      let r0 = c.classId;
      for (let i = 0; i < 10; i++) { const prev = all.find(k => k.next === r0); if (!prev) break; r0 = prev.id; }
      for (let cur = r0; cur && inLine.size < 10; cur = byId0.get(cur)?.next ?? null) inLine.add(cur);
      const opt = k => h('option', { value: k.id }, k.name);
      classSel.append(...all.filter(k => inLine.has(k.id)).sort((a, b) => [...inLine].indexOf(a.id) - [...inLine].indexOf(b.id)).map(opt),
        h('optgroup', { label: 'Otras clases (cambia de línea)' }, ...all.filter(k => !inLine.has(k.id)).map(opt)));
      classSel.value = c.classId;
    }
    const byId = new Map((classes ?? []).map(k => [k.id, k]));
    let root = c.classId;
    for (let i = 0; i < 10; i++) { const prev = (classes ?? []).find(k => k.next === root); if (!prev) break; root = prev.id; }
    const line = [];
    for (let cur = root; cur && line.length < 10; cur = byId.get(cur)?.next ?? null) line.push(byId.get(cur));
    const chips = line.filter(Boolean).map(k => h('button', { type: 'button', class: 'chip', 'data-id': k.id, onclick: () => { classSel.value = k.id; classSel.dispatchEvent(new Event('change')); } }, k.name));
    const paintChips = () => { for (const b of chips) b.classList.toggle('on', b.dataset.id === classSel.value); };
    classSel.addEventListener('change', paintChips);
    paintChips();

    const sheetTab = () => h('div', {},
      h('div', { class: 'cards' },
        card('Progreso', 'Cambiar el nivel ajusta la experiencia para que coincida.', h('div', { class: 'fields' }, num('level', 'Nivel', 400), num('zen', 'Zen', 2147483647), num('levelUpPoints', 'Puntos libres', 1000000), num('experience', 'Experiencia', 9e15))),
        card('Atributos', null, h('div', { class: 'fields' }, num('strength', 'Fuerza', 32767), num('agility', 'Agilidad', 32767), num('vitality', 'Vitalidad', 32767), num('energy', 'Energía', 32767), num('leadership', 'Mando', 32767))),
        card('Clase y evolución', 'Toca un paso de la línea de la clase para evolucionarlo (o devolverlo). Cambia solo la clase: no toca puntos, habilidades ni ítems.',
          h('div', { class: 'chain' }, chips.map((b, i) => [i ? h('span', { class: 'arrow' }, '→') : null, b])),
          h('div', { class: 'fields' }, kit.field('classId', 'Clase', classSel, c.classId))),
        card('Master y resets', 'Para clases Master y servidores con resets.', h('div', { class: 'fields' }, num('masterLevel', 'Nivel Master', 1000), num('masterPoints', 'Puntos de Master', 1000000), num('masterExperience', 'Experiencia Master', 9e15), num('resets', 'Resets', 1000000))),
        card('Ubicación', 'Dónde aparece cuando entra. Sirve para rescatar a alguien atascado.', h('div', { class: 'fields' }, kit.field('mapId', 'Mapa', pick(maps ?? [], c.mapId), c.mapId), num('x', 'Posición X', 255), num('y', 'Posición Y', 255))),
        card('Estado y PK', 'Marca de héroe o asesino y estado del personaje.', h('div', { class: 'fields' },
          has('status') ? kit.field('status', 'Estado del personaje', fixed([[0, 'Normal'], [1, 'Baneado'], [32, 'Game master']], c.status), c.status) : null,
          has('heroState') ? kit.field('heroState', 'Marca de héroe o PK', fixed([[0, 'Nuevo'], [1, 'Héroe'], [2, 'Héroe leve'], [3, 'Normal'], [4, 'Aviso de PK'], [5, 'PK nivel 1'], [6, 'PK nivel 2']], c.heroState), c.heroState) : null,
          num('heroSeconds', 'Segundos que le quedan a la marca', 2147483647), num('pk', 'Muertes de jugadores (PK)', 1000000))),
        card('Otros', 'Nombre, frutas e inventario.', h('div', { class: 'fields' }, kit.field('name', 'Nombre', h('input', { value: c.name, maxlength: 10 }), c.name),
          num('fruitPoints', 'Puntos de fruta usados', 100000), num('negFruitPoints', 'Puntos de fruta negativa usados', 100000), num('inventoryExtensions', 'Ampliaciones de inventario', 4)))),
      card('Zona de peligro', 'Se borran sus stats, habilidades, inventario e ítems. Se puede deshacer desde Registro mientras no haya nadie conectado.',
        h('button', { class: 'danger', onclick: async () => {
          if (!(await typedConfirm(`Borrar a ${name}`, 'Esta acción borra al personaje completo.', name))) return;
          if (await act(() => api('DELETE', '/characters/' + name, { confirm: name }), 'Personaje borrado')) { current = null; fill(sheet, h('p', { class: 'empty' }, 'Personaje borrado. Elige otro de la lista.')); load(); }
        } }, 'Borrar personaje')),
      sticky(save, note));

    save.addEventListener('click', async () => {
      const body = kit.changes();
      if (body.classId && !(await confirmBox('¿Cambiar la clase?', 'Cambia solo la clase: no toca sus puntos, habilidades ni ítems.', 'Cambiar clase'))) return;
      if (await act(() => api('PATCH', '/characters/' + name, body), 'Personaje guardado')) { await open(body.name ?? name); load(); }
    });

    const online = await act(() => api('GET', '/players/online'));
    const isOn = online?.players.some(p => p.login.toLowerCase() === c.account.toLowerCase());
    fill(sheet, 
      isOn ? h('div', { class: 'online-bar' }, h('span', { class: 'pill bad' }, 'Conectado ahora'), h('span', { class: 'mute' }, 'No se puede editar a este jugador mientras esté dentro del juego.'),
        h('button', { class: 'small danger', onclick: async () => { if (await disconnectOne(c.account, c.name)) { await open(name); load(); } } }, 'Desconectar a este jugador')) : null,
      h('div', { class: 'sheet-head' },
        h('div', {}, h('h2', {}, c.name), h('div', { class: 'facts' }, h('span', {}, `${c.class} · nivel ${c.level}`), h('span', {}, 'Cuenta ', h('button', { class: 'link', onclick: () => go('account/' + c.account) }, c.account)), h('span', {}, c.map ?? 'sin mapa')))),
      tabset([
        ['sheet', 'Ficha', sheetTab],
        ['inventory', 'Inventario', () => h('section', { class: 'panel' }, storagePanel('inventory', name))],
        ['vault', 'Baúl', () => h('section', { class: 'panel' }, h('p', { class: 'hint' }, `Es el baúl de la cuenta ${c.account}: lo comparten todos sus personajes.`), storagePanel('vault', c.account, name))],
        ['skills', 'Habilidades', () => skillsPanel(name)],
        ['quests', 'Misiones', () => questsPanel(name)],
        ['letters', 'Cartas', () => lettersPanel(name)],
        ['gens', 'Gens', () => gensPanel(name)],
      ], charTab, k => { charTab = k; }));
  }

  q.addEventListener('input', debounce(load, 200));
  view.append(head('Personajes', 'Elige uno de la lista. Su ficha, inventario, habilidades, misiones, cartas y Gens están en pestañas.'),
    h('div', { class: 'split' }, h('div', {}, h('div', { class: 'suggest' }, q), roster), sheet));
  load();
  if (selected) open(selected);
  else sheet.append(h('p', { class: 'empty' }, 'Elige un personaje de la lista.'));
}

/* ------------------------------------------------------------------- audit */
async function audit() {
  const [log, undos] = await Promise.all([act(() => api('GET', '/audit?limit=100')), act(() => api('GET', '/undo'))]);
  if (!log) return;
  const can = new Set((undos ?? []).filter(u => u.undoable).map(u => u.id));
  view.append(head('Registro de cambios', 'Deshacer devuelve las filas a como estaban antes del cambio. Exige el servidor vacío; si el jugador jugó después, perdería ese progreso.'),
    h('section', { class: 'panel' }, log.length ? h('table', {}, h('thead', {}, h('tr', {}, ['Fecha', 'Admin', 'Acción', 'Objetivo', 'Detalle', ''].map(t => h('th', {}, t)))),
      h('tbody', {}, log.map(a => h('tr', {},
        h('td', { class: 'mute' }, a.at.replace('T', ' ').slice(0, 19)), h('td', {}, a.admin), h('td', { class: 'mono' }, a.action), h('td', { class: 'mono' }, a.target),
        h('td', { class: 'mono mute' }, a.detail ? JSON.stringify(a.detail) : ''),
        h('td', { class: 'actions' }, can.has(a.id) ? h('button', { class: 'small', onclick: async () => {
          if (!(await confirmBox('¿Deshacer este cambio?', `${a.action} en ${a.target}`, 'Deshacer'))) return;
          if (await act(() => api('POST', '/undo/' + a.id), 'Cambio deshecho')) { fill(view, ); audit(); }
        } }, 'Deshacer') : null))))) : h('p', { class: 'empty' }, 'Aún no hay cambios registrados.')));
}

/* ------------------------------------------------------------------- start */
addEventListener('hashchange', () => { if (!$('#app').hidden && location.hash.slice(1) !== shown) go(location.hash.slice(1)); });
fetch('/api/me').then(r => (r.ok ? r.json() : null)).then(d => (d ? enter(d.user) : showLogin()));
