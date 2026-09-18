import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { Ray, Box3, Vector3, BoxGeometry } from 'three';
import { Block, BLOCK_PROPERTIES } from '../world/blocks';
import { useWorldStore } from '../store';
import { getCrackTextures } from '../utils/textures';
import { getPlayerAABB, checkIntersection } from './Player';

// Slightly larger than 1x1x1 to perfectly frame the block without z-fighting
const highlightGeo = new BoxGeometry(1.005, 1.005, 1.005);
const damageGeo = new BoxGeometry(1.002, 1.002, 1.002);

export function TargetHighlight() {
  const { camera } = useThree();
  const blocks = useWorldStore(state => state.blocks);
  const removeBlock = useWorldStore(state => state.removeBlock);
  const setIsMining = useWorldStore(state => state.setIsMining);
  const crackTextures = getCrackTextures();

  const playerFeetPosition = useWorldStore(state => state.playerFeetPosition);
  const playerHeight = useWorldStore(state => state.playerHeight);
  const addBlock = useWorldStore(state => state.addBlock);
  
  const hotbar = useWorldStore(state => state.hotbar);
  const selectedHotbarSlot = useWorldStore(state => state.selectedHotbarSlot);
  const offhand = useWorldStore(state => state.offhand);
  const removeInventory = useWorldStore(state => state.removeInventory);
  const removeOffhand = useWorldStore(state => state.removeOffhand);
  const addDroppedItem = useWorldStore(state => state.addDroppedItem);

  // We need refs to store latest player data to avoid rebinding mouse events
  const playerStateRef = useRef({ 
    pos: new Vector3(), 
    height: 1.8, 
    hotbar, 
    selectedHotbarSlot, 
    offhand,
    removeInventory,
    removeOffhand,
    addDroppedItem
  });
  
  // Sync refs when store updates
  useEffect(() => {
    playerStateRef.current.pos.copy(playerFeetPosition);
    playerStateRef.current.height = playerHeight;
    playerStateRef.current.hotbar = hotbar;
    playerStateRef.current.selectedHotbarSlot = selectedHotbarSlot;
    playerStateRef.current.offhand = offhand;
    playerStateRef.current.removeInventory = removeInventory;
    playerStateRef.current.removeOffhand = removeOffhand;
    playerStateRef.current.addDroppedItem = addDroppedItem;
  }, [playerFeetPosition, playerHeight, hotbar, selectedHotbarSlot, offhand, removeInventory, removeOffhand, addDroppedItem]);

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
    const targetBlock = targetData.current.block;
    const targetNormal = targetData.current.normal;
    
    const state = playerStateRef.current;
    let slotToUse = state.hotbar[state.selectedHotbarSlot];
    let isOffhand = false;
    
    if (!slotToUse || slotToUse.type === null || slotToUse.count <= 0) {
      if (state.offhand && state.offhand.type !== null && state.offhand.count > 0) {
        slotToUse = state.offhand;
        isOffhand = true;
      }
    }
    
    if (targetBlock && targetNormal && slotToUse && slotToUse.type !== null && slotToUse.count > 0) {
      const placeX = targetBlock.x + targetNormal.x;
      const placeY = targetBlock.y + targetNormal.y;
      const placeZ = targetBlock.z + targetNormal.z;
      
      // Check collision with player
      const playerAABB = getPlayerAABB(state.pos, state.height);
      
      const blockAABB = {
        minX: placeX - 0.5,
        maxX: placeX + 0.5,
        minY: placeY - 0.5,
        maxY: placeY + 0.5,
        minZ: placeZ - 0.5,
        maxZ: placeZ + 0.5,
      };
      
      // Shrink block AABB slightly to allow placing right up against the player
      blockAABB.minX += 0.001; blockAABB.maxX -= 0.001;
      blockAABB.minY += 0.001; blockAABB.maxY -= 0.001;
      blockAABB.minZ += 0.001; blockAABB.maxZ -= 0.001;
      
      if (!checkIntersection(playerAABB, blockAABB)) {
        addBlock(placeX, placeY, placeZ, slotToUse.type);
        if (isOffhand) {
          state.removeOffhand(1);
          useWorldStore.setState({ lastOffhandPlacedTime: performance.now() });
        } else {
          state.removeInventory(state.selectedHotbarSlot, 1);
          useWorldStore.setState({ lastPlacedTime: performance.now() });
        }
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      
      // Left click starts mining / punching
      if (e.button === 0) {
        mouseState.current.isLeftDown = true;
      }
      
      // Right click starts placing
      if (e.button === 2) {
        mouseState.current.isRightDown = true;
        if (attemptPlaceBlock()) {
          lastPlaceTime.current = performance.now();
        }
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
  }, [setIsMining]);

  useFrame(() => {
    if (!highlightRef.current) return;
    
    const storeState = useWorldStore.getState();
    const isInvOpen = storeState.isInventoryOpen;
    const isPaused = storeState.isPaused;
    if (isInvOpen || isPaused) {
      highlightRef.current.visible = false;
      if (damageRef.current) damageRef.current.visible = false;
      // Reset mining state if we paused or opened inventory while mining
      if (isMiningRef.current) {
        isMiningRef.current = false;
        setIsMining(false);
      }
      return;
    }
    
    const isAllowed = Boolean(document.pointerLockElement || (storeState.isMobile && !isPaused && !isInvOpen));
    const isRightActive = Boolean((mouseState.current.isRightDown && document.pointerLockElement) || (storeState.virtualInputs.place && isAllowed));
    const isLeftActive = Boolean((mouseState.current.isLeftDown && document.pointerLockElement) || (storeState.virtualInputs.mine && isAllowed));
    
    const origin = camera.position;
    const direction = new Vector3();
    camera.getWorldDirection(direction);
    
    const ray = new Ray(origin, direction);
    const box = new Box3();
    const hitPoint = new Vector3();
    
    let minDistance = 4.5; // Max reach: 4.5 blocks
    let targetBlock: Block | null = null;
    let targetNormal: Vector3 | null = null;
    let targetHitPoint: Vector3 | null = null;

    for (const block of blocks) {
      box.setFromCenterAndSize(
        new Vector3(block.x, block.y, block.z),
        new Vector3(1, 1, 1)
      );
      if (ray.intersectBox(box, hitPoint)) {
        const distance = origin.distanceTo(hitPoint);
        if (distance < minDistance) {
          minDistance = distance;
          targetBlock = block;
          targetHitPoint = hitPoint.clone();
          
          // Determine which face was hit
          const localHit = hitPoint.clone().sub(new Vector3(block.x, block.y, block.z));
          const absX = Math.abs(localHit.x);
          const absY = Math.abs(localHit.y);
          const absZ = Math.abs(localHit.z);
          
          const diffX = Math.abs(absX - 0.5);
          const diffY = Math.abs(absY - 0.5);
          const diffZ = Math.abs(absZ - 0.5);
          
          targetNormal = new Vector3(0, 0, 0);
          if (diffX < diffY && diffX < diffZ) targetNormal.x = Math.sign(localHit.x);
          else if (diffY < diffX && diffY < diffZ) targetNormal.y = Math.sign(localHit.y);
          else targetNormal.z = Math.sign(localHit.z);
        }
      }
    }

    targetData.current = {
      block: targetBlock,
      normal: targetNormal,
      hitPosition: targetHitPoint
    };

    // Continuous block placing when right-click / place is held (200ms delay between placements)
    if (isRightActive && isAllowed) {
      const now = performance.now();
      if (now - lastPlaceTime.current >= 200) {
        if (attemptPlaceBlock()) {
          lastPlaceTime.current = now;
        }
      }
    }

    if (targetBlock) {
      highlightRef.current.position.set(targetBlock.x, targetBlock.y, targetBlock.z);
      highlightRef.current.visible = true;
      
      if (damageRef.current) {
        damageRef.current.position.set(targetBlock.x, targetBlock.y, targetBlock.z);
      }

      const currentBlockKey = `${targetBlock.x},${targetBlock.y},${targetBlock.z}`;
      
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
            playerStateRef.current.addDroppedItem(props.drops, [targetBlock.x, targetBlock.y, targetBlock.z], props.dropCount, [vx, vy, vz], 0.1);
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
      breakingState.current.blockKey = null;
      if (damageRef.current) damageRef.current.visible = false;
    }
  });

  return (
    <>
      <lineSegments ref={highlightRef} visible={false}>
        <edgesGeometry args={[highlightGeo]} />
        <lineBasicMaterial ref={materialRef} color="black" opacity={0.4} transparent />
      </lineSegments>
      <mesh ref={damageRef} visible={false}>
        <boxGeometry args={[1.002, 1.002, 1.002]} />
        <meshBasicMaterial ref={damageMaterialRef} transparent depthWrite={false} />
      </mesh>
    </>
  );
}
