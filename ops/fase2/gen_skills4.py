# Fase 2d-1: las habilidades de cuarta clase del S19 (Skill/SkillList.xml, SkillLearn.xml, SkillRequire.xml) en OpenMU.
#   python3 ops/fase2/gen_skills4.py "<Data del servidor S19>"   escribe skills4.sql, skills4_undo.sql y skills4.json
# Cada habilidad se clona de una de Season 6 con la misma forma (golpe directo, area en el objetivo o buff) y toma los
# numeros del S19: dano, mana, AG, distancia, area, requisitos y clases. Su pergamino se clona de un orbe de S6.
import json, os, re, sys

DATA = sys.argv[1]
OUT = os.path.dirname(os.path.abspath(__file__))
# Numero S19 -> (forma, nombre corto de la carpeta del cliente). Las comunes del arbol Majestic (1125-1127) van en 2d-4.
SKILLS = {
    724: 'meteor_strike', 725: 'meteor_storm', 726: 'soul_seeker',
    723: 'fire_blow', 1501: 'sword_blow', 1503: 'strong_blessing',
    727: 'focus_shot', 2023: 'raining_arrow', 2025: 'holy_bolt',
    731: 'ice_blood', 732: 'fire_blood', 2012: 'chaos_blade', 733: 'dark_blast', 734: 'meteor_strike_mg', 2013: 'havok_spear',
    737: 'wind_soul', 2095: 'spirit_blast',
    288: 'death_scythe', 729: 'fire_beast', 730: 'aqua_beast',
    282: 'spirit_hook', 739: 'dark_phoenix_shot',
}
# Habilidad de S6 de la que se copia la mecanica: golpe directo (Meteorite), area en el objetivo (Cometfall), buff de grupo (Swell Life).
REF = {'direct': 2, 'area': 13, 'buff': 48}
CLASS = {'DW': (0, 2, 3), 'DK': (4, 6, 7), 'ELF': (8, 10, 11), 'MG': (12, 13, 13), 'DL': (16, 17, 17), 'SUM': (20, 22, 23), 'RF': (24, 25, 25)}
REQ = {'ReqLevel': 'Level', 'ReqEnergy': 'Total Energy', 'ReqStrength': 'Total Strength', 'RegAgility': 'Total Agility',
       'ReqVitality': 'Total Vitality', 'ReqLeaderShip': 'Total Leadership'}
ORB = (12, 7)  # Orb of Twisting Slash: el pergamino nuevo copia sus columnas

read = lambda p: open(os.path.join(DATA, p), encoding='utf-8-sig').read()
attrs = lambda a: dict(re.findall(r'(\w+)="([^"]*)"', a))
skills = {int(d['ID']): d for d in map(attrs, re.findall(r'<Skill (ID="\d+"[^>]+)/>', read('Skill/SkillList.xml')))}
learn = {int(d['SkillID']): (int(d['ItemCat']), int(d['ItemIndex'])) for d in map(attrs, re.findall(r'<Item ([^>]+)/>', read('Skill/SkillLearn.xml')))}
require = {int(d['ID']): d for d in map(attrs, re.findall(r'<Skill ([^>]+)/>', read('Skill/SkillRequire.xml')))}
items = {}
for cat, body in re.findall(r'<Category Index="(\d+)"[^>]*>(.*?)</Category>', read('Item/ItemList.xml'), re.S):
    for d in map(attrs, re.findall(r'<Item ([^>]+?)/?>', body)):
        items[(int(cat), int(d['Index']))] = d

q = lambda s: "'" + s.replace("'", "''") + "'"
sid = lambda n: f"'0000ba5e-0009-0001-0000-{n:012d}'"
aid = lambda n: f"'0000ba5e-0009-0002-0000-{n:012d}'"
AREA = '"UseFrustumFilter","FrustumStartWidth","FrustumEndWidth","FrustumDistance","UseTargetAreaFilter","TargetAreaDiameter","UseDeferredHits","DelayPerOneDistance","DelayBetweenHits","MinimumNumberOfHitsPerTarget","MaximumNumberOfHitsPerTarget","MaximumNumberOfHitsPerAttack","HitChancePerDistanceMultiplier","ProjectileCount","EffectRange","MinimumNumberOfHitsPerAttack"'
iid = lambda g, n: f"'00000080-{g:04x}-{n:04x}-0000-000000000000'"
S = lambda n: f'(select "Id" from config."Skill" where "Number"={n})'
A = lambda des: f'(select "Id" from config."AttributeDefinition" where "Designation"={q(des)})'

