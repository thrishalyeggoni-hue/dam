import React from 'react';
import {
  Layers,
  BarChart3,
  GitCompare,
  LifeBuoy,
  Globe2,
  Box,
  MapPin,
  AlertTriangle,
  Bot,
  Sparkles,
  Bug,
} from 'lucide-react';
import { IndianDam } from '../types';

export type ActiveTab =
  | 'simulation'
  | 'impact'
  | 'comparison'
  | 'evacuation';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  onSelectTab?: (tab: ActiveTab) => void;
  viewMode: '2D' | '3D';
  setViewMode?: (mode: '2D' | '3D') => void;
  onToggleViewMode?: () => void;
  dams: IndianDam[];
  selectedDam: IndianDam;
  onSelectDam: (dam: IndianDam) => void;
  isSimulating: boolean;
  onOpenAIAdvisor?: () => void;
  onToggleDebug?: () => void;
  isDebugOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onSelectTab,
  viewMode,
  setViewMode,
  onToggleViewMode,
  dams,
  selectedDam,
  onSelectDam,
  isSimulating,
  onOpenAIAdvisor,
  onToggleDebug,
  isDebugOpen,
}) => {
  const handleSelectTab = setActiveTab || onSelectTab;
  const handleSetViewMode = (mode: '2D' | '3D') => {
    if (setViewMode) {
      setViewMode(mode);
    } else if (onToggleViewMode && mode !== viewMode) {
      onToggleViewMode();
    }
  };
  return (
    <header className="flex items-center justify-between px-6 py-2.5 border-b border-slate-200 bg-white z-50 select-none shrink-0 shadow-sm">
      {/* Brand & Dam Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
          <div className="w-4 h-4 border-2 border-white rotate-45" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight uppercase text-slate-900">
              DamBreak 3D
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-mono text-blue-700 font-semibold">
              SWE-2D
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
            Hydrodynamic Dam Failure &amp; Flood Decision Platform
          </p>
        </div>

        {/* Indian Dam Selector Dropdown */}
        <div className="ml-2 pl-3 border-l border-slate-200 hidden md:flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
          <select
            value={selectedDam.id}
            onChange={(e) => {
              const d = dams.find((item) => item.id === e.target.value);
              if (d) onSelectDam(d);
            }}
            className="bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-100 transition-colors shadow-xs"
          >
            {dams.map((d) => (
              <option key={d.id} value={d.id} className="bg-white text-slate-800">
                {d.name} ({d.river})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-medium text-slate-600">
          <button
            onClick={() => handleSelectTab?.('simulation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'simulation'
                ? 'text-blue-700 bg-blue-50 font-bold border border-blue-200 shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Simulation</span>
          </button>

          <button
            onClick={() => handleSelectTab?.('impact')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'impact'
                ? 'text-blue-700 bg-blue-50 font-bold border border-blue-200 shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Impact Analysis</span>
            <span className="sm:hidden">Impact</span>
          </button>

          <button
            onClick={() => handleSelectTab?.('comparison')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'comparison'
                ? 'text-blue-700 bg-blue-50 font-bold border border-blue-200 shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scenarios</span>
            <span className="sm:hidden">Compare</span>
          </button>

          <button
            onClick={() => handleSelectTab?.('evacuation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'evacuation'
                ? 'text-blue-700 bg-blue-50 font-bold border border-blue-200 shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Evacuation</span>
            <span className="sm:hidden">Evac</span>
          </button>
        </div>
      </nav>

      {/* Right Controls: AI Advisor, 2D/3D Mode Switcher & Status */}
      <div className="flex items-center gap-2.5">
        {/* AI Water Flow Control Button */}
        {onOpenAIAdvisor && (
          <button
            onClick={onOpenAIAdvisor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            title="Open AI Hydrodynamic Gate & Flow Control Advisor"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Flow Control</span>
            <Sparkles className="w-3 h-3 text-yellow-300" />
          </button>
        )}

        {/* 2D / 3D Toggle */}
        {activeTab === 'simulation' && (
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => handleSetViewMode('2D')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                viewMode === '2D'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="2D Geospatial Map (Original OpenStreetMap & Satellite)"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>2D</span>
            </button>
            <button
              onClick={() => handleSetViewMode('3D')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                viewMode === '3D'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="3D Topographical DEM Valley & Dam Model"
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D</span>
            </button>
          </div>
        )}

        {/* Solver status badge */}
        {isSimulating ? (
          <div className="px-2.5 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-[10px] font-mono font-bold animate-pulse flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>SOLVING</span>
          </div>
        ) : (
          <div className="px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-mono font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>SOLVER READY</span>
          </div>
        )}

        {/* Scientific Debug Panel Toggle */}
        {onToggleDebug && (
          <button
            onClick={onToggleDebug}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium transition-all ${
              isDebugOpen
                ? 'bg-slate-900 border-cyan-500 text-cyan-300 shadow-sm'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Toggle Scientific Solver Debug Panel (Ctrl+Shift+D)"
          >
            <Bug className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Debug</span>
          </button>
        )}

        <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
          CWC
        </div>
      </div>
    </header>
  );
};
