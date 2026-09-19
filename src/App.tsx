/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Canvas } from '@react-three/fiber';
import { Player } from './components/Player';
import { useWorldStore } from './store';
import { useState, useEffect } from 'react';
import { TargetHighlight } from './components/TargetHighlight';
import { BreakParticles } from './components/BreakParticles';
import { VoxelBlock } from './components/VoxelBlock';
import { Hotbar } from './components/Hotbar';
import { DroppedItemView } from './components/DroppedItemView';
import { PhysicsEngine } from './components/PhysicsEngine';
import { InventoryUI } from './components/InventoryUI';
import { InputManager } from './components/InputManager';
import { MobileControls } from './components/MobileControls';
import { PauseMenu } from './components/PauseMenu';
import { initAudio } from './utils/audio';

export default function App() {
  const [isLocked, setIsLocked] = useState(false);
  const [canLock, setCanLock] = useState(true);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  const blocks = useWorldStore(state => state.blocks);
  const fallingBlocks = useWorldStore(state => state.fallingBlocks);
  const droppedItems = useWorldStore(state => state.droppedItems);
  const isInventoryOpen = useWorldStore(state => state.isInventoryOpen);
  const isPaused = useWorldStore(state => state.isPaused);
  const setPaused = useWorldStore(state => state.setPaused);
  const isMobile = useWorldStore(state => state.isMobile);

  useEffect(() => {
    const handlePointerLockChange = () => {
      const lockEl =
        document.pointerLockElement ||
        (document as unknown as { webkitPointerLockElement?: Element }).webkitPointerLockElement ||
        (document as unknown as { mozPointerLockElement?: Element }).mozPointerLockElement;
      const locked = Boolean(lockEl);
      setIsLocked(locked);
      
      // If the user just unlocked, enforce a short cooldown before they can lock again.
      // This prevents the "Pointer lock cannot be acquired immediately" browser error.
      // Skip the cooldown when unlocking to show the inventory — we re-lock on close.
      if (!locked && !useWorldStore.getState().isInventoryOpen) {
        setCanLock(false);
        setTimeout(() => setCanLock(true), 1500);
      }

      // Auto-pause if pointer lock was released while actively playing and not in inventory
      if (!locked && hasStartedPlaying && !useWorldStore.getState().isInventoryOpen && !useWorldStore.getState().isPaused) {
        setPaused(true);
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('webkitpointerlockchange', handlePointerLockChange);
    document.addEventListener('mozpointerlockchange', handlePointerLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('webkitpointerlockchange', handlePointerLockChange);
      document.removeEventListener('mozpointerlockchange', handlePointerLockChange);
    };
  }, []);

  const handleStartPlay = () => {
    if (!canLock) return;
    initAudio();
    setHasStartedPlaying(true);
    setPaused(false);

    if (isMobile) {
      // Mobile does not require desktop pointer lock
      setIsLocked(true);
      return;
    }

    const canvas = document.querySelector('canvas');
    const target = canvas || document.body;
    const requestFn =
      target?.requestPointerLock ||
      (target as unknown as { webkitRequestPointerLock?: () => void })?.webkitRequestPointerLock;

    if (typeof requestFn === 'function') {
      try {
        const res = requestFn.call(target);
        if (res && typeof (res as unknown as Promise<void>).catch === 'function') {
          (res as unknown as Promise<void>).catch(() => {});
        }
      } catch (err) {
        console.warn('Pointer lock request error:', err);
      }
    } else {
      // In touch / mobile environments without pointer lock
      setIsLocked(true);
    }
  };

  const showStartScreen = !hasStartedPlaying;
  const isPlayingActive = hasStartedPlaying && !isPaused && !isInventoryOpen;

  return (
    <div className="w-full h-screen bg-sky-200 relative overflow-hidden select-none">
      {/* Initial Start Splash Screen */}
      {showStartScreen && (
        <div
          onClick={handleStartPlay}
          className={`absolute inset-0 flex flex-col items-center justify-center bg-black/75 z-40 text-white transition-opacity duration-300 p-4 ${
            canLock ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
          }`}
        >
          <div className="flex flex-col items-center text-center max-w-md font-mono">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 tracking-wider text-amber-300 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
              MINECRAFT JAVA
            </h1>
            
            {canLock ? (
              <p className="mb-4 text-xl sm:text-2xl font-bold animate-pulse text-white">
                {isMobile ? 'Tap anywhere to play' : 'Click anywhere to play'}
              </p>
            ) : (
              <p className="mb-4 text-xl text-yellow-400">Please wait...</p>
            )}

            {/* Controls summary badge */}
            <div className="bg-black/50 border border-white/30 rounded-lg p-3 text-xs text-stone-200 w-full mb-2 leading-relaxed">
              {isMobile ? (
                <div className="space-y-1">
                  <p className="font-bold text-yellow-300 mb-1">Mobile Touch Controls:</p>
                  <p>• Left Joystick: Move &amp; Sprint</p>
                  <p>• Right Joystick: Look around</p>
                  <p>• Tap block: Place &bull; Hold block: Mine</p>
                  <p>• Jump &amp; Sneak buttons &bull; &apos;•••&apos; Inventory</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold text-yellow-300 mb-1">Keyboard &amp; Mouse Controls:</p>
                  <p>• W, A, S, D to move &bull; Double-tap W to sprint</p>
                  <p>• Shift to sneak &bull; Space to jump</p>
                  <p>• Left Click: Mine &bull; Right Click: Place</p>
                  <p>• E: Inventory &bull; Q: Drop (Ctrl+Q: Stack) &bull; Esc: Pause</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Crosshair UI */}
      {isPlayingActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative flex items-center justify-center mix-blend-difference">
            <div className="absolute w-4 h-[2px] bg-white opacity-80" />
            <div className="absolute h-4 w-[2px] bg-white opacity-80" />
          </div>
        </div>
      )}

      <Canvas camera={{ position: [0, 5, 0], fov: 70 }}>
        <InputManager />
        <PhysicsEngine />
        <Player />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        
        {blocks.map((block) => (
          <VoxelBlock 
            key={`${block.x}_${block.y}_${block.z}`} 
            type={block.type} 
            position={[block.x, block.y, block.z]}
          />
        ))}

        {fallingBlocks.map((fb) => (
          <VoxelBlock 
            key={`falling_${fb.id}`} 
            type={fb.type} 
            position={fb.position}
          />
        ))}

        {droppedItems.map(item => (
          <DroppedItemView key={item.id} item={item} />
        ))}

        <BreakParticles />
        <TargetHighlight />
      </Canvas>
      
      {/* Mobile Touch Overlay */}
      <MobileControls />

      {/* Pause Menu Modal */}
      <PauseMenu />

      {/* Hotbar */}
      <Hotbar />

      {/* Inventory Window */}
      <InventoryUI />
    </div>
  );
}
