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

    expect(KEYS.length).toBe(2736);
    expect(hashes).toEqual({
      en: '62eaab68c04f1cf5',
      bg: 'faf1110734e08506',
      zh: '4004cd7ff35a3438',
      fr: '7885ae671a8264da',
      de: 'f24f94dc11f95030',
      it: 'e8282b04d615947a',
      ja: '80da20750b1ec514',
      ko: '805e0ff91a111f36',
      pl: 'e4fa2ea5318ee836',
      pt: '0a33c0b8fa0306f0',
      ro: '16a0f943ee04c070',
      ru: '8b91d83aa80f1ab4',
      es: '2f1ff8bfd180459d',
      th: '1bf6cf22427245e9',
      vi: '2c2d8bf6dbf0e4da',
      ar: '7357fe723e9f96bd',
      bn: '872270c4abc38314',
      ca: 'bdae6ecab7cdeb85',
      cs: '35ca8a50500825a2',
      el: '548c7f6c4e9c52da',
      eu: 'ab6a11747570eeea',
      fa: '619594560505931c',
      fil: '001086c2406a66ba',
      hi: 'e97ff613f9e95aff',
      hu: 'c402829720d039a7',
      id: '5af60e662c748311',
      'sr-Latn': '7fd949830d7f7b27',
      tr: '2f85afd5d462d829',
      uk: 'c59e8f7a573facbb',
      ur: '1626ddc59c1bce50',
      'zh-Hant': '7e9991da4f4768b4',
    });
  });
});
