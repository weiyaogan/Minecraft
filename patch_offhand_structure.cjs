const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerHand.tsx', 'utf8');

const sBlock = `{offhandItem && (
        <group ref={offhandGroupRef} position={[-0.8, -0.6, -0.6]} rotation={[0.2, 0.7, -0.15]} scale={[0.7, 0.7, 0.7]}>
          <group position={[0, -0.05, 0]}>
          <mesh renderOrder={999}>`;

const rBlock = `{offhandItem && (
        <group ref={offhandGroupRef}>
          <group position={[0, -0.05, 0]} scale={[0.7, 0.7, 0.7]}>
          <mesh renderOrder={999}>`;

code = code.replace(sBlock, rBlock);
fs.writeFileSync('src/components/PlayerHand.tsx', code);
