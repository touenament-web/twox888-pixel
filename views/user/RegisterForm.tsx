
import React, { useState } from 'react';
import { Storage } from '../../store';
import { User } from '../../types';

interface RegisterFormProps {
  onRegister: (user: User) => void;
  onToggle: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [promo, setPromo] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const users = await Storage.getUsers();
      if (users.some(u => u.gmail.toLowerCase() === email.toLowerCase())) {
        setError("This Gmail is already registered.");
        setLoading(false);
        return;
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        gmail: email.toLowerCase(),
        password: password,
        balance: 0, // Balance is always 0 on start as requested
        uid: Math.floor(100000 + Math.random() * 900000).toString(),
        isBlocked: false,
        isVerified: false,
        promoCode: Math.random().toString(36).substring(7).toUpperCase(),
        referralCount: 0,
        depositCount: 0,
        requiredTurnover: 0,
        completedTurnover: 0
      };

      await Storage.saveUser(newUser);
      onRegister(newUser);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full"></div>

      <div className="w-full max-w-sm bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-slate-700/50 z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">CREATE ACCOUNT</h1>
          <p className="text-slate-400 text-sm font-medium">Join YES WIN today</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Gmail Address</label>
            <input 
              type="email" 
              className="w-full bg-[#0a0f1e]/80 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPass ? "text" : "password"}
                className="w-full bg-[#0a0f1e]/80 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm tracking-widest"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Confirm Password</label>
            <input 
              type="password" 
              className="w-full bg-[#0a0f1e]/80 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm tracking-widest"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Promo Code (Optional)</label>
            <input 
              type="text" 
              className="w-full bg-[#0a0f1e]/80 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm uppercase"
              placeholder="XYZ123"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
            />
          </div>

          {error && (
             <div className="bg-red-500/10 border border-red-500/20 py-2.5 rounded-xl px-4">
               <p className="text-red-400 text-[11px] font-bold text-center italic leading-tight">{error}</p>
             </div>
          )}

          <button 
            disabled={loading}
            className={`w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 active:scale-95 transition-all text-sm tracking-widest mt-4 uppercase ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? 'REGISTERING...' : 'REGISTER NOW'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-700/30 pt-6">
          <p className="text-slate-500 text-xs font-bold">
            Already have an account? 
            <button onClick={onToggle} className="text-cyan-400 font-black ml-2 uppercase hover:underline transition-all">LOGIN</button>
          </p>
        </div>
      </div>
    </div>
  );
};
