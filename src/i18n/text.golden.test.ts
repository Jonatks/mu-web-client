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

    expect(KEYS.length).toBe(2705);
    expect(hashes).toEqual({
      en: '22914184975cf8ef',
      bg: 'f7879233686a03f7',
      zh: 'bda048c6c76e841b',
      fr: '6448c9dc65b2145f',
      de: '01e2a7d44e7af0f6',
      it: '1ba7bf4c297301ff',
      ja: 'ccab8a615aae0b25',
      ko: '3fd37f2fde38006d',
      pl: '15a9262d14c68822',
      pt: '8f4d98cf8195c747',
      ro: '3a71e568dd5343dc',
      ru: 'f2ef26abcab71aea',
      es: '8f5affd1cf434044',
      th: 'bcad38c43d297aac',
      vi: 'c06187f72f4bbfea',
      ar: '88421fdd83cffb81',
      bn: '7a20f72fd654d95f',
      ca: '99592f5e0e42102d',
      cs: '562e3d3724dfafed',
      el: '8504268e8130b130',
      eu: '893e926032049bf6',
      fa: 'b323b7adae329a64',
      fil: '9cd1ed76e43f801c',
      hi: '1a3be44cdc000b97',
      hu: '93f1d6bc961de278',
      id: '381428740da7a936',
      'sr-Latn': '2c011cf9477b5aee',
      tr: 'b18ddbb46a6f3ce2',
      uk: '328c6c588a656df2',
      ur: '8fc51c6fb41456c0',
      'zh-Hant': '1a8aa0b3c4b7a8fb',
    });
  });
});
