import { CanvasTexture, NearestFilter, SRGBColorSpace, MeshStandardMaterial } from 'three';

// Utility to create a crisp pixelated CanvasTexture
function createPixelTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  if (typeof document === 'undefined') {
    return new CanvasTexture({} as any);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    draw(ctx);
  }
  const tex = new CanvasTexture(canvas);
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

// -------------------------------------------------------------
// STEVE CANONICAL PALETTE
// -------------------------------------------------------------
const SKIN_BASE = '#b88266';
const SKIN_LIGHT = '#c79277';
const SKIN_DARK = '#a16d53';
const SKIN_SHADOW = '#8a5940';

const HAIR_BASE = '#452e1b';
const HAIR_LIGHT = '#553a23';
const HAIR_DARK = '#342112';

const EYE_WHITE = '#ffffff';
const EYE_PUPIL = '#3b388b';

const MOUTH_BASE = '#442817';
const NOSE_BASE = '#96634b';

const SHIRT_BASE = '#00a3a6';
const SHIRT_LIGHT = '#0fb5b8';
const SHIRT_DARK = '#008e91';
const SHIRT_SHADOW = '#007b7e';

const PANTS_BASE = '#3d3782';
const PANTS_LIGHT = '#4a4497';
const PANTS_DARK = '#312b6e';
const PANTS_SHADOW = '#251f58';

const SHOE_BASE = '#4a4a4a';
const SHOE_LIGHT = '#585858';
const SHOE_DARK = '#383838';

