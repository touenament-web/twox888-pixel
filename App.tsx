
import React, { useState, useEffect } from 'react';
import { UserApp } from './views/UserApp';
import { AdminApp } from './views/AdminApp';
import { SplashScreen } from './components/SplashScreen';

const App: React.FC = () => {
  const [view, setView] = useState<'splash' | 'user' | 'admin'>('splash');

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        setView('admin');
      }
    };

    window.addEventListener('hashchange', handleHash);
    
    // Initial check
    if (window.location.hash === '#admin') {
      setView('admin');
    } else {
      const timer = setTimeout(() => {
        setView('user');
      }, 3500);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (view === 'splash') {
    return <SplashScreen />;
  }

  if (view === 'admin') {
    return <AdminApp onBack={() => {
      window.location.hash = '';
      setView('user');
    }} />;
  }

  return <UserApp onAdmin={() => {
    window.location.hash = 'admin';
    setView('admin');
  }} />;
};

export default App;
