import React from 'react';

interface AboutPageProps {
  onAction: (msg: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onAction }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">About Handsfree</h1>

      <div className="bg-card border border-white/5 rounded-xl p-6 space-y-4">
        <p className="text-slate-300 leading-relaxed">
          Handsfree is an accessibility-first browsing solution developed for the
          CRCE Bit N Build 2026 hackathon by Team K2.
        </p>
        <p className="text-slate-300 leading-relaxed">
          Millions of people struggle to use a mouse or keyboard comfortably due
          to motor impairments, temporary injuries, or repetitive strain. While
          assistive devices exist, they can be expensive or require specialized
          hardware.
        </p>
        <p className="text-slate-300 leading-relaxed">
          Handsfree uses webcam tracking and voice recognition to provide an
          accessible browsing experience using only a standard webcam and
          microphone — no specialized hardware required.
        </p>
      </div>

      <div className="bg-card border border-white/5 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Our Approach</h2>
        <ul className="space-y-3">
          {[
            'Privacy-first: all processing happens locally in your browser.',
            'No API keys, databases, or paid services required.',
            'Open-source and designed for community contribution.',
            'Built with React, TypeScript, MediaPipe, and the Web Speech API.',
            'IntentGuard: deterministic safety system to prevent accidental activations.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-300">
              <span className="text-primary mt-0.5">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-card border border-white/5 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Team K2</h2>
        <p className="text-slate-300 mb-4">
          We are students at CRCE passionate about building technology that
          makes the web accessible to everyone.
        </p>
        <button
          onClick={() => onAction('Contact Team K2 action triggered!')}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]"
          data-handsfree-target="contact-team"
          data-handsfree-label="Contact Team"
        >
          Contact Team
        </button>
      </div>
    </div>
  );
};
