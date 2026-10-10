import React from 'react';
import { BookOpen, Search, FileText, Star } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: 'about' | 'search' | 'form' | 'features') => void;
  onAction: (msg: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onAction }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Handsfree Demo Environment
        </h1>
        <p className="text-slate-300 text-lg leading-relaxed max-w-xl mx-auto">
          This is the internal browsing workspace. Use hand tracking, head
          movements, or voice commands to navigate, click, scroll, and type.
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NavCard
          title="About"
          description="Learn about the Handsfree project and our team."
          icon={<BookOpen className="w-8 h-8" />}
          onClick={() => onNavigate('about')}
        />
        <NavCard
          title="Search"
          description="Try voice typing in the search field."
          icon={<Search className="w-8 h-8" />}
          onClick={() => onNavigate('search')}
        />
        <NavCard
          title="Sample Form"
          description="Fill out a form using voice and gesture input."
          icon={<FileText className="w-8 h-8" />}
          onClick={() => onNavigate('form')}
        />
        <NavCard
          title="Features"
          description="Explore the features and capabilities."
          icon={<Star className="w-8 h-8" />}
          onClick={() => onNavigate('features')}
        />
      </div>

      {/* Action Buttons */}
      <div className="bg-card border border-white/5 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4" id="actions-section">
          Interactive Elements
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onAction('Learn More button clicked!')}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            data-handsfree-target="learn-more"
            data-handsfree-label="Learn More"
          >
            Learn More
          </button>
          <button
            onClick={() => onAction('Get Started button clicked!')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
            data-handsfree-target="get-started"
            data-handsfree-label="Get Started"
          >
            Get Started
          </button>
          <button
            onClick={() => onAction('Contact Us button clicked!')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
            data-handsfree-target="contact"
            data-handsfree-label="Contact Us"
          >
            Contact Us
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="space-y-6" id="features-section">
        <h2 className="text-xl font-semibold text-white">Features Overview</h2>
        {[
          { title: 'Hand Tracking', desc: 'Use MediaPipe to track your hand and control the cursor with natural gestures.' },
          { title: 'Head Tracking', desc: 'Move the cursor by tilting your head — great for users with limited hand mobility.' },
          { title: 'Voice Navigation', desc: 'Say commands like "scroll down", "click", "go back" to navigate pages.' },
          { title: 'Voice Typing', desc: 'Dictate text into search fields and forms using the Web Speech API.' },
          { title: 'IntentGuard', desc: 'Smart activation system that prevents accidental clicks and unwanted commands.' },
          { title: 'Quick Calibration', desc: 'Get set up in under 30 seconds with our guided calibration workflow.' },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-card border border-white/5 rounded-xl p-5 hover:border-primary/30 transition-colors"
            data-handsfree-target={`feature-${i}`}
          >
            <h3 className="text-white font-semibold mb-1">{item.title}</h3>
            <p className="text-slate-400 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Links section */}
      <div className="bg-card border border-white/5 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Links</h2>
        <div className="space-y-2">
          {[
            { label: 'About Us', page: 'about' as const },
            { label: 'Search Demo', page: 'search' as const },
            { label: 'Form Demo', page: 'form' as const },
            { label: 'Features List', page: 'features' as const },
          ].map((link) => (
            <button
              key={link.page}
              onClick={() => onNavigate(link.page)}
              className="block w-full text-left px-4 py-2 text-primary hover:text-primary/80 hover:bg-slate-700/50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary"
              data-handsfree-target={`link-${link.page}`}
              data-handsfree-label={link.label}
            >
              → {link.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

function NavCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-card border border-white/5 rounded-xl p-5 text-left hover:border-primary/30 hover:bg-card transition-all focus:outline-none focus:ring-2 focus:ring-primary group"
      data-handsfree-target={`nav-${title.toLowerCase()}`}
      data-handsfree-label={title}
    >
      <span className="mb-3 block text-primary">{icon}</span>
      <h3 className="text-white font-semibold group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-slate-400 text-sm mt-1">{description}</p>
    </button>
  );
}
