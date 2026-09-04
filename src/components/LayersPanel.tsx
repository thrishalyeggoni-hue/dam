import React, { useState } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Map,
  Compass,
  Droplets,
  Wind,
  Clock,
  AlertTriangle,
  Building,
  Home,
  HeartPulse,
  GraduationCap,
  Route,
} from 'lucide-react';

export interface LayerVisibility {
  terrain: boolean;
  satellite: boolean;
  dam_model: boolean;
  reservoir: boolean;
  river_channel: boolean;
  flood_extent: boolean;
  water_depth: boolean;
  velocity_vectors: boolean;
  arrival_time: boolean;
  risk_zones: boolean;
  roads: boolean;
  buildings: boolean;
  villages: boolean;
  hospitals: boolean;
  schools: boolean;
  evacuation_routes: boolean;
}

interface LayersPanelProps {
  layers: LayerVisibility;
  onToggleLayer: (layerKey: keyof LayerVisibility) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  onToggleLayer,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-20 select-none">
      <div className="bg-[#0a0a0c]/90 backdrop-blur border border-white/10 rounded shadow-2xl overflow-hidden w-64 text-[#e0e0e0]">
        {/* Toggle Bar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Map Layers</span>
          </div>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-white/40" /> : <ChevronDown className="w-3.5 h-3.5 text-white/40" />}
        </button>

        {/* Layer Item Checkboxes */}
        {isOpen && (
          <div className="p-3 space-y-3 max-h-96 overflow-y-auto text-xs text-white/70 divide-y divide-white/5">
            {/* Base & Physical */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Basemap &amp; Elevation
              </span>
              <label className="flex items-center justify-between cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Map className="w-3.5 h-3.5 text-slate-400" />
                  3D DEM Terrain Mesh
                </span>
                <input
                  type="checkbox"
                  checked={layers.terrain}
                  onChange={() => onToggleLayer('terrain')}
                  className="accent-blue-500 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  Satellite / Imagery Drape
                </span>
                <input
                  type="checkbox"
                  checked={layers.satellite}
                  onChange={() => onToggleLayer('satellite')}
                  className="accent-blue-500 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  3D Dam Structure
                </span>
                <input
                  type="checkbox"
                  checked={layers.dam_model}
                  onChange={() => onToggleLayer('dam_model')}
                  className="accent-blue-500 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  Krishna River Channel
                </span>
                <input
                  type="checkbox"
                  checked={layers.river_channel}
                  onChange={() => onToggleLayer('river_channel')}
                  className="accent-cyan-400 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Hydrodynamic Layers */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
                Hydrodynamic Outputs
              </span>
              <label className="flex items-center justify-between cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-cyan-300" />
                  Flood Inundation Extent
                </span>
                <input
                  type="checkbox"
                  checked={layers.flood_extent}
                  onChange={() => onToggleLayer('flood_extent')}
                  className="accent-cyan-400 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  Water Depth Heatmap
                </span>
                <input
                  type="checkbox"
                  checked={layers.water_depth}
                  onChange={() => onToggleLayer('water_depth')}
                  className="accent-cyan-400 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-teal-400" />
                  Flow Velocity Vectors
                </span>
                <input
                  type="checkbox"
                  checked={layers.velocity_vectors}
                  onChange={() => onToggleLayer('velocity_vectors')}
                  className="accent-cyan-400 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Flood Arrival Isochrones
                </span>
                <input
                  type="checkbox"
                  checked={layers.arrival_time}
                  onChange={() => onToggleLayer('arrival_time')}
                  className="accent-cyan-400 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Multi-Hazard Risk Zones
                </span>
                <input
                  type="checkbox"
                  checked={layers.risk_zones}
                  onChange={() => onToggleLayer('risk_zones')}
                  className="accent-cyan-400 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Infrastructure Layers */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                Critical Infrastructure
              </span>
              <label className="flex items-center justify-between cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-amber-300" />
                  Villages / Settlements
                </span>
                <input
                  type="checkbox"
                  checked={layers.villages}
                  onChange={() => onToggleLayer('villages')}
                  className="accent-cyan-400 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-red-400" />
                  Hospitals / PHCs
                </span>
                <input
                  type="checkbox"
                  checked={layers.hospitals}
                  onChange={() => onToggleLayer('hospitals')}
                  className="accent-cyan-400 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  Schools / Colleges
                </span>
                <input
                  type="checkbox"
                  checked={layers.schools}
                  onChange={() => onToggleLayer('schools')}
                  className="accent-cyan-400 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-yellow-300" />
                  Evacuation Corridors
                </span>
                <input
                  type="checkbox"
                  checked={layers.evacuation_routes}
                  onChange={() => onToggleLayer('evacuation_routes')}
                  className="accent-cyan-400 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
