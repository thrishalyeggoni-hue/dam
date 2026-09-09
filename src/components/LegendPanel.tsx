import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, Info, Check } from 'lucide-react';
import { LayerVisibility } from './LayersPanel';
import { HydraulicLayerMode } from '../utils/hydraulicScale';

interface LegendPanelProps {
  layers: LayerVisibility;
  activeHydraulicLayer?: HydraulicLayerMode;
  onSelectHydraulicLayer?: (mode: HydraulicLayerMode) => void;
}

export const LegendPanel: React.FC<LegendPanelProps> = ({
  layers,
  activeHydraulicLayer = 'depth',
  onSelectHydraulicLayer,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const modes: { id: HydraulicLayerMode; label: string; unit: string }[] = [
    { id: 'depth', label: 'Water Depth', unit: 'm' },
    { id: 'velocity', label: 'Flow Velocity', unit: 'm/s' },
    { id: 'hazard', label: 'Hazard Tier', unit: 'H×V' },
    { id: 'arrival_time', label: 'Arrival Time', unit: 'min' },
  ];

  return (
    <div className="absolute bottom-24 right-4 z-20 select-none">
      <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-lg overflow-hidden w-72 text-xs text-slate-800">
        {/* Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Hydraulic Scale</span>
          </div>
          {collapsed ? (
            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-normal">
              <span>Expand</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </div>
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {!collapsed && (
          <div className="p-3.5 space-y-3.5 max-h-96 overflow-y-auto">
            {/* Mode Selector Tabs */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Active Simulation Layer
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {modes.map((m) => {
                  const isActive = activeHydraulicLayer === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => onSelectHydraulicLayer?.(m.id)}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-left transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] leading-tight">{m.label}</span>
                        <span className={`text-[9px] ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                          {m.unit}
                        </span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="divide-y divide-slate-100 pt-1">
              {/* Water Depth Legend */}
              <div
                onClick={() => onSelectHydraulicLayer?.('depth')}
                className={`cursor-pointer rounded-lg p-2 transition-colors ${
                  activeHydraulicLayer === 'depth' ? 'bg-blue-50/70 ring-1 ring-blue-300' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Water Depth (H)
                  </span>
                  {activeHydraulicLayer === 'depth' && (
                    <span className="text-[9px] font-semibold text-blue-600 uppercase">ACTIVE</span>
                  )}
                </div>
                <div
                  className="h-3 w-full rounded border border-slate-200 shadow-xs"
                  style={{
                    background: 'linear-gradient(to right, #38bdf8 0%, #0284c7 25%, #1d4ed8 60%, #312e81 85%, #1e1b4b 100%)',
                  }}
                />
                <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-600 mt-1">
                  <span>&lt;0.5m</span>
                  <span>1.5m</span>
                  <span>3.5m</span>
                  <span>6.0m</span>
                  <span>&gt;6.0m</span>
                </div>
              </div>

              {/* Flow Velocity Legend */}
              <div
                onClick={() => onSelectHydraulicLayer?.('velocity')}
                className={`cursor-pointer rounded-lg p-2 transition-colors mt-2 ${
                  activeHydraulicLayer === 'velocity' ? 'bg-blue-50/70 ring-1 ring-blue-300' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Flow Velocity (|U|)
                  </span>
                  {activeHydraulicLayer === 'velocity' && (
                    <span className="text-[9px] font-semibold text-blue-600 uppercase">ACTIVE</span>
                  )}
                </div>
                <div
                  className="h-3 w-full rounded border border-slate-200 shadow-xs"
                  style={{
                    background: 'linear-gradient(to right, #10b981 0%, #eab308 35%, #f97316 70%, #ef4444 100%)',
                  }}
                />
                <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-600 mt-1">
                  <span>&lt;0.2 m/s</span>
                  <span>2.0 m/s</span>
                  <span>5.0 m/s</span>
                  <span>&gt;5.0 m/s</span>
                </div>
              </div>

              {/* Hazard Categories Tier */}
              <div
                onClick={() => onSelectHydraulicLayer?.('hazard')}
                className={`cursor-pointer rounded-lg p-2 transition-colors mt-2 ${
                  activeHydraulicLayer === 'hazard' ? 'bg-blue-50/70 ring-1 ring-blue-300' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Hazard Tier (H &times; V)
                  </span>
                  {activeHydraulicLayer === 'hazard' && (
                    <span className="text-[9px] font-semibold text-blue-600 uppercase">ACTIVE</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-medium mt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
                    <span className="text-slate-600">Low (&lt;0.3)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500 shrink-0" />
                    <span className="text-slate-600">Moderate (0.3-0.6)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 shrink-0" />
                    <span className="text-slate-600">High (0.6-1.2)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 shrink-0" />
                    <span className="text-slate-600">Very High (&ge;1.2)</span>
                  </div>
                </div>
              </div>

              {/* Arrival Time */}
              <div
                onClick={() => onSelectHydraulicLayer?.('arrival_time')}
                className={`cursor-pointer rounded-lg p-2 transition-colors mt-2 ${
                  activeHydraulicLayer === 'arrival_time' ? 'bg-blue-50/70 ring-1 ring-blue-300' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Arrival Time
                  </span>
                  {activeHydraulicLayer === 'arrival_time' && (
                    <span className="text-[9px] font-semibold text-blue-600 uppercase">ACTIVE</span>
                  )}
                </div>
                <div
                  className="h-2.5 w-full rounded border border-slate-200 shadow-xs"
                  style={{
                    background: 'linear-gradient(to right, #f43f5e 0%, #f59e0b 35%, #38bdf8 70%, #1d4ed8 100%)',
                  }}
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-600 mt-1">
                  <span>&lt;30m</span>
                  <span>60m</span>
                  <span>120m</span>
                  <span>&gt;2h</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[9px] text-slate-400 flex items-center gap-1 border-t border-slate-100">
              <Info className="w-3 h-3 text-blue-500 shrink-0" />
              <span>Real 2D SWE ANUGA Solver Field Values</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
