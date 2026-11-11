import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { ItemSheet } from '../../components/item_grid/mobileSheet';
import { ItemTooltip } from '../../components/item_tooltip';
import { MobileButton } from './mobileButton';

/**
 * Mu Magdalena's item sheet: the item's whole tooltip centred on the screen with a Move button (carry it, then tap where
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

  return (
    <div className="mobile-modal mobile-item-sheet" onPointerDown={close}>
      <ItemTooltip
        item={entry.item}
        x={window.innerWidth / 2}
        y={Math.max(10, window.innerHeight * 0.06)}
        context={entry.context}
        slot={entry.slot}
        linkable={false}
      />
      <div className="mobile-sheet-actions" onPointerDown={e => e.stopPropagation()}>
        <MobileButton className="mobile-sheet-button primary" onTap={run(entry.move)}>
          {() => <span>{t('mobile.move')}</span>}
        </MobileButton>
        {entry.use && (
          <MobileButton className="mobile-sheet-button" onTap={run(entry.use)}>
            {() => <span>{t('mobile.use')}</span>}
          </MobileButton>
        )}
        <MobileButton className="mobile-sheet-button" onTap={close}>
          {() => <span>{t('common.close')}</span>}
        </MobileButton>
      </div>
    </div>
  );
});
