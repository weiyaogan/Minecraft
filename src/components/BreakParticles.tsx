import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import {
  InstancedMesh,
  BoxGeometry,
  MeshBasicMaterial,
  Object3D,
  Color,
  Vector3,
} from 'three';
import { BlockType } from '../world/blocks';

interface Particle {
  position: Vector3;
  velocity: Vector3;
  color: Color;
  life: number;
  maxLife: number;
  scale: number;
}

// Color palettes for authentic Minecraft voxel appearance
const STONE_COLORS = ['#8a8a8a', '#757575', '#666666', '#9c9c9c', '#545454', '#808080'];
const DIRT_COLORS = ['#7a5a3a', '#5c432b', '#8f6843', '#6a4b2b', '#775231', '#4e3820'];
const GRASS_EARTH_COLORS = ['#7a5a3a', '#5c432b', '#8f6843', '#6a4b2b'];
const GRASS_GREEN_COLORS = ['#4d8c28', '#3e7020', '#5aa130'];
const SAND_COLORS = ['#ded49b', '#c7bc83', '#ede3ab', '#b0a671', '#d9cf93'];
const BEDROCK_COLORS = ['#303030', '#202020', '#424242', '#181818'];

function getBlockColor(type: BlockType, isGrassGreenBias: boolean = false): string {
  if (type === 'stone') {
    return STONE_COLORS[Math.floor(Math.random() * STONE_COLORS.length)];
  }
  if (type === 'dirt') {
    return DIRT_COLORS[Math.floor(Math.random() * DIRT_COLORS.length)];
  }
  if (type === 'grass') {
    // Grass particles are primarily earth with subtle green accents
    if (isGrassGreenBias || Math.random() < 0.22) {
      return GRASS_GREEN_COLORS[Math.floor(Math.random() * GRASS_GREEN_COLORS.length)];
    }
    return GRASS_EARTH_COLORS[Math.floor(Math.random() * GRASS_EARTH_COLORS.length)];
  }
  if (type === 'sand') {
    return SAND_COLORS[Math.floor(Math.random() * SAND_COLORS.length)];
  }
  if (type === 'bedrock') {
    return BEDROCK_COLORS[Math.floor(Math.random() * BEDROCK_COLORS.length)];
  }
  return DIRT_COLORS[Math.floor(Math.random() * DIRT_COLORS.length)];
}

const MAX_PARTICLES = 128;
const dummy = new Object3D();
const particleGeo = new BoxGeometry(0.07, 0.07, 0.07);
const particleMat = new MeshBasicMaterial({ toneMapped: false });

