const fs = require('fs');
let code = fs.readFileSync('src/world/textures.ts', 'utf8');

const sImports = `import { TextureLoader, NearestFilter, SRGBColorSpace } from 'three';`;
const rImports = `import { TextureLoader, NearestFilter, SRGBColorSpace, CanvasTexture } from 'three';`;

code = code.replace(sImports, rImports);

const sTextures = `export const stoneTexture = createTexture(STONE_B64);

export const TEXTURE_URLS = {`;

const rTextures = `export const stoneTexture = createTexture(STONE_B64);

// Generate bedrock texture programmatically
const bedrockCanvas = document.createElement('canvas');
bedrockCanvas.width = 16;
bedrockCanvas.height = 16;
const ctx = bedrockCanvas.getContext('2d');
if (ctx) {
  // Bedrock palette
  const colors = ['#111111', '#222222', '#333333', '#444444', '#555555'];
  // Seeded random for consistency
  let seed = 1234;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      // Create noisy clumps by blending current and neighbor noise
      let v = rand() * rand(); // curve towards darker
      let colIdx = Math.floor(v * colors.length);
      // Give it some structured noisiness
      if ((x+y)%5 === 0) colIdx = Math.min(colIdx + 1, colors.length - 1);
      if (rand() > 0.8) colIdx = 0; // spots of pitch black
      
      ctx.fillStyle = colors[colIdx];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}
export const bedrockTexture = new CanvasTexture(bedrockCanvas);
bedrockTexture.magFilter = NearestFilter;
bedrockTexture.minFilter = NearestFilter;
bedrockTexture.colorSpace = SRGBColorSpace;
const BEDROCK_B64 = bedrockCanvas.toDataURL();

export const TEXTURE_URLS = {
  bedrock: BEDROCK_B64,`;

code = code.replace(sTextures, rTextures);
fs.writeFileSync('src/world/textures.ts', code);
