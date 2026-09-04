import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  IndianDam,
  DEMMetadata,
  SimulationFrame,
  HydrodynamicGridPoint,
  InfrastructureFeature,
} from '../types';
import { LayerVisibility } from '../components/LayersPanel';

interface Leaflet2DMapProps {
  dam: IndianDam;
  dem: DEMMetadata;
  currentFrame?: SimulationFrame;
  maxDepthGrid?: number[][];
  maxVelocityGrid?: number[][];
  arrivalTimeGrid?: number[][];
  riskGrid?: ('SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH')[][];
  infrastructure: InfrastructureFeature[];
  riverChannel: [number, number][];
  layers: LayerVisibility;
  onSelectPoint: (point: HydrodynamicGridPoint) => void;
}

export const Leaflet2DMap: React.FC<Leaflet2DMapProps> = ({
  dam,
  dem,
  currentFrame,
  maxDepthGrid,
  maxVelocityGrid,
  arrivalTimeGrid,
  riskGrid,
  infrastructure,
  riverChannel,
  layers,
  onSelectPoint,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const floodCanvasLayerRef = useRef<L.ImageOverlay | null>(null);

  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Remove existing map if any
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {
        // ignore error during remove
      }
      mapInstanceRef.current = null;
    }

    // Clean up _leaflet_id on container to prevent "Map container is already initialized" error
    if ((container as unknown as { _leaflet_id?: number })._leaflet_id != null) {
      delete (container as unknown as { _leaflet_id?: number })._leaflet_id;
    }
    container.innerHTML = '';

    let map: L.Map;
    try {
      map = L.map(container, {
        center: [dam.latitude, dam.longitude + 0.05],
        zoom: 12,
        zoomControl: false,
      });
    } catch (err) {
      console.warn('Leaflet map initialization warning:', err);
      return;
    }

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dark Basemap (CartoDB Dark Matter)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;
    mapInstanceRef.current = map;

    // Click handler on map to inspect coordinate
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;
      const { rows, cols, min_lat, max_lat, min_lon, max_lon, elevations } = dem;

      const rIdx = Math.min(
        rows - 1,
        Math.max(0, Math.floor(((max_lat - lat) / (max_lat - min_lat)) * rows))
      );
      const cIdx = Math.min(
        cols - 1,
        Math.max(0, Math.floor(((lon - min_lon) / (max_lon - min_lon)) * cols))
      );

      const elev = elevations[rIdx] ? elevations[rIdx][cIdx] : 90;
      const depth = currentFrame?.grid_depths[rIdx] ? currentFrame.grid_depths[rIdx][cIdx] : 0;
      const [u, v] = currentFrame?.grid_velocities[rIdx] ? currentFrame.grid_velocities[rIdx][cIdx] : [0, 0];
      const velMag = Math.hypot(u, v);
      const arrival = arrivalTimeGrid && arrivalTimeGrid[rIdx] ? arrivalTimeGrid[rIdx][cIdx] : -1;
      const risk = riskGrid && riskGrid[rIdx] ? riskGrid[rIdx][cIdx] : 'SAFE';

      onSelectPoint({
        lat,
        lon,
        x_idx: cIdx,
        y_idx: rIdx,
        elevation: elev,
        depth: depth || 0,
        water_surface_elev: elev + (depth || 0),
        velocity_u: u || 0,
        velocity_v: v || 0,
        velocity_mag: velMag || 0,
        arrival_time_min: arrival,
        risk_level: risk,
      });
    });

    return () => {
      try {
        map.remove();
      } catch {
        // ignore
      }
      mapInstanceRef.current = null;
      if (container && (container as unknown as { _leaflet_id?: number })._leaflet_id != null) {
        delete (container as unknown as { _leaflet_id?: number })._leaflet_id;
      }
    };
  }, [dam.id]);

  // Center on dam when changed
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([dam.latitude, dam.longitude + 0.05], 12);
    }
  }, [dam]);

  // Render Flood Inundation Canvas Overlay & Infrastructure Layers
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;
    const group = layersGroupRef.current;
    group.clearLayers();

    // 1. River Channel Polyline
    if (layers.river_channel && riverChannel.length > 0) {
      const riverLine = L.polyline(riverChannel, {
        color: '#0284c7',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 4',
      });
      riverLine.bindTooltip('Krishna River Thalweg');
      group.addLayer(riverLine);
    }

    // 2. Dam Marker
    if (layers.dam_model) {
      const damMarker = L.circleMarker([dam.latitude, dam.longitude], {
        radius: 9,
        color: '#22d3ee',
        weight: 2,
        fillColor: '#0891b2',
        fillOpacity: 0.9,
      });
      damMarker.bindTooltip(
        `<b>${dam.name}</b><br/>Height: ${dam.height_m}m | FRL: ${dam.full_reservoir_level_m}m MSL`,
        { permanent: false }
      );
      group.addLayer(damMarker);
    }

    // 3. Flood Inundation Grid & Depth Rendering (via Canvas image overlay)
    if ((layers.flood_extent || layers.water_depth) && currentFrame) {
      const { rows, cols, min_lat, max_lat, min_lon, max_lon } = dem;
      const canvas = document.createElement('canvas');
      canvas.width = cols;
      canvas.height = rows;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const imgData = ctx.createImageData(cols, rows);
        const depths = currentFrame.grid_depths;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = (r * cols + c) * 4;
            const depth = depths[r] ? depths[r][c] || 0 : 0;

            if (depth > 0.05) {
              if (layers.water_depth) {
                // Color by depth
                if (depth < 0.5) {
                  imgData.data[idx] = 103; // shallow cyan
                  imgData.data[idx + 1] = 232;
                  imgData.data[idx + 2] = 249;
                  imgData.data[idx + 3] = 160;
                } else if (depth < 1.5) {
                  imgData.data[idx] = 14; // blue
                  imgData.data[idx + 1] = 165;
                  imgData.data[idx + 2] = 233;
                  imgData.data[idx + 3] = 190;
                } else if (depth < 3.5) {
                  imgData.data[idx] = 30; // dark blue
                  imgData.data[idx + 1] = 64;
                  imgData.data[idx + 2] = 175;
                  imgData.data[idx + 3] = 220;
                } else {
                  imgData.data[idx] = 124; // extreme purple
                  imgData.data[idx + 1] = 58;
                  imgData.data[idx + 2] = 237;
                  imgData.data[idx + 3] = 240;
                }
              } else {
                // Flood extent outline
                imgData.data[idx] = 14;
                imgData.data[idx + 1] = 165;
                imgData.data[idx + 2] = 233;
                imgData.data[idx + 3] = 170;
              }
            } else {
              imgData.data[idx + 3] = 0; // transparent
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        if (floodCanvasLayerRef.current) {
          group.removeLayer(floodCanvasLayerRef.current);
        }

        const imageBounds: L.LatLngBoundsExpression = [
          [min_lat, min_lon],
          [max_lat, max_lon],
        ];
        const overlay = L.imageOverlay(canvas.toDataURL(), imageBounds, {
          opacity: 0.85,
          interactive: false,
        });
        group.addLayer(overlay);
        floodCanvasLayerRef.current = overlay;
      }
    }

    // 4. Infrastructure Points
    infrastructure.forEach((feat) => {
      let shouldShow = false;
      let markerColor = '#f59e0b';
      let iconRadius = 6;

      if (feat.type === 'village' && layers.villages) {
        shouldShow = true;
        markerColor = feat.water_depth_m && feat.water_depth_m > 0.5 ? '#ef4444' : '#f59e0b';
        iconRadius = 7;
      } else if (feat.type === 'hospital' && layers.hospitals) {
        shouldShow = true;
        markerColor = '#dc2626';
        iconRadius = 6;
      } else if (feat.type === 'school' && layers.schools) {
        shouldShow = true;
        markerColor = '#6366f1';
        iconRadius = 5;
      } else if (feat.type === 'bridge' && layers.roads) {
        shouldShow = true;
        markerColor = '#06b6d4';
        iconRadius = 6;
      } else if (feat.type === 'shelter' && layers.evacuation_routes) {
        shouldShow = true;
        markerColor = '#10b981';
        iconRadius = 8;
      }

      if (shouldShow) {
        const marker = L.circleMarker([feat.lat, feat.lon], {
          radius: iconRadius,
          color: '#ffffff',
          weight: 1.5,
          fillColor: markerColor,
          fillOpacity: 0.95,
        });

        const statusHtml = feat.water_depth_m && feat.water_depth_m > 0.2
          ? `<span style="color:#ef4444;font-weight:bold;">FLOODED (${feat.water_depth_m.toFixed(1)}m)</span>`
          : '<span style="color:#10b981;font-weight:bold;">SAFE / ACCESSIBLE</span>';

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <b style="font-size: 13px;">${feat.name}</b><br/>
            Type: <b>${feat.type.toUpperCase()}</b><br/>
            Elevation: ${feat.elevation_m}m MSL<br/>
            ${feat.population ? `Population: ${feat.population.toLocaleString()}<br/>` : ''}
            Distance from Dam: ${feat.distance_from_dam_km} km<br/>
            Status: ${statusHtml}
          </div>
        `);
        group.addLayer(marker);
      }
    });
  }, [layers, currentFrame, dem, infrastructure, riverChannel, dam]);

  return (
    <div className="w-full h-full relative bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-300 font-mono z-20 pointer-events-none">
        <span>2D Hydrodynamic GIS Map: {dam.name}</span>
      </div>
    </div>
  );
};
