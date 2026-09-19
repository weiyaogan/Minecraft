import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useWorldStore } from '../store';
import { Vector3 } from 'three';

export function InputManager() {
  const { camera } = useThree();
  const lastThrowTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useWorldStore.getState();

      if (e.code === 'KeyE') {
        if (state.isInventoryOpen) {
          state.setInventoryOpen(false);
          const canvas = document.querySelector('canvas');
          if (canvas) {
            try { canvas.requestPointerLock(); } catch (err) {}
          }
        } else {
          state.setInventoryOpen(true);
          document.exitPointerLock();
        }
      }

      if (e.code === 'Escape') {
        if (state.isInventoryOpen) {
          state.setInventoryOpen(false);
        } else {
          state.setPaused(!state.isPaused);
        }
      }

      if (e.code === 'KeyF' && !state.isInventoryOpen) {
        state.swapOffhand();
      }

      if (e.code === 'KeyQ') {
        e.preventDefault();
        const dropAll = Boolean(e.ctrlKey || e.metaKey);

        // Minecraft Java style keyboard repetition handling:
        // Initial press triggers immediately.
        // Holding Q repeats at ~160ms intervals (Minecraft Java style drop rate).
        // Ctrl+Q drops the whole stack at once and does not repeat while held.
        const now = performance.now();
        if (e.repeat) {
          if (dropAll) return;
          if (now - lastThrowTime.current < 160) return;
        }
        lastThrowTime.current = now;

        const dir = new Vector3();
        camera.getWorldDirection(dir);
        if (!state.isInventoryOpen) {
          state.throwCurrentItem(dropAll, camera.position, dir);
        } else {
          // Inventory is open
          if (state.cursorItem) {
            state.throwInventoryItem('cursor', 0, dropAll, camera.position, dir);
          } else if (state.hoveredSlot) {
            state.throwInventoryItem(state.hoveredSlot.container, state.hoveredSlot.index, dropAll, camera.position, dir);
          }
        }
      }
    };

    const handleDropCursorItem = (e: Event) => {
      const customEvent = e as CustomEvent<{ dropAll: boolean }>;
      const state = useWorldStore.getState();
      if (state.cursorItem) {
        const dir = new Vector3();
        camera.getWorldDirection(dir);
        state.throwInventoryItem('cursor', 0, customEvent.detail.dropAll, camera.position, dir);
      }
    };

    const handleMobileDropItem = (e: Event) => {
      const customEvent = e as CustomEvent<{ dropAll?: boolean }>;
      const state = useWorldStore.getState();
      const dir = new Vector3();
      camera.getWorldDirection(dir);
      if (!state.isInventoryOpen) {
        state.throwCurrentItem(Boolean(customEvent.detail?.dropAll), camera.position, dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('drop-cursor-item', handleDropCursorItem);
    window.addEventListener('mobile-drop-item', handleMobileDropItem);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('drop-cursor-item', handleDropCursorItem);
      window.removeEventListener('mobile-drop-item', handleMobileDropItem);
    };
  }, [camera]);

  return null;
}
