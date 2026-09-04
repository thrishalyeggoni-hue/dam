import React from 'react';
import {
  Layers,
  BarChart3,
  GitCompare,
  LifeBuoy,
  Film,
  Database,
  Globe2,
  Box,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { IndianDam } from '../types';

export type ActiveTab =
  | 'simulation'
  | 'impact'
  | 'comparison'
  | 'evacuation'
  | 'cinematic'
  | 'admin';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  viewMode: '2D' | '3D';
  setViewMode: (mode: '2D' | '3D') => void;
  dams: IndianDam[];
  selectedDam: IndianDam;
  onSelectDam: (dam: IndianDam) => void;
  isSimulating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  dams,
  selectedDam,
  onSelectDam,
  isSimulating,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0a0a0c] z-50 select-none shrink-0">
      {/* Brand & Dam Title */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] shrink-0">
          <div className="w-4 h-4 border-2 border-white rotate-45" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-widest uppercase text-white">
              DamBreak 3D
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-[9px] font-mono text-blue-400 uppercase tracking-wider">
              SWE-2D
            </span>
          </div>
          <p className="text-[10px] text-white/40 font-mono uppercase tracking-tighter hidden sm:block">
            Hydrodynamic Decision Support Platform v1.0.4
          </p>
        </div>

        {/* Indian Dam Selector Dropdown */}
        <div className="ml-2 pl-3 border-l border-white/10 hidden md:flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <select
            value={selectedDam.id}
            onChange={(e) => {
              const d = dams.find((item) => item.id === e.target.value);
              if (d) onSelectDam(d);
            }}
            className="bg-white/5 text-xs font-medium text-white/90 border border-white/10 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500 cursor-pointer hover:bg-white/10 transition-colors"
          >
            {dams.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#0a0a0c] text-white">
                {d.name} ({d.river}) {d.is_demo ? '★ Demo' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-3 text-[11px] font-medium text-white/60">
          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all uppercase tracking-wider ${
              activeTab === 'simulation'
                ? 'text-blue-400 bg-white/5 border border-white/10 shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simulation</span>
          </button>

          <button
            onClick={() => setActiveTab('impact')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all uppercase tracking-wider ${
              activeTab === 'impact'
                ? 'text-blue-400 bg-white/5 border border-white/10 shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Impact Analysis</span>
            <span className="lg:hidden hidden sm:inline">Impact</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all uppercase tracking-wider ${
              activeTab === 'comparison'
                ? 'text-blue-400 bg-white/5 border border-white/10 shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Scenarios</span>
          </button>

          <button
            onClick={() => setActiveTab('evacuation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all uppercase tracking-wider ${
              activeTab === 'evacuation'
                ? 'text-blue-400 bg-white/5 border border-white/10 shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Evacuation</span>
          </button>

          <button
            onClick={() => setActiveTab('cinematic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all uppercase tracking-wider ${
              activeTab === 'cinematic'
                ? 'text-purple-400 bg-white/5 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Cinematic FLIP</span>
            <span className="xl:hidden hidden sm:inline">Cinematic</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all uppercase tracking-wider ${
              activeTab === 'admin'
                ? 'text-blue-400 bg-white/5 border border-white/10 shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Data Setup</span>
            <span className="xl:hidden hidden sm:inline">Data</span>
          </button>
        </div>
      </nav>

      {/* Right Controls: 2D/3D Mode Switcher & Status */}
      <div className="flex items-center gap-3">
        {activeTab === 'simulation' && (
          <div className="flex items-center bg-white/5 border border-white/10 rounded p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('3D')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === '3D'
                  ? 'bg-blue-600 text-white font-bold shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Interactive 3D DEM Terrain & Dam Model"
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D</span>
            </button>
            <button
              onClick={() => setViewMode('2D')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === '2D'
                  ? 'bg-blue-600 text-white font-bold shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                  : 'text-white/60 hover:text-white'
              }`}
              title="2D Geospatial GIS Map with Inundation Layers"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>2D</span>
            </button>
          </div>
        )}

        {isSimulating ? (
          <div className="px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] font-mono tracking-wider animate-pulse flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            <span>SOLVING MODEL</span>
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-mono tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>MODEL ACTIVE</span>
          </div>
        )}

        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-white/80">
          CWC
        </div>
      </div>
    </header>
  );
};
