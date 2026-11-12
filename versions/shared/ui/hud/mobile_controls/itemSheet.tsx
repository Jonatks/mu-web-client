import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { ItemSheet } from '../../components/item_grid/mobileSheet';
import { ItemTooltip } from '../../components/item_tooltip';
import { ItemIcon } from '@/controllers/interface/components/item_icon';
import { MobileButton } from './mobileButton';

/**
 * Mu Magdalena's item sheet: a framed panel with the item's picture, its whole tooltip and a Move button (carry it, then tap where
 * it goes) and, when the item has one, Use (drink, equip, send to the open storage).
 */
export const ItemSheetView = observer(() => {
  const entry = ItemSheet.entry;
  if (!entry) return null;
  const close = () => (ItemSheet.entry = null);
  const run = (action: () => void) => () => {
    close();
    action();
  };

  // The panel is about 455x365 at 915x412 (Mu Magdalena's); the tooltip hangs from just under the picture.
  const panelTop = Math.max(8, (window.innerHeight - Math.min(window.innerHeight - 16, 365)) / 2);

  return (
    <div className="mobile-modal mobile-item-sheet" onPointerDown={close}>
      <div className="mobile-sheet-panel" onPointerDown={e => e.stopPropagation()}>
        <div className="mobile-sheet-picture">
          <ItemIcon item={entry.item} />
        </div>
      </div>
      <ItemTooltip
        item={entry.item}
        x={window.innerWidth / 2}
        y={panelTop + 70}
        context={entry.context}
        slot={entry.slot}
        linkable={false}
      />
      <div className="mobile-sheet-actions" onPointerDown={e => e.stopPropagation()}>
        {entry.use && (
          <MobileButton className="mobile-sheet-button" onTap={run(entry.use)}>
            {() => <span>{t(entry.useLabel ?? 'mobile.use')}</span>}
          </MobileButton>
        )}
        {entry.move && (
          <MobileButton className="mobile-sheet-button primary" onTap={run(entry.move)}>
            {() => <span>{t(entry.moveLabel ?? 'mobile.move')}</span>}
          </MobileButton>
        )}
      </div>
    </div>
  );
});
