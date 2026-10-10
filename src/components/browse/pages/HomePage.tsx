import React from 'react';
import { BookOpen, Search, FileText, Star, Hand, Mic, MousePointer, Zap, Shield, Target } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: 'about' | 'search' | 'form' | 'features') => void;
  onAction: (msg: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onAction }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Hero */}
      <div className="text-center py-10 border-b border-white/5">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-primary text-xs font-semibold mb-4">
          <Hand size={12} /> HandsFree Demo Environment
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
          Welcome to the<br />HandsFree Workspace
        </h1>
        <p className="text-slate-300 text-lg leading-relaxed max-w-xl mx-auto">
          Navigate, click, scroll and type using only hand gestures, head movement or voice.
          No keyboard or mouse required.
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => onAction('Get Started clicked!')}
            className="px-7 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary shadow-[0_0_20px_rgba(139,92,246,0.35)]"
            data-handsfree-target="hero-get-started"
            data-handsfree-label="Get Started"
          >
            Get Started
          </button>
          <button
            onClick={() => onNavigate('about')}
            className="px-7 py-3 bg-card hover:bg-card-hover text-slate-300 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary border border-white/10"
            data-handsfree-target="hero-learn-more"
            data-handsfree-label="Learn More"
          >
            Learn More
          </button>
        </div>
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Browse Pages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NavCard title="About" description="Learn about the HandsFree project and our team." icon={<BookOpen className="w-7 h-7" />} onClick={() => onNavigate('about')} />
          <NavCard title="Search" description="Try voice typing in the search field." icon={<Search className="w-7 h-7" />} onClick={() => onNavigate('search')} />
          <NavCard title="Sample Form" description="Fill out a form using voice and gesture input." icon={<FileText className="w-7 h-7" />} onClick={() => onNavigate('form')} />
          <NavCard title="Features" description="Explore full capabilities and interaction modes." icon={<Star className="w-7 h-7" />} onClick={() => onNavigate('features')} />
        </div>
      </div>

      {/* Interactive Elements — for dwell-click testing */}
      <div className="bg-card border border-white/5 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-1">Interactive Elements</h2>
        <p className="text-slate-400 text-sm mb-4">Hover to dwell-click, or say <span className="text-primary">"click"</span> while targeting.</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Learn More', color: 'bg-primary hover:bg-primary/90', msg: 'Learn More clicked!' },
            { label: 'Get Started', color: 'bg-blue-600 hover:bg-blue-500', msg: 'Get Started clicked!' },
            { label: 'Contact Us', color: 'bg-emerald-600 hover:bg-emerald-500', msg: 'Contact Us clicked!' },
            { label: 'Sign Up', color: 'bg-rose-600 hover:bg-rose-500', msg: 'Sign Up clicked!' },
            { label: 'Download', color: 'bg-amber-600 hover:bg-amber-500', msg: 'Download clicked!' },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => onAction(btn.msg)}
              className={`px-5 py-2.5 ${btn.color} text-white rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary`}
              data-handsfree-target={btn.label.toLowerCase().replace(' ', '-')}
              data-handsfree-label={btn.label}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* How It Works — scrollable content for hand-scroll testing */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
        <div className="space-y-4">
          {[
            { icon: <Hand size={20} />, title: 'Hand Tracking', color: 'text-purple-400', desc: 'A webcam detects your hand using MediaPipe. Move your index finger to control the pointer. Raise two fingers (victory gesture) to enter scroll mode — vertical movement then scrolls the page smoothly.' },
            { icon: <MousePointer size={20} />, title: 'Dwell Click', color: 'text-blue-400', desc: 'Hover over any button or link for the configured dwell time (default 800 ms). A progress indicator confirms the action before it fires. IntentGuard blocks accidental clicks during tracking uncertainty.' },
            { icon: <Mic size={20} />, title: 'Voice Commands', color: 'text-emerald-400', desc: 'Say commands like "go back", "go forward", "scroll down", "click" or "pause control" at any time. The voice strip at the top shows listening state and the last recognized command.' },
            { icon: <Target size={20} />, title: 'IntentGuard', color: 'text-amber-400', desc: 'Every action passes through the IntentGuard state machine: idle → tracking → targeted → executing. Scrolling gestures suspend dwelling. Tracking loss cancels pending actions immediately.' },
            { icon: <Shield size={20} />, title: 'Privacy First', color: 'text-rose-400', desc: 'All processing happens locally in the browser. No webcam frames leave your device. Camera and microphone resources are released completely when you stop the session.' },
            { icon: <Zap size={20} />, title: 'Performance', color: 'text-yellow-400', desc: 'Pointer and scroll updates run through requestAnimationFrame at display refresh rate. React state updates for tracking health are throttled to 2 Hz. GPU-accelerated transform3d renders the pointer cursor.' },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-card border border-white/5 rounded-xl p-5 hover:border-primary/20 transition-colors"
              data-handsfree-target={`how-${i}`}
            >
              <div className={`flex items-center gap-2 mb-2 ${item.color}`}>
                {item.icon}
                <h3 className="font-semibold text-white">{item.title}</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-card border border-white/5 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Links</h2>
        <div className="space-y-2">
          {[
            { label: 'About the Project', page: 'about' as const },
            { label: 'Search Demo', page: 'search' as const },
            { label: 'Form Demo', page: 'form' as const },
            { label: 'Full Feature List', page: 'features' as const },
          ].map((link) => (
            <button
              key={link.page}
              onClick={() => onNavigate(link.page)}
              className="block w-full text-left px-4 py-2.5 text-primary hover:text-white hover:bg-slate-700/50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary"
              data-handsfree-target={`link-${link.page}`}
              data-handsfree-label={link.label}
            >
              → {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* Extra scroll content */}
      <div className="text-center py-8 text-slate-600 text-sm border-t border-white/5">
        <p>HandsFree Demo Workspace · All processing local · No data uploaded</p>
      </div>
    </div>
  );
};

function NavCard({ title, description, icon, onClick }: {
  title: string; description: string; icon: React.ReactNode; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-card border border-white/5 rounded-xl p-5 text-left hover:border-primary/30 transition-all focus:outline-none focus:ring-2 focus:ring-primary group"
      data-handsfree-target={`nav-${title.toLowerCase().replace(' ', '-')}`}
      data-handsfree-label={title}
    >
      <span className="mb-3 block text-primary">{icon}</span>
      <h3 className="text-white font-semibold group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-slate-400 text-sm mt-1">{description}</p>
    </button>
  );
}
