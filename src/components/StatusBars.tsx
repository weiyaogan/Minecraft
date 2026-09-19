import { useEffect, useState } from 'react';
import { useWorldStore } from '../store';

interface HeartProps {
  state: 'full' | 'half' | 'empty';
  shake?: boolean;
  isDamaged?: boolean;
}

/**
 * Pixel-perfect Heart matching the uploaded reference image:
 * Crisp 1px black outline, saturated red fill with upper-left white shine.
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
        height: '18px',
        transform: shake ? 'translateY(-1px)' : 'none',
        transition: 'transform 0.08s ease',
      }}
    >
      <img
        src={spriteSrc}
        alt={`Heart ${state}`}
        referrerPolicy="no-referrer"
        className={`w-[18px] h-[18px] object-contain pointer-events-none select-none ${
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
 * Crisp 1px black outline, angled roasted meat with red glaze tip and ivory bone handle.
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
        height: '18px',
        transform: shake ? 'translateY(-1px)' : 'none',
        transition: 'transform 0.08s ease',
      }}
    >
      <img
        src={spriteSrc}
        alt={`Food ${state}`}
        referrerPolicy="no-referrer"
        className="w-[18px] h-[18px] object-contain pointer-events-none select-none"
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
 * - 10 crisp pixel-art hearts on the left (spanning exactly across slots 1-4)
 * - 10 crisp pixel-art drumsticks on the right (spanning exactly across slots 6-9)
 * - An empty space above slot 5
 * - Continuous 18-segment dark-teal XP bar with 2px solid black border and 2px segment dividers
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
    <div className="relative select-none pointer-events-none w-full flex flex-col items-center">
      {/* 1. Top Row: Hearts on the left, Drumsticks on the right */}
      <div className="w-full flex justify-between items-end mb-[4px]">
        {/* Left: 10 Hearts touching each other with 1px space */}
        <div className="flex items-center gap-[1px]">
          {hearts}
        </div>

        {/* Right: 10 Drumsticks touching each other with 1px space */}
        <div className="flex items-center gap-[1px]">
          {drumsticks}
        </div>
      </div>

      {/* 2. XP Bar: Continuous dark-green/teal segmented bar with 18 segments */}
      <div
        className="w-full h-[11px] flex items-stretch overflow-hidden mb-[5px]"
        style={{
          backgroundColor: '#0a1514',
          border: '2px solid #000000',
          boxSizing: 'border-box',
        }}
      >
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isFilled = i < filledSegments;
          return (
            <div
              key={`xp-seg-${i}`}
              className="flex-1 h-full relative"
              style={{
                backgroundColor: isFilled ? '#78ea12' : '#12201d',
                backgroundImage: isFilled
                  ? 'linear-gradient(to bottom, #bdff38 0%, #76db14 45%, #52a808 100%)'
                  : 'linear-gradient(to bottom, #1d332e 0%, #12201d 45%, #0a1311 100%)',
                borderRight: i < totalSegments - 1 ? '2px solid #000000' : 'none',
                boxShadow: isFilled
                  ? 'inset 0 1px 0 #e8ff9e, inset 0 -1px 0 #3b8005'
                  : 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.6)',
              }}
            >
              {/* Subtle center notch matching image */}
              {!isFilled && (
                <div
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] opacity-30"
                  style={{ backgroundColor: '#25443d' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
