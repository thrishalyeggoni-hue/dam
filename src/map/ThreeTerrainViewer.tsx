import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  DEMMetadata,
  SimulationFrame,
  HydrodynamicGridPoint,
  InfrastructureFeature,
} from '../types';
import { LayerVisibility } from '../components/LayersPanel';

interface ThreeTerrainViewerProps {
  dem: DEMMetadata;
  currentFrame?: SimulationFrame;
  maxDepthGrid?: number[][];
  maxVelocityGrid?: number[][];
  arrivalTimeGrid?: number[][];
  riskGrid?: ('SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH')[][];
  infrastructure: InfrastructureFeature[];
  layers: LayerVisibility;
  onSelectPoint: (point: HydrodynamicGridPoint) => void;
}

export const ThreeTerrainViewer: React.FC<ThreeTerrainViewerProps> = ({
  dem,
  currentFrame,
  maxDepthGrid,
  maxVelocityGrid,
  arrivalTimeGrid,
  riskGrid,
  infrastructure,
  layers,
  onSelectPoint,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const velocityGroupRef = useRef<THREE.Group | null>(null);
  const infraGroupRef = useRef<THREE.Group | null>(null);
  const damGroupRef = useRef<THREE.Group | null>(null);

  // Mouse interaction state for camera controls
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 85, theta: Math.PI * 0.45, phi: Math.PI * 0.32 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  const [isLoading, setIsLoading] = useState(true);
  const [webGlError, setWebGlError] = useState<string | null>(null);

  // Initialize Three.js Scene, Terrain Mesh, Lighting, and Dam Model
  useEffect(() => {
    if (!containerRef.current) return;
    setWebGlError(null);

    const width = Math.max(100, containerRef.current.clientWidth || 800);
    const height = Math.max(100, containerRef.current.clientHeight || 600);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.005);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    cameraRef.current = camera;

    // Renderer with WebGL support check
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      if (canvasMountRef.current) {
        canvasMountRef.current.innerHTML = '';
        canvasMountRef.current.appendChild(renderer.domElement);
      }
    } catch (err) {
      console.warn('Three.js WebGLRenderer initialization failed:', err);
      setWebGlError('WebGL context creation failed in this environment');
      setIsLoading(false);
      return;
    }

    // Sun & Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7e6, 1.4);
    sunLight.position.set(40, 75, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 250;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(-30, 20, -30);
    scene.add(fillLight);

    // ==========================================
    // 1. BUILD REAL 3D TERRAIN MESH FROM DEM
    // ==========================================
    const { rows, cols, elevations } = dem;
    const terrainWidth = 90; // scale in 3D world units
    const terrainHeight = 55;
    const elevScale = 0.12; // vertical scale

    const terrainGeom = new THREE.PlaneGeometry(terrainWidth, terrainHeight, cols - 1, rows - 1);
    terrainGeom.rotateX(-Math.PI / 2);

    const posAttr = terrainGeom.attributes.position;
    const colors: number[] = [];

    // Base hypsometric & river canyon color palette
    for (let i = 0; i < posAttr.count; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const elev = elevations[r] ? elevations[r][c] || 100 : 100;

      // Set Y position according to elevation
      posAttr.setY(i, elev * elevScale);

      // Hypsometric tinting based on real elevation
      const normElev = (elev - dem.min_elevation_m) / (dem.max_elevation_m - dem.min_elevation_m);

      let rColor = 0.25;
      let gColor = 0.35;
      let bColor = 0.22;

      if (elev < 80) {
        // Krishna riverbed sandy silt / gravel
        rColor = 0.45;
        gColor = 0.40;
        bColor = 0.32;
      } else if (elev < 140) {
        // Lower valley vegetation
        rColor = 0.28;
        gColor = 0.38;
        bColor = 0.24;
      } else if (elev < 220) {
        // Gorge rocky walls
        rColor = 0.42;
        gColor = 0.36;
        bColor = 0.28;
      } else {
        // Nallamala / Eastern ghats quartzite plateau
        rColor = 0.52;
        gColor = 0.44;
        bColor = 0.35;
      }

      colors.push(rColor, gColor, bColor);
    }

    terrainGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    terrainGeom.computeVertexNormals();

    const terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: false,
    });

    const terrainMesh = new THREE.Mesh(terrainGeom, terrainMaterial);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // ==========================================
    // 2. BUILD 3D MASONRY GRAVITY DAM MODEL
    // ==========================================
    // Nagarjuna Sagar Dam located at col 12, row 14
    const damGroup = new THREE.Group();
    const damNormX = 12 / (cols - 1) - 0.5;
    const damNormZ = 14 / (rows - 1) - 0.5;
    const damWorldX = damNormX * terrainWidth;
    const damWorldZ = damNormZ * terrainHeight;
    const damBaseElev = (elevations[14] && elevations[14][12] != null ? elevations[14][12] : 80) * elevScale;

    // Main Masonry Gravity Dam Body
    const damLength = 8.5;
    const damHeight = 124 * elevScale * 0.9;
    const damWidth = 3.5;

    const damGeom = new THREE.BoxGeometry(damWidth, damHeight, damLength);
    const damMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a929e, // Granite masonry color
      roughness: 0.7,
      metalness: 0.2,
    });
    const damBody = new THREE.Mesh(damGeom, damMaterial);
    damBody.position.set(0, damHeight / 2, 0);
    damBody.castShadow = true;
    damBody.receiveShadow = true;
    damGroup.add(damBody);

    // Dam Crest Roadway
    const crestGeom = new THREE.BoxGeometry(damWidth * 1.15, 0.4, damLength * 1.02);
    const crestMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const crest = new THREE.Mesh(crestGeom, crestMat);
    crest.position.set(0, damHeight + 0.2, 0);
    damGroup.add(crest);

    // Spillway Radial Gates (26 crest radial gates)
    const gateCount = 8;
    const gateMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.3 });
    for (let g = 0; g < gateCount; g++) {
      const gateGeom = new THREE.BoxGeometry(0.5, 2.0, (damLength * 0.6) / gateCount - 0.1);
      const gate = new THREE.Mesh(gateGeom, gateMat);
      gate.position.set(
        damWidth * 0.45,
        damHeight - 1.0,
        -damLength * 0.25 + g * ((damLength * 0.55) / gateCount)
      );
      damGroup.add(gate);
    }

    // Power House at downstream toe
    const phGeom = new THREE.BoxGeometry(3.0, 3.5, 4.0);
    const phMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });
    const powerhouse = new THREE.Mesh(phGeom, phMat);
    powerhouse.position.set(damWidth * 0.85, 1.8, -1.0);
    damGroup.add(powerhouse);

    damGroup.position.set(damWorldX, damBaseElev, damWorldZ);
    scene.add(damGroup);
    damGroupRef.current = damGroup;

    // ==========================================
    // 3. BUILD 3D DYNAMIC WATER SURFACE MESH
    // ==========================================
    const waterGeom = new THREE.PlaneGeometry(terrainWidth, terrainHeight, cols - 1, rows - 1);
    waterGeom.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      transmission: 0.65,
      opacity: 0.85,
      transparent: true,
      roughness: 0.15,
      metalness: 0.1,
      ior: 1.333, // water index of refraction
    });

    const waterMesh = new THREE.Mesh(waterGeom, waterMat);
    scene.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // Velocity vectors group
    const velocityGroup = new THREE.Group();
    scene.add(velocityGroup);
    velocityGroupRef.current = velocityGroup;

    // Infrastructure pins group
    const infraGroup = new THREE.Group();
    scene.add(infraGroup);
    infraGroupRef.current = infraGroup;

    // Position Camera initially overlooking Krishna Gorge from South-West
    updateCameraPosition();

    // Animation Loop
    let animationFrameId: number;
    let isCancelled = false;

    const animate = () => {
      if (isCancelled) return;
      animationFrameId = requestAnimationFrame(animate);

      // Subtle water shimmer
      if (waterMeshRef.current) {
        waterMeshRef.current.position.y = Math.sin(Date.now() * 0.002) * 0.03;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    setIsLoading(false);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const newW = containerRef.current.clientWidth || 800;
      const newH = containerRef.current.clientHeight || 600;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isCancelled = true;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      try {
        if (renderer) {
          renderer.dispose();
          renderer.forceContextLoss();
          if (canvasMountRef.current && renderer.domElement && canvasMountRef.current.contains(renderer.domElement)) {
            canvasMountRef.current.removeChild(renderer.domElement);
          }
        }
      } catch {
        // ignore
      }
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [dem]);

  // Update Camera based on spherical coordinates
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = cameraSphericalRef.current;
    const target = cameraTargetRef.current;

    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, Math.max(10, y), z);
    cameraRef.current.lookAt(target);
  };

  // Update Water Mesh Vertices based on current simulation frame depths
  useEffect(() => {
    if (!waterMeshRef.current || !terrainMeshRef.current || !currentFrame) return;

    const { rows, cols, elevations } = dem;
    const elevScale = 0.12;
    const waterGeom = waterMeshRef.current.geometry as THREE.PlaneGeometry;
    const posAttr = waterGeom.attributes.position;
    const colors: number[] = [];

    const depths = currentFrame.grid_depths;

    for (let i = 0; i < posAttr.count; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const groundElev = elevations[r] ? elevations[r][c] : 80;
      const depth = depths[r] ? depths[r][c] || 0 : 0;

      if (depth > 0.08) {
        // Water is present at this cell
        const waterElev = (groundElev + depth) * elevScale;
        posAttr.setY(i, waterElev + 0.15); // slightly above ground to prevent z-fighting

        // Depth color gradient: shallow cyan -> moderate blue -> deep indigo/purple
        if (depth < 1.0) {
          colors.push(0.35, 0.85, 0.95); // cyan
        } else if (depth < 3.0) {
          colors.push(0.08, 0.55, 0.92); // ocean blue
        } else if (depth < 6.0) {
          colors.push(0.12, 0.28, 0.78); // deep blue
        } else {
          colors.push(0.38, 0.12, 0.65); // catastrophic deep purple
        }
      } else {
        // Dry ground: sink water mesh below terrain
        posAttr.setY(i, -50);
        colors.push(0, 0, 0);
      }
    }

    waterGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    posAttr.needsUpdate = true;
    waterGeom.computeVertexNormals();

    // Toggle water visibility based on layers
    waterMeshRef.current.visible = layers.flood_extent || layers.water_depth;
  }, [currentFrame, dem, layers.flood_extent, layers.water_depth]);

  // Update Velocity Vectors / Streamlines
  useEffect(() => {
    if (!velocityGroupRef.current || !currentFrame) return;
    velocityGroupRef.current.clear();

    if (!layers.velocity_vectors) return;

    const { rows, cols, elevations } = dem;
    const terrainWidth = 90;
    const terrainHeight = 55;
    const elevScale = 0.12;

    const velocities = currentFrame.grid_velocities;
    const depths = currentFrame.grid_depths;

    // Subsample cells for clean legible arrow visualization
    const step = 2;
    for (let r = 1; r < rows - 1; r += step) {
      for (let c = 1; c < cols - 1; c += step) {
        const depth = depths[r] ? depths[r][c] || 0 : 0;
        if (depth <= 0.2) continue;

        const vel = velocities[r] ? velocities[r][c] : [0, 0];
        const [u, v] = vel;
        const mag = Math.hypot(u, v);
        if (mag < 0.1) continue;

        const normX = c / (cols - 1) - 0.5;
        const normZ = r / (rows - 1) - 0.5;
        const x = normX * terrainWidth;
        const z = normZ * terrainHeight;
        const groundElev = elevations[r] ? elevations[r][c] || 80 : 80;
        const y = (groundElev + depth) * elevScale + 0.4;

        // Direction in 3D: flow in X (east) and Z (south/north)
        const dir = new THREE.Vector3(u, 0, v).normalize();
        const arrowLength = Math.min(2.5, 0.6 + mag * 0.25);

        // Color based on velocity: green -> yellow -> orange -> red
        let arrowColor = 0x10b981;
        if (mag > 4.5) arrowColor = 0xe11d48;
        else if (mag > 2.5) arrowColor = 0xf59e0b;
        else if (mag > 1.2) arrowColor = 0xfacc15;

        const arrowHelper = new THREE.ArrowHelper(dir, new THREE.Vector3(x, y, z), arrowLength, arrowColor, 0.4, 0.25);
        velocityGroupRef.current.add(arrowHelper);
      }
    }
  }, [currentFrame, dem, layers.velocity_vectors]);

  // Update Infrastructure Markers
  useEffect(() => {
    if (!infraGroupRef.current) return;
    infraGroupRef.current.clear();

    const { rows, cols, min_lat, max_lat, min_lon, max_lon, elevations } = dem;
    const terrainWidth = 90;
    const terrainHeight = 55;
    const elevScale = 0.12;

    infrastructure.forEach((feat) => {
      // Visibility checks
      if (feat.type === 'village' && !layers.villages) return;
      if (feat.type === 'hospital' && !layers.hospitals) return;
      if (feat.type === 'school' && !layers.schools) return;

      const normX = (feat.lon - min_lon) / (max_lon - min_lon) - 0.5;
      const normZ = (max_lat - feat.lat) / (max_lat - min_lat) - 0.5;

      const x = normX * terrainWidth;
      const z = normZ * terrainHeight;

      const rIdx = Math.min(rows - 1, Math.max(0, Math.floor(((max_lat - feat.lat) / (max_lat - min_lat)) * rows)));
      const cIdx = Math.min(cols - 1, Math.max(0, Math.floor(((feat.lon - min_lon) / (max_lon - min_lon)) * cols)));
      const elev = elevations[rIdx] ? elevations[rIdx][cIdx] : 100;
      const y = elev * elevScale + 1.2;

      // Color based on feature type & hazard status
      let pinColor = 0xf59e0b; // village amber
      if (feat.type === 'hospital') pinColor = 0xef4444; // red
      if (feat.type === 'school') pinColor = 0x6366f1; // indigo
      if (feat.type === 'shelter') pinColor = 0x10b981; // emerald safe ground

      const pinGeom = new THREE.CylinderGeometry(0.12, 0.35, 1.8, 8);
      const pinMat = new THREE.MeshStandardMaterial({
        color: pinColor,
        metalness: 0.3,
        roughness: 0.4,
      });
      const pin = new THREE.Mesh(pinGeom, pinMat);
      pin.position.set(x, y, z);
      infraGroupRef.current?.add(pin);
    });
  }, [infrastructure, dem, layers]);

  // Update Dam Model Visibility
  useEffect(() => {
    if (damGroupRef.current) {
      damGroupRef.current.visible = layers.dam_model;
    }
  }, [layers.dam_model]);

  // Mouse Orbit, Pan, Zoom, and Click-to-Query Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left click: rotate or inspect
      isDraggingRef.current = true;
    } else if (e.button === 2) {
      // Right click: pan
      isPanningRef.current = true;
    }
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current && !isPanningRef.current) return;

    const deltaX = e.clientX - prevMouseRef.current.x;
    const deltaY = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    if (isDraggingRef.current) {
      // Orbit camera
      cameraSphericalRef.current.theta -= deltaX * 0.007;
      cameraSphericalRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI * 0.48, cameraSphericalRef.current.phi - deltaY * 0.007)
      );
      updateCameraPosition();
    } else if (isPanningRef.current) {
      // Pan camera target
      const factor = 0.08;
      const sinT = Math.sin(cameraSphericalRef.current.theta);
      const cosT = Math.cos(cameraSphericalRef.current.theta);

      cameraTargetRef.current.x -= (cosT * deltaX - sinT * deltaY) * factor;
      cameraTargetRef.current.z += (sinT * deltaX + cosT * deltaY) * factor;
      updateCameraPosition();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const moved = Math.hypot(e.clientX - prevMouseRef.current.x, e.clientY - prevMouseRef.current.y);

    // If mouse didn't drag much on left click, trigger Raycaster Inspection!
    if (isDraggingRef.current && moved < 4 && terrainMeshRef.current && cameraRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObject(terrainMeshRef.current);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const point = hit.point;

        // Convert world 3D position back to DEM row/col and Lat/Lon
        const terrainWidth = 90;
        const terrainHeight = 55;
        const { rows, cols, min_lat, max_lat, min_lon, max_lon, elevations } = dem;

        const normX = point.x / terrainWidth + 0.5;
        const normZ = point.z / terrainHeight + 0.5;

        const cIdx = Math.min(cols - 1, Math.max(0, Math.floor(normX * cols)));
        const rIdx = Math.min(rows - 1, Math.max(0, Math.floor(normZ * rows)));

        const lat = max_lat - (rIdx / (rows - 1)) * (max_lat - min_lat);
        const lon = min_lon + (cIdx / (cols - 1)) * (max_lon - min_lon);
        const elev = elevations[rIdx] ? elevations[rIdx][cIdx] || 100 : 100;

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
      }
    }

    isDraggingRef.current = false;
    isPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraSphericalRef.current.radius = Math.max(
      15,
      Math.min(180, cameraSphericalRef.current.radius + e.deltaY * 0.08)
    );
    updateCameraPosition();
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      className="w-full h-full relative cursor-grab active:cursor-grabbing select-none overflow-hidden bg-slate-950"
    >
      {/* Three.js canvas mount point - keep completely free of React children */}
      <div ref={canvasMountRef} className="w-full h-full absolute inset-0 pointer-events-none" />

      {isLoading && !webGlError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10 text-cyan-400">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Generating 3D DEM Terrain Mesh...</span>
          </div>
        </div>
      )}

      {webGlError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0c]/90 z-20 text-white p-6 text-center">
          <div className="max-w-md bg-white/5 border border-white/10 rounded-lg p-6 space-y-3 font-mono">
            <div className="text-amber-400 text-xs font-bold uppercase tracking-wider">
              3D WebGL Acceleration Notice
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed">
              Direct WebGL hardware acceleration is not active in this sandbox window. You can switch to the 2D Hydrodynamic GIS Map for full interactive flood and hazard inspection.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Help overlay */}
      <div className="absolute top-4 right-4 bg-slate-950/70 backdrop-blur-sm border border-slate-800/80 rounded-md px-3 py-1.5 text-[11px] text-slate-400 font-mono pointer-events-none flex items-center space-x-3">
        <span>Left Drag: Rotate/Orbit</span>
        <span>Right Drag: Pan</span>
        <span>Scroll: Zoom</span>
        <span className="text-cyan-400">Click Terrain: Probe Location</span>
      </div>
    </div>
  );
};
