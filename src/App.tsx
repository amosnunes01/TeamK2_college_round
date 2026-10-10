import React, { useState, useCallback, useRef, useEffect } from 'react';
import type {
  InteractionState,
  TrackingHealth,
  PermissionStatus,
  CommandHistoryEntry,
  HandsfreeSettings,
  PointerPosition,
} from './types';
import { Header } from './components/layout/Header';
import { Sidebar, type SidebarTab } from './components/layout/Sidebar';
import { ControlBar } from './components/layout/ControlBar';
import { PointerOverlay } from './components/layout/PointerOverlay';
import { TargetHighlight } from './components/layout/TargetHighlight';
import { CalibrationOverlay } from './components/calibration/CalibrationOverlay';
import { DashboardView } from './components/dashboard/DashboardView';
import { BrowseWorkspace } from './components/browse/BrowseWorkspace';
import { EvaluationView } from './components/evaluation/EvaluationView';
import { SettingsView } from './components/settings/SettingsView';
import { loadSettings, saveSettings } from './services/settingsService';
import { trackingService } from './services/trackingService';
import { headTrackingService } from './services/headTrackingService';
import { voiceService } from './services/voiceService';
import {
  loadCalibration,
  saveCalibration,
  type CalibrationResult,
} from './services/calibrationService';
import { getWsClient } from './services/handsfreeWsClient';

import { useIntentGuard } from './hooks/useIntentGuard';

