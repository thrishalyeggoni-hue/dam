import React, { useState } from 'react';
import {
  GitCompare,
  ArrowRight,
  TrendingUp,
  Layers,
  ShieldAlert,
  Clock,
  Gauge,
  Maximize2,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ScenarioComparisonData, BreachParameters } from '../types';

interface ScenarioComparisonPageProps {
  currentParams: BreachParameters;
  onApplyScenario: (params: BreachParameters) => void;
}

export const ScenarioComparisonPage: React.FC<ScenarioComparisonPageProps> = ({
  currentParams,
  onApplyScenario,
}) => {
  const scenarios: ScenarioComparisonData[] = [
    {
      id: 'scen-a',
      name: 'Scenario A — Partial Abutment Piping',
      breach_width_m: 30,
      failure_type: 'partial',
      peak_discharge_m3s: 18450,
      max_flooded_area_sqkm: 19.4,
      max_depth_m: 3.8,
      max_velocity_ms: 4.2,
      earliest_downstream_arrival_min: 52,
      villages_affected: 2,
    },
    {
      id: 'scen-b',
      name: 'Scenario B — Major Spillway Breach (Baseline)',
      breach_width_m: 60,
      failure_type: 'major',
      peak_discharge_m3s: 41200,
      max_flooded_area_sqkm: 36.8,
      max_depth_m: 7.2,
      max_velocity_ms: 6.8,
      earliest_downstream_arrival_min: 36,
      villages_affected: 4,
    },
    {
      id: 'scen-c',
      name: 'Scenario C — Catastrophic Complete Failure',
      breach_width_m: 150,
      failure_type: 'complete',
      peak_discharge_m3s: 98500,
      max_flooded_area_sqkm: 68.2,
      max_depth_m: 14.5,
      max_velocity_ms: 11.4,
      earliest_downstream_arrival_min: 18,
      villages_affected: 6,
    },
  ];

  const chartData = scenarios.map((s) => ({
    name: s.name.split('—')[0].trim(),
    'Peak Discharge (m³/s)': s.peak_discharge_m3s,
    'Flooded Area (km²)': s.max_flooded_area_sqkm,
    'Max Stage Depth (m)': s.max_depth_m,
    'Earliest Arrival (min)': s.earliest_downstream_arrival_min,
  }));

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0c] p-6 text-[#e0e0e0]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-black tracking-wider uppercase text-white">
                Multi-Scenario Dam Failure Sensitivity Comparison
              </h2>
            </div>
            <p className="text-xs text-white/40 mt-1 font-mono">
              Side-by-side comparative analysis of breach dimensions, hydrodynamic wave celerity, peak stage, and downstream arrival timelines.
            </p>
          </div>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {scenarios.map((scen) => {
            const isCurrentlySelected = currentParams.breach_width_m === scen.breach_width_m;

            return (
              <div
                key={scen.id}
                className={`bg-white/5 rounded border p-5 flex flex-col justify-between transition-all ${
                  isCurrentlySelected
                    ? 'border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)] ring-1 ring-blue-500'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        scen.failure_type === 'partial'
                          ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                          : scen.failure_type === 'major'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {scen.failure_type} Failure
                    </span>
                    {isCurrentlySelected && (
                      <span className="flex items-center gap-1 text-[10px] text-blue-400 font-mono font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        ACTIVE SETUP
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">{scen.name}</h3>

                  <div className="space-y-2.5 text-xs bg-white/5 p-3.5 rounded border border-white/5 font-mono">
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-white/40 flex items-center gap-1.5 font-sans">
                        <Gauge className="w-3.5 h-3.5 text-amber-400" />
                        Peak Discharge
                      </span>
                      <span className="font-bold text-amber-300">
                        {scen.peak_discharge_m3s.toLocaleString()} m³/s
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-white/40 flex items-center gap-1.5 font-sans">
                        <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                        Max Inundated Area
                      </span>
                      <span className="font-bold text-blue-400">{scen.max_flooded_area_sqkm} km²</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-white/40 flex items-center gap-1.5 font-sans">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        Peak Water Depth
                      </span>
                      <span className="font-bold text-cyan-300">{scen.max_depth_m} m</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-white/40 flex items-center gap-1.5 font-sans">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        Earliest Arrival
                      </span>
                      <span className="font-bold text-emerald-400">{scen.earliest_downstream_arrival_min} mins</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-white/40 flex items-center gap-1.5 font-sans">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        Villages Inundated
                      </span>
                      <span className="font-bold text-rose-400">{scen.villages_affected} settlements</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10">
                  <button
                    onClick={() =>
                      onApplyScenario({
                        ...currentParams,
                        failure_type: scen.failure_type,
                        breach_width_m: scen.breach_width_m,
                      })
                    }
                    className={`w-full py-2 px-3 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                      isCurrentlySelected
                        ? 'bg-white/10 text-white/40 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    <span>{isCurrentlySelected ? 'Loaded in Simulator' : 'Load Scenario'}</span>
                    {!isCurrentlySelected && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparative Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 p-5 rounded border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">
              Peak Hydrodynamic Outflow (m³/s)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis stroke="#666" tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0c', borderColor: 'rgba(255,255,255,0.1)', fontSize: '11px', borderRadius: '4px' }} />
                  <Bar dataKey="Peak Discharge (m³/s)" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 p-5 rounded border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">
              Earliest Flood Wave Arrival Time (Minutes to Tail Pond)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis stroke="#666" tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0c', borderColor: 'rgba(255,255,255,0.1)', fontSize: '11px', borderRadius: '4px' }} />
                  <Bar dataKey="Earliest Arrival (min)" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
