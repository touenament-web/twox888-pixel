
export type User = {
  id: string;
  gmail: string;
  password: string;
  balance: number;
  uid: string;
  isBlocked: boolean;
  isVerified: boolean;
  promoCode: string;
  referralCount: number;
  depositCount: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  nid?: string;
  address?: string;
  country?: string;
  age?: string;
  avatar?: string;
  lastSpinTime?: number;
  usedBonusCodes?: string[];
  requiredTurnover: number;
  completedTurnover: number;
};

export type BonusCode = {
  id: string;
  code: string;
  amount: number;
  createdAt: number;
};

export type Transaction = {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal';
  method: 'Bkash' | 'Nagad' | 'Rocket';
  amount: number;
  status: 'pending' | 'accepted' | 'cancelled';
  trxId?: string;
  screenshot?: string;
  bankNumber?: string;
  timestamp: number;
};

export type GameDuration = '30sec' | '1min' | '3min' | '5min';

export type UserBet = {
  id: string;
  userId: string;
  duration: GameDuration;
  period: string;
  selection: string | number;
  amount: number;
  status: 'pending' | 'win' | 'loss';
  winAmount: number;
  timestamp: number;
};

export type GameResult = {
  duration: GameDuration;
  period: string;
  result: 'small' | 'big';
  color: 'red' | 'green' | 'violet';
  number: number;
};

export type AppSettings = {
  appTitle: string;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  bkashTitle: string;
  nagadTitle: string;
  rocketTitle: string;
  bkashScreenshot: string;
  nagadScreenshot: string;
  rocketScreenshot: string;
  downloadLink: string;
  telegramLink: string;
  nextResult: 'auto' | 'small' | 'big' | 'red' | 'green';
};