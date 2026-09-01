import React, { useState } from 'react';
import { useAutomataStore } from '../../store/automataStore';
import { 
  Network, 
  Save, 
  FolderOpen, 
  Download, 
  Upload, 
  Moon, 
  Sun,
  Shuffle,
  Trophy,
  PenTool,
  Home
} from 'lucide-react';
import { PresetsDropdown } from './PresetsDropdown';
import { ExportModal } from './ExportModal';
import { ImportModal } from './ImportModal';
import { Tooltip } from '../common/Tooltip';

export const TopNavbar: React.FC = () => {
  const activePage = useAutomataStore(s => s.activePage);
  const setActivePage = useAutomataStore(s => s.setActivePage);
  const theme = useAutomataStore(s => s.theme);
  const toggleTheme = useAutomataStore(s => s.toggleTheme);
  const saveToStorage = useAutomataStore(s => s.saveToStorage);
  const loadFromStorage = useAutomataStore(s => s.loadFromStorage);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  return (
    <>
      <header className="h-14 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none shrink-0">
        {/* Left: Brand Logo & Navigation Links */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActivePage('home')}
            className="flex items-center gap-2.5 group transition-transform focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform">
              <Network className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm tracking-tight text-zinc-100 flex items-center gap-1.5">
                AutomataLab
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-violet-500/20 text-violet-300 rounded border border-violet-500/30">
                  v1.0
                </span>
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80">
            <button
              onClick={() => setActivePage('home')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activePage === 'home'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActivePage('editor')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activePage === 'editor'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>

            <button
              onClick={() => setActivePage('practice')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activePage === 'practice'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Practice</span>
            </button>

            <button
              onClick={() => setActivePage('convert')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activePage === 'convert'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Convert</span>
            </button>
          </nav>
        </div>

        {/* Right: Storage, Import/Export & Theme Toggle */}
        <div className="flex items-center gap-2">
          {activePage === 'editor' && <PresetsDropdown />}

          {activePage === 'editor' && (
            <>
              <div className="h-4 w-px bg-zinc-800 my-auto mx-1" />

              <Tooltip content="Save to Browser Storage" shortcut="Ctrl+S">
                <button
                  onClick={saveToStorage}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save</span>
                </button>
              </Tooltip>

              <Tooltip content="Load from Browser Storage">
                <button
                  onClick={loadFromStorage}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Load</span>
                </button>
              </Tooltip>

              <div className="h-4 w-px bg-zinc-800 my-auto mx-1" />

              <Tooltip content="Import JSON file or text">
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Import</span>
                </button>
              </Tooltip>

              <Tooltip content="Export automaton to JSON">
                <button
                  onClick={() => setIsExportOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-600/10 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-600/20 hover:border-violet-500/50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-violet-400" />
                  <span>Export</span>
                </button>
              </Tooltip>
            </>
          )}

          <div className="h-4 w-px bg-zinc-800 my-auto mx-1" />

          {/* Theme Toggle */}
          <Tooltip content={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}>
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-400" />}
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Export & Import Modals */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </>
  );
};
