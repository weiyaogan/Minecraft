/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Canvas } from '@react-three/fiber';
import { Player } from './components/Player';
import { useWorldStore } from './store';
import { useState, useEffect } from 'react';
import { TargetHighlight } from './components/TargetHighlight';
import { VoxelBlock } from './components/VoxelBlock';
import { Hotbar } from './components/Hotbar';
import { DroppedItemView } from './components/DroppedItemView';
import { PhysicsEngine } from './components/PhysicsEngine';
import { InventoryUI } from './components/InventoryUI';
import { InputManager } from './components/InputManager';

export default function App() {
  const [isLocked, setIsLocked] = useState(false);
  const [canLock, setCanLock] = useState(true);
  const blocks = useWorldStore(state => state.blocks);
  const fallingBlocks = useWorldStore(state => state.fallingBlocks);
  const droppedItems = useWorldStore(state => state.droppedItems);
  const isInventoryOpen = useWorldStore(state => state.isInventoryOpen);

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

  return (
    <div className="w-full h-screen bg-sky-200 relative">
      {!isLocked && !isInventoryOpen && (
        <div
          onClick={handleStartPlay}
          className={`absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 text-white transition-opacity duration-300 select-none ${
            canLock ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
          }`}
        >
          <h1 className="text-4xl font-bold mb-4">Minecraft Java</h1>
          {canLock ? (
            <p className="mb-2 text-xl animate-pulse">Click anywhere to play</p>
          ) : (
            <p className="mb-2 text-xl text-yellow-400">Please wait...</p>
          )}
          <p className="text-sm text-gray-300">W, A, S, D to move &bull; Space to jump &bull; Esc to pause</p>
        </div>
      )}

      {/* Crosshair UI */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="relative flex items-center justify-center mix-blend-difference">
            <div className="absolute w-4 h-[2px] bg-white opacity-80" />
            <div className="absolute h-4 w-[2px] bg-white opacity-80" />
          </div>
        </div>
      )}

      <Canvas camera={{ position: [0, 5, 0], fov: 75 }}>
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
            createdAt={block.createdAt}
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

        <TargetHighlight />
      </Canvas>
      
      <Hotbar />
      <InventoryUI />
    </div>
  );
}
