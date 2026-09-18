import { create } from 'zustand';
import { Block, WORLD_BLOCKS, BlockType } from './world/blocks';
import { Vector3 } from 'three';

export interface DroppedItem {
  id: string;
  type: BlockType;
  position: [number, number, number];
  velocity: [number, number, number];
  count: number;
  pickupDelayTicks: number;
}

export interface InventorySlot {
  type: BlockType | null;
  count: number;
}

export interface FallingBlock {
  id: string;
  type: BlockType;
  position: [number, number, number];
  velocity: number;
}

const emptySlot = (): InventorySlot => ({ type: null, count: 0 });
const createEmptySlots = (n: number): InventorySlot[] => Array.from({ length: n }, emptySlot);

interface WorldState {
  blocks: Block[];
  fallingBlocks: FallingBlock[];
  setBlocks: (blocks: Block[]) => void;
  setFallingBlocks: (fallingBlocks: FallingBlock[]) => void;
  removeBlock: (x: number, y: number, z: number) => void;
  addBlock: (x: number, y: number, z: number, type: BlockType) => void;
  isMining: boolean;
  setIsMining: (isMining: boolean) => void;
  
  hotbar: InventorySlot[];
  selectedHotbarSlot: number;
  setSelectedHotbarSlot: (slot: number) => void;
  
  inventory: InventorySlot[];
  offhand: InventorySlot;
  cursorItem: InventorySlot | null;
  hoveredSlot: { container: 'hotbar'|'inventory'|'offhand', index: number } | null;
  isInventoryOpen: boolean;
  
  setInventoryOpen: (isOpen: boolean) => void;
  setCursorItem: (item: InventorySlot | null) => void;
  setHoveredSlot: (slot: { container: 'hotbar'|'inventory'|'offhand', index: number } | null) => void;
  
  addInventory: (type: BlockType, count: number) => number;
  removeInventory: (slot: number, count: number) => void;
  removeOffhand: (count: number) => void;
  
  swapOffhand: () => void;
  clickSlot: (container: 'hotbar'|'inventory'|'offhand', index: number, isRightClick: boolean, isShift: boolean) => void;
  distributeItems: (slots: {container: 'hotbar'|'inventory', index: number}[]) => void;
  
  throwCurrentItem: (dropAll: boolean, playerPos: Vector3, cameraDir: Vector3) => void;
  throwInventoryItem: (container: 'hotbar'|'inventory'|'offhand'|'cursor', index: number, dropAll: boolean, playerPos: Vector3, cameraDir: Vector3) => void;

  droppedItems: DroppedItem[];
  addDroppedItem: (type: BlockType, position: [number, number, number], count: number, velocity?: [number, number, number], pickupDelayTicks?: number) => void;
  removeDroppedItem: (id: string) => void;
  updateDroppedItem: (id: string, count: number) => void;
  
  lastPlacedTime: number;
  lastOffhandPlacedTime: number;
  
  playerFeetPosition: Vector3;
  setPlayerFeetPosition: (pos: Vector3) => void;
  playerHeight: number;
  setPlayerHeight: (height: number) => void;
}

