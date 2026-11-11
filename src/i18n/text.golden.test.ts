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

    expect(KEYS.length).toBe(2704);
    expect(hashes).toEqual({
      en: '8ff65ec889cb9941',
      bg: '81647d96e842f964',
      zh: '079b3bfbcd0bef8d',
      fr: '28d9a32eed2778a9',
      de: 'ce520755a570945c',
      it: 'c89353a0b7a77de3',
      ja: '118cb6b9e1517006',
      ko: 'f8b82068907d5356',
      pl: 'fe338f59a911ab5c',
      pt: '572d8a3f4fe12b97',
      ro: 'e764927d6223952a',
      ru: 'beb916687079ca12',
      es: '0d9986ea534c6e6c',
      th: 'a0ddd538136a47a1',
      vi: '2afcc36244c18bc6',
      ar: '9a5c80f2b4c4bce4',
      bn: '24cfa492488f4839',
      ca: '55b7d86577b51514',
      cs: '598a272340221592',
      el: 'bf6a11f0e8947e4c',
      eu: 'dcb0ace3594370a7',
      fa: '394d99abc06690ff',
      fil: '2ab038d44980ac7f',
      hi: '040ff8104d30a12f',
      hu: 'ae6f9501ea5a7b00',
      id: '7a049bc1a47d5941',
      'sr-Latn': '4d23c3847667428c',
      tr: '748335e517d08a30',
      uk: 'ad33eb50cc9105c3',
      ur: '15da5172a6ed513a',
      'zh-Hant': '97c75dee6b8f4e2f',
    });
  });
});
