import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  IndianDam,
  DEMMetadata,
  SimulationFrame,
  HydrodynamicGridPoint,
  InfrastructureFeature,
} from '../types';
import { LayerVisibility } from '../components/LayersPanel';
import { Map as MapIcon, Globe, Mountain, Maximize2, Navigation } from 'lucide-react';
import { getHydraulicCellColor, HydraulicLayerMode } from '../utils/hydraulicScale';

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
  breachLocation?: 'center' | 'left_abutment' | 'right_abutment';
  activeHydraulicLayer?: HydraulicLayerMode;
  onSelectPoint: (point: HydrodynamicGridPoint) => void;
}

type BasemapType = 'osm' | 'satellite' | 'topo';

// Catmull-Rom smooth spline interpolation for natural river curves
function smoothSplineCoords(points: [number, number][], samplesPerSpan = 4): [number, number][] {
  if (points.length < 3) return points;
  const res: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let s = 0; s < samplesPerSpan; s++) {
      const t = s / samplesPerSpan;
      const t2 = t * t;
      const t3 = t2 * t;
      const lat = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const lon = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      res.push([lat, lon]);
    }
  }
  res.push(points[points.length - 1]);
  return res;
}

// Depth color scale (HR Wallingford standard):
//   0.05–0.5 m  → light blue (#bae6fd)
//   0.5–1.5 m   → sky blue   (#38bdf8)
//   1.5–3.5 m   → blue       (#0284c7)
//   3.5–6 m     → dark blue  (#1e40af)
//   >6 m        → navy       (#1e3a8a)
function depthFillColor(depth: number): string {
  if (depth < 0.5) return '#bae6fd';
  if (depth < 1.5) return '#38bdf8';
  if (depth < 3.5) return '#0284c7';
  if (depth < 6.0) return '#1e40af';
  return '#1e3a8a';
}
function depthBorderColor(depth: number): string {
  if (depth < 0.5) return '#7dd3fc';
  if (depth < 1.5) return '#0ea5e9';
  if (depth < 3.5) return '#0369a1';
  if (depth < 6.0) return '#1d4ed8';
  return '#1e3a8a';
}

