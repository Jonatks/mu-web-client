# Compone el primer cuadro de un GFx del S19: formas con relleno de mapa de bits (sub-imagenes) colocadas por la lista
# de visualizacion (PlaceObject2/3 en la raiz y en los sprites), sin texto ni filtros. Da cada pieza en coordenadas
# absolutas (pixeles del escenario).
import struct, sys, json
import swf, subs
from PIL import Image

class Bits:
    def __init__(s, b, i=0): s.b, s.p = b, i * 8
    def u(s, n):
        v = 0
        for _ in range(n): v = (v << 1) | ((s.b[s.p >> 3] >> (7 - (s.p & 7))) & 1); s.p += 1
        return v
    def s_(s, n):
        v = s.u(n); return v - (1 << n) if n and v >> (n - 1) else v
    def align(s): s.p = (s.p + 7) & ~7
    @property
    def byte(s): return s.p >> 3

def rect(bt):
    n = bt.u(5); r = [bt.s_(n) for _ in range(4)]; bt.align(); return r  # xmin xmax ymin ymax (twips)

def matrix(bt):
    sx = sy = 1.0; r0 = r1 = 0.0
    if bt.u(1): n = bt.u(5); sx = bt.s_(n) / 65536; sy = bt.s_(n) / 65536
    if bt.u(1): n = bt.u(5); r0 = bt.s_(n) / 65536; r1 = bt.s_(n) / 65536
    n = bt.u(5); tx = bt.s_(n) / 20; ty = bt.s_(n) / 20; bt.align()
    return (sx, r0, r1, sy, tx, ty)

def mul(a, b):  # a after b: point -> a(b(p))
    sx, r0, r1, sy, tx, ty = b; A, B, C, D, E, F = a
    return (A * sx + C * r0, B * sx + D * r0, A * r1 + C * sy, B * r1 + D * sy, A * tx + C * ty + E, B * tx + D * ty + F)

def shape(code, b):
    cid = struct.unpack_from('<H', b, 0)[0]; bt = Bits(b, 2); bounds = rect(bt)
    if code == 83: rect(bt); bt.p += 8
    i = bt.byte; n = b[i]; i += 1
    if n == 0xff: n = struct.unpack_from('<H', b, i)[0]; i += 2
    fill = None
    for _ in range(n):
        t = b[i]; i += 1
        if t == 0x00: i += 4 if code == 32 or code == 83 else 3
        elif t in (0x10, 0x12, 0x13): return cid, bounds, None
        elif t in (0x40, 0x41, 0x42, 0x43):
            bid = struct.unpack_from('<H', b, i)[0]; bt2 = Bits(b, i + 2); m = matrix(bt2); i = bt2.byte
            if fill is None: fill = (bid, m)
    return cid, bounds, fill

def place(code, b):
    i = 0; flags = b[i]; i += 1
    if code == 70: i += 1
    depth = struct.unpack_from('<H', b, i)[0]; i += 2
    if code == 70 and (b[1] & 0x08): j = b.index(0, i); i = j + 1  # class name
    cid = None; m = None
    if flags & 0x02: cid = struct.unpack_from('<H', b, i)[0]; i += 2
    if flags & 0x04: bt = Bits(b, i); m = matrix(bt); i = bt.byte
    return depth, cid, m, bool(flags & 0x01), bool(flags & 0x02)

def displaylist(tags):
    dl = {}
    for code, b in tags:
        if code in (26, 70):
            depth, cid, m, move, has = place(code, b)
            if move and depth in dl and not has: c0, m0 = dl[depth]; dl[depth] = (c0, m or m0)
            elif cid is not None: dl[depth] = (cid, m or (1, 0, 0, 1, 0, 0))
        elif code == 28: dl.pop(struct.unpack_from('<H', b, 0 + 2 if False else 0)[0], None)
        elif code == 1: break
    return [dl[k] for k in sorted(dl)]

