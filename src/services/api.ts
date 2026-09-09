/**
 * api.ts — Frontend API service
 *
 * Architecture:
 *   1. Try the ANUGA FastAPI backend (localhost:8000) first.
 *   2. If backend unreachable → fall back to legacy TypeScript engine.
 *   3. ALWAYS set isDemoMode=true when using the legacy engine.
 *   4. DemoModeBanner must be shown when isDemoMode=true.
 *
 * The backend returns scientifically computed results from the ANUGA solver.
 * The legacy fallback returns PROCEDURALLY GENERATED data (NOT physics-based).
 */

import {
  IndianDam,
  DEMMetadata,
  BreachParameters,
  SimulationMetadata,
  SimulationFrame,
  HydrodynamicSimulationResult,
  ImpactStatistics,
  InfrastructureFeature,
  EvacuationRoute,
} from '../types';
import { INDIAN_DAMS } from '../data/indianDams';
import { NAGARJUNA_SAGAR_DEM } from '../data/nagarjunaSagarDEM';
import {
  NAGARJUNA_INFRASTRUCTURE,
  EVACUATION_ROUTES,
  KRISHNA_RIVER_CHANNEL,
} from '../data/nagarjunaSagarInfrastructure';
import { runHydrodynamicSimulation, IS_DEMO_MODE as LEGACY_IS_DEMO } from '../simulation/hydrodynamicEngine';

// ────────────────────────────────────────────────────────────────────────── //
// Backend URL — FastAPI + ANUGA Python backend
// ────────────────────────────────────────────────────────────────────────── //
const BACKEND_URL = 'http://localhost:8000';

/** True while the last health check succeeded */
let _backendOnline = false;
let _backendChecked = false;

async function checkBackend(): Promise<boolean> {
  if (_backendChecked) return _backendOnline;
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });
    _backendOnline = res.ok;
  } catch {
    _backendOnline = false;
  }
  _backendChecked = true;
  if (!_backendOnline) {
    console.warn(
      '⚠️  ANUGA backend unreachable at ' + BACKEND_URL + '\n' +
      '   Falling back to DEMO (procedural) engine.\n' +
      '   Start the backend:  cd backend && bash run.sh'
    );
  }
  return _backendOnline;
}

// Reset cached state so new calls re-check (useful after a simulation starts)
export function resetBackendCache() {
  _backendChecked = false;
}

// ────────────────────────────────────────────────────────────────────────── //
// Public API functions
// ────────────────────────────────────────────────────────────────────────── //

export async function fetchDams(): Promise<IndianDam[]> {
  const online = await checkBackend();
  if (online) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/dams`);
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
  }
  return INDIAN_DAMS;
}

export async function fetchDamDEM(damId: string): Promise<DEMMetadata> {
  // The DEM grid is served by the legacy module for 2D/3D map rendering.
  // The backend returns the raw grid via simulation frames.
  return NAGARJUNA_SAGAR_DEM;
}

export async function fetchInfrastructure(damId: string): Promise<{
  infrastructure: InfrastructureFeature[];
  river_channel: [number, number][];
  evacuation_routes: EvacuationRoute[];
}> {
  const online = await checkBackend();
  if (online) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/dams/${damId}/infrastructure`);
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
  }
  return {
    infrastructure: NAGARJUNA_INFRASTRUCTURE,
    river_channel: KRISHNA_RIVER_CHANNEL,
    evacuation_routes: EVACUATION_ROUTES,
  };
}

// ────────────────────────────────────────────────────────────────────────── //
// Simulation lifecycle
// ────────────────────────────────────────────────────────────────────────── //

export interface SimulationStartResult {
  simulation_id: string;
  status: string;
  is_demo: boolean;
}

/**
 * Start a simulation on the ANUGA backend.
 * Returns simulation_id and whether it is running in demo mode.
 * If backend is offline, falls back to a client-side ID (demo mode).
 */
export async function startSimulation(
  damId: string,
  parameters: BreachParameters,
  isDemo: boolean = false
): Promise<SimulationStartResult> {
  resetBackendCache();
  const online = await checkBackend();

  if (online) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/simulations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dam_id: damId,
          parameters: {
            ...parameters,
            dam_crest_elevation_m: 179.83,
            dam_toe_elevation_m: 74.0,
          },
          is_demo: isDemo,
          yield_step_s: 60,    // 1-minute frames
          final_time_s: 10800, // 3-hour simulation
          decimation: 2,       // 100m grid (fast for demo)
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          simulation_id: data.simulation_id,
          status: data.status,
          is_demo: false, // backend will set is_demo based on DEM tag
        };
      }
    } catch { /* fall through */ }
  }

  // Backend offline — generate a client-side legacy simulation ID
  const simId = `demo-client-${Date.now()}`;
  return { simulation_id: simId, status: 'COMPLETED', is_demo: true };
}

export interface SimulationStatusResult {
  simulation_id: string;
  status: string;
  progress_percent: number;
  current_stage: string;
  is_demo: boolean;
}

