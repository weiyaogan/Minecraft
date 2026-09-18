const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerHand.tsx', 'utf8');

const sAnimBlock = `    if (offhandGroupRef.current && offhandItem) {
      if (isOffhandPlacingRecently) {
        isOffhandSwingingRef.current = true;
        offhandSwingProgressRef.current += delta * 6.0;
      } else {
        isOffhandSwingingRef.current = false;
        offhandSwingProgressRef.current = 0;
      }
      
      const pOff = offhandSwingProgressRef.current % 1;
      const offSwingArch = isOffhandSwingingRef.current ? Math.sin(pOff * Math.PI) : 0;
      
      const offRotX = offSwingArch * 0.60;
      const offRotY = -offSwingArch * 0.30;
      const offRotZ = offSwingArch * 0.20;
      
      const offOffsetX = offSwingArch * 0.15;
      const offOffsetY = -offSwingArch * 0.15;
      const offOffsetZ = -offSwingArch * 0.25;
      
      const offBaseX = -halfWidthAtDepth * 0.8;
      const offBaseY = -halfHeightAtDepth * 1.0;
      
      offhandGroupRef.current.position.set(
        offBaseX + offOffsetX,
        offBaseY + offOffsetY,
        baseZ + offOffsetZ
      );
      
      offhandGroupRef.current.rotation.set(
        0.2 + offRotX,
        0.7 + offRotY,
        -0.15 + offRotZ
      );
    }`;

const rAnimBlock = `    if (offhandGroupRef.current && offhandItem) {
      if (isOffhandPlacingRecently) {
        isOffhandSwingingRef.current = true;
        offhandSwingProgressRef.current += delta * 6.0;
      } else {
        isOffhandSwingingRef.current = false;
        offhandSwingProgressRef.current = 0;
      }
      
      const pOff = offhandSwingProgressRef.current % 1;
      const offSwingArch = isOffhandSwingingRef.current ? Math.sin(pOff * Math.PI) : 0;
      
      // Exact mirror of right hand math
      const offRotX = offSwingArch * 0.60;
      const offRotY = -offSwingArch * 0.30;
      const offRotZ = offSwingArch * 0.20;
      
      // X negated to mirror movement
      const offOffsetX = offSwingArch * 0.15; 
      const offOffsetY = -offSwingArch * 0.15;
      const offOffsetZ = -offSwingArch * 0.25;
      
      // Exact mirror of right hand base
      const offBaseX = -halfWidthAtDepth * 0.8;
      const offBaseY = -halfHeightAtDepth * 1.0;
      
      offhandGroupRef.current.position.set(
        offBaseX + offOffsetX,
        offBaseY + offOffsetY,
        baseZ + offOffsetZ
      );
      
      offhandGroupRef.current.rotation.set(
        0.2 + offRotX,
        0.7 + offRotY,
        -0.15 + offRotZ
      );
    }`;

code = code.replace(sAnimBlock, rAnimBlock);
fs.writeFileSync('src/components/PlayerHand.tsx', code);
