// Se ejecuta EN LA VM contra la copia de pruebas (nunca contra openmu). Cambia cosas, las restablece y las deshace.
//   DATABASE_URL=postgres://.../openmu_probe ADMIN_DATA_DIR=/tmp/ad bun run reset-check.ts /var/lib/mu-admin/defaults.json.gz
import postgres from 'postgres';
import { loadDefaults, resetTab } from './defaults';
import { undo } from './undo';

const url = process.env.DATABASE_URL ?? '';
if (!/openmu_probe/.test(url)) throw new Error('DATABASE_URL must point at openmu_probe');
const sql = postgres(url, { max: 2 });
const defaults = loadDefaults(process.argv[2]);
if (!defaults) throw new Error('no defaults file');
const ok = (name: string, cond: boolean, extra = '') => console.log(`${cond ? 'ok  ' : 'FAIL'} ${name} ${extra}`);

const rate = async () => Number((await sql`SELECT "ExperienceRate" AS v FROM config."GameConfiguration"`)[0]!.v);
const spawns = async () => Number((await sql`SELECT count(*) AS n FROM config."MonsterSpawnArea"`)[0]!.n);
const shopItems = async () => Number((await sql`SELECT count(*) AS n FROM data."Item" WHERE "ItemStorageId" IN (SELECT "MerchantStoreId" FROM config."MonsterDefinition" WHERE "MerchantStoreId" IS NOT NULL)`)[0]!.n);
const drops = async () => Number((await sql`SELECT coalesce(sum("Chance"),0) AS s FROM config."DropItemGroup"`)[0]!.s);
const warps = async () => Number((await sql`SELECT coalesce(sum("Costs"),0) AS s FROM config."WarpInfo"`)[0]!.s);

const before = { rate: await rate(), spawns: await spawns(), shop: await shopItems(), drops: await drops(), warps: await warps() };
console.log('start', before);

await sql`UPDATE config."GameConfiguration" SET "ExperienceRate" = 777`;
await sql`DELETE FROM config."MonsterSpawnArea" WHERE "Id" IN (SELECT "Id" FROM config."MonsterSpawnArea" LIMIT 3)`;
await sql`UPDATE config."DropItemGroup" SET "Chance" = LEAST(1, "Chance" * 0.5) WHERE "Chance" < 1`;
await sql`UPDATE config."WarpInfo" SET "Costs" = "Costs" + 1000`;
await sql`DELETE FROM data."ItemItemOfItemSet" WHERE "ItemId" IN (SELECT "Id" FROM data."Item" WHERE "ItemStorageId" IN (SELECT "MerchantStoreId" FROM config."MonsterDefinition" WHERE "MerchantStoreId" IS NOT NULL) LIMIT 2)`.catch(() => {});
const shopVictims = (await sql`SELECT "Id" FROM data."Item" WHERE "ItemStorageId" IN (SELECT "MerchantStoreId" FROM config."MonsterDefinition" WHERE "MerchantStoreId" IS NOT NULL) LIMIT 2`).map(r => r.Id as string);
await sql`DELETE FROM data."ItemOptionLink" WHERE "ItemId" = ANY(${shopVictims}::uuid[])`;
await sql`DELETE FROM data."ItemItemOfItemSet" WHERE "ItemId" = ANY(${shopVictims}::uuid[])`;
await sql`DELETE FROM data."Item" WHERE "Id" = ANY(${shopVictims}::uuid[])`;
const changed = { rate: await rate(), spawns: await spawns(), shop: await shopItems(), drops: await drops(), warps: await warps() };
console.log('changed', changed);

const undoIds: string[] = [];
for (const tab of ['rules', 'spawns', 'drops', 'warps', 'shops']) {
  const r = await resetTab(sql, 'check', tab, defaults);
  undoIds.push(r.undoId);
  ok(`reset ${tab} changed rows`, r.result.changed > 0, String(r.result.changed));
}
const after = { rate: await rate(), spawns: await spawns(), shop: await shopItems(), drops: await drops(), warps: await warps() };
console.log('after reset', after);
ok('rate is the default', after.rate === Number((defaults.GameConfiguration![0] as { ExperienceRate: number }).ExperienceRate));
ok('spawns count equals defaults', after.spawns === defaults.MonsterSpawnArea!.length);
for (const tab of ['rules', 'spawns', 'drops', 'warps', 'shops']) {
  const r = await resetTab(sql, 'check', tab, defaults);
  ok(`second reset of ${tab} changes nothing`, r.result.changed === 0, String(r.result.changed));
  undoIds.push(r.undoId);
}
for (const id of undoIds.slice(0, 5).reverse()) await undo(sql, id, 'check');
const undone = { rate: await rate(), spawns: await spawns(), shop: await shopItems(), drops: await drops(), warps: await warps() };
console.log('after undo', undone);
ok('undo brings back the changed state', JSON.stringify(undone) === JSON.stringify(changed));
await sql.end();
