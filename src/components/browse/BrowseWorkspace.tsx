import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Home, Globe } from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { SearchPage } from './pages/SearchPage';
import { FormPage } from './pages/FormPage';
import { FeaturesPage } from './pages/FeaturesPage';

type PageId = 'home' | 'about' | 'search' | 'form' | 'features';

interface BrowseWorkspaceProps {
  onNavigate?: (page: string) => void;
}

const pageNames: Record<PageId, string> = {
  home: 'Home',
  about: 'About',
  search: 'Search',
  form: 'Sample Form',
  features: 'Features',
};

export const BrowseWorkspace: React.FC<BrowseWorkspaceProps> = ({ onNavigate }) => {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [history, setHistory] = useState<PageId[]>(['home']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  const navigate = (page: PageId) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(page);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPage(page);
    onNavigate?.(page);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPage(history[newIndex]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentPage(history[newIndex]);
    }
  };

  const goHome = () => navigate('home');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  };

  React.useEffect(() => {
    const onHome = () => goHome();
    window.addEventListener('handsfree:home', onHome);
    return () => window.removeEventListener('handsfree:home', onHome);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={navigate} onAction={showNotification} />;
      case 'about':
        return <AboutPage onAction={showNotification} />;
      case 'search':
        return <SearchPage onAction={showNotification} />;
      case 'form':
        return <FormPage onAction={showNotification} />;
      case 'features':
        return <FeaturesPage onAction={showNotification} />;
      default:
        return <HomePage onNavigate={navigate} onAction={showNotification} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Browser-like toolbar */}
      <div className="bg-surface border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          onClick={goBack}
          disabled={historyIndex <= 0}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-primary"
          data-handsfree-action="go-back"
          title="Go Back"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={goForward}
          disabled={historyIndex >= history.length - 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-primary"
          data-handsfree-action="go-forward"
          title="Go Forward"
        >
          <ArrowRight size={18} />
        </button>
        <button
          onClick={goHome}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-card transition-all focus:outline-none focus:ring-2 focus:ring-primary"
          data-handsfree-action="go-home"
          title="Home"
        >
          <Home size={18} />
        </button>

        {/* Address bar */}
        <div className="flex-1 max-w-2xl bg-card border border-white/5 rounded-lg px-4 py-2 text-sm flex items-center shadow-inner">
          <Globe size={14} className="text-slate-500 mr-2" />
          <span className="text-slate-400 mr-1">handsfree://</span>
          <span className="text-white font-medium">{currentPage}</span>
        </div>

        {/* Page nav links */}
        <div className="flex items-center gap-1">
          {(Object.keys(pageNames) as PageId[]).map((pid) => (
            <button
              key={pid}
              onClick={() => navigate(pid)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                currentPage === pid
                  ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-card border border-transparent'
              }`}
              data-handsfree-target={pid}
              data-handsfree-label={pageNames[pid]}
            >
              {pageNames[pid]}
            </button>
          ))}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 text-green-400 text-sm flex items-center justify-center gap-2 animate-pulse-slow shadow-[0_0_15px_rgba(34,197,94,0.1)]">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          {notification}
        </div>
      )}

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto p-6" id="browse-viewport">
        {renderPage()}
      </div>
    </div>
  );
};
