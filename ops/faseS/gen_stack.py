# Fase S: cuantos se apilan por casilla en el S19 (Item/ItemStack.xml MaxStack y lo que venden sus tiendas). En OpenMU el tope de una pila es la
# Durability de la definicion; solo se cambian las que ya se apilan (Durability > 1): las joyas y demas que en S6 no se
# apilan quedan igual hasta probar su uso apilado.
#   python3 ops/faseS/gen_stack.py "<Data del servidor S19>" <carpeta de salida>
import glob, re, sys

data, out = sys.argv[1], sys.argv[2]
stack = {(int(c), int(i)): int(m) for c, i, m in re.findall(r'<Item ItemCat="(\d+)" ItemIndex="(\d+)" MaxStack="(\d+)"', open(f'{data}/Item/ItemStack.xml', encoding='utf-8-sig').read())}
# Las tiendas del S19 venden pilas mas grandes que MaxStack (pociones de 1, 25 y 255): el tope es el mayor de los dos.
for path in glob.glob(f'{data}/Shops/Scripts/*.xml'):
    for c, i, d in re.findall(r'ItemCat="(\d+)" ItemIndex="(\d+)" ItemLevel="\d+" ItemDur="(\d+)"', open(path, encoding='utf-8-sig').read()):
        if int(d) > 1:
            stack[(int(c), int(i))] = max(stack.get((int(c), int(i)), 0), int(d))
rows = [(c, i, m) for (c, i), m in sorted(stack.items())]
values = ',\n  '.join(f'({int(c)}, {int(i)}, {min(int(m), 255)})' for c, i, m in rows)
where = 'd."Group" = v.g and d."Number" = v.n and d."Durability" > 1'
open(f'{out}/s_stack.sql', 'w').write(f"""-- Pilas del S19 (hecho por ops/faseS/gen_stack.py). Reversa: s_stack_undo.sql.
begin;
create schema if not exists mu_plugins;
create table mu_plugins.stack_bak_s19 as select d."Id", d."Durability" from config."ItemDefinition" d
  join (values
  {values}
  ) as v(g, n, m) on {where};
update config."ItemDefinition" d set "Durability" = v.m from (values
  {values}
) as v(g, n, m) where {where};
commit;
""")
open(f'{out}/s_stack_undo.sql', 'w').write("""begin;
update config."ItemDefinition" d set "Durability" = b."Durability" from mu_plugins.stack_bak_s19 b where b."Id" = d."Id";
drop table mu_plugins.stack_bak_s19;
commit;
""")
print('ok', len(rows))
