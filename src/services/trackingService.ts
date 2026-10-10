import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { CalibrationResult } from './calibrationService';
import { mapWithCalibration } from './calibrationService';

export interface TrackingCoordinates {
  x: number;
  y: number;
  confidence: number;
  landmarks: any[];
  gesture?: 'pointer' | 'scroll';
}

export type TrackingCallback = (coords: TrackingCoordinates | null) => void;

class TrackingService {
  private handLandmarker: HandLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isTracking: boolean = false;
  private animationFrameId: number | null = null;
  private callback: TrackingCallback | null = null;
  private debugCanvas: HTMLCanvasElement | null = null;
  private debugCtx: CanvasRenderingContext2D | null = null;

  // Smoothing properties
  private lastX: number = 0;
  private lastY: number = 0;

  // Calibration
  private calibration: CalibrationResult | null = null;

  // Track initialization
  private initPromise: Promise<void> | null = null;

  setDebugCanvas(canvas: HTMLCanvasElement | null) {
    this.debugCanvas = canvas;
    this.debugCtx = canvas ? canvas.getContext('2d') : null;
  }

  setCalibration(cal: CalibrationResult | null) {
    this.calibration = cal;
  }

  getCalibration(): CalibrationResult | null {
    return this.calibration;
  }

  async initialize() {
    if (this.handLandmarker) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });
    })();

    return this.initPromise;
  }

  async start(videoEl: HTMLVideoElement, stream: MediaStream, onTrackingUpdate: TrackingCallback) {
    await this.initialize();

    this.videoElement = videoEl;
    this.callback = onTrackingUpdate;
    this.isTracking = true;

    try {
      this.videoElement.srcObject = stream;

      return new Promise<boolean>((resolve) => {
        if (!this.videoElement) return resolve(false);
        
        const startDetecting = () => {
          if (this.videoElement) this.videoElement.play();
          if (this.animationFrameId === null) {
            this.detect();
          }
          resolve(true);
        };

        this.videoElement.onloadeddata = startDetecting;
        if (this.videoElement.readyState >= 2) {
          startDetecting();
        }
      });
    } catch (err) {
      console.error('Failed to start tracking with provided stream', err);
      return false;
    }
  }

  private drawLandmarks(landmarks: any[]) {
    if (!this.debugCanvas || !this.debugCtx || !this.videoElement) return;

    const ctx = this.debugCtx;
    const canvas = this.debugCanvas;

    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#22d3ee';
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [5, 9], [9, 10], [10, 11], [11, 12],
      [9, 13], [13, 14], [14, 15], [15, 16],
      [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
    ];

    ctx.beginPath();
    for (const [start, end] of connections) {
      if (landmarks[start] && landmarks[end]) {
        const sx = (1 - landmarks[start].x) * canvas.width;
        const sy = landmarks[start].y * canvas.height;
        const ex = (1 - landmarks[end].x) * canvas.width;
        const ey = landmarks[end].y * canvas.height;
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
      }
    }
    ctx.stroke();

    for (const lm of landmarks) {
      const x = (1 - lm.x) * canvas.width;
      const y = lm.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Highlight index finger tip
    const tip = landmarks[8];
    if (tip) {
      ctx.fillStyle = '#f59e0b';
      const tx = (1 - tip.x) * canvas.width;
      const ty = tip.y * canvas.height;
      ctx.beginPath();
      ctx.arc(tx, ty, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  private lastVideoTime = -1;

  private videoFrameCallbackId: number | null = null;
  private isPaused: boolean = false;
  private freshFramesRequired: number = 0;

  private scheduleNextFrame = () => {
    if (!this.isTracking || this.isPaused || !this.videoElement) return;

    if ('requestVideoFrameCallback' in this.videoElement) {
      this.videoFrameCallbackId = (this.videoElement as any).requestVideoFrameCallback(this.detect);
    } else {
      this.animationFrameId = requestAnimationFrame(this.detect);
    }
  };

  pause() {
    this.isPaused = true;

    if (this.videoFrameCallbackId !== null && this.videoElement && 'cancelVideoFrameCallback' in this.videoElement) {
      (this.videoElement as any).cancelVideoFrameCallback(this.videoFrameCallbackId);
      this.videoFrameCallbackId = null;
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.debugCtx && this.debugCanvas) {
      this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
    }

    this.resetSmoothing();
  }

  resume() {
    if (!this.isTracking || !this.videoElement) return;
    this.isPaused = false;
    this.resetSmoothing();
    this.lastVideoTime = -1;
    this.freshFramesRequired = 2; // Require 2 clean frames before dispatching pointer
    this.scheduleNextFrame();
  }

  resetSmoothing() {
    this.lastX = 0;
    this.lastY = 0;
  }

  private detect = () => {
    if (!this.isTracking || this.isPaused || !this.videoElement || !this.handLandmarker) return;

    const startTimeMs = performance.now();

    if (this.videoElement.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.videoElement.currentTime;
      try {
        const results = this.handLandmarker.detectForVideo(this.videoElement, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
          const lms = results.landmarks[0];
          const indexFingerTip = lms[8];
          const confidence = results.handednesses?.[0]?.[0]?.score ?? 0.8;

          // Gate low confidence frames (< 0.55) or frames during post-resume warmup
          if (confidence < 0.55) {
            this.scheduleNextFrame();
            return;
          }

          if (this.freshFramesRequired > 0) {
            this.freshFramesRequired--;
            this.drawLandmarks(lms);
            this.scheduleNextFrame();
            return;
          }

          // Simple gesture detection for scrolling (index and middle fingers up, ring and pinky down)
          // Y is 0 at top, 1 at bottom, so "up" means tip.y < pip.y
          const isExtended = (tip: number, pip: number) => lms[tip].y < lms[pip].y;
          const indexUp = isExtended(8, 6);
          const middleUp = isExtended(12, 10);
          const ringUp = isExtended(16, 14);
          const pinkyUp = isExtended(20, 18);

          let gesture: 'pointer' | 'scroll' = 'pointer';
          if (indexUp && middleUp && !ringUp && !pinkyUp) {
            gesture = 'scroll';
          }

          this.drawLandmarks(lms);

          if (this.callback) {
            this.callback({
              x: indexFingerTip.x,
              y: indexFingerTip.y,
              confidence,
              landmarks: lms,
              gesture,
            });
          }
        } else {
          if (this.debugCtx && this.debugCanvas) {
            this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
          }
          if (this.callback) this.callback(null);
        }
      } catch {
        // Ignore MediaPipe monotonic timestamp errors
      }
    }

    this.scheduleNextFrame();
  };

  stop() {
    this.isTracking = false;
    this.isPaused = false;
    this.freshFramesRequired = 0;

    if (this.videoFrameCallbackId !== null && this.videoElement && 'cancelVideoFrameCallback' in this.videoElement) {
      (this.videoElement as any).cancelVideoFrameCallback(this.videoFrameCallbackId);
      this.videoFrameCallbackId = null;
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.debugCtx && this.debugCanvas) {
      this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
    }

    this.lastX = 0;
    this.lastY = 0;
    this.lastVideoTime = -1;
    this.videoElement = null;
    this.callback = null;
  }

  /**
   * Map raw tracked coordinates to screen pixels.
   * Uses calibration data if available, otherwise falls back to default range mapping.
   * Incorporates deadZone and adaptive velocity-based smoothing.
   */
  applySmoothing(
    rawX: number,
    rawY: number,
    viewportWidth: number,
    viewportHeight: number,
    smoothingFactor: number,
    sensitivity: number = 5,
    deadZone: number = 5
  ): { x: number; y: number } {
    let effectiveX: number;
    let effectiveY: number;

    if (this.calibration) {
      const mapped = mapWithCalibration(rawX, rawY, this.calibration);
      effectiveX = mapped.x;
      effectiveY = mapped.y;
    } else {
      // Default fallback mapping: camera [0.2, 0.8] → screen [0, 1]
      effectiveX = Math.max(0, Math.min(1, (rawX - 0.2) / 0.6));
      effectiveY = Math.max(0, Math.min(1, (rawY - 0.2) / 0.6));
    }

    // Apply sensitivity scaling (1-10, centered at 5)
    // > 5 amplifies movement from center, < 5 dampens it
    const sensScale = 0.5 + (sensitivity / 10);
    const cx = 0.5;
    const cy = 0.5;
    effectiveX = cx + (effectiveX - cx) * sensScale;
    effectiveY = cy + (effectiveY - cy) * sensScale;
    effectiveX = Math.max(0, Math.min(1, effectiveX));
    effectiveY = Math.max(0, Math.min(1, effectiveY));

    const targetX = (1 - effectiveX) * viewportWidth;
    const targetY = effectiveY * viewportHeight;

    // First sample initialization
    if (this.lastX === 0 && this.lastY === 0) {
      this.lastX = targetX;
      this.lastY = targetY;
      return { x: this.lastX, y: this.lastY };
    }

    const dx = targetX - this.lastX;
    const dy = targetY - this.lastY;
    const distance = Math.hypot(dx, dy);

    // Dead zone: ignore micro-tremors below the threshold
    if (distance < deadZone) {
      return { x: this.lastX, y: this.lastY };
    }

    // Velocity-adaptive smoothing:
    // When moving quickly, increase alpha to eliminate lag.
    // When dwelling/slow, use base smoothing for rock-solid stability.
    const baseAlpha = Math.max(0.08, 0.45 - (smoothingFactor - 1) * 0.04);
    const speedFactor = Math.min(1.0, (distance - deadZone) / 80);
    const alpha = Math.min(0.85, baseAlpha + speedFactor * 0.4);

    this.lastX = this.lastX + alpha * dx;
    this.lastY = this.lastY + alpha * dy;

    this.lastX = Math.max(0, Math.min(viewportWidth, this.lastX));
    this.lastY = Math.max(0, Math.min(viewportHeight, this.lastY));

    return { x: this.lastX, y: this.lastY };
  }
}

export const trackingService = new TrackingService();
