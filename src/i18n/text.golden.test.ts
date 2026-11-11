import { createHash } from 'crypto';
import { describe, expect, it } from 'vitest';
import { EN_TEXT, i18n, t, type TextKey } from './index';

/**
 * Pins what `t(key)` returns for every key in every language, switching the
 * language through the engine, plus each language's selector metadata. Moving
 * text between files must leave every hash as it is.
 */

const KEYS = (Object.keys(EN_TEXT) as TextKey[]).sort();

function languageHash(code: string): string {
  i18n.setLanguage(code);
  expect(i18n.language).toBe(code);

  const layer = i18n.current;
  const pack = layer.dataPack;
  const hash = createHash('sha256');
  hash.update(
    JSON.stringify([
      layer.name, layer.code, layer.aliases ?? [], layer.label, layer.region, layer.font ?? '',
      pack ? [pack.folder, pack.suffix, pack.encoding ?? '', !!pack.repairs, !!pack.itemNames, !!pack.dialogPages] : null,
    ])
  );
  for (const key of KEYS) hash.update(`${key}\t${t(key)}\t${i18n.translated(key)}\n`);
  return hash.digest('hex').slice(0, 16);
}

describe('text golden', () => {
  it('every key reads the same line in every language', () => {
    const was = i18n.language;
    const hashes = Object.fromEntries(i18n.languages.map(l => [l.code, languageHash(l.code)]));
    i18n.setLanguage(was);

    expect(KEYS.length).toBe(2703);
    expect(hashes).toEqual({
      en: '7bd5f9f1b34f7fdc',
      bg: '6785a2ff4f26f165',
      zh: 'f5e3905506c4fd61',
      fr: '463edb681ee47dee',
      de: '01015ec74e1560ea',
      it: '8cdee4e557062c4f',
      ja: '63dc2cc1866466c0',
      ko: 'b352d8a15604c3ab',
      pl: 'aad5d0b14491df16',
      pt: '93d2741688b2d6df',
      ro: '4473b155f1ed0cc2',
      ru: '6a76f1423683f072',
      es: '9dfbb8516d1da668',
      th: 'a9e906e33e3d3cac',
      vi: 'c1996c1ea0c9d954',
      ar: 'edfd5af15c724f01',
      bn: '221bab4f27e26ac5',
      ca: '36cd15de78cf14f9',
      cs: '0dab4845df41879c',
      el: 'dbb3febf5c151ced',
      eu: '6444861c5036b310',
      fa: '2241aca6ebc211bf',
      fil: 'cd5346abe32e059e',
      hi: 'b1666b293d44052a',
      hu: 'fc02df746c866ecc',
      id: 'ae5ebe9c37c33023',
      'sr-Latn': '27ff554f9a631f91',
      tr: 'a3f1da1157629b0c',
      uk: 'e57cb6422fb345ab',
      ur: 'b7c82a859da5fd8d',
      'zh-Hant': '0e30e5e9946cfaa2',
    });
  });
});
