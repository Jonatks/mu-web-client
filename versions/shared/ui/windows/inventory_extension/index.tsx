import { MuWindows } from '@/controllers/interface/windowManager';
import { t } from '@/i18n';
import './style.less';
import { observer } from 'mobx-react-lite';
import { Bag } from '@/modules/inventory';
import { Hero } from '@/modules/hero';
import { Economy } from '@/modules/economy/economy';
import { Merchant } from '@/modules/npc_shop';
import { QuickItemActions } from '@/modules/inventory/quickItemActions';
import { StorageKind } from '@/modules/inventory/itemStorage';
import { InventoryConstants } from '@/core/inventoryConstants';
import { MuItemWindow } from '@/controllers/interface/components/mu_window';
import { ItemGrid } from '../../components/item_grid';

const WINDOW_ID = 'inventory_extension';
const COLUMNS = InventoryConstants.RowSize;
const ROWS = InventoryConstants.RowsOfOneExtension;
const GRID_X = 15;
const GRID_Y = 36;
/** One 8x4 box under the next, as `CInventoryExtension` stacks them (20 px squares, 6 px apart). */
const GRID_PITCH = ROWS * 20 + 6;

/** The first slot of extension `n`: OpenMU keeps them after the 8x8 bag, 32 squares each (`InventoryStorage.cs:41`). */
export function extensionFirstSlot(n: number): number {
  return InventoryConstants.FirstExtensionItemSlotIndex + n * COLUMNS * ROWS;
}

/**
 * `CInventoryExtension`: the extra bag pages a character has bought (`Character.InventoryExtensions`, up to four of
 * 8x4), beside the inventory. They are inventory slots, so pick, place and the right click work as in the bag.
 */
export const InventoryExtension = observer(() => {
  const count = Math.min(Hero.inventoryExtensions, InventoryConstants.MaximumNumberOfExtensions);
  if (!MuWindows.isOpen(WINDOW_ID) || !MuWindows.isOpen('inventory') || count === 0) return null;

  const column = 1 + (MuWindows.isOpen('character_info') ? 1 : 0) + (Economy.vaultOpen ? 1 : 0);
  const close = () => MuWindows.setOpen(WINDOW_ID, false);

  return (
    <MuItemWindow id={WINDOW_ID} className="inventory-extension" column={column} label={t('inventoryExt.title')} onClose={close}>
      <div className="window-title">{t('inventoryExt.title')}</div>
      <div className="head-close" data-no-drag="true" onClick={close} />
      {Array.from({ length: count }, (_, n) => (
        <ItemGrid
          key={n}
          items={Hero.items}
          columns={COLUMNS}
          rows={ROWS}
          left={GRID_X}
          top={GRID_Y + n * GRID_PITCH}
          offset={extensionFirstSlot(n)}
          disabled={!!Bag.pendingItemMove}
          dropTint={Bag.pickedItem ? 'ok' : 'none'}
          tooltipContext="inventory"
          onPick={slot => {
            if (Merchant.repairMode) Merchant.repairItemRequest(slot);
            else Bag.pickInventoryItem(slot);
          }}
          onPlace={slot => Bag.placePickedItem(slot)}
          onUse={slot => {
            const target = Economy.autoMoveTarget;
            if (target !== null) Bag.autoMoveItem(StorageKind.Inventory, slot, target);
          }}
          onQuickAction={slot => QuickItemActions.fromInventory(slot)}
        />
      ))}
    </MuItemWindow>
  );
});
