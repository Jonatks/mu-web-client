# Runs against the scratch copy (DB=openmu_probe), never the live game database.
# sudo python3 ~/smoke_full.py CHARACTER   (reads /etc/mu-admin/key, never prints it; every write is undone or checked)
import json, sys, urllib.parse, urllib.request as u

K = open('/etc/mu-admin/key').read().strip()
NAME = sys.argv[1]
ok_all = True


def call(m, p, b=None):
    r = u.Request('http://127.0.0.1:3200' + p, method=m, data=None if b is None else json.dumps(b).encode(),
                  headers={'x-admin-key': K, 'x-admin-user': 'smoke', 'content-type': 'application/json'})
    try:
        return json.loads(u.urlopen(r).read())
    except Exception as e:
        body = e.read().decode()[:160] if hasattr(e, 'read') else str(e)
        return {'ERR': body}


def check(label, cond, extra=''):
    global ok_all
    ok_all &= bool(cond)
    print(('PASS ' if cond else 'FAIL ') + label, extra if not cond else '')


def undo(r, label):
    check(label + ' undo', 'undoId' in call('POST', '/undo/' + r['undoId']))


c = call('GET', '/characters/' + NAME)
check('read character', 'id' in c, c)
cid = c['classId']
for k in ['status', 'heroState', 'fruitPoints', 'inventoryExtensions', 'masterExperience']:
    print('field', k, 'present' if k in c else 'absent')

# rename and back
r = call('PATCH', '/characters/' + NAME, {'name': NAME + 'X'})
check('rename', 'undoId' in r, r)
check('renamed readable', call('GET', '/characters/' + NAME + 'X').get('id') == c['id'])
undo(r, 'rename')
check('name restored', call('GET', '/characters/' + NAME).get('id') == c['id'])

# class change to Dark Lord and back
classes = call('GET', '/classes')
lord = next((k for k in classes if 'Lord' in k['name']), None)
if lord:
    r = call('PATCH', '/characters/' + NAME, {'classId': lord['id']})
    check('class to lord', 'undoId' in r, r)
    check('leadership row', call('GET', '/characters/' + NAME).get('leadership') is not None)
    undo(r, 'class')
    check('class restored', call('GET', '/characters/' + NAME).get('classId') == cid)

# extra fields
r = call('PATCH', '/characters/' + NAME, {'pk': 5, 'x': 100, 'y': 101, 'experience': 999, 'masterPoints': 3})
check('extra fields', 'undoId' in r, r)
g = call('GET', '/characters/' + NAME)
check('extra values', g['pk'] == 5 and g['x'] == 100 and g['masterPoints'] == 3 and int(g['experience']) == 999, g)
undo(r, 'extra')
r = call('PATCH', '/characters/' + NAME, {'masterLevel': 12, 'resets': 3})
g = call('GET', '/characters/' + NAME)
check('counters set', g['masterLevel'] == 12 and g['resets'] == 3, g)
undo(r, 'counters')
g = call('GET', '/characters/' + NAME)
check('counters undone', g['masterLevel'] == 0 or g['masterLevel'] == c.get('masterLevel', 0), g)
for k, v in [('status', 32), ('heroState', 1), ('fruitPoints', 7), ('inventoryExtensions', 1)]:
    if k in c:
        r = call('PATCH', '/characters/' + NAME, {k: v})
        check('set ' + k, 'undoId' in r and call('GET', '/characters/' + NAME)[k] == v, r)
        undo(r, k)

# skills
defs = call('GET', '/skills/definitions?q=a')
sk = next(d for d in defs)
r = call('POST', f'/characters/{NAME}/skills', {'skillId': sk['id'], 'level': 2})
check('skill add', 'undoId' in r, r)
sid = r['result']['id']
check('skill listed', any(e['id'] == sid for e in call('GET', f'/characters/{NAME}/skills')))
r2 = call('PATCH', f'/characters/{NAME}/skills/{sid}', {'level': 4})
check('skill level', 'undoId' in r2 and next(e for e in call('GET', f'/characters/{NAME}/skills') if e['id'] == sid)['level'] == 4, r2)
r3 = call('DELETE', f'/characters/{NAME}/skills/{sid}')
check('skill remove', 'undoId' in r3 and not any(e['id'] == sid for e in call('GET', f'/characters/{NAME}/skills')), r3)
undo(r3, 'skill remove'); undo(r2, 'skill level'); undo(r, 'skill add')

