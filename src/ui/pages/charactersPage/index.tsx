import './style.less';
import { observer } from 'mobx-react-lite';
import { Store } from '../../../store';
import { useEventBus } from '../../../hooks/useEventBus';
import { MAX_USERNAME_LENGTH } from '../../../consts';
import { useEffect, useState } from 'react';
import {
  CharacterCreationFailedPacket,
  CharacterCreationSuccessfulPacket,
  CharacterFocusedPacket,
  CharacterListPacket,
} from '../../../common/packets/ServerToClientPackets';
import { CharacterClassNumber } from '../../../common';
import { appearanceClassCode, classFromAppearance } from '../../../common/deserializeAppearance';
import { ClassIcon, MenuBackdrop, MuLogo, classInfo } from '../../shell/menu';

const MAX_SLOTS = 5;
const CREATABLE = [CharacterClassNumber.DarkKnight, CharacterClassNumber.DarkWizard, CharacterClassNumber.FairyElf];

export const CharactersPage = observer(() => {
  const [message, setMessage] = useState('');
  const [creating, setCreatingRaw] = useState(false);
  const setCreating = (v: boolean) => {
    setMessage('');
    setCreatingRaw(v);
  };

  useEffect(() => {
    Store.refreshCharactersListRequest();
  }, [Store]);

  // Si la lista no llega, reintentar y, al final, mostrar la pantalla igualmente
  useEffect(() => {
    if (!Store.loadingCharactersList) return;
    let tries = 0;
    const t = setInterval(() => {
      if (!Store.loadingCharactersList) return clearInterval(t);
      if (++tries > 3) {
        Store.loadingCharactersList = false;
        setMessage('No se pudo actualizar la lista. Vuelve a entrar si no ves tus personajes.');
        return clearInterval(t);
      }
      Store.refreshCharactersListRequest();
    }, 3500);
    return () => clearInterval(t);
  }, [Store.loadingCharactersList]);

  useEventBus('CharacterList', bytes => {
    Store.loadingCharactersList = false;
    const p = new CharacterListPacket(bytes);
    Store.charactersList = p.getCharacters();

    const list = Store.charactersList;
    if (list.length && !list.some(c => c.Name === Store.focusedChar)) {
      Store.focusedChar = list[0].Name;
      Store.focusCharacterRequest(list[0].Name);
    }
  });

  useEventBus('CharacterCreationFailed', bytes => {
    const p = new CharacterCreationFailedPacket(bytes);
    console.log(p);
    setMessage('No se pudo crear el personaje (nombre en uso o inválido).');
  });

  // OpenMU no reenvía la lista (F3 00) si ya estamos en la selección de personaje,
  // así que, igual que el cliente original, se añade el personaje con los datos de F3 01.
  useEventBus('CharacterCreationSuccessful', bytes => {
    const requestedClass = Store.newCharClass;
    const p = new CharacterCreationSuccessfulPacket(bytes);
    const name = p.CharacterName || Store.newCharName;
    Store.newCharName = '';
    Store.newCharClass = CharacterClassNumber.DarkKnight;

    const appearance = new DataView(new ArrayBuffer(18));
    const preview = p.PreviewData;
    for (let i = 0; i < Math.min(18, preview.byteLength); i++) appearance.setUint8(i, preview.getUint8(i));
    if (preview.byteLength < 18 || classFromAppearance(appearance) !== requestedClass) {
      // Vista previa vacía o ilegible: codificar al menos la clase elegida (bits 3..7 del byte 0)
      appearance.setUint8(0, (appearanceClassCode(requestedClass) << 3) & 0xf8);
    }

    const entry = {
      SlotIndex: p.CharacterSlot,
      Name: name,
      Level: p.Level || 1,
      Status: 0,
      IsItemBlockActive: false,
      Appearance: appearance,
      GuildPosition: 0xff,
    } as (typeof Store.charactersList)[number];

    Store.charactersList = [...Store.charactersList.filter(c => c.Name !== name), entry].sort(
      (a, b) => a.SlotIndex - b.SlotIndex
    );
    Store.loadingCharactersList = false;
    setMessage('');
    setCreating(false);
    Store.focusedChar = name;
    Store.focusCharacterRequest(name);
  });

  useEventBus('CharacterFocused', bytes => {
    const p = new CharacterFocusedPacket(bytes);
    Store.focusedChar = p.CharacterName;
  });

  const onCharacterFocus = (name: string) => {
    Store.focusedChar = name;
    Store.focusCharacterRequest(name);
  };

  const onCreateClicked = () => {
    if (Store.newCharName.length < 4) {
      setMessage('El nombre debe tener al menos 4 caracteres.');
      return;
    }
    setMessage('');
    Store.createCharacterRequest(Store.newCharName, Store.newCharClass);
  };

  const list = Store.charactersList;
  const focused = list.find(c => c.Name === Store.focusedChar) ?? list[0];
  const focusedInfo = focused ? classInfo(classFromAppearance(focused.Appearance)) : null;

  return (
    <div className="mu-screen mu-chars">
      <MenuBackdrop />

      <header className="mu-chars-top">
        <MuLogo small />
        <span className="mu-pill">
          <i className="dot ok" /> Servidor 1 · En línea
        </span>
      </header>

      {Store.loadingCharactersList && !list.length ? (
        <div className="mu-connecting">
          <i className="spinner" />
          <span>Cargando personajes…</span>
        </div>
      ) : (
        <div className="mu-chars-body">
          <div className="mu-slots">
            {Array.from({ length: MAX_SLOTS }, (_, i) => {
              const c = list[i];
              if (!c) {
                return (
                  <button key={i} className="mu-slot empty" onClick={() => setCreating(true)}>
                    <span className="plus">＋</span>
                    <span>Crear personaje</span>
                  </button>
                );
              }
              const info = classInfo(classFromAppearance(c.Appearance));
              return (
                <button
                  key={c.Name}
                  className={`mu-slot${focused?.Name === c.Name ? ' active' : ''}`}
                  onClick={() => onCharacterFocus(c.Name)}
                >
                  <ClassIcon glyph={info.glyph} color={info.color} />
                  <span className="meta">
                    <b>{c.Name}</b>
                    <em>
                      {info.name} · Nv. {c.Level}
                    </em>
                  </span>
                </button>
              );
            })}
            {Store.loadingCharactersList && <p className="mu-note">Actualizando…</p>}
          </div>

          <div className="mu-stage">
            {focused && focusedInfo ? (
              <>
                <div className="mu-hero-class" style={{ ['--c' as any]: focusedInfo.color }}>
                  <div className="halo" />
                  <ClassIcon glyph={focusedInfo.glyph} color={focusedInfo.color} />
                </div>
                <h2 className="mu-name">{focused.Name}</h2>
                <p className="mu-sub">
                  {focusedInfo.name} · Nivel {focused.Level}
                </p>
                <button className="mu-btn big" onClick={() => Store.selectCharacterRequest(focused.Name)}>
                  ENTRAR AL MUNDO
                </button>
              </>
            ) : (
              <>
                <h2 className="mu-name">Sin personajes</h2>
                <p className="mu-sub">Crea tu primer héroe para empezar</p>
                <button className="mu-btn big" onClick={() => setCreating(true)}>
                  CREAR PERSONAJE
                </button>
              </>
            )}
            {!!message && !creating && <p className="mu-error">{message}</p>}
          </div>
        </div>
      )}

      {creating && (
        <div className="mu-modal" onClick={() => setCreating(false)}>
          <div className="mu-frame mu-create" onClick={e => e.stopPropagation()}>
            <h3>Nuevo personaje</h3>
            <div className="mu-classes">
              {CREATABLE.map(cls => {
                const info = classInfo(cls);
                return (
                  <button
                    key={cls}
                    className={`mu-class${Store.newCharClass === cls ? ' active' : ''}`}
                    style={{ ['--c' as any]: info.color }}
                    onClick={() => (Store.newCharClass = cls)}
                  >
                    <ClassIcon glyph={info.glyph} color={info.color} />
                    <b>{info.name}</b>
                    <em>{info.role}</em>
                  </button>
                );
              })}
            </div>
            <label>
              Nombre (4 a {MAX_USERNAME_LENGTH} letras)
              <input
                type="text"
                autoCapitalize="none"
                minLength={4}
                maxLength={MAX_USERNAME_LENGTH}
                value={Store.newCharName}
                onChange={e => (Store.newCharName = e.target.value.trim())}
              />
            </label>
            {!!message && <p className="mu-error">{message}</p>}
            <div className="mu-row">
              <button className="mu-btn ghost" onClick={() => setCreating(false)}>
                Cancelar
              </button>
              <button className="mu-btn" onClick={onCreateClicked}>
                CREAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