// Helper to fill noise pixels
function fillPixelNoise(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: string[],
  seed = 42
) {
  let s = seed;
  const pseudoRandom = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = Math.floor(pseudoRandom() * palette.length);
      ctx.fillStyle = palette[idx];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// -------------------------------------------------------------
// 1. HEAD TEXTURES (8x8 pixels per face)
// -------------------------------------------------------------
// Face indices: 0:+X(Right), 1:-X(Left), 2:+Y(Top), 3:-Y(Bottom), 4:+Z(Front), 5:-Z(Back)
export function createSteveHeadMaterials(): MeshStandardMaterial[] {
  // Front Face (+Z): Hair, forehead, eyes, nose, mouth/goatee, chin
  const frontTex = createPixelTexture(8, 8, (ctx) => {
    // Fill base skin
    fillPixelNoise(ctx, 8, 8, [SKIN_BASE, SKIN_LIGHT, SKIN_DARK], 101);

    // Hair band across top 2 rows
    ctx.fillStyle = HAIR_BASE;
    ctx.fillRect(0, 0, 8, 2);
    ctx.fillStyle = HAIR_LIGHT;
    ctx.fillRect(2, 0, 3, 1);
    ctx.fillStyle = HAIR_DARK;
    ctx.fillRect(6, 1, 2, 1);

    // Hair temples (sides of row 2)
    ctx.fillStyle = HAIR_BASE;
    ctx.fillRect(0, 2, 1, 2);
    ctx.fillRect(7, 2, 1, 2);

    // Eyes at row 4: Cols 1-2 (left eye), Cols 5-6 (right eye)
    // Left eye (looking from outside): white at col 1, blue-purple at col 2
    ctx.fillStyle = EYE_WHITE;
    ctx.fillRect(1, 4, 1, 1);
    ctx.fillStyle = EYE_PUPIL;
    ctx.fillRect(2, 4, 1, 1);

    // Right eye: blue-purple at col 5, white at col 6
    ctx.fillStyle = EYE_PUPIL;
    ctx.fillRect(5, 4, 1, 1);
    ctx.fillStyle = EYE_WHITE;
    ctx.fillRect(6, 4, 1, 1);

    // Nose at row 5 (cols 3-4)
    ctx.fillStyle = NOSE_BASE;
    ctx.fillRect(3, 5, 2, 1);

    // Goatee/mouth at rows 6-7
    ctx.fillStyle = MOUTH_BASE;
    ctx.fillRect(2, 6, 4, 1);
    ctx.fillRect(2, 7, 4, 1);
    ctx.fillStyle = SKIN_SHADOW;
    ctx.fillRect(3, 6, 2, 1); // mouth center
  });

  // Top Face (+Y): Full hair
  const topTex = createPixelTexture(8, 8, (ctx) => {
    fillPixelNoise(ctx, 8, 8, [HAIR_BASE, HAIR_LIGHT, HAIR_DARK], 102);
  });

  // Bottom Face (-Y): Neck skin
  const bottomTex = createPixelTexture(8, 8, (ctx) => {
    fillPixelNoise(ctx, 8, 8, [SKIN_BASE, SKIN_DARK, SKIN_SHADOW], 103);
  });

  // Back Face (-Z): Full hair
  const backTex = createPixelTexture(8, 8, (ctx) => {
    fillPixelNoise(ctx, 8, 8, [HAIR_BASE, HAIR_LIGHT, HAIR_DARK], 104);
  });

  // Right Face (+X): Hair on top and back, skin on face edge/ear
  const rightTex = createPixelTexture(8, 8, (ctx) => {
    fillPixelNoise(ctx, 8, 8, [HAIR_BASE, HAIR_LIGHT, HAIR_DARK], 105);
    // Lower front side skin
    ctx.fillStyle = SKIN_BASE;
    ctx.fillRect(0, 3, 4, 5);
    ctx.fillStyle = SKIN_LIGHT;
    ctx.fillRect(1, 4, 2, 2); // ear highlight
    ctx.fillStyle = SKIN_SHADOW;
    ctx.fillRect(0, 6, 2, 2); // jawline
  });

  // Left Face (-X): Hair on top and back, skin on face edge/ear
  const leftTex = createPixelTexture(8, 8, (ctx) => {
    fillPixelNoise(ctx, 8, 8, [HAIR_BASE, HAIR_LIGHT, HAIR_DARK], 106);
    // Lower front side skin (mirrored)
    ctx.fillStyle = SKIN_BASE;
    ctx.fillRect(4, 3, 4, 5);
    ctx.fillStyle = SKIN_LIGHT;
    ctx.fillRect(5, 4, 2, 2); // ear highlight
    ctx.fillStyle = SKIN_SHADOW;
    ctx.fillRect(6, 6, 2, 2); // jawline
  });

  const makeMat = (map: CanvasTexture) => new MeshStandardMaterial({
    map,
    roughness: 0.9,
    metalness: 0.05,
  });

  return [
    makeMat(rightTex),  // +X
    makeMat(leftTex),   // -X
    makeMat(topTex),    // +Y
    makeMat(bottomTex), // -Y
    makeMat(frontTex),  // +Z
    makeMat(backTex),   // -Z
  ];
}

// -------------------------------------------------------------
// 2. TORSO TEXTURES (8 wide, 12 tall, 4 deep)
// -------------------------------------------------------------
export function createSteveTorsoMaterials(): MeshStandardMaterial[] {
  // Front Face (+Z: 8x12): Cyan shirt with V-neck and untucked hem
  const frontTex = createPixelTexture(8, 12, (ctx) => {
    // Shirt base
    fillPixelNoise(ctx, 8, 12, [SHIRT_BASE, SHIRT_LIGHT, SHIRT_DARK], 201);

    // V-neck collar at top
    // Row 0: cols 3-4 skin
    ctx.fillStyle = SKIN_SHADOW;
    ctx.fillRect(3, 0, 2, 1);
    // Row 1: cols 2-5 skin
    ctx.fillStyle = SKIN_BASE;
    ctx.fillRect(2, 1, 4, 1);
    // Row 2: cols 3-4 skin
    ctx.fillStyle = SKIN_LIGHT;
    ctx.fillRect(3, 2, 2, 1);

    // Untucked shirt hem at bottom (rows 10-11):
    // Cols 4-7 reveal the deep blue pants/belt
    ctx.fillStyle = PANTS_DARK;
    ctx.fillRect(4, 10, 4, 2);
    ctx.fillStyle = PANTS_BASE;
    ctx.fillRect(5, 10, 2, 1);
  });

  // Back Face (-Z: 8x12): Full cyan shirt
  const backTex = createPixelTexture(8, 12, (ctx) => {
    fillPixelNoise(ctx, 8, 12, [SHIRT_BASE, SHIRT_LIGHT, SHIRT_DARK], 202);
    // Subtle folds near bottom
    ctx.fillStyle = SHIRT_SHADOW;
    ctx.fillRect(1, 10, 6, 1);
  });

  // Sides (+X and -X: 4x12): Cyan shirt sides
  const sideRightTex = createPixelTexture(4, 12, (ctx) => {
    fillPixelNoise(ctx, 4, 12, [SHIRT_BASE, SHIRT_LIGHT, SHIRT_DARK], 203);
  });
  const sideLeftTex = createPixelTexture(4, 12, (ctx) => {
    fillPixelNoise(ctx, 4, 12, [SHIRT_BASE, SHIRT_LIGHT, SHIRT_DARK], 204);
  });

  // Top Face (+Y: 8x4): Cyan shirt shoulders with skin neck cutout
  const topTex = createPixelTexture(8, 4, (ctx) => {
    fillPixelNoise(ctx, 8, 4, [SHIRT_BASE, SHIRT_LIGHT, SHIRT_DARK], 205);
    // Neck center cutout
    ctx.fillStyle = SKIN_SHADOW;
    ctx.fillRect(2, 1, 4, 2);
  });

  // Bottom Face (-Y: 8x4): Pants waistline
  const bottomTex = createPixelTexture(8, 4, (ctx) => {
    fillPixelNoise(ctx, 8, 4, [PANTS_BASE, PANTS_DARK, PANTS_SHADOW], 206);
  });

  const makeMat = (map: CanvasTexture) => new MeshStandardMaterial({
    map,
    roughness: 0.9,
    metalness: 0.05,
  });

  return [
    makeMat(sideRightTex), // +X
    makeMat(sideLeftTex),  // -X
    makeMat(topTex),       // +Y
    makeMat(bottomTex),    // -Y
    makeMat(frontTex),     // +Z
    makeMat(backTex),      // -Z
  ];
}

// -------------------------------------------------------------
// 3. ARM TEXTURES (4 wide, 12 tall, 4 deep)
// -------------------------------------------------------------
// Top 4 rows (rows 0-3) = Cyan sleeve
// Bottom 8 rows (rows 4-11) = Skin
export function createSteveArmMaterials(isLeft = false): MeshStandardMaterial[] {
  const seedBase = isLeft ? 350 : 300;

  const makeSideTex = (seedOffset: number) => createPixelTexture(4, 12, (ctx) => {
    // Upper 4 rows: Cyan sleeve
    fillPixelNoise(ctx, 4, 4, [SHIRT_BASE, SHIRT_LIGHT, SHIRT_DARK], seedBase + seedOffset);
    // Lower 8 rows: Skin
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 4;
    tempCanvas.height = 8;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      fillPixelNoise(tempCtx, 4, 8, [SKIN_BASE, SKIN_LIGHT, SKIN_DARK], seedBase + seedOffset + 10);
      ctx.drawImage(tempCanvas, 0, 4);
    }
  });

  const frontTex = makeSideTex(1);
  const backTex = makeSideTex(2);
  const rightTex = makeSideTex(3);
  const leftTex = makeSideTex(4);

  // Top Face (+Y: 4x4): Cyan sleeve shoulder
  const topTex = createPixelTexture(4, 4, (ctx) => {
    fillPixelNoise(ctx, 4, 4, [SHIRT_BASE, SHIRT_LIGHT, SHIRT_DARK], seedBase + 5);
  });

  // Bottom Face (-Y: 4x4): Skin hand palm
  const bottomTex = createPixelTexture(4, 4, (ctx) => {
    fillPixelNoise(ctx, 4, 4, [SKIN_BASE, SKIN_DARK, SKIN_SHADOW], seedBase + 6);
  });

  const makeMat = (map: CanvasTexture) => new MeshStandardMaterial({
    map,
    roughness: 0.9,
    metalness: 0.05,
  });

  return [
    makeMat(rightTex),  // +X
    makeMat(leftTex),   // -X
    makeMat(topTex),    // +Y
    makeMat(bottomTex), // -Y
    makeMat(frontTex),  // +Z
    makeMat(backTex),   // -Z
  ];
}

