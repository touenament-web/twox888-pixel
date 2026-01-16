
import React, { useState } from 'react';
import { User, AppSettings, Transaction } from '../../types';
import { Storage } from '../../store';

interface DepositViewProps {
  user: User;
  settings: AppSettings;
}

export const DepositView: React.FC<DepositViewProps> = ({ user, settings }) => {
  const [method, setMethod] = useState<'Bkash' | 'Nagad' | 'Rocket'>('Bkash');
  const [amount, setAmount] = useState<number>(500);
  const [senderPhone, setSenderPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [screenshot, setScreenshot] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 200 || amount > 25000) return alert("Deposit must be between 200 and 25,000 TK");
    if (senderPhone.length < 11) return alert("Please enter a valid sender phone number");
    if (trxId.length < 8) return alert("Invalid Transaction ID");
    if (!screenshot) return alert("Please upload a payment screenshot");

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type: 'deposit',
      method: method,
      amount: amount,
      status: 'pending',
      trxId: trxId,
      bankNumber: senderPhone, // Using bankNumber field for sender phone
      screenshot: screenshot,
      timestamp: Date.now()
    };

    // Correctly using addTransaction which is already defined in store.ts
    await Storage.addTransaction(newTx);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-20 px-6 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
          <span className="text-5xl">🕒</span>
        </div>
        <h2 className="text-3xl font-black mb-4 text-white uppercase tracking-tight">Request Submitted</h2>
        <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 mb-10">
          <p className="text-slate-300 font-bold leading-relaxed">
            আপনার ডিপোজিট রিকোয়েস্টটি গ্রহণ করা হয়েছে।
            <span className="text-cyan-400 block mt-2 text-xl">আগামী ২ মিনিটের ভেতরে আপনার ব্যালেন্স যোগ হয়ে যাবে।</span>
          </p>
        </div>
        <button 
          onClick={() => setSubmitted(false)} 
          className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest border border-slate-700 shadow-xl active:scale-95 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const getMethodDetails = () => {
    if (method === 'Bkash') return { num: settings.bkashNumber, title: settings.bkashTitle, color: 'bg-pink-500' };
    if (method === 'Nagad') return { num: settings.nagadNumber, title: settings.nagadTitle, color: 'bg-orange-500' };
    return { num: settings.rocketNumber, title: settings.rocketTitle, color: 'bg-purple-600' };
  };

  const details = getMethodDetails();

  return (
    <div className="space-y-6">
      {/* Payment Method Selector */}
      <div className="grid grid-cols-3 gap-3">
        {(['Bkash', 'Nagad', 'Rocket'] as const).map(m => (
          <button 
            key={m}
            onClick={() => setMethod(m)}
            className={`py-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${method === m ? 'border-blue-500 bg-blue-500/10 shadow-[0_10px_30px_rgba(59,130,246,0.2)]' : 'border-slate-800 bg-slate-800/40'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white shadow-lg ${
              m === 'Bkash' ? 'bg-pink-500' : m === 'Nagad' ? 'bg-orange-500' : 'bg-purple-600'
            }`}>
              {m[0]}
            </div>
            <span className={`text-xs font-black uppercase tracking-widest ${method === m ? 'text-blue-400' : 'text-slate-500'}`}>{m}</span>
          </button>
        ))}
      </div>

      {/* Account Info Card */}
      <div className="bg-slate-800/60 p-6 rounded-[2.5rem] border border-slate-700/50 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h3 className="font-black text-slate-400 text-xs uppercase tracking-[0.2em] mb-2">{details.title}</h3>
            <p className="text-3xl font-black text-white tracking-tight">{details.num}</p>
          </div>
          <button 
            onClick={() => { navigator.clipboard.writeText(details.num); alert("Copied!"); }}
            className="bg-slate-700/80 text-white p-4 rounded-2xl hover:bg-slate-600 active:scale-90 transition-all border border-slate-600 shadow-lg"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
             </svg>
          </button>
        </div>
        <div className={`absolute top-0 right-0 w-32 h-32 ${details.color}/10 blur-3xl rounded-full -mr-16 -mt-16`}></div>
      </div>

      {/* Deposit Form */}
      <div className="bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-700/40 shadow-xl">
        <form onSubmit={handleDeposit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-slate-400 text-[11px] font-black uppercase tracking-widest ml-1">Deposit Amount (200 - 25,000)</label>
            <input 
              type="number" 
              className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl px-6 py-4 text-white font-black text-lg focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner"
              placeholder="500"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-slate-400 text-[11px] font-black uppercase tracking-widest ml-1">Sender Phone Number</label>
            <input 
              type="tel" 
              className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner"
              placeholder="017XXXXXXXX"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-slate-400 text-[11px] font-black uppercase tracking-widest ml-1">Transaction ID</label>
            <input 
              type="text" 
              className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner"
              placeholder="TrxID (e.g. AGH678JS)"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-slate-400 text-[11px] font-black uppercase tracking-widest ml-1">Payment Screenshot</label>
            <div className="relative">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="screenshot-upload"
              />
              <label 
                htmlFor="screenshot-upload"
                className={`w-full flex items-center justify-center gap-3 bg-slate-900/80 border-2 border-dashed border-slate-700/50 rounded-2xl px-6 py-5 cursor-pointer hover:border-blue-500/50 transition-all ${screenshot ? 'border-green-500/50 bg-green-500/5' : ''}`}
              >
                {isUploading ? (
                  <span className="text-sm font-bold text-slate-500 animate-pulse">Uploading...</span>
                ) : screenshot ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-xl font-bold">✓</span>
                    <span className="text-sm font-black text-green-400 uppercase">Image Attached</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-2xl mb-1">📷</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase">Click to Upload</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-[10px] text-slate-500 mb-6 leading-relaxed bg-slate-900/30 p-4 rounded-xl border border-slate-700/30 italic">
              * Please send money to the provided number first. Then enter the amount, your phone number, and transaction ID here with a screenshot of the payment.
            </p>
            <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-5 rounded-[1.5rem] font-black text-white shadow-[0_15px_40px_rgba(37,99,235,0.4)] active:scale-95 transition-all uppercase tracking-widest text-sm">
              SUBMIT DEPOSIT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
