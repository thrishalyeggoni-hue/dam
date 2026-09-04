import React, { useState } from 'react';
import {
  LifeBuoy,
  AlertTriangle,
  Route,
  Navigation,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
  ArrowRight,
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
  const [selectedVillage, setSelectedVillage] = useState<string>('Vijayapuri South');

  const activeRoutes = routes.filter((r) => r.from_village === selectedVillage);

  const villages = infrastructure.filter((f) => f.type === 'village');
  const shelters = infrastructure.filter((f) => f.type === 'shelter');

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0c] p-6 text-[#e0e0e0]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Critical Disclaimer Banner */}
        <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded flex items-start gap-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-300">
              EXPERIMENTAL DECISION SUPPORT — NOT AN OFFICIAL EMERGENCY INSTRUCTION
            </h3>
            <p className="text-xs text-amber-200/80 leading-relaxed font-mono">
              This module provides algorithmic route clearance evaluations based on digital elevation and simulated hydrodynamic stage thresholds. In an actual dam emergency, always follow mandatory directives broadcast by the National Disaster Management Authority (NDMA), State Emergency Operations Centre (SEOC), and local revenue administration.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-black tracking-wider uppercase text-white">
                Emergency Evacuation Routing &amp; High-Ground Decision Support
              </h2>
            </div>
            <p className="text-xs text-white/40 mt-1 font-mono">
              Determines non-inundated egress corridors from flood-risk settlements toward designated upland relief centres.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-white/40 font-mono">Select Origin:</span>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="bg-white/5 text-xs font-semibold text-white border border-white/10 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer font-mono"
            >
              {villages.map((v) => (
                <option key={v.id} value={v.name.split('(')[0].trim()} className="bg-[#0a0a0c] text-white">
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Routing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {routes.map((route) => {
            const isMatch = route.from_village.includes(selectedVillage.split(' ')[0]);

            return (
              <div
                key={route.id}
                className={`bg-white/5 rounded border p-5 space-y-4 transition-all ${
                  isMatch
                    ? 'border-blue-500/80 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                    : 'border-white/10 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Route className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-mono font-bold text-white/70">
                      ROUTE #{route.id.toUpperCase()}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                      route.status === 'SAFE'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                        : route.status === 'CAUTION'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-700'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-700'
                    }`}
                  >
                    {route.status} PASSAGE
                  </span>
                </div>

                <div>
                  <div className="flex items-center space-x-2 text-sm font-bold text-white mb-1">
                    <span>{route.from_village}</span>
                    <ArrowRight className="w-4 h-4 text-white/40" />
                    <span className="text-blue-400">{route.to_shelter}</span>
                  </div>
                  <p className="text-xs text-white/40 font-mono">
                    High-ground corridor via Ridge Arterial Road
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded border border-white/5 text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-white/40 uppercase tracking-wider block font-sans font-bold">Distance</span>
                    <span className="font-bold text-white text-sm">{route.distance_km} km</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/40 uppercase tracking-wider block font-sans font-bold">Est. Transit</span>
                    <span className="font-bold text-amber-300 text-sm">{route.travel_time_min} mins</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/40 uppercase tracking-wider block font-sans font-bold">Min Elevation</span>
                    <span className="font-bold text-blue-400 text-sm">{route.min_clearance_elevation_m} m</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10 text-white/40 font-mono">
                  <span className="flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Clearance: +32m above Krishna flood peak
                  </span>
                  <span className="text-white/30 text-[10px]">4 Waypoints</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Designated High Ground Shelters List */}
        <div className="bg-white/5 p-5 rounded border border-white/10 space-y-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              Designated Upland Emergency Shelters &amp; High-Ground Helipads
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shelters.map((sh) => (
              <div key={sh.id} className="bg-white/5 p-3.5 rounded border border-white/5 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-white">{sh.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700">
                    SAFE ZONE
                  </span>
                </div>
                <div className="space-y-1 text-white/40 font-mono">
                  <div className="flex justify-between">
                    <span>Elevation:</span>
                    <span className="text-blue-400 font-bold">{sh.elevation_m} m MSL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacity:</span>
                    <span className="text-white/70">{sh.population?.toLocaleString()} persons</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance from Gorge:</span>
                    <span className="text-white/70">{sh.distance_from_dam_km} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
