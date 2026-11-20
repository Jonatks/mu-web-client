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

    expect(KEYS.length).toBe(2774);
    expect(hashes).toEqual({
      en: 'eb9d8d27968bf563',
      bg: 'e78919d1e5ee11ac',
      zh: 'a97f6b30441947c6',
      fr: '78c9972034f6b598',
      de: '52905d63a48e01f2',
      it: 'eac485340c773f67',
      ja: '1409ec311507ade0',
      ko: '7c09d18d355d3010',
      pl: 'f39674dd0d1341d1',
      pt: '22e0f8f34528c388',
      ro: 'caf7acff395ff5da',
      ru: '99e0b84925fc566a',
      es: '9f0b4ddce0102395',
      th: 'c2921eab919cef4c',
      vi: '5441551c434acb5e',
      ar: 'dd5f17879b980bab',
      bn: 'cad2c6e4975f8c26',
      ca: 'f457f878462738c7',
      cs: '88bd017b22abbe07',
      el: '0fa0c2d92cf56813',
      eu: '00f46873b7761008',
      fa: 'f6913e3f52b9e201',
      fil: 'aa96782d0cbf7732',
      hi: '42bc33e325e011bd',
      hu: '2a14fc624ed027f9',
      id: '491f36396b1f599e',
      'sr-Latn': 'f647d0da42da3613',
      tr: '07384aefac9945c7',
      uk: 'db21cdd22bb2f273',
      ur: 'd373b461d1cd57b1',
      'zh-Hant': 'b4f4219443d56e63',
    });
  });
});
