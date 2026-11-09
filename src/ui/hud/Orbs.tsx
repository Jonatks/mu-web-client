import { observer } from 'mobx-react-lite';
import { Store } from '../../store';
import { ItemIcon } from '../components/itemIcon';

const Orb = ({ kind, value, pct }: { kind: 'hp' | 'mp'; value: number; pct: number }) => (
  <div className={`orb ${kind}`}>
    <div className="liquid" style={{ height: `${Math.max(0, Math.min(1, pct)) * 100}%` }} />
    <span className="val">{value}</span>
  </div>
);

export const Orbs = observer(() => {
  const p = Store.playerData;
  const potions = [
    { k: 'Q', num: 0 },
    { k: 'W', num: 1 },
    { k: 'E', num: 2 },
    { k: 'R', num: 3 },
  ];
  return (
    <div className="orbs">
      <Orb kind="hp" value={p.currentHP} pct={p.hpPercent} />
      <div className="quickslots">
        {potions.map(s => (
          <div key={s.k} className="slot">
            <span className="hk">{s.k}</span>
            <ItemIcon group={14} num={s.num} />
            <span className="cnt">10</span>
          </div>
        ))}
      </div>
      <Orb kind="mp" value={p.currentMP} pct={p.mpPercent} />
    </div>
  );
});

export const ExpStrip = observer(() => {
  const p = Store.playerData;
  return (
    <div className="exp-strip">
      <div className="fill" style={{ width: `${(p.expPercent * 100).toFixed(1)}%` }} />
      <span>Nv. {p.level} · {(p.expPercent * 100).toFixed(1)}%</span>
    </div>
  );
});
