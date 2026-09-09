export type FailureType = 'partial' | 'major' | 'complete' | 'custom' | 'piping';

export interface IndianDam {
  id: string;
  name: string;
  state: string;
  river: string;
  latitude: number;
  longitude: number;
  height_m: number;
  length_m: number;
  crest_elevation_m: number;
  full_reservoir_level_m: number;
  gross_capacity_mcm: number; // million cubic metres
  reservoir_area_sqkm: number;
  type: string;
  year_completed: number;
  is_demo: boolean;
  description: string;
  downstream_basin: string;
  bounds: {
    min_lat: number;
    max_lat: number;
    min_lon: number;
    max_lon: number;
  };
}

export interface BreachParameters {
  reservoir_water_level_m: number;
  initial_water_depth_m: number;
  breach_width_m: number;
  breach_height_m: number;
  breach_formation_time_min: number;
  breach_location: 'center' | 'left_abutment' | 'right_abutment';
  failure_type: FailureType;
  manning_n?: number;
}

export type SimulationStatus =
  | 'IDLE'
  | 'QUEUED'
  | 'PREPROCESSING'
  | 'SIMULATING'
  | 'POSTPROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export interface HydrodynamicGridPoint {
  lat: number;
  lon: number;
  x_idx: number;
  y_idx: number;
  elevation: number;
  depth: number;
  water_surface_elev: number;
  velocity_u: number;
  velocity_v: number;
  velocity_mag: number;
  arrival_time_min: number;
  risk_level: 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
}

export interface SimulationFrame {
  time_seconds: number;
  time_formatted: string;
  discharge_m3s: number;
  flooded_area_sqkm: number;
  max_depth_m: number;
  max_velocity_ms: number;
  grid_depths: number[][]; // 2D matrix of depths in metres
  grid_velocities: [number, number][][]; // [u, v]
  active_cells_count: number;
  max_stage_m?: number;
  flood_geojson?: any;
  wet_cell_count?: number;
  dry_cell_count?: number;
}

export interface SimulationMetadata {
  id: string;
  dam_id: string;
  dam_name: string;
  created_at: string;
  parameters: BreachParameters;
  peak_discharge_m3s: number;
  total_volume_mcm: number;
  total_duration_hours: number;
  time_step_min: number;
  grid_resolution_m: number;
  rows: number;
  cols: number;
  bounds: {
    min_lat: number;
    max_lat: number;
    min_lon: number;
    max_lon: number;
  };
  status: SimulationStatus;
  progress_percent: number;
  current_stage: string;
  scientific_engine: string;
  is_demo_mode: boolean;
}

export interface DEMMetadata {
  dam_id: string;
  source: string;
  resolution_m: number;
  rows: number;
  cols: number;
  min_elevation_m: number;
  max_elevation_m: number;
  min_lat: number;
  max_lat: number;
  min_lon: number;
  max_lon: number;
  elevations: number[][]; // 2D array [row][col]
}

export interface InfrastructureFeature {
  id: string;
  name: string;
  type: 'village' | 'hospital' | 'school' | 'bridge' | 'road' | 'river' | 'shelter';
  lat: number;
  lon: number;
  elevation_m: number;
  population?: number;
  distance_from_dam_km: number;
  river_bank?: 'left' | 'right' | 'center';
  // Dynamic simulation values
  water_depth_m?: number;
  arrival_time_min?: number;
  max_depth_m?: number;
  max_velocity_ms?: number;
  risk_level?: 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  evacuation_status?: 'ACCESSIBLE' | 'AT_RISK' | 'INUNDATED' | 'EVACUATED';
}

export interface ImpactStatistics {
  flooded_area_sqkm: number;
  buildings_affected: number;
  roads_affected_km: number;
  villages_inundated: number;
  hospitals_inundated: number;
  schools_inundated: number;
  bridges_inundated: number;
  population_exposed_estimate: number;
  high_risk_zone_area_sqkm: number;
}

export interface EvacuationRoute {
  id: string;
  from_village: string;
  to_shelter: string;
  distance_km: number;
  travel_time_min: number;
  status: 'SAFE' | 'CAUTION' | 'FLOODED';
  coordinates: [number, number][];
  min_clearance_elevation_m: number;
  corridor_name?: string;
  road_type?: string;
}

export interface ScenarioComparisonData {
  id: string;
  name: string;
  breach_width_m: number;
  failure_type: FailureType;
  peak_discharge_m3s: number;
  max_flooded_area_sqkm: number;
  max_depth_m: number;
  max_velocity_ms: number;
  earliest_downstream_arrival_min: number;
  villages_affected: number;
}

export interface HydrodynamicSimulationResult {
  metadata: SimulationMetadata;
  frames: SimulationFrame[];
  max_depth_grid: number[][];
  max_velocity_grid: number[][];
  arrival_time_grid: number[][];
  risk_grid: ('SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH')[][];
  impact_summary: ImpactStatistics;
  updated_infrastructure: InfrastructureFeature[];
}

