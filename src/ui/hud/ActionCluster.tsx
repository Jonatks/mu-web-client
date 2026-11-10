import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Store } from '../../store';
import { Vector3 } from '../../libs/babylon/exports';
import { playFlame } from '../../effects/flame';
import { playEnergyBall } from '../../effects/energyBall';
import { Rand } from '../../common/rand';
import { skillInfo } from '../../game/skills';

const SKILL_FLAME = 5;
const SKILL_ENERGY_BALL = 17;
const MAX_QUICK_SLOTS = 4;

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

const GLYPH = { attack: '✦', buff: '✚', summon: '☗' } as const;

function glyphFor(n: number, kind: keyof typeof GLYPH) {
  if (n === SKILL_FLAME) return '🔥';
  if (n === SKILL_ENERGY_BALL) return '✨';
  return GLYPH[kind];
}

// Botón de ataque grande + habilidades en arco. Las habilidades son las que el servidor
// le da al personaje (cada clase tiene las suyas); un personaje nuevo solo tiene el ataque básico.
export const ActionCluster = observer(() => {
  const [flame, setFlame] = useState<{ stop: () => void } | null>(null);
  const stopFlame = () => {
    flame?.stop();
    setFlame(null);
  };

  const usable = Store.skills.slice(0, MAX_QUICK_SLOTS);
  const selected = Store.playerData.actionBar.selectedSkill;

  const castSelected = () => {
    if (!Store.world) return;
    if (selected === SKILL_FLAME) setFlame(playFlame(Store.world.scene, playerPos()));
    else if (selected === SKILL_ENERGY_BALL) castEnergyBall();
    // Resto de habilidades y ataque básico: pendientes del sistema de combate.
  };

  return (
    <div className="actions">
      {Array.from({ length: MAX_QUICK_SLOTS }, (_, i) => {
        const s = usable[i];
        if (!s) {
          return (
            <button key={i} className={`skill s${i + 1} empty`} disabled>
              <i>＋</i>
            </button>
          );
        }
        const info = skillInfo(s.number);
        return (
          <button
            key={s.number}
            className={`skill s${i + 1}${selected === s.number ? ' active' : ''}`}
            onPointerDown={() => (Store.playerData.actionBar.selectedSkill = s.number)}
          >
            <i>{glyphFor(s.number, info.kind)}</i>
            <b>{info.name}</b>
          </button>
        );
      })}
      <button className="attack" onPointerDown={castSelected} onPointerUp={stopFlame} onPointerCancel={stopFlame}>
        <i>⚔</i>
      </button>
    </div>
  );
});
