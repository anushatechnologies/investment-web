import {
  CheckCircleRounded,
  CloudUploadRounded,
  DescriptionRounded,
  ErrorOutlineRounded,
  FingerprintRounded,
  HourglassTopRounded,
  PermIdentityRounded,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getKycStatus, saveOnboardingStatus, submitKyc } from '../services/api';
import { getOnboardingDraft } from '../utils/onboardingDraftStore';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILE_SIZE_MB = 25;

const DOC_FIELDS = [
  {
    formKey: 'panCardImage',
    title: 'PAN Card Image',
    accept: '.jpg,.jpeg,.png,.pdf',
    helper: 'Upload PAN card scan or clear photo',
    statusKey: 'panCardStatus',
    reasonKey: 'panCardRejectionReason',
    pathKey: 'panCardPath',
  },
  {
    formKey: 'aadhaarFrontImage',
    title: 'Aadhaar Front',
    accept: '.jpg,.jpeg,.png,.pdf',
    helper: 'Upload front side of Aadhaar',
    statusKey: 'aadhaarFrontStatus',
    reasonKey: 'aadhaarFrontRejectionReason',
    pathKey: 'aadhaarFrontPath',
  },
  {
    formKey: 'aadhaarBackImage',
    title: 'Aadhaar Back',
    accept: '.jpg,.jpeg,.png,.pdf',
    helper: 'Upload back side of Aadhaar',
    statusKey: 'aadhaarBackStatus',
    reasonKey: 'aadhaarBackRejectionReason',
    pathKey: 'aadhaarBackPath',
  },
  {
    formKey: 'selfiePhoto',
    title: 'Selfie Photo',
    accept: '.jpg,.jpeg,.png',
    helper: 'Upload a clear live selfie',
    statusKey: 'selfieStatus',
    reasonKey: 'selfieRejectionReason',
    pathKey: 'selfiePath',
  },
  {
    formKey: 'bankPassbookOrStatement',
    title: 'Bank Passbook or Statement',
    accept: '.jpg,.jpeg,.png,.pdf',
    helper: 'Upload a recent passbook or statement image/PDF',
    statusKey: 'bankProofStatus',
    reasonKey: 'bankProofRejectionReason',
    pathKey: 'bankProofPath',
  },
];

function statusTone(status) {
  switch (String(status || '').toUpperCase()) {
    case 'APPROVED':
      return { color: 'success', icon: <CheckCircleRounded fontSize="small" /> };
    case 'REUPLOAD_REQUIRED':
    case 'REJECTED':
      return { color: 'error', icon: <ErrorOutlineRounded fontSize="small" /> };
    case 'PENDING':
      return { color: 'warning', icon: <HourglassTopRounded fontSize="small" /> };
    default:
      return { color: 'default', icon: null };
  }
}

function normalizeStatus(status) {
  return String(status || '').trim().toUpperCase();
}

function needsFreshUpload(status) {
  const normalized = normalizeStatus(status);
  return normalized === 'REUPLOAD_REQUIRED' || normalized === 'REJECTED';
}

