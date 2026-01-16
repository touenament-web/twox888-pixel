
import React from 'react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'trading', label: 'Trading', icon: '📊' },
    { id: 'deposit', label: 'Deposit', icon: '💰' },
    { id: 'withdraw', label: 'Withdraw', icon: '🏧' },
    { id: 'history', label: 'History', icon: '🕒' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-xl border-t border-slate-700 px-2 py-2 flex justify-around items-center z-50">
      {tabs.map(tab => (
        <button 
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center gap-1 min-w-[50px] transition-all duration-300 ${activeTab === tab.id ? 'scale-110' : 'opacity-40 grayscale'}`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span className={`text-[10px] font-bold ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-400'}`}>
            {tab.label}
          </span>
          {activeTab === tab.id && (
            <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
          )}
        </button>
      ))}
    </nav>
  );
};
