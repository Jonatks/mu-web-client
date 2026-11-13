import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { observer } from 'mobx-react-lite';
import { PadRing } from './muArt';
import { t } from '@/i18n';
import { GameOptions } from '@/controllers/settings/gameOptions';
import { clearStick, setStick, stickDirection, TouchStick } from '@/controllers/interface/touchStick';

/**
 * The thumb stick, bottom left. A touch starting on the ring grabs it; the knob follows the thumb,
 * clamped to the ring, and the hero walks that way until the thumb lifts. All the walking is the
 * player controller's (`controllers/interface/touchStick.ts`); this only reports a direction.
 */
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
      <PadRing />
      <i className="mobile-stick-mark n" />
      <i className="mobile-stick-mark e" />
      <i className="mobile-stick-mark s" />
      <i className="mobile-stick-mark w" />
      <div className="mobile-stick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      <span className="mobile-stick-label">{t('mobile.move')}</span>
    </div>
  );
});
