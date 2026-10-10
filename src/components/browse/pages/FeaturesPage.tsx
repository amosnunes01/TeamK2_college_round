import React from 'react';
import { Hand, Smile, Mic, Keyboard, Shield, Crosshair, Activity, RefreshCw } from 'lucide-react';

interface FeaturesPageProps {
  onAction: (msg: string) => void;
}

const features = [
  {
    icon: <Hand className="w-8 h-8" />,
    title: 'Hand Tracking',
    description: 'Real-time hand landmark detection using MediaPipe Tasks Vision. Map index finger tip position to cursor coordinates with configurable sensitivity and smoothing.',
    status: 'Phase 2',
  },
  {
    icon: <Smile className="w-8 h-8" />,
    title: 'Head Tracking',
    description: 'Face landmark detection for cursor control through head movement. Experimental mode with nose-tip mapping and dead-zone filtering.',
    status: 'Phase 3',
  },
  {
    icon: <Mic className="w-8 h-8" />,
    title: 'Voice Navigation',
    description: 'Web Speech API integration for hands-free commands: scroll, click, navigate, open pages, and more. Supports command mode and dictation mode.',
    status: 'Phase 4',
  },
  {
    icon: <Keyboard className="w-8 h-8" />,
    title: 'Voice Typing',
    description: 'Dictate text into search fields, forms, and text areas. Separate dictation mode with punctuation support.',
    status: 'Phase 4',
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'IntentGuard',
    description: 'Deterministic interaction-safety system. Dwell-to-select with progress indicator, confirmation for sensitive actions, cooldown between activations.',
    status: 'Phase 5',
  },
  {
    icon: <Crosshair className="w-8 h-8" />,
    title: 'Quick Calibration',
    description: 'Guided calibration workflow designed to complete within 30 seconds. Target-based mapping with retry and recalibration support.',
    status: 'Phase 3',
  },
  {
    icon: <Activity className="w-8 h-8" />,
    title: 'Performance Evaluation',
    description: 'Built-in evaluation mode with repeatable tasks. Measures completion time, accuracy, errors, and accidental activations.',
    status: 'Phase 6',
  },
  {
    icon: <RefreshCw className="w-8 h-8" />,
    title: 'Adaptive Tracking',
    description: 'Dynamic adjustment for jitter, confidence drops, position changes, and lighting conditions. Automatic tracking suspension when unreliable.',
    status: 'Phase 2-3',
  },
];

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onAction }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">Features</h1>
      <p className="text-slate-400">
        A comprehensive list of Handsfree capabilities, organized by
        implementation phase.
      </p>

      <div className="space-y-4">
        {features.map((feature, i) => (
          <div
            key={i}
            className="bg-card border border-white/5 rounded-xl p-5 hover:border-primary/30 transition-colors"
            data-handsfree-target={`feature-detail-${i}`}
          >
            <div className="flex items-start gap-4">
              <span className="text-primary">{feature.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-lg">
                    {feature.title}
                  </h3>
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full text-xs font-medium">
                    {feature.status}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-2">
                  {feature.description}
                </p>
                <button
                  onClick={() => onAction(`Viewing details for: ${feature.title}`)}
                  className="mt-3 text-primary hover:text-primary/80 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  data-handsfree-target={`feature-btn-${i}`}
                  data-handsfree-label={`View ${feature.title}`}
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