// -------------------------------------------------------------
// 4. LEG TEXTURES (4 wide, 12 tall, 4 deep)
// -------------------------------------------------------------
// Top 10 rows (rows 0-9) = Blue jeans
// Bottom 2 rows (rows 10-11) = Dark gray shoes
export function createSteveLegMaterials(isLeft = false): MeshStandardMaterial[] {
  const seedBase = isLeft ? 450 : 400;

  const makeSideTex = (seedOffset: number) => createPixelTexture(4, 12, (ctx) => {
    // Upper 10 rows: Blue jeans
    fillPixelNoise(ctx, 4, 10, [PANTS_BASE, PANTS_LIGHT, PANTS_DARK], seedBase + seedOffset);
    // Lower 2 rows: Gray shoes
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 4;
    tempCanvas.height = 2;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      fillPixelNoise(tempCtx, 4, 2, [SHOE_BASE, SHOE_LIGHT, SHOE_DARK], seedBase + seedOffset + 10);
      ctx.drawImage(tempCanvas, 0, 10);
    }
  });

  const frontTex = makeSideTex(1);
  const backTex = makeSideTex(2);
  const rightTex = makeSideTex(3);
  const leftTex = makeSideTex(4);

  // Top Face (+Y: 4x4): Blue jeans hip
  const topTex = createPixelTexture(4, 4, (ctx) => {
    fillPixelNoise(ctx, 4, 4, [PANTS_BASE, PANTS_DARK, PANTS_SHADOW], seedBase + 5);
  });

  // Bottom Face (-Y: 4x4): Dark gray shoe sole
  const bottomTex = createPixelTexture(4, 4, (ctx) => {
    fillPixelNoise(ctx, 4, 4, [SHOE_DARK, SHOE_BASE, '#2a2a2a'], seedBase + 6);
  });

  const makeMat = (map: CanvasTexture) => new MeshStandardMaterial({
    map,
    roughness: 0.9,
    metalness: 0.05,
  });

  return [
    makeMat(rightTex),  // +X
    makeMat(leftTex),   // -X
    makeMat(topTex),    // +Y
    makeMat(bottomTex), // -Y
    makeMat(frontTex),  // +Z
    makeMat(backTex),   // -Z
  ];
}
