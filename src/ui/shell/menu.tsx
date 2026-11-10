import { useMemo } from 'react';
import { CharacterClassNumber } from '../../common';

export const MenuBackdrop = () => {
  const embers = useMemo(
    () =>
      Array.from({ length: 22 }, () => ({
        left: Math.round(Math.random() * 100),
        size: 2 + Math.random() * 3,
        delay: Math.random() * 10,
        dur: 8 + Math.random() * 8,
      })),
    [],
  );
  return (
    <div className="mu-backdrop">
      <div className="mu-fog" />
      {embers.map((e, i) => (
        <span
          key={i}
          className="ember"
          style={{
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
            animationDelay: `-${e.delay}s`,
            animationDuration: `${e.dur}s`,
          }}
        />
      ))}
      <div className="mu-vignette" />
    </div>
  );
};

export const MuLogo = ({ small }: { small?: boolean }) => (
  <div className={`mu-logo${small ? ' small' : ''}`}>
    <span className="mu">MU</span>
    <span className="sub">ONLINE · WEB</span>
  </div>
);

type ClassInfo = { name: string; role: string; color: string; glyph: 'sword' | 'staff' | 'bow' | 'star' };

export function classInfo(cls: CharacterClassNumber): ClassInfo {
  switch (cls) {
    case CharacterClassNumber.DarkKnight:
    case CharacterClassNumber.BladeKnight:
    case CharacterClassNumber.BladeMaster:
      return { name: 'Dark Knight', role: 'Guerrero cuerpo a cuerpo', color: '#d9534f', glyph: 'sword' };
    case CharacterClassNumber.DarkWizard:
    case CharacterClassNumber.SoulMaster:
    case CharacterClassNumber.GrandMaster:
      return { name: 'Dark Wizard', role: 'Mago de largo alcance', color: '#5b8def', glyph: 'staff' };
    case CharacterClassNumber.FairyElf:
    case CharacterClassNumber.MuseElf:
    case CharacterClassNumber.HighElf:
      return { name: 'Fairy Elf', role: 'Arquera y apoyo', color: '#5fbf6b', glyph: 'bow' };
    default:
      return { name: CharacterClassNumber[cls] ?? 'Héroe', role: 'Clase avanzada', color: '#c58be8', glyph: 'star' };
  }
}

export const ClassIcon = ({ glyph, color }: { glyph: ClassInfo['glyph']; color: string }) => (
  <svg viewBox="0 0 64 64" className="class-icon" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {glyph === 'sword' && (
      <>
        <path d="M32 6v36" />
        <path d="M28 10l4-6 4 6" />
        <path d="M20 42h24" />
        <path d="M32 42v14" />
        <path d="M28 56h8" />
      </>
    )}
    {glyph === 'staff' && (
      <>
        <path d="M22 58L42 20" />
        <circle cx="44" cy="14" r="8" />
        <path d="M44 6v-3M52 14h3M36 14h-3M50 8l2-2" />
      </>
    )}
    {glyph === 'bow' && (
      <>
        <path d="M18 8c20 6 20 42 0 48" />
        <path d="M18 8v48" strokeWidth="1.6" />
        <path d="M14 32h40" />
        <path d="M48 26l6 6-6 6" />
      </>
    )}
    {glyph === 'star' && <path d="M32 6l7 17 18 2-14 12 5 18-16-10-16 10 5-18L7 25l18-2z" />}
  </svg>
);
