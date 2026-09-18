const fs = require('fs');
let code = fs.readFileSync('src/components/InventoryUI.tsx', 'utf8');

let bedrockFaceOld = `  if (type === 'bedrock') {
    const bedrockFace = { backgroundImage: \`url(\${TEXTURE_URLS.stone})\`, backgroundColor: '#333333', backgroundBlendMode: 'multiply' };
    return { top: bedrockFace, bottom: bedrockFace, front: bedrockFace, back: bedrockFace, left: bedrockFace, right: bedrockFace };
  }`;
let bedrockFaceNew = `  if (type === 'bedrock') {
    const bedrockFace = { backgroundImage: \`url(\${TEXTURE_URLS.bedrock})\` };
    return { top: bedrockFace, bottom: bedrockFace, front: bedrockFace, back: bedrockFace, left: bedrockFace, right: bedrockFace };
  }`;
code = code.replace(bedrockFaceOld, bedrockFaceNew);
fs.writeFileSync('src/components/InventoryUI.tsx', code);
