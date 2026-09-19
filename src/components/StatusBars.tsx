import { useEffect, useState } from 'react';
import { useWorldStore } from '../store';

interface HeartProps {
  state: 'full' | 'half' | 'empty';
  shake?: boolean;
}

export function MinecraftHeart({ state, shake }: HeartProps) {
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
        viewBox="0 0 9 9"
        width="18"
        height="18"
        className="block"
        style={{
          imageRendering: 'pixelated',
          shapeRendering: 'crispEdges',
        }}
      >
        {/* --- Background Outer Border (9x9) --- */}
        {/* Top borders of lobes */}
        <rect x="1" y="0" width="2" height="1" fill="#000000" />
        <rect x="6" y="0" width="2" height="1" fill="#000000" />
        
        {/* Upper sides & center notch */}
        <rect x="0" y="1" width="1" height="1" fill="#000000" />
        <rect x="3" y="1" width="1" height="1" fill="#000000" />
        <rect x="5" y="1" width="1" height="1" fill="#000000" />
        <rect x="8" y="1" width="1" height="1" fill="#000000" />

        {/* Outer side borders */}
        <rect x="0" y="2" width="1" height="3" fill="#000000" />
        <rect x="8" y="2" width="1" height="3" fill="#000000" />

        {/* Bottom tapering borders */}
        <rect x="1" y="5" width="1" height="1" fill="#000000" />
        <rect x="7" y="5" width="1" height="1" fill="#000000" />
        <rect x="2" y="6" width="1" height="1" fill="#000000" />
        <rect x="6" y="6" width="1" height="1" fill="#000000" />
        <rect x="3" y="7" width="1" height="1" fill="#000000" />
        <rect x="5" y="7" width="1" height="1" fill="#000000" />
        <rect x="4" y="8" width="1" height="1" fill="#000000" />

        {/* --- Empty Container Interior (Dark Charcoal Red with Top Specular Inner Bevel) --- */}
        {/* Top inner bevel highlight */}
        <rect x="1" y="1" width="2" height="1" fill="#4a1a1a" />
        <rect x="6" y="1" width="2" height="1" fill="#4a1a1a" />
        
        {/* Dark empty interior */}
        <rect x="1" y="2" width="3" height="3" fill="#2b0a0a" />
        <rect x="4" y="2" width="1" height="5" fill="#2b0a0a" />
        <rect x="5" y="2" width="3" height="3" fill="#2b0a0a" />
        <rect x="2" y="5" width="5" height="1" fill="#200606" />
        <rect x="3" y="6" width="3" height="1" fill="#180404" />
        <rect x="4" y="7" width="1" height="1" fill="#100202" />

        {/* --- Red Heart Fill --- */}
        {(state === 'full' || state === 'half') && (
          <g>
            {/* Left lobe: specular white glint at (1,1) */}
            <rect x="1" y="1" width="1" height="1" fill="#ffffff" />
            <rect x="2" y="1" width="1" height="1" fill="#ff2424" />
            
            {/* Left lobe upper body */}
            <rect x="1" y="2" width="3" height="1" fill="#ff2424" />
            <rect x="1" y="3" width="3" height="1" fill="#ff2424" />
            <rect x="1" y="4" width="3" height="1" fill="#ff2424" />
            
            {/* Center left column */}
            <rect x="4" y="2" width="1" height="4" fill="#ff2424" />
            <rect x="4" y="6" width="1" height="1" fill="#990b0b" />
            <rect x="4" y="7" width="1" height="1" fill="#800606" />

            {/* Left bottom wedge */}
            <rect x="2" y="5" width="2" height="1" fill="#ff2424" />
            <rect x="3" y="6" width="1" height="1" fill="#ff2424" />

            {/* If FULL: right lobe and full right wedge */}
            {state === 'full' && (
              <>
                {/* Right lobe top */}
                <rect x="6" y="1" width="2" height="1" fill="#ff2424" />
                
                {/* Right lobe body */}
                <rect x="5" y="2" width="2" height="3" fill="#ff2424" />
                {/* Right edge shadow */}
                <rect x="7" y="2" width="1" height="3" fill="#990b0b" />
                
                {/* Right bottom wedge with shadow */}
                <rect x="5" y="5" width="1" height="1" fill="#ff2424" />
                <rect x="6" y="5" width="1" height="1" fill="#990b0b" />
                <rect x="5" y="6" width="1" height="1" fill="#990b0b" />
              </>
            )}
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

export function MinecraftDrumstick({ state, shake }: DrumstickProps) {
  return (
    <div
      className="relative inline-block select-none"
      style={{
        width: '18px',
        height: '18px',
        transform: shake ? 'translateY(-1px)' : 'none',
        transition: 'transform 0.08s ease',
      }}
    >
      <svg
        viewBox="0 0 9 9"
        width="18"
        height="18"
        className="block"
        style={{
          imageRendering: 'pixelated',
          shapeRendering: 'crispEdges',
        }}
      >
        {/* --- Background Outer Border (9x9) --- */}
        {/* Bone tip outline at top right */}
        <rect x="7" y="0" width="2" height="1" fill="#1b120c" />
        <rect x="6" y="1" width="1" height="1" fill="#1b120c" />
        <rect x="8" y="1" width="1" height="1" fill="#1b120c" />
        <rect x="5" y="2" width="1" height="1" fill="#1b120c" />
        <rect x="7" y="2" width="1" height="1" fill="#1b120c" />
        <rect x="4" y="3" width="1" height="1" fill="#1b120c" />

        {/* Meat bulb top outline */}
        <rect x="1" y="3" width="3" height="1" fill="#1b120c" />
        <rect x="0" y="4" width="1" height="3" fill="#1b120c" />
        
        {/* Meat bulb bottom and right outline */}
        <rect x="1" y="7" width="2" height="1" fill="#1b120c" />
        <rect x="3" y="8" width="3" height="1" fill="#1b120c" />
        <rect x="6" y="7" width="1" height="1" fill="#1b120c" />
        <rect x="7" y="5" width="1" height="2" fill="#1b120c" />
        <rect x="6" y="4" width="1" height="1" fill="#1b120c" />

        {/* --- Empty Container Interior (Dark Charcoal Brown) --- */}
        <rect x="1" y="4" width="5" height="1" fill="#321e13" />
        <rect x="1" y="5" width="6" height="2" fill="#25150d" />
        <rect x="3" y="7" width="3" height="1" fill="#1d0f09" />
        {/* Empty bone slot */}
        <rect x="7" y="1" width="1" height="1" fill="#4a372c" />
        <rect x="6" y="2" width="1" height="1" fill="#3d2a20" />
        <rect x="5" y="3" width="1" height="1" fill="#332219" />

        {/* --- Meat / Food Fill --- */}
        {/* Bone (Always shown on full and half drumstick per Minecraft Java) */}
        {(state === 'full' || state === 'half') && (
          <g>
            {/* Bone knuckle and shaft */}
            <rect x="7" y="1" width="1" height="1" fill="#ede6d6" />
            <rect x="6" y="2" width="1" height="1" fill="#ede6d6" />
            <rect x="5" y="3" width="1" height="1" fill="#ede6d6" />

            {/* Right portion of meat bulb (common to full & half) */}
            <rect x="4" y="4" width="2" height="1" fill="#ea9443" />
            <rect x="4" y="5" width="2" height="1" fill="#a8501b" />
            <rect x="6" y="5" width="1" height="1" fill="#873c0f" />
            <rect x="4" y="6" width="3" height="1" fill="#873c0f" />
            <rect x="4" y="7" width="2" height="1" fill="#5c2609" />

            {/* Left portion of meat bulb (only on full drumstick) */}
            {state === 'full' && (
              <>
                {/* Roasted highlight */}
                <rect x="2" y="4" width="2" height="1" fill="#ea9443" />
                <rect x="1" y="4" width="1" height="1" fill="#bd5c1f" />
                
                {/* Golden roast meat body */}
                <rect x="1" y="5" width="3" height="1" fill="#a8501b" />
                <rect x="1" y="6" width="3" height="1" fill="#a8501b" />
                
                {/* Bottom roast edge */}
                <rect x="2" y="7" width="2" height="1" fill="#5c2609" />
              </>
            )}
          </g>
        )}
      </svg>
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
      <MinecraftHeart
        key={`heart-${i}`}
        state={heartState}
        shake={shake}
      />
    );
  });

  // 10 Drumsticks (from index 0 to 9, left to right, decreasing from right to left)
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
      <MinecraftDrumstick
        key={`food-${i}`}
        state={foodState}
        shake={shake}
      />
    );
  });

  return (
    <div
      className="flex justify-between items-center w-[380px] pointer-events-none select-none px-1"
      style={{
        filter: 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.6))',
      }}
      aria-label={`Health: ${health}/20, Hunger: ${hunger}/20`}
    >
      {/* Health Bar (Left, 10 Hearts) */}
      <div
        className="flex items-center"
        style={{
          gap: '-2px',
        }}
        title={`Health: ${health} / 20`}
      >
        {hearts}
      </div>

      {/* Hunger Bar (Right, 10 Drumsticks, aligned to right edge) */}
      <div
        className="flex items-center"
        style={{
          gap: '-2px',
        }}
        title={`Hunger: ${hunger} / 20`}
      >
        {drumsticks}
      </div>
    </div>
  );
}
