import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import type { TrackingCallback } from './trackingService';

/**
 * HeadTrackingService uses MediaPipe FaceLandmarker to detect the nose tip
 * and map head movement to pointer coordinates.
 *
 * It reuses the same video element and stream as the hand tracker — only one
 * runs at a time, selected via the tracking mode in settings.
 */
class HeadTrackingService {
  private faceLandmarker: FaceLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isTracking: boolean = false;
  private animationFrameId: number | null = null;
  private callback: TrackingCallback | null = null;
  private debugCanvas: HTMLCanvasElement | null = null;
  private debugCtx: CanvasRenderingContext2D | null = null;

  // Smoothing
  private lastX: number = 0;
  private lastY: number = 0;

  // Track initialization state
  private initPromise: Promise<void> | null = null;

  setDebugCanvas(canvas: HTMLCanvasElement | null) {
    this.debugCanvas = canvas;
    this.debugCtx = canvas ? canvas.getContext('2d') : null;
  }

  async initialize() {
    if (this.faceLandmarker) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
    })();

    return this.initPromise;
  }

  async start(
    videoEl: HTMLVideoElement,
    stream: MediaStream,
    onTrackingUpdate: TrackingCallback
  ) {
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
      console.error('[HeadTracking] Failed to start', err);
      return false;
    }
  }

  private drawFaceLandmarks(landmarks: any[]) {
    if (!this.debugCanvas || !this.debugCtx) return;

    const ctx = this.debugCtx;
    const canvas = this.debugCanvas;

    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw key face landmarks (subset for performance)
    ctx.fillStyle = '#22d3ee';
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 1;

    // Draw a subset of points to show the face outline
    // Face oval indices (approximate)
    const faceOval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323,
      361, 288, 397, 365, 379, 378, 400, 377, 152, 148,
      176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
      162, 21, 54, 103, 67, 109];

    // Draw face oval
    ctx.beginPath();
    for (let i = 0; i < faceOval.length; i++) {
      const lm = landmarks[faceOval[i]];
      if (!lm) continue;
      const x = (1 - lm.x) * canvas.width;
      const y = lm.y * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Highlight nose tip (landmark 1)
    const noseTip = landmarks[1];
    if (noseTip) {
      const nx = (1 - noseTip.x) * canvas.width;
      const ny = noseTip.y * canvas.height;
      ctx.fillStyle = '#f59e0b'; // amber for nose
      ctx.beginPath();
      ctx.arc(nx, ny, 5, 0, 2 * Math.PI);
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
    this.freshFramesRequired = 2;
    this.scheduleNextFrame();
  }

  resetSmoothing() {
    this.lastX = 0;
    this.lastY = 0;
  }

  private detect = () => {
    if (!this.isTracking || this.isPaused || !this.videoElement || !this.faceLandmarker) return;

    const startTimeMs = performance.now();

    if (this.videoElement.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.videoElement.currentTime;
      try {
        const results = this.faceLandmarker.detectForVideo(this.videoElement, startTimeMs);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const faceLandmarks = results.faceLandmarks[0];
          // Use nose tip (landmark index 1) for pointer control
          const noseTip = faceLandmarks[1];

          if (this.freshFramesRequired > 0) {
            this.freshFramesRequired--;
            this.drawFaceLandmarks(faceLandmarks);
            this.scheduleNextFrame();
            return;
          }

          this.drawFaceLandmarks(faceLandmarks);

          if (this.callback) {
            this.callback({
              x: noseTip.x,
              y: noseTip.y,
              confidence: 0.85,
              landmarks: faceLandmarks,
              gesture: 'pointer',
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

  applySmoothing(
    rawX: number,
    rawY: number,
    viewportWidth: number,
    viewportHeight: number,
    smoothingFactor: number,
    sensitivity: number = 5,
    deadZone: number = 5
  ): { x: number; y: number } {
    // Head tracking has a smaller natural range — map [0.3, 0.7] to full screen
    let effectiveX = Math.max(0, Math.min(1, (rawX - 0.3) / 0.4));
    let effectiveY = Math.max(0, Math.min(1, (rawY - 0.3) / 0.4));

    // Sensitivity scaling
    const sensScale = 0.5 + (sensitivity / 10);
    effectiveX = 0.5 + (effectiveX - 0.5) * sensScale;
    effectiveY = 0.5 + (effectiveY - 0.5) * sensScale;
    effectiveX = Math.max(0, Math.min(1, effectiveX));
    effectiveY = Math.max(0, Math.min(1, effectiveY));

    const targetX = (1 - effectiveX) * viewportWidth;
    const targetY = effectiveY * viewportHeight;

    if (this.lastX === 0 && this.lastY === 0) {
      this.lastX = targetX;
      this.lastY = targetY;
      return { x: this.lastX, y: this.lastY };
    }

    const dx = targetX - this.lastX;
    const dy = targetY - this.lastY;
    const distance = Math.hypot(dx, dy);

    if (distance < deadZone) {
      return { x: this.lastX, y: this.lastY };
    }

    const baseAlpha = Math.max(0.05, 0.4 - (smoothingFactor - 1) * 0.04);
    const speedFactor = Math.min(1.0, (distance - deadZone) / 80);
    const alpha = Math.min(0.85, baseAlpha + speedFactor * 0.4);

    this.lastX = this.lastX + alpha * dx;
    this.lastY = this.lastY + alpha * dy;

    this.lastX = Math.max(0, Math.min(viewportWidth, this.lastX));
    this.lastY = Math.max(0, Math.min(viewportHeight, this.lastY));

    return { x: this.lastX, y: this.lastY };
  }
}

export const headTrackingService = new HeadTrackingService();
