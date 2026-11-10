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

    expect(KEYS.length).toBe(2643);
    expect(hashes).toEqual({
      en: '4bc40ba6bacbbf06',
      bg: '881223e04cb9fd6d',
      zh: '7b154e1c237beb83',
      fr: 'f17234de4cfab654',
      de: 'b7c63095423c62b3',
      it: '0e7887477b3d44e1',
      ja: '950ed0b902059d46',
      ko: 'dfcddb056f900432',
      pl: '8c094c45e646ea71',
      pt: '8f1dc8ab37c90384',
      ro: '7c8b3bd3d0cab2c8',
      ru: '4914258e06966ccd',
      es: '873ba8ccf2808fe5',
      th: '171bf520d6195d80',
      vi: '6fad8726c5b9d54d',
      ar: '1f46efe2ad63081f',
      bn: '90528eece4f6b0a6',
      ca: '3aa14244984e1485',
      cs: '56999ec6a57608b2',
      el: 'e10a80114eddbead',
      eu: 'c0d34340bcd1fc6b',
      fa: 'b31a6fbb3a4646ce',
      fil: '06a6539eeddc7e0c',
      hi: '2006918f9079fa61',
      hu: '6e401046e6018cc2',
      id: '4460c617bd9cfe2f',
      'sr-Latn': 'f22432e4340464b8',
      tr: '0b44653d53577fe7',
      uk: '272249687fcff8ee',
      ur: '524b13c158f5d4c9',
      'zh-Hant': 'ef0d158e7c24e7cc',
    });
  });
});
