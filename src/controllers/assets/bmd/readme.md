# bmd

`BMDReader` reads the original models (`.bmd`). Versions 10 (plain), 12 (MapFileDecrypt) and 14
(ModulusCryptor, Season 16+ clients) are read; version 15 (LEA) is not.

`modulusCryptor.ts` is Webzen's wrapper: byte 1 of the payload picks the cipher that, with the
fixed key `webzen#@!01webzen#@!01webzen#@!0`, unlocks 1 KB at the start (from byte 2), the middle
(when the data is over 4 KB) and the end; byte 0 picks the cipher that then decrypts everything past
the 34-byte header with the 32 bytes at byte 2 as key. The same wrapper locks the newer OZD, ATT,
MAP and OZG files. Checked against all 1245 OZD textures (they open as `DDS `) and the 2020 version
14 models of a Season 19 client.
