import { useEffect, useState } from 'react';
import { useWorldStore } from '../store';
import {
  HUD_HEART_TEXTURE,
  HUD_HEART_HALF_TEXTURE,
  HUD_HEART_EMPTY_TEXTURE,
  HUD_HEARTS_FULL_TEXTURE,
  HUD_DRUMSTICK_TEXTURE,
  HUD_DRUMSTICK_HALF_TEXTURE,
  HUD_DRUMSTICK_EMPTY_TEXTURE,
  HUD_DRUMSTICKS_FULL_TEXTURE,
  HUD_XP_BAR_TEXTURE,
  HUD_XP_FILL_TEXTURE,
} from '../assets/hudTextures';

interface HeartProps {
  state: 'full' | 'half' | 'empty';
  shake?: boolean;
  isDamaged?: boolean;
}

/**
 * Pixel-perfect Heart matching the uploaded reference image:
 * Crisp 1px black outline, completely vibrant red fill with upper-left white shine.
 */
export function ModernHeart({ state, shake, isDamaged }: HeartProps) {
  let spriteSrc = HUD_HEART_TEXTURE;
  if (state === 'half') spriteSrc = HUD_HEART_HALF_TEXTURE;
  if (state === 'empty') spriteSrc = HUD_HEART_EMPTY_TEXTURE;

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
        className={`w-[18px] h-[18px] pointer-events-none select-none ${
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
 * Crisp 1px black outline, angled roasted meat with red glaze tip, white shine, and ivory bone handle.
 */
export function ModernDrumstick({ state, shake }: DrumstickProps) {
  let spriteSrc = HUD_DRUMSTICK_TEXTURE;
  if (state === 'half') spriteSrc = HUD_DRUMSTICK_HALF_TEXTURE;
  if (state === 'empty') spriteSrc = HUD_DRUMSTICK_EMPTY_TEXTURE;

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
        className="w-[18px] h-[18px] pointer-events-none select-none"
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
      <div
        key={`heart-wrap-${i}`}
        className="absolute top-0 select-none pointer-events-none"
        style={{
          left: `${i * 16}px`,
          width: '18px',
          height: '18px',
        }}
      >
        <ModernHeart
          state={heartState}
          shake={shake}
          isDamaged={isRecentlyDamaged}
        />
      </div>
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
      <div
        key={`food-wrap-${i}`}
        className="absolute top-0 select-none pointer-events-none"
        style={{
          left: `${i * 16}px`,
          width: '18px',
          height: '18px',
        }}
      >
        <ModernDrumstick
          state={foodState}
          shake={shake}
        />
      </div>
    );
  });

  const isFullHealth = health >= 20 && !isRecentlyDamaged;
  const isFullHunger = hunger >= 20 && !isLowHunger;

  return (
    <div 
      className="relative select-none pointer-events-none flex flex-col items-center"
      style={{ width: '364px' }}
    >
      {/* 1. Top Row: Hearts on the left, Drumsticks on the right */}
      <div className="w-full flex justify-between items-end mb-[4px]" style={{ height: '18px' }}>
        {/* Left: 10 Hearts - exactly matches image.png */}
        <div className="relative select-none" style={{ width: '162px', height: '18px' }}>
          {isFullHealth ? (
            <img
              src={HUD_HEARTS_FULL_TEXTURE}
              alt="Health Bar"
              referrerPolicy="no-referrer"
              className="w-[162px] h-[18px] pointer-events-none select-none"
              style={{ imageRendering: 'pixelated' }}
              draggable={false}
            />
          ) : (
            hearts
          )}
        </div>

        {/* Right: 10 Drumsticks - exactly matches image.png */}
        <div className="relative select-none" style={{ width: '162px', height: '18px' }}>
          {isFullHunger ? (
            <img
              src={HUD_DRUMSTICKS_FULL_TEXTURE}
              alt="Hunger Bar"
              referrerPolicy="no-referrer"
              className="w-[162px] h-[18px] pointer-events-none select-none"
              style={{ imageRendering: 'pixelated' }}
              draggable={false}
            />
          ) : (
            drumsticks
          )}
        </div>
      </div>

      {/* 2. XP Bar: Exact pixel-art texture matching image.png (364px x 10px, 18 segments) */}
      <div
        className="relative overflow-hidden mb-[4px] select-none"
        style={{
          width: '364px',
          height: '10px',
          backgroundImage: `url(${HUD_XP_BAR_TEXTURE})`,
          backgroundSize: '100% 100%',
          imageRendering: 'pixelated',
          boxSizing: 'border-box',
        }}
      >
        {/* Active filled XP overlay if player has XP */}
        {xpProgress > 0 && (
          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{
              width: `${Math.min(100, Math.max(0, xpProgress * 100))}%`,
              backgroundImage: `url(${HUD_XP_FILL_TEXTURE})`,
              backgroundSize: '364px 10px',
              imageRendering: 'pixelated',
            }}
          />
        )}
      </div>
    </div>
  );
}