// Custom SVG Icons for all feature types with clear symbology
function getFeatureIcon(type: string, isFlooded: boolean): L.DivIcon {
  let bg = '#f59e0b';
  let svgInner = '';
  let size = 28;
  let shadow = '0 2px 8px rgba(0,0,0,0.35)';

  if (type === 'hospital') {
    bg = '#dc2626';
    shadow = '0 2px 10px rgba(220,38,38,0.55)';
    svgInner = `<svg width="14" height="14" viewBox="0 0 24 24" fill="white">
      <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
    </svg>`;
  } else if (type === 'school') {
    bg = '#4f46e5';
    shadow = '0 2px 10px rgba(79,70,229,0.5)';
    svgInner = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>`;
  } else if (type === 'bridge') {
    bg = '#0284c7';
    shadow = '0 2px 10px rgba(2,132,199,0.5)';
    svgInner = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
      <path d="M4 19V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v13"/>
      <path d="M4 12h16"/>
      <path d="M8 19a4 4 0 0 1 8 0"/>
    </svg>`;
  } else if (type === 'shelter') {
    bg = '#059669';
    size = 30;
    shadow = '0 2px 12px rgba(5,150,105,0.6)';
    svgInner = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>`;
  } else {
    // Village / Township
    bg = isFlooded ? '#ef4444' : '#f59e0b';
    shadow = isFlooded ? '0 0 14px rgba(239,68,68,0.85)' : '0 2px 8px rgba(245,158,11,0.45)';
    svgInner = `<svg width="14" height="14" viewBox="0 0 24 24" fill="white">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>`;
  }

  const anim = isFlooded ? 'animation: pulse 1.2s infinite;' : '';

  const html = `
    <div style="width:${size}px; height:${size}px; border-radius:50%; background:${bg}; border:2.5px solid #ffffff; box-shadow:${shadow}; display:flex; align-items:center; justify-content:center; cursor:pointer; ${anim}">
      ${svgInner}
    </div>
  `;

  return L.divIcon({
    className: 'custom-infra-icon',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
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
  breachLocation = 'center',
  activeHydraulicLayer = 'depth',
  onSelectPoint,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const probeMarkerRef = useRef<L.Marker | null>(null);

  const [basemap, setBasemap] = useState<BasemapType>('osm');

  // Basemap tile definitions (Original Maps)
  const basemapUrls: Record<BasemapType, { url: string; options: L.TileLayerOptions }> = {
    osm: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      },
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, GeoEye',
        maxZoom: 18,
      },
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      options: {
        attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: OpenTopoMap',
        maxZoom: 17,
      },
    },
  };

  // Helper to fit map bounds to the active dam and all downstream settlements
  const fitValleyBounds = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const points: [number, number][] = [[dam.latitude, dam.longitude]];
    riverChannel.forEach(([lat, lon]) => points.push([lat, lon]));
    infrastructure.forEach((f) => points.push([f.lat, f.lon]));

    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map(([lat, lon]) => L.latLng(lat, lon)));
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 13 });
    }
  }, [dam, riverChannel, infrastructure]);

  // Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {
        // ignore
      }
      mapInstanceRef.current = null;
    }

    if ((container as unknown as { _leaflet_id?: number })._leaflet_id != null) {
      delete (container as unknown as { _leaflet_id?: number })._leaflet_id;
    }
    container.innerHTML = '';

    let map: L.Map;
    try {
      map = L.map(container, {
        center: [dam.latitude, dam.longitude + 0.06],
        zoom: 11,
        zoomControl: false,
      });
    } catch (err) {
      console.warn('Leaflet map initialization failed:', err);
      return;
    }

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer (Original OpenStreetMap)
    const baseConfig = basemapUrls[basemap];
    const initialTile = L.tileLayer(baseConfig.url, baseConfig.options).addTo(map);
    tileLayerRef.current = initialTile;

    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
      fitValleyBounds();
    }, 120);

    // Click handler on map to inspect coordinate
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;
      const { rows, cols, min_lat, max_lat, min_lon, max_lon, elevations } = dem;

      const rIdx = Math.min(
        rows - 1,
        Math.max(0, Math.floor(((max_lat - lat) / Math.max(0.001, max_lat - min_lat)) * rows))
      );
      const cIdx = Math.min(
        cols - 1,
        Math.max(0, Math.floor(((lon - min_lon) / Math.max(0.001, max_lon - min_lon)) * cols))
      );

      const elev = elevations[rIdx] ? elevations[rIdx][cIdx] : dem.min_elevation_m;
      const depth = currentFrame?.grid_depths[rIdx] ? currentFrame.grid_depths[rIdx][cIdx] : 0;
      const [u, v] = currentFrame?.grid_velocities[rIdx] ? currentFrame.grid_velocities[rIdx][cIdx] : [0, 0];
      const velMag = Math.hypot(u, v);
      const arrival = arrivalTimeGrid && arrivalTimeGrid[rIdx] ? arrivalTimeGrid[rIdx][cIdx] : -1;
      const risk = riskGrid && riskGrid[rIdx] ? riskGrid[rIdx][cIdx] : 'SAFE';

      // Update inspection probe marker
      if (probeMarkerRef.current) {
        probeMarkerRef.current.setLatLng(e.latlng);
      } else {
        const probeIcon = L.divIcon({
          className: 'custom-probe-icon',
          html: `<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:2.5px solid #ffffff;box-shadow:0 0 8px rgba(37,99,235,0.8);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        probeMarkerRef.current = L.marker(e.latlng, { icon: probeIcon }).addTo(map);
      }

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

  // Handle Basemap Switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = basemapUrls[basemap];
    const newTile = L.tileLayer(config.url, config.options).addTo(map);
    tileLayerRef.current = newTile;
    newTile.bringToBack();
  }, [basemap]);

  // Auto-fit on dam or river channel change
  useEffect(() => {
    fitValleyBounds();
  }, [dam, riverChannel, fitValleyBounds]);

  // Render Flood Inundation Envelopes, River Thalweg & Infrastructure Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;
    const group = layersGroupRef.current;
    group.clearLayers();

    // 1. River Channel Polyline (Natural Course)
    if (layers.river_channel && riverChannel.length > 0) {
      const riverLine = L.polyline(riverChannel, {
        color: '#0284c7',
        weight: 4.5,
        opacity: 0.85,
        dashArray: '8, 6',
      });
      riverLine.bindTooltip(`${dam.river} Natural Thalweg`, {
        className: 'bg-white text-slate-800 text-xs px-2 py-1 rounded shadow-md border border-slate-200 font-semibold',
      });
      group.addLayer(riverLine);
    }

    // 2. Dam Model Marker
    if (layers.dam_model) {
      const damIconHtml = `
        <div style="width:34px; height:34px; border-radius:8px; background:#1e3a8a; border:2.5px solid #ffffff; box-shadow:0 3px 12px rgba(30,58,138,0.6); display:flex; align-items:center; justify-content:center; cursor:pointer;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M4 4h16v3H4zm1 5h14l-2 11H7zm4 3v5h2v-5zm4 0v5h2v-5z"/>
          </svg>
        </div>
      `;
      const damIcon = L.divIcon({
        className: 'custom-dam-icon',
        html: damIconHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const damMarker = L.marker([dam.latitude, dam.longitude], { icon: damIcon });
      damMarker.bindTooltip(
        `<div class="text-xs p-1"><strong>${dam.name}</strong><br/>Height: ${dam.height_m}m | FRL: ${dam.full_reservoir_level_m}m MSL<br/>Capacity: ${dam.gross_capacity_mcm.toLocaleString()} MCM</div>`,
        { permanent: false }
      );
      group.addLayer(damMarker);
    }

    // 3. FLOOD INUNDATION — rendered from ANUGA wet cells (GeoJSON) or depth grid
    //
    // REMOVED: river-buffer corridor polygon generation.
    // SOURCE:  flood extent comes from currentFrame.flood_geojson (wet cells from solver)
    //          OR from grid_depths (depth-colored cell rectangles).
    //
    // Depth color scale (HR Wallingford / standard practice):
    //   0.05 – 0.5  m  → light blue   (shallow)
    //   0.5  – 1.5  m  → cyan         (moderate)
    //   1.5  – 3.5  m  → blue         (deep)
    //   3.5  – 6    m  → dark blue    (very deep)
    //   > 6         m  → navy         (extreme)
    if ((layers.flood_extent || layers.water_depth) && currentFrame) {

      // ── Path A: GeoJSON from ANUGA backend (real wet cells) ─────────── //
      const floodGeoJSON = (currentFrame as unknown as Record<string, unknown>).flood_geojson as
        { type: string; features: unknown[] } | undefined;

      if (floodGeoJSON && floodGeoJSON.features && floodGeoJSON.features.length > 0) {
        const geoLayer = L.geoJSON(floodGeoJSON as Parameters<typeof L.geoJSON>[0], {
          style: (feature) => {
            const p = (feature?.properties as Record<string, unknown> | undefined) || {};
            const d = Number(p.depth_m ?? p.depth ?? 0);
            const v = Number(p.velocity_ms ?? p.velocity ?? 0);
            const h = Number(p.hazard_index ?? (d * v));
            const arr = Number(p.arrival_time_min ?? -1);

            const colorResult = getHydraulicCellColor(activeHydraulicLayer, {
              depth: d,
              velocity: v,
              hazard: h,
              arrivalTimeMin: arr,
            });

            return {
              color: colorResult.border,
              weight: 0.6,
              opacity: 0.75,
              fillColor: colorResult.fill,
              fillOpacity: 0.65,
            };
          },
          onEachFeature: (feature, featureLayer) => {
            const p = (feature?.properties as Record<string, unknown> | undefined) || {};
            const d = Number(p.depth_m ?? p.depth ?? 0);
            const v = Number(p.velocity_ms ?? p.velocity ?? 0);
            const h = Number(p.hazard_index ?? (d * v));
            const arr = Number(p.arrival_time_min ?? -1);
            const elev = Number(p.elevation_m ?? 0);
            const stage = Number(p.stage_m ?? (elev + d));

            const colorResult = getHydraulicCellColor(activeHydraulicLayer, {
              depth: d,
              velocity: v,
              hazard: h,
              arrivalTimeMin: arr,
            });

            featureLayer.bindTooltip(
              `<div class="text-xs p-1 font-sans">
                <div class="font-bold text-blue-800 border-b border-slate-200 pb-0.5 mb-1">
                  ANUGA Cell #${p.cell_id ?? ''}
                </div>
                <div>Depth: <strong>${d.toFixed(2)} m</strong></div>
                <div>Velocity: <strong>${v.toFixed(2)} m/s</strong></div>
                <div>Hazard (H×V): <strong>${h.toFixed(3)} m²/s</strong></div>
                <div>Arrival Time: <strong>${arr >= 0 ? arr.toFixed(1) + ' min' : 'Dry'}</strong></div>
                <div>Elevation: <strong>${elev.toFixed(1)} m</strong> | Stage: <strong>${stage.toFixed(1)} m</strong></div>
                <div class="text-[10px] text-slate-500 mt-1 font-medium bg-slate-100 px-1 py-0.5 rounded">
                  Layer: ${activeHydraulicLayer.toUpperCase()} (${colorResult.label})
                </div>
              </div>`,
              { permanent: false }
            );

            featureLayer.on('click', (e: L.LeafletMouseEvent) => {
              L.DomEvent.stopPropagation(e);
              onSelectPoint({
                row: 0,
                col: 0,
                lat: e.latlng.lat,
                lon: e.latlng.lng,
                elevation_m: elev,
                water_depth_m: d,
                water_surface_elevation_m: stage,
                flow_velocity_ms: v,
                velocity_u_ms: 0,
                velocity_v_ms: 0,
                flow_direction_deg: 0,
                hazard_index: h,
                hazard_tier: (h >= 1.2 ? 'VERY_HIGH' : h >= 0.6 ? 'HIGH' : h >= 0.3 ? 'MODERATE' : 'LOW') as any,
                arrival_time_min: arr >= 0 ? arr : null,
                is_wet: d > 0.05,
                distance_from_dam_km: 0,
              });
            });
          },
        });
        group.addLayer(geoLayer);

      } else {
        // ── Path B: Render depth grid as colored cell rectangles ────────── //
        const { rows, cols, min_lat, max_lat, min_lon, max_lon } = dem;
        const latStep = (max_lat - min_lat) / rows;
        const lonStep = (max_lon - min_lon) / cols;
        const WET_THRESHOLD = 0.05;

        const depths = currentFrame.grid_depths;
        const vels = currentFrame.grid_velocities;
        if (depths && depths.length > 0) {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const depth = depths[r]?.[c] ?? 0;
              if (depth < WET_THRESHOLD) continue;

              const u = vels?.[r]?.[c]?.[0] ?? 0;
              const v = vels?.[r]?.[c]?.[1] ?? 0;
              const velocity = Math.hypot(u, v);
              const hazard = depth * velocity;
              const arrTime = arrivalTimeGrid?.[r]?.[c] ?? -1;

              const colorResult = getHydraulicCellColor(activeHydraulicLayer, {
                depth,
                velocity,
                hazard,
                arrivalTimeMin: arrTime,
              });

              const cellLat = max_lat - r * latStep;
              const cellLon = min_lon + c * lonStep;

              const rect = L.rectangle(
                [[cellLat - latStep, cellLon], [cellLat, cellLon + lonStep]],
                {
                  color: colorResult.border,
                  weight: 0.4,
                  opacity: 0.7,
                  fillColor: colorResult.fill,
                  fillOpacity: 0.6,
                  interactive: true,
                }
              );

              rect.bindTooltip(
                `<div class="text-xs p-1">
                  <strong>DEM Cell (${r}, ${c})</strong><br/>
                  Depth: ${depth.toFixed(2)} m<br/>
                  Velocity: ${velocity.toFixed(2)} m/s<br/>
                  Hazard: ${hazard.toFixed(2)}<br/>
                  Layer: ${activeHydraulicLayer.toUpperCase()}
                </div>`,
                { permanent: false }
              );

              rect.on('click', () => {
                const elev = dem.elevation_grid?.[r]?.[c] ?? 0;
                onSelectPoint({
                  row: r,
                  col: c,
                  lat: cellLat - latStep / 2,
                  lon: cellLon + lonStep / 2,
                  elevation_m: elev,
                  water_depth_m: depth,
                  water_surface_elevation_m: elev + depth,
                  flow_velocity_ms: velocity,
                  velocity_u_ms: u,
                  velocity_v_ms: v,
                  flow_direction_deg: 0,
                  hazard_index: hazard,
                  hazard_tier: (hazard >= 1.2 ? 'VERY_HIGH' : hazard >= 0.6 ? 'HIGH' : hazard >= 0.3 ? 'MODERATE' : 'LOW') as any,
                  arrival_time_min: arrTime >= 0 ? arrTime : null,
                  is_wet: true,
                  distance_from_dam_km: 0,
                });
              });

              group.addLayer(rect);
            }
          }
        }
      }

      // ── River centerline overlay (reference, not flood boundary) ──────── //
      if (layers.river_channel && riverChannel.length > 0) {
        const thalweg = L.polyline(riverChannel, {
          color: '#ffffff',
          weight: 1.8,
          opacity: 0.65,
          dashArray: '6, 10',
          lineCap: 'round',
          className: 'animated-water-flow',
        });
        thalweg.bindTooltip(`${dam.river} River Centerline (reference)`, {
          className: 'bg-white text-slate-800 text-xs px-2 py-1 rounded shadow-md font-medium',
        });
        group.addLayer(thalweg);
      }
    }

    // 4. Infrastructure Points with DEDICATED DISTINCT SYMBOLS (Hospitals, Schools, Bridges, Villages, Shelters)
    infrastructure.forEach((feat) => {
      let shouldShow = false;

      if (feat.type === 'village' && layers.villages) {
        shouldShow = true;
      } else if (feat.type === 'hospital' && layers.hospitals) {
        shouldShow = true;
      } else if (feat.type === 'school' && layers.schools) {
        shouldShow = true;
      } else if (feat.type === 'bridge' && layers.roads) {
        shouldShow = true;
      } else if (feat.type === 'shelter' && layers.evacuation_routes) {
        shouldShow = true;
      }

      if (shouldShow) {
        const isFlooded = Boolean(feat.water_depth_m && feat.water_depth_m > 0.25);
        const icon = getFeatureIcon(feat.type, isFlooded);

        const marker = L.marker([feat.lat, feat.lon], { icon });

        // Permanent visible clean pill badge label so user can easily identify every settlement
        const shortName = feat.name.split('(')[0].trim();
        const badgeClass = feat.type === 'shelter'
          ? 'bg-emerald-700 text-white font-bold shadow-md'
          : isFlooded
            ? 'bg-red-600 text-white font-bold shadow-md'
            : 'bg-white text-slate-800 font-semibold border border-slate-200 shadow-sm';

        marker.bindTooltip(
          `<span class="px-1.5 py-0.5 rounded text-[11px] ${badgeClass}">${shortName}</span>`,
          { permanent: true, direction: 'top', offset: [0, -16], className: 'custom-settlement-tooltip' }
        );

        const statusHtml = feat.water_depth_m && feat.water_depth_m > 0.2
          ? `<span style="color:#ef4444;font-weight:bold;">FLOODED (${feat.water_depth_m.toFixed(1)}m, ${feat.max_velocity_ms?.toFixed(1) || 0} m/s)</span>`
          : '<span style="color:#10b981;font-weight:bold;">SAFE / ACCESSIBLE</span>';

        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #1e293b; min-width: 180px;">
            <b style="font-size: 13px; color: #0f172a;">${feat.name}</b><br/>
            <div style="margin-top: 4px; line-height: 1.5;">
              Type: <b>${feat.type.toUpperCase()}</b><br/>
              Ground Elevation: <b>${feat.elevation_m}m MSL</b><br/>
              ${feat.population ? `Population: <b>${feat.population.toLocaleString()}</b><br/>` : ''}
              Distance from Dam: <b>${feat.distance_from_dam_km} km</b><br/>
              ${feat.arrival_time_min ? `Flood Wave ETA: <b>T+${feat.arrival_time_min} mins</b><br/>` : ''}
              Status: ${statusHtml}
            </div>
          </div>
        `);
        group.addLayer(marker);
      }
    });
  }, [layers, currentFrame, dem, infrastructure, riverChannel, dam, activeHydraulicLayer, arrivalTimeGrid]);

  // Jump to specific settlement
  const handleJumpToSettlement = (id: string) => {
    const feat = infrastructure.find((f) => f.id === id);
    if (feat && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([feat.lat, feat.lon], 14, { duration: 1.2 });
    }
  };

  return (
    <div className="w-full h-full relative bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Top-Right Basemap Switcher & Valley Fit Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={fitValleyBounds}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur border border-slate-200 text-slate-700 hover:text-blue-700 hover:bg-slate-50 rounded-lg shadow-md text-xs font-semibold transition-all"
          title="Zoom to Fit Full Downstream River Valley Extent"
        >
          <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Fit Valley</span>
        </button>

        <div className="flex items-center bg-white/95 backdrop-blur border border-slate-200 rounded-lg p-1 shadow-md text-xs font-medium">
          <button
            onClick={() => setBasemap('osm')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${basemap === 'osm'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            title="Original OpenStreetMap Street Map"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Street</span>
          </button>

          <button
            onClick={() => setBasemap('satellite')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${basemap === 'satellite'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            title="Original ESRI Satellite Imagery"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>

          <button
            onClick={() => setBasemap('topo')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${basemap === 'topo'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            title="OpenTopoMap Topographic Contours"
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Topo</span>
          </button>
        </div>
      </div>

      {/* Top Left Quick Settlement Jump Selector */}
      <div className="absolute top-4 left-4 z-20 flex items-center bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-md text-xs">
        <Navigation className="w-3.5 h-3.5 text-blue-600 mr-2 shrink-0" />
        <span className="text-slate-500 mr-2 font-medium">Jump to:</span>
        <select
          onChange={(e) => handleJumpToSettlement(e.target.value)}
          defaultValue=""
          className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="" disabled>Select Downstream Settlement...</option>
          {infrastructure.map((feat) => (
            <option key={feat.id} value={feat.id}>
              {feat.name} ({feat.distance_from_dam_km} km)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
