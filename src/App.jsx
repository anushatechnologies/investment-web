import { Suspense, lazy, useEffect, useState } from 'react';
import { CircularProgress, Stack, Typography } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout';
import AdminLoginPage from './pages/AdminLoginPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import {
  clearAuthData,
  getAccessToken,
  getAuthRole,
  saveAuthData,
} from './services/api';

// Admin Sub-pages
const AdminDashboard = lazy(() => import('./pages/DashboardPage'));
const AdminInvestors = lazy(() => import('./pages/InvestorsPage'));
const AdminInvestments = lazy(() => import('./pages/InvestmentsPage'));
const AdminRevenue = lazy(() => import('./pages/RevenuePage'));
const AdminWithdrawals = lazy(() => import('./pages/WithdrawalsPage'));
const AdminReferrals = lazy(() => import('./pages/ReferralStatisticsPage'));
const AdminFraud = lazy(() => import('./pages/FraudMonitoringPage'));
const AdminPaymentVerification = lazy(() => import('./pages/PaymentVerificationPage'));
const AdminUserManagement = lazy(() => import('./pages/UserManagementPage'));
const AdminUser360 = lazy(() => import('./pages/User360Page'));
const AdminPlans = lazy(() => import('./pages/AdminPlansPage'));
const AdminKyc = lazy(() => import('./pages/AdminKycPage'));
const AdminBankAccounts = lazy(() => import('./pages/AdminBankAccountsPage'));
const AdminTransactions = lazy(() => import('./pages/AdminTransactionsPage'));
const AdminMaturities = lazy(() => import('./pages/AdminMaturitiesPage'));
const AdminNotificationsCreate = lazy(() => import('./pages/AdminNotificationsCreatePage'));
const AdminRoles = lazy(() => import('./pages/AdminRolesPage'));
const AdminAuditLogs = lazy(() => import('./pages/AdminAuditLogsPage'));
const AdminPayments = lazy(() => import('./pages/AdminPaymentsPage'));
const AdminSupport = lazy(() => import('./pages/AdminSupportPage'));
const AdminReports = lazy(() => import('./pages/ReportsPage'));
const AdminSettings = lazy(() => import('./pages/SettingsPage'));

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
        Loading Admin Workspace...
      </Typography>
    </Stack>
  );
}

export default function App() {
  const [authRole, setAuthRole] = useState(() => getAuthRole() || (getAccessToken() ? 'admin' : null));

  const handleLogin = (role) => {
    setAuthRole(role || 'admin');
  };

  const handleLogout = () => {
    clearAuthData();
    setAuthRole(null);
  };

  const withSuspense = (node) => <Suspense fallback={<RouteLoader />}>{node}</Suspense>;
  const adminAuthenticated = Boolean(authRole === 'admin' || (getAccessToken() && authRole !== 'user'));

  return (
    <Routes>
      {/* Admin Authentication Routes */}
      <Route
        path="/admin/login"
        element={
          adminAuthenticated ? <Navigate to="/admin" replace /> : withSuspense(<AdminLoginPage onLogin={handleLogin} />)
        }
      />
      <Route
        path="/admin-login"
        element={
          adminAuthenticated ? <Navigate to="/admin" replace /> : withSuspense(<AdminLoginPage onLogin={handleLogin} />)
        }
      />
      <Route
        path="/login"
        element={
          adminAuthenticated ? <Navigate to="/admin" replace /> : withSuspense(<AdminLoginPage onLogin={handleLogin} />)
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

      {/* Admin Panel Layout & Sub-pages */}
      <Route
        path="/admin"
        element={
          adminAuthenticated ? (
            <AdminLayout onLogout={handleLogout} />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      >
        <Route index element={withSuspense(<AdminDashboard />)} />
        <Route path="dashboard" element={withSuspense(<AdminDashboard />)} />
        <Route path="investors" element={withSuspense(<AdminInvestors />)} />
        <Route path="investments" element={withSuspense(<AdminInvestments />)} />
        <Route path="revenue" element={withSuspense(<AdminRevenue />)} />
        <Route path="withdrawals" element={withSuspense(<AdminWithdrawals />)} />
        <Route path="referrals" element={withSuspense(<AdminReferrals />)} />
        <Route path="fraud-monitoring" element={withSuspense(<AdminFraud />)} />
        <Route path="payment-verification" element={withSuspense(<AdminPaymentVerification />)} />
        <Route path="user-management" element={withSuspense(<AdminUserManagement />)} />
        <Route path="users" element={withSuspense(<AdminUserManagement />)} />
        <Route path="users/:userId" element={withSuspense(<AdminUser360 />)} />
        <Route path="plans" element={withSuspense(<AdminPlans />)} />
        <Route path="kyc" element={withSuspense(<AdminKyc />)} />
        <Route path="bank-accounts" element={withSuspense(<AdminBankAccounts />)} />
        <Route path="transactions" element={withSuspense(<AdminTransactions />)} />
        <Route path="maturities" element={withSuspense(<AdminMaturities />)} />
        <Route path="notifications/create" element={withSuspense(<AdminNotificationsCreate />)} />
        <Route path="roles" element={withSuspense(<AdminRoles />)} />
        <Route path="audit-logs" element={withSuspense(<AdminAuditLogs />)} />
        <Route path="payments" element={withSuspense(<AdminPayments />)} />
        <Route path="support" element={withSuspense(<AdminSupport />)} />
        <Route path="reports" element={withSuspense(<AdminReports />)} />
        <Route path="settings" element={withSuspense(<AdminSettings />)} />
      </Route>

      {/* Global Fallback: Route straight to Admin panel */}
      <Route path="*" element={<Navigate to={adminAuthenticated ? '/admin' : '/admin/login'} replace />} />
    </Routes>
  );
}
