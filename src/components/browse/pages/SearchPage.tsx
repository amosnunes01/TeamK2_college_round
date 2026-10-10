import React, { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';

interface SearchPageProps {
  onAction: (msg: string) => void;
}

const sampleResults = [
  { title: 'Getting Started with Handsfree', snippet: 'Learn how to set up and use Handsfree for accessible browsing.' },
  { title: 'Voice Commands Reference', snippet: 'Complete list of supported voice commands for navigation and interaction.' },
  { title: 'Hand Tracking Guide', snippet: 'How to use hand tracking for cursor control with MediaPipe.' },
  { title: 'Calibration Tips', snippet: 'Quick calibration guide to get set up in under 30 seconds.' },
  { title: 'IntentGuard Overview', snippet: 'Understanding the activation safety system that prevents accidental clicks.' },
  { title: 'Performance Evaluation', snippet: 'How to run evaluation trials and compare input methods.' },
];

export const SearchPage: React.FC<SearchPageProps> = ({ onAction }) => {
  const [query, setQuery] = useState('');

  const filteredResults = query.trim()
    ? sampleResults.filter(
        (r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.snippet.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">Search</h1>

      {/* Search Field */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try typing 'accessibility' or use voice dictation..."
          className="w-full bg-card border border-white/5 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
          data-handsfree-input="search"
          data-handsfree-label="Search field"
          autoFocus
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
          <SearchIcon className="w-5 h-5" />
        </span>
      </div>

      {/* Results */}
      {query.trim() ? (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">
            {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for "{query}"
          </p>
          {filteredResults.length > 0 ? (
            filteredResults.map((result, i) => (
              <button
                key={i}
                onClick={() => onAction(`Opened: ${result.title}`)}
                className="block w-full text-left bg-card border border-white/5 rounded-xl p-5 hover:border-primary/30 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                data-handsfree-target={`search-result-${i}`}
                data-handsfree-label={result.title}
              >
                <h3 className="text-primary font-semibold">{result.title}</h3>
                <p className="text-slate-400 text-sm mt-1">{result.snippet}</p>
              </button>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">No results found for "{query}"</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg">Enter a search query above</p>
          <p className="text-slate-600 text-sm mt-2">
            Try saying "Start typing" followed by your search term
          </p>
        </div>
      )}
    </div>
  );
};