export const App: React.FC = () => {
  // ---- State ----
  const [activeTab, setActiveTab] = useState<SidebarTab>('dashboard');
  const [settings, setSettings] = useState<HandsfreeSettings>(() => loadSettings());
  const [isTracking, setIsTracking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interactionState, setInteractionState] = useState<InteractionState>('idle');
  const [commandHistory, _setCommandHistory] = useState<CommandHistoryEntry[]>([]);
  void _setCommandHistory;

  const [pointerPosition, setPointerPosition] = useState<PointerPosition | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // IntentGuard
  const intentGuard = useIntentGuard({
    pointerPosition,
    settings,
    interactionState,
    setInteractionState,
    isTracking
  });

  // Calibration
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(
    () => loadCalibration()
  );
  // Raw tracked position for calibration overlay (normalized 0-1)
  const rawTrackedRef = useRef<{ x: number; y: number } | null>(null);
  const [rawTrackedForCalibration, setRawTrackedForCalibration] = useState<{ x: number; y: number } | null>(null);

  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    camera: 'prompt',
    microphone: 'prompt',
  });

  const [trackingHealth, setTrackingHealth] = useState<TrackingHealth>({
    isTracking: false,
    confidence: 0,
    fps: 0,
    landmarksDetected: false,
    lastUpdate: 0,
    message: 'Tracking not started.',
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const fpsRef = useRef<{ frames: number; lastTime: number }>({
    frames: 0,
    lastTime: performance.now(),
  });
  const lastScrollY = useRef<number | null>(null);
  const lastReactUpdate = useRef<number>(0);

  // Apply loaded calibration to tracking service on mount
  useEffect(() => {
    if (calibrationResult) {
      trackingService.setCalibration(calibrationResult);
    }
  }, [calibrationResult]);

  // ---- Handlers ----
  const handleSettingsChange = useCallback((next: Partial<HandsfreeSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      saveSettings(merged);
      return merged;
    });
  }, []);

  // Shared tracking callback for both hand and head modes
  const makeTrackingCallback = useCallback(
    (mode: 'hand' | 'head') => {
      return (coords: import('./services/trackingService').TrackingCoordinates | null) => {
        const now = performance.now();
        fpsRef.current.frames++;
        let fps = 0;
        if (now - fpsRef.current.lastTime >= 1000) {
          fps = fpsRef.current.frames;
          fpsRef.current.frames = 0;
          fpsRef.current.lastTime = now;
        }

        if (coords) {
          // Store raw for calibration
          rawTrackedRef.current = { x: coords.x, y: coords.y };
          setRawTrackedForCalibration({ x: coords.x, y: coords.y });

          const service = mode === 'head' ? headTrackingService : trackingService;
          const mapped = service.applySmoothing(
            coords.x,
            coords.y,
            window.innerWidth,
            window.innerHeight,
            settings.smoothing,
            settings.sensitivity
          );

          setPointerPosition({
            x: mapped.x,
            y: mapped.y,
            confidence: coords.confidence,
            timestamp: now,
            gesture: coords.gesture
          });

          // Hand scrolling logic
          if (coords.gesture === 'scroll') {
            if (lastScrollY.current !== null) {
              const deltaY = mapped.y - lastScrollY.current;
              if (Math.abs(deltaY) > settings.scrollDeadZone) {
                const scrollContainer = document.querySelector('main > div, .overflow-y-auto');
                const target = scrollContainer || window;
                target.scrollBy({ top: deltaY * (settings.scrollSensitivity * 0.5) });
                lastScrollY.current = mapped.y;
              }
            } else {
              lastScrollY.current = mapped.y;
            }
          } else {
            lastScrollY.current = mapped.y;
          }

          // Broadcast to extension via WebSocket Bridge
          getWsClient()?.send({
            type: 'HANDSFREE_BROADCAST',
            payload: {
              x: mapped.x,
              y: mapped.y,
              gesture: coords.gesture,
              isTracking: true
            }
          });

          setTrackingHealth({
            isTracking: true,
            confidence: coords.confidence,
            fps: fps || undefined as any, // keep previous fps between second ticks
            landmarksDetected: true,
            lastUpdate: now,
            message: mode === 'head' ? 'Head tracking active' : 'Hand tracking active',
          });
        } else {
          rawTrackedRef.current = null;
          setRawTrackedForCalibration(null);
          setPointerPosition(null);
          setTrackingHealth((prev) => ({
            ...prev,
            isTracking: true,
            confidence: 0,
            landmarksDetected: false,
            lastUpdate: now,
            message: mode === 'head' ? 'Face lost' : 'Hand lost',
          }));
        }
      };
    },
    [settings.smoothing, settings.sensitivity]
  );

  const handleStart = useCallback(async () => {
    if (!videoRef.current) return;

    setInteractionState('tracking');
    setIsTracking(true);
    setTrackingHealth((prev) => ({
      ...prev,
      isTracking: true,
      message: 'Requesting camera access...',
    }));

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      setPermissionStatus((p) => ({ ...p, camera: 'granted' }));
      setMediaStream(stream);
    } catch {
      setPermissionStatus((p) => ({ ...p, camera: 'denied' }));
      setIsTracking(false);
      setInteractionState('error');
      setTrackingHealth((prev) => ({
        ...prev,
        isTracking: false,
        message: 'Camera access denied.',
      }));
      return;
    }

    const mode = settings.trackingMode;
    const modelLabel = mode === 'head' ? 'FaceLandmarker' : 'HandLandmarker';
    setTrackingHealth((prev) => ({
      ...prev,
      message: `Initializing ${modelLabel}...`,
    }));

    const callback = makeTrackingCallback(mode === 'head' ? 'head' : 'hand');

    let success: boolean;
    if (mode === 'head') {
      success = await headTrackingService.start(videoRef.current, stream, callback);
    } else {
      success = await trackingService.start(videoRef.current, stream, callback);
    }

    if (!success) {
      // Release the camera if tracking failed to start
      stream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
      setIsTracking(false);
      setInteractionState('error');
      setTrackingHealth((prev) => ({
        ...prev,
        isTracking: false,
        message: `${modelLabel} initialization failed.`,
      }));
    }
  }, [settings.trackingMode, makeTrackingCallback]);

  const handlePause = useCallback(() => {
    setInteractionState('paused');
  }, []);

  const handleResume = useCallback(() => {
    setInteractionState('tracking');
  }, []);

  const handleStop = useCallback(() => {
    trackingService.stop();
    headTrackingService.stop();

    // Release camera
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }

    setIsTracking(false);
    setInteractionState('idle');
    setPointerPosition(null);
    setMediaStream(null);
    rawTrackedRef.current = null;
    setRawTrackedForCalibration(null);
    setTrackingHealth({
      isTracking: false,
      confidence: 0,
      fps: 0,
      landmarksDetected: false,
      lastUpdate: 0,
      message: 'Tracking stopped',
    });
  }, [mediaStream]);

  const handleRecalibrate = useCallback(() => {
    setShowCalibration(true);
  }, []);

  const handleCalibrationComplete = useCallback(
    (result: CalibrationResult | null) => {
      setShowCalibration(false);
      if (result) {
        setCalibrationResult(result);
        saveCalibration(result);
        trackingService.setCalibration(result);
      }
    },
    []
  );

  const handleToggleListening = useCallback(() => {
    if (isListening) {
      voiceService.stop();
    } else {
      voiceService.start();
    }
  }, [isListening]);

  // Voice Service Setup
  useEffect(() => {
    voiceService.setCallbacks(
      (command) => {
        let executed = false;
        
        // Execute command logic
        if (command.type === 'control') {
          if (command.parsed === 'pause control') {
            setInteractionState('paused');
            executed = true;
          } else if (command.parsed === 'resume control') {
            setInteractionState('tracking');
            executed = true;
          } else if (command.parsed === 'start dictation') {
            executed = true;
          } else if (command.parsed === 'stop dictation') {
            executed = true;
          } else if (command.parsed === 'start session') {
            handleStart();
            executed = true;
          } else if (command.parsed === 'stop session') {
            handleStop();
            executed = true;
          }
        } else if (command.type === 'navigation') {
          // Find the main scrollable container (either Dashboard or Browse Workspace)
          const scrollContainer = document.querySelector('main > div, .overflow-y-auto');
          const target = scrollContainer || window;

          if (command.parsed === 'scroll down') {
            target.scrollBy({ top: window.innerHeight / 2, behavior: 'smooth' });
            getWsClient()?.send({ type: 'HANDSFREE_VOICE_COMMAND', command: 'scroll down' });
            executed = true;
          } else if (command.parsed === 'scroll up') {
            target.scrollBy({ top: -window.innerHeight / 2, behavior: 'smooth' });
            getWsClient()?.send({ type: 'HANDSFREE_VOICE_COMMAND', command: 'scroll up' });
            executed = true;
          } else if (command.parsed === 'scroll to top') {
            target.scrollTo({ top: 0, behavior: 'smooth' });
            getWsClient()?.send({ type: 'HANDSFREE_VOICE_COMMAND', command: 'scroll to top' });
            executed = true;
          } else if (command.parsed === 'scroll to bottom') {
            // For window, document.body.scrollHeight. For element, target.scrollHeight
            const scrollHeight = target === window ? document.body.scrollHeight : (target as Element).scrollHeight;
            target.scrollTo({ top: scrollHeight, behavior: 'smooth' });
            getWsClient()?.send({ type: 'HANDSFREE_VOICE_COMMAND', command: 'scroll to bottom' });
            executed = true;
          } else if (command.parsed === 'go back') {
            window.history.back();
            getWsClient()?.send({ type: 'HANDSFREE_VOICE_COMMAND', command: 'go back' });
            executed = true;
          } else if (command.parsed === 'go forward') {
            window.history.forward();
            getWsClient()?.send({ type: 'HANDSFREE_VOICE_COMMAND', command: 'go forward' });
            executed = true;
          } else if (command.parsed === 'open home') {
            // Support both global dashboard reset and workspace home
            setActiveTab('dashboard');
            window.dispatchEvent(new CustomEvent('handsfree:home'));
            executed = true;
          } else if (command.parsed === 'go to settings') {
            setActiveTab('settings');
            executed = true;
          }
        } else if (command.type === 'action') {
          if (command.parsed === 'click' || command.parsed === 'select' || command.parsed === 'confirm' || command.parsed === 'cancel') {
            // Delegate to IntentGuard for safe activation
            intentGuard.handleVoiceCommand(command);
            executed = true;
            
            // Broadcast click to extension
            if (command.parsed === 'click' || command.parsed === 'select') {
              getWsClient()?.send({ type: 'HANDSFREE_CLICK' });
            }
          } else if (command.parsed === 'clear text') {
            const el = document.activeElement;
            if (el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
              el.value = '';
              el.dispatchEvent(new Event('input', { bubbles: true }));
              executed = true;
            }
            getWsClient()?.send({ type: 'HANDSFREE_VOICE_COMMAND', command: 'clear text' });
          }
        } else if (command.type === 'dictation') {
          const el = document.activeElement;
          if (el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
            // Append text to input
            el.value = el.value ? el.value + ' ' + command.parsed : command.parsed;
            // Dispatch input event for React
            el.dispatchEvent(new Event('input', { bubbles: true }));
            executed = true;
          }
          getWsClient()?.send({ type: 'HANDSFREE_VOICE_COMMAND', command: 'dictate', text: command.parsed });
        }

        command.executed = executed;
        
        // Don't clutter history with unrecognized ambient noise
        if (command.type !== 'unknown') {
          _setCommandHistory(prev => {
            const newHistory: CommandHistoryEntry[] = [...prev, {
              command,
              result: executed ? 'executed' : (command.type === 'action' ? 'error' : 'blocked'),
              timestamp: command.timestamp
            }];
            return newHistory.slice(-50); // keep last 50
          });
        }
      },
      () => {
        // We could show real-time transcript here, but command history covers the final commands well.
      },
      (err) => {
        if (err === 'not-allowed') {
          setPermissionStatus(p => ({ ...p, microphone: 'denied' }));
        }
      },
      (listening) => {
        setIsListening(listening);
        if (listening) {
          setPermissionStatus(p => ({ ...p, microphone: 'granted' }));
        }
      }
    );
  }, [pointerPosition, handleStart, handleStop]);

  // Cleanup
  useEffect(() => {
    return () => {
      trackingService.stop();
      headTrackingService.stop();
      voiceService.stop();
    };
  }, []);

  // ---- Render ----
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            isTracking={isTracking}
            trackingHealth={trackingHealth}
            interactionState={interactionState}
            commandHistory={commandHistory}
            settings={settings}
            permissionStatus={permissionStatus}
            mediaStream={mediaStream}
            calibrationResult={calibrationResult}
            pointerPosition={pointerPosition}
            currentTarget={intentGuard.currentTarget}
            pendingAction={intentGuard.pendingAction}
            activationRecords={intentGuard.activationRecords}
            onSettingsChange={handleSettingsChange}
            onStartTracking={isTracking ? handleStop : handleStart}
            onRecalibrate={handleRecalibrate}
          />
        );
      case 'browse':
        return <BrowseWorkspace />;
      case 'evaluation':
        return <EvaluationView />;
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        );
      default:
        return null;
    }
  };

  const textSizeClass =
    settings.textSize === 'small'
      ? 'text-sm'
      : settings.textSize === 'large'
      ? 'text-lg'
      : 'text-base';

  return (
    <div className={`h-screen flex flex-col bg-background ${textSizeClass}`}>
      <PointerOverlay
        position={pointerPosition}
        isTracking={isTracking && interactionState !== 'paused'}
        pendingAction={intentGuard.pendingAction}
      />
      <TargetHighlight
        target={intentGuard.currentTarget}
        interactionState={interactionState}
      />

      {/* Calibration overlay */}
      {showCalibration && (
        <CalibrationOverlay
          onComplete={handleCalibrationComplete}
          currentTracked={rawTrackedForCalibration}
          isDetecting={isTracking && trackingHealth.landmarksDetected}
        />
      )}

      {/* Hidden video for processing */}
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      {/* Header */}
      <Header
        isTracking={isTracking}
        permissionStatus={permissionStatus}
        trackingHealth={trackingHealth}
      />

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 flex flex-col overflow-hidden animate-fade-in relative z-0">
          {renderContent()}
        </main>
      </div>

      {/* Control Bar */}
      <ControlBar
        isTracking={isTracking}
        interactionState={interactionState}
        isListening={isListening}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        onRecalibrate={handleRecalibrate}
        onToggleListening={handleToggleListening}
      />
    </div>
  );
};
