import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { runHydrodynamicSimulation } from './simulation/hydrodynamicEngine';
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
import { AIFlowControlModal } from './components/AIFlowControlModal';
import { DemoModeBanner } from './components/DemoModeBanner';
import { ScientificDebugPanel } from './components/ScientificDebugPanel';
import { HydraulicLayerMode } from './utils/hydraulicScale';

import { INDIAN_DAMS } from './data/indianDams';
import {
  getDamDEM,
  DAM_RIVER_CHANNELS,
  DAM_INFRASTRUCTURE,
  DAM_EVACUATION_ROUTES,
  getDefaultBreachParameters,
} from './data/damsRegistry';
import {
  startSimulation,
  fetchSimulationStatus,
  fetchSimulationResult,
} from './services/api';
import {
  IndianDam,
  BreachParameters,
  HydrodynamicGridPoint,
} from './types';

export default function App() {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulation');
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');

  // Selected Dam
  const [selectedDam, setSelectedDam] = useState<IndianDam>(INDIAN_DAMS[0]);

  // AI Flow Control Modal
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);

  // Active Dam Geospatial Assets
  const activeDEM = useMemo(() => getDamDEM(selectedDam), [selectedDam]);
  const activeRiverChannel: [number, number][] = useMemo(
    () => (DAM_RIVER_CHANNELS[selectedDam.id] || [[selectedDam.latitude, selectedDam.longitude]]) as [number, number][],
    [selectedDam.id]
  );
  const activeInfrastructure = useMemo(
    () => DAM_INFRASTRUCTURE[selectedDam.id] || [],
    [selectedDam.id]
  );
  const activeEvacuationRoutes = useMemo(
    () => DAM_EVACUATION_ROUTES[selectedDam.id] || [],
    [selectedDam.id]
  );

  // Breach Parameters
  const [parameters, setParameters] = useState<BreachParameters>(() =>
    getDefaultBreachParameters(INDIAN_DAMS[0])
  );

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStage, setSimulationStage] = useState('Ready — start the ANUGA backend for real physics');
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(true); // assume demo until proven otherwise
  const [diagnostics, setDiagnostics] = useState<Record<string, unknown> | undefined>(undefined);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Layer Visibilities
  const [layers, setLayers] = useState<LayerVisibility>({
    terrain: true,
    dam_model: true,
    river_channel: true,
    flood_extent: true,
    water_depth: true,
    velocity_vectors: true,
    arrival_time: true,
    risk_zones: true,
    roads: true,
    villages: true,
    hospitals: true,
    schools: true,
    evacuation_routes: true,
  });

  const handleToggleLayer = useCallback((layerKey: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  }, []);

  // Initial simulation result — use legacy engine for initial render
  // (isDemoMode=true until real backend result arrives)

  const [simResult, setSimResult] = useState(() =>
    runHydrodynamicSimulation(activeDEM, parameters, activeInfrastructure)
  );

  // Handle dam selection change
  const handleSelectDam = (newDam: IndianDam) => {
    setSelectedDam(newDam);
    const newDEM = getDamDEM(newDam);
    const newParams = getDefaultBreachParameters(newDam);
    const newInfra = DAM_INFRASTRUCTURE[newDam.id] || [];
    setParameters(newParams);
    const newResult = runHydrodynamicSimulation(newDEM, newParams, newInfra);
    setSimResult(newResult);
    setCurrentFrameIndex(3);
    setSelectedPoint(null);
    setIsDemoMode(true);
  };

  // Timeline State
  const [currentFrameIndex, setCurrentFrameIndex] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Inspection Probe Point
  const [selectedPoint, setSelectedPoint] = useState<HydrodynamicGridPoint | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebugPanel(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Auto-load Live ANUGA baseline simulation on mount ───────────── //
  useEffect(() => {
    let cancelled = false;
    async function loadLiveBaseline() {
      try {
        const status = await fetchSimulationStatus('default');
        if (status.status === 'COMPLETED' && !cancelled) {
          const result = await fetchSimulationResult('default', activeDEM, parameters, activeInfrastructure);
          if (!cancelled && !result.is_demo) {
            setSimResult(result as typeof simResult);
            setIsDemoMode(false);
            setDiagnostics(result.diagnostics);
            setSimulationStage('✓ ANUGA 2D SWE live solver active');
          }
        }
      } catch {
        // Live server still starting or offline; initial state remains
      }
    }
    loadLiveBaseline();
    return () => { cancelled = true; };
  }, [activeDEM, parameters, activeInfrastructure]);

  // Hydraulic Layer Filter Mode (shared by 2D, 3D, and Legend)
  const [activeHydraulicLayer, setActiveHydraulicLayer] = useState<HydraulicLayerMode>('depth');

  // ── Trigger New Simulation Run ──────────────────────────────────── //
  const handleRunSimulation = async (overrideParams?: BreachParameters) => {
    const runParams = overrideParams || parameters;
    setIsSimulating(true);
    setSimulationStage('Connecting to ANUGA backend...');
    setSimulationProgress(5);

    if (pollingRef.current) clearInterval(pollingRef.current);

    try {
      // 1. Start simulation on backend (or get demo ID if offline)
      const startResult = await startSimulation(selectedDam.id, runParams);

      if (startResult.is_demo) {
        // Backend offline — use legacy engine immediately
        setSimulationStage('⚠️ DEMO MODE — ANUGA backend offline');
        setSimulationProgress(50);
        const result = runHydrodynamicSimulation(activeDEM, runParams, activeInfrastructure);
        setSimResult({ ...result, is_demo: true } as typeof simResult);
        setIsDemoMode(true);
        setCurrentFrameIndex(3);
        setIsSimulating(false);
        setSimulationProgress(100);
        setIsPlaying(true);
        return;
      }

      // 2. Poll status until COMPLETED
      const simId = startResult.simulation_id;
      setSimulationStage('Preprocessing DEM and meshing domain...');
      setSimulationProgress(15);
      setIsDemoMode(false);

      await new Promise<void>((resolve, reject) => {
        pollingRef.current = setInterval(async () => {
          try {
            const status = await fetchSimulationStatus(simId);
            setSimulationStage(status.current_stage);
            setSimulationProgress(status.progress_percent);

            if (status.status === 'COMPLETED') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              resolve();
            } else if (status.status === 'FAILED') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              reject(new Error(status.current_stage));
            }
          } catch (err) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            reject(err);
          }
        }, 1500);
      });

      // 3. Fetch all results
      setSimulationStage('Loading simulation frames...');
      setSimulationProgress(88);
      const result = await fetchSimulationResult(
        simId, activeDEM, runParams, activeInfrastructure
      );
      setSimResult(result as typeof simResult);
      setIsDemoMode(result.is_demo);
      setDiagnostics(result.diagnostics);
      setCurrentFrameIndex(0);
      setIsSimulating(false);
      setSimulationStage(result.is_demo
        ? '⚠️ DEMO DATA — not from ANUGA solver'
        : '✓ ANUGA simulation complete');
      setSimulationProgress(100);
      setIsPlaying(true);

    } catch (err) {
      console.error('Simulation failed:', err);
      // Fallback to demo
      const result = runHydrodynamicSimulation(activeDEM, runParams, activeInfrastructure);
      setSimResult({ ...result, is_demo: true } as typeof simResult);
      setIsDemoMode(true);
      setSimulationStage(`⚠️ DEMO (error: ${err instanceof Error ? err.message : String(err)})`);
      setSimulationProgress(100);
      setIsSimulating(false);
      setIsPlaying(true);
    }
  };

  const currentFrame = simResult.frames[currentFrameIndex] || simResult.frames[0];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans select-none text-slate-800">
      {/* Demo Mode Banner — shown whenever backend offline or DEM synthetic */}
      {isDemoMode && <DemoModeBanner diagnostics={diagnostics} />}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onToggleViewMode={() => setViewMode((v) => (v === '2D' ? '3D' : '2D'))}
        dams={INDIAN_DAMS}
        selectedDam={selectedDam}
        onSelectDam={handleSelectDam}
        isSimulating={isSimulating}
        onOpenAIAdvisor={() => setIsAIAdvisorOpen(true)}
        onToggleDebug={() => setShowDebugPanel((v) => !v)}
        isDebugOpen={showDebugPanel}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'simulation' && (
          <>
            {/* Left Control Panel */}
            <LeftPanel
              dam={selectedDam}
              parameters={parameters}
              onParametersChange={setParameters}
              onRunSimulation={handleRunSimulation}
              isSimulating={isSimulating}
              simulationStage={simulationStage}
              simulationProgress={simulationProgress}
            />

            {/* Central Stage */}
            <main className="flex-1 relative overflow-hidden bg-slate-200 bg-dot-grid">
              {/* Layers Switcher */}
              <LayersPanel layers={layers} onToggleLayer={handleToggleLayer} />

              {/* Legend Panel */}
              <LegendPanel
                layers={layers}
                activeHydraulicLayer={activeHydraulicLayer}
                onSelectHydraulicLayer={setActiveHydraulicLayer}
              />

              {/* Scientific Debug Panel (Ctrl+Shift+D) */}
              {showDebugPanel && (
                <ScientificDebugPanel
                  diagnostics={diagnostics ?? {}}
                  isDemoMode={isDemoMode}
                  currentFrame={currentFrame}
                  simulationId={simResult.metadata.id}
                  scenarioId={parameters.failure_type}
                  peakDischarge={simResult.metadata.peak_discharge_m3s}
                  maxFloodedArea={simResult.impact_summary.flooded_area_sqkm}
                  metadata={simResult.metadata as unknown as Record<string, unknown>}
                />
              )}

              {/* 2D vs 3D Render Mode */}
              <ErrorBoundary fallbackTitle="Map Viewer Recovery">
                {viewMode === '3D' ? (
                  <ThreeTerrainViewer
                    dem={activeDEM}
                    currentFrame={currentFrame}
                    maxDepthGrid={simResult.max_depth_grid}
                    maxVelocityGrid={simResult.max_velocity_grid}
                    arrivalTimeGrid={simResult.arrival_time_grid}
                    riskGrid={simResult.risk_grid}
                    infrastructure={simResult.updated_infrastructure}
                    layers={layers}
                    activeHydraulicLayer={activeHydraulicLayer}
                    onSelectPoint={setSelectedPoint}
                  />
                ) : (
                  <Leaflet2DMap
                    dam={selectedDam}
                    dem={activeDEM}
                    currentFrame={currentFrame}
                    maxDepthGrid={simResult.max_depth_grid}
                    maxVelocityGrid={simResult.max_velocity_grid}
                    arrivalTimeGrid={simResult.arrival_time_grid}
                    riskGrid={simResult.risk_grid}
                    infrastructure={simResult.updated_infrastructure}
                    riverChannel={activeRiverChannel}
                    layers={layers}
                    breachLocation={parameters.breach_location}
                    activeHydraulicLayer={activeHydraulicLayer}
                    onSelectPoint={setSelectedPoint}
                  />
                )}
              </ErrorBoundary>

              {/* Demo badge on map */}
              {isDemoMode && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-900/80 border border-amber-500/60 rounded-full text-amber-300 text-[11px] font-bold backdrop-blur">
                    ⚠ DEMO DATA — flood extent is NOT from ANUGA solver
                  </div>
                </div>
              )}
            </main>

            {/* Right Telemetry & Inspection Panel */}
            <RightPanel
              currentFrame={currentFrame}
              frames={simResult.frames}
              metadata={simResult.metadata}
              impactSummary={simResult.impact_summary}
              infrastructure={simResult.updated_infrastructure}
              selectedPoint={selectedPoint}
              onClearPoint={() => setSelectedPoint(null)}
            />
          </>
        )}

        {activeTab === 'impact' && (
          <ErrorBoundary fallbackTitle="Impact Analysis Module Recovery">
            <ImpactAnalysisPage
              metadata={simResult.metadata}
              frames={simResult.frames}
              impactSummary={simResult.impact_summary}
              infrastructure={simResult.updated_infrastructure}
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
                  handleRunSimulation(newParams).catch((err) => console.error('Simulation error:', err));
                }, 100);
              }}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'evacuation' && (
          <ErrorBoundary fallbackTitle="Evacuation Planning Module Recovery">
            <EvacuationPage
              routes={activeEvacuationRoutes}
              infrastructure={simResult.updated_infrastructure}
            />
          </ErrorBoundary>
        )}
      </div>

      {/* Bottom Timeline Controls */}
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

      {/* AI Water Flow & Gate Control Modal */}
      <AIFlowControlModal
        isOpen={isAIAdvisorOpen}
        onClose={() => setIsAIAdvisorOpen(false)}
        dam={selectedDam}
        parameters={parameters}
        simResult={simResult}
        onApplyAIParameters={(newParams) => {
          const updated = { ...parameters, ...newParams };
          setParameters(updated);
          const updatedResult = runHydrodynamicSimulation(activeDEM, updated, activeInfrastructure);
          setSimResult(updatedResult);
          setCurrentFrameIndex(3);
          setIsPlaying(true);
          setIsDemoMode(true);
        }}
      />
    </div>
  );
}
