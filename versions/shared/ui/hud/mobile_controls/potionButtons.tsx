import { observer } from 'mobx-react-lite';
import { ItemIcon } from '@/controllers/interface/components/item_icon';
import { Hero } from '@/modules/hero';
import { Bag } from '@/modules/inventory';
import {
  countHotkeyItems,
  findHotkeyItem,
} from '@/modules/inventory/itemHotkeys';
import { gameVersion } from '@/version';
import { MobileButton } from './mobileButton';

/** The belt's Q (life) and W (mana): the two a thumb needs in a fight. */
const POTION_SLOTS = [0, 1];

const PotionButton = observer(({ index }: { index: number }) => {
  const items = Hero.items;
  const hotkey = Bag.itemHotkeys[index];
  const slot = findHotkeyItem(items, index, hotkey);
  const count = slot >= 0 ? countHotkeyItems(items, index, hotkey) : 0;
  const item = slot >= 0 ? items[slot] : null;
  // Nothing to drink: no ghost button over the picture.
  if (!item) return null;

  return (
    <MobileButton
      className={`mobile-potion-button slot-${index}${count ? '' : ' is-empty'}`}
      onTap={() => Bag.useItemHotkey(index)}
    >
      {() => (
        <>
          {!!item && <ItemIcon item={item} />}
          {count > 0 && <span className="mobile-potion-count">{count}</span>}
        </>
      )}
    </MobileButton>
  );
});

/** Quick potions beside the menu buttons, like Mu Magdalena's round potion button. */
export const PotionButtons = observer(() =>
  gameVersion.features.itemHotkeys.slots > 1 ? (
    <div className="mobile-potion-column">
      {POTION_SLOTS.map(i => (
        <PotionButton key={i} index={i} />
      ))}
    </div>
  ) : null
);
