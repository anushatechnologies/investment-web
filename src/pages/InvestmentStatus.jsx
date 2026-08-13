import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Activity,
  CalendarClock,
  ShieldCheck,
  TrendingUp,
  Clock,
  Info,
  Coins,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CircleDollarSign,
  Timer,
  ChevronRight,
  Zap,
  BarChart3,
  Wallet,
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { getOwnInvestments } from '../services/api';
import { formatCurrency } from '../utils/formatters';

/* ─── Fallback Demo Dataset ─── */
const DEMO_INVESTMENTS = [
  {
    id: 'INV-A74B29',
    plan: 'Premium Growth Bond',
    amount: 350000,
    startDate: '2026-03-15',
    maturityDate: '2027-03-15',
    nextInterestDueDate: '2026-06-15',
    lastInterestCreditedAt: '2026-05-15',
    monthlyReturn: 2.25,
    status: 'Active',
  },
  {
    id: 'INV-C19D82',
    plan: 'Monthly Yield Income Plan',
    amount: 150000,
    startDate: '2026-04-01',
    maturityDate: '2027-04-01',
    nextInterestDueDate: '2026-07-01',
    lastInterestCreditedAt: '2026-05-01',
    monthlyReturn: 2.0,
    status: 'Active',
  },
  {
    id: 'INV-P44820',
    plan: 'Fixed Capital Shield',
    amount: 250000,
    startDate: '2026-05-10',
    maturityDate: '2027-05-10',
    nextInterestDueDate: '2026-06-10',
    lastInterestCreditedAt: 'Pending Approval',
    monthlyReturn: 1.85,
    status: 'Processing',
  }
];

const DEMO_TIMELINE = [
  {
    id: 'T-1',
    title: 'Monthly Yield Credited',
    update: 'Interest return of ₹7,875 successfully credited to your main wallet from Premium Growth Bond.',
    date: '2026-05-15',
    status: 'Active',
  },
  {
    id: 'T-2',
    title: 'New Plan Application Received',
    update: 'Application for Fixed Capital Shield (₹250,000) under processing. Awaiting administrator approval.',
    date: '2026-05-10',
    status: 'Processing',
  },
  {
    id: 'T-3',
    title: 'Monthly Yield Credited',
    update: 'Interest return of ₹3,000 successfully credited to your main wallet from Monthly Yield Income Plan.',
    date: '2026-05-01',
    status: 'Active',
  },
  {
    id: 'T-4',
    title: 'Receipt Verification Approved',
    update: 'Razorpay payment receipt for Monthly Yield Income Plan has been successfully approved by risk control.',
    date: '2026-04-02',
    status: 'Active',
  }
];

/* ─── Helpers ─── */
function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.investments)) return payload.investments;
  return [];
}

