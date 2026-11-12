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
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
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
  try { const r = await fn(); if (ok) toast(ok); return r; } catch (e) { if (e.name !== 'AbortError') { toast(e.message, true); refreshGate(); } }
}

/* ----------------------------------------------------------------- dialogs */
const dlg = $('#dlg');
function openDialog(...content) { dlg.replaceChildren(h('div', { class: 'dlg' }, ...content)); if (!dlg.open) dlg.showModal(); }
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

async function refreshGate() {
  try {
    const s = await api('GET', '/status');
    const g = $('#gate');
    g.textContent = s.gate.ok ? 'Servidor vacío: se puede editar' : 'Edición bloqueada';
    g.className = 'pill ' + (s.gate.ok ? 'ok' : 'bad');
    g.title = s.gate.message;
  } catch { $('#gate').textContent = 'Sin conexión con la VM'; $('#gate').className = 'pill warn'; }
}
setInterval(() => { if (!$('#app').hidden && !document.hidden) refreshGate(); }, 20_000);

/* ------------------------------------------------------------------- pages */
const PAGES = { accounts, characters, audit, vault };
let shown = '';
const setHash = path => { shown = path; location.hash = path; };
function go(path) {
  const [name, ...rest] = path.split('/');
  const page = PAGES[name] ? name : 'accounts';
  setHash(page === name ? path : page);
  for (const b of document.querySelectorAll('#tabs button')) b.classList.toggle('on', b.dataset.tab === (page === 'vault' ? 'accounts' : page));
  view.replaceChildren();
  PAGES[page](decodeURIComponent(rest.join('/')));
  scrollTo(0, 0);
}
$('#tabs').addEventListener('click', e => e.target.dataset.tab && go(e.target.dataset.tab));

