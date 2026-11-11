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

    expect(KEYS.length).toBe(2652);
    expect(hashes).toEqual({
      en: '65a477a17001efbe',
      bg: 'b896f07194b81ab8',
      zh: 'aa18ff53f2e16ed8',
      fr: 'cdc4914c179d0ca5',
      de: '42a38e5345dc1807',
      it: '375e60b0e4e0aa85',
      ja: '468986a89323b113',
      ko: '5bce576b2620b6b8',
      pl: 'ae3aac80dab9d842',
      pt: '9d77af81963ba167',
      ro: 'd2f64f8a0d538bdc',
      ru: '4120309bfc701f4a',
      es: 'c69f8ab08b21bb14',
      th: 'afff2df1c8e62035',
      vi: 'ae149fbf647ff64e',
      ar: 'c5355ba0322c82cf',
      bn: 'f37c7613bceea952',
      ca: 'f0a326451ec16480',
      cs: '317a87b56a53441b',
      el: '5babb4d2256ab252',
      eu: '95c2472ffbb962c1',
      fa: 'd2e2c767a496a720',
      fil: 'b058fe804fa11db5',
      hi: 'b5ec812fa3d49229',
      hu: 'a14590dd8120786b',
      id: '4f34c71b7bee6b9f',
      'sr-Latn': '4eef797b9f74feab',
      tr: 'eb46388b9900de03',
      uk: '5691b8b545b2fc51',
      ur: 'f261444339c6f228',
      'zh-Hant': '78cb614700ecc5c3',
    });
  });
});