export const useWorldStore = create<WorldState>((set, get) => ({
  blocks: WORLD_BLOCKS,
  fallingBlocks: [],
  setBlocks: (blocks) => set({ blocks }),
  setFallingBlocks: (fallingBlocks) => set({ fallingBlocks }),
  removeBlock: (x, y, z) => set((state) => ({
    blocks: state.blocks.filter(b => !(b.x === x && b.y === y && b.z === z))
  })),
  addBlock: (x, y, z, type) => set((state) => {
    if (state.blocks.some(b => b.x === x && b.y === y && b.z === z)) {
      return state;
    }
    return { blocks: [...state.blocks, { x, y, z, type, createdAt: performance.now() }] };
  }),
  isMining: false,
  setIsMining: (isMining) => set({ isMining }),
  
  hotbar: [
    { type: 'grass', count: 64 },
    { type: 'stone', count: 64 },
    { type: 'dirt', count: 64 },
    emptySlot(), emptySlot(), emptySlot(), emptySlot(), emptySlot(), emptySlot()
  ],
  selectedHotbarSlot: 0,
  setSelectedHotbarSlot: (slot) => set({ selectedHotbarSlot: slot }),
  
  inventory: createEmptySlots(27),
  offhand: emptySlot(),
  cursorItem: null,
  hoveredSlot: null,
  isInventoryOpen: false,
  
  setInventoryOpen: (isOpen) => set((state) => {
    if (!isOpen && state.cursorItem) {
      // Drop the cursor item
      const cameraDir = new Vector3(0, 0, -1); // fallback direction if we can't easily get camera dir here
      const velocity: [number, number, number] = [0, 2, 2]; // drop it a bit forward
      
      const newItem: DroppedItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: state.cursorItem.type!,
        position: [
          state.playerFeetPosition.x,
          state.playerFeetPosition.y + 1.5,
          state.playerFeetPosition.z
        ] as [number, number, number],
        velocity,
        count: state.cursorItem.count,
        pickupDelayTicks: 40,
      };
      
      return { 
        isInventoryOpen: isOpen, 
        cursorItem: null,
        droppedItems: [...state.droppedItems, newItem]
      };
    }
    return { isInventoryOpen: isOpen };
  }),
  setCursorItem: (item) => set({ cursorItem: item }),
  setHoveredSlot: (slot) => set({ hoveredSlot: slot }),
  
  addInventory: (type, count) => {
    let remaining = count;
    set((state) => {
      const newHotbar = [...state.hotbar];
      const newInventory = [...state.inventory];
      
      // 1. Existing stacks in hotbar
      for (let i = 0; i < newHotbar.length; i++) {
        if (newHotbar[i].type === type && newHotbar[i].count < 64) {
          const space = 64 - newHotbar[i].count;
          const add = Math.min(space, remaining);
          newHotbar[i] = { ...newHotbar[i], count: newHotbar[i].count + add };
          remaining -= add;
          if (remaining <= 0) return { hotbar: newHotbar };
        }
      }
      // 2. Existing stacks in inventory
      for (let i = 0; i < newInventory.length; i++) {
        if (newInventory[i].type === type && newInventory[i].count < 64) {
          const space = 64 - newInventory[i].count;
          const add = Math.min(space, remaining);
          newInventory[i] = { ...newInventory[i], count: newInventory[i].count + add };
          remaining -= add;
          if (remaining <= 0) return { hotbar: newHotbar, inventory: newInventory };
        }
      }
      // 3. Empty slots in hotbar
      for (let i = 0; i < newHotbar.length; i++) {
        if (!newHotbar[i].type) {
          const add = Math.min(64, remaining);
          newHotbar[i] = { type, count: add };
          remaining -= add;
          if (remaining <= 0) return { hotbar: newHotbar, inventory: newInventory };
        }
      }
      // 4. Empty slots in inventory
      for (let i = 0; i < newInventory.length; i++) {
        if (!newInventory[i].type) {
          const add = Math.min(64, remaining);
          newInventory[i] = { type, count: add };
          remaining -= add;
          if (remaining <= 0) return { hotbar: newHotbar, inventory: newInventory };
        }
      }
      
      return { hotbar: newHotbar, inventory: newInventory };
    });
    return remaining;
  },
  
  removeOffhand: (count) => set((state) => {
    if (!state.offhand.type) return state;
    const remaining = state.offhand.count - count;
    return { 
      offhand: remaining > 0 ? { ...state.offhand, count: remaining } : { type: null, count: 0 },
      lastOffhandPlacedTime: performance.now()
    };
  }),
  removeInventory: (slotIndex, count) => set((state) => {
    const newHotbar = [...state.hotbar];
    if (newHotbar[slotIndex] && newHotbar[slotIndex].count >= count) {
      newHotbar[slotIndex] = { 
         ...newHotbar[slotIndex], 
         count: newHotbar[slotIndex].count - count,
         type: newHotbar[slotIndex].count - count === 0 ? null : newHotbar[slotIndex].type 
      };
      return { hotbar: newHotbar, lastPlacedTime: performance.now() };
    }
    return state;
  }),
  
  swapOffhand: () => set((state) => {
    const newHotbar = [...state.hotbar];
    const mainHand = newHotbar[state.selectedHotbarSlot];
    const offhand = state.offhand;
    
    newHotbar[state.selectedHotbarSlot] = offhand;
    return { hotbar: newHotbar, offhand: mainHand };
  }),
  
  clickSlot: (container, index, isRightClick, isShift) => set((state) => {
    const getContainer = () => container === 'hotbar' ? [...state.hotbar] : container === 'inventory' ? [...state.inventory] : [state.offhand];
    const setContainer = (arr: InventorySlot[]) => {
        if (container === 'hotbar') return { hotbar: arr };
        if (container === 'inventory') return { inventory: arr };
        return { offhand: arr[0] };
    };

    const arr = getContainer();
    const slot = arr[index];
    let newCursor = state.cursorItem ? { ...state.cursorItem } : null;

    if (isShift) {
        if (!slot.type) return state;
        
        const targetContainerName = container === 'hotbar' ? 'inventory' : 'hotbar';
        const targetArr = targetContainerName === 'hotbar' ? [...state.hotbar] : [...state.inventory];
        
        let remaining = slot.count;
        for (let i = 0; i < targetArr.length; i++) {
            if (targetArr[i].type === slot.type && targetArr[i].count < 64) {
                const space = 64 - targetArr[i].count;
                const toAdd = Math.min(space, remaining);
                targetArr[i] = { ...targetArr[i], count: targetArr[i].count + toAdd };
                remaining -= toAdd;
                if (remaining <= 0) break;
            }
        }
        if (remaining > 0) {
            for (let i = 0; i < targetArr.length; i++) {
                if (!targetArr[i].type) {
                    targetArr[i] = { type: slot.type, count: remaining };
                    remaining = 0;
                    break;
                }
            }
        }
        
        arr[index] = remaining > 0 ? { type: slot.type, count: remaining } : emptySlot();
        
        return {
            ...setContainer(arr),
            ...(targetContainerName === 'hotbar' ? { hotbar: targetArr } : { inventory: targetArr })
        };
    }

    if (isRightClick) {
        if (!newCursor || !newCursor.type) {
            if (slot.type) {
                const take = Math.ceil(slot.count / 2);
                const leave = slot.count - take;
                newCursor = { type: slot.type, count: take };
                arr[index] = leave > 0 ? { type: slot.type, count: leave } : emptySlot();
            }
        } else {
            if (!slot.type) {
                arr[index] = { type: newCursor.type, count: 1 };
                newCursor.count -= 1;
                if (newCursor.count <= 0) newCursor = null;
            } else if (slot.type === newCursor.type && slot.count < 64) {
                arr[index] = { ...slot, count: slot.count + 1 };
                newCursor.count -= 1;
                if (newCursor.count <= 0) newCursor = null;
            } else if (slot.type !== newCursor.type) {
                const temp = slot;
                arr[index] = newCursor;
                newCursor = temp;
            }
        }
    } else {
        if (!newCursor || !newCursor.type) {
            if (slot.type) {
                newCursor = { ...slot };
                arr[index] = emptySlot();
            }
        } else {
            if (!slot.type) {
                arr[index] = { ...newCursor };
                newCursor = null;
            } else if (slot.type === newCursor.type) {
                const space = 64 - slot.count;
                const toAdd = Math.min(space, newCursor.count);
                arr[index] = { ...slot, count: slot.count + toAdd };
                newCursor.count -= toAdd;
                if (newCursor.count <= 0) newCursor = null;
            } else {
                const temp = slot;
                arr[index] = newCursor;
                newCursor = temp;
            }
        }
    }

    return {
        ...setContainer(arr),
        cursorItem: newCursor
    };
  }),
  
  distributeItems: (slots) => set((state) => {
    if (!state.cursorItem || !state.cursorItem.type || slots.length === 0) return state;
    
    // Filter to only slots that are empty or matching type, and not full
    const validSlots = slots.filter(s => {
      const arr = s.container === 'hotbar' ? state.hotbar : state.inventory;
      const slot = arr[s.index];
      return !slot.type || (slot.type === state.cursorItem!.type && slot.count < 64);
    });
    
    if (validSlots.length === 0) return state;
    
    const amountPerSlot = Math.floor(state.cursorItem.count / validSlots.length);
    if (amountPerSlot === 0) return state;
    
    const newHotbar = [...state.hotbar];
    const newInventory = [...state.inventory];
    let remainingInCursor = state.cursorItem.count;
    
    for (const s of validSlots) {
       const arr = s.container === 'hotbar' ? newHotbar : newInventory;
       const slot = arr[s.index];
       const currentCount = slot.type ? slot.count : 0;
       const space = 64 - currentCount;
       const toAdd = Math.min(space, amountPerSlot);
       
       arr[s.index] = { type: state.cursorItem.type, count: currentCount + toAdd };
       remainingInCursor -= toAdd;
    }
    
    return {
      hotbar: newHotbar,
      inventory: newInventory,
      cursorItem: remainingInCursor > 0 ? { ...state.cursorItem, count: remainingInCursor } : null
    };
  }),

  throwCurrentItem: (dropAll, playerPos, cameraDir) => set((state) => {
    const slot = state.hotbar[state.selectedHotbarSlot];
    if (!slot.type) return state;
    
    const dropCount = dropAll ? slot.count : 1;
    const remaining = slot.count - dropCount;
    
    const newHotbar = [...state.hotbar];
    newHotbar[state.selectedHotbarSlot] = remaining > 0 ? { ...slot, count: remaining } : emptySlot();
    
    // Spawn velocity: based on Minecraft Java ~0.3 blocks/tick (6 blocks/sec) forward, +0.1 (2 blocks/sec) up
    const velocity: [number, number, number] = [
       cameraDir.x * 6,
       cameraDir.y * 6 + 2,
       cameraDir.z * 6
    ];
    
    // Spawn at eye height - 0.3 (approx 1.3 for player), slightly in front
    const dropPos: [number, number, number] = [
       state.playerFeetPosition.x + cameraDir.x * 0.3,
       state.playerFeetPosition.y + 1.3,
       state.playerFeetPosition.z + cameraDir.z * 0.3
    ];

    const newItem: DroppedItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: slot.type,
      position: dropPos,
      velocity: velocity,
      count: dropCount,
      pickupDelayTicks: 40, // 2 seconds for player-thrown items
    };

    return {
      hotbar: newHotbar,
      droppedItems: [...state.droppedItems, newItem]
    };
  }),

  throwInventoryItem: (container, index, dropAll, playerPos, cameraDir) => set((state) => {
    if (container === 'cursor') {
      if (!state.cursorItem) return state;
      const dropCount = dropAll ? state.cursorItem.count : 1;
      const remaining = state.cursorItem.count - dropCount;
      const velocity: [number, number, number] = [cameraDir.x * 6, cameraDir.y * 6 + 2, cameraDir.z * 6];
      const dropPos: [number, number, number] = [state.playerFeetPosition.x + cameraDir.x * 0.3, state.playerFeetPosition.y + 1.3, state.playerFeetPosition.z + cameraDir.z * 0.3];
      const newItem: DroppedItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: state.cursorItem.type!,
        position: dropPos,
        velocity: velocity,
        count: dropCount,
        pickupDelayTicks: 40,
      };
      return {
        cursorItem: remaining > 0 ? { ...state.cursorItem, count: remaining } : null,
        droppedItems: [...state.droppedItems, newItem]
      };
    }
    const getContainer = () => container === 'hotbar' ? [...state.hotbar] : container === 'inventory' ? [...state.inventory] : [state.offhand];
    const arr = getContainer();
    const slot = arr[index];
    if (!slot.type) return state;
    
    const dropCount = dropAll ? slot.count : 1;
    const remaining = slot.count - dropCount;
    
    arr[index] = remaining > 0 ? { ...slot, count: remaining } : emptySlot();
    
    const velocity: [number, number, number] = [cameraDir.x * 6, cameraDir.y * 6 + 2, cameraDir.z * 6];
    const dropPos: [number, number, number] = [state.playerFeetPosition.x + cameraDir.x * 0.3, state.playerFeetPosition.y + 1.3, state.playerFeetPosition.z + cameraDir.z * 0.3];

    const newItem: DroppedItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: slot.type,
      position: dropPos,
      velocity: velocity,
      count: dropCount,
      pickupDelayTicks: 40,
    };

    let updates: Partial<WorldState> = { droppedItems: [...state.droppedItems, newItem] };
    if (container === 'hotbar') updates.hotbar = arr;
    else if (container === 'inventory') updates.inventory = arr;
    else updates.offhand = arr[0];

    return updates;
  }),

  droppedItems: [],
  addDroppedItem: (type, position, count, velocity = [0, 2, 0], pickupDelayTicks = 10) => set((state) => ({
    droppedItems: [...state.droppedItems, {
      id: Math.random().toString(36).substr(2, 9),
      type,
      position,
      velocity,
      count,
      pickupDelayTicks,
    }]
  })),
  removeDroppedItem: (id) => set((state) => ({
    droppedItems: state.droppedItems.filter(item => item.id !== id)
  })),
  updateDroppedItem: (id, count) => set((state) => ({
    droppedItems: state.droppedItems.map(item => item.id === id ? { ...item, count } : item)
  })),
  
  lastPlacedTime: 0,
  lastOffhandPlacedTime: 0,
  
  playerFeetPosition: new Vector3(0, 5, 0),
  setPlayerFeetPosition: (pos) => set((state) => (state.playerFeetPosition.equals(pos) ? state : { playerFeetPosition: pos })),
  playerHeight: 1.8,
  setPlayerHeight: (height) => set((state) => (state.playerHeight === height ? state : { playerHeight: height })),
}));
