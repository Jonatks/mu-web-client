#!/bin/bash
# Uso: run-reference-client.sh "/ruta/MU Client 1.04d - Season 6E3"
# Requiere root (apt, iptables) y Docker en marcha. Deja el cliente abierto en DISPLAY=:99.
set -euo pipefail
CLIENT_DIR="${1:?ruta del cliente}"
WORK="${WORK:-/tmp/mu-ref}"; mkdir -p "$WORK"

# 1) Dependencias (Wine 9 de 32 bits, GL por software, herramientas de captura)
dpkg --add-architecture i386; apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends \
  wine wine32:i386 wine64 libwine libwine:i386 fonts-wine libgl1-mesa-dri libgl1-mesa-dri:i386 \
  libgl1:i386 xvfb xdotool imagemagick

# 2) OpenMU de demostración anunciando una IP NO loopback
IP=$(python3 -I -c "import socket;s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM);s.connect(('8.8.8.8',80));print(s.getsockname()[0])")
docker rm -f openmu >/dev/null 2>&1 || true
docker run -d --name openmu -p 44405-44406:44405-44406 -p 45901-45906:45901-45906 \
  munique/openmu:latest -demo -autostart -resolveIP:"$IP" >/dev/null
sleep 45

# 3) El cliente conecta a connect.muonline.webzen.com:44405 -> redirigir esa IP a OpenMU local
WEBZEN_IP=$(getent hosts connect.muonline.webzen.com | awk '{print $1}')
iptables -t nat -A OUTPUT -d "$WEBZEN_IP" -p tcp --dport 44405 -j DNAT --to-destination 127.0.0.1:44405

# 4) Pantalla virtual y Wine
(Xvfb :99 -screen 0 1024x768x24 +extension GLX +render -noreset >"$WORK/xvfb.log" 2>&1 &); sleep 2
export DISPLAY=:99 WINEPREFIX="$WORK/wineprefix" WINEARCH=win32 WINEDEBUG=-all LIBGL_ALWAYS_SOFTWARE=1
wineboot -i >/dev/null 2>&1
cd "$CLIENT_DIR" && (wine main.exe >"$WORK/mu.log" 2>&1 &)
sleep 22; xdotool mousemove 513 407 click 1   # cierra "Direct Sound Init Fail"
echo "Cliente en marcha. Captura: DISPLAY=:99 import -window root captura.png"
echo "Flujo: clic sostenido en Valhalla (215,217) -> servidor (398,217) -> login (421,354 / 421,378) -> Enter."
echo "Cuentas demo: test0..test9 con contraseña = usuario."
