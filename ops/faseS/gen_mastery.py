"""Fase S10: los items Mastery de las generaciones 2 a 11 del S19 (Darkangel a Temple Guard) en servidor y cliente.
Cada item se clona del item Bloodangel de su mismo tipo (que ya esta en OpenMU y en el cliente, fase 3) y toma los
valores del S19, como hizo gen_items.py con los de Season 6.
  python3 ops/faseS/gen_mastery.py <carpeta con <generacion>/items_s19.json de ops/s19/convert.ts> <salida sql> [<Data/Item del cliente S19>]
Escribe s10_mastery.sql y s10_mastery_undo.sql en <salida sql>, un archivo de cliente por item en
versions/shared/items/<carpeta del item Bloodangel>/ y en stdout los modelos a convertir y las tablas de weaponClass."""
import json, os, re, sys

GENS, OUT = sys.argv[1:3]
# Los modelos del cliente S19 (Data/Item), para escribir los de las garras como estan en disco.
ITEM_DIR = sys.argv[3] if len(sys.argv) > 3 else ''
ON_DISK = {f.lower(): f for f in os.listdir(ITEM_DIR)} if ITEM_DIR else {}
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..')
CLIENT = os.path.join(ROOT, 'versions/shared/items')
BLOOD = json.load(open(os.path.join(ROOT, 'ops/bloodangel/items_s19.json')))
INDEX_OVERRIDE = {(2, 22): 30}
S6 = ['DarkWizard', 'DarkKnight', 'FairyElf', 'MagicGladiator', 'DarkLord', 'Summoner', 'RageFighter']
THIRD = {'DarkWizard': 3, 'DarkKnight': 7, 'FairyElf': 11, 'MagicGladiator': 13, 'DarkLord': 17, 'Summoner': 23, 'RageFighter': 25}
FLAG = {'DarkWizard': 'DW/SM', 'DarkKnight': 'DK/BK', 'FairyElf': 'Elf/ME', 'MagicGladiator': 'MG', 'DarkLord': 'DL', 'Summoner': 'SUM', 'RageFighter': 'RF'}
WORDS = ['Two-Handed', 'Book', 'Stick', 'Claw', 'Lord', 'Fairy', 'Magic', 'Staff', 'Bow', 'Scepter', 'Shield']
POWER = {
    'Minimum Physical Base Damage By Weapon': ('MinDamage', 'DmgMin'), 'Maximum Physical Base Damage By Weapon': ('MaxDamage', 'DmgMax'),
    'Minimum Curse Base Damage': ('MinDamage', 'DmgMin'), 'Maximum Curse Base Damage': ('MaxDamage', 'DmgMax'),
    'Base Defense': ('Defense', 'Def'), 'Staff Rise Percentage': ('MagicPower', 'MagicPwr'),
    'Scepter Rise Percentage': ('MagicPower', 'MagicPwr'), 'Book Rise Percentage': ('MagicPower', 'MagicPwr'),
}
REQ = {'Total Strength Requirement Value': 'ReqStrength', 'Total Agility Requirement Value': 'ReqAgility', 'Total Energy Requirement Value': 'ReqEnergy',
       'Total Vitality Requirement Value': 'ReqVitality', 'Total Leadership': 'ReqCommand', 'Level': 'ReqLevel'}
# Campo del cliente <- columna del S19 (armas y armaduras usan nombres distintos para lo mismo).
# DropLevel: OpenMU lo lee como byte; mas de 255 (Mastery 260-320) no deja arrancar al servidor.
CLIENT_FIELDS = {'X': 'Width', 'Y': 'Height', 'Skill': 'SkillIndex', 'ItemLvl': 'DropLevel', 'DmgMin': 'MinDamage', 'DmgMax': 'MaxDamage',
                 'Speed': 'AttackSpeed', 'Durability': 'Durability', 'Dur': 'Durability', 'MagicDur': 'MagicDurability', 'MagicPwr': 'MagicPower',
                 'RequiredLvl': 'ReqLevel', 'ReqLvl': 'ReqLevel', 'Strength': 'ReqStrength', 'Str': 'ReqStrength', 'Agi': 'ReqAgility',
                 'Ene': 'ReqEnergy', 'Vit': 'ReqVitality', 'Command': 'ReqCommand', 'Def': 'Defense'}

