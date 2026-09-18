const fs = require('fs');
let code = fs.readFileSync('src/components/VoxelBlock.tsx', 'utf8');

const sOld = `import { grassTopTexture, dirtTexture, grassSideTexture, stoneTexture } from '../world/textures';`;
const rNew = `import { grassTopTexture, dirtTexture, grassSideTexture, stoneTexture, bedrockTexture } from '../world/textures';`;

code = code.replace(sOld, rNew);
fs.writeFileSync('src/components/VoxelBlock.tsx', code);
