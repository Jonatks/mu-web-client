import { useEffect } from 'react';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { CharSelect } from '@/modules/character_select';
import { characterSelectView } from '@/modules/character_select/characterSelect';
import { classFromAppearance } from '@/controllers/actors/deserializeAppearance';
import { getClassName } from '@/modules/hero/characterStats';
import { hasFreeSlot, selectedCharacter } from './character_list';

type Props = {
  selecting: boolean;
  onConnect: () => void;
  onCreate: () => void;
  onDelete: () => void;
  onMenu: () => void;
};

/**
 * The character screen of a touch screen (Mu Magdalena's): one card at the bottom with the focused character's name,
 * class and level, a dot per character, big arrows to flip through them and Enter / Create / Delete as pills. The
 * focused character is zoomed on, so it is seen large instead of five small figures in the dark.
 */
export const MobilePanel = observer(({ selecting, onConnect, onCreate, onDelete, onMenu }: Props) => {
  const list = CharSelect.charactersList;
  const selected = selectedCharacter(list, CharSelect.focusedChar);
  const index = selected ? list.findIndex(c => c.Name === selected.Name) : -1;

  // A focused character is the one on screen: the camera comes in on it.
  useEffect(() => {
    runInAction(() => {
      characterSelectView.zoomedOn = selected?.Name ?? null;
    });
  }, [selected?.Name]);

  const go = (step: number) => {
    if (!list.length) return;
    const next = list[(Math.max(index, 0) + step + list.length) % list.length];
    CharSelect.focusCharacterRequest(next.Name);
  };

  return (
    <div className="char-m">
      <button className="char-m-menu" onClick={onMenu} aria-label={t('characters.m.menu')}>
        ≡
      </button>
      <button className="char-m-arrow left" onClick={() => go(-1)} disabled={list.length < 2} aria-label="‹">
        ‹
      </button>
      <div className="char-m-card">
        {selected ? (
          <>
            <div className="char-m-name">{selected.Name}</div>
            <div className="char-m-info">
              {getClassName(classFromAppearance(selected.Appearance))} · {t('common.level')} {selected.Level}
            </div>
          </>
        ) : (
          <div className="char-m-info">{CharSelect.loadingCharactersList ? t('characters.loading') : t('characters.select')}</div>
        )}
        <div className="char-m-dots">
          {list.map(c => (
            <i key={c.Name} className={c.Name === selected?.Name ? 'on' : ''} />
          ))}
        </div>
        <div className="char-m-actions">
          <button className="char-m-pill primary" disabled={!selected || selecting} onClick={onConnect}>
            {t('characters.m.enter')}
          </button>
          <button className="char-m-pill" disabled={!hasFreeSlot(list)} onClick={onCreate}>
            {t('characters.m.create')}
          </button>
          <button className="char-m-pill danger" disabled={!selected} onClick={onDelete}>
            {t('characters.m.delete')}
          </button>
        </div>
      </div>
      <button className="char-m-arrow right" onClick={() => go(1)} disabled={list.length < 2} aria-label="›">
        ›
      </button>
    </div>
  );
});
