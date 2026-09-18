const fs = require('fs');
let code = fs.readFileSync('src/world/textures.ts', 'utf8');

code = code.replace('bedrock: BEDROCK_B64,', 'bedrock: "data:image/png;base64," + BEDROCK_B64,');
fs.writeFileSync('src/world/textures.ts', code);
