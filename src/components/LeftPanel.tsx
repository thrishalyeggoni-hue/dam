import React, { useState } from 'react';
import {
  Sliders,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldAlert,
  Droplets,
  Clock,
  Compass,
  Zap,
} from 'lucide-react';
import { IndianDam, BreachParameters, FailureType } from '../types';

interface LeftPanelProps {
  dam: IndianDam;
  parameters: BreachParameters;
  onParametersChange: (params: BreachParameters) => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
  simulationStage: string;
  simulationProgress: number;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  dam,
  parameters,
  onParametersChange,
  onRunSimulation,
  isSimulating,
  simulationStage,
  simulationProgress,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDamDetails, setShowDamDetails] = useState(true);

  // Preset handler
  const handlePresetSelect = (type: FailureType) => {
    let breachWidth = 60;
    let breachHeight = 55;
    let formationTime = 45;

    if (type === 'partial') {
      breachWidth = 30;
      breachHeight = 25;
      formationTime = 60;
    } else if (type === 'major') {
      breachWidth = 60;
      breachHeight = 55;
      formationTime = 45;
    } else if (type === 'complete') {
      breachWidth = 150;
      breachHeight = dam.height_m * 0.85;
      formationTime = 25;
    }

    onParametersChange({
      ...parameters,
      failure_type: type,
      breach_width_m: breachWidth,
      breach_height_m: Math.round(breachHeight),
      breach_formation_time_min: formationTime,
    });
  };

  // Quick estimation of theoretical peak discharge
  const estHead = parameters.reservoir_water_level_m - (dam.crest_elevation_m - parameters.breach_height_m);
  const estPeakQ = Math.round(
    0.48 *
      parameters.breach_width_m *
      Math.sqrt(2 * 9.81) *
      Math.pow(Math.max(5, estHead), 1.5)
  );

  return (
    <aside className="w-80 md:w-96 border-r border-white/5 bg-[#0a0a0c] flex flex-col h-full overflow-y-auto text-[#e0e0e0] z-20 shrink-0 shadow-2xl">
      {/* Selected Dam Metadata Card */}
      <div className="p-4 border-b border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">
            Target Asset
          </label>
          <button
            onClick={() => setShowDamDetails(!showDamDetails)}
            className="text-white/40 hover:text-white text-xs flex items-center gap-1 transition-colors"
          >
            {showDamDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="bg-white/5 p-3 rounded border border-white/10">
          <div className="flex items-baseline justify-between">
            <div className="text-sm font-semibold text-white">{dam.name}</div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/10">
              {dam.river}
            </span>
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">{dam.state}</div>

          {showDamDetails && (
            <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 p-2 rounded">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold block">Height</span>
                <span className="text-xs font-mono text-white/90">{dam.height_m}m</span>
              </div>
              <div className="bg-white/5 p-2 rounded">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold block">Crest Length</span>
                <span className="text-xs font-mono text-white/90">{dam.length_m}m</span>
              </div>
              <div className="bg-white/5 p-2 rounded">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold block">FRL (Full Level)</span>
                <span className="text-xs font-mono text-blue-400">{dam.full_reservoir_level_m}m MSL</span>
              </div>
              <div className="bg-white/5 p-2 rounded">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold block">Gross Capacity</span>
                <span className="text-xs font-mono text-blue-400">{(dam.gross_capacity_mcm / 1000).toFixed(2)} BCM</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono">
                <span>LAT/LON</span>
                <span>
                  {dam.latitude.toFixed(4)}°N, {dam.longitude.toFixed(4)}°E
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scenario Creator Form */}
      <div className="p-4 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">
            Breach Parameters
          </label>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase">
            2D SWE Engine
          </span>
        </div>

        {/* Failure Type Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">
            Failure Mode Preset
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {(['partial', 'major', 'complete', 'custom'] as FailureType[]).map((type) => (
              <button
                key={type}
                onClick={() => handlePresetSelect(type)}
                className={`text-xs py-1.5 px-2 rounded font-mono uppercase tracking-wider border transition-all text-center ${
                  parameters.failure_type === type
                    ? 'bg-blue-600/30 text-blue-400 border-blue-500/40 shadow-[0_0_10px_rgba(37,99,235,0.2)] font-semibold'
                    : 'bg-white/5 text-white/50 border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                {type === 'partial' && 'Partial'}
                {type === 'major' && 'Major'}
                {type === 'complete' && 'Complete'}
                {type === 'custom' && 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {/* Breach Parameter Inputs */}
        <div className="space-y-3.5 bg-white/5 p-3 rounded border border-white/10">
          {/* Reservoir Water Level */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60 text-[11px] flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                Reservoir Water Level
              </span>
              <span className="font-mono text-xs text-blue-400 font-semibold">
                {parameters.reservoir_water_level_m}m MSL
              </span>
            </div>
            <input
              type="range"
              min={dam.crest_elevation_m - 40}
              max={dam.crest_elevation_m + 3}
              step={0.5}
              value={parameters.reservoir_water_level_m}
              onChange={(e) =>
                onParametersChange({
                  ...parameters,
                  reservoir_water_level_m: parseFloat(e.target.value),
                  failure_type: 'custom',
                })
              }
              className="w-full accent-blue-500 h-1.5 bg-white/10 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/40 font-mono mt-0.5">
              <span>FRL -40m</span>
              <span>Design FRL ({dam.full_reservoir_level_m}m)</span>
            </div>
          </div>

          {/* Breach Width */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60 text-[11px]">Breach Width</span>
              <span className="font-mono text-xs text-amber-400 font-semibold">
                {parameters.breach_width_m}m
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={250}
              step={5}
              value={parameters.breach_width_m}
              onChange={(e) =>
                onParametersChange({
                  ...parameters,
                  breach_width_m: parseInt(e.target.value, 10),
                  failure_type: 'custom',
                })
              }
              className="w-full accent-blue-500 h-1.5 bg-white/10 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/40 font-mono mt-0.5">
              <span>10m (spillway)</span>
              <span>250m (catastrophic)</span>
            </div>
          </div>

          {/* Breach Height */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60 text-[11px]">Breach Vertical Depth</span>
              <span className="font-mono text-xs text-white/90 font-semibold">
                {parameters.breach_height_m}m
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={dam.height_m}
              step={1}
              value={parameters.breach_height_m}
              onChange={(e) =>
                onParametersChange({
                  ...parameters,
                  breach_height_m: parseInt(e.target.value, 10),
                  failure_type: 'custom',
                })
              }
              className="w-full accent-blue-500 h-1.5 bg-white/10 rounded cursor-pointer"
            />
          </div>

          {/* Breach Formation Time */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60 text-[11px] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-white/40" />
                Breach Formation Time
              </span>
              <span className="font-mono text-xs text-emerald-400 font-semibold">
                {parameters.breach_formation_time_min} min
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={180}
              step={5}
              value={parameters.breach_formation_time_min}
              onChange={(e) =>
                onParametersChange({
                  ...parameters,
                  breach_formation_time_min: parseInt(e.target.value, 10),
                  failure_type: 'custom',
                })
              }
              className="w-full accent-blue-500 h-1.5 bg-white/10 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/40 font-mono mt-0.5">
              <span>10 min (rapid)</span>
              <span>180 min (gradual piping)</span>
            </div>
          </div>

          {/* Breach Location */}
          <div>
            <label className="text-[11px] text-white/60 flex items-center gap-1 mb-1.5">
              <Compass className="w-3.5 h-3.5 text-white/40" />
              Breach Location on Dam Axis
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  ['left_abutment', 'Left Flank'],
                  ['center', 'Center'],
                  ['right_abutment', 'Right Flank'],
                ] as const
              ).map(([loc, label]) => (
                <button
                  key={loc}
                  onClick={() =>
                    onParametersChange({ ...parameters, breach_location: loc })
                  }
                  className={`text-[10px] py-1 px-1 rounded border text-center font-mono uppercase tracking-wider transition-colors ${
                    parameters.breach_location === loc
                      ? 'bg-blue-600/30 border-blue-500/50 text-blue-400 font-semibold'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Theoretical Discharge Estimate Card */}
        <div className="bg-white/5 p-3 rounded border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">
                Froehlich Peak Outflow
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">
                ~{estPeakQ.toLocaleString()} m³/s
              </span>
            </div>
          </div>
          <span className="text-[9px] text-white/30 font-mono">Q = C_d·B·√(2g)·H^1.5</span>
        </div>

        {/* Collapsible Advanced Hydraulics Settings */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full text-xs text-white/50 hover:text-white flex items-center justify-between py-1.5 px-2.5 rounded bg-white/5 border border-white/10 transition-colors"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider">Advanced Hydraulic Parameters</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showAdvanced && (
            <div className="mt-2 space-y-2 p-3 bg-white/5 rounded border border-white/10 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-white/50">Manning's Roughness (n)</span>
                <span className="font-mono text-blue-400 text-xs">0.035 (Krishna Gorge)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Weir Discharge Coeff (Cd)</span>
                <span className="font-mono text-blue-400 text-xs">0.48</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Grid Resolution</span>
                <span className="font-mono text-blue-400 text-xs">450m DEM Cells</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Gravity Constant (g)</span>
                <span className="font-mono text-blue-400 text-xs">9.81 m/s²</span>
              </div>
            </div>
          )}
        </div>

        {/* Execution Button & Live Progress */}
        <div className="pt-2">
          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className={`w-full py-3 px-4 rounded font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] ${
              isSimulating
                ? 'bg-amber-600/60 text-amber-200 cursor-not-allowed border border-amber-500/50'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isSimulating ? (
              <>
                <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                <span>SOLVING HYDRODYNAMIC MODEL...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>RUN SIMULATION</span>
              </>
            )}
          </button>

          {/* Progress Bar when running */}
          {isSimulating && (
            <div className="mt-3 p-3 bg-white/5 rounded border border-amber-500/30 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-amber-400 font-medium animate-pulse">
                  {simulationStage}
                </span>
                <span className="font-mono font-bold text-amber-300">{simulationProgress}%</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${simulationProgress}%` }}
                />
              </div>
              <p className="text-[9px] text-white/40 italic">
                Solving Saint-Venant 2D momentum &amp; continuity equations across real DEM topography.
              </p>
            </div>
          )}
        </div>

        {/* Scientific Model Disclaimer */}
        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="text-[10px] text-white/30 italic leading-tight">
            Scientific Model: Shallow Water Equations (SWE) via ANUGA Engine. Validated terrain source: CartoDEM v3 / SRTM 30m.
          </div>
        </div>
      </div>
    </aside>
  );
};
