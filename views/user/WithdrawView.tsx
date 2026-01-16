
import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../../types';
import { Storage } from '../../store';

interface WithdrawViewProps {
  user: User;
  onUpdateUser: (u: User) => void;
}

export const WithdrawView: React.FC<WithdrawViewProps> = ({ user, onUpdateUser }) => {
  const [method, setMethod] = useState<'Bkash' | 'Nagad' | 'Rocket'>('Bkash');
  const [amount, setAmount] = useState<number>(500);
  const [bankNum, setBankNum] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [withdrawCount, setWithdrawCount] = useState(0);

  useEffect(() => {
    const fetchWithdrawCount = async () => {
      const allTxs = await Storage.getTransactions();
      const count = allTxs.filter(t => t.userId === user.id && t.type === 'withdrawal').length;
      setWithdrawCount(count);
    };
    fetchWithdrawCount();
  }, [user.id, submitted]);

  useEffect(() => {
    let interval: number;
    if (submitted && timer > 0) {
      interval = window.setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [submitted, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const turnoverRemaining = Math.max(0, (user.requiredTurnover || 0) - (user.completedTurnover || 0));
  const isTurnoverComplete = turnoverRemaining <= 0;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Turnover check
    if (!isTurnoverComplete) {
      alert(`আপনার প্রয়োজনীয় ট্রেডিং বাকি আছে: ৳ ${turnoverRemaining.toFixed(2)}। এই টাকাটা খেলার পর আপনি উত্তোলন করতে পারবেন।`);
      return;
    }

    // Limits
    const minAmount = withdrawCount === 0 ? 500 : 1000;
    if (amount < minAmount || amount > 25000) return alert(`উত্তোলন সর্বনিম্ন ${minAmount} এবং সর্বোচ্চ ২৫,০০০ টাকা হতে হবে।`);
    if (user.balance < amount) return alert("আপনার ব্যালেন্স অপর্যাপ্ত।");
    if (password !== user.password) return alert("ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।");
    if (bankNum.length < 11) return alert("সঠিক অ্যাকাউন্ট নাম্বার প্রদান করুন।");

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type: 'withdrawal',
      method: method,
      amount: amount,
      status: 'pending',
      bankNumber: bankNum,
      timestamp: Date.now()
    };

    await Storage.addTransaction(newTx);
    
    const updatedUser = { ...user, balance: user.balance - amount };
    onUpdateUser(updatedUser);
    await Storage.saveUser(updatedUser);

    setSubmitted(true);
    setTimer(600); // Reset timer to 10 mins
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
          <span className="text-5xl">🕒</span>
        </div>
        <h2 className="text-3xl font-black mb-4 text-white uppercase tracking-tight italic">WITHDRAWAL PENDING</h2>
        
        <div className="bg-[#1a2332] p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl w-full max-w-sm">
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-2">Estimated Time Remaining</p>
          <p className="text-5xl font-mono font-black text-cyan-400 tracking-tighter mb-6">{formatTime(timer)}</p>
          
          <div className="space-y-4 text-left border-t border-slate-700/50 pt-6">
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              আপনার উইথড্র রিকোয়েস্ট জমা হয়েছে। 
              <span className="text-cyan-400 font-bold block mt-1 uppercase text-xs tracking-wider">১০ মিনিটের মধ্যে আপনার টাকা সাকসেসফুল হয়ে যাবে।</span>
            </p>
          </div>
        </div>

        <button 
          onClick={() => setSubmitted(false)} 
          className="mt-10 w-full max-w-sm bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest border border-slate-700 active:scale-95 transition-all shadow-xl"
        >
          BACK TO HOME
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       {/* Status Cards - Styled according to screenshot */}
       <div className="bg-[#151c2c] p-7 rounded-[1.5rem] border border-slate-800/80 space-y-5 shadow-2xl">
         <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[11px] font-black uppercase tracking-widest">Withdrawal Limit:</span>
            <span className="font-black text-cyan-400 text-xs tracking-tight">Min 500 TK</span>
         </div>
         <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[11px] font-black uppercase tracking-widest">Turnover Left:</span>
            <span className={`font-black text-xs tracking-tight italic ${turnoverRemaining > 0 ? 'text-red-500' : 'text-green-500'}`}>
               ৳ {turnoverRemaining.toFixed(2)}
            </span>
         </div>
         <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[11px] font-black uppercase tracking-widest">Withdrawable Balance:</span>
            <span className="font-black text-xs tracking-tight text-white/90">
               ৳ {isTurnoverComplete ? user.balance.toFixed(2) : "0.00"}
            </span>
         </div>
       </div>

      {/* Method Selection */}
      <div className="grid grid-cols-3 gap-3">
        {(['Bkash', 'Nagad', 'Rocket'] as const).map(m => (
          <button 
            key={m}
            onClick={() => setMethod(m)}
            className={`py-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 active:scale-95 ${method === m ? 'border-red-500/60 bg-red-500/5 shadow-[0_10px_30px_rgba(239,68,68,0.1)]' : 'border-slate-800 bg-[#151c2c]'}`}
          >
             <div className="w-11 h-11 rounded-full bg-slate-700/30 flex items-center justify-center text-xl shadow-inner border border-slate-700/30">🏦</div>
            <span className={`text-[11px] font-black uppercase tracking-widest ${method === m ? 'text-red-500' : 'text-slate-500'}`}>{m}</span>
          </button>
        ))}
      </div>

      {/* Withdrawal Form */}
      <div className="bg-[#151c2c] p-8 rounded-[2.5rem] border border-slate-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
        
        <form onSubmit={handleWithdraw} className="space-y-6 relative z-10">
          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] ml-1 mb-3">Withdraw Amount</label>
            <input 
              type="number" 
              className="w-full bg-[#0d1321] border border-slate-800 rounded-2xl px-6 py-4 text-white font-black text-xl placeholder:text-slate-800 focus:ring-1 focus:ring-red-500/30 outline-none transition-all shadow-inner"
              placeholder="500"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] ml-1 mb-3">Account Number</label>
            <input 
              type="tel" 
              className="w-full bg-[#0d1321] border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-slate-700 focus:ring-1 focus:ring-red-500/30 outline-none transition-all shadow-inner"
              placeholder="017XXXXXXXX"
              value={bankNum}
              onChange={(e) => setBankNum(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] ml-1 mb-3">Login Password</label>
            <input 
              type="password" 
              className="w-full bg-[#0d1321] border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-slate-700 focus:ring-1 focus:ring-red-500/30 outline-none transition-all shadow-inner"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="pt-4">
            <button className="w-full bg-gradient-to-r from-red-600 to-pink-600 py-5 rounded-[2rem] font-black text-white shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm italic">
              CONFIRM WITHDRAW
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
