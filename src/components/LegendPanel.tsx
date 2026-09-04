import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, Info } from 'lucide-react';
import { LayerVisibility } from './LayersPanel';

interface LegendPanelProps {
  layers: LayerVisibility;
}

export const LegendPanel: React.FC<LegendPanelProps> = ({ layers }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute bottom-24 right-4 z-20 select-none">
      <div className="bg-[#0a0a0c]/90 backdrop-blur border border-white/10 rounded shadow-2xl overflow-hidden w-64 text-xs text-[#e0e0e0]">
        {/* Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Hydraulic Scale</span>
          </div>
          {collapsed ? <ChevronUp className="w-3.5 h-3.5 text-white/40" /> : <ChevronDown className="w-3.5 h-3.5 text-white/40" />}
        </button>

        {!collapsed && (
          <div className="p-3 space-y-3 max-h-80 overflow-y-auto divide-y divide-white/5">
            {/* Water Depth Legend */}
            {layers.water_depth && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">
                  Water Inundation Depth (h)
                </span>
                <div className="h-2.5 w-full rounded bg-gradient-to-r from-cyan-200 via-blue-500 via-indigo-600 to-purple-900 border border-white/10" />
                <div className="flex justify-between text-[9px] font-mono text-white/40">
                  <span>&lt;0.5m</span>
                  <span>1.5m</span>
                  <span>3.5m</span>
                  <span>&gt;6.0m</span>
                </div>
              </div>
            )}

            {/* Velocity Legend */}
            {layers.velocity_vectors && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">
                  Flow Velocity Magnitude (|u|)
                </span>
                <div className="h-2.5 w-full rounded bg-gradient-to-r from-emerald-400 via-yellow-400 via-orange-500 to-rose-600 border border-white/10" />
                <div className="flex justify-between text-[9px] font-mono text-white/40">
                  <span>0.2 m/s</span>
                  <span>2.0 m/s</span>
                  <span>5.0 m/s</span>
                  <span>&gt;10 m/s</span>
                </div>
              </div>
            )}

            {/* Flood Hazard Categories */}
            {layers.risk_zones && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">
                  Risk Category (h × v)
                </span>
                <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                    <span>Low (&lt;0.3)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-yellow-500" />
                    <span>Moderate (0.3-0.6)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-amber-500" />
                    <span>High (0.6-1.2)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-rose-600" />
                    <span>Very High (≥1.2)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Flood Arrival Time */}
            {layers.arrival_time && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">
                  Arrival Time Isochrones
                </span>
                <div className="h-2.5 w-full rounded bg-gradient-to-r from-rose-500 via-amber-400 via-cyan-400 to-blue-600 border border-white/10" />
                <div className="flex justify-between text-[9px] font-mono text-white/40">
                  <span>&lt; 30m</span>
                  <span>60m</span>
                  <span>90m</span>
                  <span>&gt; 2.5h</span>
                </div>
              </div>
            )}
            {/* Scientific Notice */}
            <div className="pt-2 text-[9px] font-mono text-white/30">
              Values derived directly from 2D hydrodynamic Saint-Venant shallow water equations.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
