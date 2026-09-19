import { useEffect, useState } from 'react';
import { useWorldStore } from '../store';
import { BlockType } from '../world/blocks';
import { StatusBars } from './StatusBars';

const HOTBAR_ITEM_SIZE = 26;
const SLOT_SIZE = 48; // Exactly 48px per slot * 9 = 432px total width
const TOTAL_HUD_WIDTH = SLOT_SIZE * 9; // 432px

// Reusable mini 3D isometric block preview for voxel blocks
export function MiniBlock({ type, cubeSize = 24 }: { type: BlockType; cubeSize?: number }) {
  const getColors = (t: BlockType) => {
    switch (t) {
      case 'grass': return { top: '#5b8f32', side1: '#866043', side2: '#684830' };
      case 'dirt': return { top: '#866043', side1: '#684830', side2: '#533924' };
      case 'stone': return { top: '#808080', side1: '#666666', side2: '#525252' };
      case 'sand': return { top: '#e0d695', side1: '#c4b97a', side2: '#a89c62' };
      case 'bedrock': return { top: '#333333', side1: '#222222', side2: '#111111' };
      default: return { top: '#888', side1: '#666', side2: '#444' };
    }
  };

  const c = getColors(type);

  return (
    <div 
      className="relative pointer-events-none select-none flex items-center justify-center drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]"
      style={{ width: `${cubeSize}px`, height: `${cubeSize}px` }}
    >
      <svg viewBox="0 0 32 32" className="w-full h-full">
        {/* Top face */}
        <polygon points="16,4 28,10 16,16 4,10" fill={c.top} />
        {/* Left face */}
        <polygon points="4,10 16,16 16,28 4,22" fill={c.side1} />
        {/* Right face */}
        <polygon points="16,16 28,10 28,22 16,28" fill={c.side2} />
      </svg>
    </div>
  );
}

// Reusable stack counter with classic Minecraft font & shadow
export function StackQuantity({ count, fontSize = 13, style }: { count: number; fontSize?: number; style?: React.CSSProperties }) {
  if (count <= 1) return null;
  return (
    <span 
      className="absolute pointer-events-none select-none font-bold tracking-tight"
      style={{
        color: '#ffffff',
        textShadow: '2px 2px 0 #3f3f3f, 1px 2px 0 #3f3f3f, 2px 1px 0 #3f3f3f',
        fontFamily: "'MinecraftPixel', 'Silkscreen', 'MinecraftPressStart', 'Press Start 2P', monospace, sans-serif",
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        ...style
      }}
    >
      {count}
    </span>
  );
}

