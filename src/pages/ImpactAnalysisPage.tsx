import React from 'react';
import {
  ShieldAlert,
  Home,
  HeartPulse,
  GraduationCap,
  Route,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SimulationMetadata, SimulationFrame, ImpactStatistics, InfrastructureFeature } from '../types';

interface ImpactAnalysisPageProps {
  metadata: SimulationMetadata;
  frames: SimulationFrame[];
  impactSummary: ImpactStatistics;
  infrastructure: InfrastructureFeature[];
}

export const ImpactAnalysisPage: React.FC<ImpactAnalysisPageProps> = ({
  metadata,
  frames,
  impactSummary,
  infrastructure,
}) => {
  const totalVillages = infrastructure.filter((f) => f.type === 'village').length;
  const totalHospitals = infrastructure.filter((f) => f.type === 'hospital').length;
  const totalSchools = infrastructure.filter((f) => f.type === 'school').length;
  const totalBridges = infrastructure.filter((f) => f.type === 'bridge').length;

  const timeSeriesData = frames.map((f) => ({
    time: f.time_formatted,
    discharge: f.discharge_m3s,
    stage: f.max_stage_m,
    floodedArea: f.flooded_area_sqkm,
  }));

  const infrastructureBreakdown = [
    { name: 'Villages', inundated: impactSummary.villages_inundated, total: Math.max(1, totalVillages) },
    { name: 'Hospitals', inundated: impactSummary.hospitals_inundated, total: Math.max(1, totalHospitals) },
    { name: 'Schools', inundated: impactSummary.schools_inundated, total: Math.max(1, totalSchools) },
    { name: 'Bridges', inundated: impactSummary.bridges_inundated, total: Math.max(1, totalBridges) },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Executive Advisory Banner */}
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-red-900 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-red-800">
              NDMA Priority 1 Directive &mdash; Downstream Flood Exposure
            </h2>
            <p className="text-xs text-red-700 leading-relaxed">
              Hydrodynamic Saint-Venant 2D simulation indicates peak outflow of{' '}
              <b>{metadata.peak_discharge_m3s.toLocaleString()} m³/s</b> with an estimated{' '}
              <b>{impactSummary.flooded_area_sqkm} km²</b> of downstream valley inundation. Immediate evacuation clearance is required along the river corridor.
            </p>
          </div>
        </div>

        {/* Top KPI Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Peak Outflow</span>
            <div className="text-2xl font-mono font-bold text-slate-900 my-1">
              {metadata.peak_discharge_m3s.toLocaleString()} <span className="text-xs text-slate-400 font-normal">m³/s</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Froehlich formulation</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Inundated Footprint</span>
            <div className="text-2xl font-mono font-bold text-amber-600 my-1">
              {impactSummary.flooded_area_sqkm} <span className="text-xs text-slate-400 font-normal">km²</span>
            </div>
            <span className="text-[10px] text-slate-500">2D SWE inundation envelope</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Corridor Highway</span>
            <div className="text-2xl font-mono font-bold text-blue-600 my-1">
              {impactSummary.roads_affected_km} <span className="text-xs text-slate-400 font-normal">km</span>
            </div>
            <span className="text-[10px] text-slate-500">Inundated valley routes</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Inundated Villages</span>
            <div className="text-2xl font-mono font-bold text-rose-600 my-1">
              {impactSummary.villages_inundated} <span className="text-xs text-slate-400 font-normal">/ {totalVillages}</span>
            </div>
            <span className="text-[10px] text-slate-500">Directly in flood pathway</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Medical Centers</span>
            <div className="text-2xl font-mono font-bold text-red-600 my-1">
              {impactSummary.hospitals_inundated} <span className="text-xs text-slate-400 font-normal">/ {Math.max(1, totalHospitals)}</span>
            </div>
            <span className="text-[10px] text-slate-500">PHCs &amp; area hospitals</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Exposed Population</span>
            <div className="text-2xl font-mono font-bold text-purple-600 my-1">
              {impactSummary.population_exposed_estimate.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">Census aggregate</span>
          </div>
        </div>

        {/* Dynamic Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Flood Hydrograph &amp; Inundated Area Progression
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">30 continuous frames</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis yAxisId="left" stroke="#2563eb" tick={{ fontSize: 10, fill: '#2563eb' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#0284c7" tick={{ fontSize: 10, fill: '#0284c7' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Area yAxisId="left" type="monotone" dataKey="discharge" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorQ)" name="Breach Outflow (m³/s)" />
                  <Area yAxisId="right" type="monotone" dataKey="floodedArea" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorArea)" name="Inundated Area (km²)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Critical Infrastructure Exposure Breakdown
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Inundation Ratio</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={infrastructureBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="inundated" fill="#ef4444" name="Inundated Asset" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" fill="#cbd5e1" name="Total in Reach" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Affected Settlements Detailed Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Downstream Settlements Hydrodynamic Exposure Register
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {infrastructure.length} Monitored Assets across Downstream Reach
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Settlement Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Dist. from Dam</th>
                  <th className="p-3">Ground Elev.</th>
                  <th className="p-3">Flood Arrival</th>
                  <th className="p-3">Max Water Depth</th>
                  <th className="p-3">Peak Velocity</th>
                  <th className="p-3">Hazard Category</th>
                  <th className="p-3">Evacuation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {infrastructure.map((feat) => {
                  const isFlooded = (feat.water_depth_m || 0) > 0.2;

                  return (
                    <tr key={feat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                        {feat.type === 'village' && <Home className="w-3.5 h-3.5 text-amber-600" />}
                        {feat.type === 'hospital' && <HeartPulse className="w-3.5 h-3.5 text-red-600" />}
                        {feat.type === 'school' && <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />}
                        {feat.type === 'bridge' && <Route className="w-3.5 h-3.5 text-blue-600" />}
                        {feat.type === 'shelter' && <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />}
                        <span>{feat.name}</span>
                      </td>
                      <td className="p-3 text-slate-500 uppercase text-[10px] font-mono">{feat.type}</td>
                      <td className="p-3 text-slate-600 font-mono">{feat.distance_from_dam_km} km</td>
                      <td className="p-3 text-slate-600 font-mono">{feat.elevation_m} m</td>
                      <td className={`p-3 font-mono font-bold ${isFlooded ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {isFlooded && feat.arrival_time_min !== undefined ? `T+${feat.arrival_time_min} mins` : 'Safe / Dry'}
                      </td>
                      <td className={`p-3 font-mono font-bold ${isFlooded ? 'text-blue-700' : 'text-slate-400'}`}>
                        {feat.max_depth_m !== undefined && feat.max_depth_m > 0 ? `${feat.max_depth_m.toFixed(1)} m` : '0.0 m'}
                      </td>
                      <td className="p-3 text-slate-700 font-mono">
                        {feat.max_velocity_ms !== undefined && feat.max_velocity_ms > 0 ? `${feat.max_velocity_ms.toFixed(1)} m/s` : '0.0 m/s'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${feat.risk_level === 'VERY_HIGH'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : feat.risk_level === 'HIGH'
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : feat.risk_level === 'MODERATE'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                        >
                          {feat.risk_level || 'SAFE'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${feat.evacuation_status === 'INUNDATED'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : feat.evacuation_status === 'AT_RISK'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                        >
                          {feat.evacuation_status || 'ACCESSIBLE'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
