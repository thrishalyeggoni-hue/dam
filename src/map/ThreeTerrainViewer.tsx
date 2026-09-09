import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  DEMMetadata,
  SimulationFrame,
  HydrodynamicGridPoint,
  InfrastructureFeature,
} from '../types';
import { LayerVisibility } from '../components/LayersPanel';
import { getHydraulicCellColor, HydraulicLayerMode } from '../utils/hydraulicScale';

interface ThreeTerrainViewerProps {
  dem: DEMMetadata;
  currentFrame?: SimulationFrame;
  maxDepthGrid?: number[][];
  maxVelocityGrid?: number[][];
  arrivalTimeGrid?: number[][];
  riskGrid?: ('SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH')[][];
  infrastructure: InfrastructureFeature[];
  layers: LayerVisibility;
  activeHydraulicLayer?: HydraulicLayerMode;
  onSelectPoint: (point: HydrodynamicGridPoint) => void;
}

// Helper to generate crisp billboard textures with dedicated symbols
function create3DIconTexture(type: string, isFlooded: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);

    let bg = '#f59e0b';
    if (type === 'hospital') bg = '#dc2626';
    else if (type === 'school') bg = '#4f46e5';
    else if (type === 'bridge') bg = '#0284c7';
    else if (type === 'shelter') bg = '#059669';
    else if (isFlooded) bg = '#ef4444';

    // Outer circle
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Draw high-contrast white symbol inside
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'hospital') {
      // Red Cross
      ctx.fillRect(52, 28, 24, 72);
      ctx.fillRect(28, 52, 72, 24);
    } else if (type === 'school') {
      // Graduation Cap / School
      ctx.beginPath();
      ctx.moveTo(64, 38);
      ctx.lineTo(100, 56);
      ctx.lineTo(64, 74);
      ctx.lineTo(28, 56);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(64, 78, 24, 0, Math.PI);
      ctx.stroke();
    } else if (type === 'bridge') {
      // Bridge Arch
      ctx.beginPath();
      ctx.arc(64, 78, 28, Math.PI, 0);
      ctx.stroke();
      ctx.strokeRect(32, 48, 64, 6);
    } else if (type === 'shelter') {
      // Shield
      ctx.beginPath();
      ctx.moveTo(64, 30);
      ctx.lineTo(92, 44);
      ctx.lineTo(92, 72);
      ctx.quadraticCurveTo(92, 94, 64, 102);
      ctx.quadraticCurveTo(36, 94, 36, 72);
      ctx.lineTo(36, 44);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(52, 66);
      ctx.lineTo(60, 74);
      ctx.lineTo(76, 54);
      ctx.stroke();
    } else {
      // Village House
      ctx.beginPath();
      ctx.moveTo(64, 32);
      ctx.lineTo(96, 60);
      ctx.lineTo(84, 60);
      ctx.lineTo(84, 94);
      ctx.lineTo(44, 94);
      ctx.lineTo(44, 60);
      ctx.lineTo(32, 60);
      ctx.closePath();
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
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
  activeHydraulicLayer = 'depth',
  onSelectPoint,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const waterGroupRef = useRef<THREE.Group | null>(null);
  const damGroupRef = useRef<THREE.Group | null>(null);
  const infraGroupRef = useRef<THREE.Group | null>(null);
  const fluidMeshRef = useRef<THREE.Mesh | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [webGlError, setWebGlError] = useState<string | null>(null);

  // Downstream fluid geometry animation state arrays
  const fluidStateRef = useRef<{
    bedHeights: Float32Array;
    currentHeights: Float32Array;
    targetHeights: Float32Array;
    currentColors: Float32Array;
    targetColors: Float32Array;
    downCols: number;
    downRows: number;
    damCol: number;
  } | null>(null);

  // 3D Scene Geometry Dimensions
  const terrainWidth = 100;
  const terrainHeight = 65;

  const { min_elevation_m, max_elevation_m, rows, cols, elevations } = dem;
  const minElev = min_elevation_m;
  const maxElev = max_elevation_m;
  const elevRange = Math.max(20, maxElev - minElev);
  const verticalScale = 14.0 / elevRange;

  // 1. Initial 3D Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setWebGlError(null);

    const width = Math.max(100, container.clientWidth || 800);
    const height = Math.max(100, container.clientHeight || 600);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.0028);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 1200);
    camera.position.set(-20, 42, 60);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
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

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = false;
    controls.minDistance = 15;
    controls.maxDistance = 180;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.target.set(0, 3.5, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.92);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.45);
    sunLight.position.set(45, 85, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const skyFill = new THREE.DirectionalLight(0xbfdbfe, 0.45);
    skyFill.position.set(-35, 30, -35);
    scene.add(skyFill);

    // ==========================================
    // 2. BUILD CONTINUOUS 3D RELIEF TERRAIN
    // ==========================================
    const terrainGeom = new THREE.PlaneGeometry(
      terrainWidth,
      terrainHeight,
      cols - 1,
      rows - 1
    );
    terrainGeom.rotateX(-Math.PI / 2);

    const posAttr = terrainGeom.attributes.position;
    const terrainColors: number[] = [];

    for (let i = 0; i < posAttr.count; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const rawElev = elevations[r] ? elevations[r][c] || minElev : minElev;
      const normH = Math.max(0, rawElev - minElev);
      const y = normH * verticalScale;

      posAttr.setY(i, y);

      const t = normH / elevRange;
      if (t < 0.22) {
        terrainColors.push(0.35, 0.52, 0.32); // Valley Floor Green
      } else if (t < 0.55) {
        terrainColors.push(0.58, 0.65, 0.42); // Highland Slope
      } else if (t < 0.82) {
        terrainColors.push(0.55, 0.48, 0.42); // Escarpment Rock
      } else {
        terrainColors.push(0.72, 0.70, 0.68); // Ridge Crest Stone
      }
    }

    terrainGeom.computeVertexNormals();
    terrainGeom.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(terrainColors, 3)
    );

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: false,
    });

    const terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // Pedestal Base Slab
    const baseSlabGeom = new THREE.BoxGeometry(terrainWidth + 1.2, 2.5, terrainHeight + 1.2);
    const baseSlabMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
    const baseSlab = new THREE.Mesh(baseSlabGeom, baseSlabMat);
    baseSlab.position.set(0, -1.25, 0);
    scene.add(baseSlab);

    // ==========================================
    // 3. BUILD ARCHITECTURAL 3D DAM
    // ==========================================
    const damGroup = new THREE.Group();
    const damCol = Math.floor(cols * 0.22);
    const damRow = Math.floor(rows / 2);
    const normX = damCol / (cols - 1) - 0.5;
    const normZ = damRow / (rows - 1) - 0.5;
    const damWorldX = normX * terrainWidth;
    const damWorldZ = normZ * terrainHeight;

    const rawDamBase = elevations[damRow] ? elevations[damRow][damCol] || minElev : minElev;
    const damBaseY = (rawDamBase - minElev) * verticalScale;
    const damSpan = 15.5;
    const damHeight3D = Math.max(5.5, elevRange * 0.72 * verticalScale);
    const damThickness = 4.5;

    // Concrete Dam Body
    const damGeom = new THREE.BoxGeometry(damThickness, damHeight3D, damSpan);
    const damMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.65,
      metalness: 0.15,
    });
    const damBody = new THREE.Mesh(damGeom, damMat);
    damBody.position.set(0, damHeight3D / 2, 0);
    damBody.castShadow = true;
    damBody.receiveShadow = true;
    damGroup.add(damBody);

    // Crest Roadway
    const crestGeom = new THREE.BoxGeometry(damThickness * 1.15, 0.45, damSpan * 1.02);
    const crestMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const crestRoad = new THREE.Mesh(crestGeom, crestMat);
    crestRoad.position.set(0, damHeight3D + 0.22, 0);
    damGroup.add(crestRoad);

    // Radial Spillway Crest Gates
    const gateCount = 8;
    const gateMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.4, roughness: 0.3 });
    const spillwaySpan = damSpan * 0.62;
    for (let g = 0; g < gateCount; g++) {
      const gateGeom = new THREE.BoxGeometry(0.55, 2.2, spillwaySpan / gateCount - 0.15);
      const gate = new THREE.Mesh(gateGeom, gateMat);
      gate.position.set(
        damThickness * 0.52,
        damHeight3D - 1.1,
        -spillwaySpan * 0.5 + (g + 0.5) * (spillwaySpan / gateCount)
      );
      damGroup.add(gate);
    }

    // Powerhouse Building at Toe
    const phGeom = new THREE.BoxGeometry(3.6, 2.8, 5.5);
    const phMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });
    const powerhouse = new THREE.Mesh(phGeom, phMat);
    powerhouse.position.set(damThickness * 0.95, 1.4, -1.8);
    powerhouse.castShadow = true;
    damGroup.add(powerhouse);

    damGroup.position.set(damWorldX, damBaseY, damWorldZ);
    scene.add(damGroup);
    damGroupRef.current = damGroup;

    // ==========================================
    // 4. PERSISTENT CONTINUOUS 3D FLUID WATER SYSTEM
    // ==========================================
    const waterGroup = new THREE.Group();
    scene.add(waterGroup);
    waterGroupRef.current = waterGroup;

    // A. Upstream Calm Reservoir Water Lake
    const upCols = damCol + 1;
    const upGeom = new THREE.PlaneGeometry(
      (upCols / (cols - 1)) * terrainWidth,
      terrainHeight,
      upCols - 1,
      rows - 1
    );
    upGeom.rotateX(-Math.PI / 2);

    const resLevel = dem.elevations[damRow]?.[damCol] || minElev + elevRange * 0.75;
    const resY = (resLevel - minElev) * verticalScale + 0.15;
    const upPos = upGeom.attributes.position;
    for (let i = 0; i < upPos.count; i++) {
      upPos.setY(i, resY);
    }
    upGeom.computeVertexNormals();

    const upMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transmission: 0.55,
      opacity: 0.92,
      transparent: true,
      roughness: 0.08,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      ior: 1.333,
    });
    const upMesh = new THREE.Mesh(upGeom, upMat);
    const upCenterX = ((damCol / 2) / (cols - 1) - 0.5) * terrainWidth;
    upMesh.position.set(upCenterX, 0, 0);
    waterGroup.add(upMesh);

    // B. Downstream Continuous Fluid Surface Mesh (Zero Z-Fighting, Smooth Curves)
    const downCols = cols - damCol;
    const downRows = rows;
    const downWidth = (downCols / (cols - 1)) * terrainWidth;

    const fluidGeom = new THREE.PlaneGeometry(
      downWidth,
      terrainHeight,
      downCols - 1,
      downRows - 1
    );
    fluidGeom.rotateX(-Math.PI / 2);

    const vertCount = fluidGeom.attributes.position.count;
    const bedHeights = new Float32Array(vertCount);
    const currentHeights = new Float32Array(vertCount);
    const targetHeights = new Float32Array(vertCount);
    const currentColors = new Float32Array(vertCount * 3);
    const targetColors = new Float32Array(vertCount * 3);

    for (let i = 0; i < vertCount; i++) {
      const cSub = i % downCols;
      const rSub = Math.floor(i / downCols);
      const c = damCol + cSub;
      const r = rSub;

      const gElev = elevations[r]?.[c] || minElev;
      const bH = (gElev - minElev) * verticalScale;
      bedHeights[i] = bH;
      currentHeights[i] = bH - 0.35; // Tucked below ground initially
      targetHeights[i] = bH - 0.35;

      // Default calm riverbed color
      currentColors[i * 3] = 0.22;
      currentColors[i * 3 + 1] = 0.74;
      currentColors[i * 3 + 2] = 0.97;
      targetColors[i * 3] = 0.22;
      targetColors[i * 3 + 1] = 0.74;
      targetColors[i * 3 + 2] = 0.97;
    }

    fluidGeom.setAttribute('color', new THREE.Float32BufferAttribute(currentColors, 3));
    fluidGeom.computeVertexNormals();

    const fluidMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      transmission: 0.35,
      opacity: 0.94,
      transparent: true,
      roughness: 0.06,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      ior: 1.333,
      emissive: new THREE.Color(0x0070c0),
      emissiveIntensity: 0.12,   // Subtle blue-glow so water stands out on terrain
    });

    const fluidMesh = new THREE.Mesh(fluidGeom, fluidMat);
    const downCenterX = ((damCol + downCols / 2) / (cols - 1) - 0.5) * terrainWidth;
    fluidMesh.position.set(downCenterX, 0, 0);
    fluidMesh.castShadow = true;
    fluidMesh.receiveShadow = true;
    waterGroup.add(fluidMesh);
    fluidMeshRef.current = fluidMesh;

    fluidStateRef.current = {
      bedHeights,
      currentHeights,
      targetHeights,
      currentColors,
      targetColors,
      downCols,
      downRows,
      damCol,
    };

    // Infrastructure pins group
    const infraGroup = new THREE.Group();
    scene.add(infraGroup);
    infraGroupRef.current = infraGroup;

    // ==========================================
    // 5. ANIMATION LOOP (Smooth 60 FPS Fluid Wave Propagation)
    // ==========================================
    let animationFrameId: number;
    let isCancelled = false;
    let clock = new THREE.Clock();

    const animate = () => {
      if (isCancelled) return;
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Fluid Wave Dynamics & Smooth Interpolation
      if (fluidStateRef.current && fluidMeshRef.current) {
        const { bedHeights, currentHeights, targetHeights, currentColors, targetColors } =
          fluidStateRef.current;
        const geom = fluidMeshRef.current.geometry;
        const pos = geom.attributes.position;
        const colAttr = geom.attributes.color;

        let needsNormalUpdate = false;

        for (let i = 0; i < pos.count; i++) {
          // Smooth temporal lerp towards target simulation frame
          currentHeights[i] += (targetHeights[i] - currentHeights[i]) * 0.16;
          currentColors[i * 3] += (targetColors[i * 3] - currentColors[i * 3]) * 0.18;
          currentColors[i * 3 + 1] += (targetColors[i * 3 + 1] - currentColors[i * 3 + 1]) * 0.18;
          currentColors[i * 3 + 2] += (targetColors[i * 3 + 2] - currentColors[i * 3 + 2]) * 0.18;

          const bH = bedHeights[i];
          const curH = currentHeights[i];

          if (curH > bH) {
            // Cell is flooded: apply dynamic longitudinal traveling liquid wave swell
            const px = pos.getX(i);
            const pz = pos.getZ(i);
            const swell =
              Math.sin(px * 0.42 - elapsedTime * 3.8) *
              Math.cos(pz * 0.42 - elapsedTime * 2.6) *
              0.10 +
              Math.sin((px + pz) * 0.7 - elapsedTime * 4.5) * 0.05;

            pos.setY(i, curH + swell);
            needsNormalUpdate = true;
          } else {
            // Cell is dry: keep hidden 0.4 units below ground terrain
            pos.setY(i, bH - 0.40);
          }
        }

        pos.needsUpdate = true;
        colAttr.needsUpdate = true;

        if (needsNormalUpdate) {
          geom.computeVertexNormals();
        }
      }

      // Floating gentle bobbing for 3D infrastructure icons
      if (infraGroupRef.current && infraGroupRef.current.children.length > 0) {
        infraGroupRef.current.children.forEach((child, idx) => {
          const sprite = child.getObjectByName('infra-sprite');
          if (sprite) {
            sprite.position.y = 3.6 + Math.sin(elapsedTime * 2.8 + idx) * 0.25;
          }
        });
      }

      if (controlsRef.current) {
        controlsRef.current.update();
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
        controls.dispose();
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
      controlsRef.current = null;
    };
  }, [dem]);

  // ========================================================================
  // 6. UPDATE FLUID WAVE SIMULATION STAGES & HYDRAULIC SCALE COLORING
  // ========================================================================
  useEffect(() => {
    if (!fluidStateRef.current || !currentFrame) return;

    const { bedHeights, targetHeights, targetColors, downCols, damCol } = fluidStateRef.current;
    const depths = currentFrame.grid_depths;
    const velocities = currentFrame.grid_velocities;

    const isVisible = layers.flood_extent || layers.water_depth;

    for (let r = 0; r < rows; r++) {
      for (let cSub = 0; cSub < downCols; cSub++) {
        const i = r * downCols + cSub;
        const c = damCol + cSub;
        const bH = bedHeights[i];

        const d = isVisible && depths[r] ? depths[r][c] || 0 : 0;
        const vel = velocities[r]?.[c] || [0, 0];
        const velMag = Math.hypot(vel[0], vel[1]);

        if (d > 0.05) {
          // Flooded vertex: target height = terrain bed + guaranteed visible height above ground
          // Min of 0.55 world-units ensures even 0.05m floods are clearly visible in 3D.
          const visHeight = Math.max(0.55, d * verticalScale * 2.2);
          targetHeights[i] = bH + visHeight;

          const arrTime = arrivalTimeGrid?.[r]?.[c] ?? -1;
          const hazard = d * velMag;
          const colorResult = getHydraulicCellColor(activeHydraulicLayer, {
            depth: d,
            velocity: velMag,
            hazard,
            arrivalTimeMin: arrTime,
          });

          const colorHex = colorResult.threeColor;
          let cr = ((colorHex >> 16) & 0xff) / 255.0;
          let cg = ((colorHex >> 8) & 0xff) / 255.0;
          let cb = (colorHex & 0xff) / 255.0;

          // Dynamic White Foam for Rapids & Wave Front (in depth mode)
          if (velMag > 3.0 && activeHydraulicLayer === 'depth') {
            cr = Math.min(1.0, cr + 0.35);
            cg = Math.min(1.0, cg + 0.35);
            cb = Math.min(1.0, cb + 0.35);
          }

          targetColors[i * 3] = cr;
          targetColors[i * 3 + 1] = cg;
          targetColors[i * 3 + 2] = cb;
        } else {
          // Dry vertex: target height stays tucked under ground
          targetHeights[i] = bH - 0.35;
          targetColors[i * 3] = 0.0;
          targetColors[i * 3 + 1] = 0.0;
          targetColors[i * 3 + 2] = 0.0;
        }
      }
    }
  }, [currentFrame, layers.flood_extent, layers.water_depth, rows, verticalScale, activeHydraulicLayer, arrivalTimeGrid]);

  // ========================================================================
  // 7. INFRASTRUCTURE 3D PINS WITH DISTINCT BILLBOARD SYMBOLS
  // ========================================================================
  useEffect(() => {
    if (!infraGroupRef.current) return;
    infraGroupRef.current.clear();

    infrastructure.forEach((feat) => {
      if (feat.type === 'village' && !layers.villages) return;
      if (feat.type === 'hospital' && !layers.hospitals) return;
      if (feat.type === 'school' && !layers.schools) return;
      if (feat.type === 'bridge' && !layers.roads) return;
      if (feat.type === 'shelter' && !layers.evacuation_routes) return;

      const normX = (feat.lon - dem.min_lon) / (dem.max_lon - dem.min_lon) - 0.5;
      const normZ = (dem.max_lat - feat.lat) / (dem.max_lat - dem.min_lat) - 0.5;

      const x = normX * terrainWidth;
      const z = normZ * terrainHeight;

      const cIdx = Math.min(cols - 1, Math.max(0, Math.floor(((feat.lon - dem.min_lon) / (dem.max_lon - dem.min_lon)) * cols)));
      const rIdx = Math.min(rows - 1, Math.max(0, Math.floor(((dem.max_lat - feat.lat) / (dem.max_lat - dem.min_lat)) * rows)));
      const groundElev = elevations[rIdx] ? elevations[rIdx][cIdx] || minElev : minElev;
      const y = (groundElev - minElev) * verticalScale;

      const pinGroup = new THREE.Group();
      pinGroup.position.set(x, y, z);

      const isFlooded = Boolean(feat.water_depth_m && feat.water_depth_m > 0.25);
      let pinColor = 0xf59e0b; // amber
      if (feat.type === 'shelter') pinColor = 0x10b981; // green
      else if (feat.type === 'hospital') pinColor = 0xdc2626; // red
      else if (feat.type === 'school') pinColor = 0x4f46e5; // indigo
      else if (feat.type === 'bridge') pinColor = 0x0284c7; // cyan
      else if (isFlooded) pinColor = 0xef4444; // red pulse

      // 3D Pin Post Pole
      const poleGeom = new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8);
      const poleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(0, 1.6, 0);
      pinGroup.add(pole);

      // Ground Contact Target Ring
      const ringGeom = new THREE.RingGeometry(0.65, 1.1, 24);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(0, 0.04, 0);
      pinGroup.add(ring);

      // Floating Billboard Sprite with Dedicated High-Res Symbol
      const iconTexture = create3DIconTexture(feat.type, isFlooded);
      const spriteMat = new THREE.SpriteMaterial({
        map: iconTexture,
        depthTest: false,
        transparent: true,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.name = 'infra-sprite';
      sprite.scale.set(3.4, 3.4, 1);
      sprite.position.set(0, 3.6, 0);
      pinGroup.add(sprite);

      infraGroupRef.current?.add(pinGroup);
    });
  }, [infrastructure, dem, layers]);

  // Click Raycaster on 3D Terrain for Point Inspection
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const container = containerRef.current;
    const camera = cameraRef.current;
    const terrain = terrainMeshRef.current;
    if (!container || !camera || !terrain) return;

    const startX = e.clientX;
    const startY = e.clientY;

    const handlePointerUp = (upEv: PointerEvent) => {
      window.removeEventListener('pointerup', handlePointerUp);
      const distMoved = Math.hypot(upEv.clientX - startX, upEv.clientY - startY);
      if (distMoved > 5) return;

      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((upEv.clientX - rect.left) / rect.width) * 2 - 1,
        -((upEv.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(terrain);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const normX = point.x / terrainWidth + 0.5;
        const normZ = point.z / terrainHeight + 0.5;

        const cIdx = Math.min(cols - 1, Math.max(0, Math.floor(normX * cols)));
        const rIdx = Math.min(rows - 1, Math.max(0, Math.floor(normZ * rows)));

        const lat = dem.max_lat - (rIdx / (rows - 1)) * (dem.max_lat - dem.min_lat);
        const lon = dem.min_lon + (cIdx / (cols - 1)) * (dem.max_lon - dem.min_lon);
        const elev = elevations[rIdx] ? elevations[rIdx][cIdx] || minElev : minElev;

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
    };

    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="w-full h-full relative cursor-grab active:cursor-grabbing select-none overflow-hidden bg-slate-100"
    >
      <div ref={canvasMountRef} className="w-full h-full absolute inset-0" />

      {isLoading && !webGlError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 text-blue-600">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-slate-700">Rendering 3D Architectural Model...</span>
          </div>
        </div>
      )}

      {webGlError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-20 text-slate-800 p-6 text-center">
          <div className="max-w-md bg-white border border-slate-200 rounded-lg p-6 space-y-3 shadow-lg">
            <div className="text-amber-600 text-xs font-bold uppercase tracking-wider">
              3D Graphics Acceleration Notice
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              3D WebGL acceleration is unavailable in this environment. Switch to 2D Map for the full interactive GIS model.
            </p>
          </div>
        </div>
      )}

      {/* Camera Guidance Overlay */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 shadow-sm pointer-events-none flex items-center space-x-3">
        <span>Orbit: Left Drag</span>
        <span>Pan: Right Drag</span>
        <span>Zoom: Scroll</span>
        <span className="text-blue-600 font-semibold">Click: Inspect Spot</span>
      </div>
    </div>
  );
};
