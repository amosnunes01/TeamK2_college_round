import React from 'react';
import { Users, Target, Heart, Award } from 'lucide-react';

interface AboutPageProps {
  onAction: (msg: string) => void;
}

const teamMembers = [
  { name: 'Jadon Rodricks', role: 'Project Lead & Full-Stack Dev', initials: 'JR' },
  { name: 'Team Member 2', role: 'Computer Vision & ML', initials: 'TM' },
  { name: 'Team Member 3', role: 'UX & Accessibility Design', initials: 'TM' },
  { name: 'Team Member 4', role: 'Voice & NLP Systems', initials: 'TM' },
];

export const AboutPage: React.FC<AboutPageProps> = ({ onAction }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div className="border-b border-white/5 pb-8">
        <h1 className="text-3xl font-bold text-white mb-3">About HandsFree</h1>
        <p className="text-slate-300 text-lg leading-relaxed">
          HandsFree is a college project built to demonstrate that computers can be fully
          operated without a keyboard or mouse, using only a webcam, a microphone, and
          the built-in capabilities of modern browsers.
        </p>
      </div>

      {/* Mission */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-white">Mission</h2>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-6 space-y-3 text-slate-300 leading-relaxed">
          <p>
            Assistive technology has historically required expensive hardware. HandsFree
            challenges this assumption by using only a standard webcam — already present on
            most modern laptops — combined with open-source AI models that run entirely in
            the browser with no server round-trips.
          </p>
          <p>
            Our goal: a fully hands-free interface that is fast, private, and accessible to
            anyone with a webcam and a modern browser.
          </p>
        </div>
      </div>

      {/* Technology */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Award size={20} className="text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Technology Stack</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: 'MediaPipe HandLandmarker', desc: 'Real-time 21-point hand skeleton from a single webcam frame.' },
            { label: 'MediaPipe FaceLandmarker', desc: 'Head-pose estimation for cursor control via head tilt.' },
            { label: 'Web Speech API', desc: 'Browser-native speech recognition for voice commands and dictation.' },
            { label: 'React + Vite + TypeScript', desc: 'Fast, type-safe UI with minimal bundle overhead.' },
            { label: 'requestAnimationFrame', desc: 'GPU-synchronized pointer and scroll rendering at display refresh rate.' },
            { label: 'IntentGuard State Machine', desc: 'Safety layer that prevents accidental clicks and false commands.' },
          ].map((item, i) => (
            <div key={i} className="bg-card border border-white/5 rounded-xl p-4" data-handsfree-target={`tech-${i}`}>
              <h3 className="text-white font-medium text-sm mb-1">{item.label}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users size={20} className="text-emerald-400" />
          <h2 className="text-xl font-semibold text-white">The Team</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {teamMembers.map((member) => (
            <div key={member.name} className="bg-card border border-white/5 rounded-xl p-4 flex items-center gap-4" data-handsfree-target={`team-${member.name.split(' ')[0].toLowerCase()}`}>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {member.initials}
              </div>
              <div>
                <div className="text-white font-medium text-sm">{member.name}</div>
                <div className="text-slate-400 text-xs">{member.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Heart size={20} className="text-rose-400" />
          <h2 className="text-xl font-semibold text-white">Values</h2>
        </div>
        <div className="space-y-3 text-slate-300 leading-relaxed bg-card border border-white/5 rounded-xl p-6">
          <p><strong className="text-white">Privacy:</strong> No webcam frames leave your device. All processing happens locally in the browser using WASM-compiled models.</p>
          <p><strong className="text-white">Accessibility:</strong> The interface degrades gracefully. Every feature has a keyboard fallback.</p>
          <p><strong className="text-white">Honesty:</strong> We do not claim universal browser compatibility. The workspace is an in-app environment specifically designed for hands-free control.</p>
          <p><strong className="text-white">Safety:</strong> IntentGuard prevents accidental clicks, scroll gestures suspend dwelling, and every tracking-uncertain frame is discarded before it can cause unintended actions.</p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-3 pb-4">
        <button
          onClick={() => onAction('Contact the team — coming soon!')}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary"
          data-handsfree-target="contact-cta"
          data-handsfree-label="Contact Team"
        >
          Contact the Team
        </button>
        <button
          onClick={() => onAction('GitHub repository — coming soon!')}
          className="px-5 py-2.5 bg-card hover:bg-card-hover text-slate-300 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary border border-white/10"
          data-handsfree-target="github-cta"
          data-handsfree-label="GitHub Repo"
        >
          GitHub Repo
        </button>
      </div>
    </div>
  );
};
