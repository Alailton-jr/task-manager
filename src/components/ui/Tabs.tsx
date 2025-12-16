import React from 'react';

interface TabsProps {
  tabs: Array<{ id: string; label: string; icon?: React.ReactNode }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex gap-2 border-b border-surface-lighter">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === tab.id
              ? 'text-accent border-accent'
              : 'text-text-secondary border-transparent hover:text-text-primary hover:border-surface-lighter'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};
