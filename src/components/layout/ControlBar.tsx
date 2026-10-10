import React from 'react';
import { Play, Pause, Square, Mic, MicOff, Shield, ShieldAlert, Target } from 'lucide-react';
import type { InteractionState } from '../../types';

interface ControlBarProps {
  isTracking: boolean;
  interactionState: InteractionState;
  isListening: boolean;
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
  onStart,
  onPause,
  onResume,
  onStop,
  onRecalibrate,
  onToggleListening,
}) => {
  const isPaused = interactionState === 'paused';

  return (
    <div className="bg-surface border-t border-white/5 px-6 py-4 flex items-center justify-between shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.5)] z-20 relative">
      {/* Tracking Controls */}
      <div className="flex items-center gap-3">
        {!isTracking ? (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]"
          >
            <Play size={16} fill="currentColor" /> Start Session
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={onResume}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl font-medium text-sm transition-all border border-green-500/30"
              >
                <Play size={16} fill="currentColor" /> Resume
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl font-medium text-sm transition-all border border-amber-500/30"
              >
                <Pause size={16} fill="currentColor" /> Pause
              </button>
            )}
            <button
              onClick={onStop}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium text-sm transition-all border border-red-500/30"
            >
              <Square size={16} fill="currentColor" /> Stop
            </button>
            <button
              onClick={onRecalibrate}
              className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-card-hover text-slate-300 rounded-xl font-medium text-sm transition-all border border-white/5"
            >
              <Target size={16} /> Calibrate
            </button>
          </>
        )}
      </div>

      {/* State Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-white/5">
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
                ? 'text-purple-400'
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

      {/* Voice Control */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleListening}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all focus:outline-none focus:ring-2 ${
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
