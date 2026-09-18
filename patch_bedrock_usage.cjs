const fs = require('fs');
let code;

// VoxelBlock.tsx
code = fs.readFileSync('src/components/VoxelBlock.tsx', 'utf8');
code = code.replace(`import { grassTopTexture, grassSideTexture, dirtTexture, stoneTexture } from '../world/textures';`, `import { grassTopTexture, grassSideTexture, dirtTexture, stoneTexture, bedrockTexture } from '../world/textures';`);
code = code.replace(`{type === 'bedrock' && <meshStandardMaterial map={stoneTexture} color="#333333" attach="material" />}`, `{type === 'bedrock' && <meshStandardMaterial map={bedrockTexture} attach="material" />}`);
fs.writeFileSync('src/components/VoxelBlock.tsx', code);

// PlayerHand.tsx
code = fs.readFileSync('src/components/PlayerHand.tsx', 'utf8');
code = code.replace(`import { grassTopTexture, dirtTexture, grassSideTexture, stoneTexture } from '../world/textures';`, `import { grassTopTexture, dirtTexture, grassSideTexture, stoneTexture, bedrockTexture } from '../world/textures';`);
code = code.replace(`{heldItem === 'bedrock' && <meshStandardMaterial map={stoneTexture} color="#333333" transparent={true} depthTest={false} depthWrite={false} />}`, `{heldItem === 'bedrock' && <meshStandardMaterial map={bedrockTexture} transparent={true} depthTest={false} depthWrite={false} />}`);
code = code.replace(`{offhandItem === 'bedrock' && <meshStandardMaterial map={stoneTexture} color="#333333" transparent={true} depthTest={false} depthWrite={false} />}`, `{offhandItem === 'bedrock' && <meshStandardMaterial map={bedrockTexture} transparent={true} depthTest={false} depthWrite={false} />}`);
fs.writeFileSync('src/components/PlayerHand.tsx', code);

// DroppedItemView.tsx
code = fs.readFileSync('src/components/DroppedItemView.tsx', 'utf8');
code = code.replace(`import { grassTopTexture, dirtTexture, grassSideTexture, stoneTexture } from '../world/textures';`, `import { grassTopTexture, dirtTexture, grassSideTexture, stoneTexture, bedrockTexture } from '../world/textures';`);
code = code.replace(`{type === 'bedrock' && <meshStandardMaterial map={stoneTexture} color="#333333" attach="material" />}`, `{type === 'bedrock' && <meshStandardMaterial map={bedrockTexture} attach="material" />}`);
fs.writeFileSync('src/components/DroppedItemView.tsx', code);

// Hotbar.tsx
code = fs.readFileSync('src/components/Hotbar.tsx', 'utf8');
let bedrockFaceOld = `  if (type === 'bedrock') {
    const bedrockFace: FaceConfig = {
      backgroundImage: \`url(\${TEXTURE_URLS.stone})\`,
      backgroundColor: '#333333',
      backgroundBlendMode: 'multiply',
    };
    return {
      top: bedrockFace,
      bottom: bedrockFace,
      front: bedrockFace,
      back: bedrockFace,
      left: bedrockFace,
      right: bedrockFace,
    };
  }`;
let bedrockFaceNew = `  if (type === 'bedrock') {
    const bedrockFace: FaceConfig = {
      backgroundImage: \`url(\${TEXTURE_URLS.bedrock})\`,
    };
    return {
      top: bedrockFace,
      bottom: bedrockFace,
      front: bedrockFace,
      back: bedrockFace,
      left: bedrockFace,
      right: bedrockFace,
    };
  }`;
code = code.replace(bedrockFaceOld, bedrockFaceNew);
fs.writeFileSync('src/components/Hotbar.tsx', code);

