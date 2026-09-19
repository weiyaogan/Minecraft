import React from 'react';
import { useWorldStore } from '../store';
import { Play, RotateCcw } from 'lucide-react';

export function PauseMenu() {
  const isPaused = useWorldStore(state => state.isPaused);
  const setPaused = useWorldStore(state => state.setPaused);
  const isMobile = useWorldStore(state => state.isMobile);
  const respawnPlayer = useWorldStore(state => state.respawnPlayer);

  if (!isPaused) return null;

  const handleResume = () => {
    setPaused(false);
    if (!isMobile) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        try {
          canvas.requestPointerLock();
        } catch (err) {
          // ignore lock exceptions
        }
      }
    }
  };

  const handleRespawn = () => {
    respawnPlayer();
    handleResume();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs select-none p-4 pointer-events-auto"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div 
        className="w-full max-w-sm flex flex-col items-center gap-4 text-white font-mono"
        style={{
          textShadow: '2px 2px 0 #1e1e1e'
        }}
      >
        {/* Title */}
        <h2 className="text-3xl font-bold tracking-wide uppercase mb-2 text-white">
          Game Paused
        </h2>

        {/* Button List */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Back to Game */}
          <button
            id="pause-resume-btn"
            onClick={handleResume}
            className="w-full py-3 px-4 bg-[#7a7a7a] active:bg-[#5a5a5a] hover:bg-[#8a8a8a] text-white font-bold border-2 border-t-[#bfbfbf] border-l-[#bfbfbf] border-b-[#303030] border-r-[#303030] shadow-md flex items-center justify-center gap-2 text-lg transition-transform active:translate-y-0.5 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Back to Game</span>
          </button>

          {/* Respawn */}
          <button
            id="pause-respawn-btn"
            onClick={handleRespawn}
            className="w-full py-3 px-4 bg-[#7a7a7a] active:bg-[#5a5a5a] hover:bg-[#8a8a8a] text-white font-bold border-2 border-t-[#bfbfbf] border-l-[#bfbfbf] border-b-[#303030] border-r-[#303030] shadow-md flex items-center justify-center gap-2 text-lg transition-transform active:translate-y-0.5 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Respawn Player</span>
          </button>
        </div>

        {/* Hint text */}
        <p className="text-xs text-stone-300 text-center mt-2 opacity-80">
          {isMobile ? 'Touch controls active' : 'Press ESC or click Resume to continue playing'}
        </p>
      </div>
    </div>
  );
}
