import { useEffect, useState, useRef } from 'react';
import { useWorldStore } from '../store';
import { BlockType } from '../world/blocks';
import { X } from 'lucide-react';
import { MiniBlock, StackQuantity } from './MiniBlock';

const INVENTORY_WIDTH = 352;
const INVENTORY_HEIGHT = 332;
const SLOT_SIZE = 34;
const SLOT_GAP = 2;
const SLOT_STEP = SLOT_SIZE + SLOT_GAP;
export const INVENTORY_ITEM_SIZE = 17;

export function InventoryUI() {
  const isInventoryOpen = useWorldStore(state => state.isInventoryOpen);
  const setInventoryOpen = useWorldStore(state => state.setInventoryOpen);
  const inventory = useWorldStore(state => state.inventory);
  const hotbar = useWorldStore(state => state.hotbar);
  const offhand = useWorldStore(state => state.offhand);
  const cursorItem = useWorldStore(state => state.cursorItem);
  const clickSlot = useWorldStore(state => state.clickSlot);
  const distributeItems = useWorldStore(state => state.distributeItems);
  const setHoveredSlot = useWorldStore(state => state.setHoveredSlot);
  const isMobile = useWorldStore(state => state.isMobile);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSlots, setDraggedSlots] = useState<{ container: 'hotbar' | 'inventory'; index: number }[]>([]);

  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;
  const draggedSlotsRef = useRef(draggedSlots);
  draggedSlotsRef.current = draggedSlots;

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const targetWidth = INVENTORY_WIDTH * 1.5;
      const targetHeight = INVENTORY_HEIGHT * 1.5;
      const availableWidth = window.innerWidth - 32;
      const availableHeight = window.innerHeight - 40;
      const computedScale = Math.min(1, Math.min(availableWidth / targetWidth, availableHeight / targetHeight));
      setScale(Math.max(0.55, computedScale));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    if (!isInventoryOpen) {
      if (isDragging) setIsDragging(false);
      if (draggedSlots.length > 0) setDraggedSlots([]);
      return;
    }

    const onMouseMove = (event: MouseEvent) => setMousePos({ x: event.clientX, y: event.clientY });
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        setMousePos({ x: event.touches[0].clientX, y: event.touches[0].clientY });
      }
    };

    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      if (draggedSlotsRef.current.length > 0) {
        distributeItems(draggedSlotsRef.current);
      }
      setIsDragging(false);
      setDraggedSlots([]);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchend', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isInventoryOpen, distributeItems]);

  if (!isInventoryOpen) return null;

  const handleMouseDown = (container: 'hotbar' | 'inventory' | 'offhand', index: number, event: React.MouseEvent) => {
    // Keep drag-to-distribute behavior for regular slots, but let the offhand
    // slot use the store's normal place/stack/swap behavior.
    if (event.button === 0 && cursorItem && container !== 'offhand') {
      setIsDragging(true);
      setDraggedSlots([{ container, index }]);
      return;
    }
    clickSlot(container, index, event.button === 2, event.shiftKey);
  };

  const handleTouchTap = (container: 'hotbar' | 'inventory' | 'offhand', index: number, event: React.TouchEvent) => {
    event.stopPropagation();
    // On touch, tap immediately performs clickSlot (places or picks up item)
    clickSlot(container, index, false, false);
  };

  const handleMouseEnter = (container: 'hotbar' | 'inventory' | 'offhand', index: number) => {
    setHoveredSlot({ container, index });
    if (!isDragging || container === 'offhand') return;
    setDraggedSlots(previous => previous.some(slot => slot.container === container && slot.index === index)
      ? previous
      : [...previous, { container, index }]);
  };

  const renderSlot = (
    container: 'hotbar' | 'inventory' | 'offhand',
    index: number,
    slot: { type: BlockType | null; count: number },
    left: number,
    top: number,
  ) => (
    <div
      key={`${container}-${index}`}
      onMouseDown={event => handleMouseDown(container, index, event)}
      onTouchEnd={event => handleTouchTap(container, index, event)}
      onMouseEnter={() => handleMouseEnter(container, index)}
      onMouseLeave={() => setHoveredSlot(null)}
      onContextMenu={event => event.preventDefault()}
      className="absolute flex items-center justify-center cursor-pointer"
      style={{ left, top, width: SLOT_SIZE, height: SLOT_SIZE }}
    >
      {slot.type && (
        <div className="flex items-center justify-center pointer-events-none">
          <MiniBlock type={slot.type} cubeSize={INVENTORY_ITEM_SIZE} />
        </div>
      )}
      {slot.type && slot.count > 1 && (
        <StackQuantity
          count={slot.count}
          fontSize={13}
          style={{ bottom: '1px', right: '1px' }}
        />
      )}
      {isDragging && draggedSlots.some(item => item.container === container && item.index === index) && (
        <div className="absolute inset-0 bg-white/25 pointer-events-none" />
      )}
    </div>
  );

  const handleBackgroundClick = (event: React.MouseEvent | React.TouchEvent) => {
    // Only drop if clicking the backdrop itself
    if (event.target === event.currentTarget && cursorItem) {
      // Left click drops all, right click drops one
      const dropAll = ('button' in event) ? event.button === 0 : true;
      window.dispatchEvent(new CustomEvent('drop-cursor-item', { detail: { dropAll } }));
    }
  };

  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-auto select-none p-4" 
      onContextMenu={event => event.preventDefault()}
      onMouseDown={handleBackgroundClick}
      onTouchEnd={handleBackgroundClick}
    >
      <div 
        className="relative"
        style={{ 
          width: INVENTORY_WIDTH * 1.5, 
          height: INVENTORY_HEIGHT * 1.5,
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
        {/* Close Button at top-right (mobile only) */}
        {isMobile && (
          <button
            id="inventory-close-button"
            onClick={() => setInventoryOpen(false)}
            onTouchEnd={(e) => {
              e.stopPropagation();
              setInventoryOpen(false);
            }}
            className="absolute -top-10 right-0 px-3 py-1 bg-[#8b8b8b] active:bg-[#6e6e6e] text-white flex items-center gap-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#333333] border-r-[#333333] cursor-pointer shadow-lg font-mono text-sm font-bold select-none z-10"
            title="Close"
          >
            <X className="w-4 h-4" />
            <span>CLOSE</span>
          </button>
        )}

        <div
          className="relative shrink-0 origin-top-left"
          style={{
            width: INVENTORY_WIDTH,
            height: INVENTORY_HEIGHT,
            backgroundImage: "url('/Inventory.webp')",
            backgroundSize: '100% 100%',
            imageRendering: 'pixelated',
            transform: 'scale(1.5)',
          }}
        >
          {inventory.map((slot, index) => {
            const row = Math.floor(index / 9);
            const column = index % 9;
            return renderSlot('inventory', index, slot, 14 + column * SLOT_STEP, 166 + row * SLOT_STEP);
          })}
          {hotbar.map((slot, index) => renderSlot('hotbar', index, slot, 14 + index * SLOT_STEP, 282))}
          {renderSlot('offhand', 0, offhand, 152, 122)}
        </div>
      </div>

      {cursorItem && cursorItem.type && (
        <div 
          className="fixed pointer-events-none z-[100]" 
          style={{ 
            left: mousePos.x, 
            top: mousePos.y, 
            transform: 'translate(-50%, -50%)' 
          }}
        >
          <div className="relative flex items-center justify-center">
            <MiniBlock type={cursorItem.type} cubeSize={INVENTORY_ITEM_SIZE * 1.5 * scale} />
            <StackQuantity
              count={cursorItem.count}
              fontSize={13 * 1.5 * scale}
              style={{ bottom: '-1px', right: '-1px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
