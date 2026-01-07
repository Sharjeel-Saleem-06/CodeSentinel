/**
 * Tabs Component
 * Animated tab navigation
 */

import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-obsidian-900/50 rounded-xl', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive 
                ? 'text-obsidian-100' 
                : 'text-obsidian-400 hover:text-obsidian-200'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-obsidian-800 rounded-lg"
                style={{ zIndex: 0 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs font-bold',
                  isActive 
                    ? 'bg-cyber-500 text-obsidian-950' 
                    : 'bg-obsidian-700 text-obsidian-300'
                )}>
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

