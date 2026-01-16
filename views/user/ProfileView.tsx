
import React, { useState, useRef } from 'react';
import { User, AppSettings } from '../../types';
import { Storage } from '../../store';

interface ProfileViewProps {
  user: User;
  settings: AppSettings;
  onLogout: () => void;
  onUpdateUser: (u: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, settings, onLogout, onUpdateUser }) => {
  const [showVerify, setShowVerify] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    nid: user.nid || '',
    address: user.address || '',
    country: user.country || '',
    age: user.age || ''
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAvatar(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const updatedUser = { ...user, avatar: base64 };
        onUpdateUser(updatedUser);
        await Storage.saveUser(updatedUser);
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = { ...user, ...formData, isVerified: true };
    onUpdateUser(updatedUser);
    await Storage.saveUser(updatedUser);
    alert("আপনার ভেরিফিকেশন সফল হয়েছে!");
    setShowVerify(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("কপি করা হয়েছে!");
  };

  // Hidden admin entry logic
  let pressTimer: any;
  const handleAdminStart = () => {
    pressTimer = setTimeout(() => {
      window.location.hash = 'admin';
    }, 3000); // 3 seconds hold
  };
  const handleAdminEnd = () => clearTimeout(pressTimer);

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      {/* Profile Header */}
      <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex items-center gap-6 shadow-xl">
        <div 
          onClick={handleAvatarClick}
          className="relative w-20 h-20 group cursor-pointer"
        >
          <div className="w-full h-full rounded-3xl flex items-center justify-center text-3xl shadow-lg border-2 border-slate-600 overflow-hidden bg-slate-900">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              '👤'
            )}
          </div>
          <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <span className="text-[10px] font-bold text-white uppercase">Edit</span>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleAvatarChange} 
          />
          {isUploadingAvatar && (
            <div className="absolute inset-0 bg-slate-900/80 rounded-3xl flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-black text-white truncate max-w-[150px] uppercase tracking-tighter">
            {user.gmail.split('@')[0]}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 text-xs font-mono">UID: {user.uid}</p>
            <button 
              onClick={() => copyToClipboard(user.uid)}
              className="text-cyan-400 p-1 active:scale-90 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </button>
          </div>
          <span className={`text-[10px] font-black px-3 py-1 rounded-full mt-3 inline-block uppercase tracking-widest ${user.isVerified ? 'bg-green-500/20 text-green-500 border border-green-500/20' : 'bg-red-500/20 text-red-500 border border-red-500/20'}`}>
            {user.isVerified ? '✓ Verified' : 'Unverified'}
          </span>
        </div>
      </div>

      {/* Refer Section */}
      <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-lg">
        <h3 className="font-black text-lg mb-4 text-white uppercase tracking-tighter">Refer & Earn</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900/50 p-4 rounded-2xl text-center border border-slate-700/50">
            <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Total Joined</p>
            <p className="text-2xl font-black text-blue-400">{user.referralCount}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-2xl text-center border border-slate-700/50">
            <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Deposited</p>
            <p className="text-2xl font-black text-green-400">{user.depositCount}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-700">
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Promo Code</p>
              <p className="font-black text-white">{user.promoCode}</p>
            </div>
            <button onClick={() => copyToClipboard(user.promoCode)} className="text-cyan-400 font-black text-[11px] uppercase tracking-widest bg-cyan-400/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all">COPY</button>
          </div>
        </div>
      </div>

      {/* Grid Menu */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => { if(!user.isVerified) setShowVerify(true); }} className={`p-5 rounded-[2rem] border transition-all flex flex-col items-center gap-2 active:scale-95 shadow-lg ${user.isVerified ? 'bg-green-500/5 border-green-500/30 cursor-default' : 'bg-slate-800 border-slate-700'}`}>
          <div className="w-12 h-12 bg-slate-700/50 rounded-2xl flex items-center justify-center text-2xl">{user.isVerified ? '✅' : '🛡️'}</div>
          <span className={`font-black text-xs uppercase tracking-widest ${user.isVerified ? 'text-green-500' : 'text-slate-300'}`}>
            {user.isVerified ? 'Verified' : 'Verify Account'}
          </span>
        </button>
        <button onClick={onLogout} className="bg-red-900/10 p-5 rounded-[2rem] border border-red-900/30 flex flex-col items-center gap-2 active:scale-95 transition-all shadow-lg">
          <div className="w-12 h-12 bg-red-900/20 rounded-2xl flex items-center justify-center text-2xl">🚪</div>
          <span className="font-black text-xs text-red-500 uppercase tracking-widest">Logout</span>
        </button>
      </div>

      {/* Hidden Admin Entry */}
      <div 
        onMouseDown={handleAdminStart} 
        onMouseUp={handleAdminEnd} 
        onTouchStart={handleAdminStart} 
        onTouchEnd={handleAdminEnd}
        className="pt-10 pb-4 text-center select-none"
      >
        <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.5em] opacity-30">
          App Version 1.0.2
        </p>
      </div>

      {/* Verification Modal */}
      {showVerify && !user.isVerified && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 border border-slate-700 shadow-2xl relative">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="font-black text-2xl text-white italic uppercase tracking-tighter">VERIFICATION</h3>
              <button onClick={() => setShowVerify(false)} className="text-slate-500 p-2">✕</button>
            </div>
            <form onSubmit={handleVerify} className="space-y-4">
              <input placeholder="Phone" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
              <input placeholder="NID Number" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white outline-none" value={formData.nid} onChange={e => setFormData({...formData, nid: e.target.value})} required />
              <button className="w-full bg-cyan-600 py-5 rounded-[2rem] font-black text-white mt-4 uppercase tracking-widest text-sm">Submit Now</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
