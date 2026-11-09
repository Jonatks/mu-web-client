import { useEffect, useRef, useState } from 'react';
import { Store } from '../../store';

const RADIUS = 56; // px
const STEP_MS = 220;
let lastTarget: { x: number; z: number } | null = null;

// Convierte el vector del joystick (pantalla) en un destino de caminata en el mundo,
// usando la orientación de la cámara.
function stepPlayer(jx: number, jy: number) {
  const world = Store.world;
  const player = world?.playerEntity;
  const cam = world?.scene.activeCamera;
  if (!world || !player || !cam) return;

  const f = cam.getForwardRay().direction;
  const len = Math.hypot(f.x, f.z) || 1;
  const fx = f.x / len;
  const fz = f.z / len;
  // Babylon es zurdo: derecha = (fz, -fx)
  const rx = fz;
  const rz = -fx;

  const dx = rx * jx + fx * -jy;
  const dz = rz * jx + fz * -jy;
  const m = Math.hypot(dx, dz) || 1;
  const ux = dx / m;
  const uz = dz / m;

  const px = player.transform.pos.x;
  const pz = player.transform.pos.z;

  for (let d = 4; d >= 1; d--) {
    const tx = Math.floor(px + ux * d);
    const tz = Math.floor(pz + uz * d);
    if (world.isWalkable(tx, tz)) {
      const mv = player.playerMoveTo;
      if (!mv.handled) return;
      // No pedir un nuevo destino si el personaje aún está lejos del anterior
      if (lastTarget && Math.hypot(lastTarget.x - px, lastTarget.z - pz) > 2.6) return;
      lastTarget = { x: tx + 0.5, z: tz + 0.5 };
      mv.point.x = tx + 0.5;
      mv.point.y = tz + 0.5;
      mv.handled = false;
      mv.sendToServer = true;
      return;
    }
  }
}

export const Joystick = () => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const vec = useRef({ x: 0, y: 0 });
  const activeId = useRef<number | null>(null);
  const keys = useRef(new Set<string>());

  // Bucle de movimiento mientras haya dirección activa
  useEffect(() => {
    const id = window.setInterval(() => {
      const v = vec.current;
      if (Math.hypot(v.x, v.y) > 0.25) stepPlayer(v.x, v.y);
    }, STEP_MS);
    return () => clearInterval(id);
  }, []);

  // Teclado (WASD / flechas) para PC
  useEffect(() => {
    const recompute = () => {
      const k = keys.current;
      const x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
      const y = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0);
      if (activeId.current === null) {
        vec.current = { x, y };
        setKnob({ x: x * RADIUS * 0.7, y: y * RADIUS * 0.7 });
      }
    };
    const dn = (e: KeyboardEvent) => { keys.current.add(e.code); recompute(); };
    const up = (e: KeyboardEvent) => { keys.current.delete(e.code); recompute(); };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  const update = (e: React.PointerEvent) => {
    const r = baseRef.current!.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    const max = RADIUS;
    if (d > max) { dx = (dx / d) * max; dy = (dy / d) * max; }
    setKnob({ x: dx, y: dy });
    vec.current = { x: dx / max, y: dy / max };
  };

  return (
    <div
      ref={baseRef}
      className="joystick"
      onPointerDown={e => {
        activeId.current = e.pointerId;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={e => { if (activeId.current === e.pointerId) update(e); }}
      onPointerUp={e => {
        if (activeId.current !== e.pointerId) return;
        activeId.current = null;
        vec.current = { x: 0, y: 0 };
        setKnob({ x: 0, y: 0 });
      }}
      onPointerCancel={() => {
        activeId.current = null;
        vec.current = { x: 0, y: 0 };
        setKnob({ x: 0, y: 0 });
      }}
    >
      <div className="knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
};
