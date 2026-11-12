#!/bin/bash
# Se ejecuta EN LA VM: recorre la API del servicio de administracion con la clave guardada. No imprime la clave.
#   bash smoke.sh status            # estado y bloqueo de jugadores
#   bash smoke.sh edit NAME         # edita nivel/zen de un personaje, comprueba y deshace
#   bash smoke.sh item NAME         # inserta un ostiario con opciones, lo lista, lo borra y deshace
set -uo pipefail
K=$(sudo cat /etc/mu-admin/key)
api() { local m=$1 p=$2; shift 2; curl -sS -X "$m" -H "x-admin-key: $K" -H "x-admin-user: smoke" -H 'content-type: application/json' "http://127.0.0.1:3200$p" "$@"; echo; }
case "${1:-status}" in
  status) api GET /status ;;
  edit)
    N=$2
    echo "antes:";   api GET "/characters/$N"
    echo "editar:";  R=$(api PATCH "/characters/$N" -d '{"level":123,"zen":777,"strength":1111,"levelUpPoints":5}'); echo "$R"
    echo "despues:"; api GET "/characters/$N"
    U=$(echo "$R" | sed -n 's/.*"undoId":"\([^"]*\)".*/\1/p')
    echo "deshacer $U:"; api POST "/undo/$U"
    echo "restaurado:"; api GET "/characters/$N"
    ;;
  item)
    N=$2
    D=$(api GET "/items/definitions?q=Boots&group=11" | sed -n 's/.*"id":"\([^"]*\)".*"name":"Boots".*/\1/p' | head -1)
    [ -n "$D" ] || D=$(api GET "/items/definitions?q=Pants&group=11" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
    echo "definicion: $D"; api GET "/items/definitions/$D" | cut -c1-900
    echo "insertar:"; R=$(api POST "/characters/$N/items" -d "{\"definitionId\":\"$D\",\"level\":9,\"luck\":true,\"option\":2,\"excellent\":[1,2]}"); echo "$R"
    IID=$(echo "$R" | sed -n 's/.*"itemId":"\([^"]*\)".*/\1/p'); U=$(echo "$R" | sed -n 's/.*"undoId":"\([^"]*\)".*/\1/p')
    echo "inventario (cola):"; api GET "/characters/$N/items" | tr '{' '\n' | grep "$IID" | cut -c1-600
    echo "deshacer insercion $U:"; api POST "/undo/$U"
    echo "ya no esta:"; api GET "/characters/$N/items" | grep -c "$IID"
    ;;
esac
