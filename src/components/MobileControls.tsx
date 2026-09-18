import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWorldStore } from '../store';
import { 
  Pause, 
  Backpack, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Pickaxe, 
  Box, 
  Shield, 
  ArrowDownToLine, 
  Zap,
  UserCheck,
  ArrowUp
} from 'lucide-react';

interface MobileControlsProps {
  onLookRotate?: (deltaX: number, deltaY: number) => void;
}

export function MobileControls({ onLookRotate }: MobileControlsProps) {
  const isMobile = useWorldStore(state => state.isMobile);
  const isPaused = useWorldStore(state => state.isPaused);
  const isInventoryOpen = useWorldStore(state => state.isInventoryOpen);
  const setPaused = useWorldStore(state => state.setPaused);
  const setInventoryOpen = useWorldStore(state => state.setInventoryOpen);
  const swapOffhand = useWorldStore(state => state.swapOffhand);
  const throwCurrentItem = useWorldStore(state => state.throwCurrentItem);
  const playerFeetPosition = useWorldStore(state => state.playerFeetPosition);
  
  const virtualInputs = useWorldStore(state => state.virtualInputs);
  const setVirtualInput = useWorldStore(state => state.setVirtualInput);
  const toggleVirtualInput = useWorldStore(state => state.toggleVirtualInput);

  const [isSprintActive, setIsSprintActive] = useState(false);
  const lastUpTapTime = useRef(0);

  // Multi-touch tracking for camera look
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number } | null>(null);

  // Sync sprint state
  useEffect(() => {
    setIsSprintActive(virtualInputs.sprint);
  }, [virtualInputs.sprint]);

  // Handle D-Pad button touches
  const handleButtonTouch = (
    key: 'forward' | 'backward' | 'left' | 'right' | 'jump' | 'mine' | 'place',
    isPressed: boolean,
    e: React.TouchEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (key === 'forward' && isPressed) {
      const now = performance.now();
      if (now - lastUpTapTime.current < 320) {
        // Double-tap forward toggles sprinting
        setVirtualInput('sprint', true);
        setIsSprintActive(true);
      }
      lastUpTapTime.current = now;
    } else if (key === 'forward' && !isPressed) {
      // Releasing forward stops sprinting
      setVirtualInput('sprint', false);
      setIsSprintActive(false);
    }

    setVirtualInput(key, isPressed);
  };

  const handleSneakToggle = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleVirtualInput('sneak');
  };

  const handleSprintToggle = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const nextSprint = !isSprintActive;
    setIsSprintActive(nextSprint);
    setVirtualInput('sprint', nextSprint);
  };

  const handleDropItem = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Dispatch drop event or trigger store action
    window.dispatchEvent(new CustomEvent('mobile-drop-item', { detail: { dropAll: false } }));
  };

  const handleSwapOffhand = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    swapOffhand();
  };

  // Dedicated touch look drag handling
  const handleLookTouchStart = useCallback((e: TouchEvent) => {
    // Only capture if not already tracking a look touch
    if (lookTouchId.current !== null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const target = touch.target as HTMLElement | null;
      // Do not capture touch if it originated from a button or UI control
      if (target?.closest('[data-mobile-control="true"]')) continue;

      // Look zone is active across the screen outside controls
      lookTouchId.current = touch.identifier;
      lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      break;
    }
  }, []);

  const handleLookTouchMove = useCallback((e: TouchEvent) => {
    if (lookTouchId.current === null || !lastLookPos.current) return;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === lookTouchId.current) {
        const deltaX = touch.clientX - lastLookPos.current.x;
        const deltaY = touch.clientY - lastLookPos.current.y;

        lastLookPos.current = { x: touch.clientX, y: touch.clientY };

        if (onLookRotate) {
          onLookRotate(deltaX, deltaY);
        } else {
          // Fallback custom event
          window.dispatchEvent(
            new CustomEvent('mobile-camera-look', { detail: { deltaX, deltaY } })
          );
        }
        break;
      }
    }
  }, [onLookRotate]);

  const handleLookTouchEnd = useCallback((e: TouchEvent) => {
    if (lookTouchId.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
        lastLookPos.current = null;
        break;
      }
    }
  }, []);

  useEffect(() => {
    if (!isMobile || isPaused || isInventoryOpen) return;

    window.addEventListener('touchstart', handleLookTouchStart, { passive: false });
    window.addEventListener('touchmove', handleLookTouchMove, { passive: false });
    window.addEventListener('touchend', handleLookTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleLookTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleLookTouchStart);
      window.removeEventListener('touchmove', handleLookTouchMove);
      window.removeEventListener('touchend', handleLookTouchEnd);
      window.removeEventListener('touchcancel', handleLookTouchEnd);
    };
  }, [isMobile, isPaused, isInventoryOpen, handleLookTouchStart, handleLookTouchMove, handleLookTouchEnd]);

  if (!isMobile || isPaused || isInventoryOpen) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-30 select-none overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* 1. TOP BAR: Pause button, Inventory button, and Status indicators */}
      <header className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
        {/* Left: Quick Actions & Status */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Pause Button */}
          <button
            id="mobile-pause-btn"
            data-mobile-control="true"
            onClick={(e) => {
              e.stopPropagation();
              setPaused(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              setPaused(true);
            }}
            className="w-12 h-12 bg-black/50 active:bg-black/75 rounded-lg border-2 border-white/60 text-white flex items-center justify-center shadow-lg cursor-pointer backdrop-blur-xs transition-transform active:scale-95"
            aria-label="Pause Game"
          >
            <Pause className="w-6 h-6 fill-white" />
          </button>

          {/* Sneak & Sprint status badges */}
          {virtualInputs.sneak && (
            <span className="px-2.5 py-1 bg-black/60 rounded border border-white/40 text-xs font-bold text-yellow-300">
              SNEAKING
            </span>
          )}
          {virtualInputs.sprint && (
            <span className="px-2.5 py-1 bg-black/60 rounded border border-white/40 text-xs font-bold text-sky-300">
              SPRINTING
            </span>
          )}
        </div>

        {/* Right: Inventory button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            id="mobile-inventory-btn"
            data-mobile-control="true"
            onClick={(e) => {
              e.stopPropagation();
              setInventoryOpen(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              setInventoryOpen(true);
            }}
            className="w-12 h-12 bg-black/50 active:bg-black/75 rounded-lg border-2 border-white/60 text-white flex items-center justify-center shadow-lg cursor-pointer backdrop-blur-xs transition-transform active:scale-95"
            aria-label="Open Inventory"
          >
            <Backpack className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* 2. BOTTOM-LEFT: Classic Minecraft D-Pad Controls */}
      <div 
        className="absolute bottom-6 left-6 pointer-events-auto flex flex-col items-center select-none"
        data-mobile-control="true"
        style={{ width: '168px', height: '168px' }}
      >
        {/* Sprint Toggle Pill above D-Pad */}
        <button
          id="mobile-sprint-btn"
          data-mobile-control="true"
          onClick={handleSprintToggle}
          onTouchEnd={handleSprintToggle}
          className={`absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-white/50 backdrop-blur-xs transition-all ${
            isSprintActive 
              ? 'bg-amber-500 text-black border-amber-300 shadow-md scale-105' 
              : 'bg-black/45 text-white/80'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${isSprintActive ? 'fill-current' : ''}`} />
          <span>SPRINT</span>
        </button>

        {/* D-Pad 3x3 Grid */}
        <div className="relative w-full h-full">
          {/* UP / FORWARD */}
          <button
            id="mobile-dpad-up"
            data-mobile-control="true"
            onTouchStart={(e) => handleButtonTouch('forward', true, e)}
            onTouchEnd={(e) => handleButtonTouch('forward', false, e)}
            onTouchCancel={(e) => handleButtonTouch('forward', false, e)}
            className={`absolute top-0 left-14 w-14 h-14 bg-black/45 active:bg-white/30 rounded-t-xl border-t-2 border-x-2 border-white/50 flex items-center justify-center text-white transition-colors ${
              virtualInputs.forward ? 'bg-white/35 scale-95' : ''
            }`}
          >
            <ChevronUp className="w-8 h-8" />
          </button>

          {/* DOWN / BACKWARD */}
          <button
            id="mobile-dpad-down"
            data-mobile-control="true"
            onTouchStart={(e) => handleButtonTouch('backward', true, e)}
            onTouchEnd={(e) => handleButtonTouch('backward', false, e)}
            onTouchCancel={(e) => handleButtonTouch('backward', false, e)}
            className={`absolute bottom-0 left-14 w-14 h-14 bg-black/45 active:bg-white/30 rounded-b-xl border-b-2 border-x-2 border-white/50 flex items-center justify-center text-white transition-colors ${
              virtualInputs.backward ? 'bg-white/35 scale-95' : ''
            }`}
          >
            <ChevronDown className="w-8 h-8" />
          </button>

          {/* LEFT / STRAFE LEFT */}
          <button
            id="mobile-dpad-left"
            data-mobile-control="true"
            onTouchStart={(e) => handleButtonTouch('left', true, e)}
            onTouchEnd={(e) => handleButtonTouch('left', false, e)}
            onTouchCancel={(e) => handleButtonTouch('left', false, e)}
            className={`absolute top-14 left-0 w-14 h-14 bg-black/45 active:bg-white/30 rounded-l-xl border-l-2 border-y-2 border-white/50 flex items-center justify-center text-white transition-colors ${
              virtualInputs.left ? 'bg-white/35 scale-95' : ''
            }`}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* RIGHT / STRAFE RIGHT */}
          <button
            id="mobile-dpad-right"
            data-mobile-control="true"
            onTouchStart={(e) => handleButtonTouch('right', true, e)}
            onTouchEnd={(e) => handleButtonTouch('right', false, e)}
            onTouchCancel={(e) => handleButtonTouch('right', false, e)}
            className={`absolute top-14 right-0 w-14 h-14 bg-black/45 active:bg-white/30 rounded-r-xl border-r-2 border-y-2 border-white/50 flex items-center justify-center text-white transition-colors ${
              virtualInputs.right ? 'bg-white/35 scale-95' : ''
            }`}
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* CENTER: Sneak / Crouch Toggle */}
          <button
            id="mobile-dpad-center-sneak"
            data-mobile-control="true"
            onClick={handleSneakToggle}
            onTouchEnd={handleSneakToggle}
            className={`absolute top-14 left-14 w-14 h-14 flex items-center justify-center border border-white/40 transition-colors ${
              virtualInputs.sneak ? 'bg-yellow-500/80 text-black' : 'bg-black/60 text-white'
            }`}
            title="Sneak / Crouch Toggle"
          >
            <UserCheck className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 3. BOTTOM-RIGHT: Action Controls (Jump, Mine, Place, Swap Offhand, Drop) */}
      <div 
        className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end gap-3 select-none"
        data-mobile-control="true"
      >
        {/* Secondary Actions Row: Drop & Swap Offhand */}
        <div className="flex items-center gap-3">
          {/* Drop Item (Q) */}
          <button
            id="mobile-drop-btn"
            data-mobile-control="true"
            onClick={handleDropItem}
            onTouchEnd={handleDropItem}
            className="w-11 h-11 bg-black/45 active:bg-white/30 rounded-full border-2 border-white/50 flex flex-col items-center justify-center text-white backdrop-blur-xs transition-transform active:scale-95 shadow"
            title="Drop Item"
          >
            <ArrowDownToLine className="w-5 h-5" />
            <span className="text-[9px] font-mono leading-none">DROP</span>
          </button>

          {/* Swap Offhand (F) */}
          <button
            id="mobile-swap-offhand-btn"
            data-mobile-control="true"
            onClick={handleSwapOffhand}
            onTouchEnd={handleSwapOffhand}
            className="w-11 h-11 bg-black/45 active:bg-white/30 rounded-full border-2 border-white/50 flex flex-col items-center justify-center text-white backdrop-blur-xs transition-transform active:scale-95 shadow"
            title="Swap Offhand"
          >
            <Shield className="w-5 h-5" />
            <span className="text-[9px] font-mono leading-none">OFF</span>
          </button>
        </div>

        {/* Primary Action Row: Mine & Place */}
        <div className="flex items-center gap-3">
          {/* Place Block / Use Item Button */}
          <button
            id="mobile-place-btn"
            data-mobile-control="true"
            onTouchStart={(e) => handleButtonTouch('place', true, e)}
            onTouchEnd={(e) => handleButtonTouch('place', false, e)}
            onTouchCancel={(e) => handleButtonTouch('place', false, e)}
            className={`w-14 h-14 bg-emerald-900/60 active:bg-emerald-600/80 rounded-2xl border-2 border-emerald-400 text-white flex flex-col items-center justify-center shadow-lg transition-transform ${
              virtualInputs.place ? 'bg-emerald-600 scale-95 border-emerald-200' : ''
            }`}
            title="Place Block"
          >
            <Box className="w-6 h-6" />
            <span className="text-[9px] font-bold font-mono">PLACE</span>
          </button>

          {/* Mine / Break Block Button */}
          <button
            id="mobile-mine-btn"
            data-mobile-control="true"
            onTouchStart={(e) => handleButtonTouch('mine', true, e)}
            onTouchEnd={(e) => handleButtonTouch('mine', false, e)}
            onTouchCancel={(e) => handleButtonTouch('mine', false, e)}
            className={`w-14 h-14 bg-rose-900/60 active:bg-rose-600/80 rounded-2xl border-2 border-rose-400 text-white flex flex-col items-center justify-center shadow-lg transition-transform ${
              virtualInputs.mine ? 'bg-rose-600 scale-95 border-rose-200' : ''
            }`}
            title="Break Block"
          >
            <Pickaxe className="w-6 h-6" />
            <span className="text-[9px] font-bold font-mono">MINE</span>
          </button>
        </div>

        {/* Large Jump Button */}
        <button
          id="mobile-jump-btn"
          data-mobile-control="true"
          onTouchStart={(e) => handleButtonTouch('jump', true, e)}
          onTouchEnd={(e) => handleButtonTouch('jump', false, e)}
          onTouchCancel={(e) => handleButtonTouch('jump', false, e)}
          className={`w-16 h-16 bg-black/50 active:bg-white/30 rounded-full border-3 border-white/70 flex items-center justify-center text-white shadow-xl transition-transform ${
            virtualInputs.jump ? 'bg-white/40 scale-95' : ''
          }`}
          title="Jump"
        >
          <ArrowUp className="w-9 h-9 stroke-[2.5]" />
        </button>
      </div>

      {/* Look Hint Pill (fades away after a few seconds) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none opacity-60 text-center">
        <span className="text-[11px] text-white/90 bg-black/40 px-3 py-1 rounded-full border border-white/20 font-mono">
          Drag right side to look around
        </span>
      </div>
    </div>
  );
}
