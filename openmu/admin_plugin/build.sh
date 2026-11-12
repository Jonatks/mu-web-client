#!/usr/bin/env bash
# Builds the admin bridge DLL where Docker is available (Cloud Shell) and sends it to the VM.
# The VM is too small to compile. Usage: bash build.sh <commit>   (env: VM, KEY)
set -euo pipefail
SHA=${1:?commit sha of the repo (branch admin)}
VM=${VM:-ubuntu@155.181.133.84}
KEY=${KEY:-$HOME/.ssh/cs_vm}
DIGEST=$(ssh -i "$KEY" "$VM" "sudo docker image inspect munique/openmu --format '{{index .RepoDigests 0}}'")
W=$HOME/ab; rm -rf "$W"; mkdir -p "$W"; cd "$W"
for f in AdminBridge.csproj StartupHook.cs AdminBridgePlugIn.cs build.Dockerfile; do
  curl -fsSL "https://raw.githubusercontent.com/Jonatks/mu-web-client/$SHA/openmu/admin_plugin/$f" -o "$f"
done
docker build -f build.Dockerfile --build-arg OPENMU_IMAGE="$DIGEST" --target out -o out .
scp -i "$KEY" out/MUnique.OpenMU.MuAdminBridge.dll "$VM":~/
echo "DLL listo en la VM: ~/MUnique.OpenMU.MuAdminBridge.dll (compilado contra $DIGEST)"
