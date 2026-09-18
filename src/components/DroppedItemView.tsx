import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DroppedItem, useWorldStore } from '../store';
import { grassTopTexture, dirtTexture, grassSideTexture, stoneTexture, bedrockTexture } from '../world/textures';
import { playPickupSound } from '../utils/audio';

interface Props {
  item: DroppedItem;
}

const itemWidth = 0.25;
const itemHeight = 0.25;

export const droppedItemPhysicsData = new Map<string, { pos: THREE.Vector3, count: number, age: number, isDead: boolean, isAbsorbing: boolean, type: string }>();

const getItemAABB = (pos: THREE.Vector3) => ({
  minX: pos.x - itemWidth / 2,
  maxX: pos.x + itemWidth / 2,
  minY: pos.y,
  maxY: pos.y + itemHeight,
  minZ: pos.z - itemWidth / 2,
  maxZ: pos.z + itemWidth / 2,
});

const checkIntersection = (a: any, b: any) => {
  return (
    a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minY < b.maxY &&
    a.maxY > b.minY &&
    a.minZ < b.maxZ &&
    a.maxZ > b.minZ
  );
};

export function DroppedItemView({ item }: Props) {
  const meshRef = useRef<THREE.Group>(null);
  const visualMeshRef = useRef<THREE.Mesh>(null);
  
  const addInventory = useWorldStore(state => state.addInventory);
  const removeDroppedItem = useWorldStore(state => state.removeDroppedItem);
  const updateDroppedItem = useWorldStore(state => state.updateDroppedItem);
  const playerFeetPosition = useWorldStore(state => state.playerFeetPosition);
  const playerHeight = useWorldStore(state => state.playerHeight);
  
  const isAbsorbing = useRef(false);
  const isDead = useRef(false);
  const currentPos = useRef(new THREE.Vector3(...item.position));
  const velocity = useRef(new THREE.Vector3(...(item.velocity || [0, 2, 0])));
  
  const tickAccumulator = useRef(0);
  const pickupDelay = useRef(item.pickupDelay ?? 0.5);
  const age = useRef(0);
  
  const bobOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useEffect(() => {
    droppedItemPhysicsData.set(item.id, { pos: currentPos.current, count: item.count, age: age.current, isDead: false, isAbsorbing: false, type: item.type });
    return () => {
      droppedItemPhysicsData.delete(item.id);
    };
  }, [item.id, item.count, item.type]);

  useFrame((_, delta) => {
    if (!meshRef.current || !visualMeshRef.current || isDead.current) return;
    
    // Decrement pickup delay (seconds)
    if (pickupDelay.current > 0) {
      pickupDelay.current = Math.max(0, pickupDelay.current - delta);
    }

    // Ticking logic
    tickAccumulator.current += delta;
    while (tickAccumulator.current >= 0.05) { // 20 TPS
      tickAccumulator.current -= 0.05;
      age.current++;
      
      const myData = droppedItemPhysicsData.get(item.id);
      if (myData) {
        myData.age = age.current;
        myData.count = item.count;
        myData.isAbsorbing = isAbsorbing.current;
      }
      
      // Merging check (every 5 ticks, only if neither item is being collected)
      if (age.current % 5 === 0 && item.count < 64 && !isAbsorbing.current) {
        for (const [otherId, otherData] of droppedItemPhysicsData.entries()) {
          if (otherId !== item.id && !otherData.isDead && !otherData.isAbsorbing && otherData.type === item.type) {
             // Only older items absorb newer ones to avoid circular merge loops
             if (age.current > otherData.age || (age.current === otherData.age && item.id > otherId)) {
               const dist = currentPos.current.distanceTo(otherData.pos);
               if (dist < 0.8) {
                 const space = 64 - item.count;
                 if (space > 0) {
                   const toTake = Math.min(space, otherData.count);
                   updateDroppedItem(item.id, item.count + toTake);
                   otherData.isDead = true; // Mark as dead so it doesn't get picked up elsewhere
                   if (toTake === otherData.count) {
                      removeDroppedItem(otherId);
                   } else {
                      updateDroppedItem(otherId, otherData.count - toTake);
                      otherData.isDead = false;
                   }
                 }
               }
             }
          }
        }
      }
    }

    if (age.current >= 6000) {
      if (!isDead.current) {
        isDead.current = true;
        removeDroppedItem(item.id);
      }
      return;
    }

    const myData = droppedItemPhysicsData.get(item.id);
    if (myData && myData.isDead) return;

    const time = performance.now() / 1000;
    visualMeshRef.current.rotation.y += delta * 1.5;

    // Physics
    const blocks = useWorldStore.getState().blocks;
    const EPSILON = 0.001;
    
    // Gravity
    velocity.current.y -= 15 * delta;
    
    // Friction (in air and ground)
    velocity.current.x *= Math.pow(0.5, delta * 2);
    velocity.current.z *= Math.pow(0.5, delta * 2);

    let isGrounded = false;
    let dx = velocity.current.x * delta;
    let dy = velocity.current.y * delta;
    let dz = velocity.current.z * delta;

    // Y collision first
    currentPos.current.y += dy;
    for (const b of blocks) {
      const bAABB = { minX: b.x - 0.5, maxX: b.x + 0.5, minY: b.y - 0.5, maxY: b.y + 0.5, minZ: b.z - 0.5, maxZ: b.z + 0.5 };
      const iAABB = getItemAABB(currentPos.current);
      iAABB.minX += EPSILON; iAABB.maxX -= EPSILON;
      iAABB.minZ += EPSILON; iAABB.maxZ -= EPSILON;
      if (checkIntersection(iAABB, bAABB)) {
        if (dy > 0) currentPos.current.y = bAABB.minY - itemHeight;
        else if (dy < 0) {
          currentPos.current.y = bAABB.maxY;
          isGrounded = true;
        }
        velocity.current.y = 0;
      }
    }

    // X collision
    currentPos.current.x += dx;
    for (const b of blocks) {
      const bAABB = { minX: b.x - 0.5, maxX: b.x + 0.5, minY: b.y - 0.5, maxY: b.y + 0.5, minZ: b.z - 0.5, maxZ: b.z + 0.5 };
      const iAABB = getItemAABB(currentPos.current);
      iAABB.minY += EPSILON; iAABB.maxY -= EPSILON;
      iAABB.minZ += EPSILON; iAABB.maxZ -= EPSILON;
      if (checkIntersection(iAABB, bAABB)) {
        if (dx > 0) currentPos.current.x = bAABB.minX - itemWidth / 2;
        else if (dx < 0) currentPos.current.x = bAABB.maxX + itemWidth / 2;
        velocity.current.x = 0;
      }
    }

    // Z collision
    currentPos.current.z += dz;
    for (const b of blocks) {
      const bAABB = { minX: b.x - 0.5, maxX: b.x + 0.5, minY: b.y - 0.5, maxY: b.y + 0.5, minZ: b.z - 0.5, maxZ: b.z + 0.5 };
      const iAABB = getItemAABB(currentPos.current);
      iAABB.minX += EPSILON; iAABB.maxX -= EPSILON;
      iAABB.minY += EPSILON; iAABB.maxY -= EPSILON;
      if (checkIntersection(iAABB, bAABB)) {
        if (dz > 0) currentPos.current.z = bAABB.minZ - itemWidth / 2;
        else if (dz < 0) currentPos.current.z = bAABB.maxZ + itemWidth / 2;
        velocity.current.z = 0;
      }
    }

    if (isGrounded) {
      velocity.current.x *= Math.pow(0.5, delta * 15); // stronger friction on ground
      velocity.current.z *= Math.pow(0.5, delta * 15);
    }

    if (currentPos.current.y < -25 && !isDead.current) {
      isDead.current = true;
      removeDroppedItem(item.id);
      return;
    }

    // Pickup Check
    // Both conditions must be met:
    // 1. The pickup delay has expired (pickupDelay <= 0)
    // 2. The player is within the 1.5-block 3D distance radius
    if (pickupDelay.current <= 0 && !isAbsorbing.current && !isDead.current) {
      const playerCenter = new THREE.Vector3(
        playerFeetPosition.x,
        playerFeetPosition.y + playerHeight * 0.5,
        playerFeetPosition.z
      );
      const itemCenter = new THREE.Vector3(
        currentPos.current.x,
        currentPos.current.y + itemHeight * 0.5,
        currentPos.current.z
      );
      
      const distance = itemCenter.distanceTo(playerCenter);
      if (distance <= 1.5) {
        isAbsorbing.current = true;
      }
    }

    if (isAbsorbing.current && !isDead.current) {
      const targetPos = playerFeetPosition.clone().add(new THREE.Vector3(0, playerHeight * 0.5, 0));
      currentPos.current.lerp(targetPos, delta * 14);
      
      // Decrease scale smoothly to simulate absorption into player
      visualMeshRef.current.scale.lerp(new THREE.Vector3(0.02, 0.02, 0.02), delta * 14);
      
      if (currentPos.current.distanceTo(targetPos) < 0.25) {
        const remaining = addInventory(item.type, item.count);
        if (remaining === 0) {
          isDead.current = true;
          removeDroppedItem(item.id);
          playPickupSound();
          return;
        } else if (remaining < item.count) {
          updateDroppedItem(item.id, remaining);
          playPickupSound();
          isAbsorbing.current = false;
          visualMeshRef.current.scale.set(0.20, 0.20, 0.20);
        } else {
          isAbsorbing.current = false;
          visualMeshRef.current.scale.set(0.20, 0.20, 0.20);
        }
      }
    }

    // Update Visuals
    meshRef.current.position.copy(currentPos.current);
    if (!isAbsorbing.current) {
      visualMeshRef.current.position.y = itemHeight / 2 + Math.sin(time * 3 + bobOffset) * 0.1;
    }
  });

  const getMaterial = () => {
    if (item.type === 'stone') return <meshStandardMaterial map={stoneTexture} />;
    if (item.type === 'sand') return <meshStandardMaterial map={dirtTexture} color="#e3dbb0" />;
    if (item.type === 'dirt') return <meshStandardMaterial map={dirtTexture} />;
    if (item.type === 'bedrock') return <meshStandardMaterial map={bedrockTexture} />;
    if (item.type === 'grass') {
      return (
        <>
          <meshStandardMaterial attach="material-0" map={grassSideTexture} />
          <meshStandardMaterial attach="material-1" map={grassSideTexture} />
          <meshStandardMaterial attach="material-2" map={grassTopTexture} color="#55aa55" />
          <meshStandardMaterial attach="material-3" map={dirtTexture} />
          <meshStandardMaterial attach="material-4" map={grassSideTexture} />
          <meshStandardMaterial attach="material-5" map={grassSideTexture} />
        </>
      );
    }
    return null;
  };

  return (
    <group ref={meshRef}>
      <mesh ref={visualMeshRef} scale={[0.20, 0.20, 0.20]}>
        <boxGeometry args={[1, 1, 1]} />
        {getMaterial()}
      </mesh>
    </group>
  );
}
