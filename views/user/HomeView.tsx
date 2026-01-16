
import React, { useState, useEffect, useRef } from 'react';
import { User, AppSettings, BonusCode } from '../../types';
import { Storage } from '../../store';

interface HomeViewProps {
  user: User;
  settings: AppSettings;
  onTrading: () => void;
  onUpdateUser?: (user: User) => void;
}

const SPIN_COST = 232;

export const HomeView: React.FC<HomeViewProps> = ({ user, settings, onTrading, onUpdateUser }) => {
  const [showSpin, setShowSpin] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusInput, setBonusInput] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinResult, setSpinResult] = useState<{ label: string; value: number } | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');

  const segments = [
    { label: '৳ 1,00,000', value: 100000 },
    { label: 'টাকা নেই', value: 0 },
    { label: '৳ 5', value: 5 },
    { label: '৳ 10', value: 10 },
    { label: '৳ 20', value: 20 },
    { label: '৳ 50', value: 50 },
    { label: '৳ 100', value: 100 },
    { label: '৳ 500', value: 500 },
    { label: '৳ 1,000', value: 1000 },
    { label: '৳ 40,000', value: 40000 },
    { label: '৳ 50,000', value: 50000 },
    { label: '৳ 70,000', value: 70000 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (user.lastSpinTime) {
        const cooldown = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const diff = cooldown - (now - user.lastSpinTime);
        if (diff > 0) {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setRemainingTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        } else {
          setRemainingTime('');
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user.lastSpinTime]);

  const handleRedeemBonus = async () => {
    if (!bonusInput.trim()) return;
    const codes = await Storage.getBonusCodes();
    const foundCode = codes.find(c => c.code.trim().toUpperCase() === bonusInput.trim().toUpperCase());

    if (!foundCode) {
      alert("ভুল বোনাস কোড। আবার চেষ্টা করুন।");
      return;
    }

    if (user.usedBonusCodes?.includes(foundCode.id)) {
      alert("আপনি এই বোনাস কোডটি ইতিমধ্যে ব্যবহার করেছেন।");
      return;
    }

    const updatedUser = { 
      ...user, 
      balance: user.balance + foundCode.amount,
      usedBonusCodes: [...(user.usedBonusCodes || []), foundCode.id],
      requiredTurnover: (user.requiredTurnover || 0) + foundCode.amount
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
      // Fixed: use saveUser directly for the current user
      await Storage.saveUser(updatedUser);
      alert(`অভিনন্দন! আপনি ৳ ${foundCode.amount} বোনাস পেয়েছেন।`);
      setShowBonusModal(false);
      setBonusInput('');
    }
  };

  const handleStartSpin = () => {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const isFree = !user.lastSpinTime || now - user.lastSpinTime >= cooldown;

    if (!isFree) {
      if (user.balance < SPIN_COST) {
        alert(`ফ্রি স্পিন শেষ। আবার স্পিন করতে ২৩২ টাকা লাগবে। আপনার ব্যালেন্স অপর্যাপ্ত।`);
        return;
      }
      if (!confirm(`ফ্রি স্পিন শেষ। আপনি কি ২৩২ টাকা দিয়ে স্পিন করতে চান?`)) return;
    }

    setIsSpinning(true);
    setSpinResult(null);
    
    const rand = Math.random() * 100;
    let targetIndex = 1; 

    if (rand < 92) targetIndex = 1; 
    else if (rand < 95) targetIndex = 2; 
    else if (rand < 97) targetIndex = 3; 
    else if (rand < 98.5) targetIndex = 4; 
    else if (rand < 99.5) targetIndex = 5; 
    else {
      const rareIndexes = [0, 6, 7, 8, 9, 10, 11];
      targetIndex = rareIndexes[Math.floor(Math.random() * rareIndexes.length)];
    }

    const spins = 10;
    const degreesPerSegment = 360 / segments.length;
    const stopAt = (360 - (targetIndex * degreesPerSegment));
    const finalRotation = rotation + (spins * 360) + stopAt - (rotation % 360);
    
    setRotation(finalRotation);

    setTimeout(async () => {
      setIsSpinning(false);
      const result = segments[targetIndex];
      setSpinResult(result);
      
      const balanceChange = isFree ? result.value : result.value - SPIN_COST;
      const updatedUser = { 
        ...user, 
        balance: user.balance + balanceChange,
        lastSpinTime: isFree ? Date.now() : user.lastSpinTime
      };
      
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
        // Fixed: use saveUser directly for the current user
        await Storage.saveUser(updatedUser);
      }
    }, 4000);
  };

  const tradeProgress = Math.min(100, (user.completedTurnover / (user.requiredTurnover || 1)) * 100);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Available Balance</h3>
          <p className="text-4xl font-black text-white">৳ {user.balance.toFixed(2)}</p>
          
          <div className="mt-8 space-y-4">
             <div className="flex justify-between items-end">
                <div className="space-y-1">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Deposit Turnover</p>
                   <p className="text-lg font-black text-white">৳ {user.requiredTurnover?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="text-right space-y-1">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Played Turnover</p>
                   <p className="text-lg font-black text-cyan-400">৳ {user.completedTurnover?.toFixed(2) || '0.00'}</p>
                </div>
             </div>
             <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-1000 ease-out"
                  style={{ width: `${tradeProgress}%` }}
                ></div>
             </div>
          </div>

          <div className="mt-6 flex gap-3">
             <button onClick={onTrading} className="flex-1 bg-white text-slate-900 font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm">PLAY NOW</button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center text-center active:scale-95 transition-transform cursor-pointer" onClick={() => setShowBonusModal(true)}>
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3">
            <span className="text-2xl">🎟️</span>
          </div>
          <h4 className="font-bold text-white text-sm">Bonus Code</h4>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">Enter code to claim</p>
        </div>
        <div 
          onClick={() => setShowSpin(true)}
          className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center text-center active:scale-95 transition-transform cursor-pointer"
        >
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-3">
            <span className="text-2xl">🎡</span>
          </div>
          <h4 className="font-bold text-white text-sm">ফ্রি স্পিন</h4>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">Spin to Win</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-lg">
        <h3 className="text-lg font-bold mb-4 text-white uppercase tracking-tighter">Announcement</h3>
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 text-sm text-slate-300 leading-relaxed italic border-l-4 border-l-amber-500">
          "আপনাদেরকে আমাদের অ্যাপসে স্বাগতম। আপনি যদি প্রথমবার ২৫ হাজার টাকা ডিপোজিট করেন তাহলে আপনি পাবেন ৫০ টা ফ্রি স্পিন! শুভ কামনা আপনার ট্রেডিং এর জন্য।"
        </div>
      </div>

      {/* Bonus Code Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl relative">
            <button onClick={() => setShowBonusModal(false)} className="absolute top-6 right-6 text-slate-500">✕</button>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">REDEEM BONUS</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Enter your promo code below</p>
            </div>
            <div className="space-y-6">
              <input 
                type="text"
                placeholder="BONUSCODE2024"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-6 py-4 text-center text-white font-black text-xl placeholder:text-slate-800 focus:ring-2 focus:ring-blue-500/50 outline-none uppercase"
                value={bonusInput}
                onChange={e => setBonusInput(e.target.value)}
              />
              <button 
                onClick={handleRedeemBonus}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-4 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm"
              >
                CLAIM BONUS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Free Spin Modal */}
      {showSpin && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#121826] w-full max-w-sm rounded-[3rem] p-10 border border-slate-700/50 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <button onClick={() => { if(!isSpinning) setShowSpin(false); setSpinResult(null); }} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center mb-10 relative z-10">
              <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">LUCKY WHEEL</h3>
              <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Win up to ৳ 1,00,000</p>
            </div>

            <div className="relative flex flex-col items-center mb-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 z-20 w-8 h-8 flex items-center justify-center">
                 <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-amber-500 filter drop-shadow-[0_4px_10px_rgba(245,158,11,0.5)]"></div>
              </div>
              
              <div 
                className="w-72 h-72 rounded-full border-[10px] border-[#1e293b] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1) bg-[#0f172a]"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {segments.map((seg, i) => {
                  const deg = i * (360 / segments.length);
                  return (
                    <div 
                      key={i}
                      className={`absolute inset-0 flex items-start justify-center pt-6 font-black text-[9px] ${i % 2 === 0 ? 'text-white' : 'text-amber-500'}`}
                      style={{ 
                        transform: `rotate(${deg}deg)`, 
                        transformOrigin: '50% 50%',
                        clipPath: 'polygon(50% 50%, 40% 0, 60% 0)'
                      }}
                    >
                      <div className="flex flex-col items-center rotate-0 mt-2">
                        <span className="whitespace-nowrap uppercase tracking-tighter">{seg.label}</span>
                      </div>
                    </div>
                  );
                })}
                
                {segments.map((_, i) => (
                  <div 
                    key={`line-${i}`}
                    className="absolute top-0 left-1/2 w-[2px] h-1/2 bg-slate-800/50 origin-bottom -translate-x-1/2"
                    style={{ transform: `rotate(${i * (360 / segments.length)}deg) translateX(-50%)` }}
                  />
                ))}
                
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-14 h-14 bg-gradient-to-b from-slate-700 to-slate-900 rounded-full border-4 border-[#1e293b] shadow-2xl flex items-center justify-center">
                      <div className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-pulse"></div>
                   </div>
                </div>
              </div>
            </div>

            <div className="h-24 flex flex-col items-center justify-center mb-4">
              {spinResult !== null && !isSpinning && (
                <div className="text-center animate-in zoom-in duration-500">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">CONGRATULATIONS!</p>
                  <p className={`text-5xl font-black italic ${spinResult.value > 0 ? 'text-green-500' : 'text-slate-400'}`}>
                    {spinResult.value > 0 ? `৳ ${spinResult.value}` : '৳ 0'}
                  </p>
                </div>
              )}
            </div>

            <button 
              onClick={handleStartSpin}
              disabled={isSpinning}
              className={`w-full py-6 rounded-[2rem] font-black text-white shadow-2xl transition-all uppercase tracking-[0.2em] text-sm relative overflow-hidden group ${isSpinning ? 'bg-slate-800 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-amber-600 active:scale-95 shadow-orange-500/20'}`}
            >
              <div className="relative z-10 flex flex-col items-center">
                <span>{isSpinning ? 'SPINNING...' : 'TAP TO SPIN'}</span>
                {!isSpinning && remainingTime && <span className="text-[10px] opacity-70 mt-1 font-bold">COST: ৳ {SPIN_COST}</span>}
              </div>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
            
            <div className="mt-8 text-center">
              {remainingTime ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">NEXT FREE SPIN IN</p>
                  <p className="text-2xl font-black text-amber-500 font-mono tracking-widest">{remainingTime}</p>
                </div>
              ) : (
                <p className="text-[10px] text-green-500 font-black uppercase tracking-[0.2em] animate-pulse">
                  ★ FREE SPIN AVAILABLE NOW ★
                </p>
              )}
            </div>

            <p className="text-center text-[8px] text-slate-700 mt-10 font-bold uppercase tracking-widest">
              * ONE FREE SPIN AVAILABLE EVERY 24 HOURS.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
