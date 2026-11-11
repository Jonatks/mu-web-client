import { observer } from 'mobx-react-lite';
import { Hero } from '@/modules/hero';

const pct = (value: number, max: number) => `${Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0))}%`;

/** A liquid orb: the fill rises with the value, the number sits on top (Mu Magdalena's life and mana). */
export const Orb = observer(({ kind }: { kind: 'hp' | 'mp' }) => {
  const value = kind === 'hp' ? Hero.currentHP : Hero.currentMP;
  const max = kind === 'hp' ? Hero.maxHP : Hero.maxMP;
  return (
    <div className={`mobile-orb ${kind}`}>
      <div className="mobile-orb-fill" style={{ height: pct(value, max) }} />
      <span className="mobile-orb-value">{value}</span>
    </div>
  );
});

/** AG (yellow) and SD (purple), thin bars over the slots. */
export const Gauges = observer(() => (
  <div className="mobile-gauges">
    <div className="mobile-gauge ag">
      <i style={{ width: pct(Hero.currentAG, Hero.maxAG) }} />
      <b>{Hero.currentAG}</b>
    </div>
    <div className="mobile-gauge sd">
      <i style={{ width: pct(Hero.currentSD, Hero.maxSD) }} />
      <b>{Hero.currentSD}</b>
    </div>
  </div>
));

/** Experience, a hairline under the slots. */
export const ExpLine = observer(() => (
  <div className="mobile-exp">
    <i style={{ width: `${Math.max(0, Math.min(100, Hero.expPercent * 100))}%` }} />
  </div>
));
