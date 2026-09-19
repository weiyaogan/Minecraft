import { useEffect, useState } from 'react';
import { useWorldStore } from '../store';
import { BlockType } from '../world/blocks';
import { StatusBars } from './StatusBars';

const HOTBAR_ITEM_SIZE = 24;

// Reusable mini 3D isometric block preview for voxel blocks
export function MiniBlock({ type, cubeSize = 22 }: { type: BlockType; cubeSize?: number }) {
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

      {/* Main HUD Bar Anchor Container: ALWAYS FLAT as requested */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex items-end gap-2 max-w-full px-2 scale-90 sm:scale-100 origin-center">
        {/* Offhand Slot (Optional) */}
        {offhand?.type && (
          <div
            onClick={() => useWorldStore.getState().swapOffhand()}
            className="pointer-events-auto cursor-pointer"
            style={{
              width: '46px',
              height: '46px',
              border: '3px solid #777777',
              borderTopColor: '#bbbbbb',
              borderLeftColor: '#bbbbbb',
              borderRightColor: '#777777',
              borderBottomColor: '#777777',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '6px',
            }}
            title="Offhand Item (Click to swap)"
          >
            <MiniBlock type={offhand.type} cubeSize={HOTBAR_ITEM_SIZE} />
            <StackQuantity count={offhand.count} fontSize={13} style={{ bottom: '2px', right: '3px' }} />
          </div>
        )}

        {/* Integrated HUD: StatusBars (Hearts, XP, Hunger) + 9 Individual Boxed Slots */}
        <div className="flex flex-col items-center select-none">
          {/* Status Bars: Health Hearts, Hunger Drumsticks, Segmented XP Bar */}
          <StatusBars />

          {/* 9 Square Hotbar Slots matching EXACTLY the uploaded reference image */}
          <div className="flex items-center gap-[5px] select-none">
            {hotbar.map((slot, index) => {
              const isSelected = index === selectedHotbarSlot;
              
              return (
                <div 
                  key={index} 
                  onClick={() => setSelectedHotbarSlot(index)}
                  className="relative flex items-center justify-center pointer-events-auto cursor-pointer select-none transition-none"
                  style={{
                    width: isSelected ? '48px' : '46px',
                    height: isSelected ? '48px' : '46px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    /* Inactive: light gray top/left, medium gray bottom/right, dark inside line */
                    border: isSelected ? '4px solid #ffffff' : '3.5px solid #7b7b7b',
                    borderTopColor: isSelected ? '#ffffff' : '#b8b8b8',
                    borderLeftColor: isSelected ? '#ffffff' : '#b8b8b8',
                    borderRightColor: isSelected ? '#a8a8a8' : '#646464',
                    borderBottomColor: isSelected ? '#a8a8a8' : '#646464',
                    boxShadow: isSelected
                      ? 'inset 0 0 0 1px #888888, 0 0 4px rgba(0, 0, 0, 0.8)'
                      : 'inset 0 0 0 1px #3a3a3a',
                  }}
                  title={`Slot ${index + 1}`}
                >
                  {slot.type && <MiniBlock type={slot.type} cubeSize={HOTBAR_ITEM_SIZE} />}
                  <StackQuantity count={slot.count} fontSize={13} style={{ bottom: '2px', right: '3px' }} />
                </div>
              );
            })}
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
              width: '46px',
              height: '46px',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              border: '3px solid #777777',
              borderTopColor: '#bbbbbb',
              borderLeftColor: '#bbbbbb',
              borderRightColor: '#777777',
              borderBottomColor: '#777777',
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
