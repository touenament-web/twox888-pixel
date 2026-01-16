
import React, { useState } from 'react';
import { Storage } from '../../store';
import { User } from '../../types';

interface LoginFormProps {
  onLogin: (user: User) => void;
  onToggle: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Storage.getUsers() returns a Promise, so it must be awaited
    const users = await Storage.getUsers();
    const user = users.find(u => u.gmail.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (user) {
      if (user.isBlocked) {
        setError("Your account is blocked by admin.");
        return;
      }
      onLogin(user);
    } else {
      setError("Invalid Gmail or Password. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full"></div>

      <div className="w-full max-w-sm bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-slate-700/50 z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">WELCOME BACK</h1>
          <p className="text-slate-400 text-sm font-medium">Login to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-slate-400 text-[11px] font-black uppercase tracking-widest ml-1">Gmail Address</label>
            <input 
              type="email" 
              className="w-full bg-[#0a0f1e]/80 border border-slate-700/50 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-slate-400 text-[11px] font-black uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPass ? "text" : "password"}
                className="w-full bg-[#0a0f1e]/80 border border-slate-700/50 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm tracking-widest"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs uppercase hover:text-cyan-400 transition-colors"
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 py-2.5 rounded-xl px-4 animate-in fade-in slide-in-from-top-1 duration-300">
              <p className="text-red-400 text-xs font-bold text-center italic">{error}</p>
            </div>
          )}

          <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 active:scale-95 transition-all text-sm tracking-widest mt-2 uppercase">
            LOGIN NOW
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-slate-500 text-xs font-bold">
            Don't have an account? 
            <button onClick={onToggle} className="text-cyan-400 font-black ml-2 uppercase hover:underline transition-all">REGISTER</button>
          </p>
        </div>
      </div>
    </div>
  );
};
