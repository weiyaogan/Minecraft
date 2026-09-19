import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, PerspectiveCamera, CanvasTexture, NearestFilter, SRGBColorSpace } from 'three';
import { useWorldStore } from '../store';
import { grassTopTexture, dirtTexture, grassSideTexture, stoneTexture, bedrockTexture } from '../world/textures';

export function PlayerHand() {
  const groupRef = useRef<Group>(null);
  const offhandGroupRef = useRef<Group>(null);
  const { size, camera } = useThree();
  
  const swingProgressRef = useRef(0);
  const isSwingingRef = useRef(false);
  
  const offhandSwingProgressRef = useRef(0);
  const isOffhandSwingingRef = useRef(false);

  // Recreate the exact pixel pattern of the user's uploaded image on a 3D block
  const handTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 32; 
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Base skin color from image
      ctx.fillStyle = '#9c6646'; 
      ctx.fillRect(0, 0, 16, 32);
      
      // Darker patches from image
      ctx.fillStyle = '#7a5139'; 
      ctx.fillRect(0, 8, 4, 4);
      ctx.fillRect(12, 12, 4, 4);
      ctx.fillRect(4, 20, 4, 4);
      ctx.fillRect(8, 26, 4, 6);
      ctx.fillRect(4, 2, 8, 4);
    }
    
    const tex = new CanvasTexture(canvas);
    tex.magFilter = NearestFilter;
    tex.minFilter = NearestFilter;
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, []);

  const hotbar = useWorldStore((state) => state.hotbar);
  const selectedSlot = useWorldStore((state) => state.selectedHotbarSlot);
  const heldItem = hotbar[selectedSlot]?.type;
  const offhandItem = useWorldStore((state) => state.offhand?.type);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (useWorldStore.getState().isPaused) return;
    
    const stateStore = useWorldStore.getState();
    const isMining = stateStore.isMining;
    const lastPlacedTime = stateStore.lastPlacedTime;
    const lastOffhandPlacedTime = stateStore.lastOffhandPlacedTime;
    
    const timeSincePlace = performance.now() - lastPlacedTime;
    const isPlacingRecently = timeSincePlace < 180;
    
    const timeSinceOffhandPlace = performance.now() - lastOffhandPlacedTime;
    const isOffhandPlacingRecently = timeSinceOffhandPlace < 180;
    
    const aspect = size.width / Math.max(size.height, 1);
    const pCam = camera as PerspectiveCamera;
    const fovRad = ((pCam.fov || 75) * Math.PI) / 360;
    
    // Main hand depth and sizing
    const mainAnchorZ = heldItem ? 0.6 : 0.3; 
    const mainHalfHeight = Math.tan(fovRad) * mainAnchorZ;
    const mainHalfWidth = mainHalfHeight * aspect;
    const baseX = heldItem ? mainHalfWidth * 0.8 : mainHalfWidth * 1.15;
    const baseY = heldItem ? -mainHalfHeight * 1.0 : -mainHalfHeight * 1.35;
    const baseZ = -mainAnchorZ;
    
    // Offhand depth and sizing (always block sized)
    const offAnchorZ = 0.6;
    const offHalfHeight = Math.tan(fovRad) * offAnchorZ;
    const offHalfWidth = offHalfHeight * aspect;
    const offBaseZ = -offAnchorZ;

    const shouldSwing = isMining || isPlacingRecently;
    
    if (shouldSwing) {
      isSwingingRef.current = true;
      swingProgressRef.current += delta * 6.0; 
    } else {
      isSwingingRef.current = false;
      swingProgressRef.current = 0;
    }

    const p = swingProgressRef.current % 1;
    const swingArch = isSwingingRef.current ? Math.sin(p * Math.PI) : 0;

    const swingRotX = swingArch * 0.60;
    const swingRotY = swingArch * 0.30;
    const swingRotZ = heldItem ? -swingArch * 0.20 : -swingArch * 0.10;
    
    const swingOffsetX = heldItem ? -swingArch * 0.15 : -swingArch * 0.05;
    const swingOffsetY = heldItem ? -swingArch * 0.15 : -swingArch * 0.05;
    const swingOffsetZ = heldItem ? -swingArch * 0.25 : -swingArch * 0.10;

    groupRef.current.position.set(
      baseX + swingOffsetX,
      baseY + swingOffsetY,
      baseZ + swingOffsetZ
    );
    
    if (heldItem) {
      groupRef.current.rotation.set(
        0.2 + swingRotX,
        -0.7 + swingRotY,
        0.15 + swingRotZ
      );
    } else {
      groupRef.current.rotation.set(
        -1.2 + swingRotX,
        0.2 + swingRotY,
        0.1 + swingRotZ,
        'YXZ'
      );
    }

    if (offhandGroupRef.current && offhandItem) {
      if (isOffhandPlacingRecently) {
        isOffhandSwingingRef.current = true;
        offhandSwingProgressRef.current += delta * 6.0;
      } else {
        isOffhandSwingingRef.current = false;
        offhandSwingProgressRef.current = 0;
      }
      
      const pOff = offhandSwingProgressRef.current % 1;
      const offSwingArch = isOffhandSwingingRef.current ? Math.sin(pOff * Math.PI) : 0;
      
      // Exact mirror of right hand math
      const offRotX = offSwingArch * 0.60;
      const offRotY = -offSwingArch * 0.30;
      const offRotZ = offSwingArch * 0.20;
      
      // X negated to mirror movement
      const offOffsetX = offSwingArch * 0.15; 
      const offOffsetY = -offSwingArch * 0.15;
      const offOffsetZ = -offSwingArch * 0.25;
      
      // Exact mirror of right hand base using offhand metrics
      const offBaseX = -offHalfWidth * 0.8;
      const offBaseY = -offHalfHeight * 1.0;
      
      offhandGroupRef.current.position.set(
        offBaseX + offOffsetX,
        offBaseY + offOffsetY,
        offBaseZ + offOffsetZ
      );
      
      offhandGroupRef.current.rotation.set(
        0.2 + offRotX,
        0.7 + offRotY,
        -0.15 + offRotZ
      );
    }
  });

  return (
    <>
    <group ref={groupRef}>
      {heldItem ? (
        <group position={[0, -0.05, 0]} scale={[0.5, 0.5, 0.5]}>
          <mesh renderOrder={999}>
            <boxGeometry args={[1, 1, 1]} />
            {heldItem === 'stone' && <meshStandardMaterial map={stoneTexture} transparent={true} depthTest={false} depthWrite={false} />}
            {heldItem === 'sand' && <meshStandardMaterial map={dirtTexture} color="#e3dbb0" transparent={true} depthTest={false} depthWrite={false} />}
            {heldItem === 'dirt' && <meshStandardMaterial map={dirtTexture} transparent={true} depthTest={false} depthWrite={false} />}
            {heldItem === 'bedrock' && <meshStandardMaterial map={bedrockTexture} transparent={true} depthTest={false} depthWrite={false} />}
            {heldItem === 'grass' && (
              <>
                <meshStandardMaterial attach="material-0" map={grassSideTexture} transparent={true} depthTest={false} depthWrite={false} />
                <meshStandardMaterial attach="material-1" map={grassSideTexture} transparent={true} depthTest={false} depthWrite={false} />
                <meshStandardMaterial attach="material-2" map={grassTopTexture} color="#55aa55" transparent={true} depthTest={false} depthWrite={false} />
                <meshStandardMaterial attach="material-3" map={dirtTexture} transparent={true} depthTest={false} depthWrite={false} />
                <meshStandardMaterial attach="material-4" map={grassSideTexture} transparent={true} depthTest={false} depthWrite={false} />
                <meshStandardMaterial attach="material-5" map={grassSideTexture} transparent={true} depthTest={false} depthWrite={false} />
              </>
            )}
          </mesh>
        </group>
      ) : (
        <group position={[0, 0, 0]}>
          {/* Shift the mesh up so the pivot point is exactly at the bottom of the arm */}
          <mesh position={[0, 0.225, 0]} renderOrder={999}>
            {/* Slightly thinner than original, shorter length */}
            <boxGeometry args={[0.20, 0.45, 0.20]} />
            {/* Use meshBasicMaterial so it remains fully bright and unlit! */}
            <meshBasicMaterial map={handTexture} transparent={true} depthTest={false} depthWrite={false} />
          </mesh>
        </group>
      )}
    </group>
    {offhandItem && (
        <group ref={offhandGroupRef}>
          <group position={[0, -0.05, 0]} scale={[0.5, 0.5, 0.5]}>
          <mesh renderOrder={999}>
            <boxGeometry args={[1, 1, 1]} />
            {offhandItem === 'stone' && <meshStandardMaterial map={stoneTexture} transparent={true} depthTest={false} depthWrite={false} />}
            {offhandItem === 'sand' && <meshStandardMaterial map={dirtTexture} color="#e3dbb0" transparent={true} depthTest={false} depthWrite={false} />}
            {offhandItem === 'dirt' && <meshStandardMaterial map={dirtTexture} transparent={true} depthTest={false} depthWrite={false} />}
            {offhandItem === 'bedrock' && <meshStandardMaterial map={bedrockTexture} transparent={true} depthTest={false} depthWrite={false} />}
            {offhandItem === 'grass' && (
              <>
                <meshStandardMaterial attach="material-0" map={grassSideTexture} transparent={true} depthTest={false} depthWrite={false} />
                <meshStandardMaterial attach="material-1" map={grassSideTexture} transparent={true} depthTest={false} depthWrite={false} />
                <meshStandardMaterial attach="material-2" map={grassTopTexture} color="#55aa55" transparent={true} depthTest={false} depthWrite={false} />
                <meshStandardMaterial attach="material-3" map={dirtTexture} transparent={true} depthTest={false} depthWrite={false} />
                <meshStandardMaterial attach="material-4" map={grassSideTexture} transparent={true} depthTest={false} depthWrite={false} />
                <meshStandardMaterial attach="material-5" map={grassSideTexture} transparent={true} depthTest={false} depthWrite={false} />
              </>
            )}
          </mesh>
          </group>
        </group>
    )}
    </>
  );
}
