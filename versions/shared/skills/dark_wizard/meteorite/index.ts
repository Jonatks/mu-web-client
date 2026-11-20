import { defineSkill } from '@/controllers/skills/define';
import { FIRE_BALL_LIGHT, METEOR_LOOK, meteor, meteorImpact, meteorLanding } from '../_shared';
import { effectLight } from '@/controllers/lighting/recipes';

/** Dark Ghost drops the same meteor (monsters/dark_ghost); the steps live in the class's _shared.ts. */
export { dropMeteor } from '../_shared';

export default defineSkill({
  id: 2,
  name: "Meteorite",
  // Master numbers with no row of their own that draw as this skill (SKILL_REPLACEMENTS).
  lookAliases: [390, 394],
  // 2 Meteorite: at the release, MODEL_FIRE sub0 falls on the target's feet; 6 chips and the explosion (meteor).
  // Enhanced: the same fall with a glow and embers, and a fuller landing (meteorImpact).
  visual: {
    impact: meteor(meteorLanding()),
    enhanced: { impact: meteor(meteorImpact, METEOR_LOOK) },
  },
  // Meteorite: MODEL_FIRE's `(Lum, 0.1 Lum, 0)` range 2 rides the ball down and dies with it (ZzzEffect.cpp:7948-7953).
  // Enhanced: an orange glow riding the lit ball; on the ground the white-hot burst over the explosion's reach
  // and the crater's red, which outlasts it.
  light: {
    land: FIRE_BALL_LIGHT,
    enhanced: {
      land: effectLight([1, 0.4, 0.1], 1.2, 3, { release: 0.04, flicker: { min: 0.8, max: 1, steps: 4 } }),
      bodies: {
        impact: effectLight([1, 0.6, 0.25], 1.8, 0.7, { heightOffset: 0.8, release: 0.45 }),
        crater: effectLight([1, 0.3, 0.06], 1.1, 1.4, { attack: 0.1, release: 0.8, flicker: { min: 0.75, max: 1, steps: 4 } }),
      },
    },
  },
});
