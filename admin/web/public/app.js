// Admin page: plain JS, no build. Every call goes through /api/mu (the Vercel function that holds the key).
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
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}

function toast(msg, bad = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show' + (bad ? ' bad' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ''), bad ? 6000 : 2800);
}

async function api(method, path, body) {
  const r = await fetch('/api/mu?p=' + encodeURIComponent(path), {
    method,
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
  try { const r = await fn(); if (ok) toast(ok); return r; } catch (e) { toast(e.message, true); refreshGate(); }
}

/* ---------------------------------------------------------------- session */
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

async function refreshGate() {
  try {
    const s = await api('GET', '/status');
    const g = $('#gate');
    g.textContent = s.gate.ok ? 'Servidor vacío: se puede editar' : 'Edición bloqueada';
    g.className = 'pill ' + (s.gate.ok ? 'ok' : 'bad');
    g.title = s.gate.message;
  } catch { $('#gate').textContent = 'Sin conexión con la VM'; $('#gate').className = 'pill warn'; }
}

/* ------------------------------------------------------------------- tabs */
const TABS = { accounts, characters, audit };
function go(name) {
  if (!TABS[name]) name = 'accounts';
  location.hash = name;
  for (const b of document.querySelectorAll('#tabs button')) b.classList.toggle('on', b.dataset.tab === name);
  view.replaceChildren();
  TABS[name]();
}
$('#tabs').addEventListener('click', e => e.target.dataset.tab && go(e.target.dataset.tab));

/* --------------------------------------------------------------- accounts */
const STATE_LABEL = { normal: 'Normal', gm: 'GM', banned: 'Baneada' };

function accounts() {
  const list = h('div');
  const q = h('input', { placeholder: 'Buscar login', onkeydown: e => e.key === 'Enter' && load() });
  async function load() {
    const rows = await act(() => api('GET', '/accounts?q=' + encodeURIComponent(q.value)));
    if (!rows) return;
    list.replaceChildren(h('table', {},
      h('thead', {}, h('tr', {}, ['Login', 'Estado', 'Personajes', 'Registro', ''].map(t => h('th', {}, t)))),
      h('tbody', {}, rows.map(a => h('tr', {},
        h('td', { class: 'mono' }, a.login),
        h('td', {}, h('span', { class: 'pill ' + (a.stateName === 'banned' ? 'bad' : a.stateName === 'gm' ? 'warn' : '') }, STATE_LABEL[a.stateName] ?? a.stateName)),
        h('td', {}, a.characters),
        h('td', { class: 'mute' }, String(a.registered).slice(0, 10)),
        h('td', { class: 'actions' },
          h('button', { onclick: () => changePassword(a.login) }, 'Contraseña'),
          a.stateName === 'banned'
            ? h('button', { onclick: () => setState(a.login, 'normal', 'Cuenta desbaneada') }, 'Desbanear')
            : h('button', { class: 'danger', onclick: () => confirm(`¿Banear ${a.login}?`) && setState(a.login, 'banned', 'Cuenta baneada') }, 'Banear'),
          a.stateName === 'gm' ? h('button', { onclick: () => setState(a.login, 'normal', 'Ya no es GM') }, 'Quitar GM') : a.stateName === 'normal' ? h('button', { onclick: () => setState(a.login, 'gm', 'Ahora es GM') }, 'Hacer GM') : null))))));
  }
  async function setState(login, state, ok) { if (await act(() => api('POST', `/accounts/${login}/state`, { state }), ok)) load(); }
  async function changePassword(login) {
    const p = prompt(`Nueva contraseña para ${login} (4 a 10 caracteres, sin espacios):`);
    if (p) await act(() => api('POST', `/accounts/${login}/password`, { password: p }), 'Contraseña cambiada');
  }
  const login = h('input', { name: 'login', placeholder: '4-10 letras o números', maxlength: 10, autocomplete: 'off' });
  const pass = h('input', { name: 'password', type: 'password', placeholder: '4-10 caracteres', maxlength: 10, autocomplete: 'new-password' });
  const state = h('select', {}, h('option', { value: 'normal' }, 'Normal'), h('option', { value: 'gm' }, 'GM'));
  view.append(
    h('div', { class: 'card' }, h('h2', {}, 'Crear cuenta'), h('div', { class: 'row' },
      h('label', {}, 'Login', login), h('label', {}, 'Contraseña', pass), h('label', {}, 'Tipo', state),
      h('button', { class: 'primary', onclick: async () => { if (await act(() => api('POST', '/accounts', { login: login.value, password: pass.value, state: state.value }), 'Cuenta creada')) { login.value = pass.value = ''; load(); } } }, 'Crear'))),
    h('div', { class: 'card' }, h('h2', {}, 'Cuentas'), h('div', { class: 'row' }, h('label', {}, 'Buscar', q), h('button', { onclick: load }, 'Buscar')), list));
  load();
}

/* ------------------------------------------------------------- characters */
function characters() {
  const list = h('div');
  const detail = h('div');
  const q = h('input', { placeholder: 'Nombre', onkeydown: e => e.key === 'Enter' && load() });
  const acc = h('input', { placeholder: 'Login exacto (opcional)', onkeydown: e => e.key === 'Enter' && load() });
  async function load() {
    const rows = await act(() => api('GET', `/characters?q=${encodeURIComponent(q.value)}&account=${encodeURIComponent(acc.value)}`));
    if (!rows) return;
    list.replaceChildren(h('table', {},
      h('thead', {}, h('tr', {}, ['Nombre', 'Cuenta', 'Clase', 'Nivel', 'Mapa', 'Zen'].map(t => h('th', {}, t)))),
      h('tbody', {}, rows.map(c => h('tr', { class: 'pick', onclick: () => open(c.name) },
        h('td', { class: 'mono' }, c.name), h('td', {}, c.account), h('td', {}, c.class), h('td', {}, c.level), h('td', {}, c.map), h('td', {}, Number(c.zen ?? 0).toLocaleString('es'))))))); 
  }
  async function open(name) {
    const c = await act(() => api('GET', '/characters/' + name));
    if (!c) return;
    const f = {};
    const field = (key, label, max) => (c[key] === null ? null : h('label', {}, label, (f[key] = h('input', { type: 'number', min: 0, max, value: c[key] }))));
    detail.replaceChildren(h('div', { class: 'card' },
      h('h2', {}, `${c.name} `, h('span', { class: 'mute' }, `${c.class} - ${c.account}`)),
      h('div', { class: 'grid' }, field('level', 'Nivel (1-400)', 400), field('zen', 'Zen', 2147483647), field('levelUpPoints', 'Puntos libres', 1000000),
        field('strength', 'Fuerza', 32767), field('agility', 'Agilidad', 32767), field('vitality', 'Vitalidad', 32767), field('energy', 'Energía', 32767), field('leadership', 'Mando', 32767)),
      h('p', { class: 'mute' }, 'Solo se guardan los campos que cambies. Cambiar el nivel ajusta la experiencia. Todo se puede deshacer desde Registro.'),
      h('button', { class: 'primary', onclick: async () => {
        const body = {};
        for (const [k, el] of Object.entries(f)) if (el && Number(el.value) !== c[k]) body[k] = Number(el.value);
        if (!Object.keys(body).length) return toast('No cambiaste nada');
        if (await act(() => api('PATCH', '/characters/' + name, body), 'Personaje guardado')) open(name);
      } }, 'Guardar')),
      itemsCard(name));
  }
  view.append(h('div', { class: 'card' }, h('h2', {}, 'Personajes'), h('div', { class: 'row' }, h('label', {}, 'Nombre', q), h('label', {}, 'Cuenta', acc), h('button', { onclick: load }, 'Buscar')), list), detail);
  load();
}

/* ------------------------------------------------------------------ items */
function itemsCard(name) {
  const box = h('div', { class: 'card' }, h('h2', {}, 'Inventario'));
  const table = h('div');
  const adder = h('div');
  async function load() {
    const items = await act(() => api('GET', `/characters/${name}/items`));
    if (!items) return;
    table.replaceChildren(h('table', {},
      h('thead', {}, h('tr', {}, ['Casilla', 'Ítem', 'Nivel', 'Dur.', 'Opciones', ''].map(t => h('th', {}, t)))),
      h('tbody', {}, items.map(i => h('tr', {},
        h('td', { class: 'mono' }, i.slot), h('td', {}, i.name, i.skill ? ' (habilidad)' : ''), h('td', {}, i.level), h('td', {}, i.durability),
        h('td', { class: 'opts' }, i.options.map(o => `${o.type.replace(/ Option$/, '')} ${o.number}${o.level ? ` +${o.level}` : ''}${o.label ? ` (${o.label})` : ''}`).join('; ')),
        h('td', { class: 'actions' }, h('button', { class: 'danger', onclick: async () => confirm(`¿Borrar ${i.name}?`) && (await act(() => api('DELETE', `/characters/${name}/items/${i.id}`), 'Ítem borrado')) && load() }, 'Borrar')))))));
  }
  const search = h('input', { placeholder: 'Buscar ítem (ej. Sword, Wing)', onkeydown: e => e.key === 'Enter' && find() });
  const results = h('div');
  async function find() {
    const defs = await act(() => api('GET', '/items/definitions?q=' + encodeURIComponent(search.value)));
    if (!defs) return;
    results.replaceChildren(h('table', {}, h('tbody', {}, defs.map(d => h('tr', { class: 'pick', onclick: () => configure(d) },
      h('td', {}, d.name), h('td', { class: 'mute' }, `grupo ${d.group} n.º ${d.number}`), h('td', { class: 'mute' }, `${d.w}x${d.h}`))))));
  }
  async function configure(d) {
    const opts = await act(() => api('GET', '/items/definitions/' + d.id)) ?? [];
    const level = h('input', { type: 'number', min: 0, max: d.maxLevel, value: 0 });
    const dur = h('input', { type: 'number', min: 0, max: 255, placeholder: String(d.durability) });
    const luck = h('input', { type: 'checkbox' }), skill = h('input', { type: 'checkbox' });
    const option = h('select', {}, [0, 1, 2, 3, 4].map(n => h('option', { value: n }, n ? `+${n}` : 'sin opción')));
    const exc = opts.filter(o => /^Excellent/.test(o.type)).map(o => ({ o, el: h('input', { type: 'checkbox' }) }));
    adder.replaceChildren(h('div', { class: 'card' }, h('h3', {}, `Insertar: ${d.name}`),
      h('div', { class: 'grid' }, h('label', {}, `Nivel (0-${d.maxLevel})`, level), h('label', {}, 'Durabilidad', dur),
        opts.some(o => /^Luck/.test(o.type)) ? h('label', { class: 'checks' }, luck, 'Suerte') : null,
        d.hasSkill ? h('label', { class: 'checks' }, skill, 'Con habilidad') : null,
        opts.some(o => o.type === 'Option') ? h('label', {}, 'Opción adicional', option) : null),
      exc.length ? h('div', {}, h('h3', {}, 'Opciones excelentes'), h('div', { class: 'checks' }, exc.map(({ o, el }) => h('label', {}, el, o.label ?? `Opción ${o.number}`)))) : null,
      h('p', {}, h('button', { class: 'primary', onclick: async () => {
        const body = { definitionId: d.id, level: Number(level.value) };
        if (dur.value) body.durability = Number(dur.value);
        if (luck.checked) body.luck = true;
        if (skill.checked) body.skill = true;
        if (Number(option.value)) body.option = Number(option.value);
        const ex = exc.filter(x => x.el.checked).map(x => x.o.number);
        if (ex.length) body.excellent = ex;
        const r = await act(() => api('POST', `/characters/${name}/items`, body), 'Ítem insertado');
        if (r) { adder.replaceChildren(); load(); }
      } }, 'Insertar en el inventario'))));
  }
  box.append(table, h('h3', {}, 'Insertar ítem'), h('div', { class: 'row' }, search, h('button', { onclick: find }, 'Buscar')), results, adder);
  load();
  return box;
}

/* ------------------------------------------------------------------ audit */
async function audit() {
  const [log, undos] = await Promise.all([act(() => api('GET', '/audit?limit=100')), act(() => api('GET', '/undo'))]);
  if (!log) return;
  const can = new Set((undos ?? []).filter(u => u.undoable).map(u => u.id));
  view.append(h('div', { class: 'card' }, h('h2', {}, 'Registro de cambios'),
    h('p', { class: 'mute' }, 'Deshacer devuelve las filas a como estaban antes del cambio; también exige el servidor vacío. Si el jugador jugó después, perdería ese progreso.'),
    h('table', {}, h('thead', {}, h('tr', {}, ['Fecha', 'Admin', 'Acción', 'Objetivo', 'Detalle', ''].map(t => h('th', {}, t)))),
      h('tbody', {}, log.map(a => h('tr', {},
        h('td', { class: 'mute' }, a.at.replace('T', ' ').slice(0, 19)), h('td', {}, a.admin), h('td', { class: 'mono' }, a.action), h('td', { class: 'mono' }, a.target),
        h('td', { class: 'opts' }, a.detail ? JSON.stringify(a.detail) : ''),
        h('td', { class: 'actions' }, can.has(a.id) ? h('button', { onclick: async () => confirm('¿Deshacer este cambio?') && (await act(() => api('POST', '/undo/' + a.id), 'Cambio deshecho')) && (view.replaceChildren(), audit()) }, 'Deshacer') : null)))))));
}

/* ------------------------------------------------------------------ start */
fetch('/api/me').then(r => (r.ok ? r.json() : null)).then(d => (d ? enter(d.user) : showLogin()));
