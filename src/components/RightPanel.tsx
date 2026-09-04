import React from 'react';
import {
  Activity,
  Droplet,
  Gauge,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Maximize2,
  Crosshair,
} from 'lucide-react';
import {
  SimulationFrame,
  SimulationMetadata,
  ImpactStatistics,
  HydrodynamicGridPoint,
} from '../types';

interface RightPanelProps {
  currentFrame?: SimulationFrame;
  metadata?: SimulationMetadata;
  impactSummary?: ImpactStatistics;
  selectedPoint: HydrodynamicGridPoint | null;
  onClearPoint: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  currentFrame,
  metadata,
  impactSummary,
  selectedPoint,
  onClearPoint,
}) => {
  return (
    <aside className="w-80 md:w-96 border-l border-white/5 bg-[#0a0a0c] p-4 flex flex-col gap-5 z-20 overflow-y-auto text-[#e0e0e0] shrink-0 shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">
            Telemetry Stream
          </span>
        </div>
        <span className="text-[9px] font-mono text-emerald-400 animate-pulse flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          LIVE_FEED ({currentFrame?.time_formatted || '00:00'})
        </span>
      </div>

      {/* Main Discharge & Wave Telemetry */}
      <div>
        <div className="bg-white/5 p-3.5 rounded border border-white/10 space-y-3">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
              Current Breach Discharge (Q_t)
            </div>
            <div className="text-2xl font-mono font-bold text-blue-400 tracking-tight mt-0.5">
              {currentFrame?.discharge_m3s.toLocaleString() || '0'}{' '}
              <span className="text-xs font-normal text-white/60 font-sans">m³/s</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/5 text-xs">
            <div className="bg-white/5 p-2 rounded">
              <div className="text-[9px] uppercase tracking-wider text-white/40">Peak Outflow</div>
              <div className="text-xs font-mono font-semibold text-amber-300">
                {metadata?.peak_discharge_m3s.toLocaleString() || '0'} m³/s
              </div>
            </div>
            <div className="bg-white/5 p-2 rounded">
              <div className="text-[9px] uppercase tracking-wider text-white/40">Inundated Area</div>
              <div className="text-xs font-mono font-semibold text-cyan-400">
                {currentFrame?.flooded_area_sqkm.toFixed(1) || '0.0'} km²
              </div>
            </div>
            <div className="bg-white/5 p-2 rounded">
              <div className="text-[9px] uppercase tracking-wider text-white/40">Peak Stage Depth</div>
              <div className="text-xs font-mono font-semibold text-blue-300">
                {currentFrame?.max_depth_m.toFixed(1) || '0.0'} m
              </div>
            </div>
            <div className="bg-white/5 p-2 rounded">
              <div className="text-[9px] uppercase tracking-wider text-white/40">Max Wave Velocity</div>
              <div className="text-xs font-mono font-semibold text-rose-400">
                {currentFrame?.max_velocity_ms.toFixed(1) || '0.0'} m/s
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hydrograph (m³/s vs hr) Mini Visualizer */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">
            Hydrograph (m³/s vs hr)
          </span>
          <span className="text-[9px] font-mono text-white/30">T_peak: 30m</span>
        </div>
        <div className="h-28 bg-white/5 rounded border border-white/10 flex items-end p-2.5 gap-1.5 relative overflow-hidden">
          {[22, 45, 78, 100, 82, 60, 42, 28, 18, 12, 8, 6].map((pct, idx) => (
            <div
              key={idx}
              className={`flex-1 rounded-t transition-all ${
                idx === 3
                  ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.7)]'
                  : 'bg-blue-600/30 hover:bg-blue-500/50'
              }`}
              style={{ height: `${pct}%` }}
              title={`T+${idx * 15}m: ~${Math.round((pct / 100) * (metadata?.peak_discharge_m3s || 142000))} m³/s`}
            />
          ))}
          <div className="absolute top-2 right-2 text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/30">
            FROEHLICH FIT
          </div>
        </div>
      </div>

      {/* Point Inspection Probe */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">
              Point Inspection Probe
            </span>
          </div>
          {selectedPoint && (
            <button
              onClick={onClearPoint}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-mono transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        <div className="bg-white/5 p-3 rounded border border-white/10">
          {selectedPoint ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/40 text-[11px]">Coordinates</span>
                <span className="font-mono text-white/90">
                  {selectedPoint.lat.toFixed(4)}°N, {selectedPoint.lon.toFixed(4)}°E
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/40 text-[11px]">Ground Elevation</span>
                <span className="font-mono text-white/90">
                  {selectedPoint.elevation.toFixed(1)} m MSL
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/40 text-[11px]">Water Depth</span>
                <span className="font-mono font-bold text-blue-400">
                  {selectedPoint.depth > 0 ? `${selectedPoint.depth.toFixed(2)} m` : 'Dry (0.0 m)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/40 text-[11px]">Flow Velocity</span>
                <span className="font-mono font-bold text-amber-400">
                  {selectedPoint.velocity_mag > 0 ? `${selectedPoint.velocity_mag.toFixed(2)} m/s` : '0.0 m/s'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/40 text-[11px]">Flood Arrival Time</span>
                <span className="font-mono font-bold text-emerald-400">
                  {selectedPoint.arrival_time_min >= 0
                    ? `${selectedPoint.arrival_time_min} min (${(selectedPoint.arrival_time_min / 60).toFixed(1)}h)`
                    : 'Not reached yet'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-white/40 text-[11px]">Hazard Tier</span>
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                    selectedPoint.risk_level === 'VERY_HIGH'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : selectedPoint.risk_level === 'HIGH'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : selectedPoint.risk_level === 'MODERATE'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {selectedPoint.risk_level} HAZARD
                </span>
              </div>
            </div>
          ) : (
            <div className="py-3 text-center text-white/40 text-xs">
              <MapPin className="w-4 h-4 mx-auto mb-1 text-white/30" />
              <p className="text-[11px]">Click anywhere on 3D terrain or 2D map to inspect hydraulic values.</p>
            </div>
          )}
        </div>
      </div>

      {/* Immediate Impact Zone */}
      <div>
        <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold block mb-2">
          Immediate Impact Zone
        </span>
        <div className="space-y-2">
          <div className="p-2.5 rounded bg-white/5 border-l-2 border-red-500 text-xs flex justify-between items-center">
            <div>
              <div className="font-medium text-white">Nagarjuna Sagar Colony</div>
              <div className="text-[10px] text-white/40">ETA: 18m | Depth: 6.8m</div>
            </div>
            <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold">
              CRITICAL
            </span>
          </div>

          <div className="p-2.5 rounded bg-white/5 border-l-2 border-red-500 text-xs flex justify-between items-center">
            <div>
              <div className="font-medium text-white">Macherla Lowlands</div>
              <div className="text-[10px] text-white/40">ETA: 45m | Depth: 4.2m</div>
            </div>
            <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold">
              HIGH RISK
            </span>
          </div>

          <div className="p-2.5 rounded bg-white/5 border-l-2 border-amber-500 text-xs flex justify-between items-center">
            <div>
              <div className="font-medium text-white">NH-565 Krishna Bridge</div>
              <div className="text-[10px] text-white/40">ETA: 35m | Submerged 3.1m</div>
            </div>
            <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">
              SEVERED
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
