
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { User, Transaction, AppSettings, GameResult, UserBet, BonusCode, GameDuration } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyCZC_4WctEyw05CEvA3Q-x6pqiKP8hBQBQ",
  authDomain: "yes-win.firebaseapp.com",
  projectId: "yes-win",
  storageBucket: "yes-win.firebasestorage.app",
  messagingSenderId: "648387597541",
  appId: "1:648387597541:web:3f924ef78bf5cabb33700c",
  measurementId: "G-T86GSLS7GC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const INITIAL_SETTINGS: AppSettings = {
  appTitle: 'YES WIN',
  bkashNumber: '01700000000',
  nagadNumber: '01800000000',
  rocketNumber: '01900000000',
  bkashTitle: 'Bkash Personal',
  nagadTitle: 'Nagad Personal',
  rocketTitle: 'Rocket Personal',
  bkashScreenshot: 'https://picsum.photos/400/600',
  nagadScreenshot: 'https://picsum.photos/400/600',
  rocketScreenshot: 'https://picsum.photos/400/600',
  downloadLink: 'https://example.com/download',
  telegramLink: 'https://t.me/yeswin_support',
  nextResult: 'auto'
};

export const Storage = {
  getUser: async (id: string): Promise<User | null> => {
    const docSnap = await getDoc(doc(db, 'users', id));
    return docSnap.exists() ? docSnap.data() as User : null;
  },
  saveUser: async (user: User) => {
    await setDoc(doc(db, 'users', user.id), user);
  },
  getUsers: async (): Promise<User[]> => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => doc.data() as User);
  },
  getSettings: async (): Promise<AppSettings> => {
    const docSnap = await getDoc(doc(db, 'settings', 'config'));
    if (docSnap.exists()) return docSnap.data() as AppSettings;
    await setDoc(doc(db, 'settings', 'config'), INITIAL_SETTINGS);
    return INITIAL_SETTINGS;
  },
  saveSettings: async (settings: AppSettings) => {
    await setDoc(doc(db, 'settings', 'config'), settings);
  },
  getTransactions: async (): Promise<Transaction[]> => {
    const q = query(collection(db, 'transactions'));
    const snap = await getDocs(q);
    return snap.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as Transaction))
      .sort((a, b) => b.timestamp - a.timestamp);
  },
  addTransaction: async (tx: Transaction) => {
    await addDoc(collection(db, 'transactions'), tx);
  },
  updateTransactionStatus: async (id: string, status: string) => {
    await updateDoc(doc(db, 'transactions', id), { status });
  },
  getGameHistory: async (duration: GameDuration): Promise<GameResult[]> => {
    const q = query(collection(db, 'results'), where('duration', '==', duration));
    const snap = await getDocs(q);
    return snap.docs
      .map(doc => doc.data() as GameResult)
      .sort((a, b) => Number(b.period) - Number(a.period))
      .slice(0, 50);
  },
  saveGameResult: async (result: GameResult) => {
    await setDoc(doc(db, 'results', `${result.duration}_${result.period}`), result);
  },
  getUserBets: async (userId: string): Promise<UserBet[]> => {
    const q = query(collection(db, 'user_bets'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as UserBet))
      .sort((a, b) => b.timestamp - a.timestamp);
  },
  placeBet: async (bet: UserBet) => {
    await setDoc(doc(db, 'user_bets', bet.id), bet);
  },
  getBonusCodes: async (): Promise<BonusCode[]> => {
    const q = query(collection(db, 'bonus_codes'));
    const snap = await getDocs(q);
    return snap.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as BonusCode))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
  getCurrentUser: (): string | null => localStorage.getItem('yw_logged_in_id'),
  setCurrentUser: (id: string | null) => {
    if (id) localStorage.setItem('yw_logged_in_id', id);
    else localStorage.removeItem('yw_logged_in_id');
  }
};