do = ['-- Fase 2d-1: habilidades de cuarta clase del S19 (generado por gen_skills4.py). Revertir: skills4_undo.sql', 'BEGIN;']
undo = ['BEGIN;']
client = []
for n, folder in SKILLS.items():
    d = skills[n]
    shape = 'buff' if d['Type'] == '-1' else 'area' if int(d['EffectRadio']) > 0 else 'direct'
    ref = REF[shape]
    dmg_type = {'0': 0, '1': 1}.get(d['Type'], -1)
    classes = [c for c, k in CLASS.items() if d.get(f'Allow{c}', '0') != '0']
    numbers = sorted({x for c in classes for x in (CLASS[c][int(d[f'Allow{c}']) - 1:] if d[f'Allow{c}'] in '123' else CLASS[c][2:])})
    do.append(f'-- {n} {d["Name"]} ({shape}, de {ref})')
    # Cada habilidad tiene su propia fila de area (indice unico): copia de la de la referencia.
    do.append(f'insert into config."AreaSkillSettings" ("Id",{AREA}) select {aid(n)},{AREA} from config."AreaSkillSettings" where "Id"=(select "AreaSkillSettingsId" from config."Skill" where "Number"={ref});')
    do.append(f'''insert into config."Skill" ("Id","ElementalModifierTargetId","MagicEffectDefId","MasterDefinitionId","GameConfigurationId","Number","Name","Range","DamageType","SkillType","Target","ImplicitTargetRange","TargetRestriction","MovesToTarget","MovesTarget","AttackDamage","AreaSkillSettingsId","NumberOfHitsPerAttack","SkipElementalModifier")
  select {sid(n)},"ElementalModifierTargetId","MagicEffectDefId",null,"GameConfigurationId",{n},{q(d["Name"])},{int(d["Distance"])},{dmg_type if shape != 'buff' else '"DamageType"'},"SkillType","Target",{int(d["EffectRadio"]) if shape != 'direct' else '"ImplicitTargetRange"'},"TargetRestriction","MovesToTarget","MovesTarget",{int(d["Damage"])},(select "Id" from config."AreaSkillSettings" where "Id"={aid(n)}),"NumberOfHitsPerAttack","SkipElementalModifier"
  from config."Skill" where "Number"={ref};''')
    do.append(f'insert into config."SkillCharacterClass" select {sid(n)}, "Id" from config."CharacterClass" where "Number" in ({",".join(map(str, numbers))});')
    reqs = [(REQ[k], int(d[k])) for k in REQ if int(d.get(k, '0') or 0) > 0]
    for des, v in reqs:
        do.append(f'insert into config."AttributeRequirement" ("Id","AttributeId","SkillId1","MinimumValue","MinimumItemLevel") values (gen_random_uuid(),{A(des)},{sid(n)},{v},0);')
    for des, k in (('Current Mana', 'ManaCost'), ('Current Ability', 'StaminaCost')):
        if int(d[k]) > 0:
            do.append(f'insert into config."AttributeRequirement" ("Id","AttributeId","SkillId","MinimumValue","MinimumItemLevel") values (gen_random_uuid(),{A(des)},{sid(n)},{int(d[k])},0);')
    scroll = learn.get(n)
    if scroll:
        g, i = scroll
        it = items.get(scroll, {})
        do.append(f'''insert into config."ItemDefinition" ("Id","ItemSlotId","ConsumeEffectId","SkillId","GameConfigurationId","Number","Width","Height","DropsFromMonsters","IsAmmunition","IsBoundToCharacter","Name","DropLevel","MaximumItemLevel","Durability","Group","Value","MaximumSockets","PetExperienceFormula","StorageLimitPerCharacter","MaximumDropLevel","IsQuestItem","IsDroppable","IsPersonalStoreSellable","IsRepairable","IsSellableToNpc","IsStorable","IsTradable","IntroducedIn","IsActive","PriceDefinitionId","ExcellentBonus","ExcellentRaisesLevel","StatProfileId")
  select {iid(g, i)},"ItemSlotId","ConsumeEffectId",{sid(n)},"GameConfigurationId",{i},1,1,false,"IsAmmunition","IsBoundToCharacter",{q(it.get("Name", "Scroll of " + d["Name"]))},{int(it.get("DropLevel", "100") or 100)},"MaximumItemLevel","Durability",{g},"Value","MaximumSockets","PetExperienceFormula","StorageLimitPerCharacter","MaximumDropLevel","IsQuestItem","IsDroppable","IsPersonalStoreSellable","IsRepairable","IsSellableToNpc","IsStorable","IsTradable","IntroducedIn","IsActive","PriceDefinitionId","ExcellentBonus","ExcellentRaisesLevel","StatProfileId"
  from config."ItemDefinition" where "Group"={ORB[0]} and "Number"={ORB[1]};''')
        do.append(f'insert into config."ItemDefinitionCharacterClass" select {iid(g, i)}, "Id" from config."CharacterClass" where "Number" in ({",".join(map(str, numbers))});')
        for des, v in reqs:
            do.append(f'insert into config."AttributeRequirement" ("Id","AttributeId","ItemDefinitionId","MinimumValue","MinimumItemLevel") values (gen_random_uuid(),{A(des)},{iid(g, i)},{v},0);')
        undo.append(f'delete from config."AttributeRequirement" where "ItemDefinitionId"={iid(g, i)};')
        undo.append(f'delete from config."ItemDefinitionCharacterClass" where "ItemDefinitionId"={iid(g, i)};')
        undo.append(f'delete from config."ItemDefinition" where "Id"={iid(g, i)};')
    undo.append(f'delete from config."AttributeRequirement" where "SkillId"={sid(n)} or "SkillId1"={sid(n)};')
    undo.append(f'delete from config."SkillCharacterClass" where "SkillId"={sid(n)};')
    undo.append(f'delete from config."Skill" where "Id"={sid(n)};')
    undo.append(f'delete from config."AreaSkillSettings" where "Id"={aid(n)};')
    rq = require.get(n, {})
    client.append({'num': n, 'name': d['Name'], 'folder': folder, 'shape': shape, 'damageType': ['Physical', 'Wizardry'][dmg_type] if dmg_type >= 0 else 'None',
                   'damage': int(d['Damage']), 'distance': int(d['Distance']), 'range': int(d['EffectRadio']), 'mana': int(d['ManaCost']),
                   'ag': int(d['StaminaCost']), 'level': int(d['ReqLevel']), 'energy': int(d['ReqEnergy']), 'classes': numbers,
                   'scroll': list(scroll) if scroll else None, 'scrollName': items.get(scroll, {}).get('Name') if scroll else None,
                   'reqSkill': int(rq.get('ReqSkill', -1)), 'reqMasterSkill': int(rq.get('ReqMasterSkill', -1)), 'reqMasterLevel': int(rq.get('ReqMasterLevel', 0))})
