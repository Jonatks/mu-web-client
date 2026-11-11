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

    expect(KEYS.length).toBe(2688);
    expect(hashes).toEqual({
      en: 'e4e32fa86a5611d9',
      bg: 'f472fae06677c92a',
      zh: '802ac2c7b6612217',
      fr: '66b7ddb86cbc6d26',
      de: 'cdd496508ad42543',
      it: '6569a4d2e017454f',
      ja: 'a1e31aaf748fd9d4',
      ko: '4718edd2c643646b',
      pl: '6182b1edbc6b6ddc',
      pt: '48cfd28539296252',
      ro: 'eecd06d063321e93',
      ru: '6eb1d4b1da09f863',
      es: 'e490b4e6dc26af55',
      th: '4029c522f7b992a7',
      vi: '11fe08722a708fa4',
      ar: '4211d76be84e4ef7',
      bn: 'a3dd4a95e8274897',
      ca: '917cb3d685026bd4',
      cs: '9d9c9f41de7cc984',
      el: '921ffcb83c91a797',
      eu: '8bc844aad0d41c11',
      fa: '25e894e54d2c7a90',
      fil: 'e5dd0644871c959c',
      hi: 'b20ef84d6859745e',
      hu: 'fa1d688d987a7377',
      id: '617806eb7a08a6c4',
      'sr-Latn': '1d48de81a91e7ccd',
      tr: 'c7f683d6d6b90dfb',
      uk: '8ae39c2abfac93e0',
      ur: 'b4f1e0b439fbf6cc',
      'zh-Hant': '24e2950419597786',
    });
  });
});