export async function fetchSimulationStatus(simId: string): Promise<SimulationStatusResult> {
  if (simId.startsWith('demo-client-')) {
    return {
      simulation_id: simId,
      status: 'COMPLETED',
      progress_percent: 100,
      current_stage: '⚠️ DEMO DATA — ANUGA backend offline',
      is_demo: true,
    };
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/simulations/${simId}/status`);
    if (res.ok) return await res.json();
  } catch { /* fall through */ }
  return {
    simulation_id: simId,
    status: 'COMPLETED',
    progress_percent: 100,
    current_stage: 'Status unavailable',
    is_demo: true,
  };
}

// ────────────────────────────────────────────────────────────────────────── //
// Full simulation result (frames + grids + metadata)
// ────────────────────────────────────────────────────────────────────────── //

/**
 * Fetch the complete simulation result.
 * - If backend: calls /frames, /max-depth, /arrival-time, /velocity, /impact, /diagnostics
 * - If demo: uses legacy TypeScript engine
 *
 * Returns HydrodynamicSimulationResult (same shape as before) PLUS:
 *   metadata.is_demo_mode: boolean
 *   diagnostics?: object (scientific debug panel)
 */
export async function fetchSimulationResult(
  simId: string,
  dem: DEMMetadata,
  parameters: BreachParameters,
  infrastructure: InfrastructureFeature[]
): Promise<HydrodynamicSimulationResult & { is_demo: boolean; diagnostics?: Record<string, unknown> }> {

  // Demo / offline path
  if (simId.startsWith('demo-client-')) {
    const result = runHydrodynamicSimulation(dem, parameters, infrastructure);
    return { ...result, is_demo: true, diagnostics: undefined };
  }

  // Poll until COMPLETED (caller should call this after status=COMPLETED)
  try {
    const [framesRes, maxDepthRes, arrivalRes, velocityRes, impactRes, diagRes, metaRes] =
      await Promise.all([
        fetch(`${BACKEND_URL}/api/simulations/${simId}/frames`),
        fetch(`${BACKEND_URL}/api/simulations/${simId}/max-depth`),
        fetch(`${BACKEND_URL}/api/simulations/${simId}/arrival-time`),
        fetch(`${BACKEND_URL}/api/simulations/${simId}/velocity`),
        fetch(`${BACKEND_URL}/api/simulations/${simId}/impact`),
        fetch(`${BACKEND_URL}/api/simulations/${simId}/diagnostics`),
        fetch(`${BACKEND_URL}/api/simulations/${simId}/metadata`),
      ]);

    if (
      framesRes.ok && maxDepthRes.ok && arrivalRes.ok &&
      velocityRes.ok && impactRes.ok && metaRes.ok
    ) {
      const framesData    = await framesRes.json();
      const maxDepthData  = await maxDepthRes.json();
      const arrivalData   = await arrivalRes.json();
      const velocityData  = await velocityRes.json();
      const impactData    = await impactRes.json();
      const diagnostics   = diagRes.ok ? await diagRes.json() : undefined;
      const metadata      = await metaRes.json();

      // Map arrival_grid_min to arrivalTimeGrid (in minutes → keep as-is)
      const arrivalGrid: number[][] = arrivalData.arrival_grid_min;

      // Build risk grid from max_depth + max_vel
      const riskGrid = buildRiskGridFromGrids(
        maxDepthData.max_depth_grid,
        velocityData.max_vel_grid
      );

      // Remap frames to TypeScript SimulationFrame shape
      const frames: SimulationFrame[] = framesData.frames.map((f: Record<string, unknown>) => ({
        time_seconds:       f.time_seconds,
        time_formatted:     f.time_formatted,
        discharge_m3s:      f.discharge_m3s,
        max_depth_m:        f.max_depth_m,
        max_velocity_ms:    f.max_velocity_ms,
        flooded_area_sqkm:  f.flooded_area_sqkm,
        active_cells_count: f.wet_cell_count,
        grid_depths:        f.grid_depths,
        grid_velocities:    f.grid_velocities,
        // Extra fields for frontend flood polygon (GeoJSON-based)
        flood_geojson:      f.flood_geojson,
        wet_cell_count:     f.wet_cell_count,
        dry_cell_count:     f.dry_cell_count,
      }));

      const isDemo = impactData.is_demo || metadata.is_demo_mode || false;

      return {
        metadata: {
          ...metadata,
          is_demo_mode: isDemo,
        },
        frames,
        max_depth_grid:  maxDepthData.max_depth_grid,
        max_velocity_grid: velocityData.max_vel_grid,
        arrival_time_grid: arrivalGrid,
        risk_grid:         riskGrid,
        impact_summary:    impactData.impact_summary,
        updated_infrastructure: impactData.updated_infra,
        is_demo: isDemo,
        diagnostics,
      };
    }
  } catch (err) {
    console.error('Failed to fetch simulation result from backend:', err);
  }

  // Final fallback to legacy engine
  console.warn('⚠️ Falling back to DEMO legacy engine.');
  const result = runHydrodynamicSimulation(dem, parameters, infrastructure);
  return { ...result, is_demo: true, diagnostics: undefined };
}

// ────────────────────────────────────────────────────────────────────────── //
// Helper: build risk grid from max depth and velocity grids
// ────────────────────────────────────────────────────────────────────────── //
function buildRiskGridFromGrids(
  depthGrid: number[][],
  velGrid: number[][]
): ('SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH')[][] {
  return depthGrid.map((row, r) =>
    row.map((h, c) => {
      const v = velGrid[r]?.[c] ?? 0;
      if (h < 0.1) return 'SAFE';
      const hi = h * v;
      if (hi < 0.3) return 'LOW';
      if (hi < 0.6) return 'MODERATE';
      if (hi < 1.2) return 'HIGH';
      return 'VERY_HIGH';
    })
  );
}

export async function uploadDataset(datasetType: string, fileName: string, fileSize: number) {
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_type: datasetType, file_name: fileName, file_size: fileSize }),
  });
  return await res.json();
}