function safeDate(val) {
  if (!val || val === '-' || val === 'Pending Approval') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(val) {
  const d = safeDate(val);
  if (!d) return '-';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

const getTimelineNodeMeta = (title) => {
  const t = (title || '').toUpperCase();
  if (t.includes('CREDITED') || t.includes('YIELD') || t.includes('PAYOUT')) {
    return {
      icon: CircleDollarSign,
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      accentColor: '#10b981',
    };
  }
  if (t.includes('ACTIVATED') || t.includes('SUCCESS') || t.includes('APPROVED')) {
    return {
      icon: ShieldCheck,
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      glowColor: 'rgba(99, 102, 241, 0.25)',
      accentColor: '#6366f1',
    };
  }
  if (t.includes('PROCESSING') || t.includes('APPLICATION') || t.includes('RECEIVED')) {
    return {
      icon: Timer,
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      glowColor: 'rgba(245, 158, 11, 0.25)',
      accentColor: '#f59e0b',
    };
  }
  return {
    icon: Sparkles,
    gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)',
    glowColor: 'rgba(168, 85, 247, 0.25)',
    accentColor: '#a855f7',
  };
};

/* ─── Inline styles ─── */
const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
    paddingTop: '4px',
  },
  demoBanner: (isDark) => ({
    borderRadius: '20px',
    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.12)'}`,
    background: isDark
      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.04))'
      : 'linear-gradient(135deg, rgba(99, 102, 241, 0.04), rgba(139, 92, 246, 0.03))',
    padding: '18px 22px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    backdropFilter: 'blur(12px)',
  }),
  demoBannerIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)',
  },
  statsGrid: {
    display: 'grid',
    gap: '20px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  },
  statCard: (isDark) => ({
    position: 'relative',
    borderRadius: '22px',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(148, 163, 184, 0.15)'}`,
    background: isDark
      ? 'rgba(15, 23, 42, 0.7)'
      : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    cursor: 'default',
    transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
  }),
  statCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 20px 40px -8px rgba(99, 102, 241, 0.12)',
  },
  statIcon: (gradient) => ({
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    background: gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.15)',
    transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
  }),
  statTitle: (isDark) => ({
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: isDark ? 'rgba(226, 232, 240, 0.9)' : 'rgba(71, 85, 105, 1)',
    marginBottom: '6px',
    fontFamily: '"Sora", "Inter", sans-serif',
  }),
  statValue: (isDark) => ({
    fontSize: '26px',
    fontWeight: 900,
    color: isDark ? '#f1f5f9' : '#0f172a',
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    fontFamily: '"Sora", "Inter", sans-serif',
  }),
  statNote: (isDark) => ({
    fontSize: '10px',
    fontWeight: 700,
    color: isDark ? 'rgba(226, 232, 240, 0.7)' : 'rgba(71, 85, 105, 0.9)',
    marginTop: '4px',
    fontFamily: '"Sora", "Inter", sans-serif',
  }),
  ambientOrb: (color) => ({
    position: 'absolute',
    right: '-20px',
    bottom: '-20px',
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${color}15, transparent)`,
    transition: 'transform 0.6s ease, opacity 0.4s ease',
    pointerEvents: 'none',
  }),
  middleGrid: {
    display: 'grid',
    gap: '24px',
    gridTemplateColumns: '360px minmax(0, 1fr)',
  },
  progressContainer: (isDark) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '16px',
    paddingBottom: '8px',
  }),
  progressRingWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '192px',
    height: '192px',
  },
  progressCenter: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  progressPercent: (isDark) => ({
    fontFamily: '"Sora", "Inter", sans-serif',
    fontSize: '36px',
    fontWeight: 900,
    color: isDark ? '#f1f5f9' : '#0f172a',
    lineHeight: 1,
    letterSpacing: '-0.03em',
  }),
  progressLabel: (isDark) => ({
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    fontWeight: 800,
    color: isDark ? 'rgba(226, 232, 240, 0.7)' : 'rgba(71, 85, 105, 0.9)',
    marginTop: '10px',
    fontFamily: '"Sora", "Inter", sans-serif',
  }),
  progressMeta: (isDark) => ({
    width: '100%',
    marginTop: '28px',
    paddingTop: '16px',
    borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(226, 232, 240, 0.6)'}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  }),
  progressMetaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11px',
    fontWeight: 700,
  },
  timelineLine: (isDark) => ({
    position: 'relative',
    paddingLeft: '28px',
    marginLeft: '14px',
    marginTop: '8px',
    marginBottom: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  }),
  timelineLineBefore: (isDark) => ({
    position: 'absolute',
    left: '0',
    top: '0',
    bottom: '0',
    width: '2px',
    background: isDark
      ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.1), transparent)'
      : 'linear-gradient(180deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.08), transparent)',
    borderRadius: '2px',
  }),
  timelineCard: (isDark) => ({
    position: 'relative',
    borderRadius: '16px',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(226, 232, 240, 0.5)'}`,
    background: isDark
      ? 'rgba(15, 23, 42, 0.4)'
      : 'rgba(248, 250, 252, 0.4)',
    padding: '16px 18px',
    transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
    cursor: 'default',
  }),
  timelineCardHover: (isDark) => ({
    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'}`,
    background: isDark
      ? 'rgba(99, 102, 241, 0.05)'
      : 'rgba(99, 102, 241, 0.02)',
    transform: 'translateX(4px)',
    boxShadow: isDark
      ? '0 8px 24px rgba(99, 102, 241, 0.08)'
      : '0 8px 24px rgba(99, 102, 241, 0.06)',
  }),
  timelineNode: (gradient, glowColor) => ({
    position: 'absolute',
    left: '-41px',
    top: '18px',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 0 0 4px rgba(15, 23, 42, 0.9), 0 4px 12px ${glowColor}`,
    transition: 'all 0.35s ease',
    zIndex: 2,
  }),
  timelineTitle: (isDark) => ({
    fontFamily: '"Sora", "Inter", sans-serif',
    fontWeight: 800,
    fontSize: '13px',
    color: isDark ? '#f1f5f9' : '#0f172a',
    lineHeight: 1.3,
  }),
  timelineUpdate: (isDark) => ({
    fontSize: '11px',
    color: isDark ? 'rgba(226, 232, 240, 0.9)' : 'rgba(71, 85, 105, 1)',
    lineHeight: 1.65,
    marginTop: '6px',
  }),
  timelineDate: (isDark) => ({
    fontSize: '10px',
    fontWeight: 700,
    color: isDark ? 'rgba(226, 232, 240, 0.7)' : 'rgba(71, 85, 105, 0.9)',
    flexShrink: 0,
    fontFamily: '"Sora", "Inter", sans-serif',
  }),
  emptyTimeline: (isDark) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    border: `1px dashed ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(148, 163, 184, 0.25)'}`,
    borderRadius: '16px',
  }),
};

