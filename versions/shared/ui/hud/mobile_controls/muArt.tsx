import { observer } from 'mobx-react-lite';

/**
 * The touch HUD's own art, in the MU style of Mu Magdalena's (bronze, bone, skulls, an orange gem), drawn here as SVG so no outside
 * picture is used. The gradients are defined once (`MuArtDefs`) and shared by every piece.
 */

const ring = (r: number, stroke: string, width: number, key?: string) => (
  <circle key={key} cx="100" cy="100" r={r} fill="none" stroke={stroke} strokeWidth={width} />
);

/** One bone tusk on the ring's top, curving clockwise; the others are this one rotated. */
const FANG = 'M103 15 Q120 6 134 25.5 Q121 15.5 105.5 23.5 Z';

/** A skull with two horns, 40 units wide, centred on (0, 0). */
const Skull = observer(() => (
  <g>
    <path d="M-8 -2 C-15 -5 -19 2 -17 9 C-15 4 -12 1 -8 2 Z" fill="url(#muBone)" stroke="#3a2814" strokeWidth="0.8" />
    <path d="M8 -2 C15 -5 19 2 17 9 C15 4 12 1 8 2 Z" fill="url(#muBone)" stroke="#3a2814" strokeWidth="0.8" />
    <path d="M-9 2 C-11 -11 11 -11 9 2 C9 6 6.5 7 6.5 9 L-6.5 9 C-6.5 7 -9 6 -9 2 Z" fill="url(#muBone)" stroke="#3a2814" strokeWidth="0.9" />
    <ellipse cx="-3.7" cy="0.6" rx="2.7" ry="2.3" fill="#1a0f06" />
    <ellipse cx="3.7" cy="0.6" rx="2.7" ry="2.3" fill="#1a0f06" />
    <path d="M0 3.4 L-1.3 6 L1.3 6 Z" fill="#1a0f06" />
    <rect x="-5.2" y="8.4" width="10.4" height="3.2" rx="0.8" fill="url(#muBone)" stroke="#3a2814" strokeWidth="0.6" />
    <path d="M-2.6 8.6 V11.4 M0 8.6 V11.4 M2.6 8.6 V11.4" stroke="#3a2814" strokeWidth="0.6" />
  </g>
));

/** A bronze diamond with an orange gem, centred on the ring's top before rotation. */
const Stud = observer(({ angle, size = 1 }: { angle: number; size?: number }) => (
  <g transform={`rotate(${angle} 100 100) translate(100 21) scale(${size})`}>
    <path d="M0 -10 L7 0 L0 10 L-7 0 Z" fill="url(#muBronze)" stroke="#2a1708" strokeWidth="0.9" />
    <circle r="3.2" fill="url(#muGem)" stroke="#3a1a06" strokeWidth="0.6" />
  </g>
));

/** A bronze band across the ring with one rivet. */
const Clasp = observer(({ angle }: { angle: number }) => (
  <g transform={`rotate(${angle} 100 100)`}>
    <rect x="95" y="13" width="10" height="17" rx="2" fill="url(#muBronze)" stroke="#2a1708" strokeWidth="0.9" />
    <circle cx="100" cy="21.5" r="1.8" fill="#f2cf86" stroke="#4a2c10" strokeWidth="0.5" />
  </g>
));

