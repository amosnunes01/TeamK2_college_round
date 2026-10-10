// ============================================================
// Handsfree — Core Type Definitions
// ============================================================

// ---- Tracking Mode ----
export type TrackingMode = 'hand' | 'head' | 'voice' | 'combined';

// ---- IntentGuard States ----
export type InteractionState =
  | 'idle'
  | 'tracking'
  | 'targeted'
  | 'pendingConfirmation'
  | 'executing'
  | 'paused'
  | 'error';

// ---- Pointer ----
export interface PointerPosition {
  x: number;
  y: number;
  confidence: number;
  timestamp: number;
  gesture?: 'pointer' | 'scroll';
}

// ---- Tracking Health ----
export interface TrackingHealth {
  isTracking: boolean;
  confidence: number;
  fps: number;
  landmarksDetected: boolean;
  lastUpdate: number;
  message: string;
}

// ---- Target ----
export interface TargetElement {
  id: string;
  element: HTMLElement;
  label: string;
  type: 'button' | 'link' | 'input' | 'checkbox' | 'card' | 'other';
  rect: DOMRect;
}

// ---- Pending Action ----
export interface PendingAction {
  id: string;
  target: TargetElement;
  action: 'click' | 'select' | 'confirm' | 'navigate';
  createdAt: number;
  dwellProgress: number; // 0-1
  confirmed: boolean;
}

// ---- Voice Command ----
export interface VoiceCommand {
  raw: string;
  parsed: string;
  type: 'navigation' | 'action' | 'dictation' | 'control' | 'unknown';
  confidence: number;
  timestamp: number;
  executed: boolean;
}

// ---- Settings ----
export interface HandsfreeSettings {
  trackingMode: TrackingMode;
  sensitivity: number;      // 1-10
  smoothing: number;        // 1-10
  dwellTime: number;        // ms
  dwellEnabled: boolean;
  deadZone: number;         // px
  textSize: 'small' | 'medium' | 'large';
  confirmSensitiveActions: boolean;
  activationCooldown: number; // ms
  scrollSensitivity: number;  // 1-10
  scrollDeadZone: number;     // px
}

// ---- Calibration ----
export interface CalibrationPoint {
  screenX: number;
  screenY: number;
  trackedX: number;
  trackedY: number;
}

export interface CalibrationData {
  points: CalibrationPoint[];
  completed: boolean;
  timestamp: number;
  duration: number; // ms
}

// ---- Evaluation ----
export type EvaluationInputMode = 'conventional' | 'handsfree';

export interface EvaluationTask {
  id: string;
  name: string;
  description: string;
  type: 'navigate' | 'scroll' | 'select' | 'type' | 'form';
  expectedOutcome: string;
}

export interface EvaluationTrial {
  id: string;
  taskId: string;
  inputMode: EvaluationInputMode;
  startTime: number;
  endTime: number | null;
  completed: boolean;
  success: boolean;
  errors: number;
  accidentalActivations: number;
  voiceCommandsIssued: number;
  voiceCommandsRecognized: number;
  notes: string;
}

export interface EvaluationSession {
  id: string;
  startTime: number;
  endTime: number | null;
  trials: EvaluationTrial[];
}

// ---- Browsing Workspace Page ----
export interface WorkspacePage {
  id: string;
  title: string;
  path: string;
}

// ---- Permission Status ----
export interface PermissionStatus {
  camera: 'granted' | 'denied' | 'prompt' | 'unavailable';
  microphone: 'granted' | 'denied' | 'prompt' | 'unavailable';
}

// ---- Command History Entry ----
export interface CommandHistoryEntry {
  command: VoiceCommand;
  result: 'executed' | 'blocked' | 'cancelled' | 'error';
  timestamp: number;
}

// ---- IntentGuard Record ----
export interface ActivationRecord {
  id: string;
  action: PendingAction;
  result: 'completed' | 'blocked' | 'cancelled';
  timestamp: number;
  reason?: string;
}
