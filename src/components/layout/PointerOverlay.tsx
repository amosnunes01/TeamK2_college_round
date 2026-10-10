import React from 'react';
import type { PointerPosition, PendingAction } from '../../types';

interface PointerOverlayProps {
  position: PointerPosition | null;
  isTracking: boolean;
  pendingAction?: PendingAction | null;
}

export const PointerOverlay: React.FC<PointerOverlayProps> = ({ position, isTracking, pendingAction }) => {
  if (!isTracking || !position) return null;

  const progress = pendingAction?.dwellProgress || 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div
      className="handsfree-pointer pointer-events-none fixed z-[9999] flex items-center justify-center mix-blend-difference"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
        transition: 'none', // Critical: CSS transitions cause lag for tracking cursors
      }}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div 
          className="absolute bg-indigo-400/40 rounded-full blur-sm"
          style={{ width: '20px', height: '20px' }}
        />
        
        {/* Progress Ring */}
        {progress > 0 && (
          <svg width="40" height="40" className="absolute" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="20"
              cy="20"
              r={radius}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="3"
              fill="none"
            />
            <circle
              cx="20"
              cy="20"
              r={radius}
              stroke="#4ade80"
              strokeWidth="3"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Core pointer */}
        <div 
          className={`absolute rounded-full shadow-[0_0_10px_rgba(139,92,246,0.8)] border border-white/80 transition-colors flex items-center justify-center ${
            position.gesture === 'scroll' ? 'bg-amber-400 w-6 h-6' : 
            progress > 0 ? 'bg-green-400 w-2 h-2' : 'bg-indigo-400 w-2 h-2'
          }`}
          style={{ width: position.gesture === 'scroll' ? '24px' : '8px', height: position.gesture === 'scroll' ? '24px' : '8px' }}
        >
          {position.gesture === 'scroll' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-amber-900">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