# El ItemList del S19 escribe algunos mal ("HelmMale150_fight.bmd .bmd"): vale hasta el primer .bmd.
stem = lambda it: re.split(r'\.bmd', it['ModelFile'], flags=re.I)[0].strip().rstrip('.')
classes = lambda it: frozenset(c for c in S6 if it.get(c, '0') != '0')
words = lambda it: {w for w in WORDS if w.lower() in it['Name'].lower()}
num = lambda it: INDEX_OVERRIDE.get((it['cat'], int(it['Index'])), int(it['Index']))

def ref_of(it):
    """El item Bloodangel del mismo grupo que mas se parece: mismas clases y mismas palabras del nombre."""
    same = [b for b in BLOOD if b['cat'] == it['cat']]
    return max(same, key=lambda b: (classes(b) == classes(it)) * 2 + len(words(b) & words(it)) - len(words(b) ^ words(it))
               - abs(int(b['Width']) * int(b['Height']) - int(it['Width']) * int(it['Height'])) * 0.1)

FILES = {}
for d, _, fs in os.walk(CLIENT):
    for f in fs:
        if f.endswith('.ts') and not f.endswith('.test.ts'):
            t = open(os.path.join(d, f)).read()
            g, n = re.search(r'^  Group: (\d+),$', t, re.M), re.search(r'^  Index: (\d+),$', t, re.M)
            if g and n:
                FILES[(int(g[1]), int(n[1]))] = os.path.join(d, f)

def client_values(path):
    return {k: int(v) for k, v in re.findall(r"^  '?([\w/]+)'?: (-?\d+),$", open(path).read(), re.M)}

def client_file(it, ref_path):
    t = open(ref_path).read()
    def put(field, value):
        nonlocal t
        t = re.sub(rf"^(  '?{re.escape(field)}'?: )-?\d+,$", rf'\g<1>{value},', t, flags=re.M)
    put('Index', num(it))
    for field, src in CLIENT_FIELDS.items():
        if src in it and it[src] != '':
            put(field, int(it[src]))
    for c, flag in FLAG.items():
        put(flag, int(it.get(c, '0') or 0))
    name = it['Name'].replace('\\', '\\\\').replace("'", "\\'")
    t = re.sub(r"^  ItemName: '.*',$", lambda _: f"  ItemName: '{name}',", t, flags=re.M)
    t = re.sub(r"^  szModelName: '.*',$", lambda _: f"  szModelName: '{stem(it)}.glb',", t, flags=re.M)
    return t

def uid(g, n): return f"'00000080-{g:04x}-{n:04x}-0000-000000000000'"
q = lambda s: "'" + s.replace("'", "''") + "'"
slug = lambda s: re.sub(r'[^a-z0-9]+', '_', s.lower()).strip('_')

