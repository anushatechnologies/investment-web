function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase();
}

function isAccountReady(accountStatus, onboardingStatus) {
  if (accountStatus) {
    return accountStatus === 'ACTIVE';
  }
  return onboardingStatus === 'ACTIVE' || onboardingStatus === 'ACCOUNT_ACTIVATED';
}

export function resolveInvestorRoute(status = {}) {
  const kycStatus = normalizeStatus(status.kycStatus);
  const bankVerified = Boolean(status.bankVerified);
  const mpinCreated = Boolean(status.mpinCreated);
  const accountStatus = normalizeStatus(status.accountStatus);
  const onboardingStatus = normalizeStatus(status.onboardingStatus);
  const accountReady = isAccountReady(accountStatus, onboardingStatus);

  if (!kycStatus || kycStatus === 'NOT_SUBMITTED') return '/kyc';
  if (kycStatus === 'PENDING') return '/kyc/status';
  if (kycStatus === 'REUPLOAD_REQUIRED' || kycStatus === 'REJECTED') return '/kyc';
  if (kycStatus === 'APPROVED' && !bankVerified) return '/bank/link';
  if (kycStatus === 'APPROVED' && bankVerified && !accountReady) {
    return '/account/activate';
  }
  if (accountReady && !mpinCreated) {
    return '/setup-mpin';
  }
  if (accountReady) return '/dashboard';

  return '/kyc';
}

export function isOnboardingComplete(status = {}) {
  const bankVerified = Boolean(status.bankVerified);
  const mpinCreated = Boolean(status.mpinCreated);
  const kycStatus = normalizeStatus(status.kycStatus);
  const accountStatus = normalizeStatus(status.accountStatus);
  const onboardingStatus = normalizeStatus(status.onboardingStatus);
  const accountReady = isAccountReady(accountStatus, onboardingStatus);

  return accountReady && kycStatus === 'APPROVED' && bankVerified && mpinCreated;
}

