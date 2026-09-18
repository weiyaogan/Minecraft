const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerHand.tsx', 'utf8');

const sRefs = `export function PlayerHand() {
  const groupRef = useRef<Group>(null);
  const { size, camera } = useThree();
  
  const swingProgressRef = useRef(0);
  const isSwingingRef = useRef(false);`;

const rRefs = `export function PlayerHand() {
  const groupRef = useRef<Group>(null);
  const offhandGroupRef = useRef<Group>(null);
  const { size, camera } = useThree();
  
  const swingProgressRef = useRef(0);
  const isSwingingRef = useRef(false);
  
  const offhandSwingProgressRef = useRef(0);
  const isOffhandSwingingRef = useRef(false);`;
code = code.replace(sRefs, rRefs);

const sFrame = `    const isMining = useWorldStore.getState().isMining;
    const lastPlacedTime = useWorldStore.getState().lastPlacedTime;
    const timeSincePlace = performance.now() - lastPlacedTime;
    const isPlacingRecently = timeSincePlace < 180;
    
    const aspect = size.width / Math.max(size.height, 1);`;

const rFrame = `    const stateStore = useWorldStore.getState();
    const isMining = stateStore.isMining;
    const lastPlacedTime = stateStore.lastPlacedTime;
    const lastOffhandPlacedTime = stateStore.lastOffhandPlacedTime;
    
    const timeSincePlace = performance.now() - lastPlacedTime;
    const isPlacingRecently = timeSincePlace < 180;
    
    const timeSinceOffhandPlace = performance.now() - lastOffhandPlacedTime;
    const isOffhandPlacingRecently = timeSinceOffhandPlace < 180;
    
    const aspect = size.width / Math.max(size.height, 1);`;
code = code.replace(sFrame, rFrame);

const sAnim = `    if (heldItem) {
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

const rAnim = `    if (heldItem) {
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
      
      // Base offhand position
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
code = code.replace(sAnim, rAnim);


const sJSX = `    {offhandItem && (
        <group position={[-0.8, -0.6, -0.6]} rotation={[0.2, 0.7, -0.15]} scale={[0.5, 0.5, 0.5]}>
          <mesh renderOrder={999}>`;
const rJSX = `    {offhandItem && (
        <group ref={offhandGroupRef} position={[-0.8, -0.6, -0.6]} rotation={[0.2, 0.7, -0.15]} scale={[0.7, 0.7, 0.7]}>
          <group position={[0, -0.05, 0]}>
          <mesh renderOrder={999}>`;
code = code.replace(sJSX, rJSX);

const sJSXEnd = `              </>
            )}
          </mesh>
        </group>
    )}`;
const rJSXEnd = `              </>
            )}
          </mesh>
          </group>
        </group>
    )}`;
code = code.replace(sJSXEnd, rJSXEnd);

fs.writeFileSync('src/components/PlayerHand.tsx', code);
