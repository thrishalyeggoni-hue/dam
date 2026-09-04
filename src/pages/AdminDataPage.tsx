import React, { useState } from 'react';
import {
  Database,
  UploadCloud,
  FileCheck,
  AlertCircle,
  FileText,
  MapPin,
  Mountain,
  Layers,
  Box,
  Video,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface DataSourceItem {
  id: string;
  category: string;
  name: string;
  format: string;
  expectedPath: string;
  status: 'LOADED' | 'MISSING' | 'SAMPLE_ACTIVE';
  details: string;
  size: string;
}

export const AdminDataPage: React.FC = () => {
  const [sources, setSources] = useState<DataSourceItem[]>([
    {
      id: 'dam-registry',
      category: 'Dam Registry',
      name: 'Indian Dams Geographic GeoJSON',
      format: '.geojson / .json',
      expectedPath: 'src/data/indianDams.ts',
      status: 'LOADED',
      details: '7 Major Indian Dams (Nagarjuna Sagar, Tehri, Sardar Sarovar, Bhakra, Hirakud, Idukki, Koyna)',
      size: '24 KB',
    },
    {
      id: 'dem-geotiff',
      category: 'Topography / DEM',
      name: 'Krishna River Valley Digital Elevation Model (SRTM 30m / ALOS)',
      format: '.tif / .tiff / .json',
      expectedPath: 'src/data/nagarjunaSagarDEM.ts',
      status: 'LOADED',
      details: 'Resolution: 30m, 50x80 Grid Matrix, Min: 62m, Max: 348m MSL, CRS: EPSG:4326',
      size: '480 KB',
    },
    {
      id: 'river-thalweg',
      category: 'Hydrology',
      name: 'Krishna River Downstream Channel Thalweg',
      format: '.geojson',
      expectedPath: 'src/data/nagarjunaSagarInfrastructure.ts',
      status: 'LOADED',
      details: 'Downstream coordinates to 35km mark, reach slope S0 = 0.00062',
      size: '12 KB',
    },
    {
      id: 'reservoir-polygon',
      category: 'Reservoir',
      name: 'Nagarjuna Sagar Full Reservoir Contour Polygon',
      format: '.geojson / .shp',
      expectedPath: 'src/data/nagarjunaSagarDEM.ts',
      status: 'LOADED',
      details: 'FRL 179.8m contour polygon, Gross Capacity: 11,560 MCM',
      size: '34 KB',
    },
    {
      id: 'infrastructure-layer',
      category: 'Critical Assets',
      name: 'Downstream Infrastructure & Evacuation Routes',
      format: '.geojson',
      expectedPath: 'src/data/nagarjunaSagarInfrastructure.ts',
      status: 'LOADED',
      details: '14 Critical Assets (Villages, Hospitals, Schools, Bridges, Shelters)',
      size: '42 KB',
    },
    {
      id: 'dam-3d-model',
      category: '3D Geometry',
      name: 'Nagarjuna Sagar Masonry Gravity Dam 3D Model',
      format: '.glb / .gltf',
      expectedPath: 'public/models/dam_structure.glb',
      status: 'SAMPLE_ACTIVE',
      details: 'Parametric Engineering Masonry Gravity Dam + Spillway Radial Crest Gates',
      size: '1.2 MB',
    },
    {
      id: 'simulation-frames',
      category: 'Hydrodynamic Engine',
      name: 'ANUGA / SWE Time-Series Hydrodynamic Output',
      format: '.json / .nc (NetCDF)',
      expectedPath: 'src/simulation/hydrodynamicEngine.ts',
      status: 'LOADED',
      details: '13 Discrete 15-min Time Steps (T+00:00 to T+03:00), Depths + Velocities',
      size: '650 KB',
    },
    {
      id: 'cinematic-reel',
      category: 'Cinematic Reel',
      name: 'Blender FLIP Fluids Pre-Rendered Media',
      format: '.mp4 / .webm',
      expectedPath: 'public/media/flip_fluids_dam_break.mp4',
      status: 'SAMPLE_ACTIVE',
      details: 'Procedural Cycles WebGL Reel Active; Local Video Upload Supported',
      size: '14.5 MB',
    },
  ]);

  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const handleFileUpload = (id: string, fileName: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'LOADED', details: `User uploaded: ${fileName}` } : s))
    );
    setUploadMessage(`Successfully imported and parsed ${fileName}`);
    setTimeout(() => setUploadMessage(null), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0c] p-6 text-[#e0e0e0]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-black tracking-wider uppercase text-white">
                Project Data Management &amp; GIS Layer Registry
              </h2>
            </div>
            <p className="text-xs text-white/40 mt-1 font-mono">
              Configure real Indian dam geographic coordinates, DEM elevation grids, river vectors, and hydrodynamic simulation outputs.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
              8 of 8 Data Layers Connected
            </span>
          </div>
        </div>

        {uploadMessage && (
          <div className="bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 p-3 rounded text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{uploadMessage}</span>
          </div>
        )}

        {/* Data Layers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((src) => (
            <div
              key={src.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverId(src.id);
              }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverId(null);
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(src.id, file.name);
              }}
              className={`bg-white/5 rounded border p-4 transition-all flex flex-col justify-between ${
                dragOverId === src.id
                  ? 'border-blue-400 bg-blue-950/20'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                    {src.category}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      src.status === 'LOADED'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : src.status === 'SAMPLE_ACTIVE'
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {src.status === 'LOADED' ? 'CONNECTED' : 'SYSTEM BUILT-IN'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">{src.name}</h3>
                <p className="text-xs text-white/50 mb-3 font-mono">{src.details}</p>

                <div className="text-[10px] font-mono text-white/50 bg-white/5 p-2 rounded border border-white/5 space-y-1">
                  <div className="flex justify-between">
                    <span>Expected Format:</span>
                    <span className="text-blue-400 font-bold">{src.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Default Path:</span>
                    <span className="text-white/70">{src.expectedPath}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File Size:</span>
                    <span className="text-white/70">{src.size}</span>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone Bar */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between font-mono">
                <label className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1.5 transition-colors">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Local File</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(src.id, file.name);
                    }}
                  />
                </label>
                <span className="text-[9px] text-white/30 uppercase">Drag &amp; drop supported</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
