import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { GameOptions } from '@/controllers/settings/gameOptions';
import { clearStick, setStick, stickDirection, TouchStick } from '@/controllers/interface/touchStick';

/**
 * The thumb stick, bottom left. A touch starting on the ring grabs it; the knob follows the thumb,
 * clamped to the ring, and the hero walks that way until the thumb lifts. All the walking is the
 * player controller's (`controllers/interface/touchStick.ts`); this only reports a direction.
 */
/** The pad's ring: bronze, bone spikes and a skull on top, in the MU style (drawn here, no outside art). */
const Ring = observer(() => (
  <svg className="mobile-stick-ring" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <linearGradient id="stickBronze" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e3b766" />
        <stop offset="0.45" stopColor="#8a5a22" />
        <stop offset="1" stopColor="#3c240e" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="44" fill="rgba(10,7,4,0.28)" stroke="url(#stickBronze)" strokeWidth="5" />
    <circle cx="50" cy="50" r="39.5" fill="none" stroke="rgba(30,18,8,0.85)" strokeWidth="1.2" />
    {Array.from({ length: 12 }, (_, i) => (
      <path
        key={i}
        d="M50 4.5 L52.2 13 L50 16.5 L47.8 13 Z"
        fill="#e6dcc2"
        stroke="#3c2a14"
        strokeWidth="0.6"
        transform={`rotate(${i * 30 + 15} 50 50)`}
      />
    ))}
    <g transform="translate(50 6)">
      <path d="M-6 0 C-6 -6 6 -6 6 0 L6 3 L3 5 L-3 5 L-6 3 Z" fill="#e6dcc2" stroke="#3c2a14" strokeWidth="0.7" />
      <circle cx="-2.4" cy="0.2" r="1.5" fill="#2a1a0c" />
      <circle cx="2.4" cy="0.2" r="1.5" fill="#2a1a0c" />
    </g>
  </svg>
));

export const Joystick = observer(() => {
  const ring = useRef<HTMLDivElement>(null);
  const finger = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [held, setHeld] = useState(false);

  // A stick left held by an unmount (the page changes under the thumb) would walk the hero by itself.
  useEffect(() => clearStick, []);

  const follow = (e: PointerEvent) => {
    const box = ring.current?.getBoundingClientRect();
    if (!box) return;

    const radius = box.width / 2;
    let dx = e.clientX - (box.left + radius);
    let dy = e.clientY - (box.top + radius);
    const length = Math.hypot(dx, dy);
    if (length > radius) {
      dx = (dx * radius) / length;
      dy = (dy * radius) / length;
    }

    setKnob({ x: dx, y: dy });
    setStick(stickDirection(dx, dy, radius, undefined, TouchStick));
  };

  const release = (e: PointerEvent) => {
    if (finger.current !== e.pointerId) return;
    finger.current = null;
    setKnob({ x: 0, y: 0 });
    setHeld(false);
    clearStick();
  };

  return (
    <div
      ref={ring}
      className={`mobile-stick size-${GameOptions.touchStickSize}${GameOptions.touchStickHidden ? ' is-hidden' : ''}${held ? ' is-held' : ''}`}
      onPointerDown={e => {
        e.stopPropagation();
        if (finger.current !== null) return;
        finger.current = e.pointerId;
        setHeld(true);
        e.currentTarget.setPointerCapture?.(e.pointerId);
        follow(e);
      }}
      onPointerMove={e => {
        if (finger.current === e.pointerId) follow(e);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <Ring />
      <i className="mobile-stick-mark n" />
      <i className="mobile-stick-mark e" />
      <i className="mobile-stick-mark s" />
      <i className="mobile-stick-mark w" />
      <div className="mobile-stick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      <span className="mobile-stick-label">{t('mobile.move')}</span>
    </div>
  );
});
