# La piel S19 de la interfaz: piezas del arte oficial del S19 (GFx del cliente, abiertos con permiso del usuario el
# 24-11-2026) con nombres que el cliente pide (src/controllers/interface/skin/s19.ts). Lee las piezas ya recortadas
# por extract.py (<ui19>/<GFx>/<id>.png) y escribe <salida>/<nombre>.png. La salida va a mu-assets, nunca aqui.
#   python3 ops/faseS/ui/export_skin.py <ui19> <salida>
import os, sys
from PIL import Image

src, out = sys.argv[1:3]
os.makedirs(out, exist_ok=True)
PIECES = {
    'window_head': ('InventoryFrame', 8), 'window_body': ('InventoryFrame', 6), 'window_inner': ('InventoryFrame', 7),
    'divider': ('InventoryFrame', 1), 'close': ('InventoryFrame', 33), 'close_hover': ('InventoryFrame', 32),
    'close_down': ('InventoryFrame', 31), 'tab': ('InventoryFrame', 29), 'tab_hover': ('InventoryFrame', 28),
    'tab_down': ('InventoryFrame', 27), 'tab_off': ('InventoryFrame', 26), 'zen': ('InventoryFrame', 25),
    'slot_pet': ('InventoryFrame', 20), 'slot_helm': ('InventoryFrame', 18), 'slot_wings': ('InventoryFrame', 17),
    'slot_pendant': ('InventoryFrame', 19), 'slot_weapon': ('InventoryFrame', 16), 'slot_armor': ('InventoryFrame', 15),
    'slot_shield': ('InventoryFrame', 14), 'slot_gloves': ('InventoryFrame', 13), 'slot_pants': ('InventoryFrame', 11),
    'slot_boots': ('InventoryFrame', 10), 'slot_ring': ('InventoryFrame', 12), 'slot_earring': ('InventoryFrame', 127),
    'slot_pentagram': ('InventoryFrame', 9),
}
for name, (frame, cid) in PIECES.items():
    Image.open(f'{src}/{frame}/{cid}.png').save(f'{out}/{name}.png', optimize=True)
# One grid square: the first of the eight in a row strip (214 x 29).
row = Image.open(f'{src}/InventoryFrame/22.png')
step = row.size[0] / 8
row.crop((0, 0, round(step), row.size[1])).save(f'{out}/cell.png', optimize=True)
print('ok', len(PIECES) + 1, 'piezas')
