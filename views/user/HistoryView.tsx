
import React, { useState, useEffect } from 'react';
import { Storage } from '../../store';
import { User, Transaction } from '../../types';

interface HistoryViewProps {
  user: User;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ user }) => {
  const [tab, setTab] = useState<'deposit' | 'withdrawal'>('deposit');
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const fetchHistory = async () => {
      const allTxs = await Storage.getTransactions();
      const filtered = allTxs.filter(t => t.userId === user.id && t.type === tab);
      setTxs(filtered);
    };
    fetchHistory();
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [user.id, tab]);

  const getWithdrawalCountdown = (timestamp: number) => {
    const tenMinutesInMs = 10 * 60 * 1000;
    const elapsed = currentTime - timestamp;
    const remaining = Math.max(0, tenMinutesInMs - elapsed);
    if (remaining === 0) return null;
    
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
        <button 
          onClick={() => setTab('deposit')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${tab === 'deposit' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
        >DEPOSITS</button>
        <button 
          onClick={() => setTab('withdrawal')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${tab === 'withdrawal' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}
        >WITHDRAWALS</button>
      </div>

      <div className="space-y-3">
        {txs.length === 0 ? (
          <div className="text-center py-20 text-slate-500 uppercase font-black text-xs tracking-widest opacity-40 italic">No transactions found</div>
        ) : (
          txs.map(tx => {
            const countdown = tx.type === 'withdrawal' && tx.status === 'pending' ? getWithdrawalCountdown(tx.timestamp) : null;
            
            return (
              <div key={tx.id} className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/50 flex justify-between items-center shadow-lg relative overflow-hidden group hover:bg-slate-800 transition-colors">
                <div className="relative z-10">
                  <h4 className="font-black text-white uppercase text-sm tracking-tight">{tx.method}</h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">{new Date(tx.timestamp).toLocaleString()}</p>
                  {tx.trxId && <p className="text-[9px] text-slate-600 mt-2 font-mono bg-slate-900/50 inline-block px-2 py-0.5 rounded border border-slate-700/50">ID: {tx.trxId}</p>}
                  
                  {countdown && (
                    <div className="mt-3 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                       <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest italic">
                          Successful in {countdown}
                       </p>
                    </div>
                  )}
                </div>
                <div className="text-right relative z-10">
                  <p className="text-xl font-black text-white tracking-tighter">৳ {tx.amount}</p>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] inline-block mt-2 ${
                    tx.status === 'accepted' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                    tx.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                  }`}>
                    {tx.status}
                  </span>
                </div>
                <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full -mr-12 -mt-12 ${tx.status === 'accepted' ? 'bg-green-500' : tx.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
