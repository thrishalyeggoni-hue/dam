import React, { useState, useEffect } from 'react';
import {
  Bot,
  X,
  Sparkles,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Key,
  RefreshCw,
  Cpu,
  CloudRain,
  ArrowRight,
} from 'lucide-react';
import {
  IndianDam,
  BreachParameters,
  HydrodynamicSimulationResult,
} from '../types';
import {
  predictWaterFlowControl,
  AIFlowPredictionResult,
  StormScenario,
} from '../services/aiFlowControl';

interface AIFlowControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  dam: IndianDam;
  parameters: BreachParameters;
  simResult: HydrodynamicSimulationResult;
  onApplyAIParameters?: (newParams: Partial<BreachParameters>) => void;
}

export const AIFlowControlModal: React.FC<AIFlowControlModalProps> = ({
  isOpen,
  onClose,
  dam,
  parameters,
  simResult,
  onApplyAIParameters,
}) => {
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState<StormScenario>('100yr_flood');
  const [prediction, setPrediction] = useState<AIFlowPredictionResult | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const fetchPrediction = async (targetScenario: StormScenario = scenario) => {
    setLoading(true);
    try {
      const res = await predictWaterFlowControl(dam, parameters, simResult, targetScenario, apiKey);
      setPrediction(res);
    } catch (err) {
      console.error('Error calculating AI flow control:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPrediction(scenario);
    }
  }, [isOpen, dam.id, parameters.failure_type, scenario]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (prediction && onApplyAIParameters) {
      onApplyAIParameters({
        breach_width_m: Math.max(20, Math.round(prediction.gate_opening_height_m * 10)),
        reservoir_water_level_m: prediction.reservoir_head_retention_m,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  AI Hydrodynamic Flow &amp; Gate Control
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {prediction?.source === 'GEMINI_AI' ? 'Gemini 2.5 Flash' : '2D SWE Neural Surrogate'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Physics-Informed reservoir routing &amp; radial gate dispatch for {dam.name} ({dam.river}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              title="Custom Gemini API Key"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Custom API Key Form */}
        {showKeyInput && (
          <div className="p-3 bg-blue-50 border-b border-blue-200 text-xs flex items-center gap-2">
            <span className="font-semibold text-blue-900 shrink-0">Gemini API Key:</span>
            <input
              type="password"
              placeholder="Paste custom Gemini API key (optional)..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 bg-white border border-blue-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => fetchPrediction(scenario)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs shadow-sm"
            >
              Apply Key
            </button>
          </div>
        )}

        {/* Storm Scenario Selector */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <CloudRain className="w-4 h-4 text-blue-600" />
            <span>Storm Catchment Inflow Scenario:</span>
          </div>
          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5">
            <button
              onClick={() => {
                setScenario('monsoon_spate');
                fetchPrediction('monsoon_spate');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                scenario === 'monsoon_spate'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monsoon Spate
            </button>
            <button
              onClick={() => {
                setScenario('100yr_flood');
                fetchPrediction('100yr_flood');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                scenario === '100yr_flood'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              100-Yr Flood
            </button>
            <button
              onClick={() => {
                setScenario('pmf_cloudburst');
                fetchPrediction('pmf_cloudburst');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                scenario === 'pmf_cloudburst'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PMF Cloudburst
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-blue-600">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <span className="font-medium text-slate-700">
                Solving 2D Shallow Water Equations Neural Surrogate &amp; Optimal Gate Schedule...
              </span>
            </div>
          ) : prediction ? (
            <>
              {/* Emergency Status Alert */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  prediction.risk_level === 'EMERGENCY'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : prediction.risk_level === 'CRITICAL'
                    ? 'bg-orange-50 border-orange-200 text-orange-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <span className="font-bold uppercase tracking-wider block text-xs">
                      {prediction.risk_level} HYDRAULIC DISPATCH REQUIRED
                    </span>
                    <span className="text-[11px] opacity-90">
                      Forecast Inflow Peak: <b>{prediction.forecast_inflow_peak_m3s.toLocaleString()} m³/s</b> &bull; Warning Lead Time: <b>{prediction.downstream_warning_lead_time_min} mins</b>
                    </span>
                  </div>
                </div>

                <div className="px-3 py-1 bg-white/80 rounded-lg text-xs font-bold text-slate-800 shadow-xs">
                  {prediction.downstream_attenuation_percent}% Attenuation
                </div>
              </div>

              {/* Key Dispatch Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                    Spillway Gates
                  </span>
                  <div className="text-xl font-mono font-bold text-blue-600 my-0.5">
                    {prediction.recommended_gates_open} <span className="text-xs text-slate-500 font-normal">/ {prediction.total_gates_available}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Radial crest gates</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                    Gate Clearance
                  </span>
                  <div className="text-xl font-mono font-bold text-slate-800 my-0.5">
                    {prediction.gate_opening_height_m} <span className="text-xs text-slate-500 font-normal">m</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Opening height</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                    Regulated Release
                  </span>
                  <div className="text-xl font-mono font-bold text-amber-700 my-0.5">
                    {prediction.target_discharge_m3s.toLocaleString()} <span className="text-xs text-slate-500 font-normal">m³/s</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Controlled outflow</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                    Flood Cushion
                  </span>
                  <div className="text-xl font-mono font-bold text-emerald-700 my-0.5">
                    {prediction.storage_absorption_mcm} <span className="text-xs text-slate-500 font-normal">MCM</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Pre-drawdown</span>
                </div>
              </div>

              {/* Actionable Dispatch Directives */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    CWC Dam Operating Protocol Directives
                  </h3>
                </div>

                <div className="space-y-2">
                  {prediction.actionable_instructions.map((inst, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{inst}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2D SWE Physics-Informed Neural Surrogate Telemetry */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    <span>2D Shallow Water Equations AI Surrogate Telemetry</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Speedup: {prediction.pinn_telemetry.speedup_vs_fvm}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-600 pt-1">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9px]">SWE PDE Residual:</span>
                    <span className="font-bold text-slate-800">{prediction.pinn_telemetry.swe_pde_loss}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9px]">Continuity Residual:</span>
                    <span className="font-bold text-slate-800">{prediction.pinn_telemetry.continuity_residual}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9px]">Inference Latency:</span>
                    <span className="font-bold text-blue-600">{prediction.pinn_telemetry.inference_latency_ms} ms</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  {prediction.scientific_reasoning}
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Validated against Central Water Commission (CWC) Operating Protocols.
          </span>
          <div className="flex items-center gap-2">
            {onApplyAIParameters && (
              <button
                onClick={handleApply}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span>Apply Parameters to Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium text-xs transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
