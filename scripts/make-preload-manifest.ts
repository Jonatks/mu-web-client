import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const root = join(import.meta.dir, '..', 'public');
const dirs = ['game-assets/World1', 'game-assets/Object1', 'game-assets/Player'];

function walk(d: string): string[] {
  return readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]
  );
}

const files = dirs.flatMap(d => walk(join(root, d))).map(p => ({
  u: './' + relative(root, p).replaceAll('\\', '/'),
  s: statSync(p).size,
}));
writeFileSync(join(root, 'preload-manifest.json'), JSON.stringify({ files }));
console.log(files.length, 'archivos,', Math.round(files.reduce((a, f) => a + f.s, 0) / 1e6), 'MB');
