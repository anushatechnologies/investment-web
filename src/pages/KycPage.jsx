import { CloudUploadRounded, DescriptionRounded, FingerprintRounded, PermIdentityRounded } from '@mui/icons-material';
import {
  Alert,
  Box,
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
import { saveOnboardingStatus, submitKyc } from '../services/api';

function UploadField({ label, accept, file, onChange, helper }) {
  return (
    <Card variant="outlined" sx={{ borderStyle: 'dashed', borderWidth: 1.5 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <CloudUploadRounded color="primary" />
            <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
          </Stack>
          <Button component="label" variant="outlined">
            Choose file
            <input hidden type="file" accept={accept} onChange={onChange} />
          </Button>
          <Typography variant="body2" color="text.secondary">
            {file?.name || helper}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function KycPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    panNumber: '',
    aadhaarLast4: '',
    dateOfBirth: '',
    address: '',
    panCardImage: null,
    aadhaarFrontImage: null,
    aadhaarBackImage: null,
    selfiePhoto: null,
    bankPassbookOrStatement: null,
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await submitKyc(form);
      saveOnboardingStatus({ kycStatus: 'PENDING' });
      navigate('/kyc/status', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to submit KYC.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card" sx={{ maxWidth: 1100, mx: 'auto' }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Stack spacing={1.25}>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: '0.18em' }}>
            Onboarding Step
          </Typography>
          <Typography variant="h3" sx={{ fontSize: { xs: 30, sm: 38 } }}>
            KYC Submission
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.8 }}>
            Upload identity and banking proof so the admin team can review and approve your investor account.
          </Typography>
        </Stack>

        {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

        <Box component="form" sx={{ mt: 4 }} onSubmit={onSubmit}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PAN Number"
                value={form.panNumber}
                onChange={(e) => update('panNumber', e.target.value.toUpperCase())}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PermIdentityRounded color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Aadhaar Last 4"
                inputProps={{ maxLength: 4 }}
                value={form.aadhaarLast4}
                onChange={(e) => update('aadhaarLast4', e.target.value.replace(/\D/g, ''))}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FingerprintRounded color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date of Birth"
                value={form.dateOfBirth}
                onChange={(e) => update('dateOfBirth', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionRounded color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <UploadField
                label="PAN Card Image"
                accept=".jpg,.jpeg,.png,.pdf"
                file={form.panCardImage}
                helper="Upload PAN card scan or clear photo"
                onChange={(e) => update('panCardImage', e.target.files?.[0] || null)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <UploadField
                label="Aadhaar Front"
                accept=".jpg,.jpeg,.png,.pdf"
                file={form.aadhaarFrontImage}
                helper="Upload front side of Aadhaar"
                onChange={(e) => update('aadhaarFrontImage', e.target.files?.[0] || null)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <UploadField
                label="Aadhaar Back"
                accept=".jpg,.jpeg,.png,.pdf"
                file={form.aadhaarBackImage}
                helper="Upload back side of Aadhaar"
                onChange={(e) => update('aadhaarBackImage', e.target.files?.[0] || null)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <UploadField
                label="Selfie Photo"
                accept=".jpg,.jpeg,.png"
                file={form.selfiePhoto}
                helper="Upload a clear live selfie"
                onChange={(e) => update('selfiePhoto', e.target.files?.[0] || null)}
              />
            </Grid>
            <Grid item xs={12}>
              <UploadField
                label="Bank Passbook or Statement"
                accept=".jpg,.jpeg,.png,.pdf"
                file={form.bankPassbookOrStatement}
                helper="Upload a recent passbook or statement image/PDF"
                onChange={(e) => update('bankPassbookOrStatement', e.target.files?.[0] || null)}
              />
            </Grid>
          </Grid>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
              Once submitted, your KYC will move to admin review. You’ll be guided automatically to the next onboarding step after approval.
            </Typography>
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit KYC'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

export default KycPage;
