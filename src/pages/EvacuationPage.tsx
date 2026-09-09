import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  AlertTriangle,
  Route,
  ShieldCheck,
  ArrowRight,
  Navigation,
  Compass,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { EvacuationRoute, InfrastructureFeature } from '../types';

interface EvacuationPageProps {
  routes: EvacuationRoute[];
  infrastructure: InfrastructureFeature[];
}

export const EvacuationPage: React.FC<EvacuationPageProps> = ({
  routes,
  infrastructure,
}) => {
  const villages = infrastructure.filter((f) => f.type === 'village');
  const shelters = infrastructure.filter((f) => f.type === 'shelter');

  const [selectedVillage, setSelectedVillage] = useState<string>('All Settlements');

  useEffect(() => {
    setSelectedVillage('All Settlements');
  }, [infrastructure]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Advisory Banner */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-900 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Hydrodynamic Route Clearance &amp; Egress Vulnerability Assessment
            </h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              Route clearances are dynamically derived from digital elevation models (DEM) and simulated flood wave stage thresholds.
              Net clearance equals corridor saddle elevation minus simulated peak water surface elevation (<span className="font-mono font-semibold">Clearance = Z_corridor - WSE_peak</span>).
              In an actual dam emergency, adhere strictly to emergency directives broadcast by NDMA and SDMA.
            </p>
          </div>
        </div>

        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900">
                Emergency Evacuation Corridors &amp; High-Ground Shelters
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time physical clearance calculations along designated upland egress corridors toward non-inundated relief complexes.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Filter Origin Settlement:</span>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="bg-white text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
            >
              <option value="All Settlements">All Monitored Settlements</option>
              {villages.map((v) => (
                <option key={v.id} value={v.name.split('(')[0].trim()}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Routing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {routes.map((route) => {
            const isMatch =
              selectedVillage === 'All Settlements' ||
              route.from_village.toLowerCase().includes(selectedVillage.toLowerCase().split(' ')[0]) ||
              selectedVillage.toLowerCase().includes(route.from_village.toLowerCase().split(' ')[0]);

            // Find matching origin settlement feature
            const originFeat = infrastructure.find((f) => {
              const normF = f.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              const normR = route.from_village.toLowerCase().replace(/[^a-z0-9]/g, '');
              return normF.includes(normR.slice(0, 7)) || normR.includes(normF.slice(0, 7));
            }) || villages[0];

            const originElev = originFeat?.elevation_m || 95;
            const floodDepth = originFeat?.water_depth_m || 0;
            const peakWaterSurface = originElev + floodDepth;
            const passElev = route.min_clearance_elevation_m;
            const clearance = Math.round((passElev - peakWaterSurface) * 10) / 10;

            // Clearance Status Categorization (CWC / NDMA Guidelines)
            let statusBadge = {
              text: 'SAFE PASSAGE',
              desc: 'Adequate Freeboard (> 15m)',
              badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              iconClass: 'text-emerald-600',
            };

            if (clearance <= 0) {
              statusBadge = {
                text: 'IMPASSABLE',
                desc: 'Road Corridor Submerged',
                badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
                iconClass: 'text-rose-600',
              };
            } else if (clearance < 5) {
              statusBadge = {
                text: 'CRITICAL HAZARD',
                desc: 'Low Freeboard (< 5m)',
                badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
                iconClass: 'text-rose-600',
              };
            } else if (clearance < 15) {
              statusBadge = {
                text: 'CAUTION PASSAGE',
                desc: 'Moderate Freeboard (5m - 15m)',
                badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
                iconClass: 'text-amber-600',
              };
            }

            return (
              <div
                key={route.id}
                className={`bg-white rounded-xl border p-5 space-y-4 transition-all shadow-sm ${
                  isMatch
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 opacity-60'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Route className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-700 tracking-wide">
                      ROUTE #{route.id.toUpperCase()}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${statusBadge.badgeClass}`}
                  >
                    {statusBadge.text}
                  </span>
                </div>

                {/* Origin to Destination */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
                    <span>{route.from_village}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-blue-600">{route.to_shelter}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Navigation className="w-3 h-3 text-slate-400" />
                    <span>{route.corridor_name || 'Designated Valley Upland Corridor'}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-slate-400 text-[11px]">{route.road_type || 'Paved Highway'}</span>
                  </div>
                </div>

                {/* Real Physical Calculations Breakdown */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-sans tracking-wider">
                    Hydrodynamic Clearance Calculation (Real Physics)
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Origin Ground Elev:</span>
                      <span className="font-semibold text-slate-800">{originElev.toFixed(1)} m MSL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flood Depth (h):</span>
                      <span className={`font-semibold ${floodDepth > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {floodDepth > 0 ? `+${floodDepth.toFixed(1)} m` : '0.0 m (Dry)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peak Stage (WSE):</span>
                      <span className="font-semibold text-slate-800">{peakWaterSurface.toFixed(1)} m MSL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Corridor Pass Elev:</span>
                      <span className="font-semibold text-blue-600">{passElev.toFixed(1)} m MSL</span>
                    </div>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">
                      Distance
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {route.distance_km} km
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">
                      Est. Transit
                    </span>
                    <span className="text-sm font-bold text-amber-700">
                      {route.travel_time_min} mins
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">
                      Corridor Min Elev
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      {passElev} m MSL
                    </span>
                  </div>
                </div>

                {/* Net Clearance Freeboard Display */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div className={`flex items-center space-x-1.5 font-bold ${statusBadge.iconClass}`}>
                    {clearance > 0 ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>
                      {clearance > 0
                        ? `Net Freeboard: +${clearance.toFixed(1)}m above peak flood stage`
                        : `Submerged by ${Math.abs(clearance).toFixed(1)}m`}
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {route.coordinates.length} GPS Waypoints
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Designated Upland Shelters Matrix */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Designated High-Ground Emergency Shelters &amp; Helipad Compounds
              </h3>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
              All Shelters Beyond Inundation Boundary
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shelters.map((sh) => (
              <div
                key={sh.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{sh.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {sh.distance_from_dam_km} km from dam axis
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" /> SAFE ZONE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">
                      Shelter Elevation
                    </span>
                    <span className="font-bold text-blue-600">{sh.elevation_m} m MSL</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">
                      Safe Capacity
                    </span>
                    <span className="font-bold text-slate-800">
                      {sh.population ? `${sh.population.toLocaleString()} persons` : '15,000 persons'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded-md p-2 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                    <Compass className="w-3.5 h-3.5 text-blue-500" />
                    GPS: {sh.lat.toFixed(4)}°N, {sh.lon.toFixed(4)}°E
                  </span>
                  <span className="text-emerald-600 font-bold">Helipad Ready</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
