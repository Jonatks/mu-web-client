// HTTP routes of the admin service. Every request needs the key; every write needs a named admin and an empty server.
import type { Sql } from 'postgres';
import * as accounts from './accounts';
import { isBrowserRequest, keyMatches } from './auth';
import * as characters from './characters';
import * as extras from './extras';
import { HttpError, bad, missing } from './errors';
import { GateError, assertNobodyConnected } from './gate';
import * as items from './items';
import * as server from './server';
import { disconnectAccount, readOnline } from './bridge';
import { kickAll, restartServer } from './kick';
import * as skills from './skills';
import { auditTail, recentUndo, undo } from './undo';

export type Config = { key: string; gateFile: string; bridgeDir: string; sql: Sql };

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });

export function createApp(cfg: Config) {
  const { sql } = cfg;
  const gated = <T>(fn: () => Promise<T>) => {
    assertNobodyConnected(cfg.gateFile);
    return fn();
  };

  async function route(req: Request, url: URL, admin: string): Promise<unknown> {
    const p = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    const q = url.searchParams;
    const m = req.method;
    const body = async (max = 16_384): Promise<Record<string, unknown>> => {
      const t = await req.text();
      if (t.length > max) throw new HttpError(413, 'Body too large.');
      try { return t ? (JSON.parse(t) as Record<string, unknown>) : {}; } catch { throw bad('Body is not JSON.'); }
    };
    const needAdmin = () => {
      if (!/^[A-Za-z0-9_.-]{1,32}$/.test(admin)) throw bad('x-admin-user is required for writes.');
    };

    if (p[0] === 'status' && m === 'GET') {
      let gate: { ok: boolean; message: string } = { ok: true, message: 'nobody connected' };
      try { assertNobodyConnected(cfg.gateFile); } catch (e) { gate = { ok: false, message: (e as Error).message }; }
      const n = await sql`SELECT (SELECT count(*)::int FROM data."Account") AS accounts, (SELECT count(*)::int FROM data."Character") AS characters`;
      return { gate, ...n[0] };
    }
    if (p[0] === 'players' && p[1] === 'online' && m === 'GET') { const o = readOnline(cfg.bridgeDir); return { bridge: o !== null, players: o?.players ?? [] }; }
    if (p[0] === 'players' && p[1] === 'disconnect' && m === 'POST') {
      needAdmin();
      const b = await body();
      return typeof b.login === 'string' && b.login ? disconnectAccount(cfg.bridgeDir, b.login, admin) : kickAll(cfg.gateFile, admin);
    }
    if (p[0] === 'accounts') {
      if (m === 'GET' && p.length === 1) return accounts.listAccounts(sql, q.get('q') ?? '');
      if (m === 'POST' && p.length === 1) { needAdmin(); const b = await body(); return accounts.createAccount(sql, admin, b.login, b.password, b.state); }
      const login = p[1] ?? '';
      if (m === 'GET' && p.length === 2) return accounts.getAccount(sql, login);
      if (m === 'DELETE' && p.length === 2) { needAdmin(); const b = await body(); return gated(() => accounts.deleteAccount(sql, admin, login, b.confirm)); }
      if (m === 'PATCH' && p.length === 2) { needAdmin(); const b = await body(); return gated(() => accounts.patchAccount(sql, admin, login, b)); }
      if (m === 'POST' && p[2] === 'password') { needAdmin(); const b = await body(); return gated(() => accounts.setPassword(sql, admin, login, b.password)); }
      if (p[2] === 'vault') {
        if (m === 'GET' && p.length === 3) return items.getVault(sql, login);
        if (m === 'PATCH' && p.length === 3) { needAdmin(); const b = await body(); return gated(() => items.setVaultZen(sql, admin, login, b.zen)); }
        if (m === 'POST' && p[3] === 'items') { needAdmin(); const b = await body(); return gated(() => items.addItem(sql, admin, { kind: 'vault', login }, b as items.NewItem)); }
        if (m === 'DELETE' && p[3] === 'items' && p[4]) { needAdmin(); return gated(() => items.deleteItem(sql, admin, { kind: 'vault', login }, p[4]!)); }
      }
      if (p[2] === 'classes') {
        if (m === 'GET') return extras.listUnlockedClasses(sql, login);
        if (m === 'POST') { needAdmin(); const b = await body(); return gated(() => extras.setUnlockedClasses(sql, admin, login, b.classIds)); }
      }
      if (p[2] === 'cashshop') {
        if (m === 'GET') return extras.listCashShop(sql, login);
        if (m === 'POST') { needAdmin(); const b = await body(); return gated(() => extras.addCashShopItem(sql, admin, login, b)); }
        if (m === 'DELETE' && p[3]) { needAdmin(); return gated(() => extras.deleteCashShopItem(sql, admin, login, p[3]!)); }
      }
      if (m === 'POST' && p[2] === 'state') { needAdmin(); const b = await body(); return gated(() => accounts.setState(sql, admin, login, b.state)); }
    }
    if (p[0] === 'maps' && m === 'GET') return characters.listMaps(sql);
    if (p[0] === 'classes' && m === 'GET') return characters.listClasses(sql);
    if (p[0] === 'skills' && p[1] === 'definitions' && m === 'GET') return skills.searchSkills(sql, q.get('q') ?? '', q.get('character') ?? '');
    if (p[0] === 'characters') {
      if (m === 'GET' && p.length === 1) return characters.listCharacters(sql, q.get('q') ?? '', q.get('account') ?? '');
      const name = p[1] ?? '';
      if (m === 'GET' && p.length === 2) return characters.getCharacter(sql, name);
      if (m === 'PATCH' && p.length === 2) { needAdmin(); const b = await body(); return gated(() => characters.patchCharacter(sql, admin, name, b)); }
      if (m === 'DELETE' && p.length === 2) { needAdmin(); const b = await body(); return gated(() => characters.deleteCharacter(sql, admin, name, b.confirm)); }
      if (p[2] === 'quests') {
        if (m === 'GET') return extras.listQuests(sql, name);
        if (m === 'POST' && p[3]) { needAdmin(); const b = await body(); return gated(() => extras.setQuestState(sql, admin, name, p[3], b)); }
        if (m === 'DELETE') { needAdmin(); return gated(() => extras.resetQuests(sql, admin, name, p[3] === undefined ? undefined : Number(p[3]))); }
      }
      if (p[2] === 'letters') {
        if (m === 'GET') return extras.listLetters(sql, name);
        if (m === 'POST') { needAdmin(); const b = await body(); return gated(() => extras.sendLetter(sql, admin, name, b)); }
        if (m === 'DELETE' && p[3]) { needAdmin(); return gated(() => extras.deleteLetter(sql, admin, name, p[3]!)); }
      }
      if (p[2] === 'gens') {
        if (m === 'GET') return extras.getGens(sql, name);
        if (m === 'POST') { needAdmin(); const b = await body(); return gated(() => extras.setGens(sql, admin, name, b)); }
        if (m === 'DELETE') { needAdmin(); return gated(() => extras.leaveGens(sql, admin, name)); }
      }
      if (p[2] === 'skills') {
        if (m === 'GET' && p[3] === 'available') return skills.availableSkills(sql, name);
        if (m === 'GET') return skills.listSkills(sql, name);
        if (m === 'POST') { needAdmin(); const b = await body(); return gated(() => skills.addSkill(sql, admin, name, b.skillId, b.level)); }
        if (m === 'PATCH' && p[3]) { needAdmin(); const b = await body(); return gated(() => skills.setSkillLevel(sql, admin, name, p[3]!, b.level)); }
        if (m === 'DELETE' && p[3]) { needAdmin(); return gated(() => skills.removeSkill(sql, admin, name, p[3]!)); }
      }
      if (p[2] === 'items') {
        if (m === 'GET') return items.listItems(sql, name);
        if (m === 'POST') { needAdmin(); const b = await body(); return gated(() => items.addItem(sql, admin, { kind: 'inventory', name }, b as items.NewItem)); }
        if (m === 'DELETE' && p[3]) { needAdmin(); return gated(() => items.deleteItem(sql, admin, { kind: 'inventory', name }, p[3]!)); }
      }
    }
    if (p[0] === 'items' && p[1] && p[1] !== 'definitions') {
      if (m === 'PATCH' && p.length === 2) { needAdmin(); const b = await body(); return gated(() => items.editItem(sql, admin, p[1]!, b as items.ItemEdit)); }
      if (m === 'POST' && p[2] === 'move') { needAdmin(); const b = await body(); return gated(() => items.moveItem(sql, admin, p[1]!, b as items.ItemMove)); }
    }
    if (p[0] === 'items' && p[1] === 'categories' && m === 'GET') return items.itemCategories(sql, q.get('slot') ?? '', q.get('character') ?? '');
    if (p[0] === 'items' && p[1] === 'definitions' && m === 'GET') {
      if (p[2]) return items.definitionOptions(sql, p[2]);
      return items.searchDefinitions(sql, q.get('q') ?? '', q.get('group') ?? '', q.get('slot') ?? '', q.get('character') ?? '', q.get('cat') ?? '');
    }
    if (p[0] === 'server') {
      const id = p[2] ?? '';
      switch (p[1]) {
        case 'restart':
          if (m === 'POST') { needAdmin(); return restartServer(cfg.gateFile, admin); }
          break;
        case 'rules':
          if (m === 'GET') return server.getRules(sql);
          if (m === 'POST') { needAdmin(); return server.setRules(sql, admin, await body()); }
          break;
        case 'maps':
          if (m === 'GET' && p.length === 2) return server.listMaps(sql);
          if (m === 'GET' && p[3] === 'terrain') return server.terrain(sql, id);
          if (m === 'POST' && p.length === 3) { needAdmin(); return server.setMap(sql, admin, id, await body()); }
          break;
        case 'drops':
          if (m === 'GET') return server.listDrops(sql);
          if (m === 'POST' && p[2] === 'scale') { needAdmin(); return server.scaleDrops(sql, admin, await body()); }
          if (m === 'POST' && p.length === 3) { needAdmin(); return server.setDrop(sql, admin, id, await body()); }
          break;
        case 'monsters':
          if (m === 'GET' && p.length === 2) return server.listMonsters(sql, q.get('q') ?? '', q.get('kind') ?? '');
          if (m === 'GET' && p.length === 3) return server.getMonster(sql, id);
          if (m === 'POST' && p.length === 3) { needAdmin(); return server.setMonster(sql, admin, id, await body()); }
          break;
        case 'spawns':
          if (m === 'GET') return server.listSpawns(sql, q.get('map') ?? '', q.get('monster') ?? '');
          if (m === 'POST' && p.length === 2) { needAdmin(); return server.addSpawn(sql, admin, await body()); }
          if (m === 'POST' && p.length === 3) { needAdmin(); return server.editSpawn(sql, admin, id, await body()); }
          if (m === 'DELETE' && p.length === 3) { needAdmin(); return server.deleteSpawn(sql, admin, id); }
          break;
        case 'shops':
          if (m === 'GET' && p.length === 2) return server.listShops(sql);
          if (m === 'GET' && p.length === 3) return items.getShop(sql, id);
          if (m === 'POST' && p[3] === 'items') { needAdmin(); const b = await body(); return items.addItem(sql, admin, { kind: 'shop', monsterId: id }, b as items.NewItem); }
          if (m === 'DELETE' && p[3] === 'items' && p[4]) { needAdmin(); return items.deleteItem(sql, admin, { kind: 'shop', monsterId: id }, p[4]); }
          break;
        case 'events':
          if (m === 'GET') return server.listEvents(sql);
          if (m === 'POST' && p.length === 3) { needAdmin(); return server.setEvent(sql, admin, id, await body()); }
          break;
        case 'warps':
          if (m === 'GET') return server.listWarps(sql);
          if (m === 'POST' && p.length === 3) { needAdmin(); return server.setWarp(sql, admin, id, await body()); }
          break;
        case 'plugins':
          if (m === 'GET') return server.listPlugins(sql, q.get('all') === '1');
          if (m === 'POST' && p.length === 3) { needAdmin(); return server.setPlugin(sql, admin, id, await body(200_500)); }
          break;
      }
    }
    if (p[0] === 'audit' && m === 'GET') return auditTail(Number(q.get('limit') ?? 100));
    if (p[0] === 'undo' && m === 'GET') return recentUndo();
    if (p[0] === 'undo' && m === 'POST' && p[1]) { needAdmin(); return gated(() => undo(sql, p[1]!, admin)); }
    throw missing('No such route.');
  }

  return async function handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/health') return json({ ok: true });
    if (isBrowserRequest(req.headers)) return json({ error: 'forbidden' }, 403);
    if (!keyMatches(req.headers.get('x-admin-key'), cfg.key)) {
      await Bun.sleep(300);
      return json({ error: 'unauthorized' }, 401);
    }
    try {
      return json(await route(req, url, req.headers.get('x-admin-user') ?? ''));
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      if (e instanceof GateError) return json({ error: e.message, code: 'players_connected' }, 409);
      if ((e as { code?: string }).code === '22P02') return json({ error: 'Malformed id.' }, 400);
      console.error('request failed', req.method, url.pathname, (e as Error).message);
      return json({ error: 'internal error' }, 500);
    }
  };
}
