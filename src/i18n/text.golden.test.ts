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

    expect(KEYS.length).toBe(2738);
    expect(hashes).toEqual({
      en: '4149bfe0b7637fd2',
      bg: '25b8b7c6962745dd',
      zh: '2a9131ef2a97d1fe',
      fr: '4f8999eec6e676a5',
      de: 'fdfd902305b9c605',
      it: 'ce565fec65e43940',
      ja: '50252f4a8622ec62',
      ko: '4f82f3ed6720ed2d',
      pl: 'bac672050325d963',
      pt: '8231cf1ac484155a',
      ro: 'f3f8c94ab7506382',
      ru: '919ecc810011c8c2',
      es: '5297f0892624e4d3',
      th: '36c6d5b1e745c1cc',
      vi: '3a8c6ffe4995e4b5',
      ar: 'bab6d323f841da3d',
      bn: '24695237172f0c4c',
      ca: '6297bf6736196029',
      cs: 'cee2d40d6c135436',
      el: '3d41c2b15557f4a9',
      eu: '86d265cc5132738b',
      fa: 'c1d2192919c9947d',
      fil: 'f679c6cf77cf9c4f',
      hi: '4b7017d5dc8e261b',
      hu: '593bf85c26356aea',
      id: '8fbda0dd199e550e',
      'sr-Latn': 'b5c6b1e89b21b300',
      tr: '349144bb53714a90',
      uk: 'a325be8d098c11a7',
      ur: '53c63173fde764b7',
      'zh-Hant': '09a7f23de91cbbb0',
    });
  });
});
