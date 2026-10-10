import type { CalibrationData, CalibrationPoint } from '../types';

const STORAGE_KEY = 'handsfree_calibration';

export interface CalibrationTarget {
  id: number;
  screenX: number; // fraction 0-1
  screenY: number; // fraction 0-1
  label: string;
}

// 5 targets: center, then 4 corners (inset so user can see them)
export const CALIBRATION_TARGETS: CalibrationTarget[] = [
  { id: 0, screenX: 0.5, screenY: 0.5, label: 'Center' },
  { id: 1, screenX: 0.15, screenY: 0.15, label: 'Top-Left' },
  { id: 2, screenX: 0.85, screenY: 0.15, label: 'Top-Right' },
  { id: 3, screenX: 0.85, screenY: 0.85, label: 'Bottom-Right' },
  { id: 4, screenX: 0.15, screenY: 0.85, label: 'Bottom-Left' },
];

export interface CalibrationResult {
  // The min/max range the user's hand occupies in normalized camera coords
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  data: CalibrationData;
}

export function loadCalibration(): CalibrationResult | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
}

export function saveCalibration(result: CalibrationResult): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // ignore
  }
}

export function clearCalibration(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Given collected calibration points, compute the bounding box
 * of tracked coordinates and produce a CalibrationResult.
 */
export function computeCalibration(
  points: CalibrationPoint[],
  startTime: number
): CalibrationResult {
  const trackedXs = points.map(p => p.trackedX);
  const trackedYs = points.map(p => p.trackedY);

  // Add a small margin (5%) so the user doesn't have to hit the exact extremes
  const rangeX = Math.max(...trackedXs) - Math.min(...trackedXs);
  const rangeY = Math.max(...trackedYs) - Math.min(...trackedYs);
  const marginX = rangeX * 0.05;
  const marginY = rangeY * 0.05;

  const minX = Math.max(0, Math.min(...trackedXs) - marginX);
  const maxX = Math.min(1, Math.max(...trackedXs) + marginX);
  const minY = Math.max(0, Math.min(...trackedYs) - marginY);
  const maxY = Math.min(1, Math.max(...trackedYs) + marginY);

  const duration = Date.now() - startTime;

  return {
    minX,
    maxX,
    minY,
    maxY,
    data: {
      points,
      completed: true,
      timestamp: Date.now(),
      duration,
    },
  };
}

/**
 * Map a raw tracked coordinate to screen space using calibration bounds.
 * Returns values in [0, 1] range, clamped.
 */
export function mapWithCalibration(
  rawX: number,
  rawY: number,
  cal: CalibrationResult
): { x: number; y: number } {
  const rangeX = cal.maxX - cal.minX;
  const rangeY = cal.maxY - cal.minY;

  // Avoid division by zero
  const x = rangeX > 0.01 ? (rawX - cal.minX) / rangeX : 0.5;
  const y = rangeY > 0.01 ? (rawY - cal.minY) / rangeY : 0.5;

  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}
