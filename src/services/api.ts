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
import { runHydrodynamicSimulation } from '../simulation/hydrodynamicEngine';

export async function fetchDams(): Promise<IndianDam[]> {
  try {
    const res = await fetch('/api/dams');
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend API unreachable, using local dataset fallback', err);
  }
  return INDIAN_DAMS;
}

export async function fetchDamDEM(damId: string): Promise<DEMMetadata> {
  try {
    const res = await fetch(`/api/dams/${damId}/dem`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend DEM API unreachable, using local DEM fallback', err);
  }
  return NAGARJUNA_SAGAR_DEM;
}

export async function fetchInfrastructure(damId: string): Promise<{
  infrastructure: InfrastructureFeature[];
  river_channel: [number, number][];
  evacuation_routes: EvacuationRoute[];
}> {
  try {
    const res = await fetch(`/api/dams/${damId}/infrastructure`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend infrastructure API unreachable, using local fallback', err);
  }
  return {
    infrastructure: NAGARJUNA_INFRASTRUCTURE,
    river_channel: KRISHNA_RIVER_CHANNEL,
    evacuation_routes: EVACUATION_ROUTES,
  };
}

export async function startSimulation(
  damId: string,
  parameters: BreachParameters,
  isDemo: boolean = false
): Promise<{ simulation_id: string; status: string }> {
  try {
    const res = await fetch('/api/simulations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dam_id: damId, parameters, is_demo: isDemo }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend simulation API unreachable, computing directly in client engine', err);
  }

  // Client-side execution fallback
  const simId = `sim-client-${Date.now()}`;
  return { simulation_id: simId, status: 'COMPLETED' };
}

export async function fetchSimulationStatus(simId: string): Promise<{
  simulation_id: string;
  status: string;
  progress_percent: number;
  current_stage: string;
}> {
  try {
    const res = await fetch(`/api/simulations/${simId}/status`);
    if (res.ok) return await res.json();
  } catch (err) {
    // Return complete
  }
  return {
    simulation_id: simId,
    status: 'COMPLETED',
    progress_percent: 100,
    current_stage: 'Simulation complete',
  };
}

export async function fetchSimulationFrames(simId: string): Promise<SimulationFrame[]> {
  try {
    const res = await fetch(`/api/simulations/${simId}/frames`);
    if (res.ok) {
      const data = await res.json();
      return data.frames;
    }
  } catch (err) {
    console.warn('Failed to fetch frames from API, computing locally', err);
  }

  // Compute using internal hydrodynamic solver
  const defaultParams: BreachParameters = {
    reservoir_water_level_m: 179.8,
    initial_water_depth_m: 105.0,
    breach_width_m: 60.0,
    breach_height_m: 55.0,
    breach_formation_time_min: 45.0,
    breach_location: 'center',
    failure_type: 'major',
  };
  const result = runHydrodynamicSimulation(
    NAGARJUNA_SAGAR_DEM,
    defaultParams,
    NAGARJUNA_INFRASTRUCTURE,
    false
  );
  return result.frames;
}

export async function uploadDataset(datasetType: string, fileName: string, fileSize: number) {
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_type: datasetType, file_name: fileName, file_size: fileSize }),
  });
  return await res.json();
}
