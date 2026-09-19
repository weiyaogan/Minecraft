import { useEffect, useState } from 'react';
import { useWorldStore } from '../store';

interface HeartProps {
  state: 'full' | 'half' | 'empty';
  shake?: boolean;
  isDamaged?: boolean;
}

/**
 * Modern Heart icon using the generated high-definition custom HUD sprite:
 * Exactly matching the glossy ruby red heart from the custom texture pack.
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
        className={`w-full h-full object-contain pointer-events-none select-none transition-all duration-75 ${
          isDamaged ? 'brightness-150 contrast-125' : ''
        }`}
        style={{
          filter: isDamaged
            ? 'drop-shadow(0 0 5px #ff3344) brightness(1.4)'
            : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.85))',
          imageRendering: 'auto',
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
 * Modern Drumstick icon using the generated high-definition custom HUD sprite:
 * Exactly matching the angled roasted glazed drumstick with ivory bone handle.
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
        className="w-full h-full object-contain pointer-events-none select-none"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.85))',
          imageRendering: 'auto',
        }}
        draggable={false}
      />
    </div>
  );
}

/**
 * Modern Experience & Status Tray matching the reference image:
 * - Direct horizontal bar underneath hearts & drumsticks
 * - Segmented glowing lime-green XP bar on the left
 * - Glowing centered Minecraft green level number '1'
 * - Dark segmented slate track on the right
 */
export function ModernExperienceBar() {
  const xpLevel = useWorldStore(state => state.xpLevel);
  const xpProgress = useWorldStore(state => state.xpProgress);

  // 18 segments total, matching the segmented rail in reference
  const totalSegments = 18;
  const filledSegments = Math.round(xpProgress * totalSegments);

  return (
    <div className="relative w-full select-none flex flex-col items-center">
      {/* Centered Experience Level Number */}
      <div
        className="absolute -top-[18px] z-30 pointer-events-none font-mono font-black text-[15px] select-none leading-none"
        style={{
          color: '#82ff1f',
          textShadow: `
            1px 1px 0 #000000,
            -1px -1px 0 #000000,
            1px -1px 0 #000000,
            -1px 1px 0 #000000,
            0 2px 0 #000000,
            0 -1px 0 #000000,
            2px 0 0 #000000,
            -2px 0 0 #000000,
            0 0 5px rgba(130, 255, 31, 0.7)
          `,
          letterSpacing: '-0.5px',
        }}
      >
        {xpLevel}
      </div>

      {/* Segmented XP Bar Tray matching reference texture */}
      <div
        className="w-full h-[7px] flex items-stretch overflow-hidden rounded-[1px]"
        style={{
          backgroundColor: '#12171e',
          border: '1.5px solid #090c10',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isFilled = i < filledSegments;
          return (
            <div
              key={i}
              className="flex-1 h-full relative"
              style={{
                backgroundColor: isFilled ? '#6ee708' : '#232b36',
                backgroundImage: isFilled
                  ? 'linear-gradient(to bottom, #b4fc48 0%, #76ee08 40%, #469a04 100%)'
                  : 'linear-gradient(to bottom, #2b3442 0%, #1a2029 100%)',
                borderRight: i < totalSegments - 1 ? '1px solid #0d1217' : 'none',
                boxShadow: isFilled
                  ? 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 0 3px rgba(118, 238, 8, 0.4)'
                  : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function StatusBars() {
  const health = useWorldStore(state => state.health);
  const hunger = useWorldStore(state => state.hunger);
  const lastDamageTime = useWorldStore(state => state.lastDamageTime);

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

  return (
    <div className="flex flex-col items-center pointer-events-none select-none w-[382px] gap-[2px]">
      {/* Upper row for Hearts (Left), Level Spacing (Center), and Drumsticks (Right) */}
      <div
        className="flex justify-between items-center w-full px-1 py-[2px] rounded-t-[2px]"
        style={{
          backgroundColor: 'rgba(21, 27, 36, 0.92)',
          borderTop: '1.5px solid #2f3b4c',
          borderLeft: '1.5px solid #2f3b4c',
          borderRight: '1.5px solid #2f3b4c',
          boxShadow: '0 -2px 6px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        }}
        aria-label={`Health: ${health}/20, Hunger: ${hunger}/20`}
      >
        {/* Health Bar (Left: 10 Hearts) */}
        <div
          className="flex items-center gap-[1px]"
          title={`Health: ${health} / 20`}
        >
          {hearts}
        </div>

        {/* Center Space for Level Number */}
        <div className="w-[20px]" />

        {/* Hunger Bar (Right: 10 Drumsticks) */}
        <div
          className="flex items-center gap-[1px]"
          title={`Hunger: ${hunger} / 20`}
        >
          {drumsticks}
        </div>
      </div>

      {/* Experience Bar directly underneath the row */}
      <ModernExperienceBar />
    </div>
  );
}
