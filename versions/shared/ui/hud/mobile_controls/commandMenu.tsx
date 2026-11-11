import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { t, type TextKey } from '@/i18n';
import { MuWindows } from '@/controllers/interface/windowManager';
import { Messenger } from '@/modules/friends/messenger';
import { Social } from '@/modules/social/social';
import { SessionExit } from '@/modules/session/sessionExit';
import { toggleMuHelperWindow } from '@/modules/mu_helper/state';
import { MobileButton } from './mobileButton';
import { MobileMenu } from './menuState';
import { Icon, type IconName } from './icons';

type Tile = { icon: IconName; label: TextKey; run: () => void };

const open = (id: string) => () => MuWindows.setOpen(id, true);

/** Every command of the original's five buttons and window menu, one thumb-sized tile each. */
const TILES: readonly Tile[] = [
  { icon: 'move', label: 'mobile.cmd.move', run: open('move_command') },
  { icon: 'inventory', label: 'mobile.cmd.inventory', run: open('inventory') },
  { icon: 'character', label: 'mobile.cmd.points', run: () => (MobileMenu.stats = true) },
  { icon: 'skills', label: 'mobile.cmd.skills', run: () => (MobileMenu.picker = 0) },
  { icon: 'friends', label: 'mobile.cmd.friends', run: () => Messenger.toggleWindow() },
  { icon: 'party', label: 'mobile.cmd.party', run: open('party') },
  { icon: 'guild', label: 'mobile.cmd.guild', run: () => (Social.guildWindowEnabled = true) },
  { icon: 'quests', label: 'mobile.cmd.quests', run: open('quests') },
  { icon: 'map', label: 'mobile.cmd.map', run: () => MuWindows.setOpen('minimap', !MuWindows.isOpen('minimap')) },
  { icon: 'helper', label: 'mobile.cmd.helper', run: () => toggleMuHelperWindow(true) },
  { icon: 'options', label: 'mobile.cmd.options', run: () => (MobileMenu.settings = true) },
  { icon: 'switch', label: 'mobile.cmd.switch', run: () => SessionExit.request('characters') },
  { icon: 'system', label: 'mobile.cmd.system', run: () => (SessionExit.menuOpen = true) },
];

export const CommandMenu = observer(() => {
  if (!MobileMenu.open) return null;
  const close = () => (MobileMenu.open = false);

  return (
    <div className="mobile-modal" onPointerDown={close}>
      <div className="mobile-panel mobile-commands" onPointerDown={e => e.stopPropagation()}>
        <div className="mobile-panel-head">
          <span>{t('mobile.commands')}</span>
          <MobileButton className="mobile-close" onTap={close}>
            {() => <Icon name="close" size={20} />}
          </MobileButton>
        </div>
        <div className="mobile-tiles">
          {TILES.map(tile => (
            <MobileButton
              key={tile.label}
              className="mobile-tile"
              onTap={() =>
                runInAction(() => {
                  close();
                  tile.run();
                })
              }
            >
              {() => (
                <>
                  <Icon name={tile.icon} size={34} />
                  <span>{t(tile.label)}</span>
                </>
              )}
            </MobileButton>
          ))}
        </div>
      </div>
    </div>
  );
});
