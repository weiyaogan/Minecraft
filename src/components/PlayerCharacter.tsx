import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Vector3, Euler, Camera } from 'three';
import { PerspectiveMode, useWorldStore } from '../store';
import {
  createSteveHeadMaterials,
  createSteveTorsoMaterials,
  createSteveArmMaterials,
  createSteveLegMaterials,
} from '../utils/playerTextures';
import { BlockType } from '../world/blocks';
import {
  grassTopTexture,
  dirtTexture,
  grassSideTexture,
  stoneTexture,
  bedrockTexture,
} from '../world/textures';

export interface PlayerAnimationState {
  isGrounded: boolean;
  isSprinting: boolean;
  isSneaking: boolean;
  isMoving: boolean;
  moveSpeed: number;
}

export interface PlayerCharacterProps {
  camera: Camera;
  feetPosition: Vector3;
  animationStateRef: { current: PlayerAnimationState };
  isThirdPerson?: boolean;
  perspectiveMode?: PerspectiveMode;
  facingYawRef?: { current: number };
  viewPitchRef?: { current: number };
}

function HeldBlock({ type }: { type: BlockType }) {
  return (
    <group position={[0, -0.76, -0.08]} rotation={[0.2, 0.35, 0.15]} scale={[0.32, 0.32, 0.32]}>
      <mesh renderOrder={20}>
        <boxGeometry args={[1, 1, 1]} />
        {type === 'stone' && <meshStandardMaterial map={stoneTexture} />}
        {type === 'sand' && <meshStandardMaterial map={dirtTexture} color="#e3dbb0" />}
        {type === 'dirt' && <meshStandardMaterial map={dirtTexture} />}
        {type === 'bedrock' && <meshStandardMaterial map={bedrockTexture} />}
        {type === 'grass' && (
          <>
            <meshStandardMaterial attach="material-0" map={grassSideTexture} />
            <meshStandardMaterial attach="material-1" map={grassSideTexture} />
            <meshStandardMaterial attach="material-2" map={grassTopTexture} color="#55aa55" />
            <meshStandardMaterial attach="material-3" map={dirtTexture} />
            <meshStandardMaterial attach="material-4" map={grassSideTexture} />
            <meshStandardMaterial attach="material-5" map={grassSideTexture} />
          </>
        )}
      </mesh>
    </group>
  );
}

