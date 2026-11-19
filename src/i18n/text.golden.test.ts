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

    expect(KEYS.length).toBe(2747);
    expect(hashes).toEqual({
      en: '0b44d71adb590f46',
      bg: '059fa8106eddbad4',
      zh: 'd5306ebc506b5e1b',
      fr: 'e66526d0d05207a8',
      de: '32e6bf11ef21deff',
      it: '7b66fcee8804b237',
      ja: '67acf5ddb95e5989',
      ko: '98673a9076123a48',
      pl: 'c8c9eb9a25e45df1',
      pt: 'faed18f2317d2f9e',
      ro: 'd9c4226b3272fa09',
      ru: '0053a865f9cbae8a',
      es: 'd06ab4e645db454a',
      th: '6ff4daefa5e7dc48',
      vi: '8372fa62001a31f5',
      ar: '2fa1f46adefcde54',
      bn: '1a0558188a2ec899',
      ca: '0ddf36798341d70e',
      cs: '9de96078cd889126',
      el: '216ce7c48b8be98c',
      eu: 'dda3e929bb1482bb',
      fa: 'be99d24da6559fff',
      fil: 'ba380036bcab8df1',
      hi: 'e4ecc59f21a3bcff',
      hu: 'e76bf32054c0ac7d',
      id: 'eebe77d945468494',
      'sr-Latn': 'f71629b55067d2d6',
      tr: '6594df49c3aeabb8',
      uk: 'e86ef52868e36f66',
      ur: 'ad7a8fd4409f2b6c',
      'zh-Hant': '19860c4be6336153',
    });
  });
});
