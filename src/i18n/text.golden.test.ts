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

    expect(KEYS.length).toBe(2745);
    expect(hashes).toEqual({
      en: '0407a1c7e59509fb',
      bg: '4a1c4567714dbd3c',
      zh: '80b084f827cfa8d5',
      fr: '8f0f5c34e5a7322a',
      de: '2c37c154a3b82f0f',
      it: '5aa0924950878575',
      ja: '76d03856f32cc887',
      ko: 'f4e7f75f41d30122',
      pl: '1e36653716a36abe',
      pt: '594edde0fafaadca',
      ro: 'bcabb3c62d9ba3c7',
      ru: '6f7d7f847dc400cf',
      es: '5358532a2563aed4',
      th: '02936a807fd80ec2',
      vi: 'fdcbf06088542c85',
      ar: 'bb2a047b71e0cd82',
      bn: 'fb5834c866a8956e',
      ca: '58841abf93871923',
      cs: 'd2f8b0e3f3214862',
      el: 'd296bb19e5afddaf',
      eu: 'adc8114e4e384d03',
      fa: 'e86574e04a3baff6',
      fil: 'b3f1c870c0891fce',
      hi: '79394beaceaf3706',
      hu: 'e55d4c3c24778acf',
      id: '89aa55ac307b9e2d',
      'sr-Latn': '6aadd3a8f838eb34',
      tr: '34d7ca04950b018e',
      uk: '4cce27ba00ff0e07',
      ur: 'a23b5c5ce0a37e66',
      'zh-Hant': '82d1ae50fa63de8e',
    });
  });
});