/* ─── STAT CARD CONFIG ─── */
const STAT_CONFIG = [
  {
    key: 'totalInvested',
    title: 'Total Active Capital',
    note: 'accumulating returns',
    icon: Wallet,
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    orbColor: '#6366f1',
  },
  {
    key: 'activeCount',
    title: 'Active Plans',
    note: 'currently live and earning',
    icon: ShieldCheck,
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    orbColor: '#10b981',
  },
  {
    key: 'avgYield',
    title: 'Average Returns',
    note: 'weighted monthly yield',
    icon: BarChart3,
    gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)',
    orbColor: '#a855f7',
  },
  {
    key: 'nextDate',
    title: 'Next Payout Date',
    note: 'nearest settlement credit',
    icon: CalendarClock,
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    orbColor: '#f59e0b',
  },
];

/* ─── Stat Card Component ─── */
function StatCard({ config, value, isDark }) {
  const [hovered, setHovered] = useState(false);
  const Icon = config.icon;

  return (
    <div
      style={{
        ...styles.statCard(isDark),
        ...(hovered ? styles.statCardHover : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.ambientOrb(config.orbColor)} />
      <div>
        <div style={styles.statTitle(isDark)}>{config.title}</div>
        <div style={styles.statValue(isDark)}>{value}</div>
        <div style={styles.statNote(isDark)}>{config.note}</div>
      </div>
      <div style={{
        ...styles.statIcon(config.gradient),
        transform: hovered ? 'scale(1.1) rotate(-4deg)' : 'scale(1) rotate(0)',
      }}>
        <Icon style={{ width: '22px', height: '22px', color: '#fff' }} />
      </div>
    </div>
  );
}

/* ─── Timeline Card Component ─── */
function TimelineEventCard({ event, isDark }) {
  const [hovered, setHovered] = useState(false);
  const meta = getTimelineNodeMeta(event.title);
  const NodeIcon = meta.icon;

  return (
    <div
      style={{
        ...styles.timelineCard(isDark),
        ...(hovered ? styles.timelineCardHover(isDark) : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        ...styles.timelineNode(meta.gradient, meta.glowColor),
        transform: hovered ? 'scale(1.15)' : 'scale(1)',
        boxShadow: hovered
          ? `0 0 0 4px ${isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)'}, 0 4px 20px ${meta.glowColor}`
          : `0 0 0 4px ${isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)'}, 0 4px 12px ${meta.glowColor}`,
      }}>
        <NodeIcon style={{ width: '13px', height: '13px', color: '#fff' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={styles.timelineTitle(isDark)}>{event.title}</span>
            <StatusBadge label={event.status} />
          </div>
          <span style={styles.timelineDate(isDark)}>
            {formatDate(event.date)}
          </span>
        </div>
        <p style={styles.timelineUpdate(isDark)}>{event.update}</p>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
function InvestmentStatus() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    let active = true;
    getOwnInvestments()
      .then((response) => {
        if (active) {
          setInvestments(toArray(response));
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setInvestments([]);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  const isDemo = useMemo(() => investments.length === 0, [investments]);

  /* Process core records */
  const normalizedInvestments = useMemo(() => {
    const list = isDemo ? DEMO_INVESTMENTS : investments;
    return list.map((item, idx) => ({
      id: item.id || item.investmentId || `INV-${String(idx + 1).padStart(3, '0')}`,
      plan: item.planName || item.plan || item.investmentPlanName || item.investmentPlan?.planName || 'Standard Growth Plan',
      amount: Number(item.investmentAmount ?? item.amount ?? 0),
      startDate: formatDate(item.startDate || item.createdAt),
      maturityDate: formatDate(item.maturityDate),
      nextInterestDueDate: item.nextInterestDueDate || '-',
      lastInterestCreditedAt: item.lastInterestCreditedAt || '-',
      monthlyReturn: item.monthlyReturn || item.monthlyInterestRate || '-',
      status: item.status || 'Active',
    }));
  }, [investments, isDemo]);

  /* Aggregate metric values */
  const metrics = useMemo(() => {
    const list = normalizedInvestments;
    const activeList = list.filter((item) => item.status?.toLowerCase() === 'active');
    const totalInvested = activeList.reduce((sum, item) => sum + item.amount, 0);
    const activeCount = activeList.length;

    const avgYield = totalInvested > 0
      ? activeList.reduce((sum, item) => sum + (item.amount * Number(item.monthlyReturn || 0)), 0) / totalInvested
      : list.length > 0 ? Number(list[0].monthlyReturn || 0) : 0;

    const sortedNextDates = activeList
      .map((item) => item.nextInterestDueDate)
      .filter((date) => date && date !== '-')
      .map((d) => safeDate(d))
      .filter(Boolean)
      .sort((a, b) => a - b);
    const nextDate = sortedNextDates[0] ? formatDate(sortedNextDates[0]) : '-';

    return { totalInvested, activeCount, avgYield, nextDate };
  }, [normalizedInvestments]);

  /* Overall progress percentage calculation */
  const overallProgress = useMemo(() => {
    if (!isDemo && investments.length > 0) {
      const activePlans = investments.filter((item) => item.status?.toLowerCase() === 'active');
      if (activePlans.length === 0) return 0;

      let totalProgress = 0;
      let count = 0;
      activePlans.forEach((item) => {
        const startDateStr = item.startDate || item.createdAt;
        const maturityDateStr = item.maturityDate;

        let progressVal = 0;
        if (startDateStr && maturityDateStr && startDateStr !== '-' && maturityDateStr !== '-') {
          const start = new Date(startDateStr).getTime();
          const end = new Date(maturityDateStr).getTime();
          const now = Date.now();
          if (!isNaN(start) && !isNaN(end) && end > start) {
            progressVal = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
          } else {
            progressVal = 35;
          }
        } else {
          progressVal = 35;
        }
        totalProgress += progressVal;
        count++;
      });
      return count > 0 ? Math.round(totalProgress / count) : 0;
    }
    return 78;
  }, [investments, isDemo]);

  /* Generate dynamic chronological timeline */
  const timelineEvents = useMemo(() => {
    if (!isDemo && investments.length > 0) {
      const eventsList = [];
      investments.forEach((item, index) => {
        const key = item.id || `inv-${index}`;
        const planName = item.planName || item.plan || item.investmentPlanName || item.investmentPlan?.planName || 'Standard Growth Plan';
        const formattedAmount = formatCurrency(Number(item.investmentAmount ?? item.amount ?? 0));
        const eventDate = item.startDate || item.createdAt || new Date().toISOString();

        if (item.status?.toLowerCase() === 'active') {
          eventsList.push({
            id: `TL-ACT-${key}`,
            title: 'Plan Activated Successfully',
            update: `Your capital commitment of ${formattedAmount} under ${planName} is active and earning yield.`,
            date: eventDate,
            status: 'Active',
          });
          if (item.nextInterestDueDate && item.nextInterestDueDate !== '-') {
            eventsList.push({
              id: `TL-DUE-${key}`,
              title: 'Yield Credit Scheduled',
              update: `Expected monthly yield payout of ${planName} is scheduled to credit into your main wallet.`,
              date: item.nextInterestDueDate,
              status: 'Pending',
            });
          }
        } else if (item.status?.toLowerCase() === 'processing' || item.status?.toLowerCase() === 'receipt_uploaded') {
          eventsList.push({
            id: `TL-PROC-${key}`,
            title: 'Payment Receipt Verification',
            update: `Submitted payment receipt for ${planName} (${formattedAmount}) is currently under audit by risk control.`,
            date: eventDate,
            status: 'Processing',
          });
        }
      });
      return eventsList.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return DEMO_TIMELINE;
  }, [investments, isDemo]);

  /* SVG circular ring configurations */
  const radius = 70;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - overallProgress / 100);

  const statValues = {
    totalInvested: formatCurrency(metrics.totalInvested),
    activeCount: String(metrics.activeCount),
    avgYield: `${metrics.avgYield.toFixed(2)}%`,
    nextDate: metrics.nextDate,
  };

  /* DataTable columns */
  const columns = [
    {
      key: 'id',
      label: 'Investment ID',
      render: (row) => (
        <span style={{
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: '11px',
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: '8px',
          background: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.06)',
          color: isDark ? '#a5b4fc' : '#6366f1',
          border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.12)'}`,
          letterSpacing: '0.02em',
        }}>
          {row.id}
        </span>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: '"Sora", "Inter", sans-serif',
            fontWeight: 800,
            fontSize: '13px',
            color: isDark ? '#f1f5f9' : '#0f172a',
          }}>
            {row.plan}
          </span>
          {row.monthlyReturn && row.monthlyReturn !== '-' && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: '20px',
              fontSize: '9px',
              fontWeight: 800,
              background: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
              color: isDark ? '#34d399' : '#059669',
              border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)'}`,
              letterSpacing: '0.02em',
            }}>
              {row.monthlyReturn}% p.m.
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span style={{
          fontWeight: 800,
          fontSize: '13px',
          color: isDark ? '#f1f5f9' : '#0f172a',
          fontFamily: '"Sora", "Inter", sans-serif',
        }}>
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    { key: 'startDate', label: 'Start Date' },
    { key: 'maturityDate', label: 'Maturity Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  /* ─── Loading Skeleton ─── */
  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: '108px',
                borderRadius: '22px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(226,232,240,0.6)'}`,
                background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          ))}
        </div>
        <div style={{ ...styles.middleGrid }}>
          <div style={{
            height: '380px',
            borderRadius: '24px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(226,232,240,0.6)'}`,
            background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.8)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }} />
          <div style={{
            height: '380px',
            borderRadius: '24px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(226,232,240,0.6)'}`,
            background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.8)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }} />
        </div>
        <div style={{
          height: '280px',
          borderRadius: '24px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(226,232,240,0.6)'}`,
          background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.8)',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }} />
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      {/* CSS Keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes ringDraw {
          from { stroke-dashoffset: ${circumference}; }
          to { stroke-dashoffset: ${strokeDashoffset}; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.2)); }
          50% { filter: drop-shadow(0 0 18px rgba(139, 92, 246, 0.35)); }
        }
        @media (max-width: 1080px) {
          .inv-status-middle-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Demo Banner */}
      {isDemo && (
        <div style={{ ...styles.demoBanner(isDark), animation: 'fadeInUp 0.5s ease-out' }}>
          <div style={styles.demoBannerIcon}>
            <Info style={{ width: '20px', height: '20px', color: '#fff' }} />
          </div>
          <div>
            <h4 style={{
              fontFamily: '"Sora", "Inter", sans-serif',
              fontWeight: 800,
              fontSize: '13px',
              color: isDark ? '#a5b4fc' : '#4338ca',
              margin: 0,
            }}>
              Simulation Mode Active
            </h4>
            <p style={{
              fontSize: '11px',
              color: isDark ? 'rgba(226, 232, 240, 0.9)' : 'rgba(71, 85, 105, 1)',
              marginTop: '4px',
              lineHeight: 1.65,
            }}>
              No active capital placements found. Displaying sample data to preview dashboard metrics and timeline.{' '}
              <button
                onClick={() => navigate('/investments')}
                style={{
                  fontWeight: 800,
                  textDecoration: 'underline',
                  color: isDark ? '#818cf8' : '#4f46e5',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '11px',
                }}
              >
                Start investing →
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div style={styles.statsGrid}>
        {STAT_CONFIG.map((config) => (
          <StatCard
            key={config.key}
            config={config}
            value={statValues[config.key]}
            isDark={isDark}
          />
        ))}
      </div>

      {/* Progress Circle & Timeline Grid */}
      <div className="inv-status-middle-grid" style={styles.middleGrid}>
        {/* Overall Progress Ring */}
        <SectionCard
          title="Overall Progress"
          subtitle="Aggregate plan lock-in completion tracking."
          action={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '10px',
              fontWeight: 800,
              background: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.06)',
              color: isDark ? '#a5b4fc' : '#6366f1',
              border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)'}`,
              letterSpacing: '0.06em',
            }}>
              <Zap style={{ width: '11px', height: '11px' }} />
              LIVE
            </div>
          }
        >
          <div style={styles.progressContainer(isDark)}>
            <div style={styles.progressRingWrapper}>
              <svg width="192" height="192" style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                  <linearGradient id="investRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="40%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                  <filter id="ringGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Background track */}
                <circle
                  cx="96"
                  cy="96"
                  r={radius}
                  stroke={isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.9)'}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Active arc */}
                <circle
                  cx="96"
                  cy="96"
                  r={radius}
                  stroke="url(#investRingGrad)"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  filter="url(#ringGlow)"
                  style={{
                    animation: 'ringDraw 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards, glowPulse 3s ease-in-out infinite 1.5s',
                  }}
                />
              </svg>
              <div style={styles.progressCenter}>
                <span style={styles.progressPercent(isDark)}>
                  {overallProgress}%
                </span>
                <span style={styles.progressLabel(isDark)}>
                  Weighted Maturity
                </span>
              </div>
            </div>

            <div style={styles.progressMeta(isDark)}>
              <div style={styles.progressMetaRow}>
                <span style={{ color: isDark ? 'rgba(226, 232, 240, 0.7)' : 'rgba(71, 85, 105, 0.9)' }}>
                  Capital Protection
                </span>
                <span style={{
                  color: isDark ? '#34d399' : '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <ShieldCheck style={{ width: '12px', height: '12px' }} />
                  100% Secured
                </span>
              </div>
              <div style={styles.progressMetaRow}>
                <span style={{ color: isDark ? 'rgba(226, 232, 240, 0.7)' : 'rgba(71, 85, 105, 0.9)' }}>
                  Maturity Mode
                </span>
                <span style={{ color: isDark ? '#a5b4fc' : '#6366f1' }}>
                  Monthly Payouts
                </span>
              </div>
              <div style={styles.progressMetaRow}>
                <span style={{ color: isDark ? 'rgba(226, 232, 240, 0.7)' : 'rgba(71, 85, 105, 0.9)' }}>
                  Risk Level
                </span>
                <span style={{
                  color: isDark ? '#34d399' : '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  Low
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Chronological Timeline */}
        <SectionCard
          title="Plan Event Timeline"
          subtitle="Dynamic chronology of deposits, checks, and monthly payouts."
          action={
            <div style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '10px',
              fontWeight: 800,
              background: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.06)',
              color: isDark ? '#34d399' : '#059669',
              border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'}`,
              letterSpacing: '0.06em',
            }}>
              {timelineEvents.length} EVENTS
            </div>
          }
        >
          {timelineEvents.length > 0 ? (
            <div style={styles.timelineLine(isDark)}>
              <div style={styles.timelineLineBefore(isDark)} />
              {timelineEvents.map((event, idx) => (
                <div key={event.id || idx} style={{ animation: `fadeInUp 0.4s ease-out ${idx * 0.08}s both` }}>
                  <TimelineEventCard event={event} isDark={isDark} />
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyTimeline(isDark)}>
              <ShieldAlert style={{
                width: '32px',
                height: '32px',
                color: isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)',
                marginBottom: '12px',
              }} />
              <p style={{
                fontFamily: '"Sora", "Inter", sans-serif',
                fontWeight: 800,
                fontSize: '14px',
                color: isDark ? 'rgba(241, 245, 249, 0.7)' : 'rgba(15, 23, 42, 0.7)',
                margin: 0,
              }}>
                No timeline updates
              </p>
              <p style={{
                fontSize: '12px',
                color: isDark ? 'rgba(226, 232, 240, 0.7)' : 'rgba(71, 85, 105, 0.9)',
                marginTop: '6px',
              }}>
                Once plans activate, updates appear here.
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Data Table */}
      <DataTable
        title="Active Capital Portfolio"
        description="Comprehensive audit of all registered capital, yields, and plan lock-ins."
        data={normalizedInvestments}
        columns={columns}
        searchableKeys={['id', 'plan', 'status']}
        searchPlaceholder="Search by plan, ID, or status..."
        filterKey="status"
        filterOptions={['Active', 'Processing']}
      />
    </div>
  );
}

export default InvestmentStatus;
