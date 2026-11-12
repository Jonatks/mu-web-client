#!/usr/bin/env python3
# Se ejecuta EN LA VM (sudo python3 smoke.py ...): recorre la API del servicio con la clave guardada. No imprime la clave.
#   status | edit NAME | item NAME | account LOGIN PASS
import json, sys, urllib.request, urllib.error
K = open('/etc/mu-admin/key').read().strip()
def api(m, p, body=None):
    r = urllib.request.Request('http://127.0.0.1:3200' + p, method=m, data=None if body is None else json.dumps(body).encode(),
                               headers={'x-admin-key': K, 'x-admin-user': 'smoke', 'content-type': 'application/json'})
    try:
        return json.load(urllib.request.urlopen(r, timeout=20))
    except urllib.error.HTTPError as e:
        return {'HTTP': e.code, **json.loads(e.read() or b'{}')}
def brief(c): return {k: c[k] for k in ('name', 'level', 'strength', 'zen', 'levelUpPoints', 'experience')}
a = sys.argv[1:]
if a[0] == 'status': print(api('GET', '/status'))
elif a[0] == 'edit':
    n = a[1]; print('antes  ', brief(api('GET', f'/characters/{n}')))
    r = api('PATCH', f'/characters/{n}', {'level': 123, 'zen': 777, 'strength': 1111, 'levelUpPoints': 5}); print('editar ', r)
    print('despues', brief(api('GET', f'/characters/{n}')))
    print('undo   ', api('POST', f"/undo/{r['undoId']}")); print('despues', brief(api('GET', f'/characters/{n}')))
elif a[0] == 'item':
    n = a[1]
    defs = [d for d in api('GET', '/items/definitions?q=Boots&group=11') if d['name'] == 'Boots'] or api('GET', '/items/definitions?q=Boots&group=11')
    d = defs[0]; print('definicion', d['name'], d['id'])
    opts = api('GET', '/items/definitions/' + d['id']); print('opciones  ', sorted({(o['type'], o['number']) for o in opts})[:12])
    before = len(api('GET', f'/characters/{n}/items'))
    r = api('POST', f'/characters/{n}/items', {'definitionId': d['id'], 'level': 9, 'luck': True, 'option': 2, 'excellent': [1, 2]}); print('insertar  ', r)
    items = api('GET', f'/characters/{n}/items'); mine = [i for i in items if i['id'] == r['result']['itemId']]
    print('en inventario:', len(items) - before, mine and {k: mine[0][k] for k in ('slot', 'name', 'level', 'durability')}, mine and [(o['type'], o['number'], o['level']) for o in mine[0]['options']])
    print('undo      ', api('POST', f"/undo/{r['undoId']}"))
    print('items ahora', len(api('GET', f'/characters/{n}/items')), 'antes', before)
    r = api('POST', f'/characters/{n}/items', {'definitionId': d['id'], 'level': 3})
    print('borrar    ', api('DELETE', f"/characters/{n}/items/{r['result']['itemId']}"))
elif a[0] == 'acct':
    l = a[1]
    print('crear   ', api('POST', '/accounts', {'login': l, 'password': 'abcd1234'}))
    print('lista   ', [(x['login'], x['stateName']) for x in api('GET', '/accounts?q=' + l)])
    print('clave   ', api('POST', f'/accounts/{l}/password', {'password': 'zzzz9999'}))
    r = api('POST', f'/accounts/{l}/state', {'state': 'banned'}); print('ban     ', r, [x['stateName'] for x in api('GET', '/accounts?q=' + l)])
    r2 = api('POST', f'/accounts/{l}/state', {'state': 'normal'}); print('unban   ', r2, [x['stateName'] for x in api('GET', '/accounts?q=' + l)])
    print('mala    ', api('POST', '/accounts', {'login': 'a b', 'password': 'x'}), api('POST', f'/accounts/{l}/state', {'state': 'god'}))
elif a[0] == 'account':
    print(api('POST', '/accounts', {'login': a[1], 'password': a[2]})); print([x for x in api('GET', '/accounts?q=' + a[1])])
