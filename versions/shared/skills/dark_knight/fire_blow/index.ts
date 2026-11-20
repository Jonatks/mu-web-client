import { defineSkill } from '@/controllers/skills/define';
import { FIRE_SPARKS, TEX } from '@/controllers/fx/recipes';
import { delay, entityPos, type ParticleRecipe } from '@/controllers/fx/core';
import { Step, afterRelease, burn, cm, forwardOf, particles, ring, scorch, sprite } from '@/controllers/skills/visuals';
import { Vector3 } from '@/controllers/render/babylon/exports';
import { playCombat } from '@/controllers/sound/combat';
import { A } from '@/controllers/combat/recipes';
import { effectLight } from '@/controllers/lighting/recipes';

/** Flames the blow throws along its path: low, fast, burning off upwards. */
const BLOW_FLAME: ParticleRecipe = {
  texture: TEX.fire,
  cells: { w: 64, h: 64, count: 4 },
  colour: [1, 0.55, 0.15],
  colourEnd: [0.7, 0.1, 0],
  size: 0.6,
  sizeJitter: 0.3,
  life: 0.45,
  lifeJitter: 0.3,
  box: [0.2, 0.05, 0.2],
  dir1: [-0.4, 0.4, -0.4],
  dir2: [0.4, 1.2, 0.4],
  power: 1.4,
  gravity: 0.6,
  spin: 2,
  endScale: 1.6,
};

/**
 * 723 Fire Blow (Season 19 fourth class, our server's skill): Death Stab's thrust (its clip) sending a run of fire
 * bursts from the knight to the target, which bursts in a 2-tile ring of flame. Our own look: the S19 draws it in its
 * executable. See ../../readme.md.
 */
const fireBlow: Step = (p, c) => {
  const from = entityPos(c.caster, 0, new Vector3());
  const f = forwardOf(c.yaw);
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    const at = new Vector3(from.x + f.x * i * 0.5, p.y, from.z + f.z * i * 0.5);
    delay(i * 0.04, () => {
      particles({ recipe: BLOW_FLAME, count: 6, height: 0.2 })(at, c);
      sprite({ texture: TEX.flare, colour: [1, 0.5, 0.15], size: 0.9, seconds: 0.25, fadeTail: 0.6 })(new Vector3(at.x, at.y + cm(80), at.z), c);
    });
  }
  delay(steps * 0.04 + 0.05, () => {
    ring({ texture: TEX.shockwave, colour: [1, 0.45, 0.1], scale: 1.4, grow: 2.2, growFrom: 0.4, seconds: 0.45, fadeTail: 0.7 })(p, c);
    particles({ recipe: BLOW_FLAME, count: 22, height: 0.2 })(p, c);
    particles({ recipe: FIRE_SPARKS, count: 16, height: 0.4 })(p, c);
    scorch(1.4)(p, c);
    burn(1.4)(p, c);
    playCombat('Sound/eExplosion', p);
  });
};

export default defineSkill({
  id: 723,
  name: 'Fire Blow',
  warriorGlint: true,
  visual: { area: afterRelease(fireBlow) },
  clip: { ground: A.PLAYER_ATTACK_ONETOONE }, // Death Stab's thrust
  light: { land: effectLight([1, 0.45, 0.12], 2, 0.7, { heightOffset: 0.8, release: 0.4 }) },
});
