import { useEffect, useState } from 'react';
import { useWorldStore } from '../store';
import { BlockType } from '../world/blocks';
import { TEXTURE_URLS } from '../world/textures';

interface FaceConfig {
  backgroundImage: string;
  backgroundColor?: string;
  backgroundBlendMode?: string;
}

const getFaceConfigs = (type: BlockType): {
  top: FaceConfig;
  bottom: FaceConfig;
  front: FaceConfig;
  back: FaceConfig;
  left: FaceConfig;
  right: FaceConfig;
} => {
  if (type === 'grass') {
    const side: FaceConfig = { backgroundImage: `url(${TEXTURE_URLS.grassSide})` };
    return {
      top: {
        backgroundImage: `url(${TEXTURE_URLS.grassTop})`,
        backgroundColor: '#55aa55',
        backgroundBlendMode: 'multiply',
      },
      bottom: { backgroundImage: `url(${TEXTURE_URLS.dirt})` },
      front: side,
      back: side,
      left: side,
      right: side,
    };
  }

  if (type === 'sand') {
    const sandFace: FaceConfig = {
      backgroundImage: `url(${TEXTURE_URLS.dirt})`,
      backgroundColor: '#e3dbb0',
      backgroundBlendMode: 'multiply',
    };
    return {
      top: sandFace,
      bottom: sandFace,
      front: sandFace,
      back: sandFace,
      left: sandFace,
      right: sandFace,
    };
  }

  if (type === 'bedrock') {
    const bedrockFace: FaceConfig = {
      backgroundImage: `url(${TEXTURE_URLS.bedrock})`,
    };
    return {
      top: bedrockFace,
      bottom: bedrockFace,
      front: bedrockFace,
      back: bedrockFace,
      left: bedrockFace,
      right: bedrockFace,
    };
  }

  if (type === 'dirt') {
    const dirtFace: FaceConfig = { backgroundImage: `url(${TEXTURE_URLS.dirt})` };
    return {
      top: dirtFace,
      bottom: dirtFace,
      front: dirtFace,
      back: dirtFace,
      left: dirtFace,
      right: dirtFace,
    };
  }

  // Stone & default
  const stoneFace: FaceConfig = { backgroundImage: `url(${TEXTURE_URLS.stone})` };
  return {
    top: stoneFace,
    bottom: stoneFace,
    front: stoneFace,
    back: stoneFace,
    left: stoneFace,
    right: stoneFace,
  };
};

const MiniBlock = ({ type }: { type: BlockType }) => {
  const faces = getFaceConfigs(type);

  return (
    <div className="isometric-cube">
      {/* Top face: directly lit */}
      <div
        className="cube-face cube-top"
        style={{ ...faces.top, filter: 'brightness(1.0)' }}
      />
      {/* Left face: medium diffuse lighting */}
      <div
        className="cube-face cube-left"
        style={{ ...faces.left, filter: 'brightness(0.8)' }}
      />
      {/* Front / Right face: darker shadow */}
      <div
        className="cube-face cube-front"
        style={{ ...faces.front, filter: 'brightness(0.6)' }}
      />
      {/* Back and remaining faces to ensure complete solid geometry from all angles */}
      <div
        className="cube-face cube-right"
        style={{ ...faces.right, filter: 'brightness(0.5)' }}
      />
      <div
        className="cube-face cube-back"
        style={{ ...faces.back, filter: 'brightness(0.7)' }}
      />
      <div
        className="cube-face cube-bottom"
        style={{ ...faces.bottom, filter: 'brightness(0.4)' }}
      />
    </div>
  );
};

export function Hotbar() {
  const hotbar = useWorldStore(state => state.hotbar);
  const selectedHotbarSlot = useWorldStore(state => state.selectedHotbarSlot);
  const setSelectedHotbarSlot = useWorldStore(state => state.setSelectedHotbarSlot);
  const offhand = useWorldStore(state => state.offhand);

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
        className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-1000 ${labelVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{
          color: 'white',
          textShadow: '2px 2px 0 #3f3f3f, -2px -2px 0 #3f3f3f, 2px -2px 0 #3f3f3f, -2px 2px 0 #3f3f3f, 2px 0 0 #3f3f3f, -2px 0 0 #3f3f3f, 0 2px 0 #3f3f3f, 0 -2px 0 #3f3f3f',
          fontFamily: 'monospace, sans-serif',
          fontSize: '24px',
          textTransform: 'capitalize',
          pointerEvents: 'none'
        }}
      >
        {selectedItem?.type === 'grass' ? 'Grass Block' : selectedItem?.type}
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-30">
        {offhand?.type && (
          <div
            className="absolute"
            style={{
              left: '-60px',
              bottom: '0',
              backgroundColor: '#8b8b8b',
              border: '2px solid #222222',
              padding: '2px'
            }}
          >
            <div 
              className="relative flex items-center justify-center bg-[#8b8b8b]"
              style={{
                width: '40px',
                height: '40px',
                boxShadow: 'inset 2px 2px 0px 0px #373737, inset -2px -2px 0px 0px #ffffff',
              }}
            >
              <MiniBlock type={offhand.type} />
              {offhand.count > 1 && (
                <span 
                  className="absolute text-white font-bold tracking-tighter"
                  style={{ 
                    bottom: '-2px',
                    right: '2px',
                    fontSize: '16px', 
                    lineHeight: '16px', 
                    textShadow: '2px 2px 0 #3f3f3f, -2px -2px 0 #3f3f3f, 2px -2px 0 #3f3f3f, -2px 2px 0 #3f3f3f, 2px 0 0 #3f3f3f, -2px 0 0 #3f3f3f, 0 2px 0 #3f3f3f, 0 -2px 0 #3f3f3f',
                    fontFamily: 'monospace, sans-serif'
                  }}
                >
                  {offhand.count}
                </span>
              )}
            </div>
          </div>
        )}
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
            className="relative flex items-center justify-center bg-[#8b8b8b]"
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
            {slot.type && <MiniBlock type={slot.type} />}
            
            {slot.count > 1 && (
              <span 
                className="absolute text-white font-bold tracking-tighter"
                style={{ 
                  bottom: '-2px',
                  right: '2px',
                  fontSize: '16px', 
                  lineHeight: '16px', 
                  textShadow: '2px 2px 0 #3f3f3f, -2px -2px 0 #3f3f3f, 2px -2px 0 #3f3f3f, -2px 2px 0 #3f3f3f, 2px 0 0 #3f3f3f, -2px 0 0 #3f3f3f, 0 2px 0 #3f3f3f, 0 -2px 0 #3f3f3f',
                  fontFamily: 'monospace, sans-serif'
                }}
              >
                {slot.count}
              </span>
            )}
          </div>
        );
      })}
      </div>
      </div>
    </>
  );
}
