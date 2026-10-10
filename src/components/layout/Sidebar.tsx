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
    <aside className="sidebar-shell w-16 md:w-20 border-r border-white/5 flex flex-col items-center py-6 gap-4">
      <div className="brand-mark w-11 h-11 mb-4 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-[0_0_30px_rgba(124,58,237,0.45)]">
        H
      </div>

      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`nav-button w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary ${
              isActive
                ? 'nav-button-active text-primary shadow-[0_0_18px_rgba(124,58,237,0.25)]'
                : 'text-slate-400 hover:text-slate-200'
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
