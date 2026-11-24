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

    expect(KEYS.length).toBe(2781);
    expect(hashes).toEqual({
      en: 'fc09f3d9f53bc3b5',
      bg: 'e558cae4288c03dc',
      zh: 'd4c2259e37c862e7',
      fr: '32e3878e3b20308f',
      de: 'fd0f9e01fbb3e941',
      it: '35bdcb81e4b7c88f',
      ja: '94b07aa71986ace4',
      ko: '4ddd0cb23f880572',
      pl: 'ea71a691f6352d03',
      pt: '1be5632c1fd9334e',
      ro: '1d568e56e28b227e',
      ru: '1cadf58032baee71',
      es: '27fca05aa42d623f',
      th: 'de002dd0787c2169',
      vi: '1232ed547379c249',
      ar: '0095af7026f545ad',
      bn: '94afd58f1b68e2e8',
      ca: 'bc3087dcbccdd20b',
      cs: 'd7038d522c8f695b',
      el: '69704da835bca0f7',
      eu: '84c45ef29726287e',
      fa: '2c49867461d458e9',
      fil: '9646ee7d8bb4bef2',
      hi: '36a29d6bbea7a9ae',
      hu: '4153098db5232f93',
      id: 'dc2e4d96328e595e',
      'sr-Latn': '737131e9a2e7ddb1',
      tr: 'aab621613e5fbe92',
      uk: 'c64fc6d121ed3b6f',
      ur: 'f4cc67151785e633',
      'zh-Hant': '1649739fbb00f9b9',
    });
  });
});
