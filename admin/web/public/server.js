// The "Servidor" page. Every tab opens with a summary of how the server is now, and while you edit, each number
// shows "now -> new (+/-)" next to it, so you see what a change does before you save it.
// Page helpers come from app.js (`k`). OpenMU reads this configuration when it starts, so saved changes wait for a restart.
const TILE = 3;
const SAVED = 'Guardado. Se aplica al reiniciar el servidor.';
const nf = new Intl.NumberFormat('es', { maximumFractionDigits: 2 });

export function serverPage(k) {
  const { h, fill, act, api, openDialog, closeDialog, confirmBox, head, tabset, view, insertDialog, tile, toast, debounce } = k;

  /* ----------------------------------------------------------- formats */
  const f = {
    num: v => nf.format(v), x: v => `x${nf.format(v)}`, pct: v => `${nf.format(Math.round(v * 10000) / 100)}%`, s: v => `${nf.format(v)} s`,
    yes: v => (v ? 'Sí' : 'No'), txt: v => String(v),
  };
  const pp = v => `${nf.format(Math.round(v * 10000) / 100)}%`;
const sign = (a, b, fmt = f.num) => `${b > a ? '+' : '−'}${fmt(Math.abs(b - a))}`;
  const deltaEl = (a, b, fmt) => h('i', { class: 'd ' + (b > a ? 'up' : 'down') }, sign(a, b, fmt));

  /* ----------------------------------------------------------- stat tiles */
  /** A number with its label. `draft(x)` shows the value you are about to save next to the current one. */
  function stat(label, now, o = {}) {
    const fmt = o.fmt ?? f.num;
    const v = h('div', { class: 'v' }, fmt(now)), to = h('div', { class: 'to', hidden: true }), hint = h('div', { class: 'h' }, o.hint ?? '');
    const el = h('div', { class: 'stat' + (o.wide ? ' wide' : '') }, h('div', { class: 'l' }, label), v, to, hint);
    return {
      el,
      draft(x) {
        const on = x !== undefined && x !== now;
        el.classList.toggle('chg', on); to.hidden = !on;
        if (on) fill(to, '→ ', h('b', {}, fmt(x)), typeof x === 'number' && typeof now === 'number' ? deltaEl(now, x, o.dfmt) : null);
      },
      hint: t => fill(hint, t),
      now,
    };
  }
  const strip = (...tiles) => h('div', { class: 'summary' }, tiles.flat().map(t => t.el));

  /* ----------------------------------------------------------- draft forms */
  /** Fields that remember their starting value and show "now -> new (+/-)" while they differ. */
  function draftKit(onChange) {
    const reg = new Map();
    function bind(key, label, el, orig, o = {}) {
      const fmt = o.fmt ?? f.num;
      const chip = h('span', { class: 'chg', hidden: true });
      const read = () => (el.type === 'checkbox' ? el.checked : typeof orig === 'number' ? (el.value === '' ? NaN : Number(el.value)) : el.value);
      const entry = { key, label, el, orig, fmt, read, chip };
      const upd = () => {
        const v = read(), on = v !== orig && !Number.isNaN(v);
        entry.on = on; chip.hidden = !on; chip.parentElement?.classList.toggle('dirty', on);
        if (on) fill(chip, h('s', {}, fmt(orig)), ' → ', h('b', {}, fmt(v)), typeof v === 'number' && typeof orig === 'number' ? deltaEl(orig, v, o.dfmt) : null);
        onChange?.(key, on ? v : undefined);
      };
      entry.upd = upd;
      el.addEventListener('input', upd); el.addEventListener('change', upd);
      reg.set(key, entry);
      return chip;
    }
    function field(key, label, el, orig, o = {}) {
      const chip = bind(key, label, el, orig, o);
      return el.type === 'checkbox' ? h('label', { class: 'f inline' }, el, label, chip) : h('label', { class: 'f' }, h('span', { class: 'ft' }, label, chip), el, o.hint ? h('small', {}, o.hint) : null);
    }
    const list = () => [...reg.values()].filter(e => e.on).map(e => ({ key: e.key, label: e.label, from: e.orig, to: e.read(), fmt: e.fmt }));
    return {
      field, bind, list,
      changes: () => Object.fromEntries(list().map(c => [c.key, c.to])),
      reset() { for (const e of reg.values()) { if (e.el.type === 'checkbox') e.el.checked = e.orig; else e.el.value = e.orig; e.upd(); } },
      set(key, value) { const e = reg.get(key); if (e) { e.el.value = value; e.upd(); } },
    };
  }
  /** "3 changes not saved" with what each one does, and the buttons. */
  function savebar(kit, onSave, o = {}) {
    const bar = h('div', { class: 'savebar2' + (o.sticky === false ? '' : ' sticky'), hidden: true });
    const go = h('button', { class: 'primary' }, o.label ?? 'Guardar cambios');
    go.addEventListener('click', async () => { go.disabled = true; try { await onSave(); } finally { go.disabled = false; } });
    const left = h('div', { class: 'sb-l' });
    bar.append(left, h('div', { class: 'sb-r' }, h('button', { onclick: () => kit.reset() }, 'Descartar'), go));
    return {
      el: bar,
      refresh() {
        const l = kit.list(); bar.hidden = l.length === 0;
        fill(left, h('strong', {}, `${l.length} ${l.length === 1 ? 'cambio' : 'cambios'} sin guardar`),
          h('div', { class: 'sb-chips' }, l.slice(0, 5).map(c => h('span', { class: 'sb-chip' }, `${c.label}: `, h('s', {}, c.fmt(c.from)), ' → ', h('b', {}, c.fmt(c.to)))), l.length > 5 ? h('span', { class: 'mute' }, `y ${l.length - 5} más`) : null));
      },
    };
  }

  /* ----------------------------------------------------------- data helpers */
  /** A box that fills itself when its data arrives. */
  const lazy = run => { const box = h('div', { class: 'lazy' }, h('p', { class: 'mute' }, 'Cargando...')); run(box).catch(e => fill(box, h('p', { class: 'empty' }, e.message))); return box; };
  const get = async path => { const r = await act(() => api('GET', path)); if (!r) throw new Error('No se pudo cargar.'); return r; };
  const save = async (path, body) => { const r = await act(() => api('POST', path, body), SAVED); if (r) refreshHero(); return r; };
  const numInput = (value, o = {}) => h('input', { type: 'number', step: o.step ?? 'any', min: o.min, max: o.max, value, 'aria-label': o.label });
  const secs = n => Math.round(n * 100) / 100;
  const section = (title, note, ...body) => h('section', { class: 'card' }, h('h4', {}, title), note ? h('p', { class: 'hint' }, note) : null, ...body);

  /* ------------------------------------------------------------------- hero */
  const hero = { box: h('div', { class: 'hero' }), t: {} };
  async function refreshHero() {
    const o = await act(() => api('GET', '/server/overview'));
    if (!o) return;
    const maxPlayers = Math.max(...o.servers.map(s => s.maximumPlayers));
    const t = hero.t = {
      exp: stat('Experiencia', o.rules.ExperienceRate, { fmt: f.x, hint: `Servidores: ${o.servers.map(s => f.x(s.experienceRate)).join(' · ')}` }),
      master: stat('Exp. Master', o.rules.MasterExperienceRate, { fmt: f.x }),
      mobs: stat('Monstruos en spots', o.spots.monsters, { hint: `${nf.format(o.spots.count)} spots` }),
      drop: stat('Drop de ítems al azar', o.drops.avgRandom ?? 0, { fmt: f.pct, dfmt: pp, hint: `${nf.format(o.drops.always)} grupos caen siempre` }),
      players: stat('Jugadores máximos', maxPlayers, { hint: `${o.servers.length} servidores` }),
    };
    const pend = h('div', { class: 'pend' + (o.pending ? ' on' : '') },
      o.pending ? h('span', {}, h('strong', {}, `${o.pending} ${o.pending === 1 ? 'cambio guardado espera' : 'cambios guardados esperan'} un reinicio.`), ' El juego sigue como antes hasta reiniciar.')
        : h('span', { class: 'mute' }, o.lastRestart ? `Todo aplicado. Último reinicio desde el panel: ${o.lastRestart.replace('T', ' ').slice(0, 16)}.` : 'Sin cambios pendientes.'),
      o.pending ? h('button', { class: 'primary small', onclick: restart }, 'Reiniciar ahora') : null);
    fill(hero.box, h('div', { class: 'summary' }, Object.values(t).map(s => s.el)), pend);
  }
  /** Tabs tell the hero what is about to change: bus('exp', 99). */
  const bus = (name, value) => hero.t[name]?.draft(value);

  async function restart() {
    if (!(await confirmBox('¿Reiniciar el servidor?', 'Se desconecta a todos los jugadores (cada personaje se guarda) y OpenMU vuelve a arrancar en unos 3 minutos, ya con los cambios.', 'Reiniciar', true))) return;
    const r = await act(() => api('POST', '/server/restart', {}), 'Reiniciando: tarda unos 3 minutos.');
    if (r) { k.refreshGate(); refreshHero(); }
  }

  /* ----------------------------------------------------------------- rules */
  const RULE_GROUPS = [
    ['Niveles y personajes', 'Hasta dónde se sube y cuántos personajes y compañeros caben.', ['MaximumLevel', 'MaximumMasterLevel', 'MaximumCharactersPerAccount', 'MaximumPartySize']],
    ['Dinero y objetos en el suelo', 'Cuánto zen se puede llevar, y qué pasa con lo que sueltan los monstruos.', ['MaximumInventoryMoney', 'MaximumVaultMoney', 'ShouldDropMoney', 'ItemDropDuration', 'MaximumItemOptionLevelDrop', 'ExcellentItemDropLevelDelta']],
    ['Cartas y recuperación', 'Buzón, vida y maná, y a qué distancia se ve a los demás.', ['LetterSendPrice', 'MaximumLetters', 'RecoveryInterval', 'InfoRange']],
  ];
  const FMT = { ExperienceRate: f.x, MasterExperienceRate: f.x, ShouldDropMoney: f.yes, PreventExperienceOverflow: f.yes, ItemDropDuration: f.s, RecoveryInterval: v => `${nf.format(v)} ms` };

  function rulesTab() {
    return lazy(async box => {
      const r = await get('/server/rules');
      let bar;
      const stats = {};
      const kit = draftKit((key, v) => {
        stats[key]?.draft(v);
        if (key === 'v:ExperienceRate') bus('exp', v);
        if (key === 'v:MasterExperienceRate') bus('master', v);
        if (/:maximumPlayers$/.test(key)) bus('players', draftPlayers());
        impact(); bar.refresh();
      });
      const draftPlayers = () => { const d = Math.max(...r.servers.map(s => kit.changes()[`s:${s.id}:maximumPlayers`] ?? s.maximumPlayers)); return d; };

      const xp = numInput(r.values.ExperienceRate, { min: 0, max: 100000, label: 'Experiencia' }), mxp = numInput(r.values.MasterExperienceRate, { min: 0, max: 100000, label: 'Experiencia Master' });
      const preset = n => h('button', { type: 'button', class: 'chip', onclick: () => { xp.value = n; xp.dispatchEvent(new Event('input')); } }, f.x(n));
      const info = Object.fromEntries(r.fields.map(x => [x.key, x]));
      const build = key => {
        const x = info[key];
        const fmt = FMT[key] ?? f.num;
        if (x.kind === 'bool') return kit.field('v:' + key, x.label, h('input', { type: 'checkbox', checked: r.values[key] }), r.values[key], { fmt, hint: x.help });
        return kit.field('v:' + key, x.label, numInput(r.values[key], { step: x.kind === 'float' ? 'any' : 1, min: x.min, max: x.max }), r.values[key], { fmt, hint: x.help });
      };
      for (const [key, label] of [['MaximumLevel', 'Nivel máximo'], ['MaximumMasterLevel', 'Nivel Master máx.'], ['MaximumCharactersPerAccount', 'Personajes por cuenta'], ['MaximumPartySize', 'Tamaño de grupo']]) stats['v:' + key] = stat(label, r.values[key]);
      stats['v:ShouldDropMoney'] = stat('Monstruos sueltan zen', r.values.ShouldDropMoney, { fmt: f.yes });
      stats['v:ItemDropDuration'] = stat('Ítem en el suelo', r.values.ItemDropDuration, { fmt: f.s });

      const impactBox = h('div', { class: 'impact' });
      function impact() {
        const c = kit.changes();
        const g = c['v:ExperienceRate'] ?? r.values.ExperienceRate;
        const rows = r.servers.map(s => {
          const sv = c[`s:${s.id}:experienceRate`] ?? s.experienceRate, now = r.values.ExperienceRate * s.experienceRate, next = g * sv;
          return h('li', {}, h('strong', {}, `Servidor ${s.serverId}`), ` experiencia final ${f.x(g)} × ${f.x(sv)} = `, h('b', { class: next !== now ? 'gold' : '' }, f.x(next)), next !== now ? h('span', { class: 'mute' }, ` (hoy ${f.x(now)})`) : null);
        });
        const base = 1000, now0 = base * r.values.ExperienceRate, next0 = base * g;
        fill(impactBox, h('p', {}, `Un monstruo que da ${nf.format(base)} de experiencia: hoy te da ${nf.format(now0)}`, next0 !== now0 ? [' → ', h('b', { class: 'gold' }, nf.format(next0)), deltaEl(now0, next0)] : null, '.'),
          next0 !== now0 && now0 > 0 && next0 > 0 ? h('p', { class: 'mute' }, `Subir de nivel será ${nf.format(Math.round((next0 / now0) * 100) / 100)} veces ${next0 > now0 ? 'más rápido' : 'más lento'} que hoy.`) : null,
          h('ul', {}, rows), h('p', { class: 'mute' }, 'Además cada mapa tiene su propio multiplicador (pestaña Mapas).'));
      }

      const servers = r.servers.map(s => section(`Servidor ${s.serverId}: ${s.description}`, 'Lo que vale solo para este servidor.',
        h('div', { class: 'fields' },
          kit.field(`s:${s.id}:description`, 'Nombre', h('input', { value: s.description, maxlength: 100 }), s.description, { fmt: f.txt }),
          kit.field(`s:${s.id}:experienceRate`, 'Experiencia de este servidor', numInput(s.experienceRate, { min: 0, max: 100000 }), s.experienceRate, { fmt: f.x, hint: '1 = normal' }),
          kit.field(`s:${s.id}:maximumPlayers`, 'Jugadores máximos', numInput(s.maximumPlayers, { step: 1, min: 1, max: 5000 }), s.maximumPlayers),
          kit.field(`s:${s.id}:pvpEnabled`, 'Se puede pelear entre jugadores (PvP)', h('input', { type: 'checkbox', checked: s.pvpEnabled }), s.pvpEnabled, { fmt: f.yes }))));

      bar = savebar(kit, async () => {
        const body = { values: {}, servers: [] };
        for (const [key, v] of Object.entries(kit.changes())) {
          const [t, a, b] = key.split(':');
          if (t === 'v') body.values[a] = v;
          else { let s = body.servers.find(x => x.id === a); if (!s) body.servers.push((s = { id: a })); s[b] = v; }
        }
        if (await save('/server/rules', body)) { fill(box, ); box.append(rulesTab()); bus('exp'); bus('master'); bus('players'); }
      });
      fill(box,
        strip(Object.values(stats)),
        section('Experiencia', 'Todo lo que ganan los jugadores se multiplica por este número. Elige uno rápido o escribe el tuyo.',
          h('div', { class: 'chips' }, [1, 10, 50, 99, 200, 999].map(preset)),
          h('div', { class: 'fields' }, kit.field('v:ExperienceRate', 'Experiencia', xp, r.values.ExperienceRate, { fmt: f.x, hint: info.ExperienceRate.help }),
            kit.field('v:MasterExperienceRate', 'Experiencia Master', mxp, r.values.MasterExperienceRate, { fmt: f.x, hint: info.MasterExperienceRate.help }),
            build('PreventExperienceOverflow')),
          impactBox),
        RULE_GROUPS.map(([t, n, keys]) => section(t, n, h('div', { class: 'fields' }, keys.map(build)))),
        servers, bar.el);
      impact();
    });
  }

  /* -------------------------------------------------------------------- maps */
  function mapsTab() {
    return lazy(async box => {
      const [maps, ov] = await Promise.all([get('/server/maps'), get('/server/overview')]);
      const global = ov.rules.ExperienceRate;
      let bar;
      const finals = new Map();
      const kit = draftKit((key, v) => { const m = maps.find(x => 'm:' + x.id === key); fill(finals.get(key), f.x(global * (v ?? m.expMultiplier))); bar.refresh(); });
      const boosted = maps.filter(m => m.expMultiplier !== 1);
      const top = [...maps].sort((a, b) => b.expMultiplier - a.expMultiplier)[0];
      const q = h('input', { placeholder: 'Buscar mapa', 'aria-label': 'Buscar mapa' });
      const rows = h('tbody');
      const all = numInput('', { min: 0, max: 100000, label: 'Mismo valor para todos' });
      const draw = () => {
        const t = q.value.trim().toLowerCase();
        fill(rows, maps.filter(m => m.name.toLowerCase().includes(t)).map(m => {
          const input = numInput(m.expMultiplier, { min: 0, max: 100000 });
          const chip = kit.bind('m:' + m.id, m.name, input, m.expMultiplier, { fmt: f.x });
          const fin = h('td', {}, f.x(global * m.expMultiplier)); finals.set('m:' + m.id, fin);
          return h('tr', {}, h('td', {}, m.name, h('span', { class: 'mute' }, ` (${m.number})`)), h('td', { class: 'cellchg' }, input, chip), fin, h('td', { class: 'mute' }, `${nf.format(m.monsters)} en ${m.spawns} spots`));
        }));
      };
      bar = savebar(kit, async () => {
        for (const [key, v] of Object.entries(kit.changes())) if (!(await save('/server/maps/' + key.slice(2), { expMultiplier: v }))) return;
        fill(box, ); box.append(mapsTab());
      });
      q.addEventListener('input', debounce(draw, 100)); draw();
      fill(box,
        strip(stat('Mapas', maps.length), stat('Con experiencia extra', boosted.length, { hint: boosted.length ? boosted.slice(0, 3).map(m => `${m.name} ${f.x(m.expMultiplier)}`).join(' · ') : 'Todos en x1' }),
          stat('Experiencia global', global, { fmt: f.x, hint: 'se multiplica por la del mapa' }), stat('El mapa más generoso', top.expMultiplier, { fmt: f.x, hint: top.name })),
        section('Experiencia por mapa', 'Sirve para dejar un mapa «de subir rápido». La experiencia final es la global × la del mapa.',
          h('div', { class: 'row' }, q, h('label', { class: 'f' }, h('span', { class: 'ft' }, 'Poner el mismo valor en todos'), all),
            h('button', { onclick: () => { if (all.value === '') return; for (const m of maps) kit.set('m:' + m.id, all.value); } }, 'Aplicar a todos')),
          h('table', {}, h('thead', {}, h('tr', {}, ['Mapa', 'Multiplicador del mapa', 'Experiencia final', 'Monstruos'].map(t => h('th', {}, t)))), rows)),
        bar.el);
    });
  }

  /* ------------------------------------------------------------------- drops */
  const TYPES = ['Ninguno', 'Ancient', 'Excelente', 'Ítem al azar', 'Con socket', 'Zen', 'Jewel'];
  function dropsTab() {
    return lazy(async box => {
      const drops = await get('/server/drops');
      const kinds = [...new Set(drops.map(d => d.itemType))].sort();
      const avg = list => (list.length ? list.reduce((n, d) => n + d.chance, 0) / list.length : 0);
      const on = new Set([3]);
      let factor = 1;
      const bars = h('div', { class: 'bars' });
      const verdict = h('p', { class: 'mute' });
      const apply = h('button', { class: 'primary', disabled: true }, 'Aplicar a estos grupos');
      const next = d => (on.has(d.itemType) && d.chance < 1 ? Math.min(1, d.chance * factor) : d.chance);
      const drawBars = () => {
        fill(bars, kinds.map(t => {
          const list = drops.filter(d => d.itemType === t), now = avg(list), after = list.length ? list.reduce((n, d) => n + next(d), 0) / list.length : 0;
          const changed = Math.abs(after - now) > 1e-9;
          const fillEl = h('span', { class: 'fill' }), ghost = h('span', { class: 'ghost' });
          fillEl.style.width = `${Math.min(100, now * 100)}%`; ghost.style.width = `${Math.min(100, Math.max(after, now) * 100)}%`;
          return h('div', { class: 'bar' + (on.has(t) ? ' sel' : '') },
            h('label', { class: 'inline' }, Object.assign(h('input', { type: 'checkbox', checked: on.has(t) }), { onchange: e => { e.target.checked ? on.add(t) : on.delete(t); drawBars(); } }), TYPES[t] ?? t, h('span', { class: 'mute' }, ` · ${list.length} ${list.length === 1 ? 'grupo' : 'grupos'}`)),
            h('div', { class: 'track' }, ghost, fillEl),
            h('div', { class: 'val' }, f.pct(now), changed ? [' → ', h('b', { class: 'gold' }, f.pct(after)), deltaEl(now, after, pp)] : null));
        }));
        const touched = drops.filter(d => on.has(d.itemType) && d.chance < 1), full = touched.filter(d => next(d) >= 1 && d.chance < 1).length;
        apply.disabled = factor === 1 || touched.length === 0;
        fill(verdict, factor === 1 ? 'Elige un multiplicador para ver cómo quedarían los drops.' : `${touched.length} grupos cambian${full ? `, ${full} pasarían a caer siempre (100%)` : ''}. Nunca pasa de 100%.`);
        bus('drop', on.has(3) ? avg(drops.filter(d => d.itemType === 3).map(d => ({ chance: next(d) }))) : undefined);
        if (hero.t.drop && factor === 1) bus('drop');
      };
      const custom = numInput('', { min: 0.01, max: 1000, label: 'Otro valor' });
      const setFactor = n => { factor = n; custom.value = ''; chips.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.n) === n)); drawBars(); };
      const chips = h('div', { class: 'chips' }, [0.5, 1, 1.5, 2, 3, 5, 10].map(n => h('button', { type: 'button', class: 'chip' + (n === 1 ? ' on' : ''), 'data-n': n, onclick: () => setFactor(n) }, `x${n}`)));
      custom.addEventListener('input', () => { if (custom.value) { factor = Number(custom.value); chips.querySelectorAll('button').forEach(b => b.classList.remove('on')); drawBars(); } });
      apply.addEventListener('click', async () => {
        if (!(await confirmBox('Cambiar la probabilidad de drop', `Se multiplica por ${f.x(factor)} la probabilidad de los tipos elegidos. Se puede deshacer en «Registro».`, 'Aplicar'))) return;
        if (await save('/server/drops/scale', { factor, types: [...on] })) { bus('drop'); fill(box, ); box.append(dropsTab()); }
      });

      const kind = h('select', {}, h('option', { value: '' }, 'Todos los tipos'), kinds.map(t => h('option', { value: t }, TYPES[t] ?? t)));
      const q = h('input', { placeholder: 'Buscar por nombre', 'aria-label': 'Buscar' });
      const rows = h('tbody');
      const draw = () => {
        const text = q.value.trim().toLowerCase();
        const list = drops.filter(d => (kind.value === '' || String(d.itemType) === kind.value) && d.description.toLowerCase().includes(text));
        fill(rows, list.slice(0, 120).map(d => h('tr', {}, h('td', {}, d.description), h('td', {}, d.typeName), h('td', {}, h('b', {}, f.pct(d.chance))),
          h('td', { class: 'mute' }, d.minLevel != null || d.maxLevel != null ? `${d.minLevel ?? 0} a ${d.maxLevel ?? '∞'}` : 'todos'),
          h('td', { class: 'mute' }, `${d.possible} ítems · ${d.maps.length ? d.maps.join(', ') : `${d.monsters} monstruos`}`),
          h('td', { class: 'actions' }, h('button', { class: 'small', onclick: () => editDrop(d) }, 'Editar')))),
          list.length > 120 ? h('tr', {}, h('td', { colspan: 6, class: 'mute' }, `Mostrando 120 de ${list.length}. Usa el buscador.`)) : null);
      };
      function editDrop(d) {
        let bar2;
        const kit = draftKit(() => bar2.refresh());
        const chance = numInput(Math.round(d.chance * 10000) / 100, { min: 0, max: 100 }), min = numInput(d.minLevel ?? '', { step: 1, min: 0, max: 255 }), max = numInput(d.maxLevel ?? '', { step: 1, min: 0, max: 255 });
        const pctOf = v => `${nf.format(v)}%`;
        bar2 = savebar(kit, async () => {
          const c = kit.changes();
          const b = {};
          if ('chance' in c) b.chance = c.chance / 100;
          if ('min' in c) b.minLevel = c.min; if ('max' in c) b.maxLevel = c.max;
          if (await save('/server/drops/' + d.id, b)) { closeDialog(); fill(box, ); box.append(dropsTab()); }
        }, { sticky: false, label: 'Guardar' });
        openDialog(h('h3', {}, d.description), h('p', { class: 'mute' }, `${d.typeName}. Probabilidad de que el grupo suelte algo cuando un monstruo muere. 100% = siempre.`),
          h('div', { class: 'fields' }, kit.field('chance', 'Probabilidad (%)', chance, Math.round(d.chance * 10000) / 100, { fmt: pctOf }), kit.field('min', 'Nivel mínimo del monstruo', min, d.minLevel ?? ''), kit.field('max', 'Nivel máximo del monstruo', max, d.maxLevel ?? '')),
          bar2.el, h('div', { class: 'actions' }, h('button', { onclick: closeDialog }, 'Cerrar')));
      }
      // Boxes that open (Kundun +1..+5, Box of Luck...): one control for how often they give items instead of zen.
      const boxes = (await act(() => api('GET', '/server/boxes'))) ?? [];
      const picked = new Set(boxes.filter(b => b.kundun && b.adjustable).map(b => b.key));
      let want = 80;
      const boxRows = h('tbody'), boxVerdict = h('p', { class: 'mute' });
      const boxGo = h('button', { class: 'primary' }, 'Aplicar a las cajas marcadas');
      const boxIn = numInput(want, { step: 1, min: 1, max: 99, label: 'Probabilidad de ítem (%)' });
      const drawBoxes = () => {
        fill(boxRows, boxes.map(b => h('tr', {},
          h('td', {}, b.adjustable ? Object.assign(h('input', { type: 'checkbox', checked: picked.has(b.key), 'aria-label': 'Elegir ' + b.description }), { onchange: e => { e.target.checked ? picked.add(b.key) : picked.delete(b.key); drawBoxes(); } }) : null),
          h('td', {}, b.description, b.description !== b.name ? h('span', { class: 'mute' }, ` (${b.name})`) : null),
          h('td', {}, h('b', {}, f.pct(b.itemChance)), picked.has(b.key) && want / 100 !== b.itemChance ? [' → ', h('b', { class: 'gold' }, f.pct(want / 100))] : null),
          h('td', { class: 'mute' }, b.adjustable ? `${nf.format(b.zen)} zen el resto` : 'siempre ítems, sin zen'))));
        boxGo.disabled = picked.size === 0 || !(want >= 1 && want <= 99);
        fill(boxVerdict, picked.size ? `${picked.size} ${picked.size === 1 ? 'caja cambia' : 'cajas cambian'}: darán ítem el ${want}% de las veces y zen el resto. Máximo 99%.` : 'Marca las cajas que quieres cambiar.');
      };
      boxIn.addEventListener('input', () => { want = Number(boxIn.value); drawBoxes(); });
      boxGo.addEventListener('click', async () => {
        if (!(await confirmBox('Cambiar lo que dan las cajas', `Las ${picked.size} cajas marcadas darán ítem el ${want}% de las veces y zen el resto. Se puede deshacer en «Registro».`, 'Aplicar'))) return;
        if (await save('/server/boxes', { chance: want / 100, keys: [...picked] })) { fill(box, ); box.append(dropsTab()); }
      });
      drawBoxes();
      kind.addEventListener('change', draw); q.addEventListener('input', debounce(draw, 100)); draw(); drawBars();
      fill(box,
        strip(stat('Grupos de drop', drops.length), stat('Caen siempre (100%)', drops.filter(d => d.chance >= 1).length), stat('Ítems al azar (promedio)', avg(drops.filter(d => d.itemType === 3)), { fmt: f.pct }), stat('Excelentes (promedio)', avg(drops.filter(d => d.itemType === 2)), { fmt: f.pct })),
        section('Subir o bajar el drop de todo el servidor', 'Elige un multiplicador y los tipos de drop. Las barras muestran el promedio de hoy (relleno) y cómo quedaría (sombra).',
          chips, h('div', { class: 'row' }, h('label', { class: 'f' }, h('span', { class: 'ft' }, 'o escribe otro'), custom)), bars, verdict, h('div', { class: 'actions' }, apply)),
        boxes.length ? section('Cajas y objetos', 'Lo que dan las cajas al abrirlas (Caja de Kundun, Caja de la suerte...). Cada caja tira primero por ítems y, si no sale, da zen. Aquí cambias esa probabilidad de una vez.',
          h('table', {}, h('thead', {}, h('tr', {}, ['', 'Caja', 'Da ítem', 'Si no, da'].map(t => h('th', {}, t)))), boxRows),
          h('div', { class: 'row' }, h('label', { class: 'f' }, h('span', { class: 'ft' }, 'Probabilidad de ítem (%)'), boxIn)), boxVerdict, h('div', { class: 'actions' }, boxGo)) : null,
        section('Grupos de drop', 'Cada grupo es una tirada con su probabilidad y los ítems que puede soltar.', h('div', { class: 'row' }, q, kind),
          h('table', {}, h('thead', {}, h('tr', {}, ['Grupo', 'Tipo', 'Probabilidad', 'Nivel del monstruo', 'Dónde', ''].map(t => h('th', {}, t)))), rows)));
    });
  }

  /* ---------------------------------------------------------------- monsters */
  function monstersTab() {
    return lazy(async box => {
      const q = h('input', { placeholder: 'Busca un monstruo o NPC por nombre', 'aria-label': 'Buscar monstruo' });
      const kind = h('select', {}, [['0', 'Monstruos'], ['', 'Todos'], ['1', 'NPC']].map(([v, t]) => h('option', { value: v }, t)));
      const rows = h('tbody'), sum = h('div');
      const search = debounce(async () => {
        const list = await act(() => api('GET', `/server/monsters?q=${encodeURIComponent(q.value.trim())}&kind=${kind.value}`));
        if (!list) return;
        const rs = list.filter(m => m.respawnSeconds > 0);
        fill(sum, strip(stat('Resultados', list.length, { hint: list.length === 200 ? 'hay más: afina la búsqueda' : '' }), stat('Reaparición promedio', rs.length ? rs.reduce((n, m) => n + m.respawnSeconds, 0) / rs.length : 0, { fmt: f.s }),
          stat('Con spots', list.filter(m => m.spawns > 0).length)));
        fill(rows, list.map(m => h('tr', {}, h('td', {}, m.name, h('span', { class: 'mute' }, ` (${m.number})`)), h('td', { class: 'mute' }, m.level ?? ''), h('td', { class: 'mute' }, f.s(secs(m.respawnSeconds))), h('td', { class: 'mute' }, m.spawns),
          h('td', { class: 'actions' }, h('button', { class: 'small', onclick: () => editMonster(m.id, search) }, 'Editar')))));
      }, 150);
      q.addEventListener('input', search); kind.addEventListener('change', search); search();
      fill(box, sum, section('Monstruos', 'Cuánto tardan en reaparecer, cuántos ítems sueltan como máximo y sus estadísticas.', h('div', { class: 'row' }, q, kind),
        h('table', {}, h('thead', {}, h('tr', {}, ['Nombre', 'Nivel', 'Reaparece', 'Spots', ''].map(t => h('th', {}, t)))), rows)));
    });
  }
  async function editMonster(id, after) {
    const m = await get('/server/monsters/' + id);
    let bar;
    const kit = draftKit(() => bar.refresh());
    const defs = [['respawnSeconds', 'Reaparece en (segundos)', secs(m.respawnSeconds), f.s, 'any'], ['maxDrops', 'Ítems máximos que suelta', m.maxDrops, f.num, 1], ['moveRange', 'Distancia que se mueve', m.moveRange, f.num, 1],
      ['attackRange', 'Alcance de ataque', m.attackRange, f.num, 1], ['viewRange', 'Distancia a la que ve', m.viewRange, f.num, 1], ['moveSeconds', 'Pausa entre pasos (s)', secs(m.moveSeconds), f.s, 'any'], ['attackSeconds', 'Pausa entre ataques (s)', secs(m.attackSeconds), f.s, 'any']];
    const fields = defs.map(([key, label, v, fmt, step]) => kit.field(key, label, numInput(v, { step }), v, { fmt }));
    const attrs = m.attributes.map(a => kit.field('a:' + a.id, a.name, numInput(a.value), a.value));
    bar = savebar(kit, async () => {
      const body = {}, ch = kit.changes();
      for (const [key, v] of Object.entries(ch)) { if (key.startsWith('a:')) (body.attributes ??= {})[key.slice(2)] = v; else body[key] = v; }
      if (await save('/server/monsters/' + id, body)) { closeDialog(); after?.(); }
    }, { sticky: false, label: 'Guardar' });
    openDialog(h('h3', {}, `${m.name} (${m.number})`), h('p', { class: 'mute' }, `${m.kindName}. Mientras escribes se ve el valor de hoy y el nuevo.`),
      h('div', { class: 'fields' }, fields), attrs.length ? h('details', {}, h('summary', {}, `Estadísticas (${attrs.length})`), h('div', { class: 'fields' }, attrs)) : null,
      bar.el, h('div', { class: 'actions' }, h('button', { onclick: closeDialog }, 'Cerrar')));
  }

  /* ------------------------------------------------------------------ spawns */
  const DIRS = ['Cualquiera', 'Oeste', 'Suroeste', 'Sur', 'Sureste', 'Este', 'Noreste', 'Norte', 'Noroeste'];
  const terrains = new Map();
  async function terrainImage(map) {
    if (terrains.has(map.id)) return terrains.get(map.id);
    const t = await get(`/server/maps/${map.id}/terrain`);
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), img = g.createImageData(256, 256);
    const raw = t.data ? Uint8Array.from(atob(t.data), ch => ch.charCodeAt(0)) : null;
    for (let i = 0; i < 65536; i++) {
      const v = raw ? raw[i] : 0, o = i * 4;
      const [r, gr, b] = v === 0 ? [78, 118, 82] : v === 1 ? [74, 104, 150] : [26, 30, 28];
      img.data[o] = r; img.data[o + 1] = gr; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    terrains.set(map.id, c);
    return c;
  }
  const crowd = d => (d < 0.3 ? 'tranquilo' : d < 1 ? 'normal' : d < 3 ? 'concurrido' : 'muy denso: se amontonan');

  function spawnsTab() {
    return lazy(async box => {
      const maps = await get('/server/maps');
      const sel = h('select', { 'aria-label': 'Mapa' }, maps.map(m => h('option', { value: m.id }, `${m.name} · ${nf.format(m.monsters)} monstruos`)));
      const top = [...maps].sort((a, b) => b.monsters - a.monsters).slice(0, 6);
      const stage = h('div');
      const go = id => { sel.value = id; show(maps.find(m => m.id === id)); };
      sel.addEventListener('change', () => go(sel.value));
      fill(box, section('Elige un mapa', 'Los mapas con más monstruos hoy. Toca uno o usa la lista.',
        h('div', { class: 'chips' }, top.map(m => h('button', { type: 'button', class: 'chip', onclick: () => go(m.id) }, m.name, h('small', {}, ` ${nf.format(m.monsters)}`)))), h('div', { class: 'row' }, sel)), stage);
      show(maps[0]);

      async function show(map) {
        fill(stage, h('p', { class: 'mute' }, 'Cargando mapa...'));
        const [img, spots] = await Promise.all([terrainImage(map), get('/server/spawns?map=' + map.id)]);
        const total = spots.reduce((n, s) => n + s.quantity, 0);
        let rect = null, picked = null, chosen = null, drag = null, hover = null;
        const sSpots = stat('Spots en este mapa', spots.length), sMon = stat('Monstruos en este mapa', total, { hint: 'sumando todos los spots' }), sDen = stat('Zona elegida', 0, { fmt: () => '—', hint: 'arrastra sobre el mapa' });
        const cv = h('canvas', { class: 'terrain', width: 256 * TILE, height: 256 * TILE, role: 'img', 'aria-label': `Mapa ${map.name}` });
        const g = cv.getContext('2d');
        const coords = h('span', { class: 'mute' }, 'Pasa el mouse por el mapa');
        const tileAt = e => { const r = cv.getBoundingClientRect(); return [Math.min(255, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 256))), Math.min(255, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * 256)))]; };
        const box1 = (x1, y1, x2, y2, fillStyle, stroke, dash) => {
          g.fillStyle = fillStyle; g.fillRect(x1 * TILE, y1 * TILE, (x2 - x1 + 1) * TILE, (y2 - y1 + 1) * TILE);
          g.strokeStyle = stroke; g.setLineDash(dash ?? []); g.lineWidth = 1.5; g.strokeRect(x1 * TILE + 0.5, y1 * TILE + 0.5, (x2 - x1 + 1) * TILE - 1, (y2 - y1 + 1) * TILE - 1);
        };
        function paint() {
          g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, 256 * TILE, 256 * TILE);
          for (const s of spots) { const on = picked === s; box1(s.x1, s.y1, s.x2, s.y2, on ? 'rgba(255,200,60,.5)' : 'rgba(230,90,70,.2)', on ? '#ffd23c' : '#ff8a70'); }
          if (rect) box1(rect.x1, rect.y1, rect.x2, rect.y2, 'rgba(90,200,255,.45)', '#7fe0ff', [4, 3]);
          if (hover) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.setLineDash([]); g.lineWidth = 1; g.strokeRect(hover[0] * TILE + 0.5, hover[1] * TILE + 0.5, TILE - 1, TILE - 1); }
        }
        const norm = (a, b) => ({ x1: Math.min(a[0], b[0]), y1: Math.min(a[1], b[1]), x2: Math.max(a[0], b[0]), y2: Math.max(a[1], b[1]) });
        cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); drag = tileAt(e); rect = norm(drag, drag); picked = null; refreshSide(); paint(); });
        cv.addEventListener('pointermove', e => { const t = tileAt(e); hover = t; fill(coords, `x ${t[0]}, y ${t[1]}`); if (drag) { rect = norm(drag, t); refreshSide(); } paint(); });
        cv.addEventListener('pointerup', e => {
          if (!drag) return;
          const t = tileAt(e), moved = t[0] !== drag[0] || t[1] !== drag[1];
          drag = null;
          if (!moved) { const s = spots.find(s => t[0] >= s.x1 && t[0] <= s.x2 && t[1] >= s.y1 && t[1] <= s.y2); if (s) { picked = s; rect = null; } }
          refreshSide(); paint();
        });
        cv.addEventListener('pointerleave', () => { hover = null; fill(coords, 'Pasa el mouse por el mapa'); paint(); });

        const side = h('div', { class: 'spot-side' });
        const mq = h('input', { placeholder: 'Monstruo (ej. Spider)', 'aria-label': 'Monstruo', autocomplete: 'off' });
        const found = h('div', { class: 'chips' });
        const qty = numInput(10, { step: 1, min: 1, max: 300, label: 'Cantidad' });
        const dir = h('select', {}, DIRS.map((d, i) => h('option', { value: i }, d)));
        qty.addEventListener('input', () => refreshSide(true));
        const findMonsters = debounce(async () => {
          const l = mq.value.trim() ? await act(() => api('GET', `/server/monsters?q=${encodeURIComponent(mq.value.trim())}&kind=0`)) : [];
          fill(found, (l ?? []).slice(0, 12).map(m => h('button', { type: 'button', class: 'chip' + (chosen?.id === m.id ? ' on' : ''), onclick: () => { chosen = m; findMonsters(); refreshSide(); } }, m.name, h('small', {}, ` lv ${m.level ?? '?'}`))));
        }, 150);
        mq.addEventListener('input', findMonsters);
        const reload = async () => { const m = (await get('/server/maps')).find(x => x.id === map.id); Object.assign(map, m); sel.selectedOptions[0].textContent = `${map.name} · ${nf.format(map.monsters)} monstruos`; show(map); refreshHero(); };
        const preview = (qn, area) => {
          sMon.draft(qn ? total + qn : undefined);
          bus('mobs', qn && hero.t.mobs ? hero.t.mobs.now + qn : undefined);
          const d = area ? qn / area : 0;
          sDen.hint(qn && area ? `${nf.format(Math.round(d * 100) / 100)} monstruos por casilla: ${crowd(d)}` : 'arrastra sobre el mapa');
        };
        function refreshSide(keepFocus) {
          if (picked) {
            const q2 = numInput(picked.quantity, { step: 1, min: 1, max: 300 });
            const delta = h('span', { class: 'chg', hidden: true });
            q2.addEventListener('input', () => { const v = Number(q2.value); const on = v !== picked.quantity && v > 0; delta.hidden = !on; fill(delta, h('s', {}, picked.quantity), ' → ', h('b', {}, v), on ? deltaEl(picked.quantity, v) : null); sMon.draft(on ? total - picked.quantity + v : undefined); bus('mobs', on && hero.t.mobs ? hero.t.mobs.now - picked.quantity + v : undefined); });
            preview(0, 0);
            return fill(side, h('h4', {}, `${picked.monster}`), h('p', { class: 'mute' }, `Zona (${picked.x1},${picked.y1}) a (${picked.x2},${picked.y2}). ${picked.triggerName}. Mira hacia: ${picked.directionName}.`),
              h('label', { class: 'f' }, h('span', { class: 'ft' }, 'Cuántos aparecen', delta), q2),
              h('div', { class: 'actions' }, h('button', { class: 'danger small', onclick: async () => { if (await confirmBox('¿Quitar este spot?', `${picked.monster} deja de aparecer ahí. Se puede deshacer en «Registro».`, 'Quitar', true) && (await act(() => api('DELETE', '/server/spawns/' + picked.id), SAVED))) reload(); } }, 'Quitar spot'),
                h('button', { class: 'primary', onclick: async () => { if (await save('/server/spawns/' + picked.id, { quantity: Number(q2.value) })) reload(); } }, 'Guardar cantidad')));
          }
          const area = rect ? (rect.x2 - rect.x1 + 1) * (rect.y2 - rect.y1 + 1) : 0;
          preview(chosen && rect ? Number(qty.value) || 0 : 0, area);
          fill(sDen.el.querySelector('.v'), rect ? `${area} casillas` : '—');
          if (keepFocus) return;
          fill(side, h('h4', {}, 'Nuevo spot'),
            rect ? h('p', {}, `Zona: (${rect.x1},${rect.y1}) a (${rect.x2},${rect.y2})`) : h('p', { class: 'mute' }, 'Arrastra sobre el mapa para marcar la zona. Toca un rectángulo rojo para editarlo.'),
            h('label', { class: 'f' }, 'Monstruo', mq), found, chosen ? h('p', {}, h('strong', {}, chosen.name)) : null,
            h('div', { class: 'fields' }, h('label', { class: 'f' }, 'Cuántos aparecen', qty), h('label', { class: 'f' }, 'Mira hacia', dir)),
            h('div', { class: 'actions' }, h('button', { class: 'primary', disabled: !rect || !chosen, onclick: async () => {
              const body = { mapId: map.id, monsterId: chosen.id, ...rect, quantity: Number(qty.value), direction: Number(dir.value) };
              if (await save('/server/spawns', body)) reload();
            } }, 'Crear spot')));
        }
        refreshSide(); findMonsters();
        fill(stage, strip(sSpots, sMon, sDen), h('div', { class: 'spots' }, h('div', { class: 'terrain-wrap' }, cv, coords), side),
          spots.length ? h('table', {}, h('thead', {}, h('tr', {}, ['Monstruo', 'Zona', 'Cantidad', ''].map(t => h('th', {}, t)))),
            h('tbody', {}, spots.map(s => h('tr', {}, h('td', {}, s.monster), h('td', { class: 'mute' }, `(${s.x1},${s.y1}) a (${s.x2},${s.y2})`), h('td', {}, s.quantity),
              h('td', { class: 'actions' }, h('button', { class: 'small', onclick: () => { picked = s; rect = null; refreshSide(); paint(); scrollTo({ top: 0, behavior: 'smooth' }); } }, 'Ver')))))) : h('p', { class: 'empty' }, 'Este mapa no tiene spots.'));
        paint();
      }
    });
  }

  /* ------------------------------------------------------------------- shops */
  function shopsTab() {
    return lazy(async box => {
      const shops = await get('/server/shops');
      const list = () => fill(box, strip(stat('NPC con tienda', shops.length), stat('Ítems en venta', shops.reduce((n, s) => n + s.items, 0), { hint: 'sumando todas las tiendas' }), stat('La tienda más grande', Math.max(...shops.map(s => s.items)), { hint: [...shops].sort((a, b) => b.items - a.items)[0]?.name })),
        section('Tiendas de los NPC', 'Elige un NPC para ver y cambiar lo que vende.',
          h('table', {}, h('thead', {}, h('tr', {}, ['NPC', 'Dónde', 'Ítems', ''].map(t => h('th', {}, t)))),
            h('tbody', {}, shops.map(s => h('tr', {}, h('td', {}, s.name), h('td', { class: 'mute' }, s.maps.join(', ')), h('td', { class: 'mute' }, s.items), h('td', { class: 'actions' }, h('button', { class: 'small', onclick: () => open(s) }, 'Abrir'))))))));
      async function open(s) {
        const shop = await get('/server/shops/' + s.id);
        s.items = shop.items.length;
        const add = () => insertDialog({ kind: 'shop', id: s.id, label: s.name }, null, () => { refreshHero(); open(s); });
        fill(box, h('div', { class: 'row' }, h('button', { onclick: list }, '← Todas las tiendas')),
          strip(stat('Tienda de', s.name, { fmt: String, hint: s.maps.join(', ') }), stat('Ítems en venta', shop.items.length, { hint: `de ${shop.rows * shop.cols} casillas` })),
          section(`Tienda de ${s.name}`, 'El precio de cada ítem lo calcula el juego. Toca un ítem para quitarlo.',
            h('div', { class: 'shop-grid' }, shop.items.length ? shop.items.map(it => tile(it, async () => {
              if (await confirmBox(`¿Quitar ${it.name}?`, `Deja de venderse en la tienda de ${s.name}. Se puede deshacer en «Registro».`, 'Quitar', true) && (await act(() => api('DELETE', `/server/shops/${s.id}/items/${it.id}`), SAVED))) { refreshHero(); open(s); }
            })) : h('p', { class: 'empty' }, 'Esta tienda no vende nada.')),
            h('div', { class: 'actions' }, h('button', { class: 'primary', onclick: add }, 'Agregar ítem'))));
      }
      list();
    });
  }

  /* ------------------------------------------------------------------ events */
  function eventsTab() {
    return lazy(async box => {
      const { events, fields } = await get('/server/events');
      const SEC = { EnterDuration: 'Tiempo para entrar (s)', GameDuration: 'Duración del evento (s)', ExitDuration: 'Tiempo para salir (s)' };
      const mins = s => `${nf.format(Math.round((s / 60) * 10) / 10)} min`;
      fill(box,
        strip(stat('Eventos con entrada', events.length), stat('Duración promedio', events.reduce((n, e) => n + e.GameDuration, 0) / (events.length || 1), { fmt: mins }), stat('Jugadores por evento (máx.)', Math.max(...events.map(e => e.MaximumPlayerCount)))),
        h('p', { class: 'mute' }, 'Reglas de los eventos con entrada (Blood Castle, Chaos Castle, Devil Square, Illusion Temple...). Los horarios y las invasiones están en «Avanzado».'),
        events.map(ev => {
          const facts = h('span', { class: 'facts' });
          let bar;
          const kit = draftKit(() => { paintFacts(); bar.refresh(); });
          const now = () => ({ ...ev, ...kit.changes() });
          const paintFacts = () => { const e = now(); fill(facts, `Nivel ${e.MinimumCharacterLevel} a ${e.MaximumCharacterLevel} · hasta ${e.MaximumPlayerCount} jugadores · ${mins(e.GameDuration)}${e.EntranceFee ? ` · entrada ${nf.format(e.EntranceFee)} zen` : ''}`); };
          const body = [
            ...fields.secs.map(key => kit.field(key, SEC[key] ?? key, numInput(secs(ev[key]), { min: 0, max: 86400 }), secs(ev[key]), { fmt: f.s })),
            ...fields.ints.map(x => kit.field(x.key, x.label, numInput(ev[x.key], { step: 1, min: x.min, max: x.max }), ev[x.key])),
            ...fields.bools.map(x => kit.field(x.key, x.label, h('input', { type: 'checkbox', checked: ev[x.key] }), ev[x.key], { fmt: f.yes }))];
          bar = savebar(kit, async () => { if (await save('/server/events/' + ev.id, kit.changes())) { Object.assign(ev, kit.changes()); kit.reset(); } }, { sticky: false, label: 'Guardar' });
          paintFacts();
          return h('details', { class: 'card' }, h('summary', {}, h('strong', {}, `${ev.typeName} · nivel ${ev.gameLevel}`), ' ', facts), h('div', { class: 'fields' }, body), bar.el);
        }));
    });
  }

  /* ------------------------------------------------------------------- warps */
  function warpsTab() {
    return lazy(async box => {
      const warps = await get('/server/warps');
      let bar;
      const kit = draftKit(() => bar.refresh());
      const dear = [...warps].sort((a, b) => b.costs - a.costs)[0], cheap = [...warps].sort((a, b) => a.costs - b.costs)[0];
      bar = savebar(kit, async () => {
        const ch = kit.changes(), byId = {};
        for (const [key, v] of Object.entries(ch)) { const [id, col] = key.split(':'); (byId[id] ??= {})[col] = v; }
        for (const [id, body] of Object.entries(byId)) if (!(await save('/server/warps/' + id, body))) return;
        fill(box, ); box.append(warpsTab());
      });
      fill(box,
        strip(stat('Destinos', warps.length), stat('El más caro', dear?.costs ?? 0, { hint: dear?.name }), stat('El más barato', cheap?.costs ?? 0, { hint: cheap?.name }), stat('Costo promedio', warps.reduce((n, w) => n + w.costs, 0) / (warps.length || 1))),
        section('Teletransportes (comando /move)', 'Cuánto cuesta y qué nivel pide cada destino. Al cambiar un valor ves el de hoy y el nuevo.',
          h('table', {}, h('thead', {}, h('tr', {}, ['Destino', 'Mapa', 'Costo (zen)', 'Nivel mínimo'].map(t => h('th', {}, t)))),
            h('tbody', {}, warps.map(w => {
              const cost = numInput(w.costs, { step: 1, min: 0, max: 2147483647 }), lvl = numInput(w.levelRequirement, { step: 1, min: 0, max: 1000 });
              const c1 = kit.bind(`${w.id}:costs`, `${w.name}: costo`, cost, w.costs), c2 = kit.bind(`${w.id}:levelRequirement`, `${w.name}: nivel`, lvl, w.levelRequirement);
              return h('tr', {}, h('td', {}, w.name), h('td', { class: 'mute' }, w.map ?? ''), h('td', { class: 'cellchg' }, cost, c1), h('td', { class: 'cellchg' }, lvl, c2));
            })))),
        bar.el);
    });
  }

  /* ----------------------------------------------------------------- plug-ins */
  function pluginsTab() {
    return lazy(async box => {
      let plugins = await get('/server/plugins');
      const q = h('input', { placeholder: 'Buscar (ej. Happy Hour, Blood Castle, invasión)', 'aria-label': 'Buscar' });
      const rows = h('div'), sum = h('div');
      const more = h('input', { type: 'checkbox' });
      const drawSum = () => fill(sum, strip(stat('Plug-ins mostrados', plugins.length), stat('Activos', plugins.filter(p => p.isActive).length), stat('Con configuración', plugins.filter(p => p.config).length)));
      const draw = () => {
        const text = q.value.trim().toLowerCase();
        fill(rows, plugins.filter(p => (p.name + ' ' + p.what).toLowerCase().includes(text)).slice(0, 80).map(p => {
          const on = h('input', { type: 'checkbox', checked: p.isActive });
          const state = h('span', { class: 'pill ' + (p.isActive ? 'ok' : '') }, p.isActive ? 'Activo' : 'Apagado');
          on.addEventListener('change', async () => { if (await save('/server/plugins/' + p.id, { isActive: on.checked })) { p.isActive = on.checked; fill(state, p.isActive ? 'Activo' : 'Apagado'); state.className = 'pill ' + (p.isActive ? 'ok' : ''); drawSum(); } else on.checked = p.isActive; });
          return h('div', { class: 'plug' }, h('div', {}, h('strong', {}, p.name), h('p', { class: 'mute' }, p.what)), h('label', { class: 'inline' }, on, state),
            p.config ? h('button', { class: 'small', onclick: () => editPlugin(p) }, 'Configuración') : null);
        }));
      };
      function editPlugin(p) {
        let pretty = p.config; try { pretty = JSON.stringify(JSON.parse(p.config), null, 2); } catch { /* shown as is */ }
        const ta = h('textarea', { rows: 18, spellcheck: 'false', class: 'mono', 'aria-label': 'Configuración' }, pretty);
        const err = h('p', { class: 'err', role: 'alert' });
        openDialog(h('h3', {}, p.name), h('p', { class: 'mute' }, `${p.what} Es texto JSON: cambia solo los valores. Si te equivocas el servidor no lo guarda.`), ta, err,
          h('div', { class: 'actions' }, h('button', { onclick: closeDialog }, 'Cancelar'), h('button', { class: 'primary', onclick: async () => {
            try { JSON.parse(ta.value); } catch (e) { return fill(err, 'No es JSON válido: ' + e.message); }
            fill(err, );
            if (await save('/server/plugins/' + p.id, { config: ta.value })) { p.config = ta.value; closeDialog(); }
          } }, 'Guardar')));
      }
      q.addEventListener('input', debounce(draw, 100));
      more.addEventListener('change', async () => { plugins = (await act(() => api('GET', '/server/plugins' + (more.checked ? '?all=1' : '')))) ?? plugins; drawSum(); draw(); });
      drawSum(); draw();
      fill(box, sum, section('Plug-ins y eventos', 'Horarios de Blood Castle, Chaos Castle y Devil Square, Happy Hour, invasiones (Red Dragon, Golden Invasion...) y comandos del chat.',
        h('div', { class: 'row' }, q, h('label', { class: 'inline' }, more, 'Mostrar también los que no tienen configuración')), rows));
    });
  }

  /* ------------------------------------------------------------------- page */
  const tabs = [['rules', 'Experiencia y reglas', rulesTab], ['maps', 'Mapas', mapsTab], ['spawns', 'Mobs y spots', spawnsTab], ['monsters', 'Monstruos', monstersTab], ['drops', 'Drops', dropsTab],
    ['shops', 'Tiendas', shopsTab], ['events', 'Eventos', eventsTab], ['warps', 'Teletransportes', warpsTab], ['plugins', 'Avanzado', pluginsTab]];
  view.append(head('Servidor', 'Así está el servidor hoy. Al editar, cada número muestra cómo quedaría. Los cambios se guardan al instante y se aplican al reiniciar.', h('button', { onclick: restart }, 'Reiniciar servidor')), hero.box,
    tabset(tabs, 'rules', () => { for (const n of Object.keys(hero.t)) bus(n); }));
  refreshHero();
}
