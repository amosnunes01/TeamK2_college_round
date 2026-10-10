import React, { useState, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';

interface SearchPageProps {
  onAction: (msg: string) => void;
}

const suggestedSearches = [
  'hand tracking tutorial',
  'voice commands accessibility',
  'hands-free computing',
  'MediaPipe gesture recognition',
  'assistive technology browser',
];

const trendingTopics = [
  { label: 'AI Accessibility', tag: 'trending' },
  { label: 'WebAssembly ML', tag: 'hot' },
  { label: 'Eye Tracking UX', tag: 'popular' },
  { label: 'Browser Speech API', tag: 'new' },
];

export const SearchPage: React.FC<SearchPageProps> = ({ onAction }) => {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSubmitted(true);
    setHistory(prev => [trimmed, ...prev.filter(h => h !== trimmed)].slice(0, 6));
    onAction(`Searched for: "${trimmed}"`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearSearch = () => {
    setQuery('');
    setSubmitted(false);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Search</h1>
        <p className="text-slate-400 text-sm">
          Click the field to focus it, then use voice dictation to type.
          Say <span className="text-primary font-medium">"start dictation"</span> then speak your query.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSubmitted(false); }}
          onKeyDown={handleKeyDown}
          placeholder="Type or dictate your search query…"
          className="w-full bg-card border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
          data-handsfree-target="search-input"
          data-handsfree-label="Search Input"
          aria-label="Search"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-white focus:outline-none"
            data-handsfree-target="clear-search"
            data-handsfree-label="Clear Search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary shadow-[0_0_15px_rgba(139,92,246,0.25)]"
        data-handsfree-target="search-submit"
        data-handsfree-label="Search"
      >
        Search
      </button>

      {/* Result */}
      {submitted && query.trim() && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <p className="text-green-400 font-medium text-sm mb-1">Search executed</p>
          <p className="text-slate-300 text-sm">Results for: <span className="text-white font-semibold">"{query.trim()}"</span></p>
          <p className="text-slate-500 text-xs mt-2">This is a demo — no real search engine is connected.</p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Searches</h2>
          </div>
          <div className="space-y-1">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => { setQuery(h); setSubmitted(false); }}
                className="w-full text-left px-4 py-2 text-slate-300 hover:text-white hover:bg-card rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                data-handsfree-target={`history-${i}`}
                data-handsfree-label={h}
              >
                <Clock size={12} className="inline mr-2 text-slate-500" /> {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Suggested Searches</h2>
        <div className="flex flex-wrap gap-2">
          {suggestedSearches.map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); setSubmitted(false); }}
              className="px-3 py-1.5 bg-card border border-white/10 text-slate-300 hover:text-white hover:border-primary/40 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary"
              data-handsfree-target={`suggest-${s.split(' ')[0]}`}
              data-handsfree-label={s}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Trending Topics</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {trendingTopics.map((t) => (
            <button
              key={t.label}
              onClick={() => { setQuery(t.label); setSubmitted(false); onAction(`Trending: ${t.label}`); }}
              className="bg-card border border-white/5 rounded-xl p-3 text-left hover:border-primary/30 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
              data-handsfree-target={`trend-${t.label.split(' ')[0].toLowerCase()}`}
              data-handsfree-label={t.label}
            >
              <span className="text-white text-sm font-medium">{t.label}</span>
              <span className="ml-2 text-xs text-primary bg-primary/10 rounded-full px-2 py-0.5">{t.tag}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