do, undo = ['-- Fase S10: items Mastery de las generaciones 2 a 11 (generado por ops/faseS/gen_mastery.py)', 'BEGIN;'], ['BEGIN;']
models, books, bows, claws = set(), [], [], {}
for gen in sorted(os.listdir(GENS)):
    for it in json.load(open(os.path.join(GENS, gen, 'items_s19.json'))):
        g, n = it['cat'], num(it)
        ref = ref_of(it); rg, rn = ref['cat'], num(ref)
        ref_path = FILES[(rg, rn)]
        old = client_values(ref_path)
        # Cliente: el archivo del item Bloodangel con los valores del S19.
        path = os.path.join(os.path.dirname(ref_path), slug(it['Name']) + '.ts')
        if (g, n) not in FILES:
            open(path, 'w').write(client_file(it, ref_path))
        models.add(stem(it) + '.bmd')
        if 'book' in it['Name'].lower() and g == 5: books.append(n)
        if g == 4 and 'bow' in it['Name'].lower(): bows.append(n)
        if g == 0 and 'claw' in it['Name'].lower():
            right, left = (ON_DISK.get(f'{stem(it)}_{h}.bmd'.lower(), f'{stem(it)}_{h}.bmd')[:-4] for h in 'RL')
            claws[n] = (right, left, it['Name'])
            models.update({f'{right}.bmd', f'{left}.bmd'})
        # Servidor: el ItemDefinition del item Bloodangel con los valores del S19.
        new, R = uid(g, n), uid(rg, rn)
        do.append(f'-- {g}/{n} {it["Name"]} from {rg}/{rn}')
        do.append(f'''insert into config."ItemDefinition" ("Id","ItemSlotId","ConsumeEffectId","SkillId","GameConfigurationId","Number","Width","Height","DropsFromMonsters","IsAmmunition","IsBoundToCharacter","Name","DropLevel","MaximumItemLevel","Durability","Group","Value","MaximumSockets","PetExperienceFormula","StorageLimitPerCharacter","MaximumDropLevel","IsQuestItem","IsDroppable","IsPersonalStoreSellable","IsRepairable","IsSellableToNpc","IsStorable","IsTradable","IntroducedIn","IsActive","PriceDefinitionId","ExcellentBonus","ExcellentRaisesLevel","StatProfileId")
  select {new},"ItemSlotId","ConsumeEffectId","SkillId","GameConfigurationId",{n},{int(it['Width'])},{int(it['Height'])},false,"IsAmmunition","IsBoundToCharacter",{q(it['Name'])},{min(int(it['DropLevel']), 255)},"MaximumItemLevel",{int(it.get('Durability') or 0) or 'i."Durability"'},{g},"Value","MaximumSockets","PetExperienceFormula","StorageLimitPerCharacter","MaximumDropLevel","IsQuestItem","IsDroppable","IsPersonalStoreSellable","IsRepairable","IsSellableToNpc","IsStorable","IsTradable","IntroducedIn","IsActive","PriceDefinitionId","ExcellentBonus","ExcellentRaisesLevel","StatProfileId"
  from config."ItemDefinition" i where i."Id"={R} on conflict do nothing;''')
        do.append(f'insert into config."ItemDefinitionCharacterClass" select {new}, "Id" from config."CharacterClass" where "Number" in ({",".join(str(THIRD[c]) for c in sorted(classes(it)))}) on conflict do nothing;')
        do.append(f'insert into config."ItemDefinitionItemOptionDefinition" select {new}, "ItemOptionDefinitionId" from config."ItemDefinitionItemOptionDefinition" where "ItemDefinitionId"={R} on conflict do nothing;')
        do.append(f'insert into config."ItemBasePowerUpDefinition" ("Id","TargetAttributeId","BonusPerLevelTableId","ItemDefinitionId","BaseValue","AggregateType") select gen_random_uuid(),"TargetAttributeId","BonusPerLevelTableId",{new},"BaseValue","AggregateType" from config."ItemBasePowerUpDefinition" where "ItemDefinitionId"={R} and not exists (select 1 from config."ItemBasePowerUpDefinition" where "ItemDefinitionId"={new});')
        for des, (src, field) in POWER.items():
            o, val = old.get(field, 0), int(it.get(src, '0') or 0)
            if o > 0 and val > 0:
                do.append(f'update config."ItemBasePowerUpDefinition" p set "BaseValue" = round(p."BaseValue" * {val}::numeric / {o}) from config."AttributeDefinition" a where p."ItemDefinitionId"={new} and a."Id"=p."TargetAttributeId" and a."Designation"={q(des)};')
        if int(it.get('AttackSpeed', '0') or 0):
            do.append(f'update config."ItemBasePowerUpDefinition" p set "BaseValue" = {int(it["AttackSpeed"])} from config."AttributeDefinition" a where p."ItemDefinitionId"={new} and a."Id"=p."TargetAttributeId" and a."Designation"=\'Attack Speed by Weapons\';')
        do.append(f'delete from config."AttributeRequirement" where "ItemDefinitionId"={new};')
        for des, src in REQ.items():
            val = int(it.get(src, '0') or 0)
            if val > 0:
                do.append(f'insert into config."AttributeRequirement" ("Id","AttributeId","ItemDefinitionId","MinimumValue") select gen_random_uuid(), "Id", {new}, {val} from config."AttributeDefinition" where "Designation"={q(des)};')
        undo.append(f'delete from config."ItemDefinitionCharacterClass" where "ItemDefinitionId"={new}; delete from config."ItemDefinitionItemOptionDefinition" where "ItemDefinitionId"={new}; delete from config."ItemBasePowerUpDefinition" where "ItemDefinitionId"={new}; delete from config."AttributeRequirement" where "ItemDefinitionId"={new}; delete from config."ItemDefinition" where "Id"={new};')
do.append('COMMIT;'); undo.append('COMMIT;')
open(os.path.join(OUT, 's10_mastery.sql'), 'w').write('\n'.join(do) + '\n')
open(os.path.join(OUT, 's10_mastery_undo.sql'), 'w').write('\n'.join(undo) + '\n')
print('MODELS', ' '.join(sorted(models)))
print('BOOKS', sorted(books))
print('BOWS', sorted(bows))
print('CLAWS', json.dumps(claws))
