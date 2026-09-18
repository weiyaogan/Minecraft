const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerHand.tsx', 'utf8');

const sBlock = `    const aspect = size.width / Math.max(size.height, 1);
    const pCam = camera as PerspectiveCamera;
    const fovRad = ((pCam.fov || 75) * Math.PI) / 360;
    
    const anchorZ = heldItem ? 0.6 : 0.3; 
    const halfHeightAtDepth = Math.tan(fovRad) * anchorZ;
    const halfWidthAtDepth = halfHeightAtDepth * aspect;
    
    const baseX = heldItem ? halfWidthAtDepth * 0.8 : halfWidthAtDepth * 1.15;
    // Push base below screen edge so the stump is entirely invisible
    const baseY = heldItem ? -halfHeightAtDepth * 1.0 : -halfHeightAtDepth * 1.35;
    const baseZ = -anchorZ;`;

const rBlock = `    const aspect = size.width / Math.max(size.height, 1);
    const pCam = camera as PerspectiveCamera;
    const fovRad = ((pCam.fov || 75) * Math.PI) / 360;
    
    // Main hand depth and sizing
    const mainAnchorZ = heldItem ? 0.6 : 0.3; 
    const mainHalfHeight = Math.tan(fovRad) * mainAnchorZ;
    const mainHalfWidth = mainHalfHeight * aspect;
    const baseX = heldItem ? mainHalfWidth * 0.8 : mainHalfWidth * 1.15;
    const baseY = heldItem ? -mainHalfHeight * 1.0 : -mainHalfHeight * 1.35;
    const baseZ = -mainAnchorZ;
    
    // Offhand depth and sizing (always block sized)
    const offAnchorZ = 0.6;
    const offHalfHeight = Math.tan(fovRad) * offAnchorZ;
    const offHalfWidth = offHalfHeight * aspect;
    const offBaseZ = -offAnchorZ;`;

code = code.replace(sBlock, rBlock);

const sOffBlock = `      // Exact mirror of right hand base
      const offBaseX = -halfWidthAtDepth * 0.8;
      const offBaseY = -halfHeightAtDepth * 1.0;
      
      offhandGroupRef.current.position.set(
        offBaseX + offOffsetX,
        offBaseY + offOffsetY,
        baseZ + offOffsetZ
      );`;

const rOffBlock = `      // Exact mirror of right hand base using offhand metrics
      const offBaseX = -offHalfWidth * 0.8;
      const offBaseY = -offHalfHeight * 1.0;
      
      offhandGroupRef.current.position.set(
        offBaseX + offOffsetX,
        offBaseY + offOffsetY,
        offBaseZ + offOffsetZ
      );`;

code = code.replace(sOffBlock, rOffBlock);
fs.writeFileSync('src/components/PlayerHand.tsx', code);
