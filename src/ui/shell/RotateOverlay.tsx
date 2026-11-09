import { useEffect, useState } from 'react';
import { isPortrait, isTouchDevice } from './device';

export const RotateOverlay = () => {
  const [portrait, setPortrait] = useState(isPortrait());
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const on = () => setPortrait(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  if (!portrait || !isTouchDevice()) return null;
  return (
    <div className="rotate-overlay">
      <div className="rotate-icon">⟳</div>
      <p>Gira tu dispositivo en horizontal para jugar</p>
    </div>
  );
};
