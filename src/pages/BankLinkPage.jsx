import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { linkBank, saveOnboardingStatus } from '../services/api';

function BankLinkPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    accountHolderName: '',
    bankAccountNumber: '',
    confirmBankAccountNumber: '',
    bankIfscCode: '',
    bankName: '',
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    if (form.bankAccountNumber !== form.confirmBankAccountNumber) {
      setError('Bank account number and confirm bank account number must match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await linkBank(form);
      saveOnboardingStatus({ bankVerified: true });
      navigate('/account/activate', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to link bank account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card" sx={{ maxWidth: 860, mx: 'auto' }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: '0.18em' }}>
          Onboarding Step
        </Typography>
        <Typography variant="h3" sx={{ mt: 1.5, fontSize: { xs: 30, sm: 38 } }}>
          Link Bank Account
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 620, lineHeight: 1.8 }}>
          Add your verified payout bank details so withdrawals and account activation can move forward.
        </Typography>

        {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

        <form onSubmit={onSubmit}>
          <Grid container spacing={2.5} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Holder Name"
                value={form.accountHolderName}
                onChange={(e) => setForm((p) => ({ ...p, accountHolderName: e.target.value }))}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeRoundedIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Bank Account Number"
                value={form.bankAccountNumber}
                onChange={(e) => setForm((p) => ({ ...p, bankAccountNumber: e.target.value.replace(/\D/g, '') }))}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PaymentsRoundedIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirm Bank Account Number"
                value={form.confirmBankAccountNumber}
                onChange={(e) => setForm((p) => ({ ...p, confirmBankAccountNumber: e.target.value.replace(/\D/g, '') }))}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PaymentsRoundedIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="IFSC Code"
                value={form.bankIfscCode}
                onChange={(e) => setForm((p) => ({ ...p, bankIfscCode: e.target.value.toUpperCase() }))}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalanceRoundedIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Bank Name"
                value={form.bankName}
                onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalanceRoundedIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
              After bank linking succeeds, the onboarding flow will take you directly to account activation.
            </Typography>
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? 'Linking...' : 'Link Bank Account'}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}

export default BankLinkPage;
