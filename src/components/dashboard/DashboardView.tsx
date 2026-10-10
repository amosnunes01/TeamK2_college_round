import React from 'react';
import {
  Camera, CameraOff, Mic, MicOff, Hand, Smile,
  MessageSquare, Layers,
  CheckCircle2, XCircle, Target,
  Activity, Settings, Play, Square, ShieldCheck, ShieldAlert,
  Crosshair, FlaskConical,
} from 'lucide-react';
import type { TrackingHealth, CommandHistoryEntry, InteractionState, HandsfreeSettings, PermissionStatus, PointerPosition, TargetElement, PendingAction, ActivationRecord } from '../../types';
import type { CalibrationResult } from '../../services/calibrationService';
import { trackingService } from '../../services/trackingService';
import { headTrackingService } from '../../services/headTrackingService';

interface DashboardViewProps {
  isTracking: boolean;
  isListening: boolean;
  trackingHealth: TrackingHealth;
  interactionState: InteractionState;
  commandHistory: CommandHistoryEntry[];
  settings: HandsfreeSettings;
  permissionStatus: PermissionStatus;
  mediaStream: MediaStream | null;
  calibrationResult: CalibrationResult | null;
  pointerPosition: PointerPosition | null;
  currentTarget: TargetElement | null;
  pendingAction: PendingAction | null;
  activationRecords: ActivationRecord[];
  onSettingsChange?: (settings: Partial<HandsfreeSettings>) => void;
  onStartTracking?: () => void;
  onRecalibrate?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  isTracking,
  isListening,
  trackingHealth,
  interactionState,
  commandHistory,
  settings,
  permissionStatus,
  mediaStream,
  calibrationResult,
  pointerPosition,
  currentTarget,
  pendingAction,
  activationRecords,
  onSettingsChange,
  onStartTracking,
  onRecalibrate,
}) => {
  const handleModeChange = (mode: HandsfreeSettings['trackingMode']) => {
    if (onSettingsChange) {
      onSettingsChange({ trackingMode: mode });
    }
  };

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Wire debug canvas to the active tracking service
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (settings.trackingMode === 'head') {
      headTrackingService.setDebugCanvas(canvas);
      trackingService.setDebugCanvas(null);
      } else if (settings.trackingMode === 'hand') {
      trackingService.setDebugCanvas(canvas);
      headTrackingService.setDebugCanvas(null);
      } else {
        trackingService.setDebugCanvas(null);
        headTrackingService.setDebugCanvas(null);
    }
    return () => {
      trackingService.setDebugCanvas(null);
      headTrackingService.setDebugCanvas(null);
    };
  }, [isTracking, settings.trackingMode]);

  const pointerLabel = pointerPosition
    ? `${Math.round(pointerPosition.x)}, ${Math.round(pointerPosition.y)}`
    : settings.trackingMode === 'voice' ? 'Voice only' : '--, --';

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background text-primary" data-handsfree-scroll-container>
      <div className="hero-panel relative overflow-hidden border rounded-[28px] p-10 flex flex-col items-center justify-center text-center shadow-[0_24px_80px_rgba(79,70,229,0.18)]">
        <div className="hero-orb orb-one" />
        <div className="hero-orb orb-two" />
        <div className="hero-grid" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary mb-5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
          Access systems live
        </div>

        <h1 className="hero-title text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Browse beyond boundaries.
        </h1>
        <p className="text-secondary max-w-2xl text-lg mb-6">
          Seamlessly navigate your digital world using advanced hand, head, and voice tracking.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onStartTracking}
            className="hero-button-primary relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-white transition-all duration-200 rounded-full shadow-[0_18px_45px_rgba(124,58,237,0.35)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
          >
            {isTracking ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isTracking ? 'Stop Session' : 'Start Session'}
          </button>
          <button
            onClick={onRecalibrate}
            disabled={!isTracking}
            className="hero-button-secondary inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 rounded-full disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Crosshair className="w-4 h-4" />
            Calibrate
          </button>
        </div>
      </div>

      {/* Live Control Center */}
      <div className="bg-card border border-surface rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold">Live Control Center</h2>
          {calibrationResult && (
            <span className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              <CheckCircle2 className="w-3 h-3" />
              Calibrated ({(calibrationResult.data.duration / 1000).toFixed(1)}s)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera/Tracking Preview (Left) */}
          <div className="bg-surface/50 border border-surface rounded-xl overflow-hidden flex flex-col relative min-h-[250px]">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isTracking && (settings.trackingMode !== 'voice' || isListening) ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-surface border border-surface text-secondary'}`}>
                {settings.trackingMode === 'voice'
                  ? <Mic className="w-3 h-3" />
                  : isTracking ? <Camera className="w-3 h-3" /> : <CameraOff className="w-3 h-3" />}
                {settings.trackingMode === 'voice'
                  ? isListening ? 'Voice Live' : 'Voice Off'
                  : isTracking ? 'Live' : 'Camera Off'}
              </span>
              {isTracking && settings.trackingMode !== 'voice' && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono bg-black/40 text-white/70 backdrop-blur-sm">
                  {Math.round(trackingHealth.fps)} FPS
                </span>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black/50">
              {settings.trackingMode === 'voice' ? (
                <div className="text-center text-secondary relative z-10 space-y-3 px-6">
                  <Mic className={`w-12 h-12 mx-auto ${isListening ? 'text-primary' : 'opacity-30'}`} />
                  <p>{isTracking
                    ? isListening ? 'Voice control is ready. Speak a command.' : 'Voice session active. Enable Voice Command to listen.'
                    : 'Start a voice session. Camera access is not required.'}</p>
                </div>
              ) : isTracking ? (
                <>
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 transform -scale-x-100"
                    autoPlay playsInline muted
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full z-[1] pointer-events-none"
                  />
                  <div className="z-[2] text-center space-y-2 w-full px-8 py-4 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Confidence</span>
                      <span className="font-medium">{Math.round(trackingHealth.confidence * 100)}%</span>
                    </div>
                    <div className="w-full bg-surface/50 rounded-full h-1.5 backdrop-blur-sm">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          trackingHealth.confidence > 0.7 ? 'bg-green-400' :
                          trackingHealth.confidence > 0.4 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${trackingHealth.confidence * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Landmarks</span>
                      <span className={trackingHealth.landmarksDetected ? 'text-green-400' : 'text-red-400'}>
                        {trackingHealth.landmarksDetected ? 'Detected' : 'None'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-secondary relative z-10">
                  <CameraOff className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Start session to view tracking</p>
                </div>
              )}
            </div>
          </div>

          {/* Metrics & State (Right) */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-4">
              <MetricCard label="Current Mode" value={settings.trackingMode} icon={<Layers className="w-4 h-4" />} />
              <MetricCard label="Pointer X,Y" value={pointerLabel} icon={<Target className="w-4 h-4" />} />
            </div>

            {/* IntentGuard State */}
            <div className="bg-surface/30 border border-surface rounded-xl p-4 flex-1">
              <div className="flex items-center gap-2 mb-4">
                {settings.dwellEnabled ? <ShieldCheck className="w-5 h-5 text-indigo-400" /> : <ShieldAlert className="w-5 h-5 text-secondary" />}
                <h3 className="font-semibold">IntentGuard</h3>
                <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                  interactionState === 'pendingConfirmation' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  interactionState === 'executing' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  interactionState === 'targeted' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                  'bg-surface text-secondary'
                }`}>
                  {interactionState}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-secondary">Dwell Selection</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${settings.dwellEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-surface text-secondary'}`}>
                    {settings.dwellEnabled ? `${settings.dwellTime}ms` : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-secondary">Current Target</span>
                  <span className="font-mono text-xs bg-surface px-2 py-1 rounded truncate max-w-[150px]">
                    {currentTarget ? currentTarget.label.slice(0, 20) : 'none'}
                  </span>
                </div>
                {settings.dwellEnabled && pendingAction && (
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-xs text-secondary">
                      <span>Dwell Progress</span>
                      <span>{Math.round((pendingAction.dwellProgress || 0) * 100)}%</span>
                    </div>
                    <div className="w-full bg-surface rounded-full h-1.5">
                      <div
                        className="bg-indigo-400 h-1.5 rounded-full transition-all duration-100"
                        style={{ width: `${(pendingAction.dwellProgress || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {interactionState === 'pendingConfirmation' && (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
                    ⚠️ Awaiting confirmation — say "Confirm" or "Cancel"
                  </div>
                )}
                {activationRecords.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-surface/50">
                    <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider">Recent Activations</span>
                    <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
                      {activationRecords.slice(-5).reverse().map((rec, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="truncate max-w-[120px] text-primary">{rec.action.target.label.slice(0, 20)}</span>
                          <span className={`px-1.5 py-0.5 rounded font-medium ${
                            rec.result === 'completed' ? 'bg-green-500/20 text-green-400' :
                            rec.result === 'blocked' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {rec.result}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Modes */}
      <div>
        <h3 className="text-lg font-semibold mb-4 px-1">Control Modes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ModeCard
            title="Hand"
            description="Control via hand gestures"
            icon={<Hand className="w-6 h-6" />}
            isActive={settings.trackingMode === 'hand'}
            onClick={() => handleModeChange('hand')}
            disabled={isTracking}
          />
          <ModeCard
            title="Head"
            description="Navigate with head movement"
            icon={<Smile className="w-6 h-6" />}
            isActive={settings.trackingMode === 'head'}
            onClick={() => handleModeChange('head')}
            badge="Experimental"
            disabled={isTracking}
          />
          <ModeCard
            title="Voice"
            description="Uses browser speech API (may send audio to platform service)"
            icon={<MessageSquare className="w-6 h-6" />}
            isActive={settings.trackingMode === 'voice'}
            onClick={() => handleModeChange('voice')}
            disabled={isTracking}
          />
          <ModeCard
            title="Combined"
            description="All modalities active"
            icon={<Layers className="w-6 h-6" />}
            isActive={settings.trackingMode === 'combined'}
            onClick={() => handleModeChange('combined')}
            badge="Coming Soon"
            disabled
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Command Center */}
        <div className="bg-card border border-surface rounded-2xl p-6 shadow-lg flex flex-col max-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold">Command Center</h3>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-secondary">{isListening ? 'Listening' : 'Voice off'}</span>
              <div className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-surface'}`} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {commandHistory.length > 0 ? (
              commandHistory.slice().reverse().map((entry, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-surface/40 rounded-xl border border-surface/50">
                  <div className="mt-0.5">
                    {entry.result === 'executed' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : entry.result === 'blocked' || entry.result === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <Activity className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">"{entry.command.raw}"</p>
                    <p className="text-xs text-secondary truncate mt-0.5">{entry.command.parsed || 'Unrecognized command'}</p>
                  </div>
                  <span className="text-xs text-secondary whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-secondary space-y-3 opacity-50 py-8">
                <MicOff className="w-8 h-8" />
                <p className="text-sm">No voice commands recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* System Status & Settings */}
        <div className="bg-card border border-surface rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold">System Configuration</h3>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Hardware Status</h4>
              <div className="space-y-2">
                <StatusRow
                  label="Camera Permission"
                  value={permissionStatus.camera}
                  status={permissionStatus.camera === 'granted' ? 'good' : permissionStatus.camera === 'denied' ? 'bad' : 'neutral'}
                />
                <StatusRow
                  label="Mic Permission"
                  value={permissionStatus.microphone}
                  status={permissionStatus.microphone === 'granted' ? 'good' : permissionStatus.microphone === 'denied' ? 'bad' : 'neutral'}
                />
                <StatusRow
                  label="Interaction State"
                  value={interactionState}
                  status={interactionState === 'error' ? 'bad' : 'neutral'}
                />
                <StatusRow
                  label="Calibration"
                  value={calibrationResult ? `Done (${calibrationResult.data.points.length} pts)` : 'Not calibrated'}
                  status={calibrationResult ? 'good' : 'neutral'}
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Active Settings</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <SettingBadge label="Sensitivity" value={`${settings.sensitivity}/10`} />
                <SettingBadge label="Smoothing" value={`${settings.smoothing}/10`} />
                <SettingBadge label="Dwell Time" value={settings.dwellEnabled ? `${settings.dwellTime}ms` : 'Disabled'} />
                <SettingBadge label="Dead Zone" value={`${settings.deadZone}px`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Sub-components ----

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-surface/30 border border-surface rounded-xl p-4">
      <div className="flex items-center gap-2 text-secondary mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-semibold capitalize">{value}</div>
    </div>
  );
}

function ModeCard({ title, description, icon, isActive, onClick, badge, disabled = false }: {
  title: string; description: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; badge?: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isActive}
      className={`text-left p-5 rounded-xl border transition-all duration-200 relative ${
        isActive
          ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
          : 'bg-card border-surface hover:border-indigo-500/30 hover:bg-surface/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-card hover:border-surface' : 'cursor-pointer'}`}
    >
      {badge && (
        <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <FlaskConical className="w-2.5 h-2.5" />
          {badge}
        </span>
      )}
      <div className={`mb-3 ${isActive ? 'text-indigo-400' : 'text-secondary'}`}>
        {icon}
      </div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-xs text-secondary leading-relaxed">{description}</p>
    </button>
  );
}

function StatusRow({ label, value, status }: { label: string; value: string; status: 'good' | 'bad' | 'neutral' }) {
  return (
    <div className="flex justify-between items-center text-sm py-1.5 border-b border-surface/50 last:border-0">
      <span className="text-secondary">{label}</span>
      <span className={`font-medium capitalize ${
        status === 'good' ? 'text-green-400' :
        status === 'bad' ? 'text-red-400' :
        'text-primary'
      }`}>
        {value}
      </span>
    </div>
  );
}

function SettingBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col p-2.5 bg-surface/30 rounded-lg border border-surface/50">
      <span className="text-xs text-secondary mb-1">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
