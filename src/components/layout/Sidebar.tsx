import React from 'react';
import { LayoutDashboard, Globe, BarChart2, Settings } from 'lucide-react';

export type SidebarTab = 'dashboard' | 'browse' | 'evaluation' | 'settings';

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

const tabs: { id: SidebarTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'browse', label: 'Browse', icon: Globe },
  { id: 'evaluation', label: 'Evaluation', icon: BarChart2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="w-16 md:w-20 bg-surface border-r border-white/5 flex flex-col items-center py-6 gap-4">
      {/* Logo */}
      <div className="w-10 h-10 mb-4 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(139,92,246,0.3)]">
        H
      </div>
      
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
              isActive
                ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-inner'
                : 'text-slate-400 hover:bg-card hover:text-slate-200 border-l-2 border-transparent'
            }`}
            title={tab.label}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          </button>
        );
      })}
    </aside>
  );
};
