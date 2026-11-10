# Cliente original de referencia (Wine + OpenMU local)

Sirve para ver cómo debe verse y comportarse el juego (cliente MU 1.04d S6E3 original, sin modificar)
y compararlo con el cliente web. **Los archivos del cliente NO van a este repo**: están en el repo
privado `Jonatks/mu-assets` (8 trozos `mu-client.zip.partNN`, sha256 del ZIP completo
`6ffa9e7359a40bdcf770a2e9f8f1cd1b26f355b54a18e9e2bc052bc2515fe837`).

Probado en Ubuntu 24.04 (contenedor sin GPU ni sonido). Los pasos se hicieron a mano en una sesión;
`run-reference-client.sh` los junta, pero no se ha ejecutado de una sola vez.

## Lo que hay que saber (descubierto en la práctica)
- `main.exe` **ignora `/u` y `/p`** y siempre conecta a `connect.muonline.webzen.com:44405`.
  Se redirige con DNAT (iptables) a OpenMU local. Cambiar `/etc/hosts` no funcionó con Wine.
- El cliente **descarta IPs de loopback** que le manda el servidor de conexión: OpenMU debe
  arrancar con `-resolveIP:<IP no loopback del contenedor>` (no `127.0.0.1`).
- Sin tarjeta de sonido sale "Direct Sound Init Fail": basta pulsar OK.
- El cliente lee el ratón por sondeo: los clics deben ser sostenidos (~0,35 s), no instantáneos.
- Teclas útiles en el juego: `I` inventario, `C` personaje. `S` no abre habilidades en 1.04d.
- Pantalla 800x600 en la esquina superior izquierda del Xvfb.
