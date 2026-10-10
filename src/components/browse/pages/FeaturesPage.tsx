import React, { useState } from 'react';
import {
  Hand, Mic, Shield, MousePointer, Zap, Target, Eye, Volume2,
  CheckCircle, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';

interface FeaturesPageProps {
  onAction: (msg: string) => void;
}

const features = [
  {
    icon: <Hand size={22} />, color: 'text-purple-400', title: 'Hand Tracking',
    summary: 'MediaPipe HandLandmarker tracks 21 keypoints in real time.',
    details: 'Runs entirely on-device using WebAssembly. Detects the index fingertip to control the pointer. A peace/victory gesture (two raised fingers) enters scroll mode. Tracking confidence is continuously monitored — frames below 55% confidence are discarded to prevent jitter.',
  },
  {
    icon: <Eye size={22} />, color: 'text-blue-400', title: 'Head Tracking',
    summary: 'FaceLandmarker provides head-pose cursor control.',
    details: 'Uses facial landmark geometry to estimate head orientation. Tilting your head left/right/up/down moves the cursor proportionally. Useful for users with limited hand mobility. Uses the same smoothing and dead-zone pipeline as hand tracking.',
  },
  {
    icon: <Mic size={22} />, color: 'text-emerald-400', title: 'Voice Commands',
    summary: 'Web Speech API drives navigation and actions.',
    details: 'Recognized commands include session and listening controls, navigation, scrolling, IntentGuard actions, dictation, and explicit light/dark mode selection. Commands are deduplicated within a 600 ms window to prevent double-firing. Speech recognition must be enabled before voice commands can be heard.',
  },
  {
    icon: <MousePointer size={22} />, color: 'text-amber-400', title: 'Dwell Click',
    summary: 'Hover over an element for a configurable time to activate it.',
    details: 'Default dwell time is 800 ms, configurable in Settings. A progress arc fills around the pointer as the dwell timer progresses. Scrolling gestures immediately cancel any active dwell. IntentGuard enforces a post-activation cooldown (default 800 ms) to prevent double-clicks.',
  },
  {
    icon: <Shield size={22} />, color: 'text-rose-400', title: 'IntentGuard',
    summary: 'State machine that prevents accidental activations.',
    details: 'States: idle → tracking → targeted → (optional pendingConfirmation) → executing. Sensitive actions (delete, submit) can require explicit confirmation. Tracking loss or pause immediately cancels pending actions. Low-confidence frames keep the state in "tracking" without targeting.',
  },
  {
    icon: <Target size={22} />, color: 'text-cyan-400', title: 'Calibration',
    summary: 'Optional 9-point calibration for precise mapping.',
    details: 'The calibration overlay captures 9 screen-space reference points. A bilinear correction matrix maps raw tracker coordinates to screen pixels, compensating for camera angle and user positioning. Calibration data persists in localStorage.',
  },
  {
    icon: <Zap size={22} />, color: 'text-yellow-400', title: 'Performance',
    summary: 'GPU-accelerated, rAF-synchronized rendering.',
    details: 'The pointer cursor uses CSS translate3d (GPU layer) and will-change: transform. React state updates for tracking health are throttled to 2 Hz. Hand-scroll velocity is accumulated in a ref and drained through requestAnimationFrame with exponential decay for smooth momentum.',
  },
  {
    icon: <Volume2 size={22} />, color: 'text-indigo-400', title: 'Voice Dictation',
    summary: 'Speak to fill form fields and search boxes.',
    details: 'Focus a text field and say "start dictation". Recognized speech is inserted at the caret, including in React-controlled inputs. Say "stop dictation" to return to command mode. No server round-trip — the Web Speech API is browser-native.',
  },
];

const compatibility = [
  { item: 'Chrome 113+', supported: true },
  { item: 'Edge 113+', supported: true },
  { item: 'Firefox', supported: false, note: 'No Web Speech API' },
  { item: 'Safari', supported: false, note: 'Limited Speech API' },
  { item: 'Mobile Chrome (Android)', supported: true, note: 'Camera required' },
  { item: 'iOS Safari', supported: false, note: 'WebAssembly limitations' },
];

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onAction }) => {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Features</h1>
        <p className="text-slate-400 text-sm">
          Complete capability overview. Click any feature card to expand details.
          Use hand gestures, dwell-click, or say <span className="text-primary font-medium">"click"</span> to interact.
        </p>
      </div>

      {/* Feature Accordion */}
      <div className="space-y-3">
        {features.map((f, i) => (
          <div key={i} className="bg-card border border-white/5 rounded-xl overflow-hidden transition-all hover:border-primary/20">
            <button
              className="w-full flex items-center gap-3 px-5 py-4 text-left"
              onClick={() => { setExpanded(expanded === i ? null : i); onAction(`Expanded: ${f.title}`); }}
              data-handsfree-target={`feature-${i}`}
              data-handsfree-label={f.title}
            >
              <span className={`shrink-0 ${f.color}`}>{f.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold">{f.title}</div>
                <div className="text-slate-400 text-sm mt-0.5">{f.summary}</div>
              </div>
              <span className="text-slate-500 shrink-0">
                {expanded === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </button>
            {expanded === i && (
              <div className="px-5 pb-5 pt-1 border-t border-white/5">
                <p className="text-slate-300 text-sm leading-relaxed">{f.details}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Browser Compatibility */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Browser Compatibility</h2>
        <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
          {compatibility.map((c, i) => (
            <div key={i} className={`flex items-center gap-3 px-5 py-3 ${i > 0 ? 'border-t border-white/5' : ''}`}>
              {c.supported
                ? <CheckCircle size={16} className="text-green-400 shrink-0" />
                : <XCircle size={16} className="text-red-400 shrink-0" />}
              <span className="text-white text-sm font-medium flex-1">{c.item}</span>
              {c.note && <span className="text-slate-500 text-xs">{c.note}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Voice Command Reference */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Voice Command Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            ['start session', 'Start hands-free tracking'],
            ['stop session', 'Stop tracking and release the camera; voice stays active'],
            ['pause control', 'Temporarily pause tracking and actions'],
            ['resume control', 'Resume tracking and actions'],
            ['scroll down', 'Scroll the active page downward'],
            ['scroll up', 'Scroll the active page upward'],
            ['go back', 'Navigate back in browse history'],
            ['go forward', 'Navigate forward in browse history'],
            ['open home', 'Return to the browse home page'],
            ['click', 'Activate the highlighted target via IntentGuard'],
            ['select', 'Select the highlighted target via IntentGuard'],
            ['confirm', 'Confirm a pending sensitive action'],
            ['cancel', 'Cancel a pending action'],
            ['start listening', 'Enable voice recognition'],
            ['stop listening', 'Disable voice recognition'],
            ['enable light mode', 'Switch the interface to light mode'],
            ['enable dark mode', 'Switch the interface to dark mode'],
            ['reload', 'Reload the current browse page'],
            ['start dictation', 'Type into the focused text field'],
            ['stop dictation', 'Exit voice typing mode'],
          ].map(([cmd, desc], i) => (
            <div key={i} className="bg-card border border-white/5 rounded-xl px-4 py-3 flex items-start gap-3">
              <code className="text-primary text-xs bg-primary/10 rounded px-1.5 py-0.5 shrink-0 mt-0.5">"{cmd}"</code>
              <span className="text-slate-300 text-sm">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Demo button */}
      <div className="flex gap-3 pb-4">
        <button
          onClick={() => onAction('Try It Now clicked!')}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary shadow-[0_0_15px_rgba(139,92,246,0.25)]"
          data-handsfree-target="try-it"
          data-handsfree-label="Try It Now"
        >
          Try It Now
        </button>
      </div>
    </div>
  );
};
