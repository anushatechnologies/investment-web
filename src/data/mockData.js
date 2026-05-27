/**
 * User-facing data — populated from backend APIs at runtime.
 * All exports are empty scaffolds so existing imports remain valid.
 */

export const userProfile = {
  name: '',
  email: '',
  phone: '',
  investorId: '',
  referralCode: '',
  membership: '',
  joinDate: '',
  city: '',
  avatar: '',
  notifications: 0,
  bankName: '',
  accountNumber: '',
  upiId: '',
  kycStatus: '',
};

export const dashboardStats = [];

export const investmentProgress = {
  percentage: 0,
  activeAmount: 0,
  maturedAmount: 0,
  nextCreditDate: '',
  planName: '',
};

export const monthlyInterestData = [];

export const walletDonutData = [];

export const recentTransactions = [];

export const referralTree = [];

export const recentWithdrawals = [];

export const paymentReceipts = [];

export const notificationsData = [];

export const investmentsData = [];

export const walletLedger = [];

export const referralStats = [];

export const referralGrowthData = [];

export const referralList = [];

export const withdrawalSummary = {
  availableBalance: 0,
  minWithdrawal: 1000,
  processingTime: '',
  preferredMethod: '',
};

export const withdrawalHistory = [];

export const investmentStatusSummary = [];

export const investmentTimeline = [];

export const supportTickets = [];

export const supportFaq = [];

export const userSettingsInitial = {
  emailAlerts: false,
  smsAlerts: false,
  payoutReminders: false,
  referralUpdates: false,
  autoReinvest: false,
  secureLoginAlerts: false,
};
