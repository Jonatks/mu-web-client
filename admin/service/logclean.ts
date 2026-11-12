// Cleans the change log: old audit lines and the copies kept for undo. Never removes what the panel still needs:
// server settings saved since the last restart (the page counts them as "waiting for a restart"), and, unless asked,
// changes that can still be undone.
import { appendFileSync, existsSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIR } from './undo';

type Line = { id?: string; at?: string; action?: string };
const audit = (dir: string) => join(dir, 'audit.jsonl');
const undoDir = (dir: string) => join(dir, 'undo');
const idOf = (file: string) => file.replace(/\.json(\.done)?$/, '');
const idTime = (id: string) => parseInt(id.split('-')[0] ?? '', 36);

function readLines(dir: string): { raw: string; e: Line | null }[] {
  if (!existsSync(audit(dir))) return [];
  return readFileSync(audit(dir), 'utf8').split('\n').filter(Boolean).map(raw => { try { return { raw, e: JSON.parse(raw) as Line }; } catch { return { raw, e: null }; } });
}
const undoFiles = (dir: string) => (existsSync(undoDir(dir)) ? readdirSync(undoDir(dir)).filter(f => /\.json(\.done)?$/.test(f)) : []);

export function logStats(dir = DIR) {
  const lines = readLines(dir);
  const files = undoFiles(dir);
  const bytes = (f: string) => { try { return statSync(f).size; } catch { return 0; } };
  const times = lines.map(l => Date.parse(l.e?.at ?? '')).filter(Number.isFinite);
  return {
    entries: lines.length,
    oldest: times.length ? new Date(Math.min(...times)).toISOString() : null,
    bytes: bytes(audit(dir)),
    undoable: files.filter(f => f.endsWith('.json')).length,
    undone: files.filter(f => f.endsWith('.done')).length,
    undoBytes: files.reduce((n, f) => n + bytes(join(undoDir(dir), f)), 0),
  };
}

/** Removes entries older than `before` (a time in ms, or null for everything). `undo` also removes the copies that could still be undone. */
export function cleanLog(dir = DIR, o: { before: number | null; undo: boolean; dryRun?: boolean; admin?: string }) {
  const lines = readLines(dir);
  const live = new Set(undoFiles(dir).filter(f => f.endsWith('.json')).map(idOf));
  const restarts = lines.map(l => l.e).filter(e => e?.action === 'server.restart').map(e => Date.parse(e!.at ?? '')).filter(Number.isFinite);
  const lastRestart = restarts.length ? Math.max(...restarts) : 0;
  const waiting = (e: Line) => /^(undo:)?server\./.test(e.action ?? '') && Date.parse(e.at ?? '') > lastRestart;
  const isLastRestart = (e: Line) => e.action === 'server.restart' && Date.parse(e.at ?? '') === lastRestart;
  const why = (e: Line | null): 'drop' | 'waiting' | 'newer' | 'undoable' => {
    if (!e) return 'waiting';
    if (waiting(e) || isLastRestart(e)) return 'waiting';
    if (o.before !== null && Date.parse(e.at ?? '') >= o.before) return 'newer';
    if (!o.undo && !!e.id && live.has(e.id)) return 'undoable';
    return 'drop';
  };
  const kept = lines.filter(l => why(l.e) !== 'drop');
  const keptBecause = { waiting: 0, newer: 0, undoable: 0 };
  for (const l of kept) keptBecause[why(l.e) as 'waiting' | 'newer' | 'undoable']++;
  const keptIds = new Set(kept.map(l => l.e?.id).filter(Boolean) as string[]);
  const cutoff = o.before ?? Infinity;
  const doomed = undoFiles(dir).filter(f => !keptIds.has(idOf(f)) && idTime(idOf(f)) < cutoff && (f.endsWith('.done') || o.undo));
  const result = { removedEntries: lines.length - kept.length, removedUndoFiles: doomed.length, keptEntries: kept.length, keptBecause };
  if (o.dryRun || (result.removedEntries === 0 && doomed.length === 0)) return result;
  const tmp = audit(dir) + '.tmp';
  writeFileSync(tmp, kept.map(l => l.raw + '\n').join(''), { mode: 0o600 });
  renameSync(tmp, audit(dir));
  for (const f of doomed) { try { unlinkSync(join(undoDir(dir), f)); } catch { /* already gone */ } }
  appendFileSync(audit(dir), JSON.stringify({ id: crypto.randomUUID(), at: new Date().toISOString(), admin: o.admin ?? 'panel', action: 'log.clean', target: 'audit', undoable: false, detail: result }) + '\n', { mode: 0o600 });
  return result;
}
