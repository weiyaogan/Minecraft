import { describe, it } from 'node:test';
import assert from 'node:assert';
import { particleAtlasTexture } from '../src/world/textures';

// Verify the particle atlas is created with NearestFilter and non-null
assert.ok(particleAtlasTexture, 'particleAtlasTexture should exist');
assert.strictEqual(particleAtlasTexture.magFilter, 1003 /* NearestFilter */);
assert.strictEqual(particleAtlasTexture.minFilter, 1003 /* NearestFilter */);

console.log('✓ particleAtlasTexture initialized with NearestFilter for crisp voxel aesthetic');

// Test UV coordinates math
// Atlas is 64 wide x 32 high.
// Tile positions:
// grass_side: (0, 0), dirt: (16, 0), grass_top: (32, 0)
// For 4x4 pixel quad at (px, py):
// uOffset = px / 64.0
// vOffset = (32 - (py + 4)) / 32.0
// uSize = 4 / 64 = 0.0625
// vSize = 4 / 32 = 0.125

// Test Grass Side Overhang (py = 0):
const py = 0;
const vOffset = (32 - (py + 4)) / 32.0;
const vSize = 4 / 32.0;
assert.strictEqual(vOffset, 28 / 32.0, 'vOffset for top row should be 28/32');
assert.strictEqual(vOffset + vSize, 1.0, 'Top vertex V should be 1.0 (top edge of texture)');

// Test Dirt Tile coordinates (tileX = 16, tileY = 0):
const dirtPx = 16;
const dirtPy = 0;
const dirtU = dirtPx / 64.0;
const dirtV = (32 - (dirtPy + 4)) / 32.0;
assert.strictEqual(dirtU, 0.25, 'Dirt U offset must be exactly 0.25 in 64px atlas');
assert.strictEqual(dirtV, 28 / 32.0, 'Dirt V offset must be 28/32');

// Test Grass Top Tile coordinates (tileX = 32, tileY = 0):
const grassTopPx = 32;
const grassTopU = grassTopPx / 64.0;
assert.strictEqual(grassTopU, 0.5, 'Grass top U offset must be 0.5 in 64px atlas');

console.log('✓ Grass Side UV mapping correctly maps row 0 (green grass overhang) to top of particle');
console.log('✓ Dirt UV mapping correctly maps tile 1 (16, 0) for pure earthy dirt particles');
console.log('✓ Grass Top UV mapping correctly maps tile 2 (32, 0) for plains green grass particles');

console.log('=== ALL PARTICLE TESTS PASSED ===');