const head = (title, sub, ...right) => h('div', { class: 'page-head' }, h('div', {}, h('h2', {}, title), sub ? h('p', {}, sub) : null), h('div', { class: 'row' }, ...right));

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
    if (!rows.length) return list.replaceChildren(h('p', { class: 'empty' }, q.value ? 'Ninguna cuenta se llama así.' : 'Todavía no hay cuentas. Crea la primera arriba.'));
    list.replaceChildren(h('table', {},
      h('thead', {}, h('tr', {}, ['Cuenta', 'Estado', 'Personajes', 'Registro', ''].map(t => h('th', {}, t)))),
      h('tbody', {}, rows.map(a => h('tr', {},
        h('td', { class: 'mono' }, a.login),
        h('td', {}, h('span', { class: 'pill ' + (a.stateName === 'banned' ? 'bad' : a.stateName === 'gm' ? 'warn' : '') }, STATE_LABEL[a.stateName] ?? a.stateName)),
        h('td', {}, a.characters),
        h('td', { class: 'mute' }, String(a.registered).slice(0, 10)),
        h('td', { class: 'actions' },
          h('button', { class: 'small', onclick: () => go('vault/' + a.login) }, 'Baúl'),
          h('button', { class: 'small', onclick: () => changePassword(a.login) }, 'Contraseña'),
          a.stateName === 'banned'
            ? h('button', { class: 'small', onclick: () => setState(a.login, 'normal', 'Cuenta desbaneada') }, 'Desbanear')
            : h('button', { class: 'small danger', onclick: async () => (await confirmBox(`¿Banear ${a.login}?`, 'No podrá entrar al juego hasta que la desbanees.', 'Banear', true)) && setState(a.login, 'banned', 'Cuenta baneada') }, 'Banear'),
          a.stateName === 'gm' ? h('button', { class: 'small', onclick: () => setState(a.login, 'normal', 'Ya no es GM') }, 'Quitar GM') : a.stateName === 'normal' ? h('button', { class: 'small', onclick: () => setState(a.login, 'gm', 'Ahora es GM') }, 'Hacer GM') : null,
          h('button', { class: 'small', title: 'Correo, código de seguridad y clave del baúl', onclick: () => advancedAccount(a.login) }, 'Avanzado')))))));
  }
  async function setState(login, state, ok) { if (await act(() => api('POST', `/accounts/${login}/state`, { state }), ok)) load(); }
  function changePassword(login) {
    const p = h('input', { type: 'password', maxlength: 10, autocomplete: 'new-password', placeholder: '4 a 10 caracteres' });
    openDialog(h('h3', {}, `Nueva contraseña de ${login}`), h('label', {}, 'Contraseña', p), h('p', { class: 'hint' }, 'Sin espacios.'),
      h('div', { class: 'actions' }, h('button', { onclick: closeDialog }, 'Cancelar'), h('button', {
        class: 'primary', onclick: async () => { if (await act(() => api('POST', `/accounts/${login}/password`, { password: p.value }), 'Contraseña cambiada')) closeDialog(); },
      }, 'Guardar')));
    p.focus();
  }
  async function advancedAccount(login) {
    const a = await act(() => api('GET', '/accounts/' + login));
    if (!a) return;
    const email = h('input', { type: 'email', value: a.email ?? '', maxlength: 120 });
    const code = h('input', { inputmode: 'numeric', maxlength: 7, placeholder: a.hasSecurityCode ? 'Ya tiene (escribe otro para cambiarlo)' : 'Sin código' });
    const ext = h('input', { type: 'checkbox' }); ext.checked = a.vaultExtended;
    const clear = h('input', { type: 'checkbox' });
    openDialog(h('h3', {}, `Avanzado: ${login}`),
      h('p', { class: 'mute' }, 'Cosas que casi nunca hacen falta. Se guardan solo los campos que cambies.'),
      h('label', {}, 'Correo', email),
      h('label', {}, 'Código de seguridad (hasta 7 números)', code),
      h('label', { class: 'inline' }, ext, 'Baúl ampliado (el doble de espacio)'),
      a.hasVaultPassword ? h('label', { class: 'inline' }, clear, 'Quitar la clave del baúl (si el jugador la olvidó)') : h('p', { class: 'hint' }, 'El baúl no tiene clave.'),
      h('div', { class: 'actions' }, h('button', { onclick: closeDialog }, 'Cancelar'), h('button', {
        class: 'primary', onclick: async () => {
          const body = {};
          if (email.value !== (a.email ?? '')) body.email = email.value;
          if (code.value) body.securityCode = code.value;
          if (ext.checked !== a.vaultExtended) body.vaultExtended = ext.checked;
          if (clear.checked) body.clearVaultPassword = true;
          if (!Object.keys(body).length) return toast('No cambiaste nada');
          if (await act(() => api('PATCH', '/accounts/' + login, body), 'Cuenta guardada')) closeDialog();
        },
      }, 'Guardar')));
  }

  const login = h('input', { maxlength: 10, placeholder: '4-10 letras o números', autocomplete: 'off', 'aria-label': 'Login' });
  const pass = h('input', { type: 'password', maxlength: 10, placeholder: '4-10 caracteres', autocomplete: 'new-password', 'aria-label': 'Contraseña' });
  const state = h('select', { 'aria-label': 'Tipo' }, h('option', { value: 'normal' }, 'Jugador'), h('option', { value: 'gm' }, 'GM'));
  q.addEventListener('input', debounce(load, 200));
  view.append(
    head('Cuentas', 'Crea cuentas y cuida las que ya existen.'),
    h('section', { class: 'panel' }, h('h3', {}, 'Crear cuenta'), h('div', { class: 'row' },
      h('label', {}, 'Login', login), h('label', {}, 'Contraseña', pass), h('label', {}, 'Tipo', state),
      h('button', { class: 'primary', onclick: async () => {
        if (await act(() => api('POST', '/accounts', { login: login.value, password: pass.value, state: state.value }), 'Cuenta creada')) { login.value = pass.value = ''; load(); }
      } }, 'Crear cuenta'))),
    h('section', { class: 'panel' }, h('div', { class: 'row' }, h('div', { class: 'suggest' }, q)), list));
  load();
}

