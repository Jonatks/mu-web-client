# fork

Nuestros cambios al propio OpenMU, para lo que un plugin no alcanza. El resto de `openmu/` sigue siendo plugins sobre la
imagen oficial; aqui solo hay parches chicos sobre la version exacta que corre la VM.

```
BASE                    commit de MUnique/OpenMU de la imagen de la VM (0.10.1, 766da9a, publicada el 01-11-2026)
VERSION                 nombre de nuestra version (0.10.1-mu1); subirlo al cambiar un parche
0001-droplevel-short.patch   ItemDefinition.DropLevel y MaximumDropLevel de byte a short
apply-vm.sh             en la VM: baja el release, lo pone como base (mu-openmu-admin:pre-fase0) y guarda la anterior
                        como :pre-fork; `rollback` vuelve a ella
```

`.github/workflows/openmu-fork.yml` compila la imagen en GitHub Actions (la VM de 1 GB no puede) y la publica como
archivo del release `openmu-<VERSION>`. En la VM: `apply-vm.sh <VERSION>` y despues `deploy.sh <sha>` (los plugins se
compilan sobre la nueva base). Con el MCP: accion `base_openmu` y luego `desplegar_plugins`.

## 0001: DropLevel de byte a short
El S19 tiene items con nivel de aparicion de hasta 1500 (178 pasan de 255; los Mastery van de 260 a 320). OpenMU lo
guardaba como byte: con mas de 255 no arranca, y con el valor recortado cambian el precio de venta y reparacion y los
bonos excelentes y ancient (`ItemPowerUpFactory` divide por ese nivel). La columna ya es `smallint` en la base, asi que no
hay migracion: cambian el modelo, su modelo compilado de EF y la instantanea. OpenMU ignora `PendingModelChangesWarning`.
