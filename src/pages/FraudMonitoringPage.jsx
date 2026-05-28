import { AlertTriangle, Eye, ShieldCheck, Users, Wallet, XCircle } from 'lucide-react';
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
  TextField,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  adminGetFraudAlerts,
  adminGetUsers,
  adminResolveFraudAlert,
  adminSuspendUser,
} from '../services/api';
import { formatDateTime, prettifyEnum, toArray } from '../utils/adminTransforms';

const statIcons = [Users, Wallet, ShieldCheck, Eye];
const statTones = ['rose', 'amber', 'cyan', 'blue'];

function FraudMonitoringPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [viewedActivity, setViewedActivity] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const loadFraudData = async () => {
    setLoading(true);
    setError('');
    try {
      const [alertsRes, usersRes] = await Promise.all([
        adminGetFraudAlerts(),
        adminGetUsers().catch(() => []),
      ]);

      const alerts = toArray(alertsRes);
      const users = toArray(usersRes);
      const userMap = new Map(users.map((user) => [user.id, user]));

      const mapped = alerts.map((alert) => {
        const user = userMap.get(alert.userId);
        return {
          id: alert.id,
          userId: alert.userId,
          userName: user?.fullName || user?.name || 'Unknown User',
          userEmail: user?.email || 'N/A',
          activityType: prettifyEnum(alert.ruleTriggered),
          reason: alert.description || 'N/A',
          riskLevel: alert.alertLevel || 'UNKNOWN',
          status: alert.status || 'OPEN',
          date: formatDateTime(alert.createdAt),
          reviewedAt: formatDateTime(alert.reviewedAt),
          reviewedBy: alert.reviewedBy || 'N/A',
          resolutionNotes: alert.resolutionNotes || '',
        };
      });

      setActivities(mapped);
    } catch (err) {
      console.error('Failed to load fraud alerts', err);
      setError(err.message || 'Failed to load fraud alerts.');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFraudData();
  }, []);

  const fraudStats = useMemo(() => {
    const open = activities.filter((item) => item.status === 'OPEN').length;
    const high = activities.filter((item) => item.riskLevel === 'HIGH').length;
    const resolved = activities.filter((item) => item.status === 'RESOLVED').length;
    const reviewed = activities.filter((item) => item.reviewedBy !== 'N/A').length;

    return [
      { title: 'Open Alerts', value: open, note: 'alerts currently needing action' },
      { title: 'High Risk', value: high, note: 'high-severity rules triggered' },
      { title: 'Resolved Alerts', value: resolved, note: 'alerts closed by admin review' },
      { title: 'Reviewed Cases', value: reviewed, note: 'alerts already touched by admin' },
    ];
  }, [activities]);

  const handleResolve = async (row, status) => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await adminResolveFraudAlert(row.id, resolutionNotes || `Marked as ${status.toLowerCase()} by admin`, status);
      setMessage(`Updated fraud alert ${row.id} to ${status}.`);
      setResolutionNotes('');
      setViewedActivity(null);
      await loadFraudData();
    } catch (err) {
      console.error('Failed to resolve fraud alert', err);
      setError(err.message || 'Failed to resolve fraud alert.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (row) => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await adminSuspendUser(row.userId, resolutionNotes || `Suspended during review of alert ${row.id}`);
      if (row.status === 'OPEN') {
        await adminResolveFraudAlert(row.id, resolutionNotes || 'User suspended by admin', 'UNDER_REVIEW');
      }
      setMessage(`Suspended user ${row.userName} and moved alert ${row.id} into review.`);
      setResolutionNotes('');
      setViewedActivity(null);
      await loadFraudData();
    } catch (err) {
      console.error('Failed to suspend user from fraud screen', err);
      setError(err.message || 'Failed to suspend user.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'userName', label: 'User Name' },
    { key: 'activityType', label: 'Activity Type' },
    { key: 'reason', label: 'Reason' },
    {
      key: 'riskLevel',
      label: 'Risk Level',
      render: (row) => <StatusBadge label={row.riskLevel} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
    { key: 'date', label: 'Date' },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <button
          type="button"
          onClick={() => setViewedActivity(row)}
          className="rounded-xl border border-blue-500/20 bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-100"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
            Risk and fraud defense
          </p>
          <h1 className="section-title mt-3">Fraud Monitoring</h1>
          <p className="section-copy mt-3 max-w-3xl">
            Live fraud-alert queue covering suspicious withdrawals, receipt mismatches, and account
            lifecycle incidents detected by backend rules.
          </p>
        </div>

        <Button
          type="button"
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon fontSize="small" />}
          onClick={loadFraudData}
          disabled={loading}
          sx={{ alignSelf: { xs: 'flex-start', xl: 'center' }, borderRadius: '16px' }}
        >
          {loading ? 'Refreshing...' : 'Refresh Alerts'}
        </Button>
      </div>

      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="success">{message}</Alert>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {fraudStats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            note={stat.note}
            icon={statIcons[index]}
            tone={statTones[index]}
            valueType="number"
          />
        ))}
      </div>

      <DataTable
        title="Suspicious Activities"
        description="Backend fraud alerts with live resolve and suspend actions."
        data={activities}
        columns={columns}
        searchableKeys={['id', 'userName', 'activityType', 'reason']}
        searchPlaceholder="Search by user, reason, or activity type..."
        filterKey="riskLevel"
        filterOptions={Array.from(new Set(activities.map((item) => item.riskLevel))).sort()}
        itemsPerPage={20}
        emptyMessage={loading ? 'Loading fraud alerts...' : 'No fraud alerts found.'}
      />

      <Dialog open={Boolean(viewedActivity)} onClose={() => setViewedActivity(null)} fullWidth maxWidth="sm">
        <DialogTitle>Incident Details</DialogTitle>
        <DialogContent dividers>
          {viewedActivity && (
            <Stack spacing={2}>
              <div>
                <Typography variant="body2" color="text.secondary">User</Typography>
                <Typography variant="body1">{viewedActivity.userName}</Typography>
                <Typography variant="body2" color="text.secondary">{viewedActivity.userEmail}</Typography>
              </div>
              <div>
                <Typography variant="body2" color="text.secondary">Activity Type</Typography>
                <Typography variant="body1">{viewedActivity.activityType}</Typography>
              </div>
              <div>
                <Typography variant="body2" color="text.secondary">Reason</Typography>
                <Typography variant="body1">{viewedActivity.reason}</Typography>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Typography variant="body2" color="text.secondary">Risk Level</Typography>
                  <div className="mt-1">
                    <StatusBadge label={viewedActivity.riskLevel} />
                  </div>
                </div>
                <div>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <div className="mt-1">
                    <StatusBadge label={viewedActivity.status} />
                  </div>
                </div>
                <div>
                  <Typography variant="body2" color="text.secondary">Created At</Typography>
                  <Typography variant="body1">{viewedActivity.date}</Typography>
                </div>
                <div>
                  <Typography variant="body2" color="text.secondary">Reviewed At</Typography>
                  <Typography variant="body1">{viewedActivity.reviewedAt}</Typography>
                </div>
              </div>
              <TextField
                label="Resolution Notes"
                multiline
                minRows={3}
                value={resolutionNotes}
                onChange={(event) => setResolutionNotes(event.target.value)}
                placeholder="Add internal notes for resolve or suspend actions"
              />
              {viewedActivity.resolutionNotes && (
                <div>
                  <Typography variant="body2" color="text.secondary">Existing Resolution</Typography>
                  <Typography variant="body1">{viewedActivity.resolutionNotes}</Typography>
                </div>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
          <Button onClick={() => setViewedActivity(null)} startIcon={<XCircle className="h-4 w-4" />}>
            Close
          </Button>
          {viewedActivity && (
            <Stack direction="row" spacing={1.5}>
              <Button
                onClick={() => handleResolve(viewedActivity, 'RESOLVED')}
                disabled={actionLoading}
                variant="outlined"
                color="success"
              >
                Resolve
              </Button>
              <Button
                onClick={() => handleSuspend(viewedActivity)}
                disabled={actionLoading}
                variant="contained"
                color="error"
              >
                Suspend User
              </Button>
            </Stack>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default FraudMonitoringPage;