/* ------------------------------------------------------------- item looks */
const GROUPS = ['Espadas', 'Hachas', 'Mazas', 'Lanzas', 'Arcos', 'Bastones', 'Escudos', 'Cascos', 'Armaduras', 'Pantalones', 'Guantes', 'Botas', 'Alas y orbes', 'Mascotas y joyas', 'Pociones y jewels', 'Pergaminos'];
// One hue per group: weapons warm, armour cool, wings violet, consumables green.
const HUE = [8, 18, 28, 38, 100, 280, 215, 205, 195, 185, 175, 165, 265, 330, 135, 55];
const tint = g => `hsl(${HUE[g] ?? 220} 55% 50%)`;
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
  const t = h('button', { class: 'tile' + (isExc(item) ? ' exc' : '') + (isAnc(item) ? ' anc' : '') + (selected ? ' sel' : ''), title: item.name, onclick },
    h('span', { class: 'nm' }, item.name),
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

/** A text box that suggests items from the first letter, keyboard friendly. */
function suggest(onPick) {
  const input = h('input', { placeholder: 'Escribe el nombre del ítem (Sword, Wing, Jewel...)', autocomplete: 'off', role: 'combobox', 'aria-expanded': 'false', 'aria-label': 'Buscar ítem' });
  const list = h('ul', { class: 'sug-list', role: 'listbox', hidden: true });
  let found = [], on = -1, ctl;
  function draw() {
    const q = input.value.trim();
    list.hidden = !found.length && q === '';
    input.setAttribute('aria-expanded', String(!list.hidden));
    list.replaceChildren(...(found.length ? found.map((d, i) => h('li', {
      class: i === on ? 'on' : '', role: 'option',
      onmousedown: e => { e.preventDefault(); pick(d); },
    }, h('span', {}, marked(d.name, q)), h('span', { class: 'meta' }, `${GROUPS[d.group] ?? 'Grupo ' + d.group} · ${d.w}x${d.h}`))) : [h('li', { class: 'meta' }, 'Ningún ítem coincide.')]));
  }
  function pick(d) { input.value = d.name; list.hidden = true; found = []; onPick(d); }
  const search = debounce(async () => {
    const q = input.value.trim();
    ctl?.abort();
    if (!q) { found = []; return draw(); }
    ctl = new AbortController();
    const r = await act(() => api('GET', '/items/definitions?q=' + encodeURIComponent(q), undefined, ctl.signal));
    if (!r) return;
    found = rank(r, q).slice(0, 14); on = found.length ? 0 : -1; draw();
  }, 120);
  input.addEventListener('input', () => { onPick(null); search(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' && found.length) { on = (on + 1) % found.length; draw(); e.preventDefault(); }
    else if (e.key === 'ArrowUp' && found.length) { on = (on - 1 + found.length) % found.length; draw(); e.preventDefault(); }
    else if (e.key === 'Enter' && found[on]) { pick(found[on]); e.preventDefault(); }
    else if (e.key === 'Escape' && !list.hidden) { list.hidden = true; e.stopPropagation(); e.preventDefault(); }
  });
  input.addEventListener('blur', () => setTimeout(() => { list.hidden = true; }, 120));
  return { el: h('div', { class: 'suggest' }, input, list), input };
}

/* ---------------------------------------------------------- insert dialog */
/** Where: { kind: 'inventory'|'vault', id }. slot null = first free place. */
function insertDialog(where, slot, done) {
  const isInv = where.kind === 'inventory';
  const dest = isInv ? `el inventario de ${where.id}` : `el baúl de ${where.id}`;
  const url = isInv ? `/characters/${where.id}/items` : `/accounts/${where.id}/vault/items`;
  const form = h('div');
  const go = h('button', { class: 'primary', disabled: true }, `Insertar en ${isInv ? 'el inventario' : 'el baúl'}`);
  let def = null;

  async function configure(d) {
    def = d; go.disabled = !d;
    if (!d) return form.replaceChildren();
    const opts = (await act(() => api('GET', '/items/definitions/' + d.id))) ?? [];
    if (def !== d) return;
    const level = h('input', { type: 'number', min: 0, max: d.maxLevel, value: 0 });
    const dur = h('input', { type: 'number', min: 0, max: 255, placeholder: String(d.durability) });
    const luck = h('input', { type: 'checkbox' }), skill = h('input', { type: 'checkbox' });
    const option = h('select', {}, [0, 1, 2, 3, 4].map(n => h('option', { value: n }, n ? `+${n * 4}` : 'Sin opción')));
    const exc = opts.filter(o => /^Excellent/.test(o.type)).map(o => ({ o, on: false }));
    const chips = exc.map(x => h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: e => { x.on = !x.on; e.currentTarget.classList.toggle('on', x.on); e.currentTarget.setAttribute('aria-pressed', String(x.on)); } }, x.o.label ?? `Opción ${x.o.number}`));
    form.replaceChildren(
      h('p', { class: 'mute' }, `${GROUPS[d.group] ?? ''} · ocupa ${d.w}x${d.h}`),
      h('div', { class: 'fields' },
        d.maxLevel > 0 ? h('label', {}, `Nivel (0-${d.maxLevel})`, level) : null,
        h('label', {}, 'Durabilidad', dur),
        opts.some(o => o.type === 'Option') ? h('label', {}, 'Opción adicional', option) : null),
      h('div', { class: 'chips' },
        opts.some(o => /^Luck/.test(o.type)) ? h('label', { class: 'inline' }, luck, 'Suerte') : null,
        d.hasSkill ? h('label', { class: 'inline' }, skill, 'Con habilidad') : null),
      exc.length ? h('div', {}, h('p', { class: 'mute' }, 'Opciones excelentes'), h('div', { class: 'chips' }, chips)) : null);
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
  const s = suggest(configure);
  go.addEventListener('click', async () => {
    if (!def || !form._read) return;
    go.disabled = true;
    const r = await act(() => api('POST', url, form._read()), `Ítem insertado en ${isInv ? 'el inventario' : 'el baúl'}`);
    go.disabled = false;
    if (r) { closeDialog(); done(); }
  });
  openDialog(
    h('h3', {}, `Insertar ítem en ${dest}`),
    h('p', { class: 'mute' }, slot === null ? 'Va al primer hueco libre.' : `Va a la casilla ${isInv ? slot - 11 : slot + 1}.`),
    s.el, form,
    h('div', { class: 'actions' }, h('button', { onclick: closeDialog }, 'Cancelar'), go));
  s.input.focus();
}

/* ------------------------------------------------------- inventory / vault */
const DOLL = [[7, 'Alas'], [2, 'Casco'], [8, 'Mascota'], [0, 'Mano izq.'], [3, 'Armadura'], [1, 'Mano der.'], [5, 'Guantes'], [4, 'Pantalón'], [9, 'Collar'], [10, 'Anillo'], [6, 'Botas'], [11, 'Anillo']];

/** The visual storage: kind 'inventory' (equipment + 8x8 bag) or 'vault' (account warehouse). */
function storagePanel(kind, id) {
  const isInv = kind === 'inventory';
  const box = h('div');
  const where = { kind, id };
  let data, sel = null;

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
      const c = h('button', { class: 'cell', 'aria-label': `Insertar en la casilla ${i + 1}`, title: `Casilla ${i + 1}: insertar aquí`, onclick: () => insertDialog(where, first + i, load) }, '+');
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
      d.append(h('div', { class: 'slot' }, h('i', {}, label), it ? tile(it, () => { sel = it.id; draw(); }, sel === it.id) : null));
    }
    return d;
  }

  function detail() {
    const it = data.items.find(x => x.id === sel);
    if (!it) return h('div', { class: 'detail panel' }, h('h3', {}, 'Ítem'), h('p', { class: 'hint' }, 'Toca un ítem para ver sus datos. Toca una casilla vacía (+) para insertar uno justo ahí.'),
      isInv ? h('p', { class: 'hint' }, 'Las casillas de equipo muestran lo que el personaje lleva puesto. Para equipar algo nuevo, insértalo en la mochila y póntelo en el juego.') : null);
    return h('div', { class: 'detail panel' },
      h('h3', {}, it.name, it.level ? ` +${it.level}` : ''),
      h('p', { class: 'mute' }, `${GROUPS[it.group] ?? ''} · ${it.w}x${it.h} · durabilidad ${it.durability}${it.skill ? ' · con habilidad' : ''}`),
      it.options.length ? h('ul', {}, it.options.map(o => h('li', { class: /^Excellent/.test(o.type) ? 'exc' : /^Luck/.test(o.type) ? 'luck' : '' }, optionText(o)))) : h('p', { class: 'hint' }, 'Sin opciones.'),
      h('button', { class: 'danger', onclick: async () => {
        if (!(await confirmBox(`¿Borrar ${it.name}?`, 'Se puede deshacer desde Registro mientras no haya nadie conectado.', 'Borrar', true))) return;
        sel = null;
        if (await act(() => api('DELETE', isInv ? `/characters/${id}/items/${it.id}` : `/accounts/${id}/vault/items/${it.id}`), 'Ítem borrado')) load();
      } }, 'Borrar ítem'));
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
    box.replaceChildren(...[bar, zenRow, h('div', { class: 'bench' }, ...[isInv ? doll() : null, grid(), detail()].filter(Boolean))].filter(Boolean));
  }
  load();
  return box;
}

