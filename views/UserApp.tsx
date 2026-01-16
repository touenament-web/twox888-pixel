
import React, { useState, useEffect } from 'react';
import { User, AppSettings } from '../types';
import { Storage, INITIAL_SETTINGS } from '../store';
import { LoginForm } from './user/LoginForm';
import { RegisterForm } from './user/RegisterForm';
import { HomeView } from './user/HomeView';
import { TradingView } from './user/TradingView';
import { DepositView } from './user/DepositView';
import { WithdrawView } from './user/WithdrawView';
import { HistoryView } from './user/HistoryView';
import { ProfileView } from './user/ProfileView';
import { BottomNav } from './user/BottomNav';

interface UserAppProps {
  onAdmin: () => void;
}

export const UserApp: React.FC<UserAppProps> = ({ onAdmin }) => {
  // Initialize with null/defaults and fetch in useEffect
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'home' | 'trading' | 'deposit' | 'withdraw' | 'history' | 'profile'>('home');
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  useEffect(() => {
    const initApp = async () => {
      // Fetch settings
      const currentSettings = await Storage.getSettings();
      setSettings(currentSettings);

      // Fetch user object using the ID from localStorage
      const userId = Storage.getCurrentUser();
      if (userId) {
        const user = await Storage.getUser(userId);
        if (user) {
          if (user.isBlocked) {
            Storage.setCurrentUser(null);
            setCurrentUser(null);
            alert("Your account is blocked.");
          } else {
            setCurrentUser(user);
          }
        }
      }
    };
    initApp();
  }, []);

  if (!currentUser) {
    return authView === 'login' ? (
      <LoginForm 
        onLogin={(u) => { setCurrentUser(u); Storage.setCurrentUser(u.id); }} 
        onToggle={() => setAuthView('register')} 
      />
    ) : (
      <RegisterForm 
        onRegister={(u) => { setCurrentUser(u); Storage.setCurrentUser(u.id); }} 
        onToggle={() => setAuthView('login')} 
      />
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case 'trading': return <TradingView user={currentUser} onUpdateUser={setCurrentUser} />;
      case 'deposit': return <DepositView user={currentUser} settings={settings} />;
      case 'withdraw': return <WithdrawView user={currentUser} onUpdateUser={setCurrentUser} />;
      case 'history': return <HistoryView user={currentUser} />;
      case 'profile': return <ProfileView user={currentUser} onLogout={() => { Storage.setCurrentUser(null); setCurrentUser(null); }} onUpdateUser={setCurrentUser} settings={settings} />;
      default: return <HomeView user={currentUser} settings={settings} onTrading={() => setActiveTab('trading')} onUpdateUser={setCurrentUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-20 relative">
      <header className="bg-slate-800/50 backdrop-blur-md sticky top-0 z-50 px-4 py-3 flex justify-between items-center border-b border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-white">{settings.appTitle}</h2>
          <p className="text-xs text-slate-400">UID: {currentUser.uid}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1.5 rounded-full shadow-lg">
          <span className="text-sm font-bold">৳ {currentUser.balance.toFixed(2)}</span>
        </div>
      </header>

      <main className="p-4 animate-in fade-in duration-500">
        {renderView()}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};
