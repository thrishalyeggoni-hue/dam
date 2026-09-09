import React, { useState } from 'react';
import {
  Layers,
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
  dam_model: boolean;
  river_channel: boolean;
  flood_extent: boolean;
  water_depth: boolean;
  velocity_vectors: boolean;
  arrival_time: boolean;
  risk_zones: boolean;
  roads: boolean;
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
      <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-lg shadow-lg overflow-hidden w-64 text-slate-800">
        {/* Toggle Bar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Map Layers</span>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Layer Item Checkboxes */}
        {isOpen && (
          <div className="p-3 space-y-3 max-h-96 overflow-y-auto text-xs text-slate-700 divide-y divide-slate-100">
            {/* Base Features */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Physical Features
              </span>
              <label className="flex items-center justify-between cursor-pointer hover:text-blue-600 py-0.5">
                <span className="flex items-center gap-1.5">
                  <Map className="w-3.5 h-3.5 text-slate-500" />
                  3D Elevation Terrain
                </span>
                <input
                  type="checkbox"
                  checked={layers.terrain}
                  onChange={() => onToggleLayer('terrain')}
                  className="accent-blue-600 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-blue-600 py-0.5">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-600" />
                  Dam Structure &amp; Gates
                </span>
                <input
                  type="checkbox"
                  checked={layers.dam_model}
                  onChange={() => onToggleLayer('dam_model')}
                  className="accent-blue-600 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-blue-600 py-0.5">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-500" />
                  River Valley Thalweg
                </span>
                <input
                  type="checkbox"
                  checked={layers.river_channel}
                  onChange={() => onToggleLayer('river_channel')}
                  className="accent-blue-600 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Hydrodynamics */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Flood Hydraulics
              </span>
              <label className="flex items-center justify-between cursor-pointer hover:text-blue-600 py-0.5">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  Water Depth Gradient
                </span>
                <input
                  type="checkbox"
                  checked={layers.water_depth}
                  onChange={() => onToggleLayer('water_depth')}
                  className="accent-blue-600 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-blue-600 py-0.5">
                <span className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-cyan-600" />
                  Flow Velocity Vectors
                </span>
                <input
                  type="checkbox"
                  checked={layers.velocity_vectors}
                  onChange={() => onToggleLayer('velocity_vectors')}
                  className="accent-blue-600 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-blue-600 py-0.5">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Arrival Time Contours
                </span>
                <input
                  type="checkbox"
                  checked={layers.arrival_time}
                  onChange={() => onToggleLayer('arrival_time')}
                  className="accent-blue-600 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-blue-600 py-0.5">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Hazard Classification (h×v)
                </span>
                <input
                  type="checkbox"
                  checked={layers.risk_zones}
                  onChange={() => onToggleLayer('risk_zones')}
                  className="accent-blue-600 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Assets & Evacuation */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Downstream Assets
              </span>
              <label className="flex items-center justify-between cursor-pointer hover:text-blue-600 py-0.5">
                <span className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-amber-500" />
                  Villages &amp; Settlements
                </span>
                <input
                  type="checkbox"
                  checked={layers.villages}
                  onChange={() => onToggleLayer('villages')}
                  className="accent-blue-600 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-blue-600 py-0.5">
                <span className="flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-red-500" />
                  Hospitals &amp; PHCs
                </span>
                <input
                  type="checkbox"
                  checked={layers.hospitals}
                  onChange={() => onToggleLayer('hospitals')}
                  className="accent-blue-600 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-blue-600 py-0.5">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  Schools &amp; Shelters
                </span>
                <input
                  type="checkbox"
                  checked={layers.schools}
                  onChange={() => onToggleLayer('schools')}
                  className="accent-blue-600 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-blue-600 py-0.5">
                <span className="flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-emerald-600" />
                  Evacuation Corridors
                </span>
                <input
                  type="checkbox"
                  checked={layers.evacuation_routes}
                  onChange={() => onToggleLayer('evacuation_routes')}
                  className="accent-blue-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
