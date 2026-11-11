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

    expect(KEYS.length).toBe(2680);
    expect(hashes).toEqual({
      en: 'fd1cfe3940023a50',
      bg: 'd18bfacbb99be1ef',
      zh: 'f5bde5c0a3ee3fab',
      fr: 'e09f3961199dd9ab',
      de: 'c9480e50fe4078d2',
      it: '0eb67c4ebc82e88e',
      ja: '9c759caffec1da9d',
      ko: 'f585ab2075797fd4',
      pl: 'ff87f7dc3ed61a46',
      pt: '2ae61aed5ea4b329',
      ro: 'fc5ac0d03956719a',
      ru: 'f348030bff134686',
      es: 'dc09b52d04c889f9',
      th: '605136f96ba1639c',
      vi: 'd6d84e84242aee04',
      ar: 'e16f84f7307f922f',
      bn: '4e885bd125b8c9dd',
      ca: 'f719a54c676d4d00',
      cs: 'a28355c508d01bbc',
      el: '26f0ce831e08cf18',
      eu: '116d3b14e768d92e',
      fa: 'ac43564ef985128a',
      fil: 'c58047d31e227931',
      hi: '6338b78ceab7c914',
      hu: 'ac1716749ae87ff4',
      id: 'a923f0b81889ae26',
      'sr-Latn': '3af27b3c3cbee3bd',
      tr: 'c66ef8d23af0877c',
      uk: 'da3d6106bfc9ad00',
      ur: 'aec4408de49ce5a8',
      'zh-Hant': '7e8e19c78081bcf8',
    });
  });
});
