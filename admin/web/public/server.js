// The "Servidor" page: experience and rules, maps, drops, spawn spots, monsters, shops, events, warps and plug-in settings.
// It gets the page helpers from app.js (`k`) so both files share one look. Every change is saved at once and can be undone from "Registro".
// OpenMU reads this configuration when it starts, so a change applies after a restart.
const TILE = 3;
const SAVED = 'Guardado. Se aplica al reiniciar el servidor.';

export function serverPage(k) {
  const { h, fill, act, api, openDialog, closeDialog, confirmBox, head, tabset, formKit, card, view, insertDialog, tile, toast, debounce } = k;

  /** A box that fills itself when its data arrives. */
  const lazy = run => { const box = h('div', { class: 'lazy' }, h('p', { class: 'mute' }, 'Cargando...')); run(box).catch(e => fill(box, h('p', { class: 'empty' }, e.message))); return box; };
  const get = async path => { const r = await act(() => api('GET', path)); if (!r) throw new Error('No se pudo cargar.'); return r; };
  const save = (path, body) => act(() => api('POST', path, body), SAVED);
  const numInput = (value, o = {}) => h('input', { type: 'number', step: o.step ?? 'any', min: o.min, max: o.max, value, 'aria-label': o.label });
  const secs = n => Math.round(n * 100) / 100;

  /* ----------------------------------------------------------- restart */
  async function restart() {
    if (!(await confirmBox('¿Reiniciar el servidor?', 'Se desconecta a todos los jugadores y OpenMU vuelve a arrancar en cerca de un minuto, ya con los cambios de esta pantalla.', 'Reiniciar', true))) return;
    const r = await act(() => api('POST', '/server/restart', {}), 'Reiniciando: espera cerca de un minuto.');
    if (r) k.refreshGate();
  }

  /* ----------------------------------------------------- rules and servers */
  function rulesTab() {
    return lazy(async box => {
      const r = await get('/server/rules');
      const btn = h('button', { class: 'primary', disabled: true }, 'Guardar cambios');
      const kit = formKit(() => { btn.disabled = Object.keys(kit.changes()).length === 0; });
      const xp = numInput(r.values.ExperienceRate, { min: 0, max: 100000, label: 'Experiencia' });
      const preset = n => h('button', { type: 'button', class: 'chip', onclick: () => { xp.value = n; xp.dispatchEvent(new Event('input')); } }, `x${n}`);
      const fields = r.fields.map(f => {
        if (f.key === 'ExperienceRate') return kit.field('v:' + f.key, f.label, xp, r.values[f.key], f.help);
        if (f.kind === 'bool') return kit.field('v:' + f.key, f.label, h('input', { type: 'checkbox', checked: r.values[f.key] }), r.values[f.key], f.help);
        return kit.field('v:' + f.key, f.label, numInput(r.values[f.key], { step: f.kind === 'int' ? 1 : 'any', min: f.min, max: f.max }), r.values[f.key], f.help);
      });
      const servers = r.servers.map(s => card(`Servidor ${s.serverId}: ${s.description}`, 'Lo que vale solo para este servidor. La experiencia final es: reglas x servidor x mapa.',
        h('div', { class: 'fields' },
          kit.field(`s:${s.id}:description`, 'Nombre', h('input', { value: s.description, maxlength: 100 }), s.description),
          kit.field(`s:${s.id}:experienceRate`, 'Experiencia de este servidor', numInput(s.experienceRate, { min: 0, max: 100000 }), s.experienceRate, '1 = normal'),
          kit.field(`s:${s.id}:maximumPlayers`, 'Jugadores máximos', numInput(s.maximumPlayers, { step: 1, min: 1, max: 5000 }), s.maximumPlayers),
          kit.field(`s:${s.id}:pvpEnabled`, 'Se puede pelear entre jugadores (PvP)', h('input', { type: 'checkbox', checked: s.pvpEnabled }), s.pvpEnabled))));
      btn.addEventListener('click', async () => {
        const body = { values: {}, servers: [] };
        for (const [key, v] of Object.entries(kit.changes())) {
          const [t, a, b] = key.split(':');
          if (t === 'v') body.values[a] = v;
          else { let s = body.servers.find(x => x.id === a); if (!s) body.servers.push((s = { id: a })); s[b] = v; }
        }
        btn.disabled = true;
        if (await save('/server/rules', body)) { fill(box, ); box.append(rulesTab()); }
      });
      fill(box,
        card('Experiencia rápida', 'La experiencia que gana cada jugador se multiplica por este número. Elige uno o escribe el tuyo abajo.', h('div', { class: 'chips' }, [1, 10, 50, 99, 200, 999].map(preset))),
        card('Reglas del juego', 'Cada cambio queda guardado y se puede deshacer en «Registro».', h('div', { class: 'fields' }, fields)),
        servers, h('div', { class: 'savebar sticky' }, btn));
    });
  }

  /* -------------------------------------------------------------------- maps */
  function mapsTab() {
    return lazy(async box => {
      const maps = await get('/server/maps');
      fill(box, card('Experiencia por mapa', 'Multiplica la experiencia que se gana en ese mapa. Sirve para dejar un mapa como «de subir rápido».',
        h('table', {}, h('thead', {}, h('tr', {}, ['Mapa', 'Experiencia', 'Spots de monstruos', ''].map(t => h('th', {}, t)))),
          h('tbody', {}, maps.map(m => {
            const input = numInput(m.expMultiplier, { min: 0, max: 100000 });
            const b = h('button', { class: 'small', disabled: true, onclick: async () => { b.disabled = true; if (await save('/server/maps/' + m.id, { expMultiplier: Number(input.value) })) m.expMultiplier = Number(input.value); } }, 'Guardar');
            input.addEventListener('input', () => { b.disabled = Number(input.value) === m.expMultiplier || input.value === ''; });
            return h('tr', {}, h('td', {}, m.name, h('span', { class: 'mute' }, ` (${m.number})`)), h('td', {}, input), h('td', { class: 'mute' }, m.spawns), h('td', { class: 'actions' }, b));
          })))));
    });
  }

  /* ------------------------------------------------------------------- drops */
  const TYPES = ['Ninguno', 'Ancient', 'Excelente', 'Ítem al azar', 'Con socket', 'Zen', 'Jewel'];
  const pct = c => Math.round(c * 10000) / 100;
  function dropsTab() {
    return lazy(async box => {
      const drops = await get('/server/drops');
      const kinds = [...new Set(drops.map(d => d.itemType))].sort();
      const factor = h('select', {}, [0.5, 1.5, 2, 3, 5, 10].map(n => h('option', { value: n }, `x${n}`)));
      const checks = kinds.map(t => ({ t, el: h('input', { type: 'checkbox', checked: t === 3 }) }));
      const info = h('p', { class: 'mute' });
      const body = () => ({ factor: Number(factor.value), types: checks.filter(c => c.el.checked).map(c => c.t) });
      const preview = async () => { const r = await act(() => api('POST', '/server/drops/scale', { ...body(), dryRun: true })); if (r) fill(info, `${r.groups} grupos cambiarían${r.always ? `, ${r.always} quedarían en 100% (siempre caen)` : ''}.`); };
      const apply = async () => {
        if (!body().types.length) return toast('Elige al menos un tipo de drop.', true);
        if (!(await confirmBox('Cambiar la probabilidad de drop', `Se multiplica por x${factor.value} la probabilidad de los grupos elegidos. Nunca pasa de 100%. Se puede deshacer en «Registro».`, 'Aplicar'))) return;
        const r = await save('/server/drops/scale', body());
        if (r) { fill(box, ); box.append(dropsTab()); }
      };
      const kind = h('select', {}, h('option', { value: '' }, 'Todos los tipos'), kinds.map(t => h('option', { value: t }, TYPES[t] ?? t)));
      const q = h('input', { placeholder: 'Buscar por nombre', 'aria-label': 'Buscar' });
      const rows = h('tbody');
      const draw = () => {
        const text = q.value.trim().toLowerCase();
        const list = drops.filter(d => (kind.value === '' || String(d.itemType) === kind.value) && d.description.toLowerCase().includes(text));
        fill(rows, list.slice(0, 120).map(d => h('tr', {}, h('td', {}, d.description), h('td', {}, d.typeName), h('td', {}, `${pct(d.chance)}%`),
          h('td', { class: 'mute' }, d.minLevel != null || d.maxLevel != null ? `${d.minLevel ?? 0} a ${d.maxLevel ?? '∞'}` : 'todos'),
          h('td', { class: 'mute' }, `${d.possible} ítems · ${d.maps.length ? d.maps.join(', ') : `${d.monsters} monstruos`}`),
          h('td', { class: 'actions' }, h('button', { class: 'small', onclick: () => editDrop(d) }, 'Editar')))),
          list.length > 120 ? h('tr', {}, h('td', { colspan: 6, class: 'mute' }, `Mostrando 120 de ${list.length}. Usa el buscador.`)) : null);
      };
      function editDrop(d) {
        const chance = numInput(pct(d.chance), { min: 0, max: 100 }), min = numInput(d.minLevel ?? '', { step: 1, min: 0, max: 255 }), max = numInput(d.maxLevel ?? '', { step: 1, min: 0, max: 255 });
        openDialog(h('h3', {}, d.description), h('p', { class: 'mute' }, `${d.typeName}. Es la probabilidad de que el grupo suelte algo cuando un monstruo muere. 100% = siempre.`),
          h('div', { class: 'fields' }, h('label', {}, 'Probabilidad (%)', chance), h('label', {}, 'Nivel mínimo del monstruo', min), h('label', {}, 'Nivel máximo del monstruo', max)),
          h('div', { class: 'actions' }, h('button', { onclick: closeDialog }, 'Cancelar'), h('button', { class: 'primary', onclick: async () => {
            const b = { chance: Number(chance.value) / 100, minLevel: min.value === '' ? null : Number(min.value), maxLevel: max.value === '' ? null : Number(max.value) };
            if (await save('/server/drops/' + d.id, b)) { Object.assign(d, { chance: b.chance, minLevel: b.minLevel, maxLevel: b.maxLevel }); closeDialog(); draw(); }
          } }, 'Guardar')));
      }
      kind.addEventListener('change', draw); q.addEventListener('input', debounce(draw, 100)); draw();
      fill(box,
        card('Subir o bajar el drop de todo el servidor', 'Multiplica la probabilidad de los grupos de drop elegidos. Por ejemplo x2 en «Ítem al azar» duplica lo que sueltan los monstruos.',
          h('div', { class: 'fields' }, h('label', {}, 'Multiplicar por', factor)), h('div', { class: 'chips' }, checks.map(c => h('label', { class: 'inline' }, c.el, TYPES[c.t] ?? c.t))),
          info, h('div', { class: 'actions' }, h('button', { onclick: preview }, 'Ver qué pasaría'), h('button', { class: 'primary', onclick: apply }, 'Aplicar'))),
        card('Grupos de drop', 'Cada grupo es una tirada: tiene su probabilidad y los ítems que puede soltar.', h('div', { class: 'row' }, q, kind),
          h('table', {}, h('thead', {}, h('tr', {}, ['Grupo', 'Tipo', 'Probabilidad', 'Nivel del monstruo', 'Dónde', ''].map(t => h('th', {}, t)))), rows)));
    });
  }

  /* ---------------------------------------------------------------- monsters */
  function monstersTab() {
    return lazy(async box => {
      const q = h('input', { placeholder: 'Busca un monstruo o NPC por nombre', 'aria-label': 'Buscar monstruo' });
      const kind = h('select', {}, [['0', 'Monstruos'], ['', 'Todos'], ['1', 'NPC']].map(([v, t]) => h('option', { value: v }, t)));
      const rows = h('tbody');
      const search = debounce(async () => {
        const list = await act(() => api('GET', `/server/monsters?q=${encodeURIComponent(q.value.trim())}&kind=${kind.value}`));
        if (list) fill(rows, list.map(m => h('tr', {}, h('td', {}, m.name, h('span', { class: 'mute' }, ` (${m.number})`)), h('td', { class: 'mute' }, m.level ?? ''), h('td', { class: 'mute' }, `${secs(m.respawnSeconds)} s`), h('td', { class: 'mute' }, m.spawns),
          h('td', { class: 'actions' }, h('button', { class: 'small', onclick: () => editMonster(m.id) }, 'Editar')))));
      }, 150);
      q.addEventListener('input', search); kind.addEventListener('change', search); search();
      fill(box, card('Monstruos', 'Cuánto tardan en reaparecer, cuántos ítems sueltan como máximo y sus estadísticas.', h('div', { class: 'row' }, q, kind),
        h('table', {}, h('thead', {}, h('tr', {}, ['Nombre', 'Nivel', 'Reaparece', 'Spots', ''].map(t => h('th', {}, t)))), rows)));
    });
  }
  async function editMonster(id) {
    const m = await get('/server/monsters/' + id);
    const f = {
      respawnSeconds: numInput(secs(m.respawnSeconds), { min: 0, max: 86400 }), maxDrops: numInput(m.maxDrops, { step: 1, min: 0, max: 20 }),
      moveRange: numInput(m.moveRange, { step: 1, min: 0, max: 50 }), attackRange: numInput(m.attackRange, { step: 1, min: 0, max: 50 }), viewRange: numInput(m.viewRange, { step: 1, min: 0, max: 50 }),
      moveSeconds: numInput(secs(m.moveSeconds), { min: 0, max: 3600 }), attackSeconds: numInput(secs(m.attackSeconds), { min: 0, max: 3600 }),
    };
    const orig = { respawnSeconds: secs(m.respawnSeconds), maxDrops: m.maxDrops, moveRange: m.moveRange, attackRange: m.attackRange, viewRange: m.viewRange, moveSeconds: secs(m.moveSeconds), attackSeconds: secs(m.attackSeconds) };
    const attrs = m.attributes.map(a => ({ a, el: numInput(a.value) }));
    const label = [['respawnSeconds', 'Reaparece en (segundos)'], ['maxDrops', 'Ítems máximos que suelta'], ['moveRange', 'Distancia que se mueve'], ['attackRange', 'Alcance de ataque'], ['viewRange', 'Distancia a la que ve'], ['moveSeconds', 'Pausa entre pasos (s)'], ['attackSeconds', 'Pausa entre ataques (s)']];
    openDialog(h('h3', {}, `${m.name} (${m.number})`), h('p', { class: 'mute' }, `${m.kindName}. Las estadísticas son las que usa el juego (vida, defensa, ataque...).`),
      h('div', { class: 'fields' }, label.map(([key, t]) => h('label', {}, t, f[key]))),
      attrs.length ? h('details', {}, h('summary', {}, `Estadísticas (${attrs.length})`), h('div', { class: 'fields' }, attrs.map(x => h('label', {}, x.a.name, x.el)))) : null,
      h('div', { class: 'actions' }, h('button', { onclick: closeDialog }, 'Cancelar'), h('button', { class: 'primary', onclick: async () => {
        const body = {};
        for (const [key] of label) if (Number(f[key].value) !== orig[key]) body[key] = Number(f[key].value);
        const ch = attrs.filter(x => Number(x.el.value) !== x.a.value);
        if (ch.length) body.attributes = Object.fromEntries(ch.map(x => [x.a.id, Number(x.el.value)]));
        if (!Object.keys(body).length) return closeDialog();
        if (await save('/server/monsters/' + id, body)) closeDialog();
      } }, 'Guardar')));
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

  function spawnsTab() {
    return lazy(async box => {
      const maps = await get('/server/maps');
      const sel = h('select', { 'aria-label': 'Mapa' }, maps.map(m => h('option', { value: m.id }, `${m.name} (${m.spawns})`)));
      const stage = h('div');
      sel.addEventListener('change', () => show(maps.find(m => m.id === sel.value)));
      fill(box, card('Spots de monstruos', 'Elige un mapa, arrastra sobre el dibujo para marcar un rectángulo y di qué monstruo y cuántos aparecen ahí. Cuando mueren, reaparecen en el mismo lugar. Verde: se puede caminar. Azul: zona segura. Oscuro: pared.', h('div', { class: 'row' }, sel)), stage);
      show(maps[0]);

      async function show(map) {
        fill(stage, h('p', { class: 'mute' }, 'Cargando mapa...'));
        const [img, spots] = await Promise.all([terrainImage(map), get('/server/spawns?map=' + map.id)]);
        let rect = null, picked = null, chosen = null, drag = null, hover = null;
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
        const findMonsters = debounce(async () => {
          const l = mq.value.trim() ? await act(() => api('GET', `/server/monsters?q=${encodeURIComponent(mq.value.trim())}&kind=0`)) : [];
          fill(found, (l ?? []).slice(0, 12).map(m => h('button', { type: 'button', class: 'chip' + (chosen?.id === m.id ? ' on' : ''), onclick: () => { chosen = m; findMonsters(); refreshSide(); } }, m.name, h('small', {}, ` lv ${m.level ?? '?'}`))));
        }, 150);
        mq.addEventListener('input', findMonsters);
        const reload = async () => { const m = (await get('/server/maps')).find(x => x.id === map.id); Object.assign(map, m); sel.selectedOptions[0].textContent = `${map.name} (${map.spawns})`; show(map); };
        function refreshSide() {
          if (picked) {
            const q2 = numInput(picked.quantity, { step: 1, min: 1, max: 300 });
            return fill(side, h('h4', {}, `${picked.monster} (${picked.x1},${picked.y1}) a (${picked.x2},${picked.y2})`), h('p', { class: 'mute' }, `${picked.triggerName}. Mira hacia: ${picked.directionName}.`),
              h('label', { class: 'f' }, 'Cuántos aparecen', q2),
              h('div', { class: 'actions' }, h('button', { class: 'danger small', onclick: async () => { if (await confirmBox('¿Quitar este spot?', `${picked.monster} deja de aparecer ahí. Se puede deshacer en «Registro».`, 'Quitar', true) && (await act(() => api('DELETE', '/server/spawns/' + picked.id), SAVED))) reload(); } }, 'Quitar spot'),
                h('button', { class: 'primary', onclick: async () => { if (await save('/server/spawns/' + picked.id, { quantity: Number(q2.value) })) reload(); } }, 'Guardar cantidad')));
          }
          const size = rect ? (rect.x2 - rect.x1 + 1) * (rect.y2 - rect.y1 + 1) : 0;
          fill(side, h('h4', {}, 'Nuevo spot'),
            rect ? h('p', {}, `Zona: (${rect.x1},${rect.y1}) a (${rect.x2},${rect.y2}) · ${size} casillas`) : h('p', { class: 'mute' }, 'Arrastra sobre el mapa para marcar la zona. Toca un rectángulo rojo para editarlo.'),
            h('label', { class: 'f' }, 'Monstruo', mq), found, chosen ? h('p', {}, h('strong', {}, chosen.name)) : null,
            h('div', { class: 'fields' }, h('label', {}, 'Cuántos aparecen', qty), h('label', {}, 'Mira hacia', dir)),
            h('div', { class: 'actions' }, h('button', { class: 'primary', disabled: !rect || !chosen, onclick: async () => {
              const body = { mapId: map.id, monsterId: chosen.id, ...rect, quantity: Number(qty.value), direction: Number(dir.value) };
              if (await save('/server/spawns', body)) reload();
            } }, 'Crear spot')));
        }
        refreshSide(); findMonsters();
        fill(stage, h('div', { class: 'spots' }, h('div', { class: 'terrain-wrap' }, cv, coords), side),
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
      const list = () => fill(box, card('Tiendas de los NPC', 'Elige un NPC para ver y cambiar lo que vende.',
        h('table', {}, h('thead', {}, h('tr', {}, ['NPC', 'Dónde', 'Ítems', ''].map(t => h('th', {}, t)))),
          h('tbody', {}, shops.map(s => h('tr', {}, h('td', {}, s.name), h('td', { class: 'mute' }, s.maps.join(', ')), h('td', { class: 'mute' }, s.items), h('td', { class: 'actions' }, h('button', { class: 'small', onclick: () => open(s) }, 'Abrir'))))))));
      async function open(s) {
        const shop = await get('/server/shops/' + s.id);
        s.items = shop.items.length;
        const add = () => insertDialog({ kind: 'shop', id: s.id, label: s.name }, null, () => open(s));
        fill(box, h('div', { class: 'row' }, h('button', { onclick: list }, '← Todas las tiendas')),
          card(`Tienda de ${s.name}`, 'El precio de cada ítem lo calcula el juego. Toca un ítem para quitarlo de la tienda.',
            h('div', { class: 'shop-grid' }, shop.items.length ? shop.items.map(it => tile(it, async () => {
              if (await confirmBox(`¿Quitar ${it.name}?`, `Deja de venderse en la tienda de ${s.name}. Se puede deshacer en «Registro».`, 'Quitar', true) && (await act(() => api('DELETE', `/server/shops/${s.id}/items/${it.id}`), SAVED))) open(s);
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
      fill(box, h('p', { class: 'mute' }, 'Reglas de los eventos con entrada (Blood Castle, Chaos Castle, Devil Square, Illusion Temple...). Los horarios y los eventos de invasión están en «Avanzado».'),
        events.map(ev => {
          const btn = h('button', { class: 'primary small', disabled: true }, 'Guardar');
          const kit = formKit(() => { btn.disabled = Object.keys(kit.changes()).length === 0; });
          const body = [
            ...fields.secs.map(key => kit.field(key, SEC[key] ?? key, numInput(secs(ev[key]), { min: 0, max: 86400 }), secs(ev[key]))),
            ...fields.ints.map(f => kit.field(f.key, f.label, numInput(ev[f.key], { step: 1, min: f.min, max: f.max }), ev[f.key])),
            ...fields.bools.map(f => kit.field(f.key, f.label, h('input', { type: 'checkbox', checked: ev[f.key] }), ev[f.key]))];
          btn.addEventListener('click', async () => { if (await save('/server/events/' + ev.id, kit.changes())) btn.disabled = true; });
          return h('details', { class: 'card' }, h('summary', {}, `${ev.typeName} · nivel ${ev.gameLevel} · ${ev.name}`), h('div', { class: 'fields' }, body), h('div', { class: 'actions' }, btn));
        }));
    });
  }

  /* ------------------------------------------------------------------- warps */
  function warpsTab() {
    return lazy(async box => {
      const warps = await get('/server/warps');
      fill(box, card('Teletransportes (comando /move)', 'Cuánto cuesta y qué nivel pide cada destino.',
        h('table', {}, h('thead', {}, h('tr', {}, ['Destino', 'Mapa', 'Costo (zen)', 'Nivel mínimo', ''].map(t => h('th', {}, t)))),
          h('tbody', {}, warps.map(w => {
            const cost = numInput(w.costs, { step: 1, min: 0, max: 2147483647 }), lvl = numInput(w.levelRequirement, { step: 1, min: 0, max: 1000 });
            const b = h('button', { class: 'small', disabled: true, onclick: async () => { b.disabled = true; if (await save('/server/warps/' + w.id, { costs: Number(cost.value), levelRequirement: Number(lvl.value) })) { w.costs = Number(cost.value); w.levelRequirement = Number(lvl.value); } } }, 'Guardar');
            const dirty = () => { b.disabled = (Number(cost.value) === w.costs && Number(lvl.value) === w.levelRequirement) || cost.value === '' || lvl.value === ''; };
            cost.addEventListener('input', dirty); lvl.addEventListener('input', dirty);
            return h('tr', {}, h('td', {}, w.name), h('td', { class: 'mute' }, w.map ?? ''), h('td', {}, cost), h('td', {}, lvl), h('td', { class: 'actions' }, b));
          })))));
    });
  }

  /* ----------------------------------------------------------------- plug-ins */
  function pluginsTab() {
    return lazy(async box => {
      let all = false;
      const q = h('input', { placeholder: 'Buscar (ej. Happy Hour, Blood Castle, invasión)', 'aria-label': 'Buscar' });
      const rows = h('div');
      const more = h('input', { type: 'checkbox' });
      let plugins = await get('/server/plugins');
      const draw = () => {
        const text = q.value.trim().toLowerCase();
        fill(rows, plugins.filter(p => (p.name + ' ' + p.what).toLowerCase().includes(text)).slice(0, 80).map(p => {
          const on = h('input', { type: 'checkbox', checked: p.isActive });
          on.addEventListener('change', async () => { if (await save('/server/plugins/' + p.id, { isActive: on.checked })) p.isActive = on.checked; else on.checked = p.isActive; });
          return h('div', { class: 'plug' }, h('div', {}, h('strong', {}, p.name), h('p', { class: 'mute' }, p.what)), h('label', { class: 'inline' }, on, 'Activo'),
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
      more.addEventListener('change', async () => { all = more.checked; plugins = (await act(() => api('GET', '/server/plugins' + (all ? '?all=1' : '')))) ?? plugins; draw(); });
      draw();
      fill(box, card('Plug-ins y eventos', 'Aquí están los horarios de Blood Castle, Chaos Castle y Devil Square, la Happy Hour, las invasiones (Red Dragon, Golden Invasion...) y los comandos del chat.', h('div', { class: 'row' }, q, h('label', { class: 'inline' }, more, 'Mostrar también los que no tienen configuración')), rows));
    });
  }

  /* ------------------------------------------------------------------- page */
  const tabs = [['rules', 'Experiencia y reglas', rulesTab], ['spawns', 'Mobs y spots', spawnsTab], ['drops', 'Drops', dropsTab], ['maps', 'Mapas', mapsTab], ['monsters', 'Monstruos', monstersTab],
    ['shops', 'Tiendas', shopsTab], ['events', 'Eventos', eventsTab], ['warps', 'Teletransportes', warpsTab], ['plugins', 'Avanzado', pluginsTab]];
  view.append(head('Servidor', 'Experiencia, drops, mobs, tiendas y eventos. Los cambios se guardan al instante, pero OpenMU los lee al arrancar: reinícialo para aplicarlos.', h('button', { onclick: restart }, 'Reiniciar servidor')), tabset(tabs, 'rules'));
}