/* ------------------------------------------------------------- vault page */
function vault(login) {
  if (!login) return go('accounts');
  view.append(head(`Baúl de ${login}`, 'El almacén de la cuenta: lo comparten todos sus personajes.', h('button', { onclick: () => go('accounts') }, 'Volver a cuentas')), h('section', { class: 'panel' }, storagePanel('vault', login)));
}

/* -------------------------------------------------------------- characters */
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
    if (!rows.length) return roster.replaceChildren(h('p', { class: 'empty' }, term ? 'Ningún personaje coincide.' : 'Todavía no hay personajes.'));
    roster.replaceChildren(...rows.map(c => h('button', { class: 'char' + (c.name === current ? ' on' : ''), onclick: () => open(c.name) },
      h('div', { class: 'lv' }, c.level),
      h('div', {}, h('b', {}, c.name), h('span', {}, `${c.class} · ${c.account}`)))));
  }

  async function open(name) {
    current = name;
    setHash('characters/' + encodeURIComponent(name));
    for (const b of roster.children) b.classList.toggle('on', b.querySelector('b')?.textContent === name);
    const c = await act(() => api('GET', '/characters/' + name));
    if (!c) return;
    const f = {};
    const wrap = [];
    const stat = (key, label, max) => {
      if (c[key] === null) return null;
      const el = h('input', { type: 'number', min: key === 'level' ? 1 : 0, max, value: c[key], 'aria-label': label });
      f[key] = el;
      const box = h('label', { class: 'stat' }, label, el);
      el.addEventListener('input', () => { box.classList.toggle('dirty', Number(el.value) !== c[key]); save.disabled = !Object.values(f).some(x => Number(x.value) !== c[x.dataset.k]); });
      el.dataset.k = key; wrap.push(box);
      return box;
    };
    const save = h('button', { class: 'primary', disabled: true, onclick: async () => {
      const body = {};
      for (const [k, el] of Object.entries(f)) if (Number(el.value) !== c[k]) body[k] = Number(el.value);
      if (await act(() => api('PATCH', '/characters/' + name, body), 'Personaje guardado')) { open(name); load(); }
    } }, 'Guardar cambios');

    // Advanced: rarely needed, hidden until opened.
    const maps = (await act(() => api('GET', '/maps'))) ?? [];
    const adv = {};
    const advField = (key, label, node) => { adv[key] = node; return h('label', {}, label, node); };
    const mapSel = h('select', {}, maps.map(m => h('option', { value: m.id }, m.name))); mapSel.value = c.mapId;
    const advSave = h('button', { onclick: async () => {
      const body = {};
      if (mapSel.value !== c.mapId) body.mapId = mapSel.value;
      for (const [k, el] of Object.entries(adv)) if (el !== mapSel && Number(el.value) !== c[k === 'masterPoints' ? 'masterPoints' : k]) body[k] = Number(el.value);
      if (!Object.keys(body).length) return toast('No cambiaste nada');
      if (await act(() => api('PATCH', '/characters/' + name, body), 'Cambios avanzados guardados')) { open(name); load(); }
    } }, 'Guardar avanzado');
    adv.mapId = mapSel;
    const numIn = (v, max) => h('input', { type: 'number', min: 0, max, value: v });

    const tabs = h('div', { class: 'tabs', role: 'tablist' });
    const pane = h('div');
    const show = which => {
      for (const b of tabs.children) b.classList.toggle('on', b.dataset.t === which);
      pane.replaceChildren(storagePanel(which, which === 'inventory' ? name : c.account));
    };
    tabs.append(h('button', { 'data-t': 'inventory', role: 'tab', onclick: () => show('inventory') }, 'Inventario'), h('button', { 'data-t': 'vault', role: 'tab', onclick: () => show('vault') }, `Baúl de ${c.account}`));

    sheet.replaceChildren(
      h('div', { class: 'sheet-head' },
        h('div', {}, h('h2', {}, c.name), h('div', { class: 'facts' }, h('span', {}, c.class), h('span', {}, `Cuenta ${c.account}`), h('span', {}, c.map ?? 'sin mapa')))),
      h('section', { class: 'panel' },
        h('div', { class: 'stats' }, stat('level', 'Nivel', 400), stat('zen', 'Zen', 2147483647), stat('levelUpPoints', 'Puntos libres', 1000000),
          stat('strength', 'Fuerza', 32767), stat('agility', 'Agilidad', 32767), stat('vitality', 'Vitalidad', 32767), stat('energy', 'Energía', 32767), stat('leadership', 'Mando', 32767)),
        h('div', { class: 'savebar' }, save, h('span', { class: 'hint' }, 'Solo se guarda lo que cambies. Cambiar el nivel ajusta la experiencia. Todo se puede deshacer en Registro.')),
        h('details', { class: 'adv' }, h('summary', {}, 'Opciones avanzadas'),
          h('p', { class: 'hint' }, 'Sirven para casos raros, como rescatar a un personaje atascado o limpiar una marca de asesino.'),
          h('div', { class: 'fields' },
            advField('mapId', 'Mapa', mapSel),
            advField('x', 'Posición X', numIn(c.x, 255)), advField('y', 'Posición Y', numIn(c.y, 255)),
            advField('pk', 'Muertes de jugadores (PK)', numIn(c.pk, 1000000)),
            advField('masterPoints', 'Puntos de Master', numIn(c.masterPoints, 1000000))),
          h('div', { class: 'savebar' }, advSave))),
      h('section', { class: 'panel' }, tabs, pane));
    show('inventory');
  }

  q.addEventListener('input', debounce(load, 200));
  view.append(head('Personajes', 'Elige uno para ver y editar su ficha, su inventario y el baúl de su cuenta.'),
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
          if (await act(() => api('POST', '/undo/' + a.id), 'Cambio deshecho')) { view.replaceChildren(); audit(); }
        } }, 'Deshacer') : null))))) : h('p', { class: 'empty' }, 'Aún no hay cambios registrados.')));
}

/* ------------------------------------------------------------------- start */
addEventListener('hashchange', () => { if (!$('#app').hidden && location.hash.slice(1) !== shown) go(location.hash.slice(1)); });
fetch('/api/me').then(r => (r.ok ? r.json() : null)).then(d => (d ? enter(d.user) : showLogin()));
