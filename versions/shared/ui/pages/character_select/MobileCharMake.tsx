import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { Ecs } from '@/ecs/current';
import { CharSelect } from '@/modules/character_select';
import { gameVersion } from '@/version';
import { createClassPreview, type ClassPreview } from './classPreview';
import { CREATABLE_CLASSES, NAME_MAX_LENGTH, offeredBy } from './layout';
import { tryCreateCharacter } from './createCharacter';

/**
 * "Create a new hero" for a touch screen (Mu Magdalena's): the class on show in the middle (the same 3D preview the original window
 * uses), a card at the bottom with the class pills, the name field and Create / Cancel. Same checks and the same request.
 */
export const MobileCharMake = observer(({ onClose }: { onClose: () => void }) => {
  const selected = CREATABLE_CLASSES.find(c => c.netClass === CharSelect.newCharClass) ?? CREATABLE_CLASSES[0];
  const previewRef = useRef<HTMLDivElement>(null);
  const preview = useRef<ClassPreview | null>(null);

  useEffect(() => {
    const world = Ecs.world;
    if (!world) return undefined;
    const instance = createClassPreview(world, () => previewRef.current?.getBoundingClientRect() ?? null);
    preview.current = instance;
    return () => {
      preview.current = null;
      instance.dispose();
    };
  }, []);

  useEffect(() => {
    preview.current?.setClass(selected.classType);
  }, [selected.classType]);

  const isUnlocked = (unlock: number | null) => unlock === null || (CharSelect.creationUnlockFlags & unlock) !== 0;

  return (
    <div className="char-mk">
      <div className="char-mk-preview" ref={previewRef} />
      <div className="char-mk-card">
        <div className="char-mk-title">{t('characters.m.newHero')}</div>
        <div className="char-mk-classes">
          {CREATABLE_CLASSES.map(cls => {
            const enabled = isUnlocked(cls.unlock) && offeredBy(cls, gameVersion.features);
            return (
              <button
                key={cls.classType}
                className={`char-mk-class${cls.classType === selected.classType ? ' on' : ''}`}
                disabled={!enabled}
                onClick={() => {
                  CharSelect.newCharClass = cls.netClass;
                }}
              >
                {t(cls.nameKey)}
              </button>
            );
          })}
        </div>
        <form
          className="char-mk-row"
          onSubmit={e => {
            e.preventDefault();
            tryCreateCharacter(selected.netClass);
          }}
        >
          <input
            value={CharSelect.newCharName}
            maxLength={NAME_MAX_LENGTH}
            placeholder={t('characters.m.name')}
            spellCheck={false}
            autoComplete="off"
            onChange={e => (CharSelect.newCharName = e.target.value)}
          />
          <button type="submit" className="char-m-pill primary" disabled={CharSelect.charCreationPending}>
            {t('characters.m.create')}
          </button>
          <button type="button" className="char-m-pill" onClick={onClose}>
            {t('characters.m.cancel')}
          </button>
        </form>
      </div>
    </div>
  );
});
