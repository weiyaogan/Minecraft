import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { Vector3, BoxGeometry } from 'three';
import { Block, BLOCK_PROPERTIES } from '../world/blocks';
import { useWorldStore } from '../store';
import { getCrackTextures } from '../utils/textures';
import {
  findTargetBlock,
  getPlacementCoordinates,
  validateBlockPlacement,
} from '../utils/blockPlacement';
import { playDigSound, playBreakSound, playPlaceSound, initAudio } from '../utils/audio';

// 1.002 frames the voxel boundary crisply and tightly without z-fighting
const highlightGeo = new BoxGeometry(1.002, 1.002, 1.002);
const damageGeo = new BoxGeometry(1.0025, 1.0025, 1.0025);

export function TargetHighlight() {
  const { camera } = useThree();
  const blocks = useWorldStore((state) => state.blocks);
  const removeBlock = useWorldStore((state) => state.removeBlock);
  const setIsMining = useWorldStore((state) => state.setIsMining);
  const addBlock = useWorldStore((state) => state.addBlock);
  const crackTextures = getCrackTextures();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const highlightRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const materialRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const damageRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const damageMaterialRef = useRef<any>(null);

  const mouseState = useRef({ isLeftDown: false, isRightDown: false });
  const isMiningRef = useRef(false);
  const lastPlaceTime = useRef(0);
  const lastDigSoundTime = useRef(0);

  const targetData = useRef<{
    block: Block | null;
    normal: Vector3 | null;
    hitPosition: Vector3 | null;
  }>({ block: null, normal: null, hitPosition: null });

  const breakingState = useRef<{
    blockKey: string | null;
    startTime: number;
  }>({ blockKey: null, startTime: 0 });

  const attemptPlaceBlock = () => {
    initAudio();
    const storeState = useWorldStore.getState();
    if (storeState.isPaused || storeState.isInventoryOpen) return false;

    // Prevent duplicate placements in rapid succession (minimum 180ms cooldown)
    const now = performance.now();
    if (now - lastPlaceTime.current < 180) {
      return false;
    }

    const targetBlock = targetData.current.block;
    const targetNormal = targetData.current.normal;
    if (!targetBlock || !targetNormal) {
      return false;
    }

    // Determine hand slot (main hand first, offhand fallback)
    let slotToUse = storeState.hotbar[storeState.selectedHotbarSlot];
    let isOffhand = false;
    if (!slotToUse || slotToUse.type === null || slotToUse.count <= 0) {
      if (storeState.offhand && storeState.offhand.type !== null && storeState.offhand.count > 0) {
        slotToUse = storeState.offhand;
        isOffhand = true;
      }
    }

    if (!slotToUse || slotToUse.type === null || slotToUse.count <= 0) {
      return false;
    }

    // Determine exact integer grid coordinates on the targeted face
    const { placeX, placeY, placeZ } = getPlacementCoordinates(targetBlock, targetNormal);

    // Validate placement against boundaries, solid blocks, and player collision body
    const validation = validateBlockPlacement(
      placeX,
      placeY,
      placeZ,
      storeState.playerFeetPosition,
      storeState.playerHeight,
      storeState.blocks,
      slotToUse
    );

    // REJECTED: Return immediately without consuming item, modifying world, or playing sound
    if (!validation.valid) {
      return false;
    }

    // VALID: Add block to world and consume exactly 1 item
    addBlock(placeX, placeY, placeZ, slotToUse.type);
    lastPlaceTime.current = now;

    if (isOffhand) {
      storeState.removeOffhand(1);
    } else {
      storeState.removeInventory(storeState.selectedHotbarSlot, 1);
    }

    // Play crisp placement sound on successful placement
    playPlaceSound(slotToUse.type);

    return true;
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      initAudio();
      if (!document.pointerLockElement) return;

      // Left click starts mining / punching
      if (e.button === 0) {
        mouseState.current.isLeftDown = true;
      }

      // Right click places block
      if (e.button === 2) {
        mouseState.current.isRightDown = true;
        attemptPlaceBlock();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseState.current.isLeftDown = false;
      }
      if (e.button === 2) {
        mouseState.current.isRightDown = false;
      }
    };

    const handlePointerLockChange = () => {
      const lockEl =
        document.pointerLockElement ||
        (document as unknown as { webkitPointerLockElement?: Element }).webkitPointerLockElement ||
        (document as unknown as { mozPointerLockElement?: Element }).mozPointerLockElement;
      if (!lockEl) {
        mouseState.current.isLeftDown = false;
        mouseState.current.isRightDown = false;
      }
    };

    const handleBlur = () => {
      mouseState.current.isLeftDown = false;
      mouseState.current.isRightDown = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleMobilePlaceBlock = () => {
      attemptPlaceBlock();
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mobile-place-block', handleMobilePlaceBlock);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('webkitpointerlockchange', handlePointerLockChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mobile-place-block', handleMobilePlaceBlock);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('webkitpointerlockchange', handlePointerLockChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useFrame(() => {
    if (!highlightRef.current) return;

    const storeState = useWorldStore.getState();
    const isInvOpen = storeState.isInventoryOpen;
    const isPaused = storeState.isPaused;

    if (isInvOpen || isPaused) {
      highlightRef.current.visible = false;
      if (damageRef.current) damageRef.current.visible = false;

      if (isMiningRef.current) {
        isMiningRef.current = false;
        setIsMining(false);
      }
      breakingState.current.blockKey = null;
      return;
    }

    const isAllowed = Boolean(
      document.pointerLockElement || (storeState.isMobile && !isPaused && !isInvOpen)
    );
    const isRightActive = Boolean(
      (mouseState.current.isRightDown && document.pointerLockElement) ||
        (storeState.virtualInputs.place && isAllowed)
    );
    const isLeftActive = Boolean(
      (mouseState.current.isLeftDown && document.pointerLockElement) ||
        (storeState.virtualInputs.mine && isAllowed)
    );

    const origin = camera.position;
    const direction = new Vector3();
    camera.getWorldDirection(direction);

    // Find closest targeted block and exact hit face normal via slab intersection
    const hitResult = findTargetBlock(origin, direction, blocks, 4.5);
    const targetBlock = hitResult.block;
    const targetNormal = hitResult.normal;
    const targetHitPoint = hitResult.hitPoint;

    targetData.current = {
      block: targetBlock,
      normal: targetNormal,
      hitPosition: targetHitPoint,
    };

    // Continuous block placing when right-click / place is held (repeat cooldown >= 200ms)
    if (isRightActive && isAllowed) {
      const now = performance.now();
      if (now - lastPlaceTime.current >= 200) {
        attemptPlaceBlock();
      }
    }

    if (targetBlock && targetNormal) {
      // Crisp targeted block outline aligned to voxel grid boundaries
      highlightRef.current.position.set(targetBlock.x, targetBlock.y, targetBlock.z);
      highlightRef.current.visible = true;

      if (damageRef.current) {
        damageRef.current.position.set(targetBlock.x, targetBlock.y, targetBlock.z);
      }

      const currentBlockKey = `${targetBlock.x},${targetBlock.y},${targetBlock.z}`;

      // Reset mining progress if target block changed
      if (breakingState.current.blockKey !== currentBlockKey) {
        breakingState.current.blockKey = currentBlockKey;
        breakingState.current.startTime = performance.now();
      }

      // Mining logic
      if (isLeftActive && isAllowed) {
        if (!isMiningRef.current) {
          isMiningRef.current = true;
          setIsMining(true);
        }

        const now = performance.now();
        const props = BLOCK_PROPERTIES[targetBlock.type];
        const breakTime = props.breakTime;
        const elapsed = (now - breakingState.current.startTime) / 1000;
        const progress = Math.min(elapsed / breakTime, 1);

        // Play subtle digging sound and spawn face-aligned mining particles at cadence (~210ms)
        if (now - lastDigSoundTime.current >= 210) {
          playDigSound(targetBlock.type);
          lastDigSoundTime.current = now;

          // Dispatch mining particles on the targeted face with progress scaling
          window.dispatchEvent(
            new CustomEvent('block-mining-particles', {
              detail: {
                x: targetBlock.x,
                y: targetBlock.y,
                z: targetBlock.z,
                normal: [targetNormal.x, targetNormal.y, targetNormal.z],
                type: targetBlock.type,
                progress,
              },
            })
          );
        }

        // Visual crack stages (0 to 9)
        const stage = Math.floor(progress * 10);
        if (damageMaterialRef.current) {
          if (stage > 0) {
            const clampedStage = Math.min(stage - 1, 9);
            damageRef.current.visible = true;
            damageMaterialRef.current.map = crackTextures[clampedStage];
            damageMaterialRef.current.needsUpdate = true;
          } else {
            damageRef.current.visible = false;
          }
        }

        // Block broken
        if (elapsed >= breakTime) {
          // Play distinct break sound
          playBreakSound(targetBlock.type);

          // Spawn subtle voxel break particles
          window.dispatchEvent(
            new CustomEvent('block-break-particles', {
              detail: {
                x: targetBlock.x,
                y: targetBlock.y,
                z: targetBlock.z,
                type: targetBlock.type,
              },
            })
          );

          removeBlock(targetBlock.x, targetBlock.y, targetBlock.z);
          breakingState.current.blockKey = null;
          if (damageRef.current) damageRef.current.visible = false;

          // Spawn dropped-item entity independently
          const canHarvest = !props.requiresTool;
          if (canHarvest && props.drops) {
            const vx = (Math.random() - 0.5) * 1.5;
            const vy = Math.random() * 1.5 + 2.0; // slight upward pop
            const vz = (Math.random() - 0.5) * 1.5;
            storeState.addDroppedItem(
              props.drops,
              [targetBlock.x, targetBlock.y, targetBlock.z],
              props.dropCount,
              [vx, vy, vz],
              0.1
            );
          }
        }
      } else {
        // Released mining button: reset crack progress and mining state immediately
        if (isMiningRef.current) {
          isMiningRef.current = false;
          setIsMining(false);
        }
        breakingState.current.blockKey = null;
        if (damageRef.current) damageRef.current.visible = false;
      }
    } else {
      // Looking away / no block targeted: hide outline and cracks immediately
      if (isMiningRef.current) {
        isMiningRef.current = false;
        setIsMining(false);
      }
      highlightRef.current.visible = false;
      breakingState.current.blockKey = null;
      if (damageRef.current) damageRef.current.visible = false;
    }
  });

  return (
    <>
      {/* Targeted block outline: thin, crisp, high-contrast voxel frame */}
      <lineSegments ref={highlightRef} visible={false}>
        <edgesGeometry args={[highlightGeo]} />
        <lineBasicMaterial
          ref={materialRef}
          color="#000000"
          opacity={0.65}
          transparent={true}
          depthWrite={false}
          depthTest={true}
        />
      </lineSegments>

      {/* Mining break cracks */}
      <mesh ref={damageRef} visible={false}>
        <boxGeometry
          args={[
            damageGeo.parameters.width,
            damageGeo.parameters.height,
            damageGeo.parameters.depth,
          ]}
        />
        <meshBasicMaterial ref={damageMaterialRef} transparent depthWrite={false} />
      </mesh>
    </>
  );
}
