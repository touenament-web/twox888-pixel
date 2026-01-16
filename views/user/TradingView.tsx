
import React, { useState, useEffect, useRef } from 'react';
import { onSnapshot, collection, query, where } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { User, GameResult, UserBet, GameDuration } from '../../types';
import { Storage, db } from '../../store';

interface TradingViewProps {
  user: User;
  onUpdateUser: (u: User) => void;
}

interface BetModalState {
  isOpen: boolean;
  type: string | number | null;
  baseAmount: number;
  quantity: number;
  multiplier: number;
}

const DURATION_TO_SEC = {
  '30sec': 30,
  '1min': 60,
  '3min': 180,
  '5min': 300
};

export const TradingView: React.FC<TradingViewProps> = ({ user, onUpdateUser }) => {
  const [activeDuration, setActiveDuration] = useState<GameDuration>('30sec');
  const [timer, setTimer] = useState(0);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [myBets, setMyBets] = useState<UserBet[]>([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'game' | 'my'>('game');
  
  const [showWin, setShowWin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [lastWinResult, setLastWinResult] = useState<GameResult | null>(null);
  const [showLoss, setShowLoss] = useState(false);
  const [lastLossResult, setLastLossResult] = useState<GameResult | null>(null);
  const [autoCloseSeconds, setAutoCloseSeconds] = useState(3);
  const autoCloseIntervalRef = useRef<number | null>(null);

  const [betModal, setBetModal] = useState<BetModalState>({
    isOpen: false,
    type: null,
    baseAmount: 1,
    quantity: 1,
    multiplier: 1
  });
  const [customAmount, setCustomAmount] = useState<string>('');

  // Sync Game History - Simplified Query
  useEffect(() => {
    const q = query(collection(db, 'results'), where('duration', '==', activeDuration));
    const unsubscribe = onSnapshot(q, (snap) => {
      const results = snap.docs
        .map(doc => doc.data() as GameResult)
        .sort((a, b) => Number(b.period) - Number(a.period))
        .slice(0, 20);
      setHistory(results);
    });
    return () => unsubscribe();
  }, [activeDuration]);

  // Sync My Bets - Simplified Query
  useEffect(() => {
    const q = query(collection(db, 'user_bets'), where('userId', '==', user.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      const bets = snap.docs
        .map(doc => doc.data() as UserBet)
        .filter(b => b.duration === activeDuration)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);
      setMyBets(bets);
    });
    return () => unsubscribe();
  }, [user.id, activeDuration]);

  // Settlement Logic
  useEffect(() => {
    const q = query(collection(db, 'user_bets'), where('userId', '==', user.id));
    const unsubscribe = onSnapshot(q, async (snap) => {
      const pendingBets = snap.docs
        .map(d => d.data() as UserBet)
        .filter(b => b.status === 'pending');

      if (pendingBets.length === 0) return;

      let totalWin = 0;
      let balanceNeedsUpdate = false;

      for (const bet of pendingBets) {
        const hist = await Storage.getGameHistory(bet.duration);
        const res = hist.find(h => h.period === bet.period);

        if (res) {
          const { won, payout } = calculateSettlement(bet, res);
          const status = won ? 'win' : 'loss';
          const winAmt = won ? bet.amount * payout : 0;
          totalWin += winAmt;
          
          await Storage.placeBet({ ...bet, status, winAmount: winAmt });
          balanceNeedsUpdate = true;

          if (bet.duration === activeDuration) {
            if (won) { setWinAmount(winAmt); setLastWinResult(res); setShowWin(true); }
            else { setLastLossResult(res); setShowLoss(true); }
          }
        }
      }

      if (balanceNeedsUpdate) {
        const u = await Storage.getUser(user.id);
        if (u) {
          const updated = { ...u, balance: u.balance + totalWin };
          await Storage.saveUser(updated);
          onUpdateUser(updated);
        }
      }
    });
    return () => unsubscribe();
  }, [user.id, activeDuration]);

  const calculateSettlement = (bet: UserBet, res: GameResult) => {
    let won = false;
    let payout = 2;
    if (typeof bet.selection === 'number') {
      if (bet.selection === res.number) { won = true; payout = 9; }
    } else {
      if (bet.selection === res.color) { won = true; payout = (res.color === 'violet' ? 4.5 : 2); }
      else if (bet.selection === res.result) { won = true; payout = 2; }
    }
    return { won, payout };
  };

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const durSec = DURATION_TO_SEC[activeDuration];
      const elapsed = (now % (durSec * 1000)) / 1000;
      const remaining = Math.ceil(durSec - elapsed);
      setTimer(remaining);
      if (remaining === durSec) generateResult(activeDuration);
    };
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeDuration]);

  const generateResult = async (duration: GameDuration) => {
    const durSec = DURATION_TO_SEC[duration];
    const period = Math.floor((Date.now() - 500) / (durSec * 1000)).toString();
    const hist = await Storage.getGameHistory(duration);
    if (hist.some(h => h.period === period)) return;

    const settings = await Storage.getSettings();
    let resNum = Math.floor(Math.random() * 10);
    
    if (settings.nextResult !== 'auto' && duration === activeDuration) {
       if (settings.nextResult === 'small') resNum = Math.floor(Math.random() * 5);
       else if (settings.nextResult === 'big') resNum = 5 + Math.floor(Math.random() * 5);
       else if (settings.nextResult === 'red') resNum = [2, 4, 6, 8][Math.floor(Math.random() * 4)];
       else if (settings.nextResult === 'green') resNum = [1, 3, 7, 9][Math.floor(Math.random() * 4)];
    }

    const color = (resNum === 0 || resNum === 5) ? 'violet' : (resNum % 2 === 0 ? 'red' : 'green');
    const resSize = resNum >= 5 ? 'big' : 'small';
    await Storage.saveGameResult({ duration, period, result: resSize, color, number: resNum });
  };

  const handleConfirmBet = async () => {
    let baseVal = customAmount ? Number(customAmount) : betModal.baseAmount;
    const totalBet = baseVal * betModal.quantity * betModal.multiplier;

    if (user.balance < totalBet) return alert("Insufficient balance");
    if (timer < 5) return alert("Betting closed for this round.");

    const durSec = DURATION_TO_SEC[activeDuration];
    const period = Math.floor(Date.now() / (durSec * 1000)).toString();

    const newBet: UserBet = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      duration: activeDuration,
      period,
      selection: betModal.type!,
      amount: totalBet,
      status: 'pending',
      winAmount: 0,
      timestamp: Date.now()
    };

    const updatedUser = { ...user, balance: user.balance - totalBet, completedTurnover: (user.completedTurnover || 0) + totalBet };
    await Storage.saveUser(updatedUser);
    await Storage.placeBet(newBet);
    onUpdateUser(updatedUser);
    setBetModal({ ...betModal, isOpen: false });
  };

  const digits = timer.toString().padStart(2, '0');
  const getNumColorClass = (n: number) => (n === 0 || n === 5) ? 'bg-purple-600' : (n % 2 === 0 ? 'bg-red-500' : 'bg-green-500');

  useEffect(() => {
    if (showWin || showLoss) {
      setAutoCloseSeconds(3);
      autoCloseIntervalRef.current = window.setInterval(() => {
        setAutoCloseSeconds(prev => {
          if (prev <= 1) { setShowWin(false); setShowLoss(false); return 3; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (autoCloseIntervalRef.current) clearInterval(autoCloseIntervalRef.current); };
  }, [showWin, showLoss]);

  return (
    <div className="space-y-4 pb-12 bg-[#0d1321] min-h-screen text-slate-200 no-scrollbar">
      <div className="flex bg-[#16213e] rounded-xl p-1 shadow-inner overflow-hidden mx-1">
        {(['30sec', '1min', '3min', '5min'] as GameDuration[]).map(id => (
           <button key={id} onClick={() => setActiveDuration(id)} className={`flex-1 px-1 py-3 rounded-lg text-[11px] font-black transition-all ${activeDuration === id ? 'bg-yellow-500 text-slate-900 shadow-lg' : 'text-slate-500 opacity-60'}`}>
             WinGo {id === '30sec' ? '30s' : id.replace('min', ' Min')}
           </button>
        ))}
      </div>

      <div className="bg-[#1a2332] rounded-2xl p-4 shadow-xl border border-[#2d3a4f] mx-1 relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <button className="text-[10px] bg-slate-700/60 px-4 py-2 rounded-full text-slate-300 font-black uppercase tracking-widest border border-slate-600">HOW TO PLAY</button>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">TIME REMAINING</p>
            <div className="flex gap-1.5 justify-end">
              <span className="w-10 h-12 flex items-center justify-center bg-white text-slate-900 rounded-lg text-2xl font-black shadow-lg">0</span>
              <span className="w-10 h-12 flex items-center justify-center bg-white text-slate-900 rounded-md text-2xl font-black shadow-lg">0</span>
              <span className="w-4 h-12 flex items-center justify-center text-yellow-500 text-2xl font-black">:</span>
              <span className="w-10 h-12 flex items-center justify-center bg-white text-slate-900 rounded-lg text-2xl font-black shadow-lg">{digits[0]}</span>
              <span className="w-10 h-12 flex items-center justify-center bg-white text-slate-900 rounded-lg text-2xl font-black shadow-lg">{digits[1]}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-8">
           <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full border-4 border-slate-800 text-lg flex items-center justify-center font-black text-white shadow-xl ${getNumColorClass(history[0]?.number || 0)}`}>{history[0]?.number ?? '?'}</div></div>
           <p className="text-[11px] text-slate-500 font-mono tracking-tighter opacity-80 font-bold">{history[0]?.period || '...'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-2">
        <button onClick={() => openBetModal('green')} className="py-4 rounded-xl font-black bg-gradient-to-b from-green-400 to-green-600 active:scale-95 transition-all text-white shadow-[0_5px_0_rgb(21,128,61)] text-sm uppercase">GREEN</button>
        <button onClick={() => openBetModal('violet')} className="py-4 rounded-xl font-black bg-gradient-to-b from-purple-400 to-purple-600 active:scale-95 transition-all text-white shadow-[0_5px_0_rgb(126,34,206)] text-sm uppercase">VIOLET</button>
        <button onClick={() => openBetModal('red')} className="py-4 rounded-xl font-black bg-gradient-to-b from-red-400 to-red-600 active:scale-95 transition-all text-white shadow-[0_5px_0_rgb(185,28,28)] text-sm uppercase">RED</button>
      </div>

      <div className="bg-[#1a2332] p-6 rounded-[2.5rem] border border-[#2d3a4f] mx-2 shadow-2xl">
        <div className="grid grid-cols-5 gap-y-8 gap-x-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <div key={num} className="flex flex-col items-center">
              <button 
                onClick={() => openBetModal(num)} 
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black border-2 border-[#0d1321] shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:scale-90 transition-transform ${getNumColorClass(num)} text-white`}
              >
                {num}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 px-2">
        <button onClick={() => openBetModal('big')} className="flex-1 py-7 rounded-2xl font-black text-2xl bg-gradient-to-b from-orange-400 to-orange-600 text-white shadow-[0_6px_0_rgb(194,65,12)] active:scale-95 transition-all uppercase italic">BIG</button>
        <button onClick={() => openBetModal('small')} className="flex-1 py-7 rounded-2xl font-black text-2xl bg-gradient-to-b from-blue-400 to-indigo-600 text-white shadow-[0_6px_0_rgb(30,58,138)] active:scale-95 transition-all uppercase italic">SMALL</button>
      </div>

      <div className="flex bg-[#1a2332] p-1 rounded-xl gap-1 border border-[#2d3a4f] mt-6 mx-2">
        <button onClick={() => setActiveHistoryTab('game')} className={`flex-1 py-3 text-[11px] font-black rounded-lg transition-all ${activeHistoryTab === 'game' ? 'bg-[#2d3a4f] text-yellow-500 shadow-md' : 'text-slate-400'}`}>GAME HISTORY</button>
        <button onClick={() => setActiveHistoryTab('my')} className={`flex-1 py-3 text-[11px] font-black rounded-lg transition-all ${activeHistoryTab === 'my' ? 'bg-[#2d3a4f] text-yellow-500 shadow-md' : 'text-slate-400'}`}>MY HISTORY</button>
      </div>

      <div className="bg-[#1a2332] rounded-2xl border border-[#2d3a4f] overflow-hidden mx-2 shadow-xl mb-8">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#2d3a4f]/50 text-slate-500 uppercase font-black">
            <tr><th className="px-4 py-4">PERIOD</th><th className="px-2 py-4">NUMBER</th><th className="px-2 py-4">BIG/SMALL</th><th className="px-4 py-4 text-right">COLOR</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {activeHistoryTab === 'game' ? (
              history.map((h, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-5 font-mono text-slate-400 opacity-70">{h.period}</td>
                  <td className="px-2 py-5"><span className={`w-8 h-8 rounded-full inline-flex items-center justify-center font-black text-white shadow-md ${getNumColorClass(h.number)}`}>{h.number}</span></td>
                  <td className="px-2 py-5 font-bold capitalize text-slate-300">{h.result}</td>
                  <td className="px-4 py-5 text-right"><div className={`w-3 h-3 rounded-full ml-auto ${h.color === 'red' ? 'bg-red-500' : h.color === 'green' ? 'bg-green-500' : 'bg-purple-600'}`}></div></td>
                </tr>
              ))
            ) : (
              myBets.map((bet, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-5 font-mono text-slate-400 opacity-70">{bet.period}</td>
                  <td className="px-2 py-5 font-black text-slate-300 uppercase">{bet.selection}</td>
                  <td className="px-2 py-5 font-black text-white">৳ {bet.amount}</td>
                  <td className={`px-4 py-5 text-right font-black uppercase ${bet.status === 'win' ? 'text-green-500' : bet.status === 'loss' ? 'text-red-500' : 'text-yellow-500'}`}>
                    {bet.status === 'win' ? `+${bet.winAmount.toFixed(2)}` : bet.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {betModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-end justify-center animate-in fade-in duration-300">
          <div className="w-full max-w-lg rounded-t-[3rem] overflow-hidden shadow-2xl relative bg-white">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 pt-10 pb-14 relative flex flex-col items-center">
              <h3 className="text-white font-black text-2xl uppercase italic drop-shadow-lg tracking-widest">Confirm Bet</h3>
            </div>
            <div className="px-10 pt-14 pb-12 space-y-10 relative">
               <div className="grid grid-cols-4 gap-3">
                  {[1, 10, 100, 1000].map(val => (
                    <button key={val} onClick={() => { setBetModal({...betModal, baseAmount: val}); setCustomAmount(''); }} className={`py-4 rounded-xl font-black ${betModal.baseAmount === val && !customAmount ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{val}</button>
                  ))}
               </div>
               <input type="number" placeholder="Custom Amount" className="w-full bg-slate-50 border rounded-xl p-4 font-bold" value={customAmount} onChange={e => setCustomAmount(e.target.value)} />
               <button onClick={handleConfirmBet} className="w-full py-6 font-black bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-[2rem] shadow-xl uppercase italic">Confirm ৳ {((customAmount ? Number(customAmount) : betModal.baseAmount) * betModal.quantity * betModal.multiplier).toFixed(2)}</button>
               <button onClick={() => setBetModal({...betModal, isOpen: false})} className="w-full py-4 text-slate-400 font-bold uppercase">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showWin && lastWinResult && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="relative w-full max-w-[340px] flex flex-col items-center">
            <div className="w-full bg-gradient-to-b from-[#ff5a4e] to-[#ff7d75] rounded-[3rem] pt-20 pb-12 px-8 shadow-2xl text-center border-2 border-white/20">
              <h2 className="text-white text-4xl font-black italic tracking-tighter mb-10 uppercase">Congratulations</h2>
              <div className="bg-white/95 rounded-2xl p-6 shadow-xl">
                <p className="text-[#e54538] text-5xl font-black">৳ {winAmount.toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-2 font-bold uppercase">Round: {lastWinResult.period}</p>
              </div>
              <div className="mt-10 text-white/60 text-xs font-black uppercase tracking-widest">{autoCloseSeconds}s Auto Close</div>
            </div>
          </div>
        </div>
      )}

      {showLoss && lastLossResult && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="relative w-full max-w-[340px] flex flex-col items-center">
            <div className="w-full bg-gradient-to-b from-[#1e293b] to-[#334155] rounded-[3rem] pt-20 pb-12 px-8 shadow-2xl text-center border-2 border-white/10">
              <h2 className="text-white text-5xl font-black mb-10 tracking-tighter uppercase italic opacity-80">Better Luck</h2>
              <div className="bg-slate-800/80 rounded-2xl p-6 border border-white/10 shadow-inner">
                <p className="text-slate-400 text-5xl font-black uppercase tracking-tighter">Lost</p>
                <p className="text-xs text-slate-600 mt-2 font-bold uppercase">Round: {lastLossResult.period}</p>
              </div>
              <div className="mt-10 text-slate-500 text-xs font-black uppercase tracking-widest">{autoCloseSeconds}s Auto Close</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function openBetModal(type: string | number) {
    setBetModal({ isOpen: true, type, baseAmount: 1, quantity: 1, multiplier: 1 });
    setCustomAmount('');
  }
};
