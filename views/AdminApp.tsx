
import React, { useState, useEffect } from 'react';
import { onSnapshot, collection, query, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { Storage, db } from '../store';
import { AppSettings, User, Transaction } from '../types';

interface AdminAppProps {
  onBack: () => void;
}

const ADMIN_PASSWORD = 'YES_WIN_ADMIN_786';

export const AdminApp: React.FC<AdminAppProps> = ({ onBack }) => {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState('');
  const [activeTab, setActiveTab] = useState<'players' | 'deposits' | 'withdrawals' | 'software' | 'settings'>('players');
  const [searchQuery, setSearchQuery] = useState('');
  const [showScreenshot, setShowScreenshot] = useState<string | null>(null);
  const [showAddBalance, setShowAddBalance] = useState<{id: string, email: string} | null>(null);
  const [addAmount, setAddAmount] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    if (!authed) return;
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => setUsers(snap.docs.map(doc => doc.data() as User)));
    const unsubTxs = onSnapshot(collection(db, 'transactions'), (snap) => setTxs(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction)).sort((a,b) => b.timestamp - a.timestamp)));
    const unsubSettings = onSnapshot(collection(db, 'settings'), (snap) => {
      const config = snap.docs.find(d => d.id === 'config');
      if (config) setSettings(config.data() as AppSettings);
    });
    return () => { unsubUsers(); unsubTxs(); unsubSettings(); };
  }, [authed]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === ADMIN_PASSWORD) setAuthed(true); 
    else alert("ভুল পাসওয়ার্ড!");
  };

  const handleTx = async (id: string, status: 'accepted' | 'cancelled') => {
    const tx = txs.find(t => t.id === id);
    if (!tx) return;
    await Storage.updateTransactionStatus(id, status);
    if (tx.type === 'deposit' && status === 'accepted') {
      const u = users.find(user => user.id === tx.userId);
      if (u) await Storage.saveUser({ ...u, balance: u.balance + tx.amount, requiredTurnover: (u.requiredTurnover || 0) + tx.amount });
    } else if (tx.type === 'withdrawal' && status === 'cancelled') {
      const u = users.find(user => user.id === tx.userId);
      if (u) await Storage.saveUser({ ...u, balance: u.balance + tx.amount });
    }
    alert("সফল হয়েছে!");
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("কপি করা হয়েছে!");
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#080b14] flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl">
          <span className="text-4xl text-white font-black italic">Y</span>
        </div>
        <h1 className="text-2xl font-black mb-8 text-white italic tracking-tighter uppercase">ADMIN LOGIN</h1>
        <form onSubmit={handleAuth} className="w-full max-w-xs space-y-4">
          <input type="password" placeholder="পাসওয়ার্ড দিন" className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white text-center font-bold outline-none" value={pass} onChange={e => setPass(e.target.value)} />
          <button className="w-full bg-blue-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-blue-900/20">Login Now</button>
          <button type="button" onClick={onBack} className="w-full text-slate-500 font-bold text-[10px] uppercase">Back to App</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070a] pb-32 text-slate-300 font-sans">
      <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-800 p-6 sticky top-0 z-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-white italic">ADMIN DASHBOARD</h2>
          <button onClick={() => setAuthed(false)} className="text-xl">🚪</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20">
            <p className="text-[9px] font-black text-blue-400 uppercase">Total Accounts</p>
            <p className="text-2xl font-black text-white">{users.length}</p>
          </div>
          <div className="bg-green-600/10 p-4 rounded-2xl border border-green-500/20">
            <p className="text-[9px] font-black text-green-400 uppercase">Active Now</p>
            <p className="text-2xl font-black text-white">{Math.floor(users.length * 0.4) + 1}</p>
          </div>
        </div>
      </header>

      <main className="p-4">
        {activeTab === 'players' && (
          <div className="space-y-4">
            <input type="text" placeholder="Search ID/Email..." className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm mb-4" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            {users.filter(u => u.gmail.includes(searchQuery.toLowerCase()) || u.uid.includes(searchQuery)).map(u => (
              <div key={u.id} className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex justify-between items-start">
                <div>
                  <p className="text-sm font-black text-white">{u.gmail}</p>
                  <p className="text-[10px] text-slate-500 font-mono">UID: {u.uid} | Pass: <span className="text-amber-500 font-bold">{u.password}</span></p>
                  <div className="mt-3 flex gap-2">
                    <span className="bg-slate-950 px-2 py-1 rounded text-[10px] font-black text-green-400">৳ {u.balance.toFixed(2)}</span>
                    <span className="bg-slate-950 px-2 py-1 rounded text-[10px] font-black text-blue-400">{u.isVerified ? 'Verified' : 'Unverified'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setShowAddBalance({id: u.id, email: u.gmail})} className="bg-green-500/10 text-green-500 text-[10px] font-black p-2 rounded-lg border border-green-500/20">ADD ৳</button>
                  <button onClick={async () => await Storage.saveUser({...u, isBlocked: !u.isBlocked})} className={`${u.isBlocked ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'} text-[10px] font-black p-2 rounded-lg border border-red-500/20`}>{u.isBlocked ? 'UNBLOCK' : 'BLOCK'}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'deposits' && (
          <div className="space-y-4">
            {txs.filter(t => t.type === 'deposit' && t.status === 'pending').map(tx => (
              <div key={tx.id} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black px-3 py-1 bg-pink-600 rounded-full text-white">{tx.method}</span>
                  <span className="text-xl font-black text-green-400">৳ {tx.amount}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950 p-3 rounded-xl">
                  <p>Number: <span className="text-white">{tx.bankNumber}</span></p>
                  <p>TrxID: <span className="text-cyan-400">{tx.trxId}</span></p>
                </div>
                <button onClick={() => setShowScreenshot(tx.screenshot!)} className="w-full py-2 bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-400">🖼️ View Screenshot</button>
                <div className="flex gap-2">
                  <button onClick={() => handleTx(tx.id, 'accepted')} className="flex-1 bg-green-600 py-3 rounded-xl text-[10px] font-black text-white uppercase">Accept</button>
                  <button onClick={() => handleTx(tx.id, 'cancelled')} className="flex-1 bg-red-600/10 py-3 rounded-xl text-[10px] font-black text-red-500 uppercase">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            {txs.filter(t => t.type === 'withdrawal' && t.status === 'pending').map(tx => (
              <div key={tx.id} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black px-3 py-1 bg-blue-600 rounded-full text-white">{tx.method}</span>
                  <span className="text-xl font-black text-white">৳ {tx.amount}</span>
                </div>
                <div className="space-y-2">
                  <div onClick={() => copy(tx.bankNumber || '')} className="bg-slate-950 p-3 rounded-xl flex justify-between items-center">
                    <span className="text-[10px] font-black">Number: {tx.bankNumber}</span>
                    <span className="text-[9px] text-cyan-400">COPY</span>
                  </div>
                  <div onClick={() => copy(tx.amount.toString())} className="bg-slate-950 p-3 rounded-xl flex justify-between items-center">
                    <span className="text-[10px] font-black">Amount: {tx.amount}</span>
                    <span className="text-[9px] text-cyan-400">COPY</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleTx(tx.id, 'accepted')} className="flex-1 bg-blue-600 py-3 rounded-xl text-[10px] font-black text-white uppercase">Accept</button>
                  <button onClick={() => handleTx(tx.id, 'cancelled')} className="flex-1 bg-red-600/10 py-3 rounded-xl text-[10px] font-black text-red-500 uppercase">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'software' && settings && (
          <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800 space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase">App Link</label>
              <input className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs mt-2" value={settings.downloadLink} onChange={e => Storage.saveSettings({...settings, downloadLink: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase">Telegram Support</label>
              <input className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs mt-2" value={settings.telegramLink} onChange={e => Storage.saveSettings({...settings, telegramLink: e.target.value})} />
            </div>
            <div className="pt-4 border-t border-slate-800">
              <p className="text-[10px] font-black text-amber-500 uppercase mb-4 tracking-widest">Next Game Control</p>
              <div className="grid grid-cols-2 gap-2">
                {(['auto', 'big', 'small', 'red', 'green'] as const).map(res => (
                  <button key={res} onClick={() => Storage.saveSettings({ ...settings, nextResult: res })} className={`py-4 rounded-xl font-black uppercase text-[10px] border ${settings.nextResult === res ? 'bg-amber-500 border-white text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                    {res}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && settings && (
          <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800 space-y-6">
             <div className="space-y-4">
                <input className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs" placeholder="Bkash" value={settings.bkashNumber} onChange={e => Storage.saveSettings({...settings, bkashNumber: e.target.value})} />
                <input className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs" placeholder="Nagad" value={settings.nagadNumber} onChange={e => Storage.saveSettings({...settings, nagadNumber: e.target.value})} />
                <input className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs" placeholder="Rocket" value={settings.rocketNumber} onChange={e => Storage.saveSettings({...settings, rocketNumber: e.target.value})} />
                <input className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs" placeholder="Title" value={settings.appTitle} onChange={e => Storage.saveSettings({...settings, appTitle: e.target.value})} />
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0f18] border-t border-slate-800 p-4 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-2xl">
        <button onClick={() => setActiveTab('players')} className={`flex flex-col items-center ${activeTab === 'players' ? 'text-blue-500' : 'text-slate-600'}`}>
          <span className="text-xl">👥</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Players</span>
        </button>
        <button onClick={() => setActiveTab('deposits')} className={`flex flex-col items-center ${activeTab === 'deposits' ? 'text-blue-500' : 'text-slate-600'}`}>
          <span className="text-xl">💰</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Deposit</span>
        </button>
        <button onClick={() => setActiveTab('withdrawals')} className={`flex flex-col items-center ${activeTab === 'withdrawals' ? 'text-blue-500' : 'text-slate-600'}`}>
          <span className="text-xl">🏧</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Withdraw</span>
        </button>
        <button onClick={() => setActiveTab('software')} className={`flex flex-col items-center ${activeTab === 'software' ? 'text-blue-500' : 'text-slate-600'}`}>
          <span className="text-xl">⚡</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Software</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center ${activeTab === 'settings' ? 'text-blue-500' : 'text-slate-600'}`}>
          <span className="text-xl">⚙️</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Settings</span>
        </button>
      </nav>

      {showScreenshot && (
        <div className="fixed inset-0 bg-black/98 z-[100] flex items-center justify-center p-6" onClick={() => setShowScreenshot(null)}>
          <img src={showScreenshot} alt="Proof" className="max-w-full max-h-[85vh] rounded-2xl" />
        </div>
      )}

      {showAddBalance && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-10">
          <div className="bg-slate-900 w-full max-w-xs p-10 rounded-[2.5rem] border border-slate-800">
             <h3 className="text-white font-black text-lg mb-6 uppercase tracking-widest">Add Balance</h3>
             <input type="number" placeholder="৳ Amount" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white font-black mb-6" value={addAmount} onChange={e => setAddAmount(e.target.value)} />
             <div className="flex gap-2">
                <button onClick={async () => {
                  const u = users.find(user => user.id === showAddBalance.id);
                  if(u) await Storage.saveUser({...u, balance: u.balance + Number(addAmount)});
                  setShowAddBalance(null); setAddAmount('');
                }} className="flex-1 bg-green-600 py-3 rounded-xl font-black text-[10px] text-white uppercase">Confirm</button>
                <button onClick={() => setShowAddBalance(null)} className="flex-1 bg-slate-800 py-3 rounded-xl font-black text-[10px] text-slate-500 uppercase">Cancel</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
