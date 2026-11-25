# La piel S19 de la interfaz: piezas del arte oficial del S19 (GFx del cliente, abiertos con permiso del usuario el
# 24-11-2026) con nombres que el cliente pide (src/controllers/interface/skin/s19.ts). Lee las piezas ya recortadas
# por extract.py (<ui19>/<GFx>/<id>.png) y escribe <salida>/<nombre>.png. La salida va a mu-assets, nunca aqui.
#   python3 ops/faseS/ui/export_skin.py <ui19> <salida> [<Data/Interface del cliente S6>]
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
    'slot_pentagram': ('InventoryFrame', 9), 'stat_plate': ('CharacterInfoFrame', 48),
    # The bottom bar (main.ozg): orb frames, orb glass (grey, tinted in CSS), the bar's ends and its slot strips.
    'hud_orb_frame_l': ('main', 295), 'hud_orb_frame_r': ('main', 300), 'hud_orb_glass': ('main', 289),
    'hud_bar_l': ('main', 301), 'hud_bar_r': ('main', 294), 'hud_slots_qwe': ('main', 299), 'hud_slot_r': ('main', 298),
    'hud_slots_mid': ('main', 297), 'hud_slots_skill': ('main', 296),
}
for name, (frame, cid) in PIECES.items():
    Image.open(f'{src}/{frame}/{cid}.png').save(f'{out}/{name}.png', optimize=True)
# One grid square: the first of the eight in a row strip (214 x 29).
row = Image.open(f'{src}/InventoryFrame/22.png')
step = row.size[0] / 8
row.crop((0, 0, round(step), row.size[1])).save(f'{out}/cell.png', optimize=True)
# One skill square: the second of the three in the skill strip.
Image.open(f'{src}/main/296.png').crop((44, 33, 74, 72)).save(f'{out}/hud_slot.png', optimize=True)
# The bar's five buttons as sheets with the original's frames (four 30x41 stacked: up, over, down, down+over),
# drawn at twice the size; the S19 round button states are normal, over, down, disabled.
BUTTONS = {'btn_shop': 275, 'btn_character': 266, 'btn_inventory': 257, 'btn_friends': 248, 'btn_menu': 239}
for name, first in BUTTONS.items():
    sheet = Image.new('RGBA', (60, 4 * 82), (0, 0, 0, 0))
    for frame, state in enumerate((0, 1, 2, 1)):
        art = Image.open(f'{src}/main/{first + 2 * state}.png').convert('RGBA')
        art = art.resize((54, round(54 * art.size[1] / art.size[0])), Image.LANCZOS)
        sheet.alpha_composite(art, ((60 - art.size[0]) // 2, frame * 82 + (82 - art.size[1]) // 2))
    sheet.save(f'{out}/{name}.png', optimize=True)
# The windows' square buttons (36x58: up, down) on the S19 button plate (CharacterInfoFrame 58 normal, 60 lit),
# with the S6 icon lifted off its own plate by colour (the S6 plate is grey, the icons gold and red). Twice the size.
S6_BUTTONS = ['newui_Bt_accept', 'newui_Bt_closeshop', 'newui_Bt_lock', 'newui_Bt_lock02', 'newui_Bt_money01',
              'newui_Bt_money02', 'newui_Bt_openshop', 'newui_chainfo_btn_master', 'newui_chainfo_btn_pet',
              'newui_chainfo_btn_quest', 'newui_exit_00', 'newui_expansion_btn', 'newui_repair_00']
s6 = sys.argv[3] if len(sys.argv) > 3 else ''
if s6:
    import io
    import numpy as np
    plates = [Image.open(f'{src}/CharacterInfoFrame/{i}.png').convert('RGBA').resize((72, 58), Image.LANCZOS) for i in (58, 60)]
    for name in S6_BUTTONS:
        tga = Image.open(io.BytesIO(open(f'{s6}/{name}.OZT', 'rb').read()[4:])).convert('RGBA')
        icon = tga.crop((0, 0, 36, 29)).resize((72, 58), Image.LANCZOS).crop((6, 6, 66, 52))
        _, sat, val = icon.convert('HSV').split()
        alpha = np.clip((np.array(sat, float) - 70) * 4, 0, 255) * np.clip((np.array(val, float) - 60) / 120, 0, 1)
        icon.putalpha(Image.fromarray(alpha.astype('uint8')))
        sheet = Image.new('RGBA', (72, 116), (0, 0, 0, 0))
        for k, plate in enumerate(plates):
            frame = plate.copy()
            frame.alpha_composite(icon, (6, 6 + k))
            sheet.alpha_composite(frame, (0, k * 58))
        sheet.save(f'{out}/btn_{name.lower()}.png', optimize=True)
    # The stat row's `+` (16x30: up, down) from the S19 ones (52 normal, 54 lit).
    plus = Image.new('RGBA', (32, 60), (0, 0, 0, 0))
    for k, i in enumerate((52, 54)):
        plus.alpha_composite(Image.open(f'{src}/CharacterInfoFrame/{i}.png').convert('RGBA').resize((32, 30), Image.LANCZOS), (0, k * 30))
    plus.save(f'{out}/btn_stat_plus.png', optimize=True)
# The zen wells (S6 newui_item_money 170x26, money2 170x24, money3 170x46): the S19 dark panel
# (CharacterInfoFrame 70) with the S19 coin (InventoryFrame 25) at the left. Twice the size.
coin = Image.open(f'{src}/InventoryFrame/25.png').convert('RGBA').resize((44, 42), Image.LANCZOS)
panel = Image.open(f'{src}/CharacterInfoFrame/70.png').convert('RGBA')
for name, h in (('zen_bar', 26), ('zen_bar2', 24), ('zen_bar3', 46)):
    bar = panel.resize((340, h * 2), Image.LANCZOS)
    bar.alpha_composite(coin, (8, (min(h, 26) * 2 - 42) // 2))
    bar.save(f'{out}/{name}.png', optimize=True)
print('ok', len(PIECES) + 2 + len(BUTTONS), 'piezas')
