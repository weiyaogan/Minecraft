import { useEffect, useState, useId } from 'react';
import { useWorldStore } from '../store';

interface HeartProps {
  state: 'full' | 'half' | 'empty';
  shake?: boolean;
}

/**
 * Modern Heart icon replicating the uploaded custom Minecraft HUD texture:
 * - Rich ruby red gradient fill
 * - Distinct top-left white specular glint
 * - Crisp dark outline
 * - Dark wine-charcoal empty container
 */
export function ModernHeart({ state, shake }: HeartProps) {
  const clipId = useId();

  return (
    <div
      className={`relative inline-block select-none ${shake ? 'animate-bounce' : ''}`}
      style={{
        width: '18px',
        height: '18px',
        transform: shake ? 'translateY(-1px)' : 'none',
        transition: 'transform 0.08s ease',
      }}
    >
      <svg
        viewBox="0 0 20 20"
        width="18"
        height="18"
        className="block overflow-visible"
        style={{
          filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.75))',
        }}
      >
        <defs>
          {/* Half heart clip */}
          <clipPath id={`half-heart-clip-${clipId}`}>
            <rect x="0" y="0" width="10" height="20" />
          </clipPath>

          {/* Radiant ruby red gradient */}
          <linearGradient id={`heart-fill-grad-${clipId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff3a4d" />
            <stop offset="35%" stopColor="#eb1a2c" />
            <stop offset="100%" stopColor="#940a15" />
          </linearGradient>

          {/* Empty container subtle bevel */}
          <linearGradient id={`heart-empty-grad-${clipId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#25161a" />
            <stop offset="100%" stopColor="#140b0e" />
          </linearGradient>
        </defs>

        {/* --- Empty Container Background --- */}
        <path
          d="M 10,4.6 C 8.2,1.2 3.4,1.2 1.5,5.2 C -0.6,9.4 1.4,13.4 5.6,16.6 L 10,19.4 L 14.4,16.6 C 18.6,13.4 20.6,9.4 18.5,5.2 C 16.6,1.2 11.8,1.2 10,4.6 Z"
          fill={`url(#heart-empty-grad-${clipId})`}
          stroke="#0d080a"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* --- Red Heart Fill (Full or Half) --- */}
        {(state === 'full' || state === 'half') && (
          <g clipPath={state === 'half' ? `url(#half-heart-clip-${clipId})` : undefined}>
            {/* Heart body */}
            <path
              d="M 10,4.6 C 8.2,1.2 3.4,1.2 1.5,5.2 C -0.6,9.4 1.4,13.4 5.6,16.6 L 10,19.4 L 14.4,16.6 C 18.6,13.4 20.6,9.4 18.5,5.2 C 16.6,1.2 11.8,1.2 10,4.6 Z"
              fill={`url(#heart-fill-grad-${clipId})`}
              stroke="#0d080a"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />

            {/* Specular White Glint on top-left lobe (hallmark of the reference image) */}
            <ellipse
              cx="5.5"
              cy="5.4"
              rx="2.5"
              ry="1.4"
              transform="rotate(-35 5.5 5.4)"
              fill="#ffffff"
              opacity="0.95"
            />

            {/* Secondary soft highlight on right lobe */}
            {state === 'full' && (
              <ellipse
                cx="14.5"
                cy="5.4"
                rx="1.6"
                ry="1.0"
                transform="rotate(35 14.5 5.4)"
                fill="#ff99a4"
                opacity="0.65"
              />
            )}

            {/* Shaded bottom-right rim for 3D depth */}
            <path
              d="M 10,19.4 L 14.4,16.6 C 18.6,13.4 20.6,9.4 18.5,5.2 C 17.6,3.4 15.6,2.6 14,3.2 C 16.4,5.6 17,9.6 13.8,13.6 L 10,17.2 Z"
              fill="#75050e"
              opacity="0.7"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

interface DrumstickProps {
  state: 'full' | 'half' | 'empty';
  shake?: boolean;
}

/**
 * Modern Drumstick icon replicating the uploaded custom Minecraft HUD texture:
 * - Angled diagonally pointing up-right
 * - White/ivory bone at bottom-left
 * - Roasted savory caramel-crimson glazed meat bulb with upper specular highlight
 * - Dark charcoal-brown empty container
 */
export function ModernDrumstick({ state, shake }: DrumstickProps) {
  const clipId = useId();

  return (
    <div
      className={`relative inline-block select-none ${shake ? 'animate-bounce' : ''}`}
      style={{
        width: '18px',
        height: '18px',
        transform: shake ? 'translateY(-1px)' : 'none',
        transition: 'transform 0.08s ease',
      }}
    >
      <svg
        viewBox="0 0 20 20"
        width="18"
        height="18"
        className="block overflow-visible"
        style={{
          filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.75))',
        }}
      >
        <defs>
          {/* Half hunger clip */}
          <clipPath id={`half-food-clip-${clipId}`}>
            <rect x="0" y="8" width="20" height="12" />
          </clipPath>

          {/* Roasted meat gradient */}
          <linearGradient id={`roast-meat-grad-${clipId}`} x1="75%" y1="15%" x2="25%" y2="85%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="35%" stopColor="#ea580c" />
            <stop offset="70%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>

          {/* Empty container gradient */}
          <linearGradient id={`food-empty-grad-${clipId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2a1e17" />
            <stop offset="100%" stopColor="#150e0a" />
          </linearGradient>
        </defs>

        {/* --- Empty Container Background --- */}
        <g>
          {/* Bone outline */}
          <circle cx="3.8" cy="16.2" r="2.0" fill="#201813" stroke="#0e0a07" strokeWidth="1.4" />
          <circle cx="6.6" cy="17.6" r="2.0" fill="#201813" stroke="#0e0a07" strokeWidth="1.4" />
          <path d="M 4.6,15.2 L 8.2,11.6" stroke="#201813" strokeWidth="3" strokeLinecap="round" />
          
          {/* Meat bulb container */}
          <path
            d="M 7.2,13.8 C 5.0,10.5 6.4,6.6 10.0,4.2 C 14.0,1.6 18.5,3.2 19.4,7.2 C 20.2,11.2 17.4,15.6 13.4,16.4 C 10.2,17.0 8.4,15.4 7.2,13.8 Z"
            fill={`url(#food-empty-grad-${clipId})`}
            stroke="#0e0a07"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>

        {/* --- Filled Meat / Food --- */}
        {(state === 'full' || state === 'half') && (
          <g clipPath={state === 'half' ? `url(#half-food-clip-${clipId})` : undefined}>
            {/* Bone knobs at bottom-left */}
            <circle cx="3.8" cy="16.2" r="2.0" fill="#ede7db" stroke="#120e0a" strokeWidth="1.3" />
            <circle cx="6.6" cy="17.6" r="2.0" fill="#ede7db" stroke="#120e0a" strokeWidth="1.3" />
            <path d="M 4.6,15.2 L 8.4,11.4" stroke="#ede7db" strokeWidth="3" strokeLinecap="round" />

            {/* Meat bulb */}
            <path
              d="M 7.2,13.8 C 5.0,10.5 6.4,6.6 10.0,4.2 C 14.0,1.6 18.5,3.2 19.4,7.2 C 20.2,11.2 17.4,15.6 13.4,16.4 C 10.2,17.0 8.4,15.4 7.2,13.8 Z"
              fill={`url(#roast-meat-grad-${clipId})`}
              stroke="#120e0a"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Glossy Glaze Highlight Arc (hallmark of reference image) */}
            <path
              d="M 10.5,5.2 C 13.2,3.6 16.8,4.4 17.6,7.5"
              stroke="#ffedd5"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
              opacity="0.95"
            />
            <ellipse
              cx="13.2"
              cy="6.0"
              rx="2.0"
              ry="1.1"
              transform="rotate(-30 13.2 6.0)"
              fill="#ffffff"
              opacity="0.85"
            />

            {/* Roasted Underbody Shading */}
            <path
              d="M 7.8,14.2 C 9.5,15.8 12.5,16.2 14.4,15.2 C 13.0,13.4 11.2,12.2 8.8,12.0 Z"
              fill="#4a1505"
              opacity="0.8"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

/**
 * Modern Experience Bar matching the screenshot:
 * - Spans across the full width right above the hotbar
 * - Segmented green glowing blocks on left (up to xpProgress)
 * - Dark slate unfilled segments on right
 * - Center glowing Minecraft green level number
 */
export function ModernExperienceBar() {
  const xpLevel = useWorldStore(state => state.xpLevel);
  const xpProgress = useWorldStore(state => state.xpProgress);

  // 18 segments total, standard Minecraft XP bar segmentation
  const totalSegments = 18;
  const filledSegments = Math.round(xpProgress * totalSegments);

  return (
    <div className="relative w-[380px] select-none flex flex-col items-center">
      {/* Centered Level Number - sits in gap between hearts & hunger */}
      <div
        className="absolute -top-[19px] z-20 pointer-events-none font-mono font-black text-sm select-none"
        style={{
          color: '#80ff20',
          textShadow: `
            1px 1px 0 #000000,
            -1px -1px 0 #000000,
            1px -1px 0 #000000,
            -1px 1px 0 #000000,
            0 2px 0 #000000,
            0 -1px 0 #000000,
            2px 0 0 #000000,
            -2px 0 0 #000000
          `,
          letterSpacing: '-0.5px',
        }}
      >
        {xpLevel}
      </div>

      {/* The Sleek Segmented XP Bar Tray */}
      <div
        className="w-full h-[6px] flex items-stretch overflow-hidden rounded-[1px]"
        style={{
          backgroundColor: '#161c24',
          border: '1.5px solid #0f141a',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isFilled = i < filledSegments;
          return (
            <div
              key={i}
              className="flex-1 h-full relative"
              style={{
                backgroundColor: isFilled ? '#67d30c' : '#222933',
                backgroundImage: isFilled
                  ? 'linear-gradient(to bottom, #a3f738 0%, #70e008 40%, #52a806 100%)'
                  : 'linear-gradient(to bottom, #2b3340 0%, #1e242d 100%)',
                borderRight: i < totalSegments - 1 ? '1px solid #0f141a' : 'none',
                boxShadow: isFilled ? 'inset 0 1px 0 rgba(255, 255, 255, 0.4)' : 'none',
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

  // Subtle Minecraft Java jitter animations
  const [shakeTicks, setShakeTicks] = useState(0);

  useEffect(() => {
    // When low health (<= 4) or low hunger (<= 6), trigger periodic visual jitter
    if (health <= 4 || hunger <= 6) {
      const interval = setInterval(() => {
        setShakeTicks(prev => (prev + 1) % 4);
      }, 120);
      return () => clearInterval(interval);
    }
  }, [health, hunger]);

  const isLowHealth = health <= 4;
  const isLowHunger = hunger <= 6;
  const isRecentlyDamaged = Date.now() - lastDamageTime < 250;

  // 10 Hearts (from index 0 to 9, left to right)
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
      />
    );
  });

  // 10 Drumsticks (from index 0 to 9, left to right)
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
    <div className="flex flex-col items-center pointer-events-none select-none w-[380px] gap-1">
      {/* Shelf / Rail for Hearts (Left), Level Gap (Center), and Hunger (Right) */}
      <div
        className="flex justify-between items-center w-full px-1 py-0.5 rounded-[3px]"
        style={{
          backgroundColor: 'rgba(21, 26, 33, 0.82)',
          border: '1.5px solid #2a3442',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        }}
        aria-label={`Health: ${health}/20, Hunger: ${hunger}/20`}
      >
        {/* Health Bar (Left, 10 Hearts) */}
        <div
          className="flex items-center gap-[1px]"
          title={`Health: ${health} / 20`}
        >
          {hearts}
        </div>

        {/* Center spacing reserve for Level Number */}
        <div className="w-[20px]" />

        {/* Hunger Bar (Right, 10 Drumsticks, aligned to right edge) */}
        <div
          className="flex items-center gap-[1px]"
          title={`Hunger: ${hunger} / 20`}
        >
          {drumsticks}
        </div>
      </div>

      {/* Experience Bar (Spanning across full 380px directly on top of hotbar) */}
      <ModernExperienceBar />
    </div>
  );
}
