# Original art (long term)

The game files of Webzen stay private. The way out is to replace them one system at a time, always keeping the 1:1 behaviour:
1. Item icons (`public/items`): they are renders of the original models; redraw as 2D art, same 8-bit alpha, same size per footprint.
2. UI sprites (`newui_*`): the code reads them from `Data/Interface`; a texture pack (`public/packs/<pack>/`, listed in `public/packs/index.json`)
   already swaps textures without touching code, so an original pack can ship in a public repo.
3. Sounds and music: replace by file name; the client already asks for `.ogg`.
4. Models and maps: last, the largest. Start with the 10 most seen (hero bodies, Lorencia objects).
Rule: nothing derived from Webzen files in a public repo until its replacement exists.
