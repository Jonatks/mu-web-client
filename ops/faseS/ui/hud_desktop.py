# La barra inferior de escritorio con arte del S19: una placa de 640x51 (dibujada al doble) donde cada casilla,
# pozo y canal cae en la coordenada del original (CNewUIMainFrameWindow, versions/shared/ui/hud/bottom_bar). Se arma
# con piezas de main.ozg ya recortadas por extract.py. La salida va a mu-assets, nunca aqui.
#   python3 ops/faseS/ui/hud_desktop.py <ui19> <salida>/hud_desk.png
import sys
from PIL import Image, ImageDraw, ImageFilter

src, out = sys.argv[1:3]
K = 2  # pixeles por unidad del original
W, H = 640 * K, 51 * K
part = lambda i: Image.open(f'{src}/main/{i}.png').convert('RGBA')
s297, s296 = part(297), part(296)

# Placa: una columna de metal entre dos casillas (x=18 de la tira 297), estirada a todo el ancho.
plate = s297.crop((18, 4, 19, s297.height)).resize((W, H), Image.BICUBIC)
canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
canvas.alpha_composite(plate)
# Remates de los extremos: los bordes de la tira con su moldura.
edge = s297.crop((0, 4, 4, s297.height)).resize((4 * K, H), Image.BICUBIC)
canvas.alpha_composite(edge, (0, 0)); canvas.alpha_composite(edge.transpose(Image.FLIP_LEFT_RIGHT), (W - 4 * K, 0))

box = s297.crop((21, 10, 51, 50))  # una casilla del S19
def cell(x, y, w, h):
    canvas.alpha_composite(box.resize((w * K, h * K), Image.BICUBIC), (x * K, y * K))

def well(x, y, w, h, round_=True):
    # Pozo oscuro con aro de bronce donde el original llena el orbe o la barra.
    m = Image.new('L', (w * K, h * K), 0); d = ImageDraw.Draw(m)
    (d.ellipse if round_ else d.rounded_rectangle)((0, 0, w * K - 1, h * K - 1), **({} if round_ else {'radius': 4 * K}), fill=255)
    hole = Image.new('RGBA', (w * K, h * K), (8, 6, 5, 255)); hole.putalpha(m)
    ring = Image.new('RGBA', ((w + 4) * K, (h + 4) * K), (0, 0, 0, 0)); dr = ImageDraw.Draw(ring)
    shape = dr.ellipse if round_ else (lambda r, **k: dr.rounded_rectangle(r, radius=5 * K, **k))
    shape((0, 0, (w + 4) * K - 1, (h + 4) * K - 1), fill=(120, 92, 52, 255))
    shape((K, K, (w + 3) * K - 1, (h + 3) * K - 1), fill=(46, 34, 22, 255))
    canvas.alpha_composite(ring, ((x - 2) * K, (y - 2) * K)); canvas.alpha_composite(hole, (x * K, y * K))

for i in range(4):  # Q W E R
    cell(5 + 38 * i, 8, 30, 32)
well(158, 3, 45, 39); well(204, 2, 16, 39, False)      # HP, SD
for i in range(5):  # casillas de habilidad 1-5 y la habilidad actual
    cell(222 + 32 * i, 2, 32, 38)
cell(385, 2, 32, 38)
well(420, 2, 16, 39, False); well(437, 3, 45, 39)       # AG, MP
# Canal de la experiencia: la pieza 218 (el canal segmentado del S19) a lo ancho.
canvas.alpha_composite(part(218).resize((629 * K, 6 * K), Image.BICUBIC), (2 * K, 43 * K))
# Remate central (pieza 181) sobre la habilidad actual.
orn = part(181); orn = orn.resize((orn.width * 2 * K // 3, orn.height * 2 * K // 3), Image.BICUBIC)
canvas.alpha_composite(orn.crop((0, 0, orn.width, orn.height // 2)), (401 * K - orn.width // 2, 0))
canvas.save(out, optimize=True)
print('ok', canvas.size)
