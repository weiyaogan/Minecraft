import { Vector3 } from 'three';
import { Block, BlockType, WORLD_BOUNDS } from '../world/blocks';
import { InventorySlot } from '../store';

export const PLAYER_WIDTH = 0.6;
export const PLAYER_HEIGHT = 1.8;
export const SNEAK_HEIGHT = 1.5;

export interface PlayerAABB {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export const getPlayerAABB = (feetPos: Vector3, height: number): PlayerAABB => {
  const halfWidth = PLAYER_WIDTH / 2;
  return {
    minX: feetPos.x - halfWidth,
    maxX: feetPos.x + halfWidth,
    minY: feetPos.y,
    maxY: feetPos.y + height,
    minZ: feetPos.z - halfWidth,
    maxZ: feetPos.z + halfWidth,
  };
};

export const checkIntersection = (
  a: PlayerAABB,
  b: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }
): boolean => {
  return (
    a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minY < b.maxY &&
    a.maxY > b.minY &&
    a.minZ < b.maxZ &&
    a.maxZ > b.minZ
  );
};

export interface IntersectionResult {
  hit: boolean;
  distance: number;
  normal: Vector3;
  hitPoint: Vector3;
}

export interface CandidatePlacement {
  placeX: number;
  placeY: number;
  placeZ: number;
  isValid: boolean;
  rejectReason?: 'no_target' | 'inside_player' | 'occupied' | 'out_of_bounds' | 'no_item';
}

/**
 * Calculates ray-AABB slab intersection with exact face normal.
 * Normals are guaranteed to be one of: (+1,0,0), (-1,0,0), (0,+1,0), (0,-1,0), (0,0,+1), (0,0,-1).
 */
export function intersectBlock(
  origin: Vector3,
  direction: Vector3,
  block: Block,
  maxDistance: number = 4.5
): IntersectionResult {
  const minX = block.x - 0.5;
  const maxX = block.x + 0.5;
  const minY = block.y - 0.5;
  const maxY = block.y + 0.5;
  const minZ = block.z - 0.5;
  const maxZ = block.z + 0.5;

  let tNear = -Infinity;
  let tFar = Infinity;
  let hitNormal = new Vector3(0, 0, 0);

  // X slab
  if (Math.abs(direction.x) < 1e-8) {
    if (origin.x < minX || origin.x > maxX) {
      return { hit: false, distance: Infinity, normal: hitNormal, hitPoint: new Vector3() };
    }
  } else {
    let t1 = (minX - origin.x) / direction.x;
    let t2 = (maxX - origin.x) / direction.x;
    const signX = direction.x > 0 ? -1 : 1;
    if (t1 > t2) {
      const temp = t1;
      t1 = t2;
      t2 = temp;
    }
    if (t1 > tNear) {
      tNear = t1;
      hitNormal.set(signX, 0, 0);
    }
    if (t2 < tFar) tFar = t2;
    if (tNear > tFar || tFar < 0) {
      return { hit: false, distance: Infinity, normal: hitNormal, hitPoint: new Vector3() };
    }
  }

  // Y slab
  if (Math.abs(direction.y) < 1e-8) {
    if (origin.y < minY || origin.y > maxY) {
      return { hit: false, distance: Infinity, normal: hitNormal, hitPoint: new Vector3() };
    }
  } else {
    let t1 = (minY - origin.y) / direction.y;
    let t2 = (maxY - origin.y) / direction.y;
    const signY = direction.y > 0 ? -1 : 1;
    if (t1 > t2) {
      const temp = t1;
      t1 = t2;
      t2 = temp;
    }
    if (t1 > tNear) {
      tNear = t1;
      hitNormal.set(0, signY, 0);
    }
    if (t2 < tFar) tFar = t2;
    if (tNear > tFar || tFar < 0) {
      return { hit: false, distance: Infinity, normal: hitNormal, hitPoint: new Vector3() };
    }
  }

  // Z slab
  if (Math.abs(direction.z) < 1e-8) {
    if (origin.z < minZ || origin.z > maxZ) {
      return { hit: false, distance: Infinity, normal: hitNormal, hitPoint: new Vector3() };
    }
  } else {
    let t1 = (minZ - origin.z) / direction.z;
    let t2 = (maxZ - origin.z) / direction.z;
    const signZ = direction.z > 0 ? -1 : 1;
    if (t1 > t2) {
      const temp = t1;
      t1 = t2;
      t2 = temp;
    }
    if (t1 > tNear) {
      tNear = t1;
      hitNormal.set(0, 0, signZ);
    }
    if (t2 < tFar) tFar = t2;
    if (tNear > tFar || tFar < 0) {
      return { hit: false, distance: Infinity, normal: hitNormal, hitPoint: new Vector3() };
    }
  }

  const distance = tNear > 0 ? tNear : tFar;
  if (distance < 0 || distance > maxDistance) {
    return { hit: false, distance: Infinity, normal: hitNormal, hitPoint: new Vector3() };
  }

  const hitPoint = new Vector3(
    origin.x + direction.x * distance,
    origin.y + direction.y * distance,
    origin.z + direction.z * distance
  );

  return { hit: true, distance, normal: hitNormal, hitPoint };
}