export function Hotbar() {
  const hotbar = useWorldStore((state) => state.hotbar);
  const selectedHotbarSlot = useWorldStore((state) => state.selectedHotbarSlot);
  const setSelectedHotbarSlot = useWorldStore((state) => state.setSelectedHotbarSlot);
  const isMobile = useWorldStore((state) => state.isMobile);
  const offhand = useWorldStore((state) => state.offhand);

  const selectedItem = hotbar[selectedHotbarSlot];
  const [labelVisible, setLabelVisible] = useState(false);

  useEffect(() => {
    if (selectedItem?.type) {
      setLabelVisible(true);
      const timer = setTimeout(() => {
        setLabelVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setLabelVisible(false);
    }
  }, [selectedHotbarSlot, selectedItem?.type]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (useWorldStore.getState().isInventoryOpen) return;

      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        setSelectedHotbarSlot(num - 1);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (useWorldStore.getState().isInventoryOpen) return;
      if (e.deltaY > 0) {
        setSelectedHotbarSlot((selectedHotbarSlot + 1) % 9);
      } else if (e.deltaY < 0) {
        setSelectedHotbarSlot((selectedHotbarSlot - 1 + 9) % 9);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [selectedHotbarSlot, setSelectedHotbarSlot]);

  return (
    <>
      {/* Item Name Floating Toast */}
      <div 
        className={`absolute bottom-32 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-1000 ${labelVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{
          color: 'white',
          textShadow: '2px 2px 0 #3f3f3f, 1px 2px 0 #3f3f3f, 2px 1px 0 #3f3f3f',
          fontFamily: "'MinecraftPixel', 'Silkscreen', 'MinecraftPressStart', 'Press Start 2P', monospace, sans-serif",
          fontSize: '18px',
          textTransform: 'capitalize',
          pointerEvents: 'none',
          WebkitFontSmoothing: 'none',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        {selectedItem?.type === 'grass' ? 'Grass Block' : selectedItem?.type}
      </div>

      {/* Main HUD Bar Anchor Container: Flat, Centered, Matching image.png */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex items-end gap-2 max-w-full px-2 scale-90 sm:scale-100 origin-center">
        {/* Offhand Slot (Optional) */}
        {offhand?.type && (
          <div
            onClick={() => useWorldStore.getState().swapOffhand()}
            className="pointer-events-auto cursor-pointer relative"
            style={{
              width: `${SLOT_SIZE}px`,
              height: `${SLOT_SIZE}px`,
              border: '2px solid #000000',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '8px',
              boxSizing: 'border-box',
            }}
            title="Offhand Item (Click to swap)"
          >
            {/* Beveled gray frame inside offhand slot */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                border: '3px solid #6b6b6b',
                borderTopColor: '#b4b4b4',
                borderLeftColor: '#b4b4b4',
                boxShadow: 'inset 0 0 0 1px #3a3a3a',
              }}
            />
            <MiniBlock type={offhand.type} cubeSize={HOTBAR_ITEM_SIZE} />
            <StackQuantity count={offhand.count} fontSize={13} style={{ bottom: '4px', right: '5px' }} />
          </div>
        )}

        {/* Integrated HUD: StatusBars (Hearts, XP, Hunger) + Continuous 9-Slot Hotbar Tray */}
        <div 
          className="flex flex-col items-center select-none"
          style={{ width: `${TOTAL_HUD_WIDTH}px` }}
        >
          {/* Status Bars: Health Hearts, Hunger Drumsticks, Segmented XP Bar */}
          <StatusBars />

          {/* Continuous Hotbar Tray matching EXACTLY the uploaded reference image */}
          <div 
            className="relative flex items-center select-none"
            style={{
              width: `${TOTAL_HUD_WIDTH}px`,
              height: `${SLOT_SIZE}px`,
              border: '2px solid #000000',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              boxSizing: 'border-box',
            }}
          >
            {/* Inactive Slots in continuous contiguous row */}
            {hotbar.map((slot, index) => {
              return (
                <div 
                  key={index} 
                  onClick={() => setSelectedHotbarSlot(index)}
                  className="relative flex items-center justify-center pointer-events-auto cursor-pointer select-none"
                  style={{
                    width: `${SLOT_SIZE}px`,
                    height: '100%',
                    borderRight: index < 8 ? '2px solid #000000' : 'none',
                    boxSizing: 'border-box',
                  }}
                  title={`Slot ${index + 1}`}
                >
                  {/* Beveled silver-gray frame inside each slot */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      border: '3.5px solid #6b6b6b',
                      borderTopColor: '#b8b8b8',
                      borderLeftColor: '#b8b8b8',
                      boxShadow: 'inset 0 0 0 1px #363636',
                    }}
                  />

                  {/* Slot Item */}
                  {slot.type && <MiniBlock type={slot.type} cubeSize={HOTBAR_ITEM_SIZE} />}
                  <StackQuantity count={slot.count} fontSize={13} style={{ bottom: '4px', right: '5px' }} />
                </div>
              );
            })}

            {/* Active Protruding White Raised Frame (Slot 1 in reference image) */}
            <div
              className="absolute pointer-events-none transition-none select-none z-20"
              style={{
                width: `${SLOT_SIZE + 6}px`,
                height: `${SLOT_SIZE + 6}px`,
                top: '-3px',
                left: `${selectedHotbarSlot * SLOT_SIZE - 3}px`,
                border: '2px solid #000000',
                boxSizing: 'border-box',
              }}
            >
              {/* Thick raised pure white / silver beveled frame */}
              <div
                className="w-full h-full"
                style={{
                  border: '4px solid #cccccc',
                  borderTopColor: '#ffffff',
                  borderLeftColor: '#ffffff',
                  boxShadow: 'inset 0 0 0 1px #808080, 0 0 3px rgba(0, 0, 0, 0.75)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* Classic MCPE Inventory button next to hotbar (mobile only) */}
        {isMobile && (
          <button
            id="hotbar-inventory-btn"
            data-mobile-control="true"
            onClick={() => useWorldStore.getState().setInventoryOpen(true)}
            className="pointer-events-auto flex items-center justify-center active:brightness-75 text-white font-bold cursor-pointer select-none transition-all ml-2"
            style={{
              width: `${SLOT_SIZE}px`,
              height: `${SLOT_SIZE}px`,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              border: '2px solid #000000',
              boxSizing: 'border-box',
            }}
            title="Open Inventory (...)"
            aria-label="Open Inventory"
          >
            <span className="text-xl tracking-tighter leading-none select-none font-mono text-slate-200">•••</span>
          </button>
        )}
      </div>
    </>
  );
}
