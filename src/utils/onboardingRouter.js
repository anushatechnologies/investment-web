function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase();
}

export function resolveInvestorRoute(status = {}) {
  const kycStatus = normalizeStatus(status.kycStatus);
  const accountStatus = normalizeStatus(status.accountStatus);
  const onboardingStatus = normalizeStatus(status.onboardingStatus);
  
  // Normalize bankVerified (supports boolean and string representations)
  const bankVerified = status.bankVerified === true || String(status.bankVerified || '').toUpperCase() === 'TRUE';
  
  // Normalize mpinCreated (supports boolean and string representations)
  const mpinCreated = status.mpinCreated === true || String(status.mpinCreated || '').toUpperCase() === 'TRUE';

  // Step 5: KYC not submitted -> go to Profile page to fill details & upload docs
  if (!kycStatus || kycStatus === 'NOT_SUBMITTED') {
    return '/profile';
  }

  // Step 6: KYC submitted, waiting for admin approval
  if (kycStatus === 'PENDING') {
    return '/kyc/status';
  }

  // Step 5 (Re-upload): KYC rejected or needs reupload
  if (kycStatus === 'REUPLOAD_REQUIRED' || kycStatus === 'REJECTED') {
    return '/kyc';
  }

  // Once KYC is approved, we enforce subsequent steps in sequence
  if (kycStatus === 'APPROVED') {
    // Step 7: Link Bank Account
    if (!bankVerified) {
      return '/bank/link';
    }
    // Step 8: Activate Account
    if (accountStatus !== 'ACTIVE' && onboardingStatus !== 'ACTIVE') {
      return '/account/activate';
    }
    // Step 9: Set MPIN
    if (!mpinCreated) {
      return '/setup-mpin';
    }
    // Step 10: Open Dashboard (Milestone as success)
    return '/dashboard';
  }

  // Fallback check if account active flag is set but other prerequisites are missing
  if (accountStatus === 'ACTIVE' || onboardingStatus === 'ACTIVE') {
    if (!bankVerified) return '/bank/link';
    if (!mpinCreated) return '/setup-mpin';
    return '/dashboard';
  }

  // Default: send to profile to start onboarding
  return '/profile';
}

// Check if full onboarding is complete (all steps done)
export function isOnboardingComplete(status = {}) {
  const kycStatus = normalizeStatus(status.kycStatus);
  const accountStatus = normalizeStatus(status.accountStatus);
  const onboardingStatus = normalizeStatus(status.onboardingStatus);
  
  const bankVerified = status.bankVerified === true || String(status.bankVerified || '').toUpperCase() === 'TRUE';
  const mpinCreated = status.mpinCreated === true || String(status.mpinCreated || '').toUpperCase() === 'TRUE';

  const isKycApproved = kycStatus === 'APPROVED';
  const isAccountActive = accountStatus === 'ACTIVE' || onboardingStatus === 'ACTIVE';

  // Onboarding is complete only when KYC is approved/account is active AND bank is linked AND MPIN is set
  return (isKycApproved || isAccountActive) && bankVerified && mpinCreated;
}