/**
 * Finds the closest block intersected by the crosshair ray within maxDistance.
 */
export function findTargetBlock(
  origin: Vector3,
  direction: Vector3,
  blocks: Block[],
  maxDistance: number = 4.5
): { block: Block | null; normal: Vector3 | null; hitPoint: Vector3 | null; distance: number } {
  let closestDist = maxDistance;
  let targetBlock: Block | null = null;
  let targetNormal: Vector3 | null = null;
  let targetHitPoint: Vector3 | null = null;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    // Fast rough distance check before slab computation
    const dx = block.x - origin.x;
    const dy = block.y - origin.y;
    const dz = block.z - origin.z;
    if (dx * dx + dy * dy + dz * dz > (maxDistance + 1) * (maxDistance + 1)) {
      continue;
    }

    const res = intersectBlock(origin, direction, block, closestDist);
    if (res.hit && res.distance < closestDist) {
      closestDist = res.distance;
      targetBlock = block;
      targetNormal = res.normal;
      targetHitPoint = res.hitPoint;
    }
  }

  return {
    block: targetBlock,
    normal: targetNormal,
    hitPoint: targetHitPoint,
    distance: closestDist,
  };
}

/**
 * Computes candidate placement coordinates aligned to the integer voxel grid.
 */
export function getPlacementCoordinates(targetBlock: Block, normal: Vector3) {
  return {
    placeX: Math.round(targetBlock.x + normal.x),
    placeY: Math.round(targetBlock.y + normal.y),
    placeZ: Math.round(targetBlock.z + normal.z),
  };
}

/**
 * Validates whether placing a block at (placeX, placeY, placeZ) is permissible.
 */
export function validateBlockPlacement(
  placeX: number,
  placeY: number,
  placeZ: number,
  playerPos: Vector3,
  playerHeight: number,
  blocks: Block[],
  slotToUse: InventorySlot | null
): { valid: boolean; reason?: 'no_item' | 'out_of_bounds' | 'occupied' | 'inside_player' } {
  // 1. Check item availability
  if (!slotToUse || !slotToUse.type || slotToUse.count <= 0) {
    return { valid: false, reason: 'no_item' };
  }

  // 2. Check world boundaries
  if (
    placeX < WORLD_BOUNDS.minX ||
    placeX > WORLD_BOUNDS.maxX ||
    placeY < WORLD_BOUNDS.minY ||
    placeY > WORLD_BOUNDS.maxY ||
    placeZ < WORLD_BOUNDS.minZ ||
    placeZ > WORLD_BOUNDS.maxZ
  ) {
    return { valid: false, reason: 'out_of_bounds' };
  }

  // 3. Check if cell is already occupied by an existing solid block
  const isOccupied = blocks.some(
    (b) => b.x === placeX && b.y === placeY && b.z === placeZ
  );
  if (isOccupied) {
    return { valid: false, reason: 'occupied' };
  }

  // 4. Check collision with player bounding box (AABB)
  const playerAABB = getPlayerAABB(playerPos, playerHeight);
  const blockAABB = {
    minX: placeX - 0.5 + 0.005,
    maxX: placeX + 0.5 - 0.005,
    minY: placeY - 0.5 + 0.005,
    maxY: placeY + 0.5 - 0.005,
    minZ: placeZ - 0.5 + 0.005,
    maxZ: placeZ + 0.5 - 0.005,
  };

  if (checkIntersection(playerAABB, blockAABB)) {
    return { valid: false, reason: 'inside_player' };
  }

  return { valid: true };
}