# items: add, edit, move, transfer, delete
sword = next(d for d in call('GET', '/items/definitions?q=' + urllib.parse.quote('Short Sword')))
r = call('POST', f'/characters/{NAME}/items', {'definitionId': sword['id'], 'level': 1})
check('item add', 'undoId' in r, r)
iid = r['result']['itemId']
opts = call('GET', '/items/definitions/' + sword['id'])
exc = [o['number'] for o in opts if o['type'].startswith('Excellent')][:1]
body = {'level': 7, 'durability': 33, 'luck': True, 'option': 2, 'socketCount': 1}
if exc: body['excellent'] = exc
e = call('PATCH', '/items/' + iid, body)
check('item edit', 'undoId' in e, e)
it = next(i for i in call('GET', f'/characters/{NAME}/items') if i['id'] == iid)
check('item edited values', it['level'] == 7 and float(it['durability']) == 33 and it['socketCount'] == 1 and any(o['type'] == 'Option' and o['level'] == 2 for o in it['options']) and any(o['type'].startswith('Luck') for o in it['options']), it)
e2 = call('PATCH', '/items/' + iid, {'luck': False, 'option': 0, 'excellent': []})
it = next(i for i in call('GET', f'/characters/{NAME}/items') if i['id'] == iid)
check('options removed', 'undoId' in e2 and it['options'] == [], it)
m = call('POST', f'/items/{iid}/move', {'slot': 40})
check('item move slot', 'undoId' in m and next(i for i in call('GET', f'/characters/{NAME}/items') if i['id'] == iid)['slot'] == 40, m)
t = call('POST', f'/items/{iid}/move', {'to': 'vault'})
check('item to vault', 'undoId' in t, t)
login = c['account']
check('item in vault', any(i['id'] == iid for i in call('GET', f'/accounts/{login}/vault')['items']))
b = call('POST', f'/items/{iid}/move', {'to': 'inventory', 'character': NAME})
check('item back to inventory', 'undoId' in b and any(i['id'] == iid for i in call('GET', f'/characters/{NAME}/items')), b)
d = call('DELETE', f'/characters/{NAME}/items/{iid}')
check('item delete', 'undoId' in d, d)
for x, n in [(d, 'delete'), (b, 'back'), (t, 'vault'), (m, 'move'), (e2, 'opts2'), (e, 'edit'), (r, 'add')]:
    undo(x, 'item ' + n)

# character delete and restore
before = {'stats': call('GET', '/characters/' + NAME), 'items': call('GET', f'/characters/{NAME}/items'), 'skills': call('GET', f'/characters/{NAME}/skills')}
dd = call('DELETE', '/characters/' + NAME, {'confirm': NAME})
check('character delete', 'undoId' in dd, dd)
check('character gone', 'ERR' in call('GET', '/characters/' + NAME))
undo(dd, 'character delete')
after = {'stats': call('GET', '/characters/' + NAME), 'items': call('GET', f'/characters/{NAME}/items'), 'skills': call('GET', f'/characters/{NAME}/skills')}
check('character restored identical', json.dumps(before, sort_keys=True) == json.dumps(after, sort_keys=True))

# account: create, edit, delete, restore
call('POST', '/accounts', {'login': 'zzacct1', 'password': 'Zz12345', 'state': 'normal'})
a = call('PATCH', '/accounts/zzacct1', {'email': 'a@b.co', 'securityCode': '1234', 'vaultExtended': True})
check('account edit', 'undoId' in a, a)
for k, v in [('timeZone', -5), ('language', 'es'), ('wcoinC', 10), ('goblinPoints', 3)]:
    g = call('GET', '/accounts/zzacct1')
    if k in g:
        rr = call('PATCH', '/accounts/zzacct1', {k: v})
        check('account ' + k, 'undoId' in rr and call('GET', '/accounts/zzacct1')[k] == v, rr)
rn = call('PATCH', '/accounts/zzacct1', {'login': 'zzacct2'})
check('account rename', 'undoId' in rn and call('GET', '/accounts/zzacct2').get('login') == 'zzacct2', rn)
call('POST', '/accounts/zzacct2/vault/items', {'definitionId': sword['id'], 'slot': 0})
da = call('DELETE', '/accounts/zzacct2', {'confirm': 'zzacct2'})
check('account delete (with vault item)', 'undoId' in da, da)
check('account gone', 'ERR' in call('GET', '/accounts/zzacct2'))
undo(da, 'account delete')
check('account restored with vault', len(call('GET', '/accounts/zzacct2/vault')['items']) == 1)

