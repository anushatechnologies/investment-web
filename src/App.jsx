import { Suspense, lazy, useEffect, useState } from 'react';
import { CircularProgress, Stack, Typography } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ForgotMpinPage from './pages/ForgotMpinPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import {
  clearAuthData,
  getAccessToken,
  getAuthRole,
  getStoredOnboardingStatus,
  hydrateInvestorSessionState,
  saveAuthData,
} from './services/api';
import { resolveInvestorRoute, isOnboardingComplete } from './utils/onboardingRouter';

// Investor Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Investments = lazy(() => import('./pages/Investments'));
const Wallet = lazy(() => import('./pages/Wallet'));
const ReferralNetwork = lazy(() => import('./pages/ReferralNetwork'));
const Withdraw = lazy(() => import('./pages/Withdraw'));
const PaymentReceipts = lazy(() => import('./pages/PaymentReceipts'));
const Statements = lazy(() => import('./pages/Statements'));
const Notifications = lazy(() => import('./pages/Notifications'));
const InvestmentStatus = lazy(() => import('./pages/InvestmentStatus'));
const Support = lazy(() => import('./pages/Support'));
const SecurityCenter = lazy(() => import('./pages/SecurityCenter'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const TaxCenter = lazy(() => import('./pages/TaxCenter'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Nominees = lazy(() => import('./pages/Nominees'));

// Onboarding Pages
const KycPage = lazy(() => import('./pages/KycPage'));
const KycStatusPage = lazy(() => import('./pages/KycStatusPage'));
const BankLinkPage = lazy(() => import('./pages/BankLinkPage'));
const AccountActivatePage = lazy(() => import('./pages/AccountActivatePage'));
const SetupMpinPage = lazy(() => import('./pages/SetupMpinPage'));

function RouteLoader() {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{ minHeight: '60vh' }}
    >
      <CircularProgress color="primary" />
      <Typography variant="body2" color="text.secondary" fontWeight={600}>
        Loading investor workspace...
      </Typography>
    </Stack>
  );
}

export default function App() {
  const [authRole, setAuthRole] = useState(() => getAuthRole() || (getAccessToken() ? 'user' : null));
  const [investorStatus, setInvestorStatus] = useState(() => getStoredOnboardingStatus() || {});

  const handleLogin = (role) => {
    setAuthRole(role);
    setInvestorStatus(getStoredOnboardingStatus() || {});
  };

  const handleLogout = () => {
    clearAuthData();
    setAuthRole(null);
    setInvestorStatus({});
  };

  useEffect(() => {
    if (!authRole) {
      setInvestorStatus({});
      return;
    }

    setInvestorStatus(getStoredOnboardingStatus() || {});

    let active = true;
    hydrateInvestorSessionState()
      .then((sessionState) => {
        if (!active || !sessionState) return;
        saveAuthData(sessionState);
        setInvestorStatus(getStoredOnboardingStatus() || {});
      })
      .catch(() => {
        if (!active) return;
        setInvestorStatus(getStoredOnboardingStatus() || {});
      });

    return () => {
      active = false;
    };
  }, [authRole]);

  const withSuspense = (node) => <Suspense fallback={<RouteLoader />}>{node}</Suspense>;
  const userAuthenticated = Boolean(authRole && getAccessToken());
  const investorHome = resolveInvestorRoute(investorStatus);
  const canOpenDashboard = isOnboardingComplete(investorStatus);

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          userAuthenticated ? <Navigate to={investorHome || '/dashboard'} replace /> : <LoginPage onLogin={handleLogin} />
        }
      />
      <Route
        path="/signup"
        element={
          userAuthenticated ? <Navigate to={investorHome || '/dashboard'} replace /> : <SignupPage onLogin={handleLogin} />
        }
      />
      <Route path="/forgot-mpin" element={<ForgotMpinPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

      {/* Protected Investor Portal Routes */}
      <Route
        element={
          userAuthenticated ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={canOpenDashboard ? withSuspense(<Dashboard />) : <Navigate to={investorHome} replace />} />
        <Route path="/dashboard" element={canOpenDashboard ? withSuspense(<Dashboard />) : <Navigate to={investorHome} replace />} />
        
        {/* Onboarding Flow */}
        <Route path="/kyc" element={withSuspense(<KycPage />)} />
        <Route path="/kyc/status" element={withSuspense(<KycStatusPage />)} />
        <Route path="/bank-link" element={withSuspense(<BankLinkPage />)} />
        <Route path="/bank/link" element={withSuspense(<BankLinkPage />)} />
        <Route path="/setup-mpin" element={withSuspense(<SetupMpinPage />)} />
        <Route path="/activate" element={withSuspense(<AccountActivatePage />)} />

        {/* Wealth & Portfolio */}
        <Route path="/investments" element={withSuspense(<Investments />)} />
        <Route path="/investments/status" element={withSuspense(<InvestmentStatus />)} />
        <Route path="/investment-status" element={withSuspense(<InvestmentStatus />)} />
        <Route path="/wallet" element={withSuspense(<Wallet />)} />
        <Route path="/withdraw" element={withSuspense(<Withdraw />)} />
        <Route path="/receipts" element={withSuspense(<PaymentReceipts />)} />
        <Route path="/payment-receipts" element={withSuspense(<PaymentReceipts />)} />
        <Route path="/statements" element={withSuspense(<Statements />)} />

        {/* Network & Hub */}
        <Route path="/network" element={withSuspense(<ReferralNetwork />)} />
        <Route path="/referral-network" element={withSuspense(<ReferralNetwork />)} />
        <Route path="/notifications" element={withSuspense(<Notifications />)} />
        <Route path="/watchlist" element={withSuspense(<Watchlist />)} />
        <Route path="/tax-center" element={withSuspense(<TaxCenter />)} />
        <Route path="/support" element={withSuspense(<Support />)} />
        <Route path="/security" element={withSuspense(<SecurityCenter />)} />
        <Route path="/profile" element={withSuspense(<Profile />)} />
        <Route path="/settings" element={withSuspense(<Settings />)} />
        <Route path="/nominees" element={withSuspense(<Nominees />)} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to={userAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
