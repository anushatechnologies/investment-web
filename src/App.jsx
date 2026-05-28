import { Suspense, lazy, useState } from 'react';
import { CircularProgress, Stack, Typography } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ForgotMpinPage from './pages/ForgotMpinPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import { getAuthRole, clearAuthData, getStoredOnboardingStatus } from './services/api';
import { resolveInvestorRoute, isOnboardingComplete } from './utils/onboardingRouter';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Investments = lazy(() => import('./pages/Investments'));
const Wallet = lazy(() => import('./pages/Wallet'));
const ReferralNetwork = lazy(() => import('./pages/ReferralNetwork'));
const Withdraw = lazy(() => import('./pages/Withdraw'));
const PaymentReceipts = lazy(() => import('./pages/PaymentReceipts'));
const Notifications = lazy(() => import('./pages/Notifications'));
const InvestmentStatus = lazy(() => import('./pages/InvestmentStatus'));
const Support = lazy(() => import('./pages/Support'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const KycPage = lazy(() => import('./pages/KycPage'));
const KycStatusPage = lazy(() => import('./pages/KycStatusPage'));
const BankLinkPage = lazy(() => import('./pages/BankLinkPage'));
const AccountActivatePage = lazy(() => import('./pages/AccountActivatePage'));
const SetupMpinPage = lazy(() => import('./pages/SetupMpinPage'));
const AdminDashboard = lazy(() => import('./pages/DashboardPage'));
const AdminInvestors = lazy(() => import('./pages/InvestorsPage'));
const AdminInvestments = lazy(() => import('./pages/InvestmentsPage'));
const AdminRevenue = lazy(() => import('./pages/RevenuePage'));
const AdminWithdrawals = lazy(() => import('./pages/WithdrawalsPage'));
const AdminReferrals = lazy(() => import('./pages/ReferralStatisticsPage'));
const AdminFraud = lazy(() => import('./pages/FraudMonitoringPage'));
const AdminPaymentVerification = lazy(() => import('./pages/PaymentVerificationPage'));
const AdminUserManagement = lazy(() => import('./pages/UserManagementPage'));
const AdminReports = lazy(() => import('./pages/ReportsPage'));
const AdminSettings = lazy(() => import('./pages/SettingsPage'));

const AUTH_STORAGE_KEY = 'anusha-invest-hub-auth-role'; // kept for backward compat, also used in api.js

function RouteLoader() {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{ minHeight: '40vh' }}
    >
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Loading your dashboard...
      </Typography>
    </Stack>
  );
}

function App() {
  const [authRole, setAuthRole] = useState(() => getAuthRole());

  const handleLogin = (role) => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, role);
    setAuthRole(role);
  };

  const handleLogout = () => {
    clearAuthData();
    setAuthRole(null);
  };

  const withSuspense = (node) => <Suspense fallback={<RouteLoader />}>{node}</Suspense>;
  const userAuthenticated = authRole === 'user';
  const adminAuthenticated = authRole === 'admin';
  const investorStatus = getStoredOnboardingStatus() || {};
  const investorHome = resolveInvestorRoute(investorStatus);
  const defaultPath = adminAuthenticated ? '/admin' : investorHome;
  const canOpenDashboard = isOnboardingComplete(investorStatus);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          authRole ? <Navigate to={defaultPath} replace /> : <LoginPage onLogin={handleLogin} />
        }
      />
      <Route
        path="/signup"
        element={
          authRole ? <Navigate to={defaultPath} replace /> : <SignupPage onLogin={handleLogin} />
        }
      />
      <Route path="/forgot-mpin" element={<ForgotMpinPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

      <Route
        element={
          userAuthenticated ? <Layout onLogout={handleLogout} /> : <Navigate to={authRole ? defaultPath : '/login'} replace />
        }
      >
        <Route index element={canOpenDashboard ? withSuspense(<Dashboard />) : <Navigate to={investorHome} replace />} />
        <Route path="/dashboard" element={canOpenDashboard ? withSuspense(<Dashboard />) : <Navigate to={investorHome} replace />} />
        <Route path="/kyc" element={withSuspense(<KycPage />)} />
        <Route path="/kyc/status" element={withSuspense(<KycStatusPage />)} />
        <Route path="/bank/link" element={withSuspense(<BankLinkPage />)} />
        <Route path="/account/activate" element={withSuspense(<AccountActivatePage />)} />
        <Route path="/setup-mpin" element={withSuspense(<SetupMpinPage />)} />
        
        {/* Protected Dashboard Routes - Locked until onboarding is complete */}
        <Route path="/investments" element={canOpenDashboard ? withSuspense(<Investments />) : <Navigate to={investorHome} replace />} />
        <Route path="/wallet" element={canOpenDashboard ? withSuspense(<Wallet />) : <Navigate to={investorHome} replace />} />
        <Route path="/referral-network" element={canOpenDashboard ? withSuspense(<ReferralNetwork />) : <Navigate to={investorHome} replace />} />
        <Route path="/withdraw" element={canOpenDashboard ? withSuspense(<Withdraw />) : <Navigate to={investorHome} replace />} />
        <Route path="/payment-receipts" element={canOpenDashboard ? withSuspense(<PaymentReceipts />) : <Navigate to={investorHome} replace />} />
        <Route path="/notifications" element={canOpenDashboard ? withSuspense(<Notifications />) : <Navigate to={investorHome} replace />} />
        <Route path="/investment-status" element={canOpenDashboard ? withSuspense(<InvestmentStatus />) : <Navigate to={investorHome} replace />} />
        <Route path="/settings" element={canOpenDashboard ? withSuspense(<Settings />) : <Navigate to={investorHome} replace />} />
        
        {/* Always accessible routes for onboarding users */}
        <Route path="/support" element={withSuspense(<Support />)} />
        <Route path="/profile" element={withSuspense(<Profile />)} />
      </Route>

      <Route
        path="/admin"
        element={
          adminAuthenticated ? <AdminLayout onLogout={handleLogout} /> : <Navigate to={authRole ? defaultPath : '/login'} replace />
        }
      >
        <Route index element={withSuspense(<AdminDashboard />)} />
        <Route path="investors" element={withSuspense(<AdminInvestors />)} />
        <Route path="investments" element={withSuspense(<AdminInvestments />)} />
        <Route path="revenue" element={withSuspense(<AdminRevenue />)} />
        <Route path="withdrawals" element={withSuspense(<AdminWithdrawals />)} />
        <Route path="referrals" element={withSuspense(<AdminReferrals />)} />
        <Route path="fraud-monitoring" element={withSuspense(<AdminFraud />)} />
        <Route path="payment-verification" element={withSuspense(<AdminPaymentVerification />)} />
        <Route path="user-management" element={withSuspense(<AdminUserManagement />)} />
        <Route path="reports" element={withSuspense(<AdminReports />)} />
        <Route path="settings" element={withSuspense(<AdminSettings />)} />
      </Route>

      <Route path="*" element={<Navigate to={authRole ? defaultPath : '/login'} replace />} />
    </Routes>
  );
}

export default App;