export function BreakParticles() {
  const meshRef = useRef<InstancedMesh>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    // 1. MINING PARTICLES (continuous strikes on the targeted face)
    const handleMining = (e: Event) => {
      const customEvent = e as CustomEvent<{
        x: number;
        y: number;
        z: number;
        normal: [number, number, number];
        type: BlockType;
        progress: number;
      }>;
      const { x, y, z, normal, type, progress } = customEvent.detail;
      const [nx, ny, nz] = normal;

      // Quantity increases slightly as mining progress increases (2 to 5 particles)
      const count = Math.min(5, Math.floor(2 + progress * 3.5));
      const newParticles: Particle[] = [];

      for (let i = 0; i < count; i++) {
        // Compute position on the targeted block face
        let px = x + nx * 0.51;
        let py = y + ny * 0.51;
        let pz = z + nz * 0.51;

        // Tangent distribution across the face area
        if (nx !== 0) {
          py += (Math.random() - 0.5) * 0.7;
          pz += (Math.random() - 0.5) * 0.7;
        } else if (ny !== 0) {
          px += (Math.random() - 0.5) * 0.7;
          pz += (Math.random() - 0.5) * 0.7;
        } else {
          px += (Math.random() - 0.5) * 0.7;
          py += (Math.random() - 0.5) * 0.7;
        }

        // Outward velocity primarily along normal + slight spread
        const vx = nx * (0.8 + Math.random() * 0.6) + (Math.random() - 0.5) * 0.8;
        const vy = ny * (0.8 + Math.random() * 0.6) + Math.random() * 0.9;
        const vz = nz * (0.8 + Math.random() * 0.6) + (Math.random() - 0.5) * 0.8;

        const maxLife = 0.22 + Math.random() * 0.12; // 0.22s to 0.34s
        const hex = getBlockColor(type, ny > 0 && Math.random() < 0.35);

        newParticles.push({
          position: new Vector3(px, py, pz),
          velocity: new Vector3(vx, vy, vz),
          color: new Color(hex),
          life: maxLife,
          maxLife: maxLife,
          scale: 0.55 + Math.random() * 0.35, // tiny cubic fragments
        });
      }

      particlesRef.current = [...particlesRef.current, ...newParticles].slice(-MAX_PARTICLES);
    };

    // 2. BREAK PARTICLES (burst on block destruction)
    const handleBreak = (e: Event) => {
      const customEvent = e as CustomEvent<{
        x: number;
        y: number;
        z: number;
        type: BlockType;
      }>;
      const { x, y, z, type } = customEvent.detail;

      // 20 tiny voxel particles bursting from the block
      const count = 20;
      const newParticles: Particle[] = [];

      for (let i = 0; i < count; i++) {
        const hex = getBlockColor(type);
        const maxLife = 0.35 + Math.random() * 0.2; // 0.35s to 0.55s

        newParticles.push({
          position: new Vector3(
            x + (Math.random() - 0.5) * 0.75,
            y + (Math.random() - 0.5) * 0.75,
            z + (Math.random() - 0.5) * 0.75
          ),
          velocity: new Vector3(
            (Math.random() - 0.5) * 2.8,
            Math.random() * 2.5 + 1.2,
            (Math.random() - 0.5) * 2.8
          ),
          color: new Color(hex),
          life: maxLife,
          maxLife: maxLife,
          scale: 0.75 + Math.random() * 0.45,
        });
      }

      particlesRef.current = [...particlesRef.current, ...newParticles].slice(-MAX_PARTICLES);
    };

    // 3. PLACEMENT PARTICLES (subtle puff on edges when block is placed)
    const handlePlace = (e: Event) => {
      const customEvent = e as CustomEvent<{
        x: number;
        y: number;
        z: number;
        type: BlockType;
      }>;
      const { x, y, z, type } = customEvent.detail;

      // 7 subtle perimeter particles
      const count = 7;
      const newParticles: Particle[] = [];

      for (let i = 0; i < count; i++) {
        const hex = getBlockColor(type);
        const maxLife = 0.18 + Math.random() * 0.10; // 0.18s to 0.28s

        // Spawn around edges / perimeter of the placed block
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const radius = 0.52 + Math.random() * 0.1;
        const px = x + Math.cos(angle) * radius;
        const py = y + (Math.random() - 0.5) * 0.5;
        const pz = z + Math.sin(angle) * radius;

        newParticles.push({
          position: new Vector3(px, py, pz),
          velocity: new Vector3(
            Math.cos(angle) * 0.8,
            Math.random() * 0.8 + 0.3,
            Math.sin(angle) * 0.8
          ),
          color: new Color(hex),
          life: maxLife,
          maxLife: maxLife,
          scale: 0.5 + Math.random() * 0.3,
        });
      }

      particlesRef.current = [...particlesRef.current, ...newParticles].slice(-MAX_PARTICLES);
    };

    window.addEventListener('block-mining-particles', handleMining);
    window.addEventListener('block-break-particles', handleBreak);
    window.addEventListener('block-place-particles', handlePlace);

    return () => {
      window.removeEventListener('block-mining-particles', handleMining);
      window.removeEventListener('block-break-particles', handleBreak);
      window.removeEventListener('block-place-particles', handlePlace);
    };
  }, []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dt = Math.min(delta, 0.1);
    const active = particlesRef.current;

    if (active.length === 0) {
      if (mesh.visible) {
        mesh.visible = false;
      }
      return;
    }

    mesh.visible = true;

    // Update particles physics and lifetime
    const remaining: Particle[] = [];
    for (let i = 0; i < active.length; i++) {
      const p = active[i];
      p.life -= dt;
      if (p.life > 0) {
        // Natural gravity and velocity
        p.velocity.y -= 11.5 * dt;
        p.position.addScaledVector(p.velocity, dt);

        // Shrink slightly as life drains
        const progress = Math.max(0, p.life / p.maxLife);
        const currentScale = p.scale * progress;

        dummy.position.copy(p.position);
        dummy.scale.set(currentScale, currentScale, currentScale);
        dummy.rotation.x += dt * 3.5;
        dummy.rotation.y += dt * 3.5;
        dummy.updateMatrix();

        mesh.setMatrixAt(remaining.length, dummy.matrix);
        mesh.setColorAt(remaining.length, p.color);
        remaining.push(p);
      }
    }

    particlesRef.current = remaining;
    mesh.count = remaining.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[particleGeo, particleMat, MAX_PARTICLES]}
      visible={false}
      frustumCulled={false}
    />
  );
}
