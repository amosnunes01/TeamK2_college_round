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

type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'handsfree-theme';
const getActiveScrollContainer = () => document.querySelector<HTMLElement>('[data-handsfree-scroll-container]');

const scrollActivePane = (top: number, behavior: ScrollBehavior = 'smooth') => {
  const container = getActiveScrollContainer();
  if (container) {
    container.scrollBy({ top, behavior });
  } else {
    window.scrollBy({ top, behavior });
  }
};

const getActiveTextField = (): HTMLInputElement | HTMLTextAreaElement | null => {
  const element = document.activeElement;
  if (element instanceof HTMLTextAreaElement) {
    return element.disabled || element.readOnly ? null : element;
  }
  if (element instanceof HTMLInputElement) {
    const textTypes = ['text', 'search', 'email', 'tel', 'url', 'password', 'number'];
    return element.disabled || element.readOnly || !textTypes.includes(element.type) ? null : element;
  }
  return null;
};

const setTextFieldValue = (field: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  const prototype = field instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (valueSetter) valueSetter.call(field, value);
  else field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
};

const insertDictatedText = (text: string): boolean => {
  const field = getActiveTextField();
  const content = text.trim();
  if (!field || !content) return false;

  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? start;
  const prefix = field.value.slice(0, start);
  const separator = prefix && !/\s$/.test(prefix) && !/^[,.;:!?)]/.test(content) ? ' ' : '';
  const insertion = `${separator}${content}`;
  const nextValue = `${field.value.slice(0, start)}${insertion}${field.value.slice(end)}`;
  setTextFieldValue(field, nextValue);

  try {
    const caret = start + insertion.length;
    field.setSelectionRange(caret, caret);
  } catch {
    // Some input types do not support selection ranges.
  }
  return true;
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export const App: React.FC = () => {
  // ---- State ----
  const [activeTab, setActiveTab] = useState<SidebarTab>('dashboard');
  const [settings, setSettings] = useState<HandsfreeSettings>(() => loadSettings());
  const settingsRef = useRef(settings);
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [isTracking, setIsTracking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [interactionState, setInteractionState] = useState<InteractionState>('idle');
  const [commandHistory, _setCommandHistory] = useState<CommandHistoryEntry[]>([]);
  void _setCommandHistory;
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string | null>(null);

  const [pointerPosition, setPointerPosition] = useState<PointerPosition | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Broadcast click to WebSocket bridge only (no extension window.postMessage)
  const broadcastClick = useCallback(() => {
    getWsClient()?.send({ type: 'HANDSFREE_CLICK' });
  }, []);

  // IntentGuard
  const intentGuard = useIntentGuard({
    pointerPosition,
    settings,
    interactionState,
    setInteractionState,
    isTracking,
    onActionExecute: () => {
      broadcastClick();
    }
  });
  const intentGuardRef = useRef(intentGuard);
  useEffect(() => {
    intentGuardRef.current = intentGuard;
  }, [intentGuard]);

  // Calibration
  const [showCalibration, setShowCalibration] = useState(false);
  const showCalibrationRef = useRef(false);
  useEffect(() => {
    showCalibrationRef.current = showCalibration;
  }, [showCalibration]);

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
    lastTime: 0,
  });
  const lastHealthUpdateRef = useRef<number>(0);
  const lastScrollY = useRef<number | null>(null);
  const scrollGestureActiveRef = useRef(false);
  const pendingScrollDeltaYRef = useRef<number>(0);
  const scrollRafIdRef = useRef<number | null>(null);
  const isPausedRef = useRef<boolean>(false);
  const trackingStartRequestRef = useRef(0);
  const trackingStartInProgressRef = useRef(false);

  // Smooth scroll animator using requestAnimationFrame
  const startScrollDrain = useCallback(() => {
    if (scrollRafIdRef.current !== null) return;

    const drain = () => {
      if (Math.abs(pendingScrollDeltaYRef.current) > 0.5) {
        const step = pendingScrollDeltaYRef.current * 0.35;
        pendingScrollDeltaYRef.current -= step;

        const target = getActiveScrollContainer();
        if (target) {
          target.scrollTop += step;
        } else {
          window.scrollBy({ top: step, behavior: 'instant' });
        }

        scrollRafIdRef.current = requestAnimationFrame(drain);
      } else {
        pendingScrollDeltaYRef.current = 0;
        scrollRafIdRef.current = null;
      }
    };

    scrollRafIdRef.current = requestAnimationFrame(drain);
  }, []);

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

  const handleThemeToggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Shared tracking callback for both hand and head modes
  const makeTrackingCallback = useCallback(
    (mode: 'hand' | 'head') => {
      return (coords: import('./services/trackingService').TrackingCoordinates | null) => {
        if (isPausedRef.current) return;

        const now = performance.now();
        fpsRef.current.frames++;
        let currentFps = 0;
        if (fpsRef.current.lastTime === 0) {
          fpsRef.current.lastTime = now;
        } else if (now - fpsRef.current.lastTime >= 1000) {
          currentFps = fpsRef.current.frames;
          fpsRef.current.frames = 0;
          fpsRef.current.lastTime = now;
        }

        if (coords) {
          // Store raw for calibration only when overlay is visible
          rawTrackedRef.current = { x: coords.x, y: coords.y };
          if (showCalibrationRef.current) {
            setRawTrackedForCalibration({ x: coords.x, y: coords.y });
          }

          const service = mode === 'head' ? headTrackingService : trackingService;
          const activeSettings = settingsRef.current;
          const mapped = service.applySmoothing(
            coords.x,
            coords.y,
            window.innerWidth,
            window.innerHeight,
            activeSettings.smoothing,
            activeSettings.sensitivity,
            activeSettings.deadZone
          );

          setPointerPosition({
            x: mapped.x,
            y: mapped.y,
            confidence: coords.confidence,
            timestamp: now,
            gesture: coords.gesture
          });

          // Hand scrolling logic: coalesced via requestAnimationFrame
          if (coords.gesture === 'scroll') {
            if (!scrollGestureActiveRef.current || lastScrollY.current === null) {
              scrollGestureActiveRef.current = true;
              lastScrollY.current = mapped.y;
            } else {
              const deltaY = mapped.y - lastScrollY.current;
              if (Math.abs(deltaY) > activeSettings.scrollDeadZone) {
                pendingScrollDeltaYRef.current += deltaY * (activeSettings.scrollSensitivity * 0.4);
                startScrollDrain();
              }
              lastScrollY.current = mapped.y;
            }
          } else {
            scrollGestureActiveRef.current = false;
            lastScrollY.current = mapped.y;
          }

          // Send to WebSocket bridge (for evaluation/testing) — no extension postMessage
          getWsClient()?.send({
            type: 'HANDSFREE_BROADCAST',
            payload: {
              x: mapped.x,
              y: mapped.y,
              normX: mapped.x / window.innerWidth,
              normY: mapped.y / window.innerHeight,
              gesture: coords.gesture,
              isTracking: true,
            }
          });

          // Throttle tracking health updates to avoid excessive React tree re-renders
          if (now - lastHealthUpdateRef.current >= 500) {
            lastHealthUpdateRef.current = now;
            setTrackingHealth({
              isTracking: true,
              confidence: coords.confidence,
              fps: currentFps || 30,
              landmarksDetected: true,
              lastUpdate: now,
              message: mode === 'head' ? 'Head tracking active' : 'Hand tracking active',
            });
          }
        } else {
          // Tracking lost: suspend scroll immediately, cancel pending drain, and hide pointer
          scrollGestureActiveRef.current = false;
          lastScrollY.current = null;
          pendingScrollDeltaYRef.current = 0;
          if (scrollRafIdRef.current !== null) {
            cancelAnimationFrame(scrollRafIdRef.current);
            scrollRafIdRef.current = null;
          }

          rawTrackedRef.current = null;
          if (showCalibrationRef.current) {
            setRawTrackedForCalibration(null);
          }
          setPointerPosition(null);

          getWsClient()?.send({
            type: 'HANDSFREE_BROADCAST',
            payload: { x: 0, y: 0, normX: 0, normY: 0, isTracking: false }
          });

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
    [startScrollDrain]
  );

  const handleStart = useCallback(async () => {
    if (!videoRef.current || isTracking || trackingStartInProgressRef.current) return;

    trackingStartInProgressRef.current = true;
    const startRequest = ++trackingStartRequestRef.current;

    isPausedRef.current = false;
    setInteractionState('tracking');
    setIsTracking(true);
    setTrackingHealth((prev) => ({
      ...prev,
      isTracking: true,
      message: 'Requesting camera access...',
    }));

    if (settings.trackingMode === 'combined') {
      trackingStartInProgressRef.current = false;
      setIsTracking(false);
      setInteractionState('error');
      setTrackingHealth((prev) => ({
        ...prev,
        isTracking: false,
        message: 'Combined tracking is not available yet. Choose hand, head, or voice.',
      }));
      return;
    }

    if (settings.trackingMode === 'voice') {
      setTrackingHealth((prev) => ({ ...prev, message: 'Starting voice control...' }));
      const started = await voiceService.start();
      if (startRequest !== trackingStartRequestRef.current) {
        if (started) voiceService.stop();
        return;
      }

      trackingStartInProgressRef.current = false;
      if (!started) {
        setIsTracking(false);
        setInteractionState('error');
        setTrackingHealth((prev) => ({
          ...prev,
          isTracking: false,
          message: 'Voice control could not start. Check microphone access.',
        }));
        return;
      }

      setTrackingHealth({
        isTracking: true,
        confidence: 1,
        fps: 0,
        landmarksDetected: false,
        lastUpdate: performance.now(),
        message: 'Voice control active',
      });
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      setPermissionStatus((p) => ({ ...p, camera: 'granted' }));
      setMediaStream(stream);
    } catch {
      if (startRequest === trackingStartRequestRef.current) {
        trackingStartInProgressRef.current = false;
        setPermissionStatus((p) => ({ ...p, camera: 'denied' }));
        setIsTracking(false);
        setInteractionState('error');
        setTrackingHealth((prev) => ({
          ...prev,
          isTracking: false,
          message: 'Camera access denied.',
        }));
      }
      return;
    }

    if (startRequest !== trackingStartRequestRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    const mode = settings.trackingMode;
    const modelLabel = mode === 'head' ? 'FaceLandmarker' : 'HandLandmarker';
    setTrackingHealth((prev) => ({
      ...prev,
      message: `Initializing ${modelLabel}...`,
    }));

    const callback = makeTrackingCallback(mode === 'head' ? 'head' : 'hand');

    let success = false;
    try {
      if (mode === 'head') {
        success = await headTrackingService.start(videoRef.current, stream, callback);
      } else {
        success = await trackingService.start(videoRef.current, stream, callback);
      }
    } catch {
      success = false;
    }

    if (startRequest !== trackingStartRequestRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    trackingStartInProgressRef.current = false;
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
  }, [settings.trackingMode, makeTrackingCallback, isTracking]);

  const handlePause = useCallback(() => {
    if (!isTracking || interactionState === 'paused' || interactionState === 'error') return false;
    setInteractionState('paused');
    isPausedRef.current = true;

    // Pause active tracking service
    const service = settings.trackingMode === 'head' ? headTrackingService : trackingService;
    service.pause();

    lastScrollY.current = null;
    scrollGestureActiveRef.current = false;
    pendingScrollDeltaYRef.current = 0;
    if (scrollRafIdRef.current !== null) {
      cancelAnimationFrame(scrollRafIdRef.current);
      scrollRafIdRef.current = null;
    }

    setPointerPosition(null);
    getWsClient()?.send({ type: 'HANDSFREE_BROADCAST', payload: { x: 0, y: 0, normX: 0, normY: 0, isTracking: false } });
    return true;
  }, [settings.trackingMode, isTracking, interactionState]);

  const handleResume = useCallback(() => {
    if (!isTracking || interactionState !== 'paused') return false;
    isPausedRef.current = false;
    setInteractionState('tracking');

    lastScrollY.current = null;
    scrollGestureActiveRef.current = false;
    pendingScrollDeltaYRef.current = 0;

    // Resume active tracking service with fresh frame calibration
    const service = settings.trackingMode === 'head' ? headTrackingService : trackingService;
    service.resume();
    return true;
  }, [settings.trackingMode, isTracking, interactionState]);

  const handleStop = useCallback((stopListening = true) => {
    trackingStartRequestRef.current += 1;
    trackingStartInProgressRef.current = false;
    isPausedRef.current = false;
    trackingService.stop();
    headTrackingService.stop();
    if (stopListening) {
      voiceService.stop();
      setIsListening(false);
      setIsDictating(false);
    }

    // Release camera tracks cleanly
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }

    // Cancel scroll animations
    lastScrollY.current = null;
    pendingScrollDeltaYRef.current = 0;
    if (scrollRafIdRef.current !== null) {
      cancelAnimationFrame(scrollRafIdRef.current);
      scrollRafIdRef.current = null;
    }

    getWsClient()?.send({ type: 'HANDSFREE_STOP' });

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
      message: 'Session stopped',
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
      setIsDictating(false);
    } else {
      voiceService.start();
    }
  }, [isListening]);

  // Voice Service Setup
  useEffect(() => {
    voiceService.setCallbacks(
      (command) => {
        let executed = false;

        // Track last voice command for BrowseWorkspace status strip
        if (command.type !== 'unknown') {
          setLastVoiceCommand(command.parsed);
        }

        // Execute command logic
        if (command.type === 'control') {
          if (command.parsed === 'pause control') {
            executed = handlePause();
          } else if (command.parsed === 'resume control') {
            executed = handleResume();
          } else if (command.parsed === 'start listening') {
            setVoiceError(null);
            void voiceService.start();
            executed = true;
          } else if (command.parsed === 'stop listening') {
            voiceService.stop();
            setIsDictating(false);
            executed = true;
          } else if (command.parsed === 'enable light mode') {
            setTheme('light');
            executed = true;
          } else if (command.parsed === 'enable dark mode') {
            setTheme('dark');
            executed = true;
          } else if (command.parsed === 'start dictation') {
            if (getActiveTextField()) {
              setVoiceError(null);
              setIsDictating(true);
              executed = true;
            } else {
              voiceService.setDictationMode(false);
              setIsDictating(false);
              setVoiceError('Focus a text field before starting dictation.');
            }
          } else if (command.parsed === 'stop dictation') {
            voiceService.setDictationMode(false);
            setIsDictating(false);
            executed = true;
          } else if (command.parsed === 'start session') {
            handleStart();
            executed = true;
          } else if (command.parsed === 'stop session') {
            handleStop(false);
            executed = true;
          }
        } else if (command.type === 'navigation') {
          // Scroll — dispatch to browse viewport if on browse tab, else use window
          if (command.parsed === 'scroll down') {
            if (activeTab === 'browse') {
              window.dispatchEvent(new CustomEvent('handsfree:scroll', { detail: { direction: 'down' } }));
            } else {
              scrollActivePane((getActiveScrollContainer()?.clientHeight ?? window.innerHeight) * 0.5);
            }
            getWsClient()?.send({ type: 'HANDSFREE_VOICE_COMMAND', command: 'scroll down' });
            executed = true;
          } else if (command.parsed === 'scroll up') {
            if (activeTab === 'browse') {
              window.dispatchEvent(new CustomEvent('handsfree:scroll', { detail: { direction: 'up' } }));
            } else {
              scrollActivePane(-(getActiveScrollContainer()?.clientHeight ?? window.innerHeight) * 0.5);
            }
            getWsClient()?.send({ type: 'HANDSFREE_VOICE_COMMAND', command: 'scroll up' });
            executed = true;
          } else if (command.parsed === 'scroll to top') {
            const container = getActiveScrollContainer();
            if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
            else window.scrollTo({ top: 0, behavior: 'smooth' });
            executed = true;
          } else if (command.parsed === 'scroll to bottom') {
            const container = getActiveScrollContainer();
            if (container) {
              container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            } else {
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
            executed = true;
          } else if (command.parsed === 'go back') {
            setActiveTab('browse');
            window.dispatchEvent(new CustomEvent('handsfree:back'));
            getWsClient()?.send({ type: 'HANDSFREE_VOICE_COMMAND', command: 'go back' });
            executed = true;
          } else if (command.parsed === 'go forward') {
            setActiveTab('browse');
            window.dispatchEvent(new CustomEvent('handsfree:forward'));
            getWsClient()?.send({ type: 'HANDSFREE_VOICE_COMMAND', command: 'go forward' });
            executed = true;
          } else if (command.parsed === 'open home') {
            setActiveTab('browse');
            window.dispatchEvent(new CustomEvent('handsfree:home'));
            executed = true;
          } else if (command.parsed === 'reload') {
            setActiveTab('browse');
            window.dispatchEvent(new CustomEvent('handsfree:reload'));
            executed = true;
          } else if (command.parsed === 'go to browse') {
            setActiveTab('browse');
            executed = true;
          } else if (command.parsed === 'go to settings') {
            setActiveTab('settings');
            executed = true;
          }
        } else if (command.type === 'action') {
          if (command.parsed === 'click' || command.parsed === 'select' || command.parsed === 'confirm' || command.parsed === 'cancel') {
            executed = intentGuardRef.current.handleVoiceCommand(command);
          } else if (command.parsed === 'clear text') {
            const field = getActiveTextField();
            if (field) {
              setTextFieldValue(field, '');
              try {
                field.setSelectionRange(0, 0);
              } catch {
                // Some input types do not support selection ranges.
              }
              executed = true;
            }
            getWsClient()?.send({ type: 'HANDSFREE_VOICE_COMMAND', command: 'clear text' });
          }
        } else if (command.type === 'dictation') {
          executed = insertDictatedText(command.parsed);
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
        setIsDictating(false);
        if (settings.trackingMode === 'voice' && isTracking) {
          setIsTracking(false);
          setInteractionState('error');
          setTrackingHealth((previous) => ({
            ...previous,
            isTracking: false,
            message: 'Voice session stopped because recognition failed.',
          }));
        }
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setPermissionStatus(p => ({ ...p, microphone: 'denied' }));
          setVoiceError('Microphone access was denied. Allow microphone access in your browser and try again.');
        } else if (err === 'unsupported') {
          setVoiceError('Voice recognition is not supported in this browser.');
        } else if (err === 'audio-capture') {
          setVoiceError('No microphone is available. Check that one is connected and enabled.');
        } else if (err === 'network') {
          setVoiceError('Voice recognition could not connect. Check your network and try again.');
        } else {
          setVoiceError(`Voice recognition failed (${err}). Try starting it again.`);
        }
      },
      (listening) => {
        setIsListening(listening);
        if (listening) {
          setVoiceError(null);
          setPermissionStatus(p => ({ ...p, microphone: 'granted' }));
        }
      }
    );
  }, [handleStart, handleStop, handlePause, handleResume, broadcastClick, activeTab, settings.trackingMode, isTracking]);

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
            isListening={isListening}
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
        return null;
      case 'evaluation':
        return <EvaluationView />;
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            isTracking={isTracking}
            onSettingsChange={handleSettingsChange}
            theme={theme}
            onThemeToggle={handleThemeToggle}
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
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 flex flex-col overflow-hidden animate-fade-in relative z-0">
          {activeTab !== 'browse' && renderContent()}
          <div className={activeTab === 'browse' ? 'flex-1 flex min-h-0' : 'hidden'}>
            <BrowseWorkspace
              isActive={activeTab === 'browse'}
              isListening={isListening}
              lastVoiceCommand={lastVoiceCommand}
            />
          </div>
        </main>
      </div>

      {/* Control Bar */}
      <ControlBar
        isTracking={isTracking}
        interactionState={interactionState}
        isListening={isListening}
        isDictating={isDictating}
        voiceError={voiceError}
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
