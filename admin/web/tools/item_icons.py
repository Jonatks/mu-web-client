"""Makes the small item icons the admin shows (public/items/<group>_<number>.webp).

Reads the client's pre-rendered icons (public/items/item_<group>_<number>_0.png at the repo root)
and writes a cropped 72px webp for each. Run from the repo root: python3 admin/web/tools/item_icons.py
"""
import json
import re
import sys
from pathlib import Path
from PIL import Image

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else "public/items")
OUT = Path("admin/web/public/items")
SIDE = 72

OUT.mkdir(parents=True, exist_ok=True)
made = 0
for f in sorted(SRC.glob("item_*_*_0.png")):
    m = re.fullmatch(r"item_(\d+)_(\d+)_0\.png", f.name)
    if not m:
        continue
    im = Image.open(f).convert("RGBA")
    box = im.getbbox()
    if not box:
        continue
    im = im.crop(box)
    im.thumbnail((SIDE, SIDE), Image.LANCZOS)
    im.save(OUT / f"{m[1]}_{m[2]}.webp", "WEBP", quality=82, method=6)
    made += 1
(OUT / "index.json").write_text(json.dumps(sorted(p.stem for p in OUT.glob("*.webp"))))
print(f"{made} icons in {OUT}")
