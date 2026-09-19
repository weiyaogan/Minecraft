import { useEffect, useRef } from 'react';

export function useKeyboard() {
  const isDoubleTapSprint = useRef(false);
  const lastWPressTime = useRef(0);

  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    shift: false,
    sprint: false,
    sprintKey: false,
    resetDoubleTap: () => {
      isDoubleTapSprint.current = false;
    },
    cancelSprint: () => {
      isDoubleTapSprint.current = false;
      keys.current.sprint = false;
      keys.current.sprintKey = false;
    },
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger inputs if typing in an input field (just in case)
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          if (!keys.current.forward) {
            const now = performance.now();
            if (now - lastWPressTime.current < 350) {
              isDoubleTapSprint.current = true;
            }
            lastWPressTime.current = now;
          }
          keys.current.forward = true;
          keys.current.sprint = keys.current.sprintKey || isDoubleTapSprint.current;
          break;

        case 'ControlLeft':
        case 'ControlRight':
        case 'KeyR':
          keys.current.sprintKey = true;
          keys.current.sprint = true;
          break;

        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = true;
          break;
        case 'Space':
          keys.current.jump = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.shift = true;
          isDoubleTapSprint.current = false;
          keys.current.sprint = false;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = false;
          isDoubleTapSprint.current = false;
          keys.current.sprint = keys.current.sprintKey;
          break;

        case 'ControlLeft':
        case 'ControlRight':
        case 'KeyR':
          keys.current.sprintKey = false;
          keys.current.sprint = isDoubleTapSprint.current;
          break;

        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = false;
          break;
        case 'Space':
          keys.current.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.shift = false;
          break;
      }
    };

    // When the window loses focus, clear all keys including sprint
    const handleBlur = () => {
      keys.current.forward = false;
      keys.current.backward = false;
      keys.current.left = false;
      keys.current.right = false;
      keys.current.jump = false;
      keys.current.shift = false;
      keys.current.sprint = false;
      keys.current.sprintKey = false;
      isDoubleTapSprint.current = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return keys.current;
}