# ---- equipment slots
helm = next((d for d in call('GET', '/items/definitions?q=' + urllib.parse.quote('Pad Helm')) if d.get('group') == 7), None) or next((d for d in call('GET', '/items/definitions?q=Helm') if d.get('group') == 7), None)
if helm:
    bad_slot = call('POST', '/characters/' + NAME + '/items', {'definitionId': helm['id'], 'slot': 3})
    check('helm refused in armor slot', 'ERR' in bad_slot, bad_slot)
    r = call('POST', '/characters/' + NAME + '/items', {'definitionId': helm['id'], 'slot': 2})
    check('helm worn in slot 2', 'undoId' in r, r)
    inv = call('GET', '/characters/' + NAME + '/items')
    worn = next((i for i in inv if i['slot'] == 2), None)
    check('helm listed in slot 2', worn is not None, inv)
    check('slot 2 taken', 'ERR' in call('POST', '/characters/' + NAME + '/items', {'definitionId': helm['id'], 'slot': 2}))
    if worn:
        mv = call('POST', '/items/' + worn['id'] + '/move', {'slot': 20})
        check('helm to bag', 'undoId' in mv, mv)
        mv2 = call('POST', '/items/' + worn['id'] + '/move', {'slot': 2})
        check('helm back on', 'undoId' in mv2, mv2)
        check('helm cannot go to ring slot', 'ERR' in call('POST', '/items/' + worn['id'] + '/move', {'slot': 10}))
    undo(r, 'wear')
else:
    print('SKIP equipment: no helm definition')

# ---- skills of the class line
av = call('GET', '/characters/' + NAME + '/skills/available')
check('available skills', isinstance(av.get('skills'), list) and len(av['skills']) > 0 and len(av.get('chain', [])) >= 1, str(av)[:200])
print('chain', av.get('chain'), 'current', av.get('current'), 'skills', len(av.get('skills', [])), 'locked', sum(1 for x in av.get('skills', []) if x['needsEvolve']))

# ---- only what the class line can use
ids_av = {x['id'] for x in av.get('skills', [])}
sk = call('GET', '/skills/definitions?q=a&character=' + NAME)
check('skill search limited to the class line', isinstance(sk, list) and len(sk) > 0 and all(x['id'] in ids_av for x in sk), str(sk)[:160])
check('unfiltered skill search is wider', len(call('GET', '/skills/definitions?q=a')) >= len(sk))
after = av.get('chain', [])[av.get('chain', []).index(av.get('current')) + 1:] if av.get('current') in av.get('chain', []) else []
for q_ in ['Helm', 'Armor', 'Staff', 'Wing']:
    its = call('GET', '/items/definitions?q=' + q_ + '&character=' + NAME)
    check('items for the class line (' + q_ + ')', isinstance(its, list) and all((not d['needsEvolve']) or d['requires'] in after for d in its), str(its)[:160])
if av.get('chain', [None])[0] == 'Dark Wizard':
    names = [d['name'] for d in call('GET', '/items/definitions?q=Helm&character=' + NAME)]
    check('wizard sees Pad Helm', 'Pad Helm' in names, names)
    check('wizard does not see Dragon Helm', 'Dragon Helm' not in names, names)
    check('all helms exist without the filter', 'Dragon Helm' in [d['name'] for d in call('GET', '/items/definitions?q=Helm')])
# ---- categories
allc = call('GET', '/items/categories')
check('item categories listed', isinstance(allc, list) and any(c['key'] == 'wings' for c in allc) and all(c['count'] > 0 for c in allc), str(allc)[:200])
check('categories follow the slot', (lambda ks: 'wings' in ks and set(ks) <= {'wings', 'other13'})([c['key'] for c in call('GET', '/items/categories?slot=7')]), call('GET', '/items/categories?slot=7'))
helms = call('GET', '/items/definitions?cat=g7')
check('category filter keeps one kind', len(helms) > 0 and all(d['group'] == 7 and d['cat'] == 'g7' for d in helms))
wingsl = call('GET', '/items/definitions?cat=wings')
check('wings category has wings', len(wingsl) > 0 and all(d['group'] == 12 for d in wingsl))
mine = call('GET', '/items/categories?character=' + NAME)
check('categories for a class line are not wider', sum(c['count'] for c in mine) <= sum(c['count'] for c in allc), str(mine)[:200])
qq = call('GET', '/characters/' + NAME + '/quests')
check('quests only of the class line', all(x['class'] is None or x['class'] in av.get('chain', []) for x in qq.get('quests', [])), str(qq)[:160])

