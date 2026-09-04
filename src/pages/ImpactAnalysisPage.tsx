import React from 'react';
import {
  ShieldAlert,
  Building,
  Home,
  HeartPulse,
  GraduationCap,
  Waves,
  Route,
  Users,
  AlertTriangle,
  FileSpreadsheet,
  Download,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  SimulationFrame,
  SimulationMetadata,
  ImpactStatistics,
  InfrastructureFeature,
} from '../types';

interface ImpactAnalysisPageProps {
  metadata?: SimulationMetadata;
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
  // Chart data: Flooded Area & Discharge vs Time
  const timeSeriesData = frames.map((f) => ({
    time: f.time_formatted.substring(0, 5),
    discharge: f.discharge_m3s,
    floodedArea: f.flooded_area_sqkm,
    maxDepth: f.max_depth_m,
    maxVelocity: f.max_velocity_ms,
  }));

  // Hazard breakdown data
  const hazardData = [
    { name: 'Low Hazard (<0.3)', value: 35, color: '#10b981' },
    { name: 'Moderate (0.3-0.6)', value: 25, color: '#f59e0b' },
    { name: 'High (0.6-1.2)', value: 22, color: '#f97316' },
    { name: 'Very High (≥1.2)', value: 18, color: '#ef4444' },
  ];

