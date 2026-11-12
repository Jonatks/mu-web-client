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
print('ALL OK' if ok_all else 'SOME FAILED')