export function PlayerCharacter({
  camera,
  feetPosition,
  animationStateRef,
  isThirdPerson = false,
  perspectiveMode = 'first',
  facingYawRef,
  viewPitchRef,
}: PlayerCharacterProps) {
  const rootRef = useRef<Group>(null);
  const upperBodyRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const torsoMeshRef = useRef<Mesh>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const hotbar = useWorldStore((state) => state.hotbar);
  const selectedHotbarSlot = useWorldStore((state) => state.selectedHotbarSlot);
  const offhandItem = useWorldStore((state) => state.offhand.type);
  const heldItem = hotbar[selectedHotbarSlot]?.type;

  // Animation state references
  const walkTimeRef = useRef(0);
  const swingAmplitudeRef = useRef(0);
  const currentSneakProgressRef = useRef(0);

  // Cached materials for Minecraft Steve
  const headMaterials = useMemo(() => createSteveHeadMaterials(), []);
  const torsoMaterials = useMemo(() => createSteveTorsoMaterials(), []);
  const leftArmMaterials = useMemo(() => createSteveArmMaterials(true), []);
  const rightArmMaterials = useMemo(() => createSteveArmMaterials(false), []);
  const leftLegMaterials = useMemo(() => createSteveLegMaterials(true), []);
  const rightLegMaterials = useMemo(() => createSteveLegMaterials(false), []);

  useFrame((_, delta) => {
    if (!rootRef.current) return;
    const dt = Math.min(delta, 0.1);
    const { isGrounded, isSprinting, isSneaking, isMoving, moveSpeed } = animationStateRef.current;

    // 1. Position character at the player's physical feet location
    rootRef.current.position.copy(feetPosition);

    // 2. Align horizontal body rotation with camera yaw
    const euler = new Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(camera.quaternion);
    const yaw = isThirdPerson && facingYawRef
      ? facingYawRef.current
      : perspectiveMode === 'thirdFront'
        ? euler.y - Math.PI
        : euler.y;
    const pitch = isThirdPerson && viewPitchRef ? viewPitchRef.current : euler.x;
    rootRef.current.rotation.y = yaw;

    // 3. Smooth sneak crouch animation (lowers upper body and tilts torso forward)
    const targetSneak = isSneaking ? 1 : 0;
    currentSneakProgressRef.current += (targetSneak - currentSneakProgressRef.current) * 14 * dt;
    const sneak = currentSneakProgressRef.current;

    if (upperBodyRef.current) {
      // In Minecraft Java, sneaking lowers the torso by ~0.15 blocks and shifts it slightly forward
      upperBodyRef.current.position.y = -sneak * 0.16;
      upperBodyRef.current.position.z = -sneak * 0.08;
      // Torso tilts forward ~18 degrees when sneaking
      upperBodyRef.current.rotation.x = sneak * 0.32;
    }

    // 4. Head rotation (pitch and relative yaw)
    if (headRef.current) {
      // Counteract torso pitch so head faces look direction
      headRef.current.rotation.x = pitch - (sneak * 0.32);
    }

    // 5. Walking & Sprinting limb animation
    const targetAmp = isMoving && isGrounded ? (isSprinting ? 0.85 : 0.55) : 0;
    swingAmplitudeRef.current += (targetAmp - swingAmplitudeRef.current) * 10 * dt;

    if (isMoving && isGrounded) {
      const freq = isSprinting ? 7.8 : 5.4;
      walkTimeRef.current += dt * freq * (moveSpeed / 4.3);
    }

    const swing = Math.sin(walkTimeRef.current) * swingAmplitudeRef.current;
    const cosSwing = Math.cos(walkTimeRef.current) * swingAmplitudeRef.current;

    // Airborne state (jumping / falling)
    const airLegSpread = !isGrounded ? 0.22 : 0;
    const airArmSpread = !isGrounded ? -0.28 : 0;

    // Legs animation
    if (leftLegRef.current && rightLegRef.current) {
      // Left leg swings forward, right leg swings backward
      leftLegRef.current.rotation.x = swing + (airLegSpread * 0.5);
      rightLegRef.current.rotation.x = -swing - (airLegSpread * 0.5);

      // Subtle outward angle during jump/fall
      leftLegRef.current.rotation.z = -airLegSpread * 0.3;
      rightLegRef.current.rotation.z = airLegSpread * 0.3;
    }

    // Arms animation
    if (leftArmRef.current) {
      // Left arm swings opposite to left leg (with right leg)
      leftArmRef.current.rotation.x = -swing + airArmSpread;
      leftArmRef.current.rotation.z = isSneaking ? -0.1 : 0;
    }

    if (rightArmRef.current) {
      // Right arm swings with left leg
      rightArmRef.current.rotation.x = swing + airArmSpread;
      rightArmRef.current.rotation.z = isSneaking ? 0.1 : 0;
    }
  });

  return (
    <group ref={rootRef} visible={isThirdPerson}>
      {/* ------------------------------------------------------------- */}
      {/* UPPER BODY (Torso, Head, Arms)                                 */}
      {/* Pivot at waist / hips (y = 0.75m)                              */}
      {/* ------------------------------------------------------------- */}
      <group position={[0, 0.75, 0]}>
        <group ref={upperBodyRef}>
          {/* Torso: 0.48 wide, 0.72 high, 0.24 deep (centered at y = 0.36) */}
          <mesh
            ref={torsoMeshRef}
            position={[0, 0.36, 0]}
            material={torsoMaterials}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.48, 0.72, 0.24]} />
          </mesh>

          {/* Head: Pivot at neck (y = 0.72 above waist = 1.47m from feet) */}
          {/* In first-person, head is hidden so it never clips into camera */}
          <group ref={headRef} position={[0, 0.72, 0]} visible={isThirdPerson}>
            <mesh position={[0, 0.25, 0]} material={headMaterials} castShadow>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
            </mesh>
          </group>

          {/* Left Arm: Pivot at shoulder (x = -0.36, y = 0.69) */}
          {/* Hangs down 0.72m from shoulder to y = 0.75m */}
          <group ref={leftArmRef} position={[-0.36, 0.69, 0]}>
            <mesh position={[0, -0.36, 0]} material={leftArmMaterials} castShadow>
              <boxGeometry args={[0.24, 0.72, 0.24]} />
            </mesh>
            {offhandItem && <HeldBlock type={offhandItem} />}
          </group>

          {/* Right Arm: Pivot at shoulder (x = +0.36, y = 0.69) */}
          {/* Visible in third-person view; first-person uses specialized PlayerHand */}
          <group ref={rightArmRef} position={[0.36, 0.69, 0]} visible={isThirdPerson}>
            <mesh position={[0, -0.36, 0]} material={rightArmMaterials} castShadow>
              <boxGeometry args={[0.24, 0.72, 0.24]} />
            </mesh>
            {heldItem && <HeldBlock type={heldItem} />}
          </group>
        </group>
      </group>

      {/* ------------------------------------------------------------- */}
      {/* LOWER BODY (Left Leg, Right Leg)                               */}
      {/* Pivot at hips (y = 0.75m), feet touch ground at y = 0.00m      */}
      {/* ------------------------------------------------------------- */}
      {/* Left Leg: centered at x = -0.12 */}
      <group ref={leftLegRef} position={[-0.12, 0.75, 0]}>
        <mesh position={[0, -0.36, 0]} material={leftLegMaterials} castShadow receiveShadow>
          <boxGeometry args={[0.24, 0.72, 0.24]} />
        </mesh>
      </group>

      {/* Right Leg: centered at x = +0.12 */}
      <group ref={rightLegRef} position={[0.12, 0.75, 0]}>
        <mesh position={[0, -0.36, 0]} material={rightLegMaterials} castShadow receiveShadow>
          <boxGeometry args={[0.24, 0.72, 0.24]} />
        </mesh>
      </group>
    </group>
  );
}
