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

    expect(KEYS.length).toBe(2784);
    expect(hashes).toEqual({
      en: '3db1bec587103a7f',
      bg: '330e8629c505e77e',
      zh: '0e52603c9fb75c25',
      fr: 'f201042b80377098',
      de: 'd43bdbae4f70a27c',
      it: '7e79aa19cf6699f5',
      ja: 'fe5cab54881ed910',
      ko: 'a45286cb3fd10864',
      pl: '9f8c85491358689b',
      pt: 'e41d5bd884c05717',
      ro: 'b6b844b67d71c3aa',
      ru: '428e055824086f69',
      es: '0eb666957d37aeb2',
      th: '7f5fb0746b246a5a',
      vi: 'f618314e7a5a1e95',
      ar: '116e04e496d9cb4d',
      bn: '15d71b047f4ba0bd',
      ca: '1e5d968a4a5dd8b3',
      cs: '5f69d2f3feaf0257',
      el: 'f4ecd51c7c25d4df',
      eu: '2f31aec7b39b49b0',
      fa: 'e2b9be05f94e9e52',
      fil: '0b49b768a907dd2a',
      hi: '9f9aaacfd180827d',
      hu: '4be998270f0332a6',
      id: '50f41b14be35c877',
      'sr-Latn': '77286010d6b18107',
      tr: '8ba02def596447fa',
      uk: '12c2ff26e6707bbf',
      ur: '163ddea4583fd5b0',
      'zh-Hant': 'c440225540c9ffbb',
    });
  });
});
