import {
  Bell,
  BriefcaseBusiness,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Receipt,
  FileText,
  Settings,
  Shield,
  Share2,
  User,
  Wallet,
  TrendingUp,
  UserCheck,
  Building,
  KeyRound,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Landmark,
  Target,
} from 'lucide-react';
import DashboardCustomizeRoundedIcon from '@mui/icons-material/DashboardCustomizeRounded';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { BRAND_LOGO_FALLBACK, BRAND_LOGO_PRIMARY } from '../constants/branding';
import { getRuntimeUserProfile } from '../utils/runtimeUserProfile';
import { getStoredOnboardingStatus, getInvestorDashboard, getReferralCommissions } from '../services/api';
import { isOnboardingComplete } from '../utils/onboardingRouter';
import { formatCurrency } from '../utils/formatters';
import { useEffect, useState, useMemo } from 'react';

function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase();
}

const navigationItems = [
  { label: 'User Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'KYC Documents', path: '/kyc', icon: UserCheck },
  { label: 'My Investments', path: '/investments', icon: BriefcaseBusiness },
  { label: 'Wallet', path: '/wallet', icon: Wallet },
  { label: 'Referral Network', path: '/referral-network', icon: Share2 },
  { label: 'Withdraw', path: '/withdraw', icon: Wallet },
  { label: 'Payment Receipts', path: '/payment-receipts', icon: Receipt },
  { label: 'Statements', path: '/statements', icon: FileText },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Investment Status', path: '/investment-status', icon: Shield },
  { label: 'Security Center', path: '/security', icon: Shield },
  { label: 'Plan Watchlist', path: '/watchlist', icon: Target },
  { label: 'Tax Center', path: '/tax-center', icon: Landmark },
  { label: 'Nominees', path: '/nominees', icon: ClipboardList },
  { label: 'Support', path: '/support', icon: LifeBuoy },
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Settings', path: '/settings', icon: Settings },
];

function OnboardingStatusCard({ onboardingStatus, onClose }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const kycState = onboardingStatus?.kycStatus || 'NOT_SUBMITTED';
  const bankState = onboardingStatus?.bankVerified;
  const accountState = onboardingStatus?.accountStatus || 'PENDING';
  const mpinState = onboardingStatus?.mpinCreated;
  const normalizedKyc = normalizeStatus(kycState);
  const kycActionable = normalizedKyc === 'REUPLOAD_REQUIRED' || normalizedKyc === 'REJECTED';

  const steps = useMemo(() => [
    {
      id: 'kyc',
      label: 'KYC Document',
      status: normalizedKyc === 'APPROVED' ? 'complete' : 'active',
      subtitle: normalizedKyc === 'APPROVED' ? 'Verified & Approved' : normalizedKyc === 'PENDING' ? 'In Review' : kycActionable ? 'Reupload Requested' : 'Action Required',
      icon: UserCheck,
      path: '/kyc',
      color: normalizedKyc === 'APPROVED' ? '#10b981' : normalizedKyc === 'PENDING' ? '#f59e0b' : kycActionable ? '#ef4444' : (isDark ? '#60a5fa' : '#2563eb'),
    },
    {
      id: 'bank',
      label: 'Bank Verification',
      status: bankState ? 'complete' : normalizedKyc === 'APPROVED' ? 'active' : 'idle',
      subtitle: bankState ? 'Linked & Verified' : 'Enter Details',
      icon: Building,
      path: '/bank/link',
      color: bankState ? '#10b981' : (isDark ? '#60a5fa' : '#2563eb'),
    },
    {
      id: 'account',
      label: 'Activation',
      status: accountState === 'ACTIVE' ? 'complete' : bankState ? 'active' : 'idle',
      subtitle: accountState === 'ACTIVE' ? 'Activated' : 'Awaiting Review',
      icon: CheckCircle2,
      path: '/profile',
      color: accountState === 'ACTIVE' ? '#10b981' : '#f59e0b',
    },
    {
      id: 'mpin',
      label: 'Security PIN',
      status: mpinState ? 'complete' : accountState === 'ACTIVE' ? 'active' : 'idle',
      subtitle: mpinState ? 'Configured' : 'Setup 4-Digit PIN',
      icon: KeyRound,
      path: '/setup-mpin',
      color: mpinState ? '#10b981' : (isDark ? '#60a5fa' : '#2563eb'),
    },
  ], [normalizedKyc, kycActionable, bankState, accountState, mpinState, isDark]);

  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const isAllComplete = completedCount === steps.length;

  return (
    <Box
      sx={{
        borderRadius: '20px',
        p: 2,
        mb: 2,
        background: isAllComplete
          ? (isDark
              ? 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(11,27,57,0.4) 100%)'
              : 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(240,253,250,0.5) 100%)')
          : (isDark
              ? 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(11,27,57,0.4) 100%)'
              : 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(240,246,255,0.5) 100%)'),
        border: '1px solid',
        borderColor: isAllComplete
          ? (isDark ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.25)')
          : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(37,99,235,0.08)'),
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow decorator */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 70,
          height: 70,
          borderRadius: '50%',
          bgcolor: isAllComplete ? '#10b981' : '#3b82f6',
          filter: 'blur(35px)',
          opacity: 0.15,
          pointerEvents: 'none',
        }}
      />

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: '6px',
              bgcolor: isAllComplete ? 'rgba(16,185,129,0.16)' : 'rgba(37,99,235,0.16)',
            }}
          >
            <Shield size={12} style={{ color: isAllComplete ? '#34d399' : '#60a5fa' }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 11, color: isDark ? 'rgba(255,255,255,0.85)' : '#475569', letterSpacing: '0.06em' }}>
            ONBOARDING STATUS
          </Typography>
        </Stack>
        <Typography
          sx={{
            fontSize: '11px',
            fontWeight: 800,
            color: isAllComplete ? '#34d399' : '#60a5fa',
            bgcolor: isAllComplete ? 'rgba(16,185,129,0.12)' : 'rgba(37,99,235,0.12)',
            px: 1,
            py: 0.25,
            borderRadius: '6px',
          }}
        >
          {progressPercent}%
        </Typography>
      </Stack>

      {/* Modern High-End Step Progress Line */}
      <Box sx={{ position: 'relative', height: 4, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', borderRadius: '2px', mb: 2 }}>
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progressPercent}%`,
            bgcolor: isAllComplete ? '#10b981' : '#3b82f6',
            borderRadius: '2px',
            boxShadow: isAllComplete ? '0 0 10px rgba(16,185,129,0.5)' : '0 0 10px rgba(37,99,235,0.5)',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </Box>

      {/* Grid of steps */}
      <Stack spacing={1}>
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isDone = step.status === 'complete';
          const isActive = step.status === 'active';

          return (
            <Box
              key={step.id}
              onClick={() => {
                if (step.status !== 'idle') {
                  onClose();
                  navigate(step.path);
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: isActive ? 'rgba(59,130,246,0.3)' : 'transparent',
                bgcolor: isActive
                  ? (isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.04)')
                  : isDone
                  ? (isDark ? 'rgba(16,185,129,0.02)' : 'rgba(16,185,129,0.01)')
                  : 'transparent',
                cursor: step.status !== 'idle' ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                '&:hover': step.status !== 'idle' ? {
                  bgcolor: isActive 
                    ? (isDark ? 'rgba(59,130,246,0.09)' : 'rgba(59,130,246,0.06)') 
                    : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.03)'),
                  borderColor: isActive ? 'rgba(59,130,246,0.5)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'),
                  transform: 'translateX(2px)',
                } : {},
                opacity: step.status === 'idle' ? 0.45 : 1,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    bgcolor: isDone ? 'rgba(16,185,129,0.12)' : isActive ? 'rgba(59,130,246,0.15)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)'),
                    color: isDone ? '#10b981' : isActive ? '#60a5fa' : (isDark ? '#94a3b8' : '#64748b'),
                    transition: 'all 0.2s ease',
                  }}
                >
                  <StepIcon size={14} />
                </Box>
                <div>
                  <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: isDone ? (isDark ? 'rgba(255,255,255,0.95)' : '#0f172a') : (isDark ? 'rgba(255,255,255,0.7)' : '#475569') }}>
                    {step.label}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', fontWeight: 600, color: step.color }}>
                    {step.subtitle}
                  </Typography>
                </div>
              </Stack>

              {step.status !== 'idle' && (
                <ChevronRight size={12} style={{ color: isDone ? '#10b981' : '#60a5fa', opacity: 0.7 }} />
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

function InvestorHubCard({ loading, availableBalance, pendingBalance, lockedBalance, referralIncome }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab] = useState(0); // 0 = Wealth, 1 = Referrals

  const walletMetrics = [
    { label: 'Available', value: availableBalance, color: '#10b981' },
    { label: 'Pending', value: pendingBalance, color: '#f59e0b' },
    { label: 'Locked', value: lockedBalance, color: '#3b82f6' },
  ];

  return (
    <Box
      sx={{
        borderRadius: '20px',
        p: 2,
        mb: 2,
        background: isDark
          ? 'linear-gradient(135deg, rgba(37,99,235,0.22), rgba(14,165,233,0.08))'
          : 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(14,165,233,0.03))',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(37,99,235,0.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Sliding Segment Tabs */}
      <Box
        sx={{
          display: 'flex',
          p: 0.5,
          borderRadius: '12px',
          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
          mb: 2,
        }}
      >
        <Button
          fullWidth
          size="small"
          onClick={() => setActiveTab(0)}
          sx={{
            py: 0.5,
            borderRadius: '9px',
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'none',
            color: activeTab === 0
              ? (isDark ? 'white' : '#1e3a8a')
              : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)'),
            bgcolor: activeTab === 0
              ? (isDark ? 'rgba(255,255,255,0.08)' : 'white')
              : 'transparent',
            boxShadow: activeTab === 0 && !isDark ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            '&:hover': {
              bgcolor: activeTab === 0 
                ? (isDark ? 'rgba(255,255,255,0.12)' : 'white')
                : (isDark ? 'rgba(15,23,42,0.02)' : 'rgba(15,23,42,0.02)'),
            }
          }}
        >
          My Wealth
        </Button>
        <Button
          fullWidth
          size="small"
          onClick={() => setActiveTab(1)}
          sx={{
            py: 0.5,
            borderRadius: '9px',
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'none',
            color: activeTab === 1
              ? (isDark ? 'white' : '#1e3a8a')
              : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)'),
            bgcolor: activeTab === 1
              ? (isDark ? 'rgba(255,255,255,0.08)' : 'white')
              : 'transparent',
            boxShadow: activeTab === 1 && !isDark ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            '&:hover': {
              bgcolor: activeTab === 1 
                ? (isDark ? 'rgba(255,255,255,0.12)' : 'white')
                : (isDark ? 'rgba(15,23,42,0.02)' : 'rgba(15,23,42,0.02)'),
            }
          }}
        >
          Referrals
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={18} sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'primary.main' }} />
        </Box>
      ) : activeTab === 0 ? (
        /* Wealth Tab */
        <Box>
          <Typography sx={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b', mb: 1.2, textTransform: 'uppercase' }}>
            Cash Breakdown
          </Typography>
          <Stack spacing={1}>
            {walletMetrics.map((m) => (
              <Stack key={m.label} direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: m.color, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.65)' : '#475569', fontWeight: 600 }}>{m.label}</Typography>
                </Stack>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: isDark ? 'white' : '#0f172a' }}>{formatCurrency(m.value)}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : (
        /* Referrals Tab */
        <Box>
          <Typography sx={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b', mb: 1.2, textTransform: 'uppercase' }}>
            Referral Earnings
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 1.25,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.06)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.22)',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <TrendingUp size={12} style={{ color: '#10b981' }} />
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.85)' : '#065f46' }}>Commission</Typography>
            </Stack>
            <Typography sx={{ fontSize: 13, fontWeight: 900, color: '#10b981' }}>
              {formatCurrency(referralIncome)}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function SidebarContent({ onLogout, onClose }) {
  const userProfile = getRuntimeUserProfile();
  const onboardingStatus = getStoredOnboardingStatus() || {};
  const isComplete = isOnboardingComplete(onboardingStatus);
  const visibleNavItems = isComplete
    ? navigationItems
    : navigationItems.filter((item) => [
      '/kyc',
      '/kyc/status',
      '/bank/link',
      '/account/activate',
      '/setup-mpin',
      '/profile',
      '/support',
    ].includes(item.path));

  const [loading, setLoading] = useState(true);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [referralIncome, setReferralIncome] = useState(0);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getInvestorDashboard(), getReferralCommissions()])
      .then(([dashboardRes, commissionsRes]) => {
        if (!active) return;
        const d = dashboardRes?.data || dashboardRes || {};
        setAvailableBalance(Number(d.wallet?.availableBalance ?? d.availableBalance ?? d.walletBalance ?? 0));
        setPendingBalance(Number(d.wallet?.pendingBalance ?? d.pendingBalance ?? 0));
        setLockedBalance(Number(d.wallet?.lockedBalance ?? d.lockedBalance ?? 0));
        const commissions = Array.isArray(commissionsRes) ? commissionsRes
          : Array.isArray(commissionsRes?.data) ? commissionsRes.data
          : Array.isArray(commissionsRes?.commissions) ? commissionsRes.commissions
          : [];
        const totalReferral = commissions.reduce((sum, c) => sum + Number(c.commissionAmount ?? c.amount ?? 0), 0);
        setReferralIncome(totalReferral);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 2, sm: 2.25 },
        py: 2,
        background: isDark
          ? 'linear-gradient(180deg, #07172d 0%, #0b1d39 55%, #0a1930 100%)'
          : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)',
        color: isDark ? 'white' : '#0f172a',
        overflow: 'hidden',
      }}
    >
      {/* Mobile drag handle */}
      <Box
        sx={{
          display: { xs: 'flex', lg: 'none' },
          justifyContent: 'center',
          mb: 1.5,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 4,
            borderRadius: 99,
            bgcolor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.18)',
          }}
        />
      </Box>

      <Link to="/" onClick={onClose} className="mb-4 flex items-center gap-3 transition hover:opacity-80">
        <Avatar
          variant="rounded"
          src={BRAND_LOGO_PRIMARY}
          alt="Anusha Trade"
          imgProps={{ onError: (e) => { e.currentTarget.src = BRAND_LOGO_FALLBACK; } }}
          sx={{ width: 48, height: 48, bgcolor: 'white', borderRadius: '14px', p: 0.5 }}
        />
        <div>
          <Typography variant="h6" sx={{ color: isDark ? 'white' : '#0f172a', fontWeight: 700, fontSize: 16 }}>Anusha Trade</Typography>
          <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.65)' : '#475569', fontSize: 12 }}>Investor Portal</Typography>
        </div>
      </Link>

      {/* User Profile Chip */}
      <Box
        sx={{
          borderRadius: '18px',
          p: { xs: 1.5, sm: 2 },
          mb: 2,
          background: isDark
            ? 'linear-gradient(135deg, rgba(37,99,235,0.32), rgba(14,165,233,0.12))'
            : 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(14,165,233,0.04))',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(37,99,235,0.08)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(37,99,235,0.12)', color: isDark ? 'white' : '#2563eb', width: 40, height: 40, fontWeight: 800, fontSize: 15 }}>
            {userProfile.avatar}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: isDark ? 'white' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userProfile.name}</Typography>
            <Typography variant="body2" sx={{ color: isDark ? alpha('#fff', 0.72) : '#475569', fontSize: 12 }}>{userProfile.membership}</Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onLogout}
            sx={{
              color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.55)',
              '&:hover': {
                color: '#ef4444',
                bgcolor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)',
              },
              flexShrink: 0,
            }}
          >
            <LogOut size={16} />
          </IconButton>
        </Stack>
      </Box>

      {/* Sidebar Content Scroll Area */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5, pb: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        {/* ── Live Wealth & Referral Hub Card ── */}
        <InvestorHubCard
          loading={loading}
          availableBalance={availableBalance}
          pendingBalance={pendingBalance}
          lockedBalance={lockedBalance}
          referralIncome={referralIncome}
        />

        {/* ── Breathtaking 10/10 Onboarding & KYC Stepper ── */}
        <OnboardingStatusCard onboardingStatus={onboardingStatus} onClose={onClose} />

        <List sx={{ px: 0 }}>
          {visibleNavItems.map(({ icon: Icon, label, path }) => (
            <NavLink key={path} to={path} end={path === '/'} onClick={onClose} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <ListItemButton
                  sx={{
                    borderRadius: '14px',
                    mb: 0.5,
                    py: 1,
                    color: isActive ? 'white' : (isDark ? alpha('#fff', 0.72) : 'rgba(15,23,42,0.72)'),
                    bgcolor: isActive ? 'rgba(37,99,235,0.92)' : 'transparent',
                    boxShadow: isActive ? '0 12px 24px rgba(37,99,235,0.24)' : 'none',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(37,99,235,0.92)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
                    <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{ fontSize: 13, fontWeight: isActive ? 700 : 600 }}
                  />
                </ListItemButton>
              )}
            </NavLink>
          ))}
        </List>
      </Box>

      <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)', my: 1.5 }} />
    </Box>
  );
}

function Sidebar({ isOpen, onClose, onLogout }) {
  return (
    <>
      {/* Mobile: right-anchored drawer */}
      <Drawer
        open={isOpen}
        onClose={onClose}
        anchor="right"
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: { xs: 290, sm: 310 },
            height: '100dvh',
            border: 'none',
            background: 'transparent',
          },
        }}
      >
        <SidebarContent onLogout={onLogout} onClose={onClose} />
      </Drawer>

      {/* Desktop: left-fixed sidebar */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          position: 'fixed',
          insetY: 0,
          left: 0,
          width: 290,
          height: '100dvh',
          zIndex: 1200,
        }}
      >
        <SidebarContent onLogout={onLogout} onClose={onClose} />
      </Box>
    </>
  );
}

export default Sidebar;
