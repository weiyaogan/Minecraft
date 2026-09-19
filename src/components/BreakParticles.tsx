import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import {
  InstancedMesh,
  PlaneGeometry,
  ShaderMaterial,
  Object3D,
  Vector3,
  DoubleSide,
  InstancedBufferAttribute,
} from 'three';
import { BlockType } from '../world/blocks';
import { particleAtlasTexture } from '../world/textures';

interface Particle {
  position: Vector3;
  velocity: Vector3;
  life: number;
  maxLife: number;
  baseScale: number;
  uOffset: number;
  vOffset: number;
  uSize: number;
  vSize: number;
  blockCenter: { x: number; y: number; z: number };
  groundY: number;
}

const MAX_PARTICLES = 320;
const dummy = new Object3D();

// 1x1 Plane geometry for camera-facing billboard fragment quads
const particleGeo = new PlaneGeometry(1, 1);
const initialUvBounds = new Float32Array(MAX_PARTICLES * 4);
const uvAttribute = new InstancedBufferAttribute(initialUvBounds, 4);
particleGeo.setAttribute('aUvBounds', uvAttribute);

// Custom ShaderMaterial guaranteeing reliable per-instance UV sampling from particle atlas
const particleShaderMaterial = new ShaderMaterial({
  uniforms: {
    map: { value: particleAtlasTexture },
  },
  vertexShader: `
    attribute vec4 aUvBounds;
    varying vec2 vParticleUv;

    void main() {
      vParticleUv = uv * aUvBounds.zw + aUvBounds.xy;
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D map;
    varying vec2 vParticleUv;

    void main() {
      vec4 texColor = texture2D(map, vParticleUv);
      if (texColor.a < 0.1) discard;
      gl_FragColor = texColor;
    }
  `,
  side: DoubleSide,
  transparent: true,
  depthWrite: true,
  toneMapped: false,
});

/**
 * Returns exact 4x4 texel UV bounds inside the 64x32 Atlas.
 *
 * Atlas Layout (64x32):
 * - Tile (0, 0): Grass Side [px: 0..15, py: 0..15]
 *     Rows 0..2: Green grass overhang dripping over brown dirt
 *     Rows 3..15: Brown dirt with texture specks
 * - Tile (1, 0): Dirt [px: 16..31, py: 0..15]
 *     Authentic variegated earthy browns, dark crevices, and grey rock flecks
 * - Tile (2, 0): Grass Top [px: 32..47, py: 0..15]
 *     Vibrant plains green foliage texture
 * - Tile (3, 0): Stone [px: 48..63, py: 0..15]
 * - Tile (0, 1): Sand [px: 0..15, py: 16..31]
 * - Tile (1, 1): Bedrock [px: 16..31, py: 16..31]
 */
