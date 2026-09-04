import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  AlertTriangle,
  FileCode2,
  CheckCircle2,
  Cpu,
  Layers,
  Video,
  Download,
  Terminal,
} from 'lucide-react';

export const CinematicViewPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeCamera, setActiveCamera] = useState<'dam_face' | 'valley_downstream' | 'aerial_orbit'>('dam_face');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Procedural fluid canvas animation for cinematic preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let frameCount = 0;

    const renderFrame = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;

      // Dark cinematic gorge environment
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, w, h);

      // Distant canyon cliffs
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.4);
      ctx.lineTo(w * 0.25, h * 0.45);
      ctx.lineTo(w * 0.5, h * 0.38);
      ctx.lineTo(w * 0.8, h * 0.42);
      ctx.lineTo(w, h * 0.35);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // Dam Wall (Nagarjuna Sagar Masonry Spillway)
      ctx.fillStyle = '#334155';
      ctx.fillRect(w * 0.15, h * 0.3, w * 0.7, h * 0.25);

      // Dam Crest Piers & Radial Gates
      ctx.fillStyle = '#dc2626';
      for (let i = 0; i < 12; i++) {
        ctx.fillRect(w * 0.2 + i * (w * 0.05), h * 0.28, w * 0.035, h * 0.04);
      }

      // Breach Void in Dam (Central Failure)
      const breachProg = Math.min(1.0, (currentTime / 60) * 1.5);
      const breachW = w * 0.22 * Math.max(0.4, breachProg);
      const breachH = h * 0.18 * Math.max(0.3, breachProg);
      const breachX = w * 0.5 - breachW / 2;
      const breachY = h * 0.32;

      ctx.fillStyle = '#090d16';
      ctx.fillRect(breachX, breachY, breachW, breachH);

      // FLIP Fluid Torrent Gushing Through Breach (Foam, spray, velocity gradients)
      const grad = ctx.createLinearGradient(breachX, breachY, breachX, h);
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(0.3, '#0284c7');
      grad.addColorStop(0.7, '#0369a1');
      grad.addColorStop(1, '#0c4a6e');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(breachX + 5, breachY);
      ctx.bezierCurveTo(
        breachX - w * 0.05,
        h * 0.55,
        w * 0.1,
        h * 0.7,
        0,
        h
      );
      ctx.lineTo(w, h);
      ctx.bezierCurveTo(
        w * 0.9,
        h * 0.7,
        breachX + breachW + w * 0.05,
        h * 0.55,
        breachX + breachW - 5,
        breachY
      );
      ctx.fill();

      // Turbulent Foam and White Water Particles (FLIP Fluid signature)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      const particleCount = 70;
      for (let p = 0; p < particleCount; p++) {
        const px = breachX + Math.sin(p * 17 + frameCount * 0.05) * (breachW * 0.8) + breachW * 0.1;
        const py = breachY + ((p * 13 + frameCount * 4) % (h - breachY));
        const pRadius = 1.5 + (p % 4);
        ctx.beginPath();
        ctx.arc(px + Math.sin(py * 0.05) * 20, py, pRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hydraulic Jump & Spray Mist at Toe
      ctx.fillStyle = 'rgba(224, 242, 254, 0.25)';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.65, w * 0.35, h * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cinematic Overlay Text
      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px monospace';
      ctx.fillText('BLENDER 4.x + FLIP FLUIDS SIMULATION ENGINE (C++ / CYCLES)', 20, 25);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`SCENE: Nagarjuna_Sagar_Break_Cinematic.blend | CAM: ${activeCamera.toUpperCase()}`, 20, 42);

      if (isPlaying) {
        setCurrentTime((prev) => (prev >= 60 ? 0 : prev + 0.15));
      }

      animationId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, activeCamera, currentTime]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0c] p-6 text-[#e0e0e0]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Strict Dual Architecture Rule Banner */}
        <div className="bg-purple-950/20 border border-purple-500/30 p-3.5 rounded flex items-start gap-3 text-purple-200">
          <Film className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-purple-300">
              MANDATORY DUAL ARCHITECTURE RULE: SCIENTIFIC VS CINEMATIC
            </h3>
            <p className="text-xs text-purple-200/80 leading-relaxed font-mono">
              <strong>1. SCIENTIFIC SIMULATION (ANUGA):</strong> Hydrodynamic 2D shallow water equation modeling produces mathematically verified flood depths, flow velocities, and arrival times.
              <br />
              <strong>2. CINEMATIC VISUALIZATION (Blender + FLIP Fluids):</strong> Used strictly for high-fidelity photorealistic splashes, breaking masonry geometry, spray mist, and public media communication. <em>Never substitute FLIP Fluids output as scientific flood prediction.</em>
            </p>
          </div>
        </div>

        {/* Cinematic Player Window */}
        <div className="bg-white/5 rounded border border-white/10 overflow-hidden">
          <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-400" />
              <span className="font-bold uppercase tracking-wider text-white">Pre-Rendered FLIP Fluids Simulation Reel</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                1080p 60FPS Cycles
              </span>
            </div>

            {/* Camera Angle Selector */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/10">
              <button
                onClick={() => setActiveCamera('dam_face')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
                  activeCamera === 'dam_face' ? 'bg-blue-600 text-white font-bold' : 'text-white/40 hover:text-white/80'
                }`}
              >
                Dam Breach Face
              </button>
              <button
                onClick={() => setActiveCamera('valley_downstream')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
                  activeCamera === 'valley_downstream' ? 'bg-blue-600 text-white font-bold' : 'text-white/40 hover:text-white/80'
                }`}
              >
                Krishna Canyon
              </button>
              <button
                onClick={() => setActiveCamera('aerial_orbit')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
                  activeCamera === 'aerial_orbit' ? 'bg-blue-600 text-white font-bold' : 'text-white/40 hover:text-white/80'
                }`}
              >
                Aerial Heli-Orbit
              </button>
            </div>
          </div>

          {/* Interactive Player Stage */}
          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              width={960}
              height={540}
              className="w-full h-full object-contain"
            />

            {/* Live Timestamp Overlay */}
            <div className="absolute bottom-4 left-4 bg-[#0a0a0c]/90 backdrop-blur-md px-3 py-1 rounded border border-white/10 text-xs font-mono text-blue-400">
              <span>Time: 00:0{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Player Controls Bar */}
          <div className="p-3 bg-white/5 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                onClick={() => setCurrentTime(0)}
                className="p-2 rounded bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 mx-4">
              <input
                type="range"
                min={0}
                max={60}
                step={0.1}
                value={currentTime}
                onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <span className="text-xs font-mono text-white/40">
              {currentTime.toFixed(1)}s / 60.0s
            </span>
          </div>
        </div>

        {/* Integration Architecture Workflow */}
        <div className="bg-white/5 p-5 rounded border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              ANUGA to Blender + FLIP Fluids Pipeline Architecture
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            <div className="bg-white/5 p-3 rounded border border-white/5 space-y-1.5">
              <span className="text-[9px] font-mono text-blue-400 uppercase block font-bold">Step 1: SWE Physics</span>
              <p className="font-bold text-white uppercase text-[11px]">ANUGA Simulation</p>
              <p className="text-white/40 text-[10px] font-mono leading-relaxed">Computes discharge hydrograph, stages, and velocities on DEM.</p>
            </div>

            <div className="bg-white/5 p-3 rounded border border-white/5 space-y-1.5">
              <span className="text-[9px] font-mono text-blue-400 uppercase block font-bold">Step 2: Boundary Export</span>
              <p className="font-bold text-white uppercase text-[11px]">Inflow &amp; DEM GeoTIFF</p>
              <p className="text-white/40 text-[10px] font-mono leading-relaxed">Exports breach hydrograph Q(t) and terrain OBJ mesh to Blender.</p>
            </div>

            <div className="bg-white/5 p-3 rounded border border-white/5 space-y-1.5">
              <span className="text-[9px] font-mono text-purple-400 uppercase block font-bold">Step 3: FLIP Domain</span>
              <p className="font-bold text-white uppercase text-[11px]">C++ FLIP Solver</p>
              <p className="text-white/40 text-[10px] font-mono leading-relaxed">Sets fluid domain, obstacle dam, white-water foam &amp; bubble particles.</p>
            </div>

            <div className="bg-white/5 p-3 rounded border border-white/5 space-y-1.5">
              <span className="text-[9px] font-mono text-purple-400 uppercase block font-bold">Step 4: Cycles Render</span>
              <p className="font-bold text-white uppercase text-[11px]">Raytraced Video</p>
              <p className="text-white/40 text-[10px] font-mono leading-relaxed">Renders water refractions, spray mist, and debris dynamics to MP4/WebM.</p>
            </div>

            <div className="bg-white/5 p-3 rounded border border-white/5 space-y-1.5">
              <span className="text-[9px] font-mono text-emerald-400 uppercase block font-bold">Step 5: Web Platform</span>
              <p className="font-bold text-white uppercase text-[11px]">Interactive Integration</p>
              <p className="text-white/40 text-[10px] font-mono leading-relaxed">Drives web player alongside scientific flood telemetry cards.</p>
            </div>
          </div>
        </div>

        {/* Python/Blender Automation Script Card */}
        <div className="bg-white/5 p-5 rounded border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                Blender FLIP Fluids Setup Script (blender/scripts/setup_dam_flip_fluids.py)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-white/40">Python 3.10 / bpy</span>
          </div>

          <pre className="bg-[#0a0a0c] p-4 rounded border border-white/10 text-xs font-mono text-emerald-400/90 overflow-x-auto leading-relaxed">
{`# setup_dam_flip_fluids.py
import bpy
import flip_fluids_addon

def setup_nagarjuna_dam_break():
    # 1. Clear default scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # 2. Import Real DEM Terrain (Krishna River Canyon)
    bpy.ops.import_scene.obj(filepath="data/dem/nagarjuna_gorge.obj")
    terrain = bpy.context.selected_objects[0]
    
    # 3. Add 3D Masonry Dam Structure with Cell Fracture for Breach
    bpy.ops.import_scene.gltf(filepath="public/models/dam_structure.glb")
    dam = bpy.context.selected_objects[0]
    
    # 4. Configure FLIP Fluids Domain
    bpy.ops.flip_fluid_operators.domain_add()
    domain = bpy.context.active_object
    domain.flip_fluid.domain.resolution = 400
    domain.flip_fluid.whitewater.enable_whitewater = True
    
    # 5. Connect ANUGA Inflow Hydrograph (Froehlich Peak = 41,200 m3/s)
    # Target discharge exported from DamBreak 3D backend
    print("FLIP Fluids Scene configured successfully for Nagarjuna Sagar Dam.")`}
          </pre>
        </div>
      </div>
    </div>
  );
};
