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

    expect(KEYS.length).toBe(2743);
    expect(hashes).toEqual({
      en: 'a17c030ec11397f1',
      bg: '6b21ae2e9358bee4',
      zh: 'f42be624f7ae381e',
      fr: '482925f61cd2141c',
      de: '74bebe9ee9d4a34a',
      it: '892f4f03e33e1cc6',
      ja: '97359fde42eb1826',
      ko: '6cca6ffa5c0b2841',
      pl: '63ae295a505c7b70',
      pt: 'f37980e62381963d',
      ro: 'f366cfe51bd84634',
      ru: '04c20e7cd47f01eb',
      es: '71bcaa803866b56e',
      th: '4363efb730b741fa',
      vi: '484fbecef7e98a3c',
      ar: 'f9a6a951270c538a',
      bn: '4ff7fb805edd34a9',
      ca: 'c0285cd1ef8642b1',
      cs: 'd4e25d677ebdb977',
      el: '8f480e8f5bca05e6',
      eu: '52d2b4c372709979',
      fa: '63cc5013978204cb',
      fil: 'fbdac1406c7e5059',
      hi: '64fd101c3784ff5a',
      hu: 'd76c3a3a077eb546',
      id: '350e3a28e5d67c01',
      'sr-Latn': '04f775ec0f8e54f3',
      tr: '9d32491050bfc57a',
      uk: '09084ccb21c1bc17',
      ur: '66d2cd3546703ca9',
      'zh-Hant': 'f2ffb5ccb02c4b00',
    });
  });
});
