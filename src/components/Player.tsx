import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CustomPointerLockControls, CustomPointerLockControlsRef } from './CustomPointerLockControls';
import { useKeyboard } from '../hooks/useKeyboard';
import { Vector3, Euler, PerspectiveCamera } from 'three';
import { PerspectiveMode, useWorldStore } from '../store';
import { PlayerHand } from './PlayerHand';
import { PlayerCharacter, PlayerAnimationState } from './PlayerCharacter';
import { playJumpSound } from '../utils/audio';

const GRAVITY = 30;
// Max jump height = 1.25 blocks. v = sqrt(2 * g * h) = sqrt(2 * 30 * 1.25) = 8.66
const JUMP_FORCE = 8.66;
const NORMAL_SPEED = 4.317; // Walk speed
const SPRINT_SPEED = 5.612; // Sprint speed
const SNEAK_SPEED = 1.295; // Slower speed while sneaking

// Minecraft Player Dimensions
export const PLAYER_HEIGHT = 1.8;
export const SNEAK_HEIGHT = 1.5;
export const PLAYER_WIDTH = 0.6;
export const EYE_HEIGHT = 1.62; // Eye level of the player
export const SNEAK_EYE_HEIGHT = 1.35; // Eye level while sneaking

// Helper to get the player's bounding box (AABB)
export const getPlayerAABB = (feetPos: Vector3, height: number) => {
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
  a: ReturnType<typeof getPlayerAABB>,
  b: { minX: number, maxX: number, minY: number, maxY: number, minZ: number, maxZ: number }
) => {
  return (
    a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minY < b.maxY &&
    a.maxY > b.minY &&
    a.minZ < b.maxZ &&
    a.maxZ > b.minZ
  );
};

const THIRD_PERSON_DISTANCE = 4.5;
const THIRD_PERSON_MIN_DISTANCE = 0.25;
const THIRD_PERSON_CAMERA_RADIUS = 0.18;

const normalizeAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

const clampPitch = (pitch: number) => Math.max(-1.2, Math.min(1.2, pitch));

const getSafeCameraDistance = (
  origin: Vector3,
  destination: Vector3,
  collisionBlocks: Array<{ minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }>,
) => {
  const direction = destination.clone().sub(origin);
  const distance = direction.length();
  if (distance < 0.001) return 0;
  direction.multiplyScalar(1 / distance);

  let nearestHit = distance;
  for (const block of collisionBlocks) {
    const minX = block.minX - THIRD_PERSON_CAMERA_RADIUS;
    const maxX = block.maxX + THIRD_PERSON_CAMERA_RADIUS;
    const minY = block.minY - THIRD_PERSON_CAMERA_RADIUS;
    const maxY = block.maxY + THIRD_PERSON_CAMERA_RADIUS;
    const minZ = block.minZ - THIRD_PERSON_CAMERA_RADIUS;
    const maxZ = block.maxZ + THIRD_PERSON_CAMERA_RADIUS;

    let entry = 0;
    let exit = 1;
    const axes: Array<[number, number, number, number]> = [
      [origin.x, direction.x, minX, maxX],
      [origin.y, direction.y, minY, maxY],
      [origin.z, direction.z, minZ, maxZ],
    ];

    let intersects = true;
    for (const [start, delta, min, max] of axes) {
      if (Math.abs(delta) < 0.000001) {
        if (start < min || start > max) {
          intersects = false;
          break;
        }
        continue;
      }

      let near = (min - start) / delta;
      let far = (max - start) / delta;
      if (near > far) [near, far] = [far, near];
      entry = Math.max(entry, near);
      exit = Math.min(exit, far);
      if (entry > exit) {
        intersects = false;
        break;
      }
    }

    if (intersects && exit >= 0 && entry <= 1) {
      nearestHit = Math.min(
        nearestHit,
        Math.max(THIRD_PERSON_MIN_DISTANCE, entry * distance - 0.12),
      );
    }
  }

  return nearestHit;
};

