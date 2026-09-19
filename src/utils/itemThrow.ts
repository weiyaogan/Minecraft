import { Block } from '../world/blocks';

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface ItemSpawnAndVelocity {
  position: [number, number, number];
  velocity: [number, number, number];
}

/**
 * Checks if a dropped item bounding box intersects any solid block.
 * A dropped item bounding box is approximately 0.24 x 0.24 x 0.24 centered at (x, y + 0.12, z).
 * Blocks are unit cubes centered at (b.x, b.y, b.z) from -0.5 to +0.5.
 */
export function isItemInSolidBlock(
  x: number,
  y: number,
  z: number,
  blocks: Block[]
): boolean {
  const halfW = 0.12;
  const itemMinX = x - halfW;
  const itemMaxX = x + halfW;
  const itemMinY = y;
  const itemMaxY = y + 0.24;
  const itemMinZ = z - halfW;
  const itemMaxZ = z + halfW;

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (
      itemMaxX > b.x - 0.5 &&
      itemMinX < b.x + 0.5 &&
      itemMaxY > b.y - 0.5 &&
      itemMinY < b.y + 0.5 &&
      itemMaxZ > b.z - 0.5 &&
      itemMinZ < b.z + 0.5
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Calculates authentic Minecraft item throw spawn position and initial velocity.
 * 
 * - Spawns near the player's camera/eye position, slightly in front of the head (not waist/feet).
 * - Adapts to player's full 3D look direction (including pitch up/down).
 * - Avoids spawning inside walls or solid blocks.
 * - Adds natural forward impulse with upward component, preserving gravity and collision.
 */
export function computeItemThrowSpawnAndVelocity(
  playerFeetPosition: Vector3Like,
  playerHeight: number,
  blocks: Block[],
  cameraPosOrDir?: Vector3Like,
  optionalCameraDir?: Vector3Like
): ItemSpawnAndVelocity {
  const defaultEyeHeight = playerHeight < 1.65 ? 1.35 : 1.62;
  const fallbackEyePos: Vector3Like = {
    x: playerFeetPosition.x,
    y: playerFeetPosition.y + defaultEyeHeight,
    z: playerFeetPosition.z,
  };

  let eyePos: Vector3Like;
  let lookDir: Vector3Like;

  if (optionalCameraDir) {
    // Both camera position and look direction provided
    eyePos = {
      x: cameraPosOrDir ? cameraPosOrDir.x : fallbackEyePos.x,
      // Ensure eye Y is at head level and not at lower body/feet
      y: cameraPosOrDir ? Math.max(cameraPosOrDir.y, playerFeetPosition.y + 1.2) : fallbackEyePos.y,
      z: cameraPosOrDir ? cameraPosOrDir.z : fallbackEyePos.z,
    };
    lookDir = {
      x: optionalCameraDir.x,
      y: optionalCameraDir.y,
      z: optionalCameraDir.z,
    };
  } else if (cameraPosOrDir) {
    // Only one vector provided: determine whether it is a direction vector or position vector
    const len = Math.hypot(cameraPosOrDir.x, cameraPosOrDir.y, cameraPosOrDir.z);
    // Normalized direction vectors have length close to 1
    const isLikelyDirection = len > 0.001 && Math.abs(len - 1.0) < 0.25;

    if (isLikelyDirection) {
      lookDir = { x: cameraPosOrDir.x, y: cameraPosOrDir.y, z: cameraPosOrDir.z };
      eyePos = fallbackEyePos;
    } else {
      eyePos = {
        x: cameraPosOrDir.x,
        y: Math.max(cameraPosOrDir.y, playerFeetPosition.y + 1.2),
        z: cameraPosOrDir.z,
      };
      lookDir = { x: 0, y: 0, z: -1 };
    }
  } else {
    eyePos = fallbackEyePos;
    lookDir = { x: 0, y: 0, z: -1 };
  }

  // Normalize look direction
  const dirLen = Math.hypot(lookDir.x, lookDir.y, lookDir.z);
  if (dirLen > 0.0001) {
    lookDir.x /= dirLen;
    lookDir.y /= dirLen;
    lookDir.z /= dirLen;
  } else {
    lookDir.x = 0;
    lookDir.y = 0;
    lookDir.z = -1;
  }

  // Horizontal right vector for lateral offset fallback
  const hLen = Math.hypot(lookDir.x, lookDir.z);
  let rx = 1;
  let rz = 0;
  if (hLen > 0.001) {
    rx = -lookDir.z / hLen;
    rz = lookDir.x / hLen;
  }

  // Base spawn height is at head/chin level (approx 0.12 units below eye level)
  // so the item doesn't obscure the center crosshair pixel while starting naturally at the head
  const headY = eyePos.y - 0.12;

  // Search for a valid spawn position that is not inside any solid block
  const candidateOffsets: [number, number, number][] = [
    // Standard forward spawn in front of head in look direction
    [lookDir.x * 0.35, lookDir.y * 0.25, lookDir.z * 0.35],
    // Closer forward spawn if partially obstructed
    [lookDir.x * 0.25, lookDir.y * 0.18, lookDir.z * 0.25],
    [lookDir.x * 0.15, lookDir.y * 0.10, lookDir.z * 0.15],
    [lookDir.x * 0.06, 0, lookDir.z * 0.06],
    // Right hand side of head
    [rx * 0.18, 0, rz * 0.18],
    // Left hand side of head
    [-rx * 0.18, 0, -rz * 0.18],
    // Right in front of head/eyes
    [0, 0, 0],
    // Slightly lower in player torso air space
    [0, -0.25, 0],
  ];

  let selectedX = eyePos.x + candidateOffsets[0][0];
  let selectedY = headY + candidateOffsets[0][1];
  let selectedZ = eyePos.z + candidateOffsets[0][2];

  for (let i = 0; i < candidateOffsets.length; i++) {
    const [ox, oy, oz] = candidateOffsets[i];
    const cx = eyePos.x + ox;
    const cy = headY + oy;
    const cz = eyePos.z + oz;

    if (!isItemInSolidBlock(cx, cy, cz, blocks)) {
      selectedX = cx;
      selectedY = cy;
      selectedZ = cz;
      break;
    }
  }

  // Same-spawn-position protection: Apply a tiny, imperceptible micro-offset (1-2 cm)
  // to ensure that rapid repeated throws do not occupy the exact same floating-point coordinates.
  const microOffsetX = (Math.random() - 0.5) * 0.04;
  const microOffsetZ = (Math.random() - 0.5) * 0.04;
  if (!isItemInSolidBlock(selectedX + microOffsetX, selectedY, selectedZ + microOffsetZ, blocks)) {
    selectedX += microOffsetX;
    selectedZ += microOffsetZ;
  }

  // Calculate forward launch velocity
  const baseSpeed = 4.8;
  // Natural upward component: +1.0 when looking straight ahead, +1.4 when looking up,
  // tapering down when looking downward so looking down throws directly downward.
  const upwardLift = Math.max(0.2, 1.0 + lookDir.y * 0.4);

  // Subtle random jitter ensures independent trajectories when multiple items are dropped
  const jitter = 0.10;
  const jx = (Math.random() - 0.5) * jitter;
  const jy = (Math.random() - 0.5) * jitter * 0.6;
  const jz = (Math.random() - 0.5) * jitter;

  const vx = lookDir.x * baseSpeed + jx;
  const vy = lookDir.y * baseSpeed + upwardLift + jy;
  const vz = lookDir.z * baseSpeed + jz;

  return {
    position: [selectedX, selectedY, selectedZ],
    velocity: [vx, vy, vz],
  };
}
