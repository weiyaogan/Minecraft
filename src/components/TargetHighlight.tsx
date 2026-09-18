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

// Slightly larger than 1x1x1 to perfectly frame the block without z-fighting
const highlightGeo = new BoxGeometry(1.005, 1.005, 1.005);
const placementOutlineGeo = new BoxGeometry(1.004, 1.004, 1.004);
const damageGeo = new BoxGeometry(1.002, 1.002, 1.002);

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

  // Visual feedback preview for adjacent placement cell
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const placementOutlineRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const placementGhostRef = useRef<any>(null);

  const mouseState = useRef({ isLeftDown: false, isRightDown: false });
  const isMiningRef = useRef(false);
  const lastPlaceTime = useRef(0);

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

    if (!validation.valid) {
      return false;
    }

    // Validation passed: add block to world and consume exactly 1 item
    addBlock(placeX, placeY, placeZ, slotToUse.type);
    lastPlaceTime.current = now;

    if (isOffhand) {
      storeState.removeOffhand(1);
    } else {
      storeState.removeInventory(storeState.selectedHotbarSlot, 1);
    }

    return true;
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
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
      if (placementOutlineRef.current) placementOutlineRef.current.visible = false;
      if (placementGhostRef.current) placementGhostRef.current.visible = false;
      if (damageRef.current) damageRef.current.visible = false;

      if (isMiningRef.current) {
        isMiningRef.current = false;
        setIsMining(false);
      }
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
      highlightRef.current.position.set(targetBlock.x, targetBlock.y, targetBlock.z);
      highlightRef.current.visible = true;

      if (damageRef.current) {
        damageRef.current.position.set(targetBlock.x, targetBlock.y, targetBlock.z);
      }

      // Visual feedback preview for adjacent candidate placement cell
      let slotToUse = storeState.hotbar[storeState.selectedHotbarSlot];
      if (!slotToUse || slotToUse.type === null || slotToUse.count <= 0) {
        if (storeState.offhand && storeState.offhand.type !== null && storeState.offhand.count > 0) {
          slotToUse = storeState.offhand;
        }
      }

      const { placeX, placeY, placeZ } = getPlacementCoordinates(targetBlock, targetNormal);
      const validation = validateBlockPlacement(
        placeX,
        placeY,
        placeZ,
        storeState.playerFeetPosition,
        storeState.playerHeight,
        storeState.blocks,
        slotToUse
      );

      if (validation.valid && isAllowed && !isMiningRef.current) {
        if (placementOutlineRef.current) {
          placementOutlineRef.current.position.set(placeX, placeY, placeZ);
          placementOutlineRef.current.visible = true;
        }
        if (placementGhostRef.current) {
          placementGhostRef.current.position.set(placeX, placeY, placeZ);
          placementGhostRef.current.visible = true;
        }
      } else {
        if (placementOutlineRef.current) placementOutlineRef.current.visible = false;
        if (placementGhostRef.current) placementGhostRef.current.visible = false;
      }

      const currentBlockKey = `${targetBlock.x},${targetBlock.y},${targetBlock.z}`;

      // Mining logic
      if (isLeftActive && isAllowed) {
        if (!isMiningRef.current) {
          isMiningRef.current = true;
          setIsMining(true);
        }

        if (breakingState.current.blockKey !== currentBlockKey) {
          breakingState.current.blockKey = currentBlockKey;
          breakingState.current.startTime = performance.now();
        }

        const props = BLOCK_PROPERTIES[targetBlock.type];
        const breakTime = props.breakTime;
        const elapsed = (performance.now() - breakingState.current.startTime) / 1000;
        const progress = Math.min(elapsed / breakTime, 1);

        // Visual feedback stages (0 to 9)
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

        if (elapsed >= breakTime) {
          removeBlock(targetBlock.x, targetBlock.y, targetBlock.z);
          breakingState.current.blockKey = null;
          if (damageRef.current) damageRef.current.visible = false;

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
        if (isMiningRef.current) {
          isMiningRef.current = false;
          setIsMining(false);
        }
        breakingState.current.blockKey = null;
        if (damageRef.current) damageRef.current.visible = false;
      }
    } else {
      if (isMiningRef.current) {
        isMiningRef.current = false;
        setIsMining(false);
      }
      highlightRef.current.visible = false;
      if (placementOutlineRef.current) placementOutlineRef.current.visible = false;
      if (placementGhostRef.current) placementGhostRef.current.visible = false;
      breakingState.current.blockKey = null;
      if (damageRef.current) damageRef.current.visible = false;
    }
  });

  return (
    <>
      {/* Targeted block outline */}
      <lineSegments ref={highlightRef} visible={false}>
        <edgesGeometry args={[highlightGeo]} />
        <lineBasicMaterial ref={materialRef} color="black" opacity={0.4} transparent />
      </lineSegments>

      {/* Target adjacent placement cell preview / highlight */}
      <lineSegments ref={placementOutlineRef} visible={false}>
        <edgesGeometry args={[placementOutlineGeo]} />
        <lineBasicMaterial color="#ffffff" opacity={0.5} transparent />
      </lineSegments>
      <mesh ref={placementGhostRef} visible={false}>
        <boxGeometry args={[0.998, 0.998, 0.998]} />
        <meshBasicMaterial color="#ffffff" opacity={0.12} transparent depthWrite={false} />
      </mesh>

      {/* Mining break cracks */}
      <mesh ref={damageRef} visible={false}>
        <boxGeometry args={[damageGeo.parameters.width, damageGeo.parameters.height, damageGeo.parameters.depth]} />
        <meshBasicMaterial ref={damageMaterialRef} transparent depthWrite={false} />
      </mesh>
    </>
  );
}
