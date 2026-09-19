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
                width: '40px',
                height: '40px',
                backgroundColor: '#1c222b',
                boxShadow: 'inset 0 0 0 1px #374151',
              }}
            >
              <MiniBlock type={offhand.type} cubeSize={HOTBAR_ITEM_SIZE} />
              <StackQuantity count={offhand.count} fontSize={15} style={{ bottom: '2px', right: '3px' }} />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-[2px] items-center">
          {/* Status Bars: Health (Left), Level (Center), Hunger (Right), XP Bar (Below) */}
          <StatusBars />

          {/* 9 Hotbar slots matching the clean dark aesthetic in reference image */}
          <div 
            className="flex rounded-[2px]"
            style={{
              backgroundColor: 'rgba(21, 26, 33, 0.92)',
              border: '1.5px solid #2a3442',
              padding: '2px',
              gap: '2px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            }}
          >
            {hotbar.map((slot, index) => {
              const isSelected = index === selectedHotbarSlot;
              
              return (
                <div 
                  key={index} 
                  onClick={() => setSelectedHotbarSlot(index)}
                  className="relative flex items-center justify-center pointer-events-auto cursor-pointer select-none rounded-[1px] transition-all duration-75"
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#1c222b',
                    // Prominent bright white/light-silver border for active slot (like screenshot)
                    boxShadow: isSelected 
                      ? 'inset 0 0 0 2.5px #f8fafc, 0 0 6px rgba(255, 255, 255, 0.35)' 
                      : 'inset 0 0 0 1px #374151',
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
