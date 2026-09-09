import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Clock,
} from 'lucide-react';
import { SimulationFrame } from '../types';

interface TimelineControlsProps {
  frames: SimulationFrame[];
  currentFrameIndex: number;
  onFrameChange: (index: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  frames,
  currentFrameIndex,
  onFrameChange,
  isPlaying,
  onTogglePlay,
  onRestart,
  playbackSpeed,
  onSpeedChange,
}) => {
  const currentFrame = frames[currentFrameIndex] || frames[0];
  const maxIndex = Math.max(0, frames.length - 1);

  // Playback timer effect
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;

    const intervalTime = Math.max(120, 1000 / playbackSpeed);

    const timer = setInterval(() => {
      onFrameChange((prev) => {
        if (prev >= maxIndex) {
          onTogglePlay();
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, maxIndex, frames.length, onFrameChange, onTogglePlay]);

  return (
    <div className="h-20 bg-white border-t border-slate-200 px-6 flex items-center justify-between z-30 select-none shrink-0 shadow-md">
      {/* Left: Playback Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRestart}
          className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          title="Restart Simulation Timeline"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => onFrameChange(Math.max(0, currentFrameIndex - 1))}
          disabled={currentFrameIndex === 0}
          className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors disabled:opacity-30 text-xs flex items-center gap-1 font-mono"
          title="Step Backward (15 min)"
        >
          <Rewind className="w-3.5 h-3.5" />
          <span>-15m</span>
        </button>

        <button
          onClick={onTogglePlay}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
          title={isPlaying ? 'Pause' : 'Play Flood Propagation'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              <span>SIMULATE</span>
            </>
          )}
        </button>

        <button
          onClick={() => onFrameChange(Math.min(maxIndex, currentFrameIndex + 1))}
          disabled={currentFrameIndex === maxIndex}
          className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors disabled:opacity-30 text-xs flex items-center gap-1 font-mono"
          title="Step Forward (15 min)"
        >
          <span>+15m</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>

        {/* Current Simulated Time Display */}
        <div className="ml-2 pl-3 border-l border-slate-200 hidden sm:flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
              Elapsed Flood Time
            </span>
            <span className="text-xs font-mono font-bold text-slate-900">
              {currentFrame ? currentFrame.time_formatted : '00:00:00'}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Timeline Scrubber & Discharge Info */}
      <div className="flex-1 mx-6 max-w-2xl hidden md:block">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-mono">
          <span>T+00:00 (Breach Start)</span>
          <span className="text-blue-600 font-bold">
            TIME: T+{currentFrame ? `${Math.floor(currentFrame.time_seconds / 60)}m` : '0m'}
            <span className="text-slate-500 ml-2 font-normal">
              (Discharge: {currentFrame?.discharge_m3s.toLocaleString() || '0'} m³/s)
            </span>
          </span>
          <span>T+03:00 (Peak Flood)</span>
        </div>

        {/* Scrubber slider */}
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={maxIndex}
            value={currentFrameIndex}
            onChange={(e) => onFrameChange(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-blue-600 focus:outline-none"
          />
        </div>

        {/* Frame ticks */}
        <div className="flex justify-between px-1 mt-1 text-[9px] text-slate-400 font-mono">
          {frames.map((f, i) => (
            <span
              key={f.time_seconds}
              onClick={() => onFrameChange(i)}
              className={`cursor-pointer hover:text-blue-600 ${
                i === currentFrameIndex ? 'text-blue-600 font-bold' : ''
              }`}
            >
              •
            </span>
          ))}
        </div>
      </div>

      {/* Right: Playback Speed Toggles */}
      <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-lg text-xs font-mono">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider px-1 font-bold">Speed:</span>
        {[0.5, 1, 2, 4, 8].map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-0.5 rounded transition-colors ${
              playbackSpeed === s
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
};
