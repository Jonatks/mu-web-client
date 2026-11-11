import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { Ecs } from '@/ecs/current';
import { Hero } from '@/modules/hero';
import { mapName } from '@/modules/gm/gmMaps';
import { TW_SAFEZONE } from '@/controllers/terrain/consts';

/** Where the hero stands, polled a few times a second (the position is per-frame state, not observable). */
const usePlace = () => {
  const [place, setPlace] = useState('');
  useEffect(() => {
    const read = () => {
      const world = Ecs.world;
      const pos = world?.playerEntity?.transform.pos;
      const next = world && pos ? `${mapName(world.mapIndex)} (${Math.floor(pos.x)}, ${Math.floor(pos.z)})` : '';
      setPlace(prev => (prev === next ? prev : next));
    };
    read();
    const id = window.setInterval(read, 400);
    return () => window.clearInterval(id);
  }, []);
  return place;
};

/** Top left, like Mu Magdalena: level badge, name, zone with coordinates, and the safe-zone pill. */
export const StatusPanel = observer(() => {
  const place = usePlace();
  const safe = (Hero.tileFlag & TW_SAFEZONE) !== 0;

  return (
    <div className="mobile-status">
      <div className="mobile-status-row">
        <span className="mobile-level" style={{ ['--xp' as string]: `${Math.round(Math.max(0, Math.min(1, Hero.expPercent)) * 100)}%` }}>
          {t('mobile.level', { n: Hero.level })}
        </span>
        <span className="mobile-name">{Hero.name}</span>
      </div>
      <div className="mobile-place">{place}</div>
      {safe && <div className="mobile-safe">{t('mobile.safeZone')}</div>}
    </div>
  );
});
