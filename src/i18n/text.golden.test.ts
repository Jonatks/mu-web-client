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

    expect(KEYS.length).toBe(2782);
    expect(hashes).toEqual({
      en: '2c9b44fa2c0738b6',
      bg: '1cd287ddc4484c80',
      zh: 'bacc83638610f45d',
      fr: 'ca21ec78cf518e0f',
      de: '6c99984ce96ae4ca',
      it: 'ba57a67b99d1ccbe',
      ja: 'c0b751620207f6bd',
      ko: 'fee7047450b85491',
      pl: 'd01dfbfefe6ab8ab',
      pt: '5aa031401d9e240a',
      ro: '8df594fc186b4771',
      ru: '8ed5ba1fcb239dda',
      es: 'd2a974b5df9056c5',
      th: '34e05aaaa71597e9',
      vi: '08ce670ae551c8a7',
      ar: '1da6bfeb37962f0d',
      bn: '814140d604b2f2df',
      ca: '841ac9b469f7b2ef',
      cs: '36f2d06bb84d7414',
      el: '4bfcd37fbcfd0559',
      eu: 'c9749f3f29afdc76',
      fa: 'e6686053130548a7',
      fil: '5f9e8a108313163a',
      hi: 'edad2f8fa3632811',
      hu: 'b59f70fbc658b9de',
      id: '914ded988f9ee1e7',
      'sr-Latn': 'fda3d2f1690b794a',
      tr: '5cbc525f5d64d9e5',
      uk: '7258925fd3ef64bd',
      ur: 'fd67977ff26ef19f',
      'zh-Hant': 'c9ed0b9d05419374',
    });
  });
});
