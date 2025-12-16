import React from 'react';
import { useStore } from '@/store';
import type { TabType } from '@/types';

const tabs: Array<{ id: TabType; label: string; icon: string }> = [
  { id: 'tasks', label: 'Tasks', icon: '✓' },
  { id: 'reminders', label: 'Reminders', icon: '🔔' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'routine', label: 'Routine', icon: '⏰' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export const Navigation: React.FC = () => {
  const { currentTab, setCurrentTab } = useStore();

  return (
    <nav className="bg-surface/30 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
      <div className="flex justify-center px-4">
        <div className="flex space-x-1 overflow-x-auto py-3 no-scrollbar max-w-6xl w-full">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 text-sm
                  ${isActive 
                    ? 'text-white bg-white/10 shadow-inner' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }
                `}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-accent/10 to-transparent opacity-50" />
                )}
                <span className={`text-lg transition-transform duration-300 ${isActive ? 'scale-110 text-accent' : ''}`}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