function UploadField({ title, accept, file, onChange, helper, status, reason, requiredNow, disabled }) {
  const previewUrl = useMemo(() => {
    if (!file || file.type === 'application/pdf') return '';
    return URL.createObjectURL(file);
  }, [file]);

  const tone = statusTone(status);

  return (
    <Card variant="outlined" sx={{ borderStyle: requiredNow ? 'solid' : 'dashed', borderWidth: 1.5 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between" flexWrap="wrap">
            <Stack direction="row" spacing={1.25} alignItems="center">
              <CloudUploadRounded color="primary" />
              <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
            </Stack>
            <Chip
              size="small"
              label={status || (requiredNow ? 'REQUIRED NOW' : 'NOT UPLOADED')}
              color={tone.color}
              icon={tone.icon}
              variant={requiredNow ? 'filled' : 'outlined'}
            />
          </Stack>
          {reason ? <Alert severity="error">Admin note: {reason}</Alert> : null}
          {requiredNow ? (
            <Alert severity="warning">This document must be uploaded in this submission.</Alert>
          ) : null}
          <Button component="label" variant="outlined" disabled={disabled}>
            Choose file
            <input hidden type="file" accept={accept} onChange={onChange} disabled={disabled} />
          </Button>
          <Typography variant="body2" color="text.secondary">
            {file?.name || helper}
          </Typography>
          {file ? (
            <Typography variant="caption" color="text.secondary">
              Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
            </Typography>
          ) : null}
          {previewUrl ? (
            <Box
              component="img"
              src={previewUrl}
              alt={title}
              sx={{
                width: '100%',
                maxHeight: 180,
                objectFit: 'cover',
                borderRadius: 3,
                border: '1px solid rgba(148,163,184,0.24)',
              }}
            />
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

function KycPage() {
  const navigate = useNavigate();
  const draft = getOnboardingDraft();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState('');
  const [statusData, setStatusData] = useState(null);
  const [form, setForm] = useState({
    panNumber: draft.panNumber || '',
    aadhaarLast4: draft.aadhaarLast4 || '',
    dateOfBirth: draft.dateOfBirth || '',
    address: draft.address || '',
    panCardImage: null,
    aadhaarFrontImage: null,
    aadhaarBackImage: null,
    selfiePhoto: null,
    bankPassbookOrStatement: null,
  });

  const submission = statusData?.submission || null;

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      try {
        const response = await getKycStatus();
        if (!active) return;
        setStatusData(response);
        saveOnboardingStatus(response);
        const profile = response?.profile || {};
        setForm((prev) => ({
          ...prev,
          panNumber: prev.panNumber || profile.panNumber || '',
          aadhaarLast4: prev.aadhaarLast4 || profile.aadhaarLast4 || '',
          dateOfBirth: prev.dateOfBirth || profile.dateOfBirth || '',
          address: prev.address || profile.address || '',
        }));
      } catch (err) {
        if (active) {
          setStatusData(null);
        }
      } finally {
        if (active) setRefreshing(false);
      }
    };
    loadStatus();
    return () => {
      active = false;
    };
  }, []);

  const requiredDocs = useMemo(() => DOC_FIELDS.filter((doc) => {
    if (!submission) return true;
    const status = normalizeStatus(submission[doc.statusKey]);
    const hasExistingFile = Boolean(submission[doc.pathKey]);
    return needsFreshUpload(status) || !hasExistingFile;
  }), [submission]);

  const needsReupload = requiredDocs.length > 0 && Boolean(submission);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validateAndStoreFile = (key) => (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      update(key, null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`${file.name} is too large. Please upload files up to ${MAX_FILE_SIZE_MB} MB.`);
      event.target.value = '';
      return;
    }
    setError('');
    update(key, file);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (statusData?.canUpload === false) {
      setError('Your KYC is already approved. Reupload is only needed when the admin requests updated documents.');
      return;
    }

    const missingRequiredDocs = requiredDocs.filter((doc) => !form[doc.formKey]);
    if (missingRequiredDocs.length > 0) {
      setError(`Please upload: ${missingRequiredDocs.map((doc) => doc.title).join(', ')}.`);
      return;
    }

    const hasAnyNewFile = DOC_FIELDS.some((doc) => Boolean(form[doc.formKey]));
    if (!hasAnyNewFile) {
      setError('Upload at least one KYC document before submitting.');
      return;
    }

    setLoading(true);
    try {
      await submitKyc(form);
      saveOnboardingStatus({ ...statusData, kycStatus: 'PENDING', onboardingStatus: 'KYC_PENDING' });
      navigate('/kyc/status', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to submit KYC.');
    } finally {
      setLoading(false);
    }
  };

  const overallStatus = statusData?.kycStatus || 'NOT_SUBMITTED';
  const normalizedOverallStatus = normalizeStatus(overallStatus);
  const canUpload = statusData?.canUpload !== false;
  const isPendingReview = normalizedOverallStatus === 'PENDING';
  const isApproved = normalizedOverallStatus === 'APPROVED';
  const statusSeverity = isApproved ? 'success' : isPendingReview ? 'info' : needsFreshUpload(overallStatus) ? 'error' : 'warning';

  return (
    <Card className="glass-card" sx={{ maxWidth: 1100, mx: 'auto' }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Stack spacing={1.25}>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: '0.18em' }}>
            Onboarding Step
          </Typography>
          <Typography variant="h3" sx={{ fontSize: { xs: 30, sm: 38 } }}>
            KYC Documents
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.8 }}>
            Upload or reupload your identity documents after login. Admin review stays the same, and you can continue the bank and account steps after approval.
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Use clear photos or PDF files up to {MAX_FILE_SIZE_MB} MB. On reupload, only the requested or missing documents are required.
          </Alert>
          {refreshing ? (
            <Alert severity="info">Checking your current KYC status...</Alert>
          ) : (
            <Alert severity={statusSeverity}>
              Current status: {overallStatus}
              {needsReupload ? ` . ${requiredDocs.length} document${requiredDocs.length > 1 ? 's' : ''} need attention.` : ''}
            </Alert>
          )}
          {!refreshing && !canUpload ? (
            <Alert severity="success">
              Your KYC is approved. If an admin later requests a reupload, this page will automatically unlock the required document fields.
            </Alert>
          ) : null}
        </Stack>

        {error ? <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert> : null}

        <Box component="form" sx={{ mt: 4 }} onSubmit={onSubmit}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PAN Number"
                value={form.panNumber}
                onChange={(e) => update('panNumber', e.target.value.toUpperCase())}
                required
                disabled={!canUpload}
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
                disabled={!canUpload}
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
                disabled={!canUpload}
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
                disabled={!canUpload}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionRounded color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {DOC_FIELDS.map((doc) => (
              <Grid item xs={12} md={doc.formKey === 'bankPassbookOrStatement' ? 12 : 6} key={doc.formKey}>
                <UploadField
                  title={doc.title}
                  accept={doc.accept}
                  file={form[doc.formKey]}
                  helper={doc.helper}
                  onChange={canUpload ? validateAndStoreFile(doc.formKey) : undefined}
                  status={submission?.[doc.statusKey]}
                  reason={submission?.[doc.reasonKey]}
                  requiredNow={requiredDocs.some((requiredDoc) => requiredDoc.formKey === doc.formKey)}
                  disabled={!canUpload}
                />
              </Grid>
            ))}
          </Grid>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
              Once submitted, your KYC moves to admin review. If your MPIN is already created, you can still return after login and finish the remaining bank/account steps after approval.
            </Typography>
            <Button type="submit" variant="contained" size="large" disabled={loading || refreshing || !canUpload}>
              {loading ? 'Submitting...' : !canUpload ? 'KYC Approved' : needsReupload ? 'Submit Reupload' : 'Submit KYC'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

export default KycPage;
