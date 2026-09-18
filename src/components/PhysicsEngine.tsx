import { useFrame } from '@react-three/fiber';
import { useWorldStore } from '../store';
import { Vector3 } from 'three';

export function PhysicsEngine() {
  // Merge dropped items periodically
  useFrame((_, delta) => {
    // Only run on a fixed interval approx to save perf, use simple timer
    const time = performance.now();
    if (Math.floor(time / 200) % 2 === 0) return; // run roughly every 400ms

    const items = useWorldStore.getState().droppedItems;
    if (items.length < 2) return;
    
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const itemA = items[i];
        const itemB = items[j];
        
        if (itemA.type === itemB.type && itemA.count < 64 && itemB.count > 0) {
          const posA = new Vector3(...itemA.position);
          const posB = new Vector3(...itemB.position);
          
          if (posA.distanceTo(posB) < 1.0) {
            const space = 64 - itemA.count;
            if (space > 0) {
              const toMove = Math.min(space, itemB.count);
              useWorldStore.getState().updateDroppedItem(itemA.id, itemA.count + toMove);
              
              if (toMove === itemB.count) {
                useWorldStore.getState().removeDroppedItem(itemB.id);
              } else {
                useWorldStore.getState().updateDroppedItem(itemB.id, itemB.count - toMove);
              }
              return; // Only merge one pair per frame to prevent race conditions
            }
          }
        }
      }
    }
  });
  return null;
}
