/**
 * hydraulicScale.ts — Single authoritative color scale definitions
 * Shared identically by 2D Map, 3D Viewer, and Legend Panel.
 */

export type HydraulicLayerMode = 'depth' | 'velocity' | 'hazard' | 'arrival_time';

export interface HydraulicColorResult {
  fill: string;
  border: string;
  threeColor: number;
  label: string;
}

export function getDepthColor(depth: number): HydraulicColorResult {
  if (depth <= 0.05) {
    return { fill: 'transparent', border: 'transparent', threeColor: 0x000000, label: 'Dry' };
  }
  if (depth < 0.5) {
    return { fill: '#38bdf8', border: '#0284c7', threeColor: 0x38bdf8, label: 'Shallow (<0.5m)' };
  }
  if (depth < 1.5) {
    return { fill: '#0284c7', border: '#0369a1', threeColor: 0x0284c7, label: 'Moderate (0.5–1.5m)' };
  }
  if (depth < 3.5) {
    return { fill: '#1d4ed8', border: '#1e40af', threeColor: 0x1d4ed8, label: 'Deep (1.5–3.5m)' };
  }
  if (depth < 6.0) {
    return { fill: '#312e81', border: '#1e1b4b', threeColor: 0x312e81, label: 'Very Deep (3.5–6.0m)' };
  }
  return { fill: '#1e1b4b', border: '#0f172a', threeColor: 0x1e1b4b, label: 'Extreme (>6.0m)' };
}

export function getVelocityColor(velocity: number): HydraulicColorResult {
  if (velocity < 0.2) {
    return { fill: '#10b981', border: '#059669', threeColor: 0x10b981, label: 'Low (<0.2 m/s)' };
  }
  if (velocity < 2.0) {
    return { fill: '#eab308', border: '#ca8a04', threeColor: 0xeab308, label: 'Moderate (0.2–2.0 m/s)' };
  }
  if (velocity < 5.0) {
    return { fill: '#f97316', border: '#ea580c', threeColor: 0xf97316, label: 'Fast (2.0–5.0 m/s)' };
  }
  return { fill: '#ef4444', border: '#dc2626', threeColor: 0xef4444, label: 'Torrential (>5.0 m/s)' };
}

export function getHazardColor(hazard: number): HydraulicColorResult {
  if (hazard < 0.3) {
    return { fill: '#10b981', border: '#059669', threeColor: 0x10b981, label: 'Low (<0.3)' };
  }
  if (hazard < 0.6) {
    return { fill: '#eab308', border: '#ca8a04', threeColor: 0xeab308, label: 'Moderate (0.3–0.6)' };
  }
  if (hazard < 1.2) {
    return { fill: '#f97316', border: '#ea580c', threeColor: 0xf97316, label: 'High (0.6–1.2)' };
  }
  return { fill: '#e11d48', border: '#be123c', threeColor: 0xe11d48, label: 'Very High (≥1.2)' };
}

export function getArrivalTimeColor(arrivalMin: number): HydraulicColorResult {
  if (arrivalMin < 0) {
    return { fill: 'transparent', border: 'transparent', threeColor: 0x000000, label: 'Unreached' };
  }
  if (arrivalMin <= 30) {
    return { fill: '#f43f5e', border: '#e11d48', threeColor: 0xf43f5e, label: 'Immediate (<30 min)' };
  }
  if (arrivalMin <= 60) {
    return { fill: '#f59e0b', border: '#d97706', threeColor: 0xf59e0b, label: 'Rapid (30–60 min)' };
  }
  if (arrivalMin <= 120) {
    return { fill: '#38bdf8', border: '#0284c7', threeColor: 0x38bdf8, label: 'Moderate (1–2 h)' };
  }
  return { fill: '#1d4ed8', border: '#1e40af', threeColor: 0x1d4ed8, label: 'Delayed (>2 h)' };
}

export function getHydraulicCellColor(
  mode: HydraulicLayerMode,
  props: {
    depth: number;
    velocity?: number;
    hazard?: number;
    arrivalTimeMin?: number;
  }
): HydraulicColorResult {
  const d = props.depth || 0;
  if (d <= 0.05) {
    return { fill: 'transparent', border: 'transparent', threeColor: 0x000000, label: 'Dry' };
  }

  switch (mode) {
    case 'velocity': {
      const v = props.velocity ?? 0;
      return getVelocityColor(v);
    }
    case 'hazard': {
      const h = props.hazard ?? (d * (props.velocity ?? 0));
      return getHazardColor(h);
    }
    case 'arrival_time': {
      const arr = props.arrivalTimeMin ?? -1;
      return getArrivalTimeColor(arr);
    }
    case 'depth':
    default:
      return getDepthColor(d);
  }
}
