import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { TimelineControls } from './components/TimelineControls';
import { LayersPanel, LayerVisibility } from './components/LayersPanel';
import { LegendPanel } from './components/LegendPanel';
import { ThreeTerrainViewer } from './map/ThreeTerrainViewer';
import { Leaflet2DMap } from './map/Leaflet2DMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ImpactAnalysisPage } from './pages/ImpactAnalysisPage';
import { ScenarioComparisonPage } from './pages/ScenarioComparisonPage';
import { EvacuationPage } from './pages/EvacuationPage';
import { CinematicViewPage } from './pages/CinematicViewPage';
import { AdminDataPage } from './pages/AdminDataPage';

import { INDIAN_DAMS } from './data/indianDams';
import { NAGARJUNA_SAGAR_DEM } from './data/nagarjunaSagarDEM';
import {
  NAGARJUNA_INFRASTRUCTURE,
  NAGARJUNA_EVACUATION_ROUTES,
  KRISHNA_RIVER_CHANNEL,
} from './data/nagarjunaSagarInfrastructure';
import { runHydrodynamicSimulation } from './simulation/hydrodynamicEngine';
import {
  IndianDam,
  BreachParameters,
  HydrodynamicGridPoint,
  SimulationFrame,
  SimulationMetadata,
  ImpactStatistics,
} from './types';

