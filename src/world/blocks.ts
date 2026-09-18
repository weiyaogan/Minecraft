export type BlockType = 'grass' | 'stone' | 'dirt' | 'sand' | 'bedrock';

export interface Block {
  x: number;
  y: number;
  z: number;
  type: BlockType;
  createdAt?: number;
}

export interface BlockProperties {
  breakTime: number;
  canBreakByHand: boolean;
  requiresTool: boolean;
  requiredToolType: string | null;
  drops: BlockType | null;
  dropCount: number;
  
}

export const BLOCK_PROPERTIES: Record<BlockType, BlockProperties> = {
  grass: {
    breakTime: 0.9,
    canBreakByHand: true,
    requiresTool: false,
    requiredToolType: null,
    drops: 'dirt',
    dropCount: 1,
    
  },
  dirt: {
    breakTime: 0.75,
    canBreakByHand: true,
    requiresTool: false,
    requiredToolType: null,
    drops: 'dirt',
    dropCount: 1,
    
  },
  stone: {
    breakTime: 7.5,
    canBreakByHand: true,
    requiresTool: true,
    requiredToolType: 'pickaxe',
    drops: 'stone',
    dropCount: 1,
    
  },
  bedrock: {
    breakTime: Infinity,
    canBreakByHand: false,
    requiresTool: false,
    requiredToolType: null,
    drops: null,
    dropCount: 0,
  },
  sand: {
    breakTime: 0.75,
    canBreakByHand: true,
    requiresTool: false,
    requiredToolType: null,
    drops: 'sand',
    dropCount: 1,
    
  },
};

// Generate a simple 5x5 platform
export const WORLD_BLOCKS: Block[] = [];

// Generate a 20x20 island with some varied height
for (let x = -10; x <= 10; x++) {
  for (let z = -10; z <= 10; z++) {
    // Distance from center for island shape
    const dist = Math.sqrt(x*x + z*z);
    if (dist > 10.5) continue; // Circular island

    let height = 0;
    
    // Add a hill in the center
    if (dist < 4) {
      height = Math.floor(4 - dist);
    }
    
    // Base block
    WORLD_BLOCKS.push({ x, y: height, z, type: height > 1 ? 'stone' : 'grass' });
    
    // Fill dirt underneath
    for (let y = height - 1; y >= -2; y--) {
      WORLD_BLOCKS.push({ x, y, z, type: 'dirt' });
    }
    // Bedrock bottom
    WORLD_BLOCKS.push({ x, y: -3, z, type: 'bedrock' });
  }
}
