import React, { useState } from 'react';
import { useReactFlow } from 'reactflow';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCcw, 
  Grid, 
  Sparkles, 
  Orbit, 
  Magnet, 
  SlidersHorizontal,
  Map as MapIcon 
} from 'lucide-react';
import { Tooltip } from '../common/Tooltip';
import { useAutomataStore } from '../../store/automataStore';
import { CanvasSettingsModal } from './CanvasSettingsModal';

interface CanvasControlsProps {
  showMinimap: boolean;
  setShowMinimap: (show: boolean) => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  showMinimap,
  setShowMinimap
}) => {
  const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow();
  const canvasSettings = useAutomataStore(s => s.canvasSettings);
  const toggleCanvasSetting = useAutomataStore(s => s.toggleCanvasSetting);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleReset = () => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });
  };

  return (
    <>
      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1 rounded-2xl border border-zinc-200 bg-white/90 p-1.5 shadow-2xl backdrop-blur-xl dark:border-zinc-800/90 dark:bg-zinc-950/85 transition-colors duration-200">
        {/* Zoom Controls */}
        <Tooltip content="Zoom In" shortcut="+" side="top">
          <button
            onClick={() => zoomIn({ duration: 200 })}
            className="rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Zoom Out" shortcut="-" side="top">
          <button
            onClick={() => zoomOut({ duration: 200 })}
            className="rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </Tooltip>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 my-auto mx-0.5" />

        <Tooltip content="Fit to View" shortcut="Space" side="top">
          <button
            onClick={() => fitView({ padding: 0.25, duration: 300 })}
            className="rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Fit view"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Reset View" side="top">
          <button
            onClick={handleReset}
            className="rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </Tooltip>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 my-auto mx-0.5" />

        {/* Quick Toggles */}
        <Tooltip content={canvasSettings.showGrid ? 'Grid: ON' : 'Grid: OFF'} side="top">
          <button
            onClick={() => toggleCanvasSetting('showGrid')}
            className={`rounded-xl p-2 transition-all cursor-pointer ${
              canvasSettings.showGrid
                ? 'bg-violet-500/20 text-violet-700 border border-violet-500/40 shadow-xs dark:bg-violet-600/20 dark:text-violet-300'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200'
            }`}
            aria-label="Toggle grid"
          >
            <Grid className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content={canvasSettings.showParticles ? 'Particles: ON' : 'Particles: OFF'} side="top">
          <button
            onClick={() => toggleCanvasSetting('showParticles')}
            className={`rounded-xl p-2 transition-all cursor-pointer ${
              canvasSettings.showParticles
                ? 'bg-amber-500/20 text-amber-700 border border-amber-500/40 shadow-xs dark:bg-amber-500/20 dark:text-amber-300'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200'
            }`}
            aria-label="Toggle particles"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content={canvasSettings.physicsEnabled ? 'Physics Mode: ON' : 'Physics Mode: OFF'} side="top">
          <button
            onClick={() => toggleCanvasSetting('physicsEnabled')}
            className={`rounded-xl p-2 transition-all cursor-pointer ${
              canvasSettings.physicsEnabled
                ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 shadow-xs dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200'
            }`}
            aria-label="Toggle physics"
          >
            <Orbit className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content={canvasSettings.magnetEnabled ? 'Magnet Alignment: ON' : 'Magnet Alignment: OFF'} side="top">
          <button
            onClick={() => toggleCanvasSetting('magnetEnabled')}
            className={`rounded-xl p-2 transition-all cursor-pointer ${
              canvasSettings.magnetEnabled
                ? 'bg-cyan-500/20 text-cyan-700 border border-cyan-500/40 shadow-xs dark:bg-cyan-500/20 dark:text-cyan-300'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200'
            }`}
            aria-label="Toggle magnet snapping"
          >
            <Magnet className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content={showMinimap ? 'Hide MiniMap' : 'Show MiniMap'} side="top">
          <button
            onClick={() => setShowMinimap(!showMinimap)}
            className={`rounded-xl p-2 transition-colors cursor-pointer ${
              showMinimap ? 'bg-zinc-100 text-violet-600 dark:bg-zinc-800 dark:text-violet-400' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200'
            }`}
            aria-label="Toggle minimap"
          >
            <MapIcon className="w-4 h-4" />
          </button>
        </Tooltip>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 my-auto mx-0.5" />

        {/* Canvas Settings & Theme Modal Trigger */}
        <Tooltip content="Canvas Visual Settings & Themes" side="top">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="rounded-xl p-2 text-violet-600 hover:bg-violet-50 hover:text-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/40 dark:hover:text-violet-200 transition-colors cursor-pointer"
            aria-label="Canvas settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <CanvasSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