do += ['SELECT count(*) || \' habilidades de cuarta clase\' FROM config."Skill" WHERE "Id"::text LIKE \'0000ba5e-0009-0001-%\';', 'COMMIT;']
undo.append('COMMIT;')
open(os.path.join(OUT, 'skills4.sql'), 'w').write('\n'.join(do) + '\n')
open(os.path.join(OUT, 'skills4_undo.sql'), 'w').write('\n'.join(undo) + '\n')
json.dump(client, open(os.path.join(OUT, 'skills4.json'), 'w'), indent=1)
print(len(client), 'habilidades,', sum(1 for c in client if c['scroll']), 'pergaminos')

# El cliente: la tabla de habilidades nuevas, al lado de la generada desde OpenMU (versions/shared/skills).
TYPE = {'direct': ('DirectHit', 'Explicit'), 'area': ('AreaSkillAutomaticHits', 'Explicit'), 'buff': ('Buff', 'ImplicitParty')}
rows = []
for c in client:
    t, target = TYPE[c['shape']]
    rows.append('  ' + json.dumps({'num': c['num'], 'name': c['name'], 'classes': ' | '.join(map(str, c['classes'])), 'damageType': c['damageType'],
                                   'damage': c['damage'], 'distance': c['distance'], 'ag': c['ag'], 'mana': c['mana'], 'level': c['level'],
                                   'energy': c['energy'], 'type': t, 'target': target, 'range': c['range']}, separators=(',', ':')) + ',')
