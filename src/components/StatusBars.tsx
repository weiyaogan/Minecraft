import { useEffect, useState } from 'react';
import { useWorldStore } from '../store';

interface HeartProps {
  state: 'full' | 'half' | 'empty';
  shake?: boolean;
  isDamaged?: boolean;
}

/**
 * Pixel-perfect Heart matching the uploaded reference image:
 * Pure red pixel heart with white shine, no black outline.
 */
export function ModernHeart({ state, shake, isDamaged }: HeartProps) {
  let spriteSrc = '/hud_heart.png';
  if (state === 'half') spriteSrc = '/hud_heart_half.png';
  if (state === 'empty') spriteSrc = '/hud_heart_empty.png';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${shake ? 'animate-bounce' : ''}`}
      style={{
        width: '18px',
        height: '16px',
        transform: shake ? 'translateY(-1px)' : 'none',
        transition: 'transform 0.08s ease',
      }}
    >
      <img
        src={spriteSrc}
        alt={`Heart ${state}`}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-contain pointer-events-none select-none ${
          isDamaged ? 'brightness-150' : ''
        }`}
        style={{
          imageRendering: 'pixelated',
        }}
        draggable={false}
      />
    </div>
  );
}

interface DrumstickProps {
  state: 'full' | 'half' | 'empty';
  shake?: boolean;
}

/**
 * Pixel-perfect Drumstick matching the uploaded reference image:
 * Angled roasted drumstick with red glaze tip and ivory bone handle.
 */
export function ModernDrumstick({ state, shake }: DrumstickProps) {
  let spriteSrc = '/hud_drumstick.png';
  if (state === 'half') spriteSrc = '/hud_drumstick_half.png';
  if (state === 'empty') spriteSrc = '/hud_drumstick_empty.png';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${shake ? 'animate-bounce' : ''}`}
      style={{
        width: '18px',
        height: '16px',
        transform: shake ? 'translateY(-1px)' : 'none',
        transition: 'transform 0.08s ease',
      }}
    >
      <img
        src={spriteSrc}
        alt={`Food ${state}`}
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain pointer-events-none select-none"
        style={{
          imageRendering: 'pixelated',
        }}
        draggable={false}
      />
    </div>
  );
}

/**
 * StatusBars matching EXACTLY the uploaded reference image:
 * - Top row: 10 red pixel hearts on the left, 10 drumsticks on the right (with wide space between them, no level number)
 * - Middle row: continuous dark teal/cyan bordered XP bar with 18 segmented notches spanning the full width
 */
export function StatusBars() {
  const health = useWorldStore(state => state.health);
  const hunger = useWorldStore(state => state.hunger);
  const lastDamageTime = useWorldStore(state => state.lastDamageTime);
  const xpProgress = useWorldStore(state => state.xpProgress);

  // Subtle low-health / low-hunger jitter
  const [shakeTicks, setShakeTicks] = useState(0);

  useEffect(() => {
    if (health <= 4 || hunger <= 6) {
      const interval = setInterval(() => {
        setShakeTicks(prev => (prev + 1) % 4);
      }, 120);
      return () => clearInterval(interval);
    }
  }, [health, hunger]);

  const isLowHealth = health <= 4;
  const isLowHunger = hunger <= 6;
  const isRecentlyDamaged = Date.now() - lastDamageTime < 300;

  // 10 Hearts (left to right)
  const hearts = Array.from({ length: 10 }, (_, i) => {
    const threshold = (i + 1) * 2;
    let heartState: 'full' | 'half' | 'empty' = 'empty';
    if (health >= threshold) {
      heartState = 'full';
    } else if (health === threshold - 1) {
      heartState = 'half';
    }

    const shake = isRecentlyDamaged || (isLowHealth && (shakeTicks + i) % 2 === 0);

    return (
      <ModernHeart
        key={`heart-${i}`}
        state={heartState}
        shake={shake}
        isDamaged={isRecentlyDamaged}
      />
    );
  });

  // 10 Drumsticks (left to right)
  const drumsticks = Array.from({ length: 10 }, (_, i) => {
    const threshold = (i + 1) * 2;
    let foodState: 'full' | 'half' | 'empty' = 'empty';
    if (hunger >= threshold) {
      foodState = 'full';
    } else if (hunger === threshold - 1) {
      foodState = 'half';
    }

    const shake = isLowHunger && (shakeTicks + i) % 3 === 0;

    return (
      <ModernDrumstick
        key={`food-${i}`}
        state={foodState}
        shake={shake}
      />
    );
  });

  // Exactly 18 segmented notches spanning the XP bar matching the image
  const totalSegments = 18;
  const filledSegments = Math.round(xpProgress * totalSegments);

  return (
    <div className="relative select-none pointer-events-none w-[470px] flex flex-col items-center">
      {/* 1. Top Row: Hearts on the left, Drumsticks on the right */}
      <div className="w-full flex justify-between items-end px-[2px] mb-[6px]">
        {/* Left: 10 Hearts touching each other */}
        <div className="flex items-center gap-[1px]">
          {hearts}
        </div>

        {/* Right: 10 Drumsticks touching each other */}
        <div className="flex items-center gap-[1px]">
          {drumsticks}
        </div>
      </div>

      {/* 2. XP Bar: Continuous dark-green/teal segmented bar with 18 segments */}
      <div
        className="w-full h-[10px] flex items-stretch overflow-hidden mb-[8px]"
        style={{
          backgroundColor: '#0a1514',
          border: '1.5px solid #081211',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isFilled = i < filledSegments;
          return (
            <div
              key={`xp-seg-${i}`}
              className="flex-1 h-full relative"
              style={{
                backgroundColor: isFilled ? '#78ea12' : '#142522',
                backgroundImage: isFilled
                  ? 'linear-gradient(to bottom, #b4f738 0%, #6ecb10 100%)'
                  : 'linear-gradient(to bottom, #19312d 0%, #0e1e1b 100%)',
                borderRight: i < totalSegments - 1 ? '1.5px solid #081211' : 'none',
                boxShadow: isFilled
                  ? 'inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 0 3px #78ea12'
                  : 'inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 rgba(0, 0, 0, 0.4)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
