import { grassTopTexture, dirtTexture, grassSideTexture, stoneTexture, bedrockTexture } from '../world/textures';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { BlockType } from '../world/blocks';

interface VoxelBlockProps {
  type: BlockType;
  position: [number, number, number];
  createdAt?: number;
}

export function VoxelBlock({ type, position, createdAt }: VoxelBlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  if (type === 'stone') {
    return (
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={stoneTexture} />
      </mesh>
    );
  }

  if (type === 'sand') {
    return (
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={dirtTexture} color="#e3dbb0" />
      </mesh>
    );
  }

  if (type === 'bedrock') {
    return (
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={bedrockTexture} />
      </mesh>
    );
  }

  if (type === 'dirt') {
    return (
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={dirtTexture} />
      </mesh>
    );
  }

  // Grass uses different textures for its faces
  // Face order: right, left, top, bottom, front, back
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial attach="material-0" map={grassSideTexture} />
      <meshStandardMaterial attach="material-1" map={grassSideTexture} />
      <meshStandardMaterial attach="material-2" map={grassTopTexture} color="#55aa55" />
      <meshStandardMaterial attach="material-3" map={dirtTexture} />
      <meshStandardMaterial attach="material-4" map={grassSideTexture} />
      <meshStandardMaterial attach="material-5" map={grassSideTexture} />
    </mesh>
  );
}
