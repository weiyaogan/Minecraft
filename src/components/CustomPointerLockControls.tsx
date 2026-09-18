import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { Euler } from 'three';
import { useWorldStore } from '../store';

export interface CustomPointerLockControlsRef {
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
  domElement?: HTMLElement;
}

interface CustomPointerLockControlsProps {
  selector?: string;
  enabled?: boolean;
  onChange?: () => void;
  onLock?: () => void;
  onUnlock?: () => void;
}

export const CustomPointerLockControls = forwardRef<CustomPointerLockControlsRef, CustomPointerLockControlsProps>(
  ({ selector, enabled = true, onChange, onLock, onUnlock }, ref) => {
    const { camera, gl } = useThree();
    const [isLocked, setIsLocked] = useState(false);
    const isLockedRef = useRef(false);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    const getPointerLockElement = useCallback(() => {
      if (typeof document === 'undefined') return null;
      return (
        document.pointerLockElement ||
        (document as unknown as { webkitPointerLockElement?: Element }).webkitPointerLockElement ||
        (document as unknown as { mozPointerLockElement?: Element }).mozPointerLockElement ||
        null
      );
    }, []);

    const lock = useCallback(() => {
      const target = gl.domElement || document.body;
      if (!target) return;

      const requestFn =
        target.requestPointerLock ||
        (target as unknown as { webkitRequestPointerLock?: () => void }).webkitRequestPointerLock ||
        (target as unknown as { mozRequestPointerLock?: () => void }).mozRequestPointerLock;

      if (typeof requestFn === 'function') {
        try {
          const res = (target as HTMLElement).requestPointerLock();
          // Some modern browsers return a Promise
          if (res && typeof (res as unknown as Promise<void>).catch === 'function') {
            (res as unknown as Promise<void>).catch((err) => {
              console.warn('Pointer lock request rejected:', err);
            });
          }
        } catch (err) {
          console.warn('Pointer lock request error:', err);
        }
      } else {
        // Fallback for touch devices or environments without pointer lock API
        isLockedRef.current = true;
        setIsLocked(true);
        onLock?.();
      }
    }, [gl.domElement, onLock]);

    const unlock = useCallback(() => {
      const exitFn =
        document.exitPointerLock ||
        (document as unknown as { webkitExitPointerLock?: () => void }).webkitExitPointerLock ||
        (document as unknown as { mozExitPointerLock?: () => void }).mozExitPointerLock;

      if (typeof exitFn === 'function') {
        try {
          document.exitPointerLock();
        } catch (e) {
          console.warn('Exit pointer lock error:', e);
        }
      }
      isLockedRef.current = false;
      setIsLocked(false);
      onUnlock?.();
    }, [onUnlock]);

    useImperativeHandle(
      ref,
      () => ({
        get isLocked() {
          const store = useWorldStore.getState();
          return isLockedRef.current || (store.isMobile && !store.isPaused && !store.isInventoryOpen);
        },
        lock,
        unlock,
        domElement: gl.domElement,
      }),
      [gl.domElement, lock, unlock]
    );

    useEffect(() => {
      if (!enabled) return;

      const handleMobileCameraLook = (e: Event) => {
        const customEvent = e as CustomEvent<{ deltaX: number; deltaY: number }>;
        if (!customEvent.detail) return;
        const { deltaX, deltaY } = customEvent.detail;

        const euler = new Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(camera.quaternion);

        const touchSensitivity = 0.0035;
        euler.y -= deltaX * touchSensitivity;
        euler.x -= deltaY * touchSensitivity;

        const maxPitch = Math.PI / 2 - 0.01;
        euler.x = Math.max(-maxPitch, Math.min(maxPitch, euler.x));

        camera.quaternion.setFromEuler(euler);
        onChange?.();
      };

      window.addEventListener('mobile-camera-look', handleMobileCameraLook);

      const handlePointerLockChange = () => {
        const lockEl = getPointerLockElement();
        const locked = lockEl === gl.domElement || lockEl !== null;
        isLockedRef.current = locked;
        setIsLocked(locked);

        if (locked) {
          onLock?.();
        } else {
          onUnlock?.();
        }
        onChange?.();
      };

      const handlePointerLockError = (err: Event) => {
        console.warn('Pointer lock error event:', err);
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isLockedRef.current) return;

        const movementX =
          e.movementX ??
          (e as unknown as { webkitMovementX?: number }).webkitMovementX ??
          (e as unknown as { mozMovementX?: number }).mozMovementX ??
          0;
        const movementY =
          e.movementY ??
          (e as unknown as { webkitMovementY?: number }).webkitMovementY ??
          (e as unknown as { mozMovementY?: number }).mozMovementY ??
          0;

        const euler = new Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(camera.quaternion);

        // Minecraft Java mouse look sensitivity
        const sensitivity = 0.002;
        euler.y -= movementX * sensitivity;
        euler.x -= movementY * sensitivity;

        // Clamp vertical look between -89.5 deg and +89.5 deg
        const maxPitch = Math.PI / 2 - 0.01;
        euler.x = Math.max(-maxPitch, Math.min(maxPitch, euler.x));

        camera.quaternion.setFromEuler(euler);
        onChange?.();
      };

      // Touch controls for mobile / tablet devices where pointer lock is absent
      const handleTouchStart = (e: TouchEvent) => {
        if (useWorldStore.getState().isMobile) return;
        if (e.touches.length === 1) {
          touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
          if (!isLockedRef.current) {
            isLockedRef.current = true;
            setIsLocked(true);
            onLock?.();
          }
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (useWorldStore.getState().isMobile) return;
        if (!touchStartRef.current || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const movementX = touch.clientX - touchStartRef.current.x;
        const movementY = touch.clientY - touchStartRef.current.y;

        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
        };

        const euler = new Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(camera.quaternion);

        const touchSensitivity = 0.004;
        euler.y -= movementX * touchSensitivity;
        euler.x -= movementY * touchSensitivity;

        const maxPitch = Math.PI / 2 - 0.01;
        euler.x = Math.max(-maxPitch, Math.min(maxPitch, euler.x));

        camera.quaternion.setFromEuler(euler);
        onChange?.();
      };

      const handleTouchEnd = () => {
        touchStartRef.current = null;
      };

      // Click trigger to engage lock
      const handleClick = (e: MouseEvent) => {
        // If clicking on UI or when already locked, do not re-request
        if (isLockedRef.current) return;
        if (useWorldStore.getState().isInventoryOpen) return;
        // Check if user clicked an interactive UI element
        const target = e.target as HTMLElement | null;
        if (target && target.closest('button, input, select, textarea')) {
          return;
        }
        lock();
      };

      const targetElements = selector
        ? Array.from(document.querySelectorAll(selector))
        : [gl.domElement, document.body];

      targetElements.forEach((el) => {
        if (el) {
          el.addEventListener('click', handleClick as EventListener);
        }
      });

      document.addEventListener('pointerlockchange', handlePointerLockChange);
      document.addEventListener('webkitpointerlockchange', handlePointerLockChange);
      document.addEventListener('mozpointerlockchange', handlePointerLockChange);

      document.addEventListener('pointerlockerror', handlePointerLockError);
      document.addEventListener('webkitpointerlockerror', handlePointerLockError);
      document.addEventListener('mozpointerlockerror', handlePointerLockError);

      document.addEventListener('mousemove', handleMouseMove);

      const canvasEl = gl.domElement;
      if (canvasEl) {
        canvasEl.addEventListener('touchstart', handleTouchStart, { passive: true });
        canvasEl.addEventListener('touchmove', handleTouchMove, { passive: true });
        canvasEl.addEventListener('touchend', handleTouchEnd, { passive: true });
      }

      return () => {
        targetElements.forEach((el) => {
          if (el) {
            el.removeEventListener('click', handleClick as EventListener);
          }
        });

        document.removeEventListener('pointerlockchange', handlePointerLockChange);
        document.removeEventListener('webkitpointerlockchange', handlePointerLockChange);
        document.removeEventListener('mozpointerlockchange', handlePointerLockChange);

        document.removeEventListener('pointerlockerror', handlePointerLockError);
        document.removeEventListener('webkitpointerlockerror', handlePointerLockError);
        document.removeEventListener('mozpointerlockerror', handlePointerLockError);

        document.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mobile-camera-look', handleMobileCameraLook);

        if (canvasEl) {
          canvasEl.removeEventListener('touchstart', handleTouchStart);
          canvasEl.removeEventListener('touchmove', handleTouchMove);
          canvasEl.removeEventListener('touchend', handleTouchEnd);
        }
      };
    }, [camera, enabled, getPointerLockElement, gl.domElement, lock, onChange, onLock, onUnlock, selector]);

    return null;
  }
);
