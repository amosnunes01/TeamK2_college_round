import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Home, RefreshCw, Globe,
  Mic, MicOff, ChevronRight
} from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { SearchPage } from './pages/SearchPage';
import { FormPage } from './pages/FormPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { BrowseProvider, useBrowseContext } from '../../context/BrowseContext';

type PageId = 'home' | 'about' | 'search' | 'form' | 'features';

export interface BrowseWorkspaceProps {
  isListening?: boolean;
  lastVoiceCommand?: string | null;
  isActive?: boolean;
}

const pageNames: Record<PageId, string> = {
  home: 'Home',
  about: 'About',
  search: 'Search',
  form: 'Sample Form',
  features: 'Features',
};

// Inner component that can consume BrowseContext
const BrowseWorkspaceInner: React.FC<BrowseWorkspaceProps> = ({
  isListening = false,
  lastVoiceCommand = null,
  isActive = true,
}) => {
  const { scrollContainerRef } = useBrowseContext();

  const [history, setHistory] = useState<{ pages: PageId[]; index: number }>({ pages: ['home'], index: 0 });
  const currentPage = history.pages[history.index];
  const [notification, setNotification] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setNotification(null), 2500);
  }, []);

  const navigate = useCallback((page: PageId) => {
    setHistory(previous => {
      const pages = previous.pages.slice(0, previous.index + 1);
      pages.push(page);
      return { pages, index: pages.length - 1 };
    });
    // Reset scroll position on navigation
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [scrollContainerRef]);

  const goBack = useCallback(() => {
    setHistory(previous => previous.index > 0
      ? { ...previous, index: previous.index - 1 }
      : previous);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [scrollContainerRef]);

  const goForward = useCallback(() => {
    setHistory(previous => previous.index < previous.pages.length - 1
      ? { ...previous, index: previous.index + 1 }
      : previous);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [scrollContainerRef]);

  const goHome = useCallback(() => navigate('home'), [navigate]);

  const reload = useCallback(() => {
    setReloadKey(k => k + 1);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    showNotification('Page reloaded');
  }, [scrollContainerRef, showNotification]);

  // Voice-driven scroll targeting the stable scroll container
  const voiceScroll = useCallback((direction: 'up' | 'down') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const amount = container.clientHeight * 0.45;
    container.scrollBy({ top: direction === 'down' ? amount : -amount, behavior: 'smooth' });
  }, [scrollContainerRef]);

  // Listen for custom window events dispatched by App.tsx voice handler
  useEffect(() => {
    const onHome = () => goHome();
    const onBack = () => goBack();
    const onForward = () => goForward();
    const onReload = () => reload();
    const onScroll = (e: Event) => {
      const detail = (e as CustomEvent<{ direction: 'up' | 'down' }>).detail;
      voiceScroll(detail.direction);
    };

    window.addEventListener('handsfree:home', onHome);
    window.addEventListener('handsfree:back', onBack);
    window.addEventListener('handsfree:forward', onForward);
    window.addEventListener('handsfree:reload', onReload);
    window.addEventListener('handsfree:scroll', onScroll);

    return () => {
      window.removeEventListener('handsfree:home', onHome);
      window.removeEventListener('handsfree:back', onBack);
      window.removeEventListener('handsfree:forward', onForward);
      window.removeEventListener('handsfree:reload', onReload);
      window.removeEventListener('handsfree:scroll', onScroll);
    };
  }, [goHome, goBack, goForward, reload, voiceScroll]);

  // Cleanup notification timer
  useEffect(() => () => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
  }, []);

  const canGoBack = history.index > 0;
  const canGoForward = history.index < history.pages.length - 1;

  const renderPage = () => {
    switch (currentPage) {
      case 'home':     return <HomePage key={`home-${reloadKey}`} onNavigate={navigate} onAction={showNotification} />;
      case 'about':    return <AboutPage key={`about-${reloadKey}`} onAction={showNotification} />;
      case 'search':   return <SearchPage key={`search-${reloadKey}`} onAction={showNotification} />;
      case 'form':     return <FormPage key={`form-${reloadKey}`} onAction={showNotification} />;
      case 'features': return <FeaturesPage key={`features-${reloadKey}`} onAction={showNotification} />;
      default:         return <HomePage key={`home-${reloadKey}`} onNavigate={navigate} onAction={showNotification} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">

      {/* Voice Command Status Strip */}
      <div className={`px-4 py-1.5 text-xs flex items-center gap-2 border-b transition-all ${
        isListening
          ? 'bg-primary/5 border-primary/20'
          : 'bg-transparent border-white/5'
      }`}>
        <span className={`flex items-center gap-1.5 ${isListening ? 'text-primary' : 'text-slate-500'}`}>
          {isListening ? <Mic size={11} className="animate-pulse" /> : <MicOff size={11} />}
          {isListening ? 'Listening for voice commands' : 'Voice off'}
        </span>
        {lastVoiceCommand && (
          <>
            <ChevronRight size={11} className="text-slate-600" />
            <span className="text-slate-400 font-medium truncate max-w-xs">
              "{lastVoiceCommand}"
            </span>
          </>
        )}
      </div>

      {/* Browser-like toolbar */}
      <div className="bg-surface border-b border-white/5 px-4 py-2.5 flex items-center gap-2">
        {/* Nav buttons */}
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-primary"
          data-handsfree-action="go-back"
          title="Go Back (voice: 'go back')"
        >
          <ArrowLeft size={17} />
        </button>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-primary"
          data-handsfree-action="go-forward"
          title="Go Forward (voice: 'go forward')"
        >
          <ArrowRight size={17} />
        </button>
        <button
          onClick={goHome}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-card transition-all focus:outline-none focus:ring-2 focus:ring-primary"
          data-handsfree-action="go-home"
          title="Home (voice: 'go home')"
        >
          <Home size={17} />
        </button>
        <button
          onClick={reload}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-card transition-all focus:outline-none focus:ring-2 focus:ring-primary"
          data-handsfree-action="reload"
          title="Reload (voice: 'reload')"
        >
          <RefreshCw size={15} />
        </button>

        {/* Address bar */}
        <div className="flex-1 bg-card border border-white/5 rounded-lg px-3 py-1.5 text-sm flex items-center shadow-inner min-w-0">
          <Globe size={13} className="text-slate-500 mr-1.5 shrink-0" />
          <span className="text-slate-500 mr-1 shrink-0">handsfree://</span>
          <span className="text-white font-medium truncate">{currentPage}</span>
          <span className="ml-auto text-slate-600 text-xs shrink-0">internal</span>
        </div>

        {/* Page nav tabs */}
        <div className="flex items-center gap-1 shrink-0">
          {(Object.keys(pageNames) as PageId[]).map((pid) => (
            <button
              key={pid}
              onClick={() => navigate(pid)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                currentPage === pid
                  ? 'bg-primary/20 text-primary border border-primary/30'
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

      {/* Action Notification */}
      {notification && (
        <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-1.5 text-green-400 text-xs flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {notification}
        </div>
      )}

      {/* Page Content — stable ref for hand scroll */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-6"
        id="browse-viewport"
        data-handsfree-scroll-container={isActive ? '' : undefined}
      >
        {renderPage()}
      </div>
    </div>
  );
};

// Outer component provides BrowseContext
export const BrowseWorkspace: React.FC<BrowseWorkspaceProps> = (props) => (
  <BrowseProvider>
    <BrowseWorkspaceInner {...props} />
  </BrowseProvider>
);
