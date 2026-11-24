# modulusCryptor

Webzen's ModulusCryptor, which locks BMD version 14 models and the newer OZD, ATT, MAP and OZG files
(Season 16+ clients). How it works: `controllers/assets/bmd/readme.md`.

## Public API
- `modulusDecrypt(bytes)` (`index.ts`): the plain bytes, the 34-byte header dropped.

## Depends on / used by
- uses: `ciphers/` (the eight block ciphers the header picks).
- used by: `controllers/assets/bmd` (BMD version 14), `controllers/terrain/decodeMapFile.ts`.

## Tests
- `modulusCryptor.test.ts`.
