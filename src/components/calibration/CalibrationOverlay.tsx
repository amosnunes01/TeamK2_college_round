import React, { useState, useEffect, useCallback } from 'react';
import { Target, CheckCircle2, RotateCcw, X, Timer, AlertTriangle } from 'lucide-react';
import {
  CALIBRATION_TARGETS,
  computeCalibration,
  type CalibrationResult,
  type CalibrationTarget,
} from '../../services/calibrationService';
import type { CalibrationPoint } from '../../types';

interface CalibrationOverlayProps {
  /** Called with the result when calibration completes or null when cancelled */
  onComplete: (result: CalibrationResult | null) => void;
  /** Current tracked position in normalized [0,1] space — null if hand/face lost */
  currentTracked: { x: number; y: number } | null;
  /** Whether tracking is actively detecting */
  isDetecting: boolean;
}

type CalibrationPhase = 'instructions' | 'collecting' | 'complete' | 'error';

export const CalibrationOverlay: React.FC<CalibrationOverlayProps> = ({
  onComplete,
  currentTracked,
  isDetecting,
}) => {
  const [phase, setPhase] = useState<CalibrationPhase>('instructions');
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [collectedPoints, setCollectedPoints] = useState<CalibrationPoint[]>([]);
  const [holdProgress, setHoldProgress] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState<CalibrationResult | null>(null);

  const HOLD_DURATION_MS = 1500; // Hold on target for 1.5s to collect a point
  const holdStartRef = React.useRef<number | null>(null);
  const animRef = React.useRef<number | null>(null);

  const currentTarget: CalibrationTarget | undefined = CALIBRATION_TARGETS[currentTargetIndex];

  // Timer for elapsed seconds
  useEffect(() => {
    if (phase !== 'collecting') return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [phase, startTime]);

  // Hold-to-collect animation loop
  useEffect(() => {
    if (phase !== 'collecting' || !isDetecting || !currentTracked) {
      holdStartRef.current = null;
      setHoldProgress(0);
      return;
    }

    const animate = () => {
      if (!holdStartRef.current) {
        holdStartRef.current = performance.now();
      }

      const elapsed = performance.now() - holdStartRef.current;
      const progress = Math.min(1, elapsed / HOLD_DURATION_MS);
      setHoldProgress(progress);

      if (progress >= 1) {
        // Collect this point
        collectPoint();
        return;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [phase, isDetecting, currentTracked, currentTargetIndex]);

  const collectPoint = useCallback(() => {
    if (!currentTracked || !currentTarget) return;

    const point: CalibrationPoint = {
      screenX: currentTarget.screenX,
      screenY: currentTarget.screenY,
      trackedX: currentTracked.x,
      trackedY: currentTracked.y,
    };

    const newPoints = [...collectedPoints, point];
    setCollectedPoints(newPoints);
    setHoldProgress(0);
    holdStartRef.current = null;

    if (currentTargetIndex + 1 >= CALIBRATION_TARGETS.length) {
      // All points collected
      const calResult = computeCalibration(newPoints, startTime);
      setResult(calResult);
      setPhase('complete');
    } else {
      setCurrentTargetIndex(currentTargetIndex + 1);
    }
  }, [currentTracked, currentTarget, collectedPoints, currentTargetIndex, startTime]);

  const handleStart = () => {
    setPhase('collecting');
    setCurrentTargetIndex(0);
    setCollectedPoints([]);
    setHoldProgress(0);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    holdStartRef.current = null;
  };

  const handleRetry = () => {
    setPhase('instructions');
    setCurrentTargetIndex(0);
    setCollectedPoints([]);
    setHoldProgress(0);
    setResult(null);
  };

  const handleAccept = () => {
    onComplete(result);
  };

  const handleCancel = () => {
    onComplete(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={handleCancel}
        className="absolute top-6 right-6 p-2 rounded-xl bg-surface hover:bg-card text-secondary hover:text-white transition-all z-10"
        aria-label="Cancel calibration"
      >
        <X size={20} />
      </button>

      {phase === 'instructions' && (
        <div className="max-w-lg text-center space-y-6 p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Target className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Quick Calibration</h2>
          <p className="text-secondary leading-relaxed">
            Move your hand (or head) to point at each target as it appears. Hold
            steady for about 1.5 seconds on each target. There are{' '}
            <span className="text-white font-semibold">{CALIBRATION_TARGETS.length} targets</span>
            . This should take under 30 seconds.
          </p>

          {!isDetecting && (
            <div className="flex items-center gap-2 justify-center text-amber-400 text-sm">
              <AlertTriangle size={16} />
              <span>Start tracking first so your hand/head is detected.</span>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleStart}
              disabled={!isDetecting}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all"
            >
              Begin Calibration
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-surface hover:bg-card text-secondary rounded-xl font-medium transition-all border border-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === 'collecting' && currentTarget && (
        <>
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-surface">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{
                width: `${((currentTargetIndex) / CALIBRATION_TARGETS.length) * 100}%`,
              }}
            />
          </div>

          {/* Status bar */}
          <div className="absolute top-6 left-6 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-white/5">
              <Timer size={14} className="text-secondary" />
              <span className="text-white font-mono">{elapsedSeconds}s</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-surface border border-white/5 text-secondary">
              Target {currentTargetIndex + 1} / {CALIBRATION_TARGETS.length}
            </div>
            {!currentTracked && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400">
                <AlertTriangle size={14} />
                <span>Hand/face lost — hold still</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center">
            <p className="text-secondary text-sm">
              Point at the <span className="text-white font-semibold">{currentTarget.label}</span> target and hold steady
            </p>
          </div>

          {/* Target */}
          <div
            className="absolute"
            style={{
              left: `${currentTarget.screenX * 100}%`,
              top: `${currentTarget.screenY * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Outer ring progress */}
            <svg width="80" height="80" className="absolute -top-[40px] -left-[40px]">
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="rgba(99, 102, 241, 0.2)"
                strokeWidth="3"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - holdProgress)}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                className="transition-none"
              />
            </svg>
            {/* Center dot */}
            <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] animate-pulse" />
          </div>

          {/* Already collected targets — show green checks */}
          {collectedPoints.map((pt, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${pt.screenX * 100}%`,
                top: `${pt.screenY * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <CheckCircle2 size={24} className="text-green-400 opacity-50" />
            </div>
          ))}
        </>
      )}

      {phase === 'complete' && result && (
        <div className="max-w-lg text-center space-y-6 p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Calibration Complete</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-surface rounded-xl p-4 border border-white/5">
              <p className="text-secondary mb-1">Duration</p>
              <p className="text-white font-semibold text-lg">
                {(result.data.duration / 1000).toFixed(1)}s
              </p>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-white/5">
              <p className="text-secondary mb-1">Points</p>
              <p className="text-white font-semibold text-lg">
                {result.data.points.length}
              </p>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-white/5">
              <p className="text-secondary mb-1">X Range</p>
              <p className="text-white font-mono text-sm">
                {result.minX.toFixed(2)} – {result.maxX.toFixed(2)}
              </p>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-white/5">
              <p className="text-secondary mb-1">Y Range</p>
              <p className="text-white font-mono text-sm">
                {result.minY.toFixed(2)} – {result.maxY.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleAccept}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition-all"
            >
              Apply Calibration
            </button>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-6 py-3 bg-surface hover:bg-card text-secondary rounded-xl font-medium transition-all border border-white/5"
            >
              <RotateCcw size={16} /> Retry
            </button>
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className="max-w-lg text-center space-y-6 p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Calibration Failed</h2>
          <p className="text-secondary">
            Could not collect enough calibration data. Make sure your hand or head
            is visible and well-lit.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all"
            >
              Try Again
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-surface hover:bg-card text-secondary rounded-xl font-medium transition-all border border-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