export default function App() {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulation');
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');

  // Selected Dam
  const [selectedDam, setSelectedDam] = useState<IndianDam>(INDIAN_DAMS[0]);

  // Breach Scenario Parameters
  const [parameters, setParameters] = useState<BreachParameters>({
    reservoir_water_level_m: 179.8,
    initial_water_depth_m: 124.0,
    breach_width_m: 60,
    breach_height_m: 55,
    breach_formation_time_min: 45,
    breach_location: 'center',
    failure_type: 'major',
    manning_n: 0.035,
  });

  // Simulation Running State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStage, setSimulationStage] = useState('Ready');
  const [simulationProgress, setSimulationProgress] = useState(0);

  // Layer Visibilities
  const [layers, setLayers] = useState<LayerVisibility>({
    terrain: true,
    satellite: true,
    dam_model: true,
    reservoir: true,
    river_channel: true,
    flood_extent: true,
    water_depth: true,
    velocity_vectors: true,
    arrival_time: true,
    risk_zones: true,
    roads: true,
    buildings: true,
    villages: true,
    hospitals: true,
    schools: true,
    evacuation_routes: true,
  });

  const handleToggleLayer = useCallback((layerKey: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  }, []);

  // Compute Initial Hydrodynamic Simulation Data
  const [simResult, setSimResult] = useState(() =>
    runHydrodynamicSimulation(
      NAGARJUNA_SAGAR_DEM,
      {
        reservoir_water_level_m: 179.8,
        initial_water_depth_m: 124.0,
        breach_width_m: 60,
        breach_height_m: 55,
        breach_formation_time_min: 45,
        breach_location: 'center',
        failure_type: 'major',
        manning_n: 0.035,
      },
      NAGARJUNA_INFRASTRUCTURE
    )
  );

  // Timeline State
  const [currentFrameIndex, setCurrentFrameIndex] = useState(4); // Start at T+01:00 for good flood visualization
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Inspection Probe Point
  const [selectedPoint, setSelectedPoint] = useState<HydrodynamicGridPoint | null>(null);

  // Trigger New Simulation Run
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationStage('Initializing DEM Topography & Boundary Cells...');
    setSimulationProgress(15);

    await new Promise((r) => setTimeout(r, 400));
    setSimulationStage('Calculating Froehlich Peak Outflow & Breach Hydrograph...');
    setSimulationProgress(40);

    await new Promise((r) => setTimeout(r, 500));
    setSimulationStage('Solving 2D Shallow Water Equations (SWE Continuity & Momentum)...');
    setSimulationProgress(75);

    await new Promise((r) => setTimeout(r, 500));
    setSimulationStage('Intersecting Inundation Envelopes with Downstream Infrastructure...');
    setSimulationProgress(95);

    await new Promise((r) => setTimeout(r, 300));
    const result = runHydrodynamicSimulation(NAGARJUNA_SAGAR_DEM, parameters, NAGARJUNA_INFRASTRUCTURE);
    setSimResult(result);
    setCurrentFrameIndex(2);
    setIsSimulating(false);
    setSimulationStage('Simulation Completed');
    setSimulationProgress(100);
    setIsPlaying(true);
  };

  const currentFrame = simResult.frames[currentFrameIndex] || simResult.frames[0];

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a0c] text-[#e0e0e0] overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        dams={INDIAN_DAMS}
        selectedDam={selectedDam}
        onSelectDam={(dam) => setSelectedDam(dam)}
        isSimulating={isSimulating}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'simulation' && (
          <>
            {/* Left Control Panel: Dam info, Breach inputs, Run button */}
            <LeftPanel
              dam={selectedDam}
              parameters={parameters}
              onParametersChange={setParameters}
              onRunSimulation={handleRunSimulation}
              isSimulating={isSimulating}
              simulationStage={simulationStage}
              simulationProgress={simulationProgress}
            />

            {/* Central Stage: 3D DEM Viewer or 2D GIS Map */}
            <main className="flex-1 relative overflow-hidden bg-[#0a0a0c] dot-grid">
              {/* Top-Left Floating Map Layers Switcher */}
              <LayersPanel layers={layers} onToggleLayer={handleToggleLayer} />

              {/* Bottom-Right Floating Legend Panel */}
              <LegendPanel layers={layers} />

              {/* 3D vs 2D Render Mode */}
              <ErrorBoundary fallbackTitle="Map Viewer Recovery">
                {viewMode === '3D' ? (
                  <ThreeTerrainViewer
                    dem={NAGARJUNA_SAGAR_DEM}
                    currentFrame={currentFrame}
                    maxDepthGrid={simResult.max_depth_grid}
                    maxVelocityGrid={simResult.max_velocity_grid}
                    arrivalTimeGrid={simResult.arrival_time_grid}
                    riskGrid={simResult.risk_grid}
                    infrastructure={NAGARJUNA_INFRASTRUCTURE}
                    layers={layers}
                    onSelectPoint={setSelectedPoint}
                  />
                ) : (
                  <Leaflet2DMap
                    dam={selectedDam}
                    dem={NAGARJUNA_SAGAR_DEM}
                    currentFrame={currentFrame}
                    maxDepthGrid={simResult.max_depth_grid}
                    maxVelocityGrid={simResult.max_velocity_grid}
                    arrivalTimeGrid={simResult.arrival_time_grid}
                    riskGrid={simResult.risk_grid}
                    infrastructure={NAGARJUNA_INFRASTRUCTURE}
                    riverChannel={KRISHNA_RIVER_CHANNEL}
                    layers={layers}
                    onSelectPoint={setSelectedPoint}
                  />
                )}
              </ErrorBoundary>
            </main>

            {/* Right Telemetry & Inspection Panel */}
            <RightPanel
              currentFrame={currentFrame}
              metadata={simResult.metadata}
              impactSummary={simResult.impact_summary}
              selectedPoint={selectedPoint}
              onClearPoint={() => setSelectedPoint(null)}
            />
          </>
        )}

        {/* Dedicated Secondary Modules */}
        {activeTab === 'impact' && (
          <ErrorBoundary fallbackTitle="Impact Analysis Module Recovery">
            <ImpactAnalysisPage
              metadata={simResult.metadata}
              frames={simResult.frames}
              impactSummary={simResult.impact_summary}
              infrastructure={NAGARJUNA_INFRASTRUCTURE}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'comparison' && (
          <ErrorBoundary fallbackTitle="Scenario Comparison Module Recovery">
            <ScenarioComparisonPage
              currentParams={parameters}
              onApplyScenario={(newParams) => {
                setParameters(newParams);
                setActiveTab('simulation');
                setTimeout(() => {
                  handleRunSimulation().catch((err) => console.error('Simulation error:', err));
                }, 100);
              }}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'evacuation' && (
          <ErrorBoundary fallbackTitle="Evacuation Planning Module Recovery">
            <EvacuationPage
              routes={NAGARJUNA_EVACUATION_ROUTES}
              infrastructure={NAGARJUNA_INFRASTRUCTURE}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'cinematic' && (
          <ErrorBoundary fallbackTitle="Cinematic Visualizer Module Recovery">
            <CinematicViewPage />
          </ErrorBoundary>
        )}

        {activeTab === 'admin' && (
          <ErrorBoundary fallbackTitle="Admin Data Management Recovery">
            <AdminDataPage />
          </ErrorBoundary>
        )}
      </div>

      {/* Bottom Timeline Controls (Only visible in Simulation Studio) */}
      {activeTab === 'simulation' && (
        <TimelineControls
          frames={simResult.frames}
          currentFrameIndex={currentFrameIndex}
          onFrameChange={setCurrentFrameIndex}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onRestart={() => {
            setCurrentFrameIndex(0);
            setIsPlaying(true);
          }}
          playbackSpeed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
        />
      )}
    </div>
  );
}
