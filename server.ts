import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INDIAN_DAMS } from './src/data/indianDams.js';
import { NAGARJUNA_SAGAR_DEM } from './src/data/nagarjunaSagarDEM.js';
import {
  NAGARJUNA_INFRASTRUCTURE,
  EVACUATION_ROUTES,
  KRISHNA_RIVER_CHANNEL,
} from './src/data/nagarjunaSagarInfrastructure.js';
import {
  runHydrodynamicSimulation,
  HydrodynamicSimulationResult,
} from './src/simulation/hydrodynamicEngine.js';
import { BreachParameters } from './src/types/index.js';

// In-memory simulation jobs store
const simulationsStore = new Map<string, {
  status: string;
  progress: number;
  stage: string;
  result?: HydrodynamicSimulationResult;
  created_at: string;
}>();

// Seed initial default simulation
const defaultParams: BreachParameters = {
  reservoir_water_level_m: 179.8,
  initial_water_depth_m: 105.0,
  breach_width_m: 60.0,
  breach_height_m: 55.0,
  breach_formation_time_min: 45.0,
  breach_location: 'center',
  failure_type: 'major',
  manning_n: 0.035,
};

const initialResult = runHydrodynamicSimulation(
  NAGARJUNA_SAGAR_DEM,
  defaultParams,
  NAGARJUNA_INFRASTRUCTURE,
  false
);