function getParticleUvBounds(
  type: BlockType,
  normal?: [number, number, number],
  isBreak: boolean = false
): { uOffset: number; vOffset: number; uSize: number; vSize: number } {
  let tileX = 16;
  let tileY = 0;
  let subX = 0;
  let subY = 0;

  if (type === 'grass') {
    const isTopFace = Boolean(normal && normal[1] > 0);
    const isSideFace = Boolean(normal && normal[1] === 0);

    if (isSideFace) {
      // Side mining of grass block (strictly matching Reference Image 2):
      // Shows prominent green grass overhang dripping over brown dirt + pure dirt fragments!
      const rand = Math.random();
      if (rand < 0.45) {
        // Rows 0..3 of grass_side: green grass top dripping down over brown dirt
        tileX = 0;
        tileY = 0;
        subX = Math.floor(Math.random() * 13);
        subY = 0; // Topmost row with signature green overhang dripping down
      } else if (rand < 0.65) {
        // Rows 1..4 of grass_side: green overhang tips over dirt
        tileX = 0;
        tileY = 0;
        subX = Math.floor(Math.random() * 13);
        subY = 1;
      } else {
        // Authentic dirt section
        tileX = 16;
        tileY = 0;
        subX = Math.floor(Math.random() * 13);
        subY = Math.floor(Math.random() * 13);
      }
    } else if (isTopFace) {
      // Top mining of grass block (strictly matching Reference Image 1):
      // The surface digging primarily produces dirt particles scattered on top of the grass,
      // with a small proportion of green grass top flecks!
      const rand = Math.random();
      if (rand < 0.82) {
        // Dirt particles: earthy browns, dark brown crevices, grey rock flecks
        tileX = 16;
        tileY = 0;
        subX = Math.floor(Math.random() * 13);
        subY = Math.floor(Math.random() * 13);
      } else if (rand < 0.94) {
        // Green grass top flecks
        tileX = 32;
        tileY = 0;
        subX = Math.floor(Math.random() * 13);
        subY = Math.floor(Math.random() * 13);
      } else {
        // Grass side upper rim
        tileX = 0;
        tileY = 0;
        subX = Math.floor(Math.random() * 13);
        subY = 0;
      }
    } else if (isBreak) {
      // Block destruction burst: balanced mix of green overhang, dirt, and grass top
      const rand = Math.random();
      if (rand < 0.40) {
        // Green overhang over dirt
        tileX = 0;
        tileY = 0;
        subX = Math.floor(Math.random() * 13);
        subY = Math.random() < 0.7 ? 0 : 1;
      } else if (rand < 0.85) {
        // Pure dirt
        tileX = 16;
        tileY = 0;
        subX = Math.floor(Math.random() * 13);
        subY = Math.floor(Math.random() * 13);
      } else {
        // Grass top
        tileX = 32;
        tileY = 0;
        subX = Math.floor(Math.random() * 13);
        subY = Math.floor(Math.random() * 13);
      }
    } else {
      // Bottom face: pure dirt
      tileX = 16;
      tileY = 0;
      subX = Math.floor(Math.random() * 13);
      subY = Math.floor(Math.random() * 13);
    }
  } else if (type === 'dirt') {
    // Dirt: 100% authentic dirt texture chunks with variegated browns and grey rock specks
    tileX = 16;
    tileY = 0;
    subX = Math.floor(Math.random() * 13);
    subY = Math.floor(Math.random() * 13);
  } else if (type === 'stone') {
    tileX = 48;
    tileY = 0;
    subX = Math.floor(Math.random() * 13);
    subY = Math.floor(Math.random() * 13);
  } else if (type === 'sand') {
    tileX = 0;
    tileY = 16;
    subX = Math.floor(Math.random() * 13);
    subY = Math.floor(Math.random() * 13);
  } else if (type === 'bedrock') {
    tileX = 16;
    tileY = 16;
    subX = Math.floor(Math.random() * 13);
    subY = Math.floor(Math.random() * 13);
  }

  const px = tileX + subX;
  const py = tileY + subY;

  return {
    uOffset: px / 64.0,
    vOffset: (32.0 - (py + 4.0)) / 32.0,
    uSize: 4.0 / 64.0,
    vSize: 4.0 / 32.0,
  };
}