def load(path):
    tags = swf.load(path); shapes = {}; sprites = {}
    for code, b in tags:
        if code in (2, 22, 32, 83):
            cid, bounds, fill = shape(code, b); shapes[cid] = (bounds, fill)
        elif code == 39:
            cid, _ = struct.unpack_from('<HH', b, 0); inner = []; p = 4
            while p + 2 <= len(b):
                h = struct.unpack_from('<H', b, p)[0]; p += 2; c, l = h >> 6, h & 0x3f
                if l == 0x3f: l = struct.unpack_from('<I', b, p)[0]; p += 4
                inner.append((c, b[p:p + l])); p += l
                if c == 0: break
            sprites[cid] = displaylist(inner)
    return tags, shapes, sprites

def pieces(path):
    tags, shapes, sprites = load(path); out = []
    def walk(cid, m, depth=0):
        if depth > 30: return
        if cid in shapes:
            (x0, x1, y0, y1), fill = shapes[cid]
            if fill: out.append((fill[0], m, (x0 / 20, y0 / 20, x1 / 20, y1 / 20), fill[1]))
        for c, pm in sprites.get(cid, []): walk(c, mul(m, pm), depth + 1)
    for c, pm in displaylist(tags): walk(c, pm)
    return out

if __name__ == '__main__':
    gfx, dds, outp = sys.argv[1:4]
    imgs, rects = subs.subs(gfx); sub = {r[0]: r for r in rects}
    cache = {}; ps = pieces(gfx)
    xs = []
    for bid, m, (x0, y0, x1, y1), fm in ps:
        A, B, C, D, E, F = m
        xs += [A * x0 + C * y0 + E, A * x1 + C * y1 + E]; 
    minx = min(xs + [0]); W = int(max(xs + [10]) - minx) + 2
    ys = [B * x + D * y + F for bid, (A, B, C, D, E, F), (x0, y0, x1, y1), fm in ps for x, y in ((x0, y0), (x1, y1))]
    miny = min(ys + [0]); H = int(max(ys + [10]) - miny) + 2
    canvas = Image.new('RGBA', (min(W, 4000), min(H, 4000)), (30, 30, 30, 255))
    for bid, m, (x0, y0, x1, y1), fm in ps:
        if bid not in sub: continue
        _, iid, sx1, sy1, sx2, sy2 = sub[bid]; fn = imgs[iid][0]
        if fn not in cache: cache[fn] = Image.open(f'{dds}/{fn}').convert('RGBA')
        piece = cache[fn].crop((sx1, sy1, sx2, sy2))
        # bitmap px -> shape px: fill matrix (twips per bitmap px) / 20; then shape -> stage.
        fa, fb, fc, fd, ftx, fty = fm
        fill = (fa / 20, fb / 20, fc / 20, fd / 20, ftx, fty)
        M = mul(m, fill)
        A, B, C, D, E, F = M; det = A * D - B * C
        if abs(det) < 1e-9: continue
        # inverse: stage -> bitmap
        ia, ib, ic, id_ = D / det, -B / det, -C / det, A / det
        ie = -(ia * (E - minx) + ic * (F - miny)); iff = -(ib * (E - minx) + id_ * (F - miny))
        layer = piece.transform(canvas.size, Image.AFFINE, (ia, ic, ie, ib, id_, iff), resample=Image.BILINEAR)
        # clip to the shape's bounds in stage space
        mA, mB, mC, mD, mE, mF = m
        cx = [mA * x + mC * y + mE - minx for x, y in ((x0, y0), (x1, y1))]; cy = [mB * x + mD * y + mF - miny for x, y in ((x0, y0), (x1, y1))]
        mask = Image.new('L', canvas.size, 0); mask.paste(255, (int(min(cx)), int(min(cy)), int(max(cx)) + 1, int(max(cy)) + 1))
        a = Image.composite(layer, Image.new('RGBA', canvas.size, (0, 0, 0, 0)), mask)
        canvas.alpha_composite(a)
    canvas.save(outp); print(len(ps), 'piezas', canvas.size)