# ---- unlocked classes
uc = call('GET', '/accounts/zzacct2/classes')
check('classes listed', isinstance(uc, list) and len(uc) > 0, uc)
if isinstance(uc, list) and uc:
    ids = [k['id'] for k in uc if k['unlocked']]
    first = next(k['id'] for k in uc if not k['unlocked']) if any(not k['unlocked'] for k in uc) else None
    if first:
        r = call('POST', '/accounts/zzacct2/classes', {'classIds': ids + [first]})
        check('class unlocked', 'undoId' in r and any(k['id'] == first and k['unlocked'] for k in call('GET', '/accounts/zzacct2/classes')), r)
        undo(r, 'unlock')
        check('class lock restored', not any(k['id'] == first and k['unlocked'] for k in call('GET', '/accounts/zzacct2/classes')))
    check('bad class refused', 'ERR' in call('POST', '/accounts/zzacct2/classes', {'classIds': ['00000000-0000-0000-0000-000000000000']}))

# ---- quests
qs = call('GET', '/characters/' + NAME + '/quests')
check('quests listed', 'quests' in qs, str(qs)[:200])
if qs.get('quests'):
    q = qs['quests'][0]
    r = call('POST', '/characters/' + NAME + '/quests/' + str(q['group']), {'lastFinished': q['id'], 'active': None})
    check('quest state set', 'undoId' in r, r)
    st = call('GET', '/characters/' + NAME + '/quests')['states']
    check('quest state readable', any(x['group'] == q['group'] and x['lastFinished'] == q['id'] for x in st), st)
    undo(r, 'quest set')
    r = call('POST', '/characters/' + NAME + '/quests/' + str(q['group']), {'active': q['id']})
    r2 = call('DELETE', '/characters/' + NAME + '/quests/' + str(q['group']))
    check('quest reset', 'undoId' in r2, r2)
    undo(r2, 'quest reset')
    undo(r, 'quest active')
    other = next((x for x in qs['quests'] if x['group'] != q['group']), None)
    if other:
        check('quest of another group refused', 'ERR' in call('POST', '/characters/' + NAME + '/quests/' + str(q['group']), {'active': other['id']}))

# ---- letters
r = call('POST', '/characters/' + NAME + '/letters', {'sender': 'Admin', 'subject': 'Hola', 'message': 'Prueba de carta'})
check('letter sent', 'undoId' in r, r)
ls = call('GET', '/characters/' + NAME + '/letters')
mine = next((x for x in ls if x['subject'] == 'Hola'), None)
check('letter listed', mine is not None and mine['message'] == 'Prueba de carta', ls)
if mine:
    d = call('DELETE', '/characters/' + NAME + '/letters/' + mine['id'])
    check('letter deleted', 'undoId' in d and not any(x['id'] == mine['id'] for x in call('GET', '/characters/' + NAME + '/letters')), d)
    undo(d, 'letter delete')
    check('letter back', any(x['id'] == mine['id'] for x in call('GET', '/characters/' + NAME + '/letters')))
undo(r, 'letter send')
check('letter gone after undo', not any(x['subject'] == 'Hola' for x in call('GET', '/characters/' + NAME + '/letters')))

# ---- Gens
r = call('POST', '/characters/' + NAME + '/gens', {'gens': 2, 'contribution': 500, 'rank': 3})
check('gens set', 'undoId' in r, r)
g = call('GET', '/characters/' + NAME + '/gens')
check('gens read', g.get('gens') == 2 and g.get('contribution') == 500, g)
lv = call('DELETE', '/characters/' + NAME + '/gens')
check('gens leave', 'undoId' in lv and call('GET', '/characters/' + NAME + '/gens').get('gens') == 0, lv)
undo(lv, 'gens leave')
undo(r, 'gens set')
check('gens none again', call('GET', '/characters/' + NAME + '/gens').get('gens') == 0)

