#!/bin/sh
# Fase 2a en la VM: evalua master_formula.txt con el mXparser de la imagen de OpenMU (SDK en docker). No cambia nada.
# Uso: sh check_master.sh <sha>
set -eu
DIR=$(mktemp -d)
curl -fsSL "https://codeload.github.com/Jonatks/mu-web-client/tar.gz/$1" | tar -xz -C "$DIR" --strip-components=1 --wildcards '*/ops/fase2/*'
mkdir -p "$DIR/openmu" && sudo docker cp openmu:/app/MathParser.org-mXparser.dll "$DIR/openmu/"
sudo docker run --rm -v "$DIR":/w -w /w/ops/fase2/checkformula mcr.microsoft.com/dotnet/sdk:10.0-alpine \
  sh -c 'dotnet run -v q -p:OpenMuDir=/w/openmu -- ../master_formula.txt expected.txt 400 2>&1 | tail -12'
sudo rm -rf "$DIR"