export const MuArtDefs = observer(() => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
    <defs>
      <linearGradient id="muBronze" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f6d58e" />
        <stop offset="0.35" stopColor="#b47a34" />
        <stop offset="0.7" stopColor="#6b4118" />
        <stop offset="1" stopColor="#2e1a08" />
      </linearGradient>
      <linearGradient id="muBronzeRim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f0c87a" />
        <stop offset="0.5" stopColor="#8a5a22" />
        <stop offset="1" stopColor="#c99448" />
      </linearGradient>
      <linearGradient id="muBone" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stopColor="#fbf3dd" />
        <stop offset="0.55" stopColor="#d9c69c" />
        <stop offset="1" stopColor="#8a6d42" />
      </linearGradient>
      <radialGradient id="muGem" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#ffe0a0" />
        <stop offset="0.4" stopColor="#f08a22" />
        <stop offset="1" stopColor="#7a2a04" />
      </radialGradient>
      <radialGradient id="muWell" cx="0.4" cy="0.3" r="0.75">
        <stop offset="0" stopColor="#3a2a1a" />
        <stop offset="0.6" stopColor="#17100a" />
        <stop offset="1" stopColor="#050403" />
      </radialGradient>
      <radialGradient id="muGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffd27a" stopOpacity="0.95" />
        <stop offset="0.45" stopColor="#ff8a1e" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ff6a00" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="muPage" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f6e2b0" />
        <stop offset="1" stopColor="#b98a4a" />
      </linearGradient>
    </defs>
  </svg>
));

/** The pad's ring: a dark leather band between two bronze lines, bone tusks paired on bronze clasps, gems, a horned skull on top. */
export const PadRing = observer(() => (
  <svg className="mobile-stick-ring" viewBox="-8 -12 216 216" overflow="visible" aria-hidden="true">
    {ring(79, 'rgba(36,22,11,0.92)', 9)}
    {ring(84, 'url(#muBronzeRim)', 2.4)}
    {ring(74, 'url(#muBronzeRim)', 2.2)}
    {ring(79, 'rgba(255,220,150,0.12)', 1)}
    {Array.from({ length: 24 }, (_, i) => (
      <circle key={i} cx="100" cy="21" r="1.3" fill="#d9a85a" stroke="#3a220c" strokeWidth="0.4" transform={`rotate(${i * 15 + 7.5} 100 100)`} />
    ))}
    {[45, 90, 135, 180, 225, 270, 315].map(a => (
      <g key={a}>
        <g transform={`rotate(${a} 100 100)`}>
          <path d={FANG} fill="url(#muBone)" stroke="#3a2814" strokeWidth="0.9" />
        </g>
        <g transform={`rotate(${a} 100 100) translate(200 0) scale(-1 1)`}>
          <path d={FANG} fill="url(#muBone)" stroke="#3a2814" strokeWidth="0.9" />
        </g>
        {a % 90 ? <Clasp angle={a} /> : <Stud angle={a} />}
      </g>
    ))}
    <g transform="translate(100 14) scale(1.15)">
      <Skull />
    </g>
  </svg>
));

/** A round button's frame: bronze rim and dark well, a small skull on top and three studs. */
export const RoundFrame = observer(({ skull = true }: { skull?: boolean }) => (
  <svg className="mu-round-frame" viewBox="0 0 200 200" overflow="visible" aria-hidden="true">
    <circle cx="100" cy="100" r="72" fill="url(#muWell)" />
    {ring(78, 'rgba(36,22,11,0.95)', 9)}
    {ring(83, 'url(#muBronzeRim)', 4)}
    {ring(72.5, 'url(#muBronzeRim)', 3.2)}
    {[90, 180, 270].map(a => (
      <g key={a} transform={`rotate(${a} 100 100) translate(100 17) scale(0.8)`}>
        <path d="M0 -10 L7 0 L0 10 L-7 0 Z" fill="url(#muBronze)" stroke="#2a1708" strokeWidth="1" />
      </g>
    ))}
    {skull && (
      <g transform="translate(100 15) scale(1.05)">
        <Skull />
      </g>
    )}
  </svg>
));

export type ArtIconName = 'helper' | 'bones' | 'book' | 'chat';

