import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWorldStore } from '../store';
import { Pause, ArrowUp, UserCheck, Shield } from 'lucide-react';

interface MobileControlsProps {
  onLookRotate?: (deltaX: number, deltaY: number) => void;
}

const JOYSTICK_MAX_RADIUS = 44;
const TAP_MOVEMENT_THRESHOLD = 14;
const LONG_PRESS_THRESHOLD_MS = 220;

export function MobileControls({ onLookRotate }: MobileControlsProps) {
  const isMobile = useWorldStore((state) => state.isMobile);
  const isPaused = useWorldStore((state) => state.isPaused);
  const isInventoryOpen = useWorldStore((state) => state.isInventoryOpen);
  const setPaused = useWorldStore((state) => state.setPaused);
  const virtualInputs = useWorldStore((state) => state.virtualInputs);
  const setVirtualInput = useWorldStore((state) => state.setVirtualInput);
  const toggleVirtualInput = useWorldStore((state) => state.toggleVirtualInput);
  const setJoystickMove = useWorldStore((state) => state.setJoystickMove);

  // Left (Move) Joystick visual state
  const leftBaseRef = useRef<HTMLDivElement>(null);
  const [leftKnobPos, setLeftKnobPos] = useState({ x: 0, y: 0 });
  const leftTouchId = useRef<number | null>(null);
  const leftCenter = useRef({ x: 0, y: 0 });
  const lastForwardTapTime = useRef(0);

  // Right (Look) Joystick visual state
  const rightBaseRef = useRef<HTMLDivElement>(null);
  const [rightKnobPos, setRightKnobPos] = useState({ x: 0, y: 0 });
  const rightTouchId = useRef<number | null>(null);
  const rightCenter = useRef({ x: 0, y: 0 });
  const lookVelocity = useRef({ x: 0, y: 0 });
  const lookAnimFrame = useRef<number | null>(null);

  // Gesture-based interaction tracking (Tap to place, Hold to mine, Drag to look)
  const gestureTouch = useRef<{
    id: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    startTime: number;
    hasMoved: boolean;
    isMining: boolean;
    timer: ReturnType<typeof setTimeout> | null;
  } | null>(null);

  // Continuous loop for right look joystick rotation
  useEffect(() => {
    let active = true;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      if (!active) return;
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const vx = lookVelocity.current.x;
      const vy = lookVelocity.current.y;

      if ((Math.abs(vx) > 0.001 || Math.abs(vy) > 0.001) && !useWorldStore.getState().isPaused) {
        // Sensitivity tuned for smooth, responsive turning
        const lookSpeed = 380;
        const deltaX = vx * lookSpeed * dt;
        const deltaY = vy * lookSpeed * dt;

        window.dispatchEvent(
          new CustomEvent('mobile-camera-look', {
            detail: { deltaX, deltaY },
          })
        );
        onLookRotate?.(deltaX, deltaY);
      }

      lookAnimFrame.current = requestAnimationFrame(loop);
    };

    lookAnimFrame.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (lookAnimFrame.current) {
        cancelAnimationFrame(lookAnimFrame.current);
      }
    };
  }, [onLookRotate]);

  // Clean up when pausing or opening inventory
  useEffect(() => {
    if (isPaused || isInventoryOpen) {
      // Cancel active gestures
      if (gestureTouch.current) {
        if (gestureTouch.current.timer) clearTimeout(gestureTouch.current.timer);
        if (gestureTouch.current.isMining) {
          setVirtualInput('mine', false);
        }
        gestureTouch.current = null;
      }
      // Reset joysticks
      leftTouchId.current = null;
      rightTouchId.current = null;
      setLeftKnobPos({ x: 0, y: 0 });
      setRightKnobPos({ x: 0, y: 0 });
      lookVelocity.current = { x: 0, y: 0 };
      setJoystickMove(0, 0);
      setVirtualInput('sprint', false);
      setVirtualInput('jump', false);
    }
  }, [isPaused, isInventoryOpen, setJoystickMove, setVirtualInput]);

  // --------------------------------------------------------------------------
  // 1. LEFT (MOVE) JOYSTICK HANDLERS
  // --------------------------------------------------------------------------
  const handleLeftTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (leftTouchId.current !== null) return;

    const touch = e.changedTouches[0];
    leftTouchId.current = touch.identifier;

    if (leftBaseRef.current) {
      const rect = leftBaseRef.current.getBoundingClientRect();
      leftCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    handleLeftMove(touch.clientX, touch.clientY);
  };

  const handleLeftMove = (clientX: number, clientY: number) => {
    const rawDx = clientX - leftCenter.current.x;
    const rawDy = clientY - leftCenter.current.y;
    const dist = Math.hypot(rawDx, rawDy);

    const clampedDist = Math.min(dist, JOYSTICK_MAX_RADIUS);
    const angle = Math.atan2(rawDy, rawDx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setLeftKnobPos({ x: knobX, y: knobY });

    // Normalized input (-1 to 1)
    const normX = knobX / JOYSTICK_MAX_RADIUS;
    const normY = -knobY / JOYSTICK_MAX_RADIUS; // up on screen is positive forward

    setJoystickMove(normX, normY);

    // Sprint detection: double-tap forward or pushing all the way forward (> 0.85)
    // Only allow sprint if hunger is above 6 (Minecraft Java Edition rule)
    const canSprintHunger = useWorldStore.getState().hunger > 6;
    if (canSprintHunger && normY > 0.85) {
      setVirtualInput('sprint', true);
    } else if (canSprintHunger && normY > 0.4) {
      const now = performance.now();
      if (now - lastForwardTapTime.current < 300) {
        setVirtualInput('sprint', true);
      }
      lastForwardTapTime.current = now;
    } else {
      setVirtualInput('sprint', false);
    }
  };

  const handleLeftTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === leftTouchId.current) {
        leftTouchId.current = null;
        setLeftKnobPos({ x: 0, y: 0 });
        setJoystickMove(0, 0);
        setVirtualInput('sprint', false);
        break;
      }
    }
  };

  // --------------------------------------------------------------------------
  // 2. RIGHT (LOOK) JOYSTICK HANDLERS
  // --------------------------------------------------------------------------
  const handleRightTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (rightTouchId.current !== null) return;

    const touch = e.changedTouches[0];
    rightTouchId.current = touch.identifier;

    if (rightBaseRef.current) {
      const rect = rightBaseRef.current.getBoundingClientRect();
      rightCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    handleRightMove(touch.clientX, touch.clientY);
  };

  const handleRightMove = (clientX: number, clientY: number) => {
    const rawDx = clientX - rightCenter.current.x;
    const rawDy = clientY - rightCenter.current.y;
    const dist = Math.hypot(rawDx, rawDy);

    const clampedDist = Math.min(dist, JOYSTICK_MAX_RADIUS);
    const angle = Math.atan2(rawDy, rawDx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setRightKnobPos({ x: knobX, y: knobY });

    // Look rotation velocity
    const normX = knobX / JOYSTICK_MAX_RADIUS;
    const normY = knobY / JOYSTICK_MAX_RADIUS;

    lookVelocity.current = {
      x: normX,
      y: normY,
    };
  };

  const handleRightTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === rightTouchId.current) {
        rightTouchId.current = null;
        setRightKnobPos({ x: 0, y: 0 });
        lookVelocity.current = { x: 0, y: 0 };
        break;
      }
    }
  };

  // Window-level touch move & end listeners for active joystick drags
  useEffect(() => {
    const onWindowTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === leftTouchId.current) {
          handleLeftMove(touch.clientX, touch.clientY);
        } else if (touch.identifier === rightTouchId.current) {
          handleRightMove(touch.clientX, touch.clientY);
        }
      }
    };

    const onWindowTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === leftTouchId.current) {
          leftTouchId.current = null;
          setLeftKnobPos({ x: 0, y: 0 });
          setJoystickMove(0, 0);
          setVirtualInput('sprint', false);
        }
        if (touch.identifier === rightTouchId.current) {
          rightTouchId.current = null;
          setRightKnobPos({ x: 0, y: 0 });
          lookVelocity.current = { x: 0, y: 0 };
        }
      }
    };

    window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
    window.addEventListener('touchend', onWindowTouchEnd);
    window.addEventListener('touchcancel', onWindowTouchEnd);

    return () => {
      window.removeEventListener('touchmove', onWindowTouchMove);
      window.removeEventListener('touchend', onWindowTouchEnd);
      window.removeEventListener('touchcancel', onWindowTouchEnd);
    };
  }, [setJoystickMove, setVirtualInput]);

  // --------------------------------------------------------------------------
  // 3. GESTURE-BASED BLOCK INTERACTION (HOLD TO MINE, TAP TO PLACE, DRAG TO LOOK)
  // --------------------------------------------------------------------------
  const handleGestureTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isMobile || isPaused || isInventoryOpen) return;
      if (gestureTouch.current !== null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const target = touch.target as HTMLElement | null;

        // Ignore touches that originated on interactive UI buttons or joysticks
        if (target?.closest('[data-mobile-control="true"]')) continue;

        const touchId = touch.identifier;
        const startX = touch.clientX;
        const startY = touch.clientY;
        const startTime = performance.now();

        // Start long-press timer to trigger block mining
        const timer = setTimeout(() => {
          if (gestureTouch.current && gestureTouch.current.id === touchId) {
            if (!gestureTouch.current.hasMoved) {
              gestureTouch.current.isMining = true;
              setVirtualInput('mine', true);
            }
          }
        }, LONG_PRESS_THRESHOLD_MS);

        gestureTouch.current = {
          id: touchId,
          startX,
          startY,
          lastX: startX,
          lastY: startY,
          startTime,
          hasMoved: false,
          isMining: false,
          timer,
        };
        break;
      }
    },
    [isMobile, isPaused, isInventoryOpen, setVirtualInput]
  );

  const handleGestureTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!gestureTouch.current) return;

      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === gestureTouch.current.id) {
          const dx = touch.clientX - gestureTouch.current.startX;
          const dy = touch.clientY - gestureTouch.current.startY;
          const totalDist = Math.hypot(dx, dy);

          if (totalDist > TAP_MOVEMENT_THRESHOLD) {
            gestureTouch.current.hasMoved = true;
            if (gestureTouch.current.timer) {
              clearTimeout(gestureTouch.current.timer);
              gestureTouch.current.timer = null;
            }
            if (gestureTouch.current.isMining) {
              // Cancel mining if dragged significantly
              gestureTouch.current.isMining = false;
              setVirtualInput('mine', false);
            }

            // Drag-to-look camera rotation
            const deltaX = touch.clientX - gestureTouch.current.lastX;
            const deltaY = touch.clientY - gestureTouch.current.lastY;

            gestureTouch.current.lastX = touch.clientX;
            gestureTouch.current.lastY = touch.clientY;

            window.dispatchEvent(
              new CustomEvent('mobile-camera-look', {
                detail: { deltaX, deltaY },
              })
            );
            onLookRotate?.(deltaX, deltaY);
          }
          break;
        }
      }
    },
    [onLookRotate, setVirtualInput]
  );

  const handleGestureTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!gestureTouch.current) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === gestureTouch.current.id) {
          const current = gestureTouch.current;
          if (current.timer) {
            clearTimeout(current.timer);
          }

          if (current.isMining) {
            // Finger lifted after mining
            current.isMining = false;
            setVirtualInput('mine', false);
          } else if (!current.hasMoved) {
            const elapsed = performance.now() - current.startTime;
            if (elapsed < LONG_PRESS_THRESHOLD_MS) {
              // Clean short tap on block: place selected block from hotbar!
              window.dispatchEvent(new CustomEvent('mobile-place-block'));
            }
          }

          gestureTouch.current = null;
          break;
        }
      }
    },
    [setVirtualInput]
  );

  useEffect(() => {
    window.addEventListener('touchstart', handleGestureTouchStart, { passive: true });
    window.addEventListener('touchmove', handleGestureTouchMove, { passive: false });
    window.addEventListener('touchend', handleGestureTouchEnd);
    window.addEventListener('touchcancel', handleGestureTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleGestureTouchStart);
      window.removeEventListener('touchmove', handleGestureTouchMove);
      window.removeEventListener('touchend', handleGestureTouchEnd);
      window.removeEventListener('touchcancel', handleGestureTouchEnd);
    };
  }, [handleGestureTouchStart, handleGestureTouchMove, handleGestureTouchEnd]);

  if (!isMobile || isPaused || isInventoryOpen) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none overflow-hidden touch-none">
      {/* 1. TOP-LEFT: Pause Button */}
      <div className="absolute top-3.5 left-3.5 pointer-events-auto" data-mobile-control="true">
        <button
          id="mobile-pause-btn"
          data-mobile-control="true"
          onClick={() => setPaused(true)}
          className="w-11 h-11 bg-black/45 active:bg-black/75 rounded-xl border-2 border-white/60 flex items-center justify-center text-white backdrop-blur-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
          title="Pause Game"
          aria-label="Pause Game"
        >
          <Pause className="w-5 h-5 fill-white" />
        </button>
      </div>

      {/* 2. BOTTOM-LEFT: Movement Joystick & Sneak Toggle */}
      <div className="absolute bottom-6 left-6 pointer-events-auto flex flex-col items-center gap-3">
        {/* Sneak / Crouch Toggle Button */}
        <button
          id="mobile-sneak-toggle-btn"
          data-mobile-control="true"
          onClick={() => toggleVirtualInput('sneak')}
          className={`w-11 h-11 rounded-full border-2 border-white/60 flex flex-col items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer ${
            virtualInputs.sneak
              ? 'bg-amber-400 text-black border-amber-200'
              : 'bg-black/50 text-white/90 border-white/50'
          }`}
          title="Sneak / Crouch Toggle"
          aria-label="Sneak Toggle"
        >
          <UserCheck className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[8px] font-mono font-bold leading-none mt-0.5">SNEAK</span>
        </button>

        {/* Movement Joystick Base */}
        <div
          id="mobile-left-joystick"
          ref={leftBaseRef}
          data-mobile-control="true"
          onTouchStart={handleLeftTouchStart}
          onTouchEnd={handleLeftTouchEnd}
          onTouchCancel={handleLeftTouchEnd}
          className="relative w-28 h-28 rounded-full bg-black/35 border-2 border-white/40 flex items-center justify-center backdrop-blur-xs shadow-xl touch-none"
        >
          {/* Subtle directional indicators */}
          <div className="absolute inset-2 rounded-full border border-dashed border-white/20 pointer-events-none" />
          <div className="absolute top-1.5 w-1.5 h-1.5 rounded-full bg-white/40 pointer-events-none" />
          <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-white/40 pointer-events-none" />
          <div className="absolute left-1.5 w-1.5 h-1.5 rounded-full bg-white/40 pointer-events-none" />
          <div className="absolute right-1.5 w-1.5 h-1.5 rounded-full bg-white/40 pointer-events-none" />

          {/* Movable Thumb Knob */}
          <div
            className="w-13 h-13 rounded-full bg-white/80 border-2 border-white shadow-lg flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${leftKnobPos.x}px, ${leftKnobPos.y}px)`,
            }}
          >
            <div className="w-5 h-5 rounded-full bg-stone-700/60" />
          </div>
        </div>
      </div>

      {/* 3. BOTTOM-RIGHT: Jump Button & Look Joystick */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-center gap-3">
        {/* Jump Button */}
        <button
          id="mobile-jump-btn"
          data-mobile-control="true"
          onTouchStart={(e) => {
            e.stopPropagation();
            setVirtualInput('jump', true);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            setVirtualInput('jump', false);
          }}
          onTouchCancel={(e) => {
            e.stopPropagation();
            setVirtualInput('jump', false);
          }}
          onMouseDown={() => setVirtualInput('jump', true)}
          onMouseUp={() => setVirtualInput('jump', false)}
          className={`w-14 h-14 rounded-full border-2 border-white/70 flex items-center justify-center text-white shadow-xl transition-transform active:scale-95 cursor-pointer ${
            virtualInputs.jump ? 'bg-white/50 scale-95' : 'bg-black/50 active:bg-white/30'
          }`}
          title="Jump"
          aria-label="Jump"
        >
          <ArrowUp className="w-8 h-8 stroke-[2.5]" />
        </button>

        {/* Look Joystick Base */}
        <div
          id="mobile-right-joystick"
          ref={rightBaseRef}
          data-mobile-control="true"
          onTouchStart={handleRightTouchStart}
          onTouchEnd={handleRightTouchEnd}
          onTouchCancel={handleRightTouchEnd}
          className="relative w-28 h-28 rounded-full bg-black/35 border-2 border-white/40 flex items-center justify-center backdrop-blur-xs shadow-xl touch-none"
        >
          <div className="absolute inset-2 rounded-full border border-dashed border-white/20 pointer-events-none" />
          {/* Movable Thumb Knob */}
          <div
            className="w-13 h-13 rounded-full bg-white/80 border-2 border-white shadow-lg flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${rightKnobPos.x}px, ${rightKnobPos.y}px)`,
            }}
          >
            <div className="w-5 h-5 rounded-full bg-stone-700/60" />
          </div>
        </div>
      </div>

      {/* Subtle Hint Bar at top for first-time touch discovery */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none opacity-75 text-center">
        <span className="text-[11px] text-white/90 bg-black/45 px-3 py-1 rounded-full border border-white/20 font-mono tracking-tight shadow">
          Tap block: Place &bull; Hold block: Mine &bull; Swipe: Look
        </span>
      </div>
    </div>
  );
}
