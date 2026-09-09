import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  ArrowRight,
  Gauge,
  Maximize2,
  Layers,
  Clock,
  ShieldAlert,
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
  const [scenarios, setScenarios] = useState<ScenarioComparisonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadScenarios() {
      try {
        const res = await fetch('/api/scenarios/comparison');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setScenarios(data);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Scenario comparison API offline:', e);
      }

      if (isMounted) {
        setScenarios([
          {
            id: 'sim-nagarjuna-partial',
            name: 'Scenario A — Partial Piping Breach',
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
            id: 'sim-nagarjuna-major-breach',
            name: 'Scenario B — Major Breach (Baseline)',
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
            id: 'sim-nagarjuna-catastrophic',
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
        ]);
        setIsLoading(false);
      }
    }
    loadScenarios();
    return () => { isMounted = false; };
  }, []);

  const chartData = scenarios.map((s) => ({
    name: s.name.split('—')[0].trim(),
    'Peak Discharge (m³/s)': s.peak_discharge_m3s,
    'Flooded Area (km²)': s.max_flooded_area_sqkm,
    'Max Stage Depth (m)': s.max_depth_m,
    'Earliest Arrival (min)': s.earliest_downstream_arrival_min,
  }));

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900">
                Multi-Scenario Dam Failure Sensitivity Comparison
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Side-by-side comparative analysis of breach dimensions, hydrodynamic wave speeds, peak stage depths, and arrival times.
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
                className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all shadow-sm ${
                  isCurrentlySelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        scen.failure_type === 'partial'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : scen.failure_type === 'major'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {scen.failure_type} Failure
                    </span>
                    {isCurrentlySelected && (
                      <span className="flex items-center gap-1 text-xs text-blue-600 font-bold">
                        <CheckCircle className="w-4 h-4" />
                        ACTIVE SETUP
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-4">{scen.name}</h3>

                  <div className="space-y-2.5 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-amber-600" />
                        Peak Discharge
                      </span>
                      <span className="font-mono font-bold text-amber-800">
                        {scen.peak_discharge_m3s.toLocaleString()} m³/s
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                        Max Flooded Area
                      </span>
                      <span className="font-mono font-bold text-blue-700">{scen.max_flooded_area_sqkm} km²</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-sky-600" />
                        Peak Flood Depth
                      </span>
                      <span className="font-mono font-bold text-sky-800">{scen.max_depth_m} m</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        Downstream Arrival
                      </span>
                      <span className="font-mono font-bold text-emerald-700">{scen.earliest_downstream_arrival_min} mins</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        Inundated Settlements
                      </span>
                      <span className="font-mono font-bold text-rose-700">{scen.villages_affected} settlements</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() =>
                      onApplyScenario({
                        ...currentParams,
                        failure_type: scen.failure_type,
                        breach_width_m: scen.breach_width_m,
                      })
                    }
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                      isCurrentlySelected
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-95'
                    }`}
                  >
                    <span>{isCurrentlySelected ? 'Loaded in Simulator' : 'Load This Scenario'}</span>
                    {!isCurrentlySelected && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparative Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">
              Peak Hydrodynamic Outflow (m³/s)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="Peak Discharge (m³/s)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">
              Earliest Flood Wave Arrival Time (Minutes)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="Earliest Arrival (min)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
