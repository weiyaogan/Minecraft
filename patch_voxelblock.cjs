const fs = require('fs');
let code = fs.readFileSync('src/components/VoxelBlock.tsx', 'utf8');

const sOld = `  if (type === 'bedrock') {
    return (
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={stoneTexture} color="#333333" />
      </mesh>
    );
  }`;

const rNew = `  if (type === 'bedrock') {
    return (
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={bedrockTexture} />
      </mesh>
    );
  }`;

code = code.replace(sOld, rNew);
fs.writeFileSync('src/components/VoxelBlock.tsx', code);
