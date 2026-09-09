import React from 'react';
import { AlertTriangle, FlaskConical } from 'lucide-react';

interface DemoModeBannerProps {
  diagnostics?: Record<string, unknown>;
}

/**
 * DemoModeBanner — Displayed whenever the ANUGA backend is offline
 * or the DEM is synthetic.
 *
 * Per the project requirement:
 *   "It must be IMPOSSIBLE to confuse demo output with real solver output."
 */
export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ diagnostics }) => {
  const isSynthetic = diagnostics?.dem_is_synthetic !== false;

  return (
    <div className="relative z-50 w-full">
      <div className="flex items-center gap-3 px-4 py-2 bg-amber-950/95 border-b-2 border-amber-500 text-amber-100">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-bold text-amber-300 text-sm mr-2">
            ⚠ DEMO DATA — NOT SCIENTIFICALLY COMPUTED
          </span>
          <span className="text-amber-200 text-xs">
            {isSynthetic
              ? 'ANUGA backend offline. Flood extent is procedurally generated (river-buffer). Start backend: cd backend && bash run.sh'
              : 'Running on synthetic DEM. Replace backend/data/dem/nagarjuna_sagar.tif with real SRTM GeoTIFF.'}
          </span>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-600/30 border border-amber-500/50 text-xs text-amber-300 font-mono">
          <FlaskConical className="w-3.5 h-3.5" />
          DEMO
        </div>
      </div>
    </div>
  );
};
