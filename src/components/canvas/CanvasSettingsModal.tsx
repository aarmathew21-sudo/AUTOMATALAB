import React from 'react';
import { Modal } from '../common/Modal';
import { useAutomataStore } from '../../store/automataStore';
import type { BackgroundTheme } from '../../types/automata';
import { 
  Sparkles, 
  Grid, 
  Orbit, 
  Magnet, 
  Activity, 
  EyeOff, 
  Layers
} from 'lucide-react';

interface CanvasSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CanvasSettingsModal: React.FC<CanvasSettingsModalProps> = ({ isOpen, onClose }) => {
  const canvasSettings = useAutomataStore(s => s.canvasSettings);
  const toggleCanvasSetting = useAutomataStore(s => s.toggleCanvasSetting);
  const setBackgroundTheme = useAutomataStore(s => s.setBackgroundTheme);

  const themes: { id: BackgroundTheme; name: string; desc: string; previewClass: string }[] = [
    {
      id: 'nebula',
      name: 'Nebula',
      desc: 'Celestial violet/cyan glow with living atmosphere',
      previewClass: 'from-violet-900/60 via-purple-950/80 to-zinc-950 border-violet-500/40'
    },
    {
      id: 'midnight',
      name: 'Midnight',
      desc: 'Deep indigo void with soft starlight particles',
      previewClass: 'from-blue-950/60 via-indigo-950/80 to-zinc-950 border-blue-500/40'
    },
    {
      id: 'graph',
      name: 'Graph',
      desc: 'Mathematical blueprint grid with cyan contour lines',
      previewClass: 'from-cyan-950/50 via-slate-950/90 to-zinc-950 border-cyan-500/40'
    },
    {
      id: 'minimal',
      name: 'Minimal',
      desc: 'Distraction-free pure obsidian dark workspace',
      previewClass: 'from-zinc-900 via-zinc-950 to-black border-zinc-700/50'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Canvas & Visual Settings"
      subtitle="Customize the living mathematical workspace appearance, physics, and interactions."
      maxWidth="lg"
    >
      <div className="space-y-6 text-zinc-200">
        {/* Background Theme Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            Background Workspace Theme
          </label>
          <div className="grid grid-cols-2 gap-3">
            {themes.map(t => {
              const isSelected = canvasSettings.backgroundTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setBackgroundTheme(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all bg-gradient-to-br ${t.previewClass} ${
                    isSelected
                      ? 'ring-2 ring-violet-400 shadow-lg shadow-violet-600/20 scale-[1.02]'
                      : 'hover:border-zinc-500 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="font-semibold text-xs text-zinc-100 flex items-center justify-between">
                    <span>{t.name}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_#a855f7]" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-snug">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Switches Grid */}
        <div className="space-y-3 pt-3 border-t border-zinc-800">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Living Elements & Mechanics
          </label>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 divide-y divide-zinc-800/80">
            {/* Grid Toggle */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <Grid className="w-4 h-4 text-violet-400" />
                <div>
                  <div className="text-xs font-medium text-zinc-200">Mathematical Grid</div>
                  <div className="text-[11px] text-zinc-500">Show subtle coordinate dot grid</div>
                </div>
              </div>
              <button
                onClick={() => toggleCanvasSetting('showGrid')}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  canvasSettings.showGrid ? 'bg-violet-600' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 mt-0.5 ml-0.5 ${
                    canvasSettings.showGrid ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Particles Toggle */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-medium text-zinc-200">Cosmic Particles</div>
                  <div className="text-[11px] text-zinc-500">Faint floating glowing micro-particles</div>
                </div>
              </div>
              <button
                onClick={() => toggleCanvasSetting('showParticles')}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  canvasSettings.showParticles ? 'bg-violet-600' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 mt-0.5 ml-0.5 ${
                    canvasSettings.showParticles ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Flow Field Toggle */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-xs font-medium text-zinc-200">Contour Field Lines</div>
                  <div className="text-[11px] text-zinc-500">Flowing organic mathematical contours</div>
                </div>
              </div>
              <button
                onClick={() => toggleCanvasSetting('showFlowField')}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  canvasSettings.showFlowField ? 'bg-violet-600' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 mt-0.5 ml-0.5 ${
                    canvasSettings.showFlowField ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Physics Mode Toggle */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <Orbit className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-medium text-zinc-200">Force-Directed Physics Settling</div>
                  <div className="text-[11px] text-zinc-500">Gentle spring layout & overlap repulsion</div>
                </div>
              </div>
              <button
                onClick={() => toggleCanvasSetting('physicsEnabled')}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  canvasSettings.physicsEnabled ? 'bg-emerald-600' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 mt-0.5 ml-0.5 ${
                    canvasSettings.physicsEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Magnet Mode Toggle */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <Magnet className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-medium text-zinc-200">Smart Magnetic Alignment</div>
                  <div className="text-[11px] text-zinc-500">Subtle axis snapping with guide lines</div>
                </div>
              </div>
              <button
                onClick={() => toggleCanvasSetting('magnetEnabled')}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  canvasSettings.magnetEnabled ? 'bg-cyan-600' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 mt-0.5 ml-0.5 ${
                    canvasSettings.magnetEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <EyeOff className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="text-xs font-medium text-zinc-200">Reduced Motion / Static Mode</div>
                  <div className="text-[11px] text-zinc-500">Disables animations and particle drift</div>
                </div>
              </div>
              <button
                onClick={() => toggleCanvasSetting('reducedMotion')}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  canvasSettings.reducedMotion ? 'bg-rose-600' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 mt-0.5 ml-0.5 ${
                    canvasSettings.reducedMotion ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
