import { useEffect, useState } from 'react';
import { useWorldStore } from '../store';
import { MiniBlock, StackQuantity } from './MiniBlock';
import { StatusBars } from './StatusBars';

const HOTBAR_ITEM_SIZE = 20;

export function Hotbar() {
  const hotbar = useWorldStore(state => state.hotbar);
  const selectedHotbarSlot = useWorldStore(state => state.selectedHotbarSlot);
  const setSelectedHotbarSlot = useWorldStore(state => state.setSelectedHotbarSlot);
  const offhand = useWorldStore(state => state.offhand);
  const isMobile = useWorldStore(state => state.isMobile);

  const [labelVisible, setLabelVisible] = useState(false);
  const selectedItem = hotbar[selectedHotbarSlot];

  useEffect(() => {
    if (selectedItem?.type) {
      setLabelVisible(true);
      const timer = setTimeout(() => {
        setLabelVisible(false);
      }, 1500); // Wait 1.5 seconds before fading
      return () => clearTimeout(timer);
    } else {
      setLabelVisible(false);
    }
  }, [selectedHotbarSlot, selectedItem?.type]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useWorldStore.getState().isInventoryOpen) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        setSelectedHotbarSlot(num - 1);
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      if (useWorldStore.getState().isInventoryOpen) return;
      if (e.deltaY > 0) {
        // Scroll down -> next slot
        setSelectedHotbarSlot((selectedHotbarSlot + 1) % 9);
      } else if (e.deltaY < 0) {
        // Scroll up -> previous slot
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
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex items-end gap-2 max-w-full px-2 scale-90 sm:scale-100 origin-bottom">
        {offhand?.type && (
          <div
            onClick={() => useWorldStore.getState().swapOffhand()}
            className="pointer-events-auto cursor-pointer"
            style={{
              backgroundColor: '#8b8b8b',
              border: '2px solid #222222',
              padding: '2px'
            }}
            title="Offhand Item (Click to swap)"
          >
            <div 
              className="relative flex items-center justify-center bg-[#8b8b8b]"
              style={{
                width: '40px',
                height: '40px',
                boxShadow: 'inset 2px 2px 0px 0px #373737, inset -2px -2px 0px 0px #ffffff',
              }}
            >
              <MiniBlock type={offhand.type} cubeSize={HOTBAR_ITEM_SIZE} />
              <StackQuantity count={offhand.count} fontSize={15} style={{ bottom: '2px', right: '3px' }} />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5 items-center">
          {/* Status Bars: Health (Left), Hunger (Right) */}
          <StatusBars />

          {/* 9 Hotbar slots */}
          <div 
            className="flex"
            style={{
              backgroundColor: '#8b8b8b',
              border: '2px solid #222222',
              padding: '2px',
              gap: '2px'
            }}
          >
            {hotbar.map((slot, index) => {
              const isSelected = index === selectedHotbarSlot;
              
              return (
                <div 
                  key={index} 
                  onClick={() => setSelectedHotbarSlot(index)}
                  className="relative flex items-center justify-center bg-[#8b8b8b] pointer-events-auto cursor-pointer select-none"
                  style={{
                    width: '40px',
                    height: '40px',
                    // Classic Minecraft unselected slot bevel
                    boxShadow: isSelected 
                      ? 'inset 0 0 0 2px white, inset 0 0 0 3px #bfbfbf' 
                      : 'inset 2px 2px 0px 0px #373737, inset -2px -2px 0px 0px #ffffff',
                    zIndex: isSelected ? 10 : 1
                  }}
                >
                  {slot.type && <MiniBlock type={slot.type} cubeSize={HOTBAR_ITEM_SIZE} />}
                  <StackQuantity count={slot.count} fontSize={15} style={{ bottom: '2px', right: '3px' }} />
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
            className="pointer-events-auto flex items-center justify-center bg-[#8b8b8b] active:bg-[#6e6e6e] text-white font-bold cursor-pointer select-none transition-colors"
            style={{
              width: '44px',
              height: '44px',
              border: '2px solid #222222',
              boxShadow: 'inset 2px 2px 0px 0px #ffffff, inset -2px -2px 0px 0px #373737',
            }}
            title="Open Inventory (...)"
            aria-label="Open Inventory"
          >
            <span className="text-xl tracking-tighter leading-none select-none font-mono">•••</span>
          </button>
        )}
      </div>
    </>
  );
}
