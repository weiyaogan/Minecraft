import React from 'react';
import { BlockType } from '../world/blocks';
import { TEXTURE_URLS } from '../world/textures';

export const MINECRAFT_PIXEL_FONT = "'MinecraftPixel', 'Silkscreen', 'MinecraftPressStart', 'Press Start 2P', monospace, sans-serif";

export const getFaceConfigs = (type: BlockType) => {
  if (type === 'grass') {
    const side = { backgroundImage: `url(${TEXTURE_URLS.grassSide})` };
    return {
      top: { backgroundImage: `url(${TEXTURE_URLS.grassTop})`, backgroundColor: '#55aa55', backgroundBlendMode: 'multiply' as const },
      bottom: { backgroundImage: `url(${TEXTURE_URLS.dirt})` },
      front: side,
      back: side,
      left: side,
      right: side,
    };
  }

  if (type === 'sand') {
    const sandFace = { backgroundImage: `url(${TEXTURE_URLS.dirt})`, backgroundColor: '#e3dbb0', backgroundBlendMode: 'multiply' as const };
    return { top: sandFace, bottom: sandFace, front: sandFace, back: sandFace, left: sandFace, right: sandFace };
  }

  if (type === 'bedrock') {
    const bedrockFace = { backgroundImage: `url(${TEXTURE_URLS.bedrock})` };
    return { top: bedrockFace, bottom: bedrockFace, front: bedrockFace, back: bedrockFace, left: bedrockFace, right: bedrockFace };
  }

  if (type === 'dirt') {
    const dirtFace = { backgroundImage: `url(${TEXTURE_URLS.dirt})` };
    return { top: dirtFace, bottom: dirtFace, front: dirtFace, back: dirtFace, left: dirtFace, right: dirtFace };
  }

  const stoneFace = { backgroundImage: `url(${TEXTURE_URLS.stone})` };
  return { top: stoneFace, bottom: stoneFace, front: stoneFace, back: stoneFace, left: stoneFace, right: stoneFace };
};

export const MiniBlock = ({ type, cubeSize }: { type: BlockType; cubeSize?: number }) => {
  const faces = getFaceConfigs(type);
  return (
    <div
      className="isometric-cube pointer-events-none"
      style={cubeSize ? ({ '--cube-size': `${cubeSize}px` } as React.CSSProperties) : undefined}
    >
      {/* Top face: directly lit */}
      <div className="cube-face cube-top" style={{ ...faces.top, filter: 'brightness(1.0)' }} />
      {/* Left face: medium diffuse lighting */}
      <div className="cube-face cube-left" style={{ ...faces.left, filter: 'brightness(0.8)' }} />
      {/* Front / Right face: darker shadow */}
      <div className="cube-face cube-front" style={{ ...faces.front, filter: 'brightness(0.6)' }} />
      {/* Back and remaining faces to ensure complete solid geometry */}
      <div className="cube-face cube-right" style={{ ...faces.right, filter: 'brightness(0.5)' }} />
      <div className="cube-face cube-back" style={{ ...faces.back, filter: 'brightness(0.7)' }} />
      <div className="cube-face cube-bottom" style={{ ...faces.bottom, filter: 'brightness(0.4)' }} />
    </div>
  );
};

export const getMinecraftCountStyle = (fontSize: number = 14): React.CSSProperties => ({
  fontFamily: MINECRAFT_PIXEL_FONT,
  color: '#ffffff',
  fontSize: `${fontSize}px`,
  lineHeight: 1,
  letterSpacing: '-0.5px',
  textShadow: '2px 2px 0 #3f3f3f, 1px 2px 0 #3f3f3f, 2px 1px 0 #3f3f3f',
  WebkitFontSmoothing: 'none',
  MozOsxFontSmoothing: 'grayscale',
  userSelect: 'none',
  pointerEvents: 'none',
});

export const StackQuantity = ({
  count,
  fontSize = 14,
  style,
  className = '',
}: {
  count: number;
  fontSize?: number;
  style?: React.CSSProperties;
  className?: string;
}) => {
  // In Minecraft Java, stacks of 1 or 0 never show quantity
  if (!count || count <= 1) return null;

  return (
    <span
      className={`absolute z-10 font-bold select-none pointer-events-none ${className}`}
      style={{
        ...getMinecraftCountStyle(fontSize),
        ...style,
      }}
    >
      {count}
    </span>
  );
};
