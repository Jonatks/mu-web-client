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

    expect(KEYS.length).toBe(2752);
    expect(hashes).toEqual({
      en: 'e39e6fc2f4007f60',
      bg: '3567ccc87c6a68fc',
      zh: 'efee268ad0bc5c2f',
      fr: 'c605fb0d5618a435',
      de: '93332faa5f40dfcf',
      it: '9fffe627b02b7e58',
      ja: '6feba08f4d825e49',
      ko: 'ba56ac8d864ae5d0',
      pl: '218e7d136e423c08',
      pt: 'fc4ecae50cdd706f',
      ro: '0c7adf279d19aa1d',
      ru: 'e56568b720a6ca93',
      es: 'c07fb61ace047e92',
      th: 'adc3ce581f246229',
      vi: 'f8606cc34ba1c17f',
      ar: '40525af2822b793b',
      bn: 'b2d0c4efecd1ad6b',
      ca: '4c590fbd0346e2c1',
      cs: '921162cfcaddcd41',
      el: 'e471b04bce0aad38',
      eu: 'b20f44890931a872',
      fa: '8f5a34ca7a6e1993',
      fil: 'd0821d6c35a19c0a',
      hi: '73b0a8d77d4e1b9e',
      hu: '1056338b85e23e53',
      id: '72bc42f6c4f2b00e',
      'sr-Latn': '582686ea45fd8a69',
      tr: '46379a121b6bf8fa',
      uk: '3818182c6d18ac2b',
      ur: 'ed772ad3987ee33c',
      'zh-Hant': '57f17a06a6af818a',
    });
  });
});
