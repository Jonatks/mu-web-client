# ciphers

The eight block ciphers ModulusCryptor picks from, decryption only, ECB, ported from Crypto++
(the library the original client links) with its defaults: TEA (32 rounds), 3-Way (11), CAST-128,
RC5-32/16, RC6 (20), MARS, IDEA and GOST (Crypto++ S-boxes). Keys are cut to each cipher's default
length (16 bytes, 12 for 3-Way, 32 for GOST). `tables.ts` holds the CAST-128 and MARS boxes.
`modulusCryptor.test.ts` checks each against Crypto++'s test vectors.
