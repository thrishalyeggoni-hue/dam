import React, { useState } from 'react';
import {
  Play,
  ChevronDown,
  ChevronUp,
  Droplets,
  Clock,
  Compass,
  Zap,
  Info,
} from 'lucide-react';
import { IndianDam, BreachParameters, FailureType } from '../types';

interface LeftPanelProps {
  dam: IndianDam;
  parameters: BreachParameters;
  onParametersChange: (params: BreachParameters) => void;
  onRunSimulation: (overrideParams?: BreachParameters) => void;
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

  // Preset handler — immediately updates parameters and triggers a real simulation
  const handlePresetSelect = (type: FailureType) => {
    let breachWidth = 60;
    let breachHeight = 55;
    let formationTime = 45;
    let resLevel = dam.full_reservoir_level_m;

    if (type === 'partial') {
      breachWidth = 30;
      breachHeight = 25;
      formationTime = 60;
      resLevel = Number((dam.full_reservoir_level_m - 4.8).toFixed(1)); // 175m
    } else if (type === 'major') {
      breachWidth = 60;
      breachHeight = 55;
      formationTime = 45;
      resLevel = dam.full_reservoir_level_m; // 179.8m
    } else if (type === 'complete') {
      breachWidth = 150;
      breachHeight = Math.round(dam.height_m * 0.85);
      formationTime = 25;
      resLevel = Number((dam.crest_elevation_m + 1.2).toFixed(1)); // 181m
    }

    const updated: BreachParameters = {
      ...parameters,
      failure_type: type,
      breach_width_m: breachWidth,
      breach_height_m: breachHeight,
      breach_formation_time_min: formationTime,
      reservoir_water_level_m: resLevel,
    };

    onParametersChange(updated);
    if (type !== 'custom') {
      onRunSimulation(updated);
    }
  };

  // Quick theoretical estimation
  const estHead = parameters.reservoir_water_level_m - (dam.crest_elevation_m - parameters.breach_height_m);
  const estPeakQ = Math.round(
    0.48 *
      parameters.breach_width_m *
      Math.sqrt(2 * 9.81) *
      Math.pow(Math.max(5, estHead), 1.5)
  );

