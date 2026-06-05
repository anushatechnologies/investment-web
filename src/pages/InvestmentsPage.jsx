import { Banknote, BriefcaseBusiness, Eye, ShieldCheck, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { adminGetAllInvestments, adminGetUsers } from '../services/api';
import {
  asNumber,
  formatDate,
  formatDateTime,
  prettifyEnum,
  toArray,
} from '../utils/adminTransforms';
import { formatCompactCurrency, formatCurrency, formatNumber } from '../utils/formatters';

const statIcons = [BriefcaseBusiness, Banknote, TrendingUp, ShieldCheck];
const statTones = ['blue', 'emerald', 'violet', 'amber'];

function InvestmentsPage() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  const loadInvestments = async () => {
    setLoading(true);
    setError('');
    try {
      const [investmentsRes, usersRes] = await Promise.all([
        adminGetAllInvestments(),
        adminGetUsers().catch(() => []),
      ]);

      const investmentItems = toArray(investmentsRes);
      const users = toArray(usersRes);
      const userMap = new Map(users.map((user) => [user.id, user]));

      const mapped = investmentItems.map((item) => {
        const investor = userMap.get(item.investorUserId);
        const amount = asNumber(item.investmentAmount);
        const monthlyInterestRate = asNumber(item.monthlyInterestRate);
        const estimatedMonthlyInterest = (amount * monthlyInterestRate) / 100;

        return {
          id: item.id,
          investorName: investor?.fullName || investor?.name || 'Unknown Investor',
          investorEmail: investor?.email || 'N/A',
          investorPhone: investor?.mobileNumber || 'N/A',
          planId: item.investmentPlanId || 'N/A',
          amount,
          monthlyInterestRate,
          estimatedMonthlyInterest,
          totalInterestEarned: asNumber(item.totalInterestEarned),
          totalPrincipalReturned: asNumber(item.totalPrincipalReturned),
          status: item.status || 'UNKNOWN',
          receiptApproved: Boolean(item.receiptApproved),
          appliedAt: item.appliedAt,
          activatedAt: item.activatedAt,
          maturityDate: item.maturityDate,
          notes: item.notes || '',
          raw: item,
        };
      });

      setInvestments(mapped);
    } catch (err) {
      console.error('Failed to load investments', err);
      setError(err.message || 'Failed to load investments.');
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestments();
  }, []);

  const stats = useMemo(() => {
    const totalCount = investments.length;
    const activeCount = investments.filter((item) => item.status === 'ACTIVE').length;
    const totalCapital = investments.reduce((sum, item) => sum + item.amount, 0);
    const totalInterest = investments.reduce((sum, item) => sum + item.totalInterestEarned, 0);

    return [
      { title: 'Investment Records', value: totalCount, note: 'live records from admin investments API' },
      { title: 'Total Capital', value: totalCapital, note: 'sum of committed investment amount', currency: true, compact: true },
      { title: 'Interest Earned', value: totalInterest, note: 'total backend-recorded interest earned', currency: true, compact: true },
      { title: 'Active Investments', value: activeCount, note: 'currently active portfolios' },
    ];
  }, [investments]);

  const statusOptions = useMemo(
    () => Array.from(new Set(investments.map((item) => item.status))).sort(),
    [investments],
  );

  const columns = [
    { key: 'id', label: 'Investment ID' },
    {
      key: 'investorName',
      label: 'Investor',
      exportValue: (row) => row.investorName,
      render: (row) => (
        <div>
          <p className="font-semibold text-white">{row.investorName}</p>
          <p className="text-xs text-slate-500">{row.investorEmail}</p>
        </div>
      ),
    },
    { key: 'planId', label: 'Plan ID' },
    {
      key: 'amount',
      label: 'Amount',
      exportValue: (row) => row.amount,
      render: (row) => formatCurrency(row.amount),
    },
    {
      key: 'monthlyInterestRate',
      label: 'Interest',
      exportValue: (row) => row.monthlyInterestRate,
      render: (row) => `${row.monthlyInterestRate}%`,
    },
    {
      key: 'receiptApproved',
      label: 'Receipt',
      exportValue: (row) => (row.receiptApproved ? 'APPROVED' : 'PENDING'),
      render: (row) => <StatusBadge label={row.receiptApproved ? 'APPROVED' : 'PENDING'} />,
    },
    {
      key: 'status',
      label: 'Status',
      exportValue: (row) => row.status,
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'appliedAt',
      label: 'Applied',
      render: (row) => formatDate(row.appliedAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedInvestment(row)}
          className="text-slate-400 transition hover:text-blue-500"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Portfolio lifecycle
        </p>
        <h1 className="section-title mt-3">Investments</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Live investment book tied directly to backend admin records, including portfolio status,
          receipt approval, and maturity timing.
        </p>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            note={stat.note}
            icon={statIcons[index]}
            tone={statTones[index]}
            valueType={stat.currency ? 'currency' : 'number'}
            compact={stat.compact}
          />
        ))}
      </div>

      <SectionCard
        title="Live Investment Book"
        subtitle="Use payment verification for receipt review and activation. This screen is the read-through ledger."
        action={(
          <Button
            type="button"
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon fontSize="small" />}
            onClick={loadInvestments}
            disabled={loading}
            sx={{ borderRadius: '16px' }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Approved receipts</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">
              {formatNumber(investments.filter((item) => item.receiptApproved).length)}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Pending receipts</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">
              {formatNumber(investments.filter((item) => !item.receiptApproved).length)}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-blue-500/10 p-5 text-sm leading-7 text-blue-100">
            Investment edits are not exposed by the backend admin APIs. This page intentionally
            stays read-only and reflects the source-of-truth ledger.
          </div>
        </div>
      </SectionCard>

      <DataTable
        title="Investment Book"
        description="Search by investor, plan, or investment ID to review current allocations."
        data={investments}
        columns={columns}
        searchableKeys={['id', 'investorName', 'investorEmail', 'planId', 'status']}
        searchPlaceholder="Search by investor, plan, or investment ID..."
        filterKey="status"
        filterOptions={statusOptions}
        emptyMessage={loading ? 'Loading investments...' : 'No investments found.'}
        itemsPerPage={20}
        enableCsvExport
        exportFileName="investment-book"
      />

      <Dialog open={Boolean(selectedInvestment)} onClose={() => setSelectedInvestment(null)} fullWidth maxWidth="sm">
        <DialogTitle>Investment Details</DialogTitle>
        <DialogContent dividers>
          {selectedInvestment && (
            <Stack spacing={2}>
              <div>
                <Typography variant="body2" color="text.secondary">Investor</Typography>
                <Typography variant="body1">{selectedInvestment.investorName}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedInvestment.investorEmail}</Typography>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Typography variant="body2" color="text.secondary">Investment Amount</Typography>
                  <Typography variant="body1">{formatCurrency(selectedInvestment.amount)}</Typography>
                </div>
                <div>
                  <Typography variant="body2" color="text.secondary">Monthly Interest</Typography>
                  <Typography variant="body1">{selectedInvestment.monthlyInterestRate}%</Typography>
                </div>
                <div>
                  <Typography variant="body2" color="text.secondary">Estimated Monthly Interest</Typography>
                  <Typography variant="body1">{formatCurrency(selectedInvestment.estimatedMonthlyInterest)}</Typography>
                </div>
                <div>
                  <Typography variant="body2" color="text.secondary">Total Interest Earned</Typography>
                  <Typography variant="body1">{formatCurrency(selectedInvestment.totalInterestEarned)}</Typography>
                </div>
                <div>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <div className="mt-1">
                    <StatusBadge label={selectedInvestment.status} />
                  </div>
                </div>
                <div>
                  <Typography variant="body2" color="text.secondary">Receipt Review</Typography>
                  <div className="mt-1">
                    <StatusBadge label={selectedInvestment.receiptApproved ? 'APPROVED' : 'PENDING'} />
                  </div>
                </div>
                <div>
                  <Typography variant="body2" color="text.secondary">Applied At</Typography>
                  <Typography variant="body1">{formatDateTime(selectedInvestment.appliedAt)}</Typography>
                </div>
                <div>
                  <Typography variant="body2" color="text.secondary">Activated At</Typography>
                  <Typography variant="body1">{formatDateTime(selectedInvestment.activatedAt)}</Typography>
                </div>
                <div>
                  <Typography variant="body2" color="text.secondary">Maturity Date</Typography>
                  <Typography variant="body1">{formatDate(selectedInvestment.maturityDate)}</Typography>
                </div>
                <div>
                  <Typography variant="body2" color="text.secondary">Principal Returned</Typography>
                  <Typography variant="body1">{formatCurrency(selectedInvestment.totalPrincipalReturned)}</Typography>
                </div>
              </div>
              <div>
                <Typography variant="body2" color="text.secondary">Plan / Notes</Typography>
                <Typography variant="body1">
                  {selectedInvestment.planId} {selectedInvestment.notes ? `- ${selectedInvestment.notes}` : ''}
                </Typography>
              </div>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedInvestment(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default InvestmentsPage;
