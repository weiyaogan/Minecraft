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
            : 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.9))',
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
          filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.9))',
          imageRendering: 'auto',
        }}
        draggable={false}
      />
    </div>
  );
}

/**
 * Modern Experience & Status Tray matching the reference image:
 * In the image:
 * - Hearts sit directly above the XP bar on the left
 * - Hunger drumsticks sit directly above the XP bar on the right
 * - The XP bar is a single continuous green segmented bar running under the hearts,
 *   with the green level number '1' positioned right in the center gap!
 * - Under hunger, the tray has the matching dark segmented background!
 */
export function StatusBars() {
  const health = useWorldStore(state => state.health);
  const hunger = useWorldStore(state => state.hunger);
  const lastDamageTime = useWorldStore(state => state.lastDamageTime);
  const xpLevel = useWorldStore(state => state.xpLevel);
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

  // Exactly matching the screenshot:
  // Under the hearts: glowing green segmented XP bar (filled up to progress, or glowing green as in image)
  // Under the drumsticks: dark segmented track with subtle metallic notches
  const totalLeftSegments = 9;
  const filledLeftSegments = Math.max(1, Math.round(xpProgress * totalLeftSegments));
  const totalRightSegments = 9;

  return (
    <div className="relative select-none pointer-events-none w-[384px] flex flex-col items-center">
      {/* 1. Icons Row: Hearts on Left, Level '1' in Center, Hunger on Right */}
      <div className="w-full flex justify-between items-end px-[2px] mb-[2px] relative">
        {/* Left: 10 Hearts */}
        <div className="flex items-center gap-[0.5px]">
          {hearts}
        </div>

        {/* Center: Minecraft Glowing Green Level Number exactly as pictured */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-[1px] font-mono font-black text-[16px] select-none leading-none z-20"
          style={{
            color: '#86ff22',
            textShadow: `
              1px 1px 0 #000000,
              -1px -1px 0 #000000,
              1px -1px 0 #000000,
              -1px 1px 0 #000000,
              0 2px 0 #000000,
              0 -1px 0 #000000,
              2px 0 0 #000000,
              -2px 0 0 #000000,
              0 0 6px rgba(134, 255, 34, 0.8)
            `,
            letterSpacing: '-0.5px',
          }}
        >
          {xpLevel}
        </div>

        {/* Right: 10 Drumsticks */}
        <div className="flex items-center gap-[0.5px]">
          {drumsticks}
        </div>
      </div>

      {/* 2. Sleek Segmented XP Tray Bar spanning across underneath, matching the screenshot */}
      <div
        className="w-full h-[8px] flex items-stretch overflow-hidden rounded-[1px]"
        style={{
          backgroundColor: '#1b222c',
          border: '1.5px solid #10151c',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Left Side: Glowing Green XP Segments under Hearts */}
        <div className="flex-1 flex items-stretch">
          {Array.from({ length: totalLeftSegments }).map((_, i) => {
            const isFilled = i < filledLeftSegments;
            return (
              <div
                key={`left-seg-${i}`}
                className="flex-1 h-full relative"
                style={{
                  backgroundColor: isFilled ? '#78ea12' : '#2a3543',
                  backgroundImage: isFilled
                    ? 'linear-gradient(to bottom, #bfff50 0%, #7ee810 45%, #4ea506 100%)'
                    : 'linear-gradient(to bottom, #2b3644 0%, #1c232d 100%)',
                  borderRight: '1px solid #10151c',
                  boxShadow: isFilled
                    ? 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 0 3px rgba(126, 232, 16, 0.5)'
                    : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Center Divider / Gap under the Level Number */}
        <div className="w-[12px] h-full bg-[#141b24] border-l border-r border-[#0e1319]" />

        {/* Right Side: Dark Slate Beveled Segments under Hunger Drumsticks */}
        <div className="flex-1 flex items-stretch">
          {Array.from({ length: totalRightSegments }).map((_, i) => {
            return (
              <div
                key={`right-seg-${i}`}
                className="flex-1 h-full relative"
                style={{
                  backgroundColor: '#262f3c',
                  backgroundImage: 'linear-gradient(to bottom, #323d4c 0%, #1e2530 100%)',
                  borderRight: i < totalRightSegments - 1 ? '1px solid #10151c' : 'none',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
