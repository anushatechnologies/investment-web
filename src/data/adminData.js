/**
 * Admin-facing data — populated from backend APIs at runtime.
 * All exports are empty scaffolds so existing imports remain valid.
 */

export const adminProfile = {
  name: '',
  role: '',
  company: 'Anusha Trade',
  notifications: 0,
};

export const dashboardRevenueData = [];

export const dashboardInvestmentSplit = [];

export const dashboardSecondaryMetrics = [];

export const investorsPageStats = [];

export const investorsData = [];

export const investmentsPageStats = [];

export const investmentsData = [];

export const revenueStats = [];

export const revenueBarData = [];

export const revenueSourceData = [];

export const recentTransactions = [];

export const withdrawalStats = [];

export const withdrawalRequests = [];

export const referralStats = [];

export const topReferrers = [];

export const referralGrowthData = [];

export const fraudStats = [];

export const suspiciousActivities = [];

export const paymentVerificationStats = [];

export const paymentRequests = [];

export const userManagementStats = [];

export const usersData = [];

export const reportStats = [];

export const reportPerformanceData = [];

export const scheduledReports = [];

export const auditTrail = [];

export const platformRules = {
  minInvestment: 5000,
  maxInvestment: 1000000,
  monthlyInterest: 10,
  directReferralCommission: 5,
  passiveReferralIncome: 1,
  minWithdrawal: 1000,
};

export const settingsToggles = {
  adminApprovalRequired: false,
  receiptVerificationRequired: false,
  fraudMonitoringEnabled: false,
  autoFreezeHighRiskUsers: false,
  emailAlertsEnabled: false,
  weeklySummaryEnabled: false,
};
