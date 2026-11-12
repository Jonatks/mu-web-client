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

    expect(KEYS.length).toBe(2708);
    expect(hashes).toEqual({
      en: '1e5d0f10a9d159e6',
      bg: '9102f72b1c1e5a41',
      zh: '614fc04ebc3ede1d',
      fr: '7aea21545682838c',
      de: 'f3ca7535455165ba',
      it: '266b1232346b57e3',
      ja: 'e6b5978ac586c82d',
      ko: '42dfd792473cb7b9',
      pl: '4dce89199c2b2e24',
      pt: '2effd93ae14ca749',
      ro: 'b9d40e755730a1ab',
      ru: 'b7c1c24c3103bcef',
      es: '5b2c5f53f21700db',
      th: '708ba2c0157ea0f2',
      vi: '34dc406e40424209',
      ar: 'cf49c2d34371cac9',
      bn: '3c9bacc42dd9b278',
      ca: 'd5b4b5c1d3574d9d',
      cs: '79a23597cfb6fa63',
      el: 'dab7dd3c28477c1d',
      eu: '2abceb2cdddf8212',
      fa: '2960cbd643c1f900',
      fil: '4b4f5c4585608aef',
      hi: 'c58360a0c5f54c97',
      hu: '0b4bf3bb6b5f0d13',
      id: '964260fc9ad19a93',
      'sr-Latn': '5e15455c462c5b59',
      tr: 'f2ebccb34b85bb47',
      uk: '8967a98069fed13b',
      ur: '4e9383760353f74c',
      'zh-Hant': '1dace6c1f308c8d1',
    });
  });
});
