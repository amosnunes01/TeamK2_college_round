import React from 'react';
import { Camera, Mic, Activity, SunMedium, MoonStar } from 'lucide-react';
import type { PermissionStatus, TrackingHealth } from '../../types';

interface HeaderProps {
  isTracking: boolean;
  permissionStatus: PermissionStatus;
  trackingHealth: TrackingHealth;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isTracking,
  permissionStatus,
  trackingHealth,
  theme,
  onThemeToggle,
}) => {
  return (
    <header className="h-16 bg-surface border-b border-white/5 flex items-center justify-between px-6 z-10 relative">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Handsfree
        </h1>
        <div className="hidden md:flex px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-medium">
          Control Center
        </div>
      </div>
      
      <div className="flex items-center gap-4 md:gap-6">
        <button
          type="button"
          onClick={onThemeToggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {theme === 'dark' ? <SunMedium size={14} /> : <MoonStar size={14} />}
          <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        <div className="flex items-center gap-2">
          <Camera size={16} className="text-slate-400" />
          <div className={`w-2 h-2 rounded-full ${permissionStatus.camera === 'granted' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : permissionStatus.camera === 'denied' ? 'bg-red-500' : 'bg-slate-500'}`} />
          <span className="text-xs text-slate-400 hidden sm:inline">Camera</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Mic size={16} className="text-slate-400" />
          <div className={`w-2 h-2 rounded-full ${permissionStatus.microphone === 'granted' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : permissionStatus.microphone === 'denied' ? 'bg-red-500' : 'bg-slate-500'}`} />
          <span className="text-xs text-slate-400 hidden sm:inline">Mic</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-slate-400" />
          <div className={`w-2 h-2 rounded-full ${isTracking && trackingHealth.confidence > 0.7 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : isTracking ? 'bg-yellow-500' : 'bg-slate-500'}`} />
          <span className="text-xs text-slate-400 hidden sm:inline">
            {isTracking ? `${Math.round(trackingHealth.fps)} FPS` : 'Inactive'}
          </span>
        </div>
      </div>
    </header>
  );
};
