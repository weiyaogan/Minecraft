const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerHand.tsx', 'utf8');

const sAnimBlock = `    if (heldItem) {
      groupRef.current.rotation.set(
        0.2 + swingRotX,
        -0.7 + swingRotY,
        0.15 + swingRotZ
      );
    } else {
      // Point the arm into the screen and slightly leftwards
      groupRef.current.rotation.set(
        -1.2 + swingRotX,  
        0.2 + swingRotY,  
        0.1 + swingRotZ,
        'YXZ'
      );
    }
  });`;

const rAnimBlock = `    if (heldItem) {
      groupRef.current.rotation.set(
        0.2 + swingRotX,
        -0.7 + swingRotY,
        0.15 + swingRotZ
      );
    } else {
      groupRef.current.rotation.set(
        -1.2 + swingRotX,
        0.2 + swingRotY,
        0.1 + swingRotZ,
        'YXZ'
      );
    }

    if (offhandGroupRef.current && offhandItem) {
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
    }
  });`;

code = code.replace(sAnimBlock, rAnimBlock);
fs.writeFileSync('src/components/PlayerHand.tsx', code);
