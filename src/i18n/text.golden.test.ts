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

    expect(KEYS.length).toBe(2777);
    expect(hashes).toEqual({
      en: '88014fbbffc60a78',
      bg: '5411e149b16424fd',
      zh: '17edc7f3233660b9',
      fr: 'b6d01f04bb376439',
      de: 'bcaf758238545637',
      it: '28e1b86c5fafcbba',
      ja: 'd66f0c0ca88e8f98',
      ko: '25743d2a1d3abdef',
      pl: '8ece64226b48f86c',
      pt: 'a1354d167db269f7',
      ro: '80bbab7d94932910',
      ru: 'e15fb40951a8102a',
      es: 'd44175ca8d46328c',
      th: 'bd289729440c7996',
      vi: '6efa24610e3d40e8',
      ar: '78e21bf52c191e92',
      bn: 'eb0f258e6b10a043',
      ca: '562a4eb9f5b94929',
      cs: '6c898161ab71595f',
      el: 'e82b01b07c91e4e0',
      eu: '4c828658e020ba3b',
      fa: '4b49fa9e41774459',
      fil: '2face4a8d3886b2d',
      hi: 'f651a6f5e80926a1',
      hu: '2b17e47b78edccca',
      id: '9b2f5492a251d456',
      'sr-Latn': '4d7ce2cb010947eb',
      tr: '818b2ac37c77acdc',
      uk: 'a7b0c379d3d36405',
      ur: '064edbc53292667b',
      'zh-Hant': '840495c542721b39',
    });
  });
});