/** The icons inside the round frames, on the same 200-unit box. */
export const ArtIcon = observer(({ name }: { name: ArtIconName }) => (
  <svg className="mu-art-icon" viewBox="0 0 200 200" aria-hidden="true">
    {name === 'helper' && (
      <g>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="92" y="50" width="16" height="18" rx="3" fill="url(#muBronze)" stroke="#2a1708" strokeWidth="1.2" transform={`rotate(${i * 45} 100 100)`} />
        ))}
        <circle cx="100" cy="100" r="38" fill="url(#muBronze)" stroke="#2a1708" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="27" fill="#1d1209" />
        <path d="M74 100 Q100 78 126 100 Q100 122 74 100 Z" fill="#f3e2b8" stroke="#3a2814" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="11" fill="url(#muGem)" />
        <ellipse cx="100" cy="100" rx="2.6" ry="9" fill="#120804" />
      </g>
    )}
    {name === 'bones' &&
      [70, 100, 130].map(y => (
        <g key={y} transform={`translate(0 ${y - 100})`}>
          <rect x="66" y="93" width="68" height="14" rx="5" fill="url(#muBone)" stroke="#3a2814" strokeWidth="1.3" />
          <circle cx="64" cy="94" r="7.5" fill="url(#muBone)" stroke="#3a2814" strokeWidth="1.3" />
          <circle cx="64" cy="106" r="7.5" fill="url(#muBone)" stroke="#3a2814" strokeWidth="1.3" />
          <circle cx="136" cy="94" r="7.5" fill="url(#muBone)" stroke="#3a2814" strokeWidth="1.3" />
          <circle cx="136" cy="106" r="7.5" fill="url(#muBone)" stroke="#3a2814" strokeWidth="1.3" />
        </g>
      ))}
    {name === 'book' && (
      <g>
        <circle cx="100" cy="98" r="48" fill="url(#muGlow)" />
        <path d="M100 74 Q78 64 52 70 L52 128 Q78 122 100 132 Z" fill="url(#muPage)" stroke="#5a3410" strokeWidth="1.6" />
        <path d="M100 74 Q122 64 148 70 L148 128 Q122 122 100 132 Z" fill="url(#muPage)" stroke="#5a3410" strokeWidth="1.6" />
        <path d="M60 84 Q78 80 92 86 M60 96 Q78 92 92 98 M108 86 Q122 80 140 84 M108 98 Q122 92 140 96" stroke="#8a5a28" strokeWidth="1.6" fill="none" />
        <path d="M100 84 Q92 98 100 108 Q108 98 100 84 Z" fill="#ffb347" />
        <path d="M95 130 L95 152 L100 146 L105 152 L105 130 Z" fill="#a8261a" stroke="#4a0e08" strokeWidth="1" />
      </g>
    )}
    {name === 'chat' && (
      <path d="M58 70 H142 V122 H94 L70 142 V122 H58 Z" fill="rgba(243,226,184,0.15)" stroke="#f0c87a" strokeWidth="7" strokeLinejoin="round" />
    )}
  </svg>
));

/** The carving on an orb's inner side (towards the boxes): two bronze talons hugging the orb and a skull where they meet. */
export const OrbCrest = observer(({ side }: { side: 'left' | 'right' }) => (
  <svg className={`mu-orb-crest ${side}`} viewBox="0 0 120 120" overflow="visible" aria-hidden="true">
    <g transform={side === 'right' ? 'translate(120 0) scale(-1 1)' : undefined}>
      <path d="M60 4 C96 6 116 34 112 66 C110 82 100 96 88 104 C98 88 102 70 98 54 C94 32 80 16 60 12 Z" fill="url(#muBronze)" stroke="#2a1708" strokeWidth="1.4" />
      <path d="M62 112 C86 112 104 100 112 84 C110 100 96 116 74 118 Z" fill="url(#muBronze)" stroke="#2a1708" strokeWidth="1.2" />
      <path d="M100 30 C112 26 122 30 126 38 C118 36 110 38 104 42 Z" fill="url(#muBone)" stroke="#3a2814" strokeWidth="0.9" />
      <path d="M108 70 C120 70 128 76 130 84 C122 80 114 80 108 82 Z" fill="url(#muBone)" stroke="#3a2814" strokeWidth="0.9" />
      <g transform="translate(100 96) scale(0.9)">
        <Skull />
      </g>
    </g>
  </svg>
));
