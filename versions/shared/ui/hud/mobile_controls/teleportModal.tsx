import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { MuWindows } from '@/controllers/interface/windowManager';
import { loadMoveReqList, type MoveReqEntry } from '@/controllers/assets/mu';
import { Ecs } from '@/ecs/current';
import { Hero } from '@/modules/hero';
import { getBaseClass } from '@/modules/hero/characterStats';
import { closeMoveWindow, rowState, warpToEntry } from '../../windows/move_command_window';
import { MobileButton } from './mobileButton';

/**
 * Mu Magdalena's "Teleport": the `MoveReq` rows as big tappable lines over a dimmed screen - the map on the left, "Lv.N . N Zen" on the
 * right, a row the hero cannot take dimmed with the failing number in red - and a Close pill. The rules are the original window's
 * (`rowState`); the window itself does not draw on a touch screen.
 */
export const TeleportModal = observer(() => {
  const open = MuWindows.isOpen('move_command');
  const [entries, setEntries] = useState<readonly MoveReqEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadMoveReqList().then(
      list => {
        if (!cancelled) setEntries(list);
      },
      err => console.error('Could not load MoveReq_eng.bmd:', err)
    );
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const cls = getBaseClass(Hero.charClass);
  const pk = Ecs.world?.playerEntity?.heroState ?? 3;

  return (
    <div className="mobile-teleport">
      <div className="mobile-teleport-title">{t('mobile.teleport')}</div>
      <div className="mobile-teleport-list">
        {entries.map(entry => {
          const row = rowState(entry, Hero.level, Hero.money, cls, pk);
          return (
            <MobileButton
              key={entry.index}
              className={`mobile-teleport-row${row.canMove ? '' : ' is-locked'}`}
              onTap={() => row.canMove && warpToEntry(entry)}
            >
              {() => (
                <>
                  <span className="mobile-teleport-name">{entry.name}</span>
                  <span className="mobile-teleport-req">
                    <b className={!row.canMove && !row.levelOk ? 'bad' : ''}>{t('mobile.lv', { n: row.reqLevel })}</b> ·{' '}
                    <b className={!row.canMove && !row.zenOk ? 'bad' : ''}>{entry.zen.toLocaleString()} Zen</b>
                  </span>
                </>
              )}
            </MobileButton>
          );
        })}
      </div>
      <MobileButton className="mobile-teleport-close" onTap={closeMoveWindow}>
        {() => <span>{t('common.close')}</span>}
      </MobileButton>
    </div>
  );
});
