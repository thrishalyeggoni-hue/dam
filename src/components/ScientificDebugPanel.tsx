import React, { useState } from 'react';
import { Bug, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { SimulationFrame } from '../types';

interface ScientificDebugPanelProps {
  diagnostics: Record<string, unknown>;
  isDemoMode: boolean;
  currentFrame?: SimulationFrame;
  simulationId?: string;
  scenarioId?: string;
  peakDischarge?: number;
  maxFloodedArea?: number;
  metadata?: Record<string, unknown>;
}

/**
 * ScientificDebugPanel — Developer-only panel showing comprehensive ANUGA solver metrics,
 * provenance, exact cell locations of max depth/velocity, mass balance, and JSON download exports.
 * Activated with Ctrl+Shift+D or via the navbar debug button.
 */
export const ScientificDebugPanel: React.FC<ScientificDebugPanelProps> = ({
  diagnostics,
  isDemoMode,
  currentFrame,
  simulationId = 'sim-nagarjuna-major-breach',
  scenarioId = 'major',
  peakDischarge,
  maxFloodedArea,
  metadata,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const massErr = diagnostics?.mass_balance_error_percent as number | undefined;
  const massOk  = massErr !== undefined && massErr < 5.0;

  const maxDepthLoc = diagnostics?.max_depth_location as Record<string, unknown> | undefined;
  const maxVelLoc = diagnostics?.max_velocity_location as Record<string, unknown> | undefined;

  const handleDownloadFrame = () => {
    if (!currentFrame) return;
    const blob = new Blob([JSON.stringify(currentFrame, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frame_${currentFrame.time_seconds}s_${simulationId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMetadata = () => {
    const payload = {
      simulationId,
      scenarioId,
      metadata: metadata ?? {},
      diagnostics: diagnostics ?? {},
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation_provenance_${simulationId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute top-16 right-4 z-40 w-96 shadow-2xl select-text">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl border text-xs font-mono font-semibold transition-all ${
          isDemoMode
            ? 'bg-amber-950/95 border-amber-500/70 text-amber-300'
            : 'bg-slate-900/95 border-cyan-500/70 text-cyan-300 shadow-md'
        } backdrop-blur`}
      >
        <Bug className="w-4 h-4 text-cyan-400" />
        <span className="font-bold tracking-wide">Hydrodynamic Debug Console</span>
        <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
          isDemoMode ? 'bg-amber-600/50 text-amber-200' : 'bg-cyan-700/50 text-cyan-200'
        }`}>
          {isDemoMode ? 'DEMO DATA' : 'ANUGA 4.0'}
        </span>
        <span className="ml-auto">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {isExpanded && (
        <div className={`rounded-b-xl border border-t-0 backdrop-blur overflow-hidden ${
          isDemoMode
            ? 'bg-amber-950/95 border-amber-500/70 text-amber-100'
            : 'bg-slate-950/95 border-cyan-500/70 text-slate-200'
        }`}>
          {isDemoMode && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-600/30 border-b border-amber-500/50 text-amber-300 text-[11px]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>DEMO MODE — ANUGA numerical solver not connected</span>
            </div>
          )}

          <div className="p-3.5 space-y-2 text-[11px] font-mono max-h-[75vh] overflow-y-auto">
            {/* Provenance & IDs */}
            <div className="space-y-1">
              <Row label="SCIENTIFIC MODE" value={isDemoMode ? 'NO (DEMO)' : 'YES (PHYSICS)'} highlight={!isDemoMode} warn={isDemoMode} />
              <Row label="Solver" value={isDemoMode ? 'Procedural Fallback' : 'ANUGA 4.0 (2D SWE Saint-Venant)'} />
              <Row label="Simulation ID" value={simulationId} />
              <Row label="Scenario ID" value={scenarioId.toUpperCase()} />
              <Row label="DEM ID" value={String(diagnostics?.dem_id || 'nagarjuna-sagar-utm')} />
              <Row label="CRS" value={String(diagnostics?.crs || 'EPSG:32644 (UTM Zone 44N Metres)')} />
            </div>

            <Divider />

            {/* Mesh & Terrain */}
            <div className="space-y-1">
              <Row label="DEM Elev Range" value={`${diagnostics?.dem_min_elevation_m ?? 58.6}m – ${diagnostics?.dem_max_elevation_m ?? 400.0}m MSL`} />
              <Row label="Mesh Element Count" value={(diagnostics?.mesh_element_count as number | undefined)?.toLocaleString() ?? '8,428'} />
              <Row label="Mesh Min Area" value={diagnostics?.mesh_min_area_m2 ? `${diagnostics.mesh_min_area_m2} m²` : '—'} />
              <Row label="Mesh Max Area" value={diagnostics?.mesh_max_area_m2 ? `${diagnostics.mesh_max_area_m2} m²` : '—'} />
              <Row label="Manning Roughness n" value={String(diagnostics?.manning_n ?? 0.035)} />
              <Row label="Wet Threshold" value={`${diagnostics?.wet_threshold_m ?? 0.05} m`} />
            </div>

            <Divider />

            {/* Current Frame Dynamics */}
            <div className="space-y-1">
              <Row label="Current Timeline" value={currentFrame?.time_formatted ?? `T+${currentFrame?.time_seconds ?? 0}s`} highlight />
              <Row label="Solver Frame Index" value={`${currentFrame?.frame_index ?? 0} / ${diagnostics?.frame_count ?? '—'}`} />
              <Row label="Current Wet Cells" value={currentFrame?.wet_cell_count ? currentFrame.wet_cell_count.toLocaleString() : '—'} />
              <Row label="Current Flooded Area" value={currentFrame?.flooded_area_sqkm ? `${currentFrame.flooded_area_sqkm.toFixed(2)} km²` : '—'} />
              <Row label="Max Flooded Area" value={maxFloodedArea ? `${maxFloodedArea.toFixed(2)} km²` : '—'} />
              <Row label="Current Discharge Q(t)" value={currentFrame?.discharge_m3s ? `${currentFrame.discharge_m3s.toLocaleString()} m³/s` : '—'} />
              <Row label="Peak Outflow Q_max" value={peakDischarge ? `${peakDischarge.toLocaleString()} m³/s` : '—'} highlight />
            </div>

            <Divider />

            {/* Downstream Sanity & Extreme Value Tracking */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-cyan-400">Maximum Depth Cell Origin</div>
              {maxDepthLoc ? (
                <>
                  <Row label="Cell ID" value={`#${maxDepthLoc.cell_id}`} />
                  <Row label="Coordinates (UTM)" value={`X: ${maxDepthLoc.utm_x}, Y: ${maxDepthLoc.utm_y}`} />
                  <Row label="Coordinates (WGS84)" value={`${maxDepthLoc.latitude}°, ${maxDepthLoc.longitude}°`} />
                  <Row label="Bed Elevation" value={`${maxDepthLoc.elevation_m} m MSL`} />
                  <Row label="Water Stage" value={`${maxDepthLoc.stage_m} m MSL`} />
                  <Row label="Computed Max Depth" value={`${maxDepthLoc.max_depth_m} m (Stage - Bed)`} highlight />
                </>
              ) : (
                <div className="text-slate-500 text-[10px]">Evaluating downstream envelope...</div>
              )}

              {maxVelLoc && (
                <div className="pt-1">
                  <div className="text-[10px] uppercase font-bold text-cyan-400">Maximum Velocity Cell Origin</div>
                  <Row label="Cell ID" value={`#${maxVelLoc.cell_id}`} />
                  <Row label="Max Speed" value={`${maxVelLoc.max_velocity_ms} m/s`} highlight />
                </div>
              )}
            </div>

            <Divider />

            {/* Mass Balance & Timings */}
            <div className="space-y-1">
              <Row label="Solver Wall Time" value={`${diagnostics?.wall_time_s ?? '—'} s`} />
              <Row label="Initial Reservoir Vol" value={formatVol(diagnostics?.initial_reservoir_volume_m3)} />
              <Row label="Breach Outflow Vol" value={formatVol(diagnostics?.cumulative_breach_volume_m3)} />
              <Row label="Domain Final Vol" value={formatVol(diagnostics?.final_domain_volume_m3)} />
              <Row
                label="Mass Balance Error"
                value={massErr !== undefined ? `${massErr.toFixed(2)} %` : '—'}
                highlight={massOk}
                warn={massErr !== undefined && massErr >= 5.0}
              />
            </div>

            {massOk && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-900/30 border border-emerald-600/40 rounded text-emerald-400 text-[10px]">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Mass balance verified &lt; 5% error threshold</span>
              </div>
            )}

            {/* Download Buttons */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadFrame}
                className="flex items-center justify-center gap-1.5 px-2 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 rounded-lg transition-colors text-[10px] font-semibold"
              >
                <Download className="w-3 h-3" />
                <span>Frame JSON</span>
              </button>
              <button
                onClick={handleDownloadMetadata}
                className="flex items-center justify-center gap-1.5 px-2 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 rounded-lg transition-colors text-[10px] font-semibold"
              >
                <Download className="w-3 h-3" />
                <span>Metadata JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function Row({
  label, value, highlight = false, warn = false
}: {
  label: string; value: string | number | undefined; highlight?: boolean; warn?: boolean
}) {
  return (
    <div className="flex justify-between items-center gap-2 py-0.5">
      <span className="text-slate-400 truncate">{label}</span>
      <span className={`font-semibold truncate text-right ${
        highlight ? 'text-cyan-300' : warn ? 'text-amber-400' : 'text-slate-200'
      }`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-slate-800 my-1" />;
}

function formatVol(v: unknown): string {
  if (typeof v !== 'number') return '—';
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)} MCM`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)} k m³`;
  return `${v.toFixed(0)} m³`;
}