# ---- cash shop storage
r = call('POST', '/accounts/zzacct2/cashshop', {'product': 123, 'price': 4})
check('cash item added', 'undoId' in r, r)
cs = call('GET', '/accounts/zzacct2/cashshop')
check('cash item listed', len(cs) == 1 and cs[0]['product'] == 123, cs)
if cs:
    d = call('DELETE', '/accounts/zzacct2/cashshop/' + cs[0]['id'])
    check('cash item removed', 'undoId' in d and call('GET', '/accounts/zzacct2/cashshop') == [], d)
    undo(d, 'cash delete')
undo(r, 'cash add')

# ---- kick refuses non-admins and answers when nobody is connected
k = call('POST', '/players/disconnect', {})
check('disconnect answers', k.get('done') is True, k)
on = call('GET', '/players/online')
check('online list answers', isinstance(on.get('players'), list) and isinstance(on.get('bridge'), bool), on)
if not on.get('bridge'):
    check('one-account disconnect refuses without the plugin', 'ERR' in call('POST', '/players/disconnect', {'login': 'nobody1'}))
check('bad login refused', 'ERR' in call('POST', '/players/disconnect', {'login': 'a b;c'}))

# ---- server configuration
rules = call('GET', '/server/rules')
check('rules listed', isinstance(rules.get('values'), dict) and 'ExperienceRate' in rules['values'] and len(rules.get('servers', [])) >= 1, str(rules)[:200])
old_xp = rules['values']['ExperienceRate']
r = call('POST', '/server/rules', {'values': {'ExperienceRate': 99, 'ItemDropDuration': 90, 'ShouldDropMoney': False}, 'servers': [{'id': rules['servers'][0]['id'], 'experienceRate': 77, 'maximumPlayers': 123}]})
check('rules written', 'undoId' in r, r)
n = call('GET', '/server/rules')
check('rules read back', abs(n['values']['ItemDropDuration'] - 90) < 0.01 and n['values']['ExperienceRate'] == 99 and n['values']['ShouldDropMoney'] is False and n['servers'][0]['experienceRate'] == 77 and n['servers'][0]['maximumPlayers'] == 123, str(n['values'])[:300] + str(n['servers'])[:200])
check('rules reject nonsense', 'ERR' in call('POST', '/server/rules', {'values': {'ExperienceRate': -1}}) and 'ERR' in call('POST', '/server/rules', {'values': {'Nope': 1}}))
undo(r, 'rules')
n = call('GET', '/server/rules')
check('rules restored', n['values']['ExperienceRate'] == old_xp and n['servers'][0]['experienceRate'] == rules['servers'][0]['experienceRate'] and n['servers'][0]['maximumPlayers'] == rules['servers'][0]['maximumPlayers'], str(n)[:300])

maps = call('GET', '/server/maps')
check('maps listed', len(maps) > 5 and all('expMultiplier' in m for m in maps), str(maps)[:200])
lorencia = next(m for m in maps if m['number'] == 0)
tr = call('GET', '/server/maps/' + lorencia['id'] + '/terrain')
check('terrain has 65536 tiles', tr.get('size') == 256 and tr.get('data') and len(__import__('base64').b64decode(tr['data'])) == 65536, str(tr)[:100])
r = call('POST', '/server/maps/' + lorencia['id'], {'expMultiplier': 3.5})
check('map exp written', 'undoId' in r and next(m for m in call('GET', '/server/maps') if m['id'] == lorencia['id'])['expMultiplier'] == 3.5, r)
undo(r, 'map exp')
check('map exp restored', next(m for m in call('GET', '/server/maps') if m['id'] == lorencia['id'])['expMultiplier'] == lorencia['expMultiplier'])

drops = call('GET', '/server/drops')
check('drops listed', len(drops) > 50 and all('typeName' in d for d in drops), str(drops)[:200])
dg = next(d for d in drops if d['chance'] < 1 and d['chance'] > 0)
r = call('POST', '/server/drops/' + dg['id'], {'chance': 0.5})
check('drop chance written', 'undoId' in r and next(d for d in call('GET', '/server/drops') if d['id'] == dg['id'])['chance'] == 0.5, r)
check('drop chance above 1 refused', 'ERR' in call('POST', '/server/drops/' + dg['id'], {'chance': 1.5}))
undo(r, 'drop chance')
prev = call('POST', '/server/drops/scale', {'factor': 2, 'types': [3], 'dryRun': True})
check('drop scale preview', prev.get('groups', 0) >= 0 and 'always' in prev, prev)
sc = call('POST', '/server/drops/scale', {'factor': 2, 'types': [3]})
if sc.get('groups'):
    check('drop scale applied', 'undoId' in sc, sc)
    undo(sc, 'drop scale')
    check('drop scale restored', next(d for d in call('GET', '/server/drops') if d['id'] == dg['id'])['chance'] == dg['chance'] or dg['itemType'] != 3)

