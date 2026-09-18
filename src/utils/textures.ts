import { CanvasTexture, NearestFilter } from 'three';

let crackTexturesCache: CanvasTexture[] | null = null;

export function getCrackTextures(): CanvasTexture[] {
  if (crackTexturesCache) return crackTexturesCache;

  const textures: CanvasTexture[] = [];
  
  // The predefined crack path pixels for a 16x16 grid
  const crackPixels = [
    // Center origin
    [7, 7], [8, 7], [7, 8], [8, 8],
    
    // Main branch 1 (up-left)
    [6, 6], [5, 5], [5, 4], [4, 4], [4, 3], [3, 2], [2, 2], [1, 1], [0, 1],
    
    // Main branch 2 (down-right)
    [9, 9], [10, 10], [10, 11], [11, 11], [11, 12], [12, 13], [13, 13], [14, 14], [15, 14],
    
    // Main branch 3 (right, slightly up)
    [9, 7], [10, 7], [11, 6], [12, 6], [13, 5], [14, 5], [15, 6],
    
    // Main branch 4 (down-left)
    [7, 9], [6, 9], [5, 10], [5, 11], [4, 12], [3, 12], [3, 13], [2, 14], [1, 14],
    
    // Branch 5 (straight up)
    [7, 6], [8, 5], [8, 4], [7, 3], [8, 2], [8, 1], [7, 0],
    
    // Minor branch off 1
    [4, 6], [3, 7], [2, 7], [1, 8], [0, 8],
    
    // Minor branch off 2
    [10, 9], [11, 8], [12, 9], [13, 9],
    
    // Minor branch off 4
    [6, 12], [7, 13], [8, 13], [9, 14], [10, 15],
    
    // Extra splinters
    [5, 2], [6, 2], [10, 3], [11, 2], [14, 10], [15, 10]
  ];

  for (let i = 0; i < 10; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Clear with fully transparent
      ctx.clearRect(0, 0, 16, 16);
      
      // Black pixels for the crack
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      
      // Calculate how many pixels to draw based on the current stage
      // Stage 0 has a few pixels, Stage 9 has all of them
      const maxPixels = Math.floor((crackPixels.length * (i + 1)) / 10);
      
      for (let j = 0; j < maxPixels; j++) {
        const [px, py] = crackPixels[j];
        ctx.fillRect(px, py, 1, 1);
        
        // Make it slightly thicker occasionally to look more organic
        if (j % 5 === 0) {
          ctx.fillRect(px + 1, py, 1, 1);
        }
      }
    }

    const texture = new CanvasTexture(canvas);
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    textures.push(texture);
  }
  
  crackTexturesCache = textures;
  return textures;
}
