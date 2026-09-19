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
            : 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.95))',
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
          filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.95))',
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
 * - 10 Hearts rest directly on the left side of the XP bar
 * - 10 Drumsticks rest directly on the right side of the XP bar
 * - The XP bar is a single continuous segmented tray running flush on top of the hotbar
 * - The bright lime green level number '1' is centered right above the XP bar
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

  // 18 segments total, exactly 9 left and 9 right
  const totalLeftSegments = 9;
  // If xpProgress is 0, still show at least the filled bar when player is level 1 like the reference image
  const filledLeftSegments = Math.max(1, Math.round(xpProgress * totalLeftSegments));
  const totalRightSegments = 9;

  return (
    <div className="relative select-none pointer-events-none w-[396px] flex flex-col items-center">
      {/* 1. Icons Row: Hearts on Left, Level '1' in Center, Hunger on Right */}
      <div className="w-full flex justify-between items-end px-[2px] mb-[1px] relative">
        {/* Left: 10 Hearts touching each other */}
        <div className="flex items-center gap-[0px]">
          {hearts}
        </div>

        {/* Center: Minecraft Glowing Green Level Number exactly as in the reference image */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-[12px] font-mono font-black text-[16px] select-none leading-none z-30 pointer-events-none"
          style={{
            color: '#83ff20',
            textShadow: `
              2px 0 0 #000000,
              -2px 0 0 #000000,
              0 2px 0 #000000,
              0 -2px 0 #000000,
              1.5px 1.5px 0 #000000,
              -1.5px -1.5px 0 #000000,
              1.5px -1.5px 0 #000000,
              -1.5px 1.5px 0 #000000,
              0 0 6px rgba(131, 255, 32, 0.95)
            `,
            letterSpacing: '-0.5px',
          }}
        >
          {xpLevel}
        </div>

        {/* Right: 10 Drumsticks touching each other */}
        <div className="flex items-center gap-[0px]">
          {drumsticks}
        </div>
      </div>

      {/* 2. Sleek Segmented XP Tray Bar spanning across underneath, flush with the Hotbar */}
      <div
        className="w-full h-[9px] flex items-stretch overflow-hidden rounded-t-[1px]"
        style={{
          backgroundColor: '#161c22',
          border: '2px solid #14181e',
          borderBottom: 'none',
          boxShadow: '0 -2px 6px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
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
                    ? 'linear-gradient(to bottom, #d6ff58 0%, #7fe812 45%, #469a04 100%)'
                    : 'linear-gradient(to bottom, #2b3644 0%, #1c232d 100%)',
                  borderRight: '1px solid #10151c',
                  boxShadow: isFilled
                    ? 'inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 0 4px rgba(127, 232, 18, 0.6)'
                    : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Center Divider / Gap under the Level Number */}
        <div className="w-[10px] h-full bg-[#131921] border-l border-r border-[#0d1218]" />

        {/* Right Side: Dark Slate Beveled Segments under Hunger Drumsticks */}
        <div className="flex-1 flex items-stretch">
          {Array.from({ length: totalRightSegments }).map((_, i) => {
            return (
              <div
                key={`right-seg-${i}`}
                className="flex-1 h-full relative"
                style={{
                  backgroundColor: '#262f3c',
                  backgroundImage: 'linear-gradient(to bottom, #2d3644 0%, #1c232c 100%)',
                  borderRight: i < totalRightSegments - 1 ? '1px solid #10151c' : 'none',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