  return (
    <aside className="w-80 md:w-96 border-r border-slate-200 bg-white flex flex-col h-full overflow-y-auto text-slate-800 z-20 shrink-0 shadow-sm">
      {/* Selected Dam Metadata Card */}
      <div className="p-4 border-b border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Active Dam Facility
          </label>
          <button
            onClick={() => setShowDamDetails(!showDamDetails)}
            className="text-slate-400 hover:text-slate-700 text-xs flex items-center gap-1 transition-colors"
          >
            {showDamDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
          <div className="flex items-baseline justify-between">
            <div className="text-sm font-bold text-slate-900">{dam.name}</div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
              {dam.river}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{dam.state}</div>

          {showDamDetails && (
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded border border-slate-200/60">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Dam Height</span>
                <span className="text-xs font-mono font-semibold text-slate-800">{dam.height_m} m</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200/60">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Crest Length</span>
                <span className="text-xs font-mono font-semibold text-slate-800">{dam.length_m} m</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200/60">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Full Res. Level</span>
                <span className="text-xs font-mono font-semibold text-blue-600">{dam.full_reservoir_level_m} m MSL</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200/60">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Gross Storage</span>
                <span className="text-xs font-mono font-semibold text-blue-600">{(dam.gross_capacity_mcm / 1000).toFixed(2)} BCM</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breach Parameters Form */}
      <div className="p-4 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Breach Scenario Settings
          </label>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
            2D SWE Model
          </span>
        </div>

        {/* Failure Mode Presets */}
        <div className="space-y-1.5">
          <span className="text-xs text-slate-600 font-medium block">
            Quick Scenario Presets
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                ['partial', 'Partial Breach'],
                ['major', 'Major Breach'],
                ['complete', 'Catastrophic'],
                ['custom', 'Custom'],
              ] as const
            ).map(([type, label]) => (
              <button
                key={type}
                onClick={() => handlePresetSelect(type as FailureType)}
                className={`text-xs py-2 px-2.5 rounded-lg border transition-all text-center font-medium ${
                  parameters.failure_type === type
                    ? 'bg-blue-50 text-blue-700 border-blue-400 shadow-sm font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders Container */}
        <div className="space-y-3.5 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
          {/* Reservoir Water Level */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700 font-medium flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-600" />
                Reservoir Water Level
              </span>
              <span className="font-mono text-xs text-blue-600 font-bold">
                {parameters.reservoir_water_level_m} m MSL
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
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
              <span>Low Pool</span>
              <span>Design Full Level ({dam.full_reservoir_level_m}m)</span>
            </div>
          </div>

          {/* Breach Width */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700 font-medium">Breach Opening Width</span>
              <span className="font-mono text-xs text-amber-700 font-bold">
                {parameters.breach_width_m} m
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
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
              <span>10m (Piping)</span>
              <span>250m (Severe Failure)</span>
            </div>
          </div>

          {/* Breach Vertical Depth */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700 font-medium">Breach Vertical Depth</span>
              <span className="font-mono text-xs text-slate-800 font-bold">
                {parameters.breach_height_m} m
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
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded cursor-pointer"
            />
          </div>

          {/* Breach Formation Time */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Breach Formation Duration
              </span>
              <span className="font-mono text-xs text-emerald-700 font-bold">
                {parameters.breach_formation_time_min} mins
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
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
              <span>10m (Sudden collapse)</span>
              <span>180m (Gradual erosion)</span>
            </div>
          </div>

          {/* Breach Location */}
          <div>
            <label className="text-xs text-slate-700 font-medium flex items-center gap-1 mb-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              Breach Location on Dam Wall
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
                  className={`text-xs py-1.5 px-1 rounded-md border text-center font-medium transition-colors ${
                    parameters.breach_location === loc
                      ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Theoretical Outflow Estimate Card */}
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-600" />
            <div>
              <span className="text-[10px] text-amber-800 uppercase tracking-wider font-bold block">
                Estimated Peak Outflow
              </span>
              <span className="text-sm font-mono font-bold text-amber-900">
                ~{estPeakQ.toLocaleString()} m³/s
              </span>
            </div>
          </div>
          <span className="text-[10px] text-amber-700 font-mono">Froehlich Fit</span>
        </div>

        {/* Collapsible Advanced Hydraulics */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full text-xs text-slate-600 hover:text-slate-900 flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200 transition-colors"
          >
            <span className="text-[11px] font-semibold">Advanced Hydraulics Info</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showAdvanced && (
            <div className="mt-2 space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
              <div className="flex justify-between items-center py-0.5">
                <span>Manning's Roughness (n)</span>
                <span className="font-mono text-slate-800 font-medium">0.035 (Gorge Bed)</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span>Weir Discharge Coeff (Cd)</span>
                <span className="font-mono text-slate-800 font-medium">0.48</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span>Topographical DEM Source</span>
                <span className="font-mono text-slate-800 font-medium">CartoDEM 30m / SRTM</span>
              </div>
            </div>
          )}
        </div>

        {/* Execution Button & Progress */}
        <div className="pt-2">
          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className={`w-full py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
              isSimulating
                ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 shadow-md active:scale-95'
            }`}
          >
            {isSimulating ? (
              <>
                <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <span>SOLVING HYDRODYNAMIC WAVE...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>CALCULATE INUNDATION</span>
              </>
            )}
          </button>

          {isSimulating && (
            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-amber-900 font-medium animate-pulse">
                  {simulationStage}
                </span>
                <span className="font-mono font-bold text-amber-800">{simulationProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-amber-200/60 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${simulationProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