export function Player() {
  const blocks = useWorldStore(state => state.blocks);
  const collisionBlocks = useMemo(() => blocks.map(b => ({
    minX: b.x - 0.5,
    maxX: b.x + 0.5,
    minY: b.y - 0.5,
    maxY: b.y + 0.5,
    minZ: b.z - 0.5,
    maxZ: b.z + 0.5,
  })), [blocks]);

  const controlsRef = useRef<CustomPointerLockControlsRef>(null);
  const { camera } = useThree();
  const velocityY = useRef(0);
  const isSprinting = useRef(false);
  const keys = useKeyboard();
  
  // Persist the actual position decoupled from the camera
  const feetPosition = useRef(new Vector3(0, 5, 0));
  const currentEyeHeight = useRef(EYE_HEIGHT);
  const characterAnimationRef = useRef<PlayerAnimationState>({
    isGrounded: false,
    isSprinting: false,
    isSneaking: false,
    isMoving: false,
    moveSpeed: NORMAL_SPEED,
  });
  
  const setPlayerFeetPosition = useWorldStore(state => state.setPlayerFeetPosition);
  const setPlayerHeight = useWorldStore(state => state.setPlayerHeight);
  const respawnTrigger = useWorldStore(state => state.respawnTrigger);
  const isMobile = useWorldStore(state => state.isMobile);
  const isPaused = useWorldStore(state => state.isPaused);
  const isInventoryOpen = useWorldStore(state => state.isInventoryOpen);
  const perspectiveMode = useWorldStore(state => state.perspectiveMode);
  const virtualInputs = useWorldStore(state => state.virtualInputs);
  const joystickMove = useWorldStore(state => state.joystickMove);
  const previousPerspective = useRef<PerspectiveMode>(perspectiveMode);
  const orbitYaw = useRef(0);
  const orbitPitch = useRef(0);
  const thirdPersonCameraPosition = useRef(new Vector3());

  // In third person, the camera quaternion is rebuilt with lookAt() after each
  // frame. Keep the actual orbit angles separately so mouse look is not fed
  // back through that derived quaternion on the next frame.
  const handleCameraChange = useCallback(() => {
    const mode = useWorldStore.getState().perspectiveMode;
    if (mode === 'first') return;

    const currentEuler = new Euler(0, 0, 0, 'YXZ').setFromQuaternion(camera.quaternion);
    orbitYaw.current = mode === 'thirdFront'
      ? normalizeAngle(currentEuler.y - Math.PI)
      : currentEuler.y;
    orbitPitch.current = clampPitch(currentEuler.x);
  }, [camera]);

  // Respawn effect
  useEffect(() => {
    if (respawnTrigger > 0) {
      feetPosition.current.set(0, 5, 0);
      velocityY.current = 0;
      camera.position.set(0, 5 + EYE_HEIGHT, 0);
    }
  }, [respawnTrigger, camera]);

  // Initialize camera position once
  useEffect(() => {
    camera.position.set(feetPosition.current.x, feetPosition.current.y + EYE_HEIGHT, feetPosition.current.z);
  }, [camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1); // Cap delta to prevent massive physics spikes
    const pos = feetPosition.current;
    const EPSILON = 0.001;

    if (perspectiveMode !== previousPerspective.current) {
      const previousMode = previousPerspective.current;
      const currentEuler = new Euler(0, 0, 0, 'YXZ').setFromQuaternion(camera.quaternion);

      if (perspectiveMode === 'first') {
        const firstPersonYaw = previousMode === 'thirdFront'
          ? orbitYaw.current
          : currentEuler.y;
        camera.rotation.set(orbitPitch.current, firstPersonYaw, 0, 'YXZ');
      } else if (previousMode === 'first') {
        orbitYaw.current = currentEuler.y;
        orbitPitch.current = clampPitch(currentEuler.x);
        thirdPersonCameraPosition.current.copy(camera.position);
      }

      previousPerspective.current = perspectiveMode;
    }

    // Movement allowed if locked (desktop) or active playing without pause/inventory (mobile)
    const canControl = Boolean(controlsRef.current?.isLocked || (isMobile && !isPaused && !isInventoryOpen));

    const inputForward = keys.forward || virtualInputs.forward || joystickMove.y > 0.15;
    const inputBackward = keys.backward || virtualInputs.backward || joystickMove.y < -0.15;
    const inputLeft = keys.left || virtualInputs.left || joystickMove.x < -0.15;
    const inputRight = keys.right || virtualInputs.right || joystickMove.x > 0.15;
    const inputJump = keys.jump || virtualInputs.jump;
    const inputSprint = keys.sprint || virtualInputs.sprint || joystickMove.y > 0.85;
    const inputSneak = keys.shift || virtualInputs.sneak;

    // --- 1. SNEAK & HEIGHT LOGIC ---
    let wantsToSneak = inputSneak;
    
    // If not actively holding sneak, check if there is enough ceiling clearance to stand up
    if (!wantsToSneak) {
      const standAABB = getPlayerAABB(pos, PLAYER_HEIGHT);
      standAABB.minX += EPSILON; 
      standAABB.maxX -= EPSILON;
      standAABB.minZ += EPSILON; 
      standAABB.maxZ -= EPSILON;
      standAABB.minY += 0.01; // Don't check the floor, only block space above
      let hitCeiling = false;
      for (const block of collisionBlocks) {
        if (checkIntersection(standAABB, block)) {
          hitCeiling = true;
          break;
        }
      }
      if (hitCeiling) wantsToSneak = true; // Force sneak if there is no room to stand
    }

    const currentHeight = wantsToSneak ? SNEAK_HEIGHT : PLAYER_HEIGHT;
    const targetEyeHeight = wantsToSneak ? SNEAK_EYE_HEIGHT : EYE_HEIGHT;
    
    // Sync to store for external collision checks
    setPlayerHeight(currentHeight);
    
    // Lerp eye height for a smooth camera crouch effect
    currentEyeHeight.current += (targetEyeHeight - currentEyeHeight.current) * 15 * dt;

    // --- 2. GROUND CHECK ---
    const groundCheckAABB = getPlayerAABB(new Vector3(pos.x, pos.y - 0.01, pos.z), currentHeight);
    groundCheckAABB.minX += EPSILON;
    groundCheckAABB.maxX -= EPSILON;
    groundCheckAABB.minZ += EPSILON;
    groundCheckAABB.maxZ -= EPSILON;

    let isGrounded = false;
    for (const block of collisionBlocks) {
      if (checkIntersection(groundCheckAABB, block)) {
        isGrounded = true;
        break;
      }
    }

    // --- 3. JUMP LOGIC ---
    if (canControl) {
      if (inputJump && isGrounded) {
        velocityY.current = JUMP_FORCE;
        isGrounded = false;
        playJumpSound();
      }
    }

    // --- 4. GRAVITY & Y COLLISION ---
    if (!isGrounded) {
      velocityY.current -= GRAVITY * dt;
    } else if (velocityY.current < 0) {
      velocityY.current = 0; // Reset velocity when landing
    }

    pos.y += velocityY.current * dt;
    for (const block of collisionBlocks) {
      const yAABB = getPlayerAABB(pos, currentHeight);
      yAABB.minX += EPSILON;
      yAABB.maxX -= EPSILON;
      yAABB.minZ += EPSILON;
      yAABB.maxZ -= EPSILON;
      
      if (checkIntersection(yAABB, block)) {
        if (velocityY.current <= 0) {
          // Hit top of block
          pos.y = block.maxY;
          velocityY.current = 0;
          isGrounded = true;
        } else if (velocityY.current > 0) {
          // Hit bottom of block (ceiling)
          pos.y = block.minY - currentHeight;
          velocityY.current = 0;
        }
      }
    }

    // --- 4.5 SPRINT LOGIC ---
    if (wantsToSneak || !inputForward || isInventoryOpen || isPaused || !canControl) {
      keys.sprint = false;
      isSprinting.current = false;
      if (virtualInputs.sprint) {
        useWorldStore.getState().setVirtualInput('sprint', false);
      }
    } else if (inputSprint && isGrounded && !isSprinting.current) {
      isSprinting.current = true;
    } else if (inputSprint && !isGrounded && !isSprinting.current) {
      // Cannot start sprinting in mid-air
      keys.sprint = false;
      if (virtualInputs.sprint) {
        useWorldStore.getState().setVirtualInput('sprint', false);
      }
    }

    const pCam = camera as PerspectiveCamera;
    const targetFov = isSprinting.current ? 85 : 75;
    if (Math.abs(pCam.fov - targetFov) > 0.1) {
      pCam.fov += (targetFov - pCam.fov) * 10 * dt;
      pCam.updateProjectionMatrix();
    }

    // --- 5. HORIZONTAL MOVEMENT & EDGE PROTECTION ---
    let dx = 0;
    let dz = 0;
    const speed = wantsToSneak ? SNEAK_SPEED : (isSprinting.current ? SPRINT_SPEED : NORMAL_SPEED);
    
    if (canControl) {
      const forward = inputForward;
      const backward = inputBackward;
      const left = inputLeft;
      const right = inputRight;
      
      const euler = new Euler(0, 0, 0, 'YXZ');
      euler.setFromQuaternion(camera.quaternion);
      const yaw = perspectiveMode === 'first' ? euler.y : orbitYaw.current;

      const frontVector = new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), yaw);
      const sideVector = new Vector3(1, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), yaw);

      const direction = new Vector3();
      if (keys.forward || virtualInputs.forward) direction.add(frontVector);
      if (keys.backward || virtualInputs.backward) direction.sub(frontVector);
      if (keys.right || virtualInputs.right) direction.add(sideVector);
      if (keys.left || virtualInputs.left) direction.sub(sideVector);

      if (joystickMove.x !== 0 || joystickMove.y !== 0) {
        direction.add(sideVector.clone().multiplyScalar(joystickMove.x));
        direction.add(frontVector.clone().multiplyScalar(joystickMove.y));
      }

      const len = direction.length();
      if (len > 0.001) {
        const factor = Math.min(1, len);
        direction.normalize().multiplyScalar(factor);
        dx = direction.x * speed * dt;
        dz = direction.z * speed * dt;
      }
    }

    // Edge protection helper: checks if moving by (offsetX, offsetZ) would cause the player to fall
    const checkWouldFall = (offsetX: number, offsetZ: number) => {
      // Only protect edges if we are on the ground and not jumping/falling
      if (!isGrounded || velocityY.current !== 0) return false;
      
      // Calculate where the player *would* be
      const checkAABB = getPlayerAABB(new Vector3(pos.x + offsetX, pos.y - 0.01, pos.z + offsetZ), currentHeight);
      checkAABB.minX += EPSILON; checkAABB.maxX -= EPSILON;
      checkAABB.minZ += EPSILON; checkAABB.maxZ -= EPSILON;
      
      for (const block of collisionBlocks) {
        if (checkIntersection(checkAABB, block)) {
          return false; // We found ground directly underneath the projected AABB, so we won't fall
        }
      }
      return true; // No ground found, moving here would cause a fall
    };

    // Edge Protection application (Prevent walking off edges ONLY when sneaking)
    if (isGrounded && wantsToSneak) {
      if (checkWouldFall(dx, 0)) dx = 0;
      if (checkWouldFall(0, dz)) dz = 0;
      // If moving diagonally still causes a fall after component checks, cancel all movement
      if (checkWouldFall(dx, dz)) {
        dx = 0;
        dz = 0;
      }
    }

    // Apply X movement & collision
    const oldPosX = pos.x;
    const oldPosZ = pos.z;

    pos.x += dx;
    for (const block of collisionBlocks) {
      const xAABB = getPlayerAABB(pos, currentHeight);
      xAABB.minY += EPSILON;
      xAABB.maxY -= EPSILON;
      xAABB.minZ += EPSILON;
      xAABB.maxZ -= EPSILON;
      
      if (checkIntersection(xAABB, block)) {
        if (dx > 0) pos.x = block.minX - PLAYER_WIDTH / 2;
        else if (dx < 0) pos.x = block.maxX + PLAYER_WIDTH / 2;
      }
    }

    // Apply Z movement & collision
    pos.z += dz;
    for (const block of collisionBlocks) {
      const zAABB = getPlayerAABB(pos, currentHeight);
      zAABB.minX += EPSILON;
      zAABB.maxX -= EPSILON;
      zAABB.minY += EPSILON;
      zAABB.maxY -= EPSILON;
      
      if (checkIntersection(zAABB, block)) {
        if (dz > 0) pos.z = block.minZ - PLAYER_WIDTH / 2;
        else if (dz < 0) pos.z = block.maxZ + PLAYER_WIDTH / 2;
      }
    }

    // --- 5.5 SPRINT COLLISION CANCEL ---
    if (isSprinting.current) {
      const actualDx = pos.x - oldPosX;
      const actualDz = pos.z - oldPosZ;
      const blockedX = Math.abs(dx) > EPSILON && Math.abs(actualDx) < 0.0001;
      const blockedZ = Math.abs(dz) > EPSILON && Math.abs(actualDz) < 0.0001;
      const primaryX = Math.abs(dx) >= Math.abs(dz);
      if ((blockedX && primaryX) || (blockedZ && !primaryX)) {
        isSprinting.current = false;
        keys.sprint = false;
        useWorldStore.getState().setVirtualInput('sprint', false);
      }
    }

    characterAnimationRef.current.isGrounded = isGrounded;
    characterAnimationRef.current.isSprinting = isSprinting.current;
    characterAnimationRef.current.isSneaking = wantsToSneak;
    characterAnimationRef.current.isMoving = Math.abs(dx) > EPSILON || Math.abs(dz) > EPSILON;
    characterAnimationRef.current.moveSpeed = speed;

    // --- 6. VOID RESPAWN ---
    if (pos.y < -20) {
      pos.set(0, 5, 0);
      velocityY.current = 0;
    }

    // --- 7. UPDATE CAMERA POSITION ---
    if (perspectiveMode === 'first') {
      camera.position.set(pos.x, pos.y + currentEyeHeight.current, pos.z);
    } else {
      const cameraTarget = new Vector3(pos.x, pos.y + currentEyeHeight.current, pos.z);
      const frontVector = new Vector3(0, 0, -1).applyAxisAngle(
        new Vector3(0, 1, 0),
        orbitYaw.current,
      );
      const horizontalDistance = Math.cos(orbitPitch.current) * THIRD_PERSON_DISTANCE;
      const verticalDistance = Math.sin(orbitPitch.current) * THIRD_PERSON_DISTANCE;
      const side = perspectiveMode === 'thirdFront' ? 1 : -1;
      const desiredCameraPosition = cameraTarget.clone()
        .add(frontVector.multiplyScalar(side * horizontalDistance))
        .add(new Vector3(0, verticalDistance, 0));
      const safeDistance = getSafeCameraDistance(
        cameraTarget,
        desiredCameraPosition,
        collisionBlocks,
      );
      const safeCameraPosition = cameraTarget.clone().lerp(
        desiredCameraPosition,
        safeDistance / THIRD_PERSON_DISTANCE,
      );

      const followAlpha = 1 - Math.exp(-dt * 14);
      thirdPersonCameraPosition.current.lerp(safeCameraPosition, followAlpha);
      const currentSafeDistance = getSafeCameraDistance(
        cameraTarget,
        thirdPersonCameraPosition.current,
        collisionBlocks,
      );
      if (currentSafeDistance < cameraTarget.distanceTo(thirdPersonCameraPosition.current)) {
        thirdPersonCameraPosition.current.copy(cameraTarget).lerp(
          thirdPersonCameraPosition.current,
          currentSafeDistance / Math.max(cameraTarget.distanceTo(thirdPersonCameraPosition.current), 0.001),
        );
      }

      camera.position.copy(thirdPersonCameraPosition.current);
      camera.lookAt(cameraTarget);
    }
    setPlayerFeetPosition(pos.clone());
  });

  return (
    <>
      <CustomPointerLockControls ref={controlsRef} onChange={handleCameraChange} />
      <PlayerCharacter
        camera={camera}
        feetPosition={feetPosition.current}
        animationStateRef={characterAnimationRef}
        isThirdPerson={perspectiveMode !== 'first'}
        perspectiveMode={perspectiveMode}
        facingYawRef={orbitYaw}
        viewPitchRef={orbitPitch}
      />
      {/* Hand model attached securely to the first-person camera */}
      {perspectiveMode === 'first' && (
        <primitive object={camera}>
          <PlayerHand />
        </primitive>
      )}
    </>
  );
}
