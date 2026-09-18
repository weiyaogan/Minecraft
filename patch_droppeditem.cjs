const fs = require('fs');
let code = fs.readFileSync('src/components/DroppedItemView.tsx', 'utf8');

const sOld = `    if (item.type === 'bedrock') {
      return <meshStandardMaterial map={stoneTexture} color="#333333" />;
    }`;

const rNew = `    if (item.type === 'bedrock') {
      return <meshStandardMaterial map={bedrockTexture} />;
    }`;

code = code.replace(sOld, rNew);
fs.writeFileSync('src/components/DroppedItemView.tsx', code);
