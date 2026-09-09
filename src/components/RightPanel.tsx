import React from 'react';
import {
  Activity,
  Crosshair,
  MapPin,
  AlertCircle,
  Clock,
  Gauge,
  Layers,
  Wind,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  SimulationFrame,
  SimulationMetadata,
  ImpactStatistics,
  HydrodynamicGridPoint,
  InfrastructureFeature,
} from '../types';

interface RightPanelProps {
  currentFrame?: SimulationFrame;
  frames?: SimulationFrame[];
  metadata?: SimulationMetadata;
  impactSummary?: ImpactStatistics;
  infrastructure?: InfrastructureFeature[];
  selectedPoint: HydrodynamicGridPoint | null;
  onClearPoint: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  currentFrame,
  frames = [],
  metadata,
  impactSummary,
  infrastructure = [],
  selectedPoint,
  onClearPoint,
}) => {
  // Peak discharge for scaling hydrograph bars
  const peakQ = metadata?.peak_discharge_m3s || 41200;

  // Filter top critical infrastructure for dynamic alerts
  const criticalAssets = infrastructure
    .filter((f) => f.type !== 'shelter')
    .sort((a, b) => (b.water_depth_m || 0) - (a.water_depth_m || 0))
    .slice(0, 3);

  return (
    <aside className="w-80 md:w-96 border-l border-slate-200 bg-white p-4 flex flex-col gap-5 z-20 overflow-y-auto text-slate-800 shrink-0 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Real-Time Telemetry
          </span>
        </div>
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {currentFrame?.time_formatted || 'T+00:00'}
        </span>
      </div>

      {/* Main Metric: Instantaneous Outflow Discharge */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
          Current Outflow Discharge (Q_t)
        </span>
        <div className="flex items-baseline gap-2 my-1">
          <span className="text-3xl font-mono font-extrabold text-blue-600 tracking-tight">
            {currentFrame?.discharge_m3s.toLocaleString() || '0'}
          </span>
          <span className="text-xs font-mono text-slate-500 font-medium">m³/s</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-200/60 text-xs">
          <div className="bg-white p-2 rounded border border-slate-200/60">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Peak Outflow</div>
            <div className="text-xs font-mono font-bold text-amber-700">
              {metadata?.peak_discharge_m3s.toLocaleString() || '0'} m³/s
            </div>
          </div>

          <div className="bg-white p-2 rounded border border-slate-200/60">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Flooded Area</div>
            <div className="text-xs font-mono font-bold text-blue-600">
              {(currentFrame?.flooded_area_sqkm ?? 0).toFixed(1)} km²
            </div>
          </div>

          <div className="bg-white p-2 rounded border border-slate-200/60">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Max Stage Depth</div>
            <div className="text-xs font-mono font-bold text-slate-800">
              {(currentFrame?.max_depth_m ?? 0).toFixed(1)} m
            </div>
          </div>

          <div className="bg-white p-2 rounded border border-slate-200/60">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Max Wave Speed</div>
            <div className="text-xs font-mono font-bold text-rose-700">
              {(currentFrame?.max_velocity_ms ?? 0).toFixed(1)} m/s
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Hydrograph (m³/s vs time) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Discharge Hydrograph Curve
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Peak: {peakQ.toLocaleString()} m³/s
          </span>
        </div>

        <div className="h-28 bg-slate-50 rounded-lg border border-slate-200/80 flex items-end p-2.5 gap-1 relative overflow-hidden">
          {(frames.length > 0 ? frames : Array(13).fill(null)).map((f, idx) => {
            const discharge = f ? f.discharge_m3s : 1000;
            const heightPercent = Math.min(100, Math.max(8, (discharge / peakQ) * 100));
            const isCurrent = f && currentFrame && f.time_seconds === currentFrame.time_seconds;

            return (
              <div
                key={idx}
                className={`flex-1 rounded-t transition-all ${isCurrent
                    ? 'bg-blue-600 shadow-md ring-2 ring-blue-300'
                    : 'bg-blue-300 hover:bg-blue-400'
                  }`}
                style={{ height: `${heightPercent}%` }}
                title={f ? `${f.time_formatted}: ${f.discharge_m3s.toLocaleString()} m³/s` : `Frame ${idx}`}
              />
            );
          })}

          <div className="absolute top-2 right-2 text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
            2D SWE SOLVER
          </div>
        </div>
      </div>

      {/* Point Inspection Probe */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Point Inspection Probe
            </span>
          </div>
          {selectedPoint && (
            <button
              onClick={onClearPoint}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-2">
          {selectedPoint ? (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Coordinates</span>
                <span className="font-mono text-slate-800 font-medium">
                  {selectedPoint.lat.toFixed(4)}°N, {selectedPoint.lon.toFixed(4)}°E
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ground Elevation</span>
                <span className="font-mono text-slate-800 font-medium">
                  {(
                    (selectedPoint as unknown as Record<string, unknown>).elevation_m ??
                    selectedPoint.elevation ??
                    0
                  ) as number} m MSL
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Water Stage</span>
                <span className="font-mono text-slate-800 font-medium">
                  {(
                    (selectedPoint as unknown as Record<string, unknown>).water_surface_elevation_m ??
                    selectedPoint.water_surface_elev ??
                    0
                  ) as number} m MSL
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Water Depth (Stage - Bed)</span>
                <span className="font-mono font-bold text-blue-600">
                  {Number(
                    (selectedPoint as unknown as Record<string, unknown>).water_depth_m ??
                    selectedPoint.depth ??
                    0
                  ) > 0
                    ? `${Number(
                      (selectedPoint as unknown as Record<string, unknown>).water_depth_m ??
                      selectedPoint.depth
                    ).toFixed(2)} m`
                    : 'Dry (0.0 m)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Flow Velocity</span>
                <span className="font-mono font-bold text-amber-700">
                  {Number(
                    (selectedPoint as unknown as Record<string, unknown>).flow_velocity_ms ??
                    selectedPoint.velocity_mag ??
                    0
                  ) > 0
                    ? `${Number(
                      (selectedPoint as unknown as Record<string, unknown>).flow_velocity_ms ??
                      selectedPoint.velocity_mag
                    ).toFixed(2)} m/s`
                    : '0.0 m/s'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Flood Arrival Time</span>
                <span className="font-mono text-slate-700 font-medium">
                  {selectedPoint.arrival_time_min !== null &&
                    selectedPoint.arrival_time_min !== undefined &&
                    selectedPoint.arrival_time_min >= 0
                    ? `T+${Number(selectedPoint.arrival_time_min).toFixed(1)}m`
                    : 'Safe (Not Reached)'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">Hazard Tier</span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${selectedPoint.risk_level === 'VERY_HIGH'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : selectedPoint.risk_level === 'HIGH'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : selectedPoint.risk_level === 'MODERATE'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                >
                  {selectedPoint.risk_level} RISK
                </span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-slate-500 text-xs">
              <MapPin className="w-5 h-5 mx-auto mb-1 text-slate-400" />
              <p className="font-medium text-slate-600">Click any location on the map</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Inspects local water depth, velocity, and arrival time.</p>
            </div>
          )}
        </div>
      </div>

      {/* DYNAMIC Downstream Risk Exposure Alerts (Specific to Active Dam) */}
      <div>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
          Downstream Settlement Alerts
        </span>
        <div className="space-y-2">
          {infrastructure.length > 0 ? (
            infrastructure
              .filter((f) => f.type === 'village' || f.type === 'hospital' || f.type === 'bridge')
              .slice(0, 5)
              .map((asset) => {
                const status =
                  (asset as unknown as Record<string, unknown>).evacuation_status as string ||
                  ((asset.water_depth_m || 0) > 2.0
                    ? 'EVACUATE'
                    : (asset.water_depth_m || 0) > 0.05
                      ? 'ALERT'
                      : 'NOT REACHED');
                const isOutside = status === 'OUTSIDE MODEL DOMAIN';
                const isNotReached = status === 'NOT REACHED';
                const isEvac = status === 'EVACUATE';
                const isPrepare = status === 'PREPARE' || status === 'ALERT';
                const cellId = (asset as unknown as Record<string, unknown>).solver_cell_id;

                return (
                  <div
                    key={asset.id}
                    className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${isOutside
                        ? 'bg-slate-50 border-slate-200 text-slate-600'
                        : isEvac
                          ? 'bg-red-50 border-red-200 text-red-950'
                          : isPrepare
                            ? 'bg-amber-50 border-amber-200 text-amber-950'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{asset.name}</span>
                        {cellId !== undefined && cellId !== null && (
                          <span className="text-[9px] font-mono text-slate-400 font-normal">
                            [Cell #{String(cellId)}]
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] opacity-85">
                        {isOutside ? (
                          'OUTSIDE MODEL DOMAIN'
                        ) : isNotReached ? (
                          `Ground: ${asset.elevation_m}m MSL | Dry (Not Reached)`
                        ) : (
                          `ETA: T+${asset.arrival_time_min ?? 0}m | Depth: ${(asset.water_depth_m || 0).toFixed(1)}m | Vel: ${(asset.max_velocity_ms || 0).toFixed(1)}m/s`
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] text-white px-2 py-0.5 rounded font-bold font-mono shrink-0 ${isOutside
                          ? 'bg-slate-500'
                          : isEvac
                            ? 'bg-red-600'
                            : isPrepare
                              ? 'bg-amber-600'
                              : 'bg-emerald-600'
                        }`}
                    >
                      {status}
                    </span>
                  </div>
                );
              })
          ) : (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All monitored downstream reaches currently within safe non-flood stage.</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