  // Sector Exposure bar chart data
  const sectorData = [
    { name: 'Villages', affected: impactSummary.villages_inundated, total: 6 },
    { name: 'Hospitals', affected: impactSummary.hospitals_inundated, total: 3 },
    { name: 'Schools', affected: impactSummary.schools_inundated, total: 3 },
    { name: 'Bridges', affected: impactSummary.bridges_inundated, total: 3 },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0c] p-6 text-[#e0e0e0]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-black tracking-wider uppercase text-white">
                Downstream Infrastructure Impact &amp; Consequence Assessment
              </h2>
            </div>
            <p className="text-xs text-white/40 mt-1 font-mono">
              GIS Intersection between Hydrodynamic Inundation Envelopes and Real Downstream Krishna Basin Infrastructure
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white/70 font-mono">
              Scenario: {metadata?.parameters.failure_type.toUpperCase()} BREACH ({metadata?.parameters.breach_width_m}m)
            </span>
          </div>
        </div>

        {/* Primary Impact Metrics KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white/5 p-3.5 rounded border border-white/10 flex flex-col justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">Flooded Valley Area</span>
            <div className="text-2xl font-mono font-bold text-blue-400 my-1">
              {impactSummary.flooded_area_sqkm} <span className="text-xs text-white/40 font-normal">km²</span>
            </div>
            <span className="text-[10px] text-white/30 font-mono">Total inundation footprint</span>
          </div>

          <div className="bg-white/5 p-3.5 rounded border border-white/10 flex flex-col justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">Buildings Affected</span>
            <div className="text-2xl font-mono font-bold text-amber-400 my-1">
              {impactSummary.buildings_affected.toLocaleString()}
            </div>
            <span className="text-[10px] text-white/30 font-mono">Residential &amp; commercial</span>
          </div>

          <div className="bg-white/5 p-3.5 rounded border border-white/10 flex flex-col justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">Roads Submerged</span>
            <div className="text-2xl font-mono font-bold text-blue-300 my-1">
              {impactSummary.roads_affected_km} <span className="text-xs text-white/40 font-normal">km</span>
            </div>
            <span className="text-[10px] text-white/30 font-mono">NH-565 &amp; State Corridors</span>
          </div>

          <div className="bg-white/5 p-3.5 rounded border border-white/10 flex flex-col justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">Inundated Villages</span>
            <div className="text-2xl font-mono font-bold text-rose-400 my-1">
              {impactSummary.villages_inundated} <span className="text-xs text-white/40 font-normal">/ 6</span>
            </div>
            <span className="text-[10px] text-white/30 font-mono">Directly in flood pathway</span>
          </div>

          <div className="bg-white/5 p-3.5 rounded border border-white/10 flex flex-col justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">Medical Facilities</span>
            <div className="text-2xl font-mono font-bold text-red-400 my-1">
              {impactSummary.hospitals_inundated} <span className="text-xs text-white/40 font-normal">/ 3</span>
            </div>
            <span className="text-[10px] text-white/30 font-mono">PHCs &amp; Area Hospital</span>
          </div>

          <div className="bg-white/5 p-3.5 rounded border border-white/10 flex flex-col justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">Est. Population</span>
            <div className="text-2xl font-mono font-bold text-purple-400 my-1">
              {impactSummary.population_exposed_estimate.toLocaleString()}
            </div>
            <span className="text-[10px] text-white/30 font-mono">Settlement census estimate</span>
          </div>
        </div>

        {/* Population Exposure Notice */}
        <div className="bg-white/5 border border-white/10 p-3 rounded flex items-center space-x-3 text-xs text-white/50 font-mono">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p>
            <strong className="text-white">Population Exposure Protocol:</strong> Official micro-level census data is used where available. Where individual building occupancy is unverified, values reflect aggregate settlement populations within the hydrodynamic flood envelope. No artificial population counts are fabricated.
          </p>
        </div>

        {/* Dynamic Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Discharge and Inundation Area vs Time */}
          <div className="bg-white/5 p-4 rounded border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                Flood Hydrograph &amp; Inundated Area Progression
              </h3>
              <span className="text-[10px] text-white/40 font-mono">Time Steps (15m)</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="time" stroke="#666" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis yAxisId="left" stroke="#3b82f6" tick={{ fontSize: 10, fill: '#3b82f6' }} label={{ value: 'Discharge (m³/s)', angle: -90, position: 'insideLeft', fill: '#3b82f6', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" tick={{ fontSize: 10, fill: '#06b6d4' }} label={{ value: 'Inundated (km²)', angle: 90, position: 'insideRight', fill: '#06b6d4', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0c', borderColor: 'rgba(255,255,255,0.1)', fontSize: '11px', borderRadius: '4px' }} />
                  <Area yAxisId="left" type="monotone" dataKey="discharge" stroke="#3b82f6" fillOpacity={1} fill="url(#colorQ)" name="Breach Discharge (m³/s)" />
                  <Area yAxisId="right" type="monotone" dataKey="floodedArea" stroke="#06b6d4" fillOpacity={1} fill="url(#colorArea)" name="Inundated Area (km²)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Critical Infrastructure Exposure by Type */}
          <div className="bg-white/5 p-4 rounded border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                Critical Infrastructure Exposure Breakdown
              </h3>
              <span className="text-[10px] text-white/40 font-mono">Intersecting Assets</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis stroke="#666" tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0c', borderColor: 'rgba(255,255,255,0.1)', fontSize: '11px', borderRadius: '4px' }} />
                  <Bar dataKey="affected" fill="#ef4444" name="Impacted / Inundated" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="total" fill="#262626" name="Total in District" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Affected Settlements Detailed Table */}
        <div className="bg-white/5 rounded border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                Downstream Settlements Hydrodynamic Exposure Register
              </h3>
            </div>
            <span className="text-[10px] text-white/40 font-mono">
              6 Monitored Settlements across Krishna Gorge
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/40 font-mono uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-3">Settlement Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Dist. from Dam</th>
                  <th className="p-3">Ground Elev.</th>
                  <th className="p-3">Flood Arrival</th>
                  <th className="p-3">Max Stage Depth</th>
                  <th className="p-3">Peak Velocity</th>
                  <th className="p-3">Hazard Category</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {infrastructure.map((feat) => (
                  <tr key={feat.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      {feat.type === 'village' && <Home className="w-3.5 h-3.5 text-amber-400" />}
                      {feat.type === 'hospital' && <HeartPulse className="w-3.5 h-3.5 text-red-400" />}
                      {feat.type === 'school' && <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />}
                      {feat.type === 'bridge' && <Route className="w-3.5 h-3.5 text-cyan-400" />}
                      {feat.type === 'shelter' && <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{feat.name}</span>
                    </td>
                    <td className="p-3 text-white/70 uppercase text-[10px]">{feat.type}</td>
                    <td className="p-3 text-white/70">{feat.distance_from_dam_km} km</td>
                    <td className="p-3 text-white/70">{feat.elevation_m} m</td>
                    <td className="p-3 text-emerald-400 font-bold">
                      {feat.arrival_time_min !== undefined ? `${feat.arrival_time_min} min` : 'Dry'}
                    </td>
                    <td className="p-3 text-blue-400 font-bold">
                      {feat.max_depth_m !== undefined ? `${feat.max_depth_m.toFixed(1)} m` : '0.0 m'}
                    </td>
                    <td className="p-3 text-amber-300">
                      {feat.max_velocity_ms !== undefined ? `${feat.max_velocity_ms.toFixed(1)} m/s` : '0.0 m/s'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          feat.risk_level === 'VERY_HIGH'
                            ? 'bg-rose-950 text-rose-300 border border-rose-600'
                            : feat.risk_level === 'HIGH'
                            ? 'bg-amber-950 text-amber-300 border border-amber-600'
                            : feat.risk_level === 'MODERATE'
                            ? 'bg-yellow-950 text-yellow-300 border border-yellow-600'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                        }`}
                      >
                        {feat.risk_level || 'SAFE'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          feat.evacuation_status === 'INUNDATED'
                            ? 'bg-rose-900/60 text-rose-200'
                            : feat.evacuation_status === 'AT_RISK'
                            ? 'bg-amber-900/60 text-amber-200'
                            : 'bg-emerald-900/60 text-emerald-200'
                        }`}
                      >
                        {feat.evacuation_status || 'ACCESSIBLE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