export function BreakParticles() {
  const meshRef = useRef<InstancedMesh>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    // 1. MINING PARTICLES: Spawns dense, authentic batch on each hit
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

      // 4 to 7 particles per dig event for a balanced, subtle spray that does not overwhelm the view
      const count = Math.min(7, Math.floor(4 + progress * 2.5));
      const newParticles: Particle[] = [];

      // Ground plane for top face so particles settle and rest on top of the block
      const groundY = ny > 0 ? y + 0.505 : y - 0.495;

      for (let i = 0; i < count; i++) {
        // Spawn right on the targeted face with natural lateral jitter
        let px = x + nx * 0.51;
        let py = y + ny * 0.51;
        let pz = z + nz * 0.51;

        if (nx !== 0) {
          py += (Math.random() - 0.5) * 0.65;
          pz += (Math.random() - 0.5) * 0.65;
        } else if (ny !== 0) {
          px += (Math.random() - 0.5) * 0.65;
          pz += (Math.random() - 0.5) * 0.65;
        } else {
          px += (Math.random() - 0.5) * 0.65;
          py += (Math.random() - 0.5) * 0.65;
        }

        // Outward velocity along normal + modest lateral spread
        const vx = nx * (0.6 + Math.random() * 0.7) + (Math.random() - 0.5) * 0.7;
        const vy = ny > 0
          ? Math.random() * 1.3 + 0.6
          : (ny < 0 ? -Math.random() * 0.7 : Math.random() * 1.2 + 0.4);
        const vz = nz * (0.6 + Math.random() * 0.7) + (Math.random() - 0.5) * 0.7;

        // Lifetime between 0.45s and 0.65s
        const maxLife = 0.45 + Math.random() * 0.20;
        // Refined voxel particle scale (0.095 to 0.13 units) - distinct yet unobtrusive
        const baseScale = 0.095 + Math.random() * 0.035;

        const uv = getParticleUvBounds(type, normal, false);

        newParticles.push({
          position: new Vector3(px, py, pz),
          velocity: new Vector3(vx, vy, vz),
          life: maxLife,
          maxLife,
          baseScale,
          uOffset: uv.uOffset,
          vOffset: uv.vOffset,
          uSize: uv.uSize,
          vSize: uv.vSize,
          blockCenter: { x, y, z },
          groundY,
        });
      }

      particlesRef.current = [...particlesRef.current, ...newParticles].slice(-MAX_PARTICLES);
    };

    // 2. BREAK PARTICLES: 36 textured fragment particles bursting on destruction
    const handleBreak = (e: Event) => {
      const customEvent = e as CustomEvent<{
        x: number;
        y: number;
        z: number;
        type: BlockType;
      }>;
      const { x, y, z, type } = customEvent.detail;

      const count = 22;
      const newParticles: Particle[] = [];
      const groundY = y - 0.495;

      for (let i = 0; i < count; i++) {
        const maxLife = 0.50 + Math.random() * 0.25;
        const baseScale = 0.105 + Math.random() * 0.035;

        const uv = getParticleUvBounds(type, undefined, true);

        newParticles.push({
          position: new Vector3(
            x + (Math.random() - 0.5) * 0.6,
            y + (Math.random() - 0.5) * 0.6,
            z + (Math.random() - 0.5) * 0.6
          ),
          velocity: new Vector3(
            (Math.random() - 0.5) * 2.5,
            Math.random() * 2.2 + 1.0,
            (Math.random() - 0.5) * 2.5
          ),
          life: maxLife,
          maxLife,
          baseScale,
          uOffset: uv.uOffset,
          vOffset: uv.vOffset,
          uSize: uv.uSize,
          vSize: uv.vSize,
          blockCenter: { x, y, z },
          groundY,
        });
      }

      particlesRef.current = [...particlesRef.current, ...newParticles].slice(-MAX_PARTICLES);
    };

    window.addEventListener('block-mining-particles', handleMining);
    window.addEventListener('block-break-particles', handleBreak);

    return () => {
      window.removeEventListener('block-mining-particles', handleMining);
      window.removeEventListener('block-break-particles', handleBreak);
    };
  }, []);

  useFrame((state, delta) => {
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

    // Ensure shader uniforms have texture map set
    if (particleShaderMaterial.uniforms.map.value !== particleAtlasTexture) {
      particleShaderMaterial.uniforms.map.value = particleAtlasTexture;
    }

    const uvAttr = mesh.geometry.getAttribute('aUvBounds') as InstancedBufferAttribute;
    const uvArray = uvAttr.array as Float32Array;
    const cameraQuaternion = state.camera.quaternion;

    const remaining: Particle[] = [];
    for (let i = 0; i < active.length; i++) {
      const p = active[i];
      p.life -= dt;

      if (p.life > 0) {
        // Gravity (13.5 m/s^2) and air drag
        p.velocity.y -= 13.5 * dt;
        p.velocity.x *= Math.pow(0.96, dt * 60);
        p.velocity.z *= Math.pow(0.96, dt * 60);

        p.position.x += p.velocity.x * dt;
        p.position.y += p.velocity.y * dt;
        p.position.z += p.velocity.z * dt;

        // Ground / surface settle collision (matching Reference Image 1):
        // If within block bounds, particle settles on top face
        const dx = Math.abs(p.position.x - p.blockCenter.x);
        const dz = Math.abs(p.position.z - p.blockCenter.z);

        if (dx <= 0.58 && dz <= 0.58) {
          if (p.position.y <= p.groundY) {
            p.position.y = p.groundY;
            p.velocity.y = 0;
            // Floor friction causes particles to slide slightly and then stop, resting on the surface
            p.velocity.x *= Math.pow(0.7, dt * 60);
            p.velocity.z *= Math.pow(0.7, dt * 60);
          }
        }

        // Particle lifecycle: stays at full size initially, then gracefully scales down over final 35% of life
        const lifeRatio = p.life / p.maxLife;
        const scaleMultiplier = lifeRatio < 0.35 ? lifeRatio / 0.35 : 1.0;
        const currentScale = p.baseScale * scaleMultiplier;

        // Camera-aligned billboard orientation:
        // Quad faces camera directly, keeping pixelated texels sharp and square
        dummy.position.copy(p.position);
        dummy.quaternion.copy(cameraQuaternion);
        dummy.scale.set(currentScale, currentScale, 1.0);
        dummy.updateMatrix();

        const idx = remaining.length;
        mesh.setMatrixAt(idx, dummy.matrix);

        // Assign 4x4 texel UV bounds to instance attribute
        uvArray[idx * 4 + 0] = p.uOffset;
        uvArray[idx * 4 + 1] = p.vOffset;
        uvArray[idx * 4 + 2] = p.uSize;
        uvArray[idx * 4 + 3] = p.vSize;

        remaining.push(p);
      }
    }

    particlesRef.current = remaining;
    mesh.count = remaining.length;
    mesh.instanceMatrix.needsUpdate = true;
    uvAttr.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[particleGeo, particleShaderMaterial, MAX_PARTICLES]}
      visible={false}
      frustumCulled={false}
    />
  );
}
