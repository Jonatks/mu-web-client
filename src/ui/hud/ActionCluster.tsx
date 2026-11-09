import { useState } from 'react';
import { Store } from '../../store';
import { Vector3 } from '../../libs/babylon/exports';
import { playFlame } from '../../effects/flame';
import { playEnergyBall } from '../../effects/energyBall';
import { Rand } from '../../common/rand';

function playerPos() {
  const w = Store.world!;
  const pos = new Vector3().copyFrom(w.playerEntity.transform.pos as any);
  pos.x += 0.5;
  pos.z += 0.5;
  return pos;
}

function castEnergyBall() {
  const w = Store.world;
  if (!w) return;
  const from = playerPos().addInPlaceFromFloats(0, 1.25, 0);
  const to = from.clone().addInPlaceFromFloats(Rand.nextFloat(1, 4) * Rand.nextSign(), 0, Rand.nextFloat(1, 4) * Rand.nextSign());
  from.addInPlace(to.subtract(from).normalize().scaleInPlace(0.5));
  playEnergyBall(w.scene, from, to);
}

// Botón de ataque grande + habilidades en arco (al estilo de los juegos móviles).
export const ActionCluster = () => {
  const [flame, setFlame] = useState<{ stop: () => void } | null>(null);
  const stopFlame = () => { flame?.stop(); setFlame(null); };

  return (
    <div className="actions">
      <button className="skill s1" onPointerDown={() => Store.world && setFlame(playFlame(Store.world.scene, playerPos()))}
        onPointerUp={stopFlame} onPointerCancel={stopFlame}>
        <i>🔥</i><b>Llama</b>
      </button>
      <button className="skill s2" onPointerDown={castEnergyBall}><i>✨</i><b>Energía</b></button>
      <button className="skill s3 empty" disabled><i>＋</i></button>
      <button className="skill s4 empty" disabled><i>＋</i></button>
      <button className="attack" onPointerDown={castEnergyBall}><i>⚔</i></button>
    </div>
  );
};
