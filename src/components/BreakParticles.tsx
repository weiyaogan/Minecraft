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

const PARTICLE_COLORS: Record<BlockType, string[]> = {
  grass: ['#4d8c28', '#3e7020', '#7a5a3a', '#5c432b'],
  dirt: ['#7a5a3a', '#5c432b', '#8f6843', '#4a3622'],
  stone: ['#7d7d7d', '#636363', '#969696', '#545454'],
  sand: ['#ded49b', '#c7bc83', '#ede3ab', '#b0a671'],
  bedrock: ['#303030', '#202020', '#424242', '#151515'],
};

const MAX_PARTICLES = 64;
const dummy = new Object3D();
const particleGeo = new BoxGeometry(0.08, 0.08, 0.08);
const particleMat = new MeshBasicMaterial();

export function BreakParticles() {
  const meshRef = useRef<InstancedMesh>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const handleSpawn = (e: Event) => {
      const customEvent = e as CustomEvent<{
        x: number;
        y: number;
        z: number;
        type: BlockType;
      }>;
      const { x, y, z, type } = customEvent.detail;
      const colors = PARTICLE_COLORS[type] || PARTICLE_COLORS.dirt;

      // Spawn 16 subtle voxel particles
      const newParticles: Particle[] = [];
      for (let i = 0; i < 16; i++) {
        const hex = colors[Math.floor(Math.random() * colors.length)];
        const maxLife = 0.35 + Math.random() * 0.2; // 0.35s - 0.55s
        newParticles.push({
          position: new Vector3(
            x + (Math.random() - 0.5) * 0.75,
            y + (Math.random() - 0.5) * 0.75,
            z + (Math.random() - 0.5) * 0.75
          ),
          velocity: new Vector3(
            (Math.random() - 0.5) * 2.6,
            Math.random() * 2.4 + 1.0,
            (Math.random() - 0.5) * 2.6
          ),
          color: new Color(hex),
          life: maxLife,
          maxLife: maxLife,
          scale: 0.7 + Math.random() * 0.5,
        });
      }

      // Append and cap at MAX_PARTICLES to prevent unbounded growth
      particlesRef.current = [...particlesRef.current, ...newParticles].slice(-MAX_PARTICLES);
    };

    window.addEventListener('block-break-particles', handleSpawn);
    return () => {
      window.removeEventListener('block-break-particles', handleSpawn);
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

    // Update particles physics and life
    const remaining: Particle[] = [];
    for (let i = 0; i < active.length; i++) {
      const p = active[i];
      p.life -= dt;
      if (p.life > 0) {
        // Apply gravity and velocity
        p.velocity.y -= 12.0 * dt;
        p.position.addScaledVector(p.velocity, dt);

        // Calculate shrink scale
        const progress = Math.max(0, p.life / p.maxLife);
        const currentScale = p.scale * progress;

        dummy.position.copy(p.position);
        dummy.scale.set(currentScale, currentScale, currentScale);
        dummy.rotation.x += dt * 3.0;
        dummy.rotation.y += dt * 3.0;
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