mons = call('GET', '/server/monsters?q=spider')
check('monsters searched', len(mons) >= 1 and 'respawnSeconds' in mons[0], str(mons)[:200])
mo = call('GET', '/server/monsters/' + mons[0]['id'])
check('monster read', 'attributes' in mo and 'name' in mo, str(mo)[:200])
r = call('POST', '/server/monsters/' + mons[0]['id'], {'respawnSeconds': 7, 'maxDrops': 3})
mo2 = call('GET', '/server/monsters/' + mons[0]['id'])
check('monster written', 'undoId' in r and mo2['respawnSeconds'] == 7 and mo2['maxDrops'] == 3, str(mo2)[:200])
undo(r, 'monster')
check('monster restored', call('GET', '/server/monsters/' + mons[0]['id'])['respawnSeconds'] == mo['respawnSeconds'])

sp = call('GET', '/server/spawns?map=' + lorencia['id'])
check('spawns listed', isinstance(sp, list) and len(sp) > 0 and 'x1' in sp[0], str(sp)[:200])
import base64
t = base64.b64decode(tr['data'])
spot = next(((x, y) for y in range(30, 220) for x in range(30, 220) if all(t[(x + i) + (y + j) * 256] == 0 for i in range(3) for j in range(3))), None)
wall = next(((x, y) for y in range(256) for x in range(256) if t[x + y * 256] >= 2 and t[x + y * 256] != 0), None)
check('test spot found', spot is not None)
if spot:
    spider = mons[0]
    a = call('POST', '/server/spawns', {'mapId': lorencia['id'], 'monsterId': spider['id'], 'x1': spot[0], 'y1': spot[1], 'x2': spot[0] + 2, 'y2': spot[1] + 2, 'quantity': 25})
    check('spawn added', 'undoId' in a, a)
    sid = a.get('result', {}).get('id')
    mine = [s for s in call('GET', '/server/spawns?map=' + lorencia['id']) if s['id'] == sid]
    check('spawn listed', len(mine) == 1 and mine[0]['quantity'] == 25, str(mine))
    e = call('POST', '/server/spawns/' + str(sid), {'quantity': 40})
    check('spawn edited', 'undoId' in e and next(s for s in call('GET', '/server/spawns?map=' + lorencia['id']) if s['id'] == sid)['quantity'] == 40, e)
    undo(e, 'spawn edit')
    check('spawn edit undone', next(s for s in call('GET', '/server/spawns?map=' + lorencia['id']) if s['id'] == sid)['quantity'] == 25)
    d = call('DELETE', '/server/spawns/' + str(sid))
    check('spawn deleted', 'undoId' in d and not any(s['id'] == sid for s in call('GET', '/server/spawns?map=' + lorencia['id'])), d)
    undo(d, 'spawn delete')
    check('spawn back', any(s['id'] == sid for s in call('GET', '/server/spawns?map=' + lorencia['id'])))
    undo(a, 'spawn add')
    check('spawn gone after undo', not any(s['id'] == sid for s in call('GET', '/server/spawns?map=' + lorencia['id'])))
if wall:
    check('spawn in a wall refused', 'ERR' in call('POST', '/server/spawns', {'mapId': lorencia['id'], 'monsterId': mons[0]['id'], 'x1': wall[0], 'y1': wall[1], 'x2': wall[0], 'y2': wall[1], 'quantity': 1}))
check('spawn bad corners refused', 'ERR' in call('POST', '/server/spawns', {'mapId': lorencia['id'], 'monsterId': mons[0]['id'], 'x1': 50, 'y1': 50, 'x2': 40, 'y2': 40}))

