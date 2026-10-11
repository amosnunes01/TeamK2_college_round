import React from 'react';
import { Play, Pause, Square, Mic, MicOff, Shield, ShieldAlert, Target } from 'lucide-react';
import type { InteractionState } from '../../types';

interface ControlBarProps {
  isTracking: boolean;
  interactionState: InteractionState;
  isListening: boolean;
  isDictating: boolean;
  voiceError?: string | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRecalibrate: () => void;
  onToggleListening: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isTracking,
  interactionState,
  isListening,
  isDictating,
  voiceError = null,
  onStart,
  onPause,
  onResume,
  onStop,
  onRecalibrate,
  onToggleListening,
}) => {
  const isPaused = interactionState === 'paused';

  return (
    <div className="control-strip backdrop-blur-sm border-t border-white/5 px-6 py-4 flex items-center justify-between z-20 relative">
      <div className="flex items-center gap-3">
        {!isTracking ? (
          <button
            onClick={onStart}
            className="session-button primary flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <Play size={16} fill="currentColor" /> Start Session
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={onResume}
                className="session-button success flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all border"
              >
                <Play size={16} fill="currentColor" /> Resume
              </button>
            ) : (
              <button
                onClick={onPause}
                className="session-button warning flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all border"
              >
                <Pause size={16} fill="currentColor" /> Pause
              </button>
            )}
            <button
              onClick={onStop}
              className="session-button danger flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all border"
            >
              <Square size={16} fill="currentColor" /> Stop
            </button>
            <button
              onClick={onRecalibrate}
              className="session-button neutral flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all border"
            >
              <Target size={16} /> Calibrate
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="state-badge flex items-center gap-2 px-4 py-1.5 rounded-full border">
          {interactionState === 'idle' ? (
            <Shield size={14} className="text-slate-500" />
          ) : interactionState === 'tracking' ? (
            <Shield size={14} className="text-primary" />
          ) : interactionState === 'pendingConfirmation' ? (
            <ShieldAlert size={14} className="text-amber-500 animate-pulse" />
          ) : (
            <Shield size={14} className="text-green-500" />
          )}
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              interactionState === 'idle'
                ? 'text-slate-500'
                : interactionState === 'tracking'
                ? 'text-primary'
                : interactionState === 'targeted'
                ? 'text-amber-400'
                : interactionState === 'pendingConfirmation'
                ? 'text-slate-400'
                : interactionState === 'executing'
                ? 'text-green-400'
                : interactionState === 'paused'
                ? 'text-amber-200'
                : 'text-red-400'
            }`}
          >
            {interactionState}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isDictating && (
          <span role="status" className="text-xs font-medium text-primary whitespace-nowrap">
            Dictation active
          </span>
        )}
        {voiceError && (
          <span id="voice-error" role="alert" className="max-w-48 text-xs text-red-400">
            {voiceError}
          </span>
        )}
        <button
          onClick={onToggleListening}
          aria-describedby={voiceError ? 'voice-error' : undefined}
          className={`voice-button flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all focus:outline-none focus:ring-2 ${
            isListening
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 focus:ring-red-400 animate-pulse-slow shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              : 'bg-card hover:bg-card-hover text-slate-300 border border-white/5 focus:ring-primary'
          }`}
        >
          {isListening ? <Mic size={16} /> : <MicOff size={16} />}
          {isListening ? 'Listening...' : 'Voice Command'}
        </button>
      </div>
    </div>
  );
};
