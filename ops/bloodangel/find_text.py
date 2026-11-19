# Busca lineas del GlobalText (Text_*.bmd) que contengan una palabra. Uso: python3 find_text.py <Text.bmd> <palabra>...
import struct, sys
b = open(sys.argv[1], 'rb').read()
key = b'\xfc\xcf\xab'
n, at = struct.unpack_from('<I', b, 2)[0], 6
for _ in range(n):
    i, l = struct.unpack_from('<II', b, at); at += 8
    s = bytes(c ^ key[k % 3] for k, c in enumerate(b[at:at + l])).decode('latin-1').rstrip('\0'); at += l
    if any(w.lower() in s.lower() for w in sys.argv[2:]) and len(s) < 40: print(i, s)