open(os.path.join(OUT, '../../versions/shared/skills/skillsDatabaseS19.ts'), 'w').write(f"""/**
 * The Season 19 fourth-class skills our server adds (ops/fase2/skills4.sql): generated by ops/fase2/gen_skills4.py from
 * the S19 SkillList.xml, the same numbers and values. `skillsDatabase.ts` reads them after its own table.
 */
import type {{ SkillDefinition }} from './skillsDatabase';

export const S19_SKILL_DEFINITIONS: readonly SkillDefinition[] = [
{chr(10).join(rows)}
];
""")

# El cliente: un archivo por pergamino (versions/shared/items/misc), con el modelo de un pergamino o de un orbe de S6.
FLAG = {'DW': ('DW/SM', 0), 'DK': ('DK/BK', 4), 'ELF': ('Elf/ME', 8), 'MG': ('MG', 12), 'DL': ('DL', 16), 'SUM': ('SUM', 20), 'RF': ('RF', 24)}
STEP = {0: 1, 2: 2, 3: 3, 4: 1, 6: 2, 7: 3, 8: 1, 10: 2, 11: 3, 12: 1, 13: 2, 16: 1, 17: 2, 20: 1, 22: 2, 23: 3, 24: 1, 25: 2}
for c in client:
    if not c['scroll']:
        continue
    g, i = c['scroll']
    flags = {k: 0 for k, _ in FLAG.values()}
    for k, base in FLAG.values():
        mine = [x for x in c['classes'] if base <= x < base + 4]
        if mine:
            flags[k] = min(STEP[x] for x in mine)
    name = c['scrollName'] or 'Scroll of ' + c['name']
    model = 'Book11.glb' if flags['DW/SM'] or flags['SUM'] or name.startswith(('Scroll', 'Parchment')) else 'Gem01.glb'
    it = items.get((g, i), {})
    file = re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')
    body = '\n'.join(f"  {k if re.match(r'^[A-Za-z]+$', k) else repr(k)}: {v}," for k, v in flags.items())
    open(os.path.join(OUT, f'../../versions/shared/items/misc/{file}.ts'), 'w').write(f"""import {{ defineItem }} from '@/controllers/items';

// Season 19 fourth-class skill {c['num']} {c['name']} (ops/fase2/gen_skills4.py; the model is a Season 6 stand-in).
export default defineItem({{
  Group: {g},
  Index: {i},
  ItemSlot: -1,
  Skill: 0,
  X: 1,
  Y: 1,
  Serial: 1,
  Opt: 1,
  Drop: 0,
  ItemName: {json.dumps(name)},
  Lvl: {int(it.get('DropLevel', '100') or 100)},
  ReqLvl: {c['level']},
  Energy: {c['energy']},
  Zen: 0,
{body}
  szModelFolder: 'Item/',
  szModelName: '{model}',
}});
""")

# El plugin: que habilidad base y que habilidad master (al nivel 10) pide cada una para aprenderse (SkillRequire.xml).
reqs = '\n'.join(f"        [{c['num']}] = ({c['reqSkill']}, {c['reqMasterSkill']}, {c['reqMasterLevel']}),"
                 for c in client if c['reqSkill'] > 0)
open(os.path.join(OUT, '../../openmu/plugins/GameLogic/FourthSkills/FourthSkillRequirements.cs'), 'w').write(f"""// <copyright file="FourthSkillRequirements.cs" company="MUnique">
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// </copyright>

namespace MUnique.OpenMU.GameLogic.FourthSkills;

/// <summary>
/// What each Season 19 fourth-class skill asks before its scroll teaches it (Skill/SkillRequire.xml), made by
/// mu-web-client ops/fase2/gen_skills4.py: a base skill, and a master skill at a level.
/// </summary>
public static class FourthSkillRequirements
{{
    /// <summary>Skill number to (base skill, master skill, master level).</summary>
    public static readonly IReadOnlyDictionary<int, (int BaseSkill, int MasterSkill, int MasterLevel)> Of = new Dictionary<int, (int, int, int)>
    {{
{reqs}
    }};
}}
""")