shops = call('GET', '/server/shops')
check('shops listed', len(shops) > 3 and all('items' in s for s in shops), str(shops)[:200])
shop = next(s for s in shops if s['items'] > 0)
sh = call('GET', '/server/shops/' + shop['id'])
check('shop read', sh.get('cols') == 8 and len(sh.get('items', [])) == shop['items'], str(sh)[:200])
r = call('POST', f"/server/shops/{shop['id']}/items", {'definitionId': sword['id'], 'level': 2})
check('shop item added', 'undoId' in r and any(i['id'] == r['result']['itemId'] for i in call('GET', '/server/shops/' + shop['id'])['items']), r)
if 'result' in r:
    d = call('DELETE', f"/server/shops/{shop['id']}/items/{r['result']['itemId']}")
    check('shop item removed', 'undoId' in d and not any(i['id'] == r['result']['itemId'] for i in call('GET', '/server/shops/' + shop['id'])['items']), d)
    undo(d, 'shop delete')
undo(r, 'shop add')
check('shop back to before', len(call('GET', '/server/shops/' + shop['id'])['items']) == shop['items'])

ev = call('GET', '/server/events')
check('events listed', len(ev.get('events', [])) > 0 and 'fields' in ev, str(ev)[:200])
e0 = ev['events'][0]
r = call('POST', '/server/events/' + e0['id'], {'MaximumPlayerCount': 77, 'EnterDuration': 45})
e1 = next(x for x in call('GET', '/server/events')['events'] if x['id'] == e0['id'])
check('event written', 'undoId' in r and e1['MaximumPlayerCount'] == 77 and e1['EnterDuration'] == 45, str(e1)[:200])
undo(r, 'event')
e2 = next(x for x in call('GET', '/server/events')['events'] if x['id'] == e0['id'])
check('event restored', e2['MaximumPlayerCount'] == e0['MaximumPlayerCount'] and e2['EnterDuration'] == e0['EnterDuration'])

wp = call('GET', '/server/warps')
check('warps listed', len(wp) > 5 and 'costs' in wp[0], str(wp)[:200])
r = call('POST', '/server/warps/' + wp[0]['id'], {'costs': 12345, 'levelRequirement': 9})
w1 = next(x for x in call('GET', '/server/warps') if x['id'] == wp[0]['id'])
check('warp written', 'undoId' in r and w1['costs'] == 12345 and w1['levelRequirement'] == 9, str(w1))
undo(r, 'warp')
w2 = next(x for x in call('GET', '/server/warps') if x['id'] == wp[0]['id'])
check('warp restored', w2['costs'] == wp[0]['costs'] and w2['levelRequirement'] == wp[0]['levelRequirement'])

pl = call('GET', '/server/plugins')
check('plugins listed with names', len(pl) > 5 and all(p.get('name') for p in pl) and any(p['name'] != 'Plug-in sin nombre' for p in pl), str(pl)[:200])
pj = next((p for p in pl if p['config']), None)
if pj:
    check('plugin bad json refused', 'ERR' in call('POST', '/server/plugins/' + pj['id'], {'config': '{nope'}))
    r = call('POST', '/server/plugins/' + pj['id'], {'isActive': not pj['isActive']})
    check('plugin toggled', 'undoId' in r and next(p for p in call('GET', '/server/plugins') if p['id'] == pj['id'])['isActive'] == (not pj['isActive']), r)
    undo(r, 'plugin')
    check('plugin restored', next(p for p in call('GET', '/server/plugins') if p['id'] == pj['id'])['isActive'] == pj['isActive'])

# ---- overview and log cleaner (the real log is only read and dry-run here, never cleaned)
ov = call('GET', '/server/overview')
check('overview answers', isinstance(ov.get('rules'), dict) and ov['spots']['monsters'] > 0 and ov['drops']['groups'] > 0 and isinstance(ov['pending'], int) and 'avgRandom' in ov['drops'], str(ov)[:300])
st = call('GET', '/audit/stats')
check('log stats answer', all(k in st for k in ('entries', 'bytes', 'undoable', 'undone', 'undoBytes')), st)
dry = call('POST', '/audit/clean', {'days': None, 'undo': True, 'dryRun': True})
check('log clean dry run changes nothing', 'removedEntries' in dry and call('GET', '/audit/stats')['entries'] == st['entries'], dry)
check('log clean rejects nonsense', 'ERR' in call('POST', '/audit/clean', {'days': -3, 'dryRun': True}) and 'ERR' in call('POST', '/audit/clean', {'days': 'x', 'dryRun': True}))

print('ALL OK' if ok_all else 'SOME FAILED')
