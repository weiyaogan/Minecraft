import { useEffect, useState } from 'react';
import { useWorldStore } from '../store';
import { BlockType } from '../world/blocks';
import { StatusBars } from './StatusBars';

const HOTBAR_ITEM_SIZE = 26;

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
export function StackQuantity({ count, fontSize = 14, style }: { count: number; fontSize?: number; style?: React.CSSProperties }) {
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
  const isHudTilted = useWorldStore((state) => state.isHudTilted);
  const toggleHudTilt = useWorldStore((state) => state.toggleHudTilt);

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
      // Don't intercept number keys if an input/textarea is focused or inventory is open
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
        className={`absolute bottom-28 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-1000 ${labelVisible ? 'opacity-100' : 'opacity-0'}`}
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

      {/* Main HUD Bar Anchor Container */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex items-end gap-2 max-w-full px-2 scale-90 sm:scale-100 origin-center">
        {/* Offhand Slot (Optional) */}
        {offhand?.type && (
          <div
            onClick={() => useWorldStore.getState().swapOffhand()}
            className="pointer-events-auto cursor-pointer rounded-[2px]"
            style={{
              backgroundColor: 'rgba(21, 26, 33, 0.88)',
              border: '1.5px solid #2a3442',
              padding: '2px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5)',
            }}
            title="Offhand Item (Click to swap)"
          >
            <div 
              className="relative flex items-center justify-center rounded-[1px]"
              style={{
                width: '42px',
                height: '42px',
                backgroundColor: '#1c222b',
                boxShadow: 'inset 0 0 0 1px #374151',
              }}
            >
              <MiniBlock type={offhand.type} cubeSize={HOTBAR_ITEM_SIZE} />
              <StackQuantity count={offhand.count} fontSize={15} style={{ bottom: '2px', right: '3px' }} />
            </div>
          </div>
        )}

        {/* Integrated HUD: StatusBars (Hearts, XP, Hunger) + Continuous 9-Slot Hotbar */}
        <div 
          className="flex flex-col items-center select-none"
          style={{
            transform: isHudTilted ? 'rotate(-8.5deg)' : 'none',
            transformOrigin: 'center center',
            transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {/* Status Bars: Health Hearts (Left), Level 1 (Center), Hunger Drumsticks (Right), XP Bar (Flush) */}
          <StatusBars />

          {/* Seamless Unified 9-Slot Hotbar directly beneath XP Bar matching reference image */}
          <div 
            className="w-[396px] h-[46px] flex items-stretch overflow-visible relative select-none"
            style={{
              backgroundColor: '#20252b',
              border: '2px solid #14181e',
              borderTop: 'none',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.85), inset 1px 0 0 #606a75, inset -1px -1px 0 #181d22',
            }}
          >
            {hotbar.map((slot, index) => {
              const isSelected = index === selectedHotbarSlot;
              
              return (
                <div 
                  key={index} 
                  onClick={() => setSelectedHotbarSlot(index)}
                  className="relative flex items-center justify-center flex-1 h-full pointer-events-auto cursor-pointer select-none transition-all duration-75"
                  style={{
                    backgroundColor: '#434a50',
                    backgroundImage: 'linear-gradient(180deg, #3d444a 0%, #485057 100%)',
                    boxShadow: 'inset 2px 2px 0px #22272d, inset -2px -2px 0px #5f6974',
                    borderRight: index < 8 ? '2px solid #1c2126' : 'none',
                  }}
                  title={`Slot ${index + 1}`}
                >
                  {slot.type && <MiniBlock type={slot.type} cubeSize={HOTBAR_ITEM_SIZE} />}
                  <StackQuantity count={slot.count} fontSize={15} style={{ bottom: '2px', right: '3px' }} />

                  {/* Prominent protruding 3D light-colored active slot frame matching slot 4 in screenshot */}
                  {isSelected && (
                    <div
                      className="absolute pointer-events-none rounded-[1px]"
                      style={{
                        top: '-4px',
                        bottom: '-4px',
                        left: '-2px',
                        right: '-2px',
                        border: '3.5px solid #e1ebd9',
                        boxShadow: '0 0 6px rgba(0, 0, 0, 0.9), inset 1px 1px 0 #ffffff, inset -1px -1px 0 #8c9886',
                        zIndex: 40,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* View Angle / Tilt Switcher Button */}
        <button
          onClick={toggleHudTilt}
          className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 rounded bg-[#182029]/80 hover:bg-[#222c38] text-xs font-mono text-zinc-300 border border-[#313e4f] shadow-md transition-all active:scale-95"
          style={{
            alignSelf: 'flex-start',
          }}
          title="Toggle Tilted (Image style) / Flat HUD view"
        >
          <span>{isHudTilted ? '📐 Angle ON' : '➖ Flat'}</span>
        </button>

        {/* Classic MCPE Inventory button next to hotbar (mobile only) */}
        {isMobile && (
          <button
            id="hotbar-inventory-btn"
            data-mobile-control="true"
            onClick={() => useWorldStore.getState().setInventoryOpen(true)}
            className="pointer-events-auto flex items-center justify-center active:brightness-75 text-white font-bold cursor-pointer select-none transition-all rounded-[2px]"
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: 'rgba(21, 26, 33, 0.88)',
              border: '1.5px solid #2a3442',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5), inset 0 0 0 1px #374151',
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
