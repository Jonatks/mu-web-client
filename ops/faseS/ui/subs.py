import struct, sys, os
from PIL import Image, ImageDraw
import swf
def subs(path):
    tags = swf.load(path); imgs = {}; out = []
    for c, b in tags:
        if c == 1009:
            iid = struct.unpack_from('<H', b, 0)[0]; w, h = struct.unpack_from('<HH', b, 6)
            i = 10; n = b[i]; i += 1 + n; m = b[i]; fn = b[i+1:i+1+m].decode('latin1'); imgs[iid] = (fn, w, h)
        if c == 1008:
            cid, iid, x1, y1, x2, y2 = struct.unpack_from('<HHHHHH', b, 0); out.append((cid, iid, x1, y1, x2, y2))
    return imgs, out
if __name__ == '__main__':
    gfx, dds, outp = sys.argv[1:4]
    imgs, out = subs(gfx)
    cache = {}
    tiles = []
    for cid, iid, x1, y1, x2, y2 in out:
        fn = imgs[iid][0]
        if fn not in cache: cache[fn] = Image.open(f'{dds}/{fn}').convert('RGBA')
        tiles.append((cid, cache[fn].crop((x1, y1, x2, y2))))
    W = 1400; x = y = rowh = 0; sheet = Image.new('RGBA', (W, 2400), (60, 60, 70, 255)); d = ImageDraw.Draw(sheet)
    for cid, t in tiles:
        t = t.copy(); t.thumbnail((330, 330))
        if x + t.size[0] + 10 > W: x = 0; y += rowh + 16; rowh = 0
        sheet.paste(t, (x, y + 12), t); d.text((x, y), str(cid), fill=(255, 255, 0)); x += t.size[0] + 10; rowh = max(rowh, t.size[1] + 12)
    sheet.crop((0, 0, W, y + rowh + 16)).save(outp); print(imgs, len(out))