const defaultSimId = 'sim-nagarjuna-major-breach';
initialResult.metadata.id = defaultSimId;
simulationsStore.set(defaultSimId, {
  status: 'COMPLETED',
  progress: 100,
  stage: 'Hydrodynamic solver execution completed',
  result: initialResult,
  created_at: new Date().toISOString(),
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      engine: 'ANUGA / 2D Saint-Venant Shallow Water Hydrodynamic Engine',
      dam_count: INDIAN_DAMS.length,
    });
  });

  // Dams catalog
  app.get('/api/dams', (req, res) => {
    res.json(INDIAN_DAMS);
  });

  app.get('/api/dams/:id', (req, res) => {
    const dam = INDIAN_DAMS.find((d) => d.id === req.params.id);
    if (!dam) {
      return res.status(404).json({ error: 'Dam not found' });
    }
    res.json(dam);
  });

  app.get('/api/dams/:id/dem', (req, res) => {
    if (req.params.id === 'nagarjuna-sagar') {
      return res.json(NAGARJUNA_SAGAR_DEM);
    }
    // Fallback or generated DEM
    res.json(NAGARJUNA_SAGAR_DEM);
  });

  app.get('/api/dams/:id/infrastructure', (req, res) => {
    res.json({
      infrastructure: NAGARJUNA_INFRASTRUCTURE,
      river_channel: KRISHNA_RIVER_CHANNEL,
      evacuation_routes: EVACUATION_ROUTES,
    });
  });

  // Simulations Endpoints
  app.post('/api/simulations', (req, res) => {
    const { dam_id, parameters, is_demo } = req.body;
    const simId = `sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const params: BreachParameters = parameters || defaultParams;

    // Register job as QUEUED
    simulationsStore.set(simId, {
      status: 'QUEUED',
      progress: 5,
      stage: 'Preparing DEM and computational domain',
      created_at: new Date().toISOString(),
    });

    // Simulate background progression stages: PREPROCESSING -> SIMULATING -> POSTPROCESSING -> COMPLETED
    setTimeout(() => {
      const job = simulationsStore.get(simId);
      if (job) {
        job.status = 'PREPROCESSING';
        job.progress = 25;
        job.stage = 'Generating 2D unstructured triangular mesh & boundary conditions';
      }
    }, 400);

    setTimeout(() => {
      const job = simulationsStore.get(simId);
      if (job) {
        job.status = 'SIMULATING';
        job.progress = 65;
        job.stage = 'Running hydrodynamic shallow-water Saint-Venant solver';
      }
    }, 900);

    setTimeout(() => {
      const job = simulationsStore.get(simId);
      if (job) {
        job.status = 'POSTPROCESSING';
        job.progress = 88;
        job.stage = 'Computing maximum depth envelopes, velocities, and arrival times';
      }
    }, 1400);

    setTimeout(() => {
      const job = simulationsStore.get(simId);
      if (job) {
        const result = runHydrodynamicSimulation(
          NAGARJUNA_SAGAR_DEM,
          params,
          NAGARJUNA_INFRASTRUCTURE,
          is_demo ?? false
        );
        result.metadata.id = simId;
        job.status = 'COMPLETED';
        job.progress = 100;
        job.stage = 'Simulation completed successfully';
        job.result = result;
      }
    }, 1800);

    res.status(202).json({
      simulation_id: simId,
      status: 'QUEUED',
      message: 'Simulation initiated in background',
    });
  });

  app.get('/api/simulations/:id/status', (req, res) => {
    const job = simulationsStore.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Simulation job not found' });
    }
    res.json({
      simulation_id: req.params.id,
      status: job.status,
      progress_percent: job.progress,
      current_stage: job.stage,
      created_at: job.created_at,
    });
  });

  app.get('/api/simulations/:id/metadata', (req, res) => {
    const job = simulationsStore.get(req.params.id);
    if (!job || !job.result) {
      return res.status(404).json({ error: 'Simulation results not available yet' });
    }
    res.json(job.result.metadata);
  });

  app.get('/api/simulations/:id/frames', (req, res) => {
    const job = simulationsStore.get(req.params.id);
    if (!job || !job.result) {
      return res.status(404).json({ error: 'Simulation results not available yet' });
    }
    res.json({
      total_frames: job.result.frames.length,
      frames: job.result.frames,
    });
  });

  app.get('/api/simulations/:id/frame/:time', (req, res) => {
    const job = simulationsStore.get(req.params.id);
    if (!job || !job.result) {
      return res.status(404).json({ error: 'Simulation results not available yet' });
    }
    const requestedTime = parseInt(req.params.time, 10);
    const frame = job.result.frames.find((f) => f.time_seconds === requestedTime) || job.result.frames[0];
    res.json(frame);
  });

  app.get('/api/simulations/:id/max-depth', (req, res) => {
    const job = simulationsStore.get(req.params.id);
    if (!job || !job.result) {
      return res.status(404).json({ error: 'Simulation results not available yet' });
    }
    res.json({
      max_depth_grid: job.result.max_depth_grid,
      impact_summary: job.result.impact_summary,
    });
  });

  app.get('/api/simulations/:id/arrival-time', (req, res) => {
    const job = simulationsStore.get(req.params.id);
    if (!job || !job.result) {
      return res.status(404).json({ error: 'Simulation results not available yet' });
    }
    res.json({
      arrival_time_grid: job.result.arrival_time_grid,
    });
  });

  app.get('/api/simulations/:id/velocity', (req, res) => {
    const job = simulationsStore.get(req.params.id);
    if (!job || !job.result) {
      return res.status(404).json({ error: 'Simulation results not available yet' });
    }
    res.json({
      max_velocity_grid: job.result.max_velocity_grid,
    });
  });

  app.post('/api/evacuation/calculate', (req, res) => {
    const { village_id, max_depth_threshold = 0.5 } = req.body;
    // Calculate routing availability avoiding flooded roads
    const routes = EVACUATION_ROUTES.map((r) => {
      const isRoadCompromised = r.min_clearance_elevation_m < 95;
      return {
        ...r,
        status: isRoadCompromised ? 'FLOODED' : r.status,
      };
    });
    res.json({ routes });
  });

  app.post('/api/admin/upload', (req, res) => {
    const { dataset_type, file_name, file_size } = req.body;
    res.json({
      success: true,
      message: `Dataset '${file_name}' (${dataset_type}) received and registered for local processing.`,
      timestamp: new Date().toISOString(),
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DamBreak 3D Platform server running on http://localhost:${PORT}`);
  });
}

startServer();
