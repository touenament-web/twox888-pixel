
import React, { useEffect, useState } from 'react';

export const SplashScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev < 5 ? prev + 1 : 5));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center z-[9999]">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400 tracking-tighter animate-pulse">
          YES WIN
        </h1>
      </div>
      
      <div className="flex gap-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-500 shadow-lg ${
              i < progress 
                ? 'bg-cyan-400 scale-125 shadow-cyan-500/50' 
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      
      <div className="mt-8 text-slate-400 text-sm font-medium tracking-widest uppercase opacity-60">
        Loading Assets...
      </div>
    </div>
  );
};
