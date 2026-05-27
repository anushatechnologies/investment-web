function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase();
}

export function resolveInvestorRoute(status = {}) {
  const kycStatus = normalizeStatus(status.kycStatus);
  const accountStatus = normalizeStatus(status.accountStatus);
  const onboardingStatus = normalizeStatus(status.onboardingStatus);

  // Step 1: KYC not submitted -> go to Profile page to fill details & upload docs
  if (!kycStatus || kycStatus === 'NOT_SUBMITTED') return '/profile';
  // Step 2: KYC submitted, waiting for admin approval
  if (kycStatus === 'PENDING') return '/kyc/status';
  // Step 3: KYC rejected or needs reupload
  if (kycStatus === 'REUPLOAD_REQUIRED' || kycStatus === 'REJECTED') return '/kyc';
  // Step 4: KYC approved -> Full Access to Dashboard
  if (kycStatus === 'APPROVED') return '/dashboard';
  // Step 5: Account active -> Dashboard
  if (accountStatus === 'ACTIVE' || onboardingStatus === 'ACTIVE') return '/dashboard';

  // Default: send to profile to start onboarding
  return '/profile';
}

// Check if full onboarding is complete (all steps done)
export function isOnboardingComplete(status = {}) {
  const kycStatus = normalizeStatus(status.kycStatus);
  const accountStatus = normalizeStatus(status.accountStatus);
  const onboardingStatus = normalizeStatus(status.onboardingStatus);

  if (accountStatus === 'ACTIVE' || onboardingStatus === 'ACTIVE') return true;
  if (kycStatus === 'APPROVED') return true;
  return false;
}

