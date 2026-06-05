/**
 * API Service Layer
 * Handles all communication with the Anusha Trade backend.
 */

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.anushatrade.com';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');
const FIREBASE_OTP_TEST_MODE = import.meta.env.VITE_FIREBASE_OTP_TEST_MODE === 'true';

export function buildUrl(endpoint) {
  let normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (BASE_URL === '/api' && normalizedEndpoint.startsWith('/api/')) {
    normalizedEndpoint = normalizedEndpoint.replace('/api/', '/');
  }
  return `${BASE_URL}${normalizedEndpoint}`;
}

export function getFileViewUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return buildUrl(`/api/files/view?path=${encodeURIComponent(path)}`);
}

export function getLegalDocument(documentKey) {
  return request(`/api/legal/${documentKey}`);
}

// ── Storage Keys ──────────────────────────────────────────
const TOKEN_KEYS = {
  ACCESS: 'anusha-access-token',
  REFRESH: 'anusha-refresh-token',
  ROLE: 'anusha-invest-hub-auth-role',
  USER_ID: 'anusha-user-id',
  USER_NAME: 'anusha-user-name',
  USER_EMAIL: 'anusha-user-email',
  USER_PHONE: 'anusha-user-phone',
  USER_CITY: 'anusha-user-city',
  JOINED_AT: 'anusha-joined-at',
  BANK_NAME: 'anusha-bank-name',
  BANK_ACCOUNT: 'anusha-bank-account',
  UPI_ID: 'anusha-upi-id',
  REFERRAL_CODE: 'anusha-referral-code',
  ONBOARDING_STATUS: 'anusha-onboarding-status',
};

// ── Token helpers ─────────────────────────────────────────
export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEYS.ACCESS);
}

function parseJwtPayload(token) {
  if (!token) return null;
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

function deriveNameFromEmail(value) {
  if (!value || !value.includes('@')) return '';
  const local = value.split('@')[0];
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function getRefreshToken() {
  return localStorage.getItem(TOKEN_KEYS.REFRESH);
}

export function getAuthRole() {
  return localStorage.getItem(TOKEN_KEYS.ROLE);
}

export function getUserId() {
  return localStorage.getItem(TOKEN_KEYS.USER_ID);
}

export function getUserName() {
  return localStorage.getItem(TOKEN_KEYS.USER_NAME);
}

export function getUserEmail() {
  return localStorage.getItem(TOKEN_KEYS.USER_EMAIL);
}

export function getUserPhone() {
  return localStorage.getItem(TOKEN_KEYS.USER_PHONE);
}

export function getUserCity() {
  return localStorage.getItem(TOKEN_KEYS.USER_CITY);
}

export function getJoinedAt() {
  return localStorage.getItem(TOKEN_KEYS.JOINED_AT);
}

export function getSavedBankName() {
  return localStorage.getItem(TOKEN_KEYS.BANK_NAME);
}

export function getSavedBankAccount() {
  return localStorage.getItem(TOKEN_KEYS.BANK_ACCOUNT);
}

export function getSavedUpiId() {
  return localStorage.getItem(TOKEN_KEYS.UPI_ID);
}

export function getSavedReferralCode() {
  return localStorage.getItem(TOKEN_KEYS.REFERRAL_CODE);
}

export function getStoredOnboardingStatus() {
  try {
    const raw = localStorage.getItem(TOKEN_KEYS.ONBOARDING_STATUS);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export async function hydrateInvestorSessionState() {
  const [dashboardResult, securityResult] = await Promise.allSettled([
    request('/api/dashboard', { auth: true }),
    request('/api/security/summary', { auth: true }),
  ]);

  const dashboard = dashboardResult.status === 'fulfilled' ? (dashboardResult.value || {}) : {};
  const security = securityResult.status === 'fulfilled' ? (securityResult.value || {}) : {};
  const profile = dashboard?.profile || {};

  return {
    user: profile,
    name: profile.fullName || profile.name,
    email: profile.email,
    mobileNumber: profile.mobileNumber || profile.phoneNumber || profile.phone,
    referralCode: profile.referralCode,
    onboardingStatus: dashboard?.onboardingStatus || profile.onboardingStatus,
    kycStatus: dashboard?.kycStatus || profile.kycStatus,
    bankVerified: security?.bankVerified ?? profile.bankVerified,
    mpinCreated: security?.mpinCreated,
    accountStatus: profile.accountStatus || dashboard?.accountStatus,
  };
}

export function saveOnboardingStatus(status) {
  if (!status || typeof status !== 'object') return;
  const existing = getStoredOnboardingStatus() || {};
  const next = {
    onboardingStatus: status.onboardingStatus !== undefined ? status.onboardingStatus : existing.onboardingStatus,
    kycStatus: status.kycStatus !== undefined ? status.kycStatus : existing.kycStatus,
    bankVerified: status.bankVerified !== undefined ? status.bankVerified : existing.bankVerified,
    mpinCreated: status.mpinCreated !== undefined ? status.mpinCreated : existing.mpinCreated,
    accountStatus: status.accountStatus !== undefined ? status.accountStatus : existing.accountStatus,
  };
  localStorage.setItem(TOKEN_KEYS.ONBOARDING_STATUS, JSON.stringify(next));
}

export function saveAuthData({
  accessToken,
  refreshToken,
  role,
  userId,
  name,
  fullName,
  email,
  mobileNumber,
  phoneNumber,
  city,
  joinedAt,
  bankName,
  bankAccountNumber,
  upiId,
  referralCode,
  user,
  onboardingStatus,
  kycStatus,
  bankVerified,
  mpinCreated,
  accountStatus,
}) {
  if (accessToken) localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
  if (refreshToken) localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
  if (role) localStorage.setItem(TOKEN_KEYS.ROLE, role.toLowerCase() === 'admin' ? 'admin' : 'user');
  
  const tokenPayload = parseJwtPayload(accessToken) || {};

  const resolvedEmail =
    email ||
    user?.email ||
    tokenPayload?.email ||
    tokenPayload?.upn;

  const resolvedPhone =
    mobileNumber ||
    phoneNumber ||
    user?.mobileNumber ||
    user?.phoneNumber ||
    user?.phone ||
    tokenPayload?.mobileNumber ||
    tokenPayload?.phoneNumber;

  let resolvedUserId = 
    userId || 
    user?.id || 
    user?.userId || 
    tokenPayload?.userId || 
    tokenPayload?.id || 
    tokenPayload?.sub;

  // In local/mock mode, if we get a new backend UID but we already have local profile data 
  // saved under a different UID for the same email or phone (due to duplicate registrations),
  // we will merge that old profile data into the new UID so that Profile Details don't appear blank.
  if (resolvedUserId && (resolvedEmail || resolvedPhone)) {
    try {
      const allProfiles = JSON.parse(localStorage.getItem('anusha-user-profile-by-id') || '{}');
      let foundOldId = null;
      for (const [id, prof] of Object.entries(allProfiles)) {
        if (id !== resolvedUserId) {
          if ((resolvedEmail && prof.email === resolvedEmail) || 
              (resolvedPhone && prof.phone === resolvedPhone)) {
            foundOldId = id;
            break;
          }
        }
      }
      
      if (foundOldId) {
        allProfiles[resolvedUserId] = {
          ...(allProfiles[foundOldId] || {}),
          ...(allProfiles[resolvedUserId] || {}),
        };
        localStorage.setItem('anusha-user-profile-by-id', JSON.stringify(allProfiles));
      }
    } catch (e) {
      // ignore
    }
  }

  // Final fallback: generate a mock ID if completely missing
  if (!resolvedUserId) {
    resolvedUserId = (resolvedEmail ? `UID-${resolvedEmail}` : null) || (resolvedPhone ? `UID-${resolvedPhone}` : null);
  }

  if (resolvedUserId) localStorage.setItem(TOKEN_KEYS.USER_ID, resolvedUserId);

  const resolvedName =
    name ||
    fullName ||
    user?.fullName ||
    user?.full_name ||
    user?.name ||
    user?.username ||
    tokenPayload?.fullName ||
    tokenPayload?.full_name ||
    tokenPayload?.name ||
    tokenPayload?.username ||
    deriveNameFromEmail(resolvedEmail);

  if (resolvedName) localStorage.setItem(TOKEN_KEYS.USER_NAME, resolvedName);
  if (resolvedEmail) localStorage.setItem(TOKEN_KEYS.USER_EMAIL, resolvedEmail);
  if (resolvedPhone) localStorage.setItem(TOKEN_KEYS.USER_PHONE, resolvedPhone);

  const resolvedCity = city || user?.city || user?.addressCity || user?.address;
  const resolvedJoinedAt =
    joinedAt ||
    user?.joinedAt ||
    user?.createdAt ||
    user?.joinDate ||
    localStorage.getItem(TOKEN_KEYS.JOINED_AT) ||
    new Date().toISOString();
  const resolvedBankName = bankName || user?.bankName || user?.bank?.bankName || user?.bankDetails?.bankName;
  const resolvedBankAccount = bankAccountNumber || user?.bankAccountNumber || user?.accountNumber || user?.bank?.bankAccountNumber || user?.bankDetails?.bankAccountNumber;
  const resolvedUpiId = upiId || user?.upiId || user?.vpa || user?.bank?.upiId || user?.bankDetails?.upiId;
  const resolvedReferralCode = referralCode || user?.referralCode;
  if (resolvedPhone) localStorage.setItem(TOKEN_KEYS.USER_PHONE, resolvedPhone);
  if (resolvedCity) localStorage.setItem(TOKEN_KEYS.USER_CITY, resolvedCity);
  if (resolvedJoinedAt) localStorage.setItem(TOKEN_KEYS.JOINED_AT, resolvedJoinedAt);
  // Guard: only store value as bank name if it looks like an actual bank name.
  // Reject values that look like a person's full name (words-only, no bank keyword).
  const bankKeywords = /bank|sbi|hdfc|icici|axis|kotak|pnb|ubi|boi|canara|union|central|indian|federal|idbi|yes|rbl|dcb|nainital|syndicate|vijaya/i;
  const looksLikePersonName = resolvedBankName && !bankKeywords.test(resolvedBankName) && /^[A-Za-z\s]+$/.test(resolvedBankName.trim()) && resolvedBankName.trim().split(/\s+/).length >= 2;
  if (resolvedBankName && !looksLikePersonName) localStorage.setItem(TOKEN_KEYS.BANK_NAME, resolvedBankName);
  else if (looksLikePersonName) localStorage.removeItem(TOKEN_KEYS.BANK_NAME); // clear corrupted value
  if (resolvedBankAccount) localStorage.setItem(TOKEN_KEYS.BANK_ACCOUNT, resolvedBankAccount);
  if (resolvedUpiId) localStorage.setItem(TOKEN_KEYS.UPI_ID, resolvedUpiId);
  if (resolvedReferralCode) localStorage.setItem(TOKEN_KEYS.REFERRAL_CODE, resolvedReferralCode);

  saveOnboardingStatus({
    onboardingStatus: onboardingStatus ?? user?.onboardingStatus,
    kycStatus: kycStatus ?? user?.kycStatus,
    bankVerified: bankVerified ?? user?.bankVerified,
    mpinCreated: mpinCreated ?? user?.mpinCreated,
    accountStatus: accountStatus ?? user?.accountStatus,
  });

  if (accessToken && tokenPayload) {
    saveOnboardingStatus({
      onboardingStatus: tokenPayload.onboardingStatus,
      kycStatus: tokenPayload.kycStatus,
      bankVerified: tokenPayload.bankVerified,
      mpinCreated: tokenPayload.mpinCreated,
      accountStatus: tokenPayload.accountStatus,
    });
  }
}

export function clearAuthData() {
  Object.values(TOKEN_KEYS).forEach((key) => localStorage.removeItem(key));
}

// ── Generic fetch wrapper ─────────────────────────────────
export async function request(endpoint, { method = 'GET', body, auth = false, retryOnAuthFail = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(buildUrl(endpoint), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    const error = new Error(
      'Unable to connect to server. Check internet, API URL, HTTPS, and backend CORS for this origin.',
    );
    error.status = 0;
    error.data = { cause: networkError?.message || 'NetworkError' };
    throw error;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (auth && (res.status === 401 || res.status === 403) && retryOnAuthFail) {
      const storedRefreshToken = getRefreshToken();
      if (!storedRefreshToken) {
        clearAuthData();
        window.location.href = '/login';
      } else {
        try {
          const refreshResult = await request('/api/auth/refresh-token', {
            method: 'POST',
            body: { refreshToken: storedRefreshToken },
            retryOnAuthFail: false,
          });
          if (refreshResult?.accessToken) {
            saveAuthData({ accessToken: refreshResult.accessToken });
            return request(endpoint, { method, body, auth, retryOnAuthFail: false });
          }
        } catch (refreshError) {
          clearAuthData();
          window.location.href = '/login';
          throw refreshError;
        }
      }
    }

    const validationDetails =
      Array.isArray(data?.errors) ? data.errors.join(', ')
        : Array.isArray(data?.details) ? data.details.join(', ')
          : typeof data?.details === 'string' ? data.details
            : '';
    const baseMessage = data.message || data.error || `Request failed (${res.status})`;
    const errorMessage = validationDetails ? `${baseMessage}: ${validationDetails}` : baseMessage;
    const error = new Error(errorMessage);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function requestFormData(endpoint, { method = 'POST', formData, auth = false, retryOnAuthFail = true } = {}) {
  const headers = {};

  if (auth) {
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(buildUrl(endpoint), {
      method,
      headers,
      body: formData,
    });
  } catch (networkError) {
    const error = new Error(
      'Unable to connect to server. Check internet, API URL, HTTPS, and backend CORS for this origin.',
    );
    error.status = 0;
    error.data = { cause: networkError?.message || 'NetworkError' };
    throw error;
  }

  const text = await res.text().catch(() => '');
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_) {
    data = { raw: text };
  }

  if (!res.ok) {
    if (auth && (res.status === 401 || res.status === 403) && retryOnAuthFail) {
      const storedRefreshToken = getRefreshToken();
      if (!storedRefreshToken) {
        clearAuthData();
        window.location.href = '/login';
      } else {
        try {
          const refreshResult = await request('/api/auth/refresh-token', {
            method: 'POST',
            body: { refreshToken: storedRefreshToken },
            retryOnAuthFail: false,
          });
          if (refreshResult?.accessToken) {
            saveAuthData({ accessToken: refreshResult.accessToken });
            return requestFormData(endpoint, { method, formData, auth, retryOnAuthFail: false });
          }
        } catch (refreshError) {
          clearAuthData();
          window.location.href = '/login';
          throw refreshError;
        }
      }
    }

    const validationDetails =
      Array.isArray(data?.errors) ? data.errors.join(', ')
        : Array.isArray(data?.details) ? data.details.join(', ')
          : typeof data?.details === 'string' ? data.details
            : '';
    const baseMessage = data.message || data.error || `Request failed (${res.status})`;
    const errorMessage = validationDetails ? `${baseMessage}: ${validationDetails}` : baseMessage;
    const error = new Error(errorMessage);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ── Auth APIs ─────────────────────────────────────────────

/**
 * Step 1: Send OTP helper — tells frontend to use Firebase Phone Auth
 */
export function sendOtp(mobileNumber, countryCode = '+91', type = 'REGISTRATION', options = {}) {
  const normalizedMobile = String(mobileNumber || '').replace(/\D/g, '');
  const fullMobileNumber = `${countryCode}${normalizedMobile}`;
  const { useFirebase = false } = options;
  return request('/api/auth/send-otp', {
    method: 'POST',
    body: {
      countryCode,
      mobileNumber: normalizedMobile,
      phoneNumber: normalizedMobile,
      fullMobileNumber: fullMobileNumber,
      channel: useFirebase ? 'FIREBASE_PHONE_AUTH' : 'MOBILE_OTP',
      useFirebase,
      type: type, // 'REGISTRATION' or 'FORGOT_PASSWORD'
    },
  }).catch((error) => {
    console.error('[sendOtp] Backend error:', error.data || error);
    // In local Firebase OTP test mode, backend OTP dispatch can be unavailable.
    // Allow frontend Firebase OTP flow to continue even if backend returns 5xx.
    if (FIREBASE_OTP_TEST_MODE && error?.status >= 500) {
      return { skippedBackendOtp: true, reason: error?.message || 'Backend OTP unavailable' };
    }
    throw error;
  });
}

/**
 * Step 2: Verify OTP — send Firebase idToken or email+otp to backend
 */
export function verifyOtp(payload) {
  const body = typeof payload === 'string' ? { idToken: payload } : payload;
  return request('/api/auth/verify-otp', {
    method: 'POST',
    body,
  });
}

export function sendEmailOtp(email) {
  return request('/api/auth/send-otp', {
    method: 'POST',
    body: { email },
  });
}

export function verifyEmailOtp(email, otp) {
  return request('/api/auth/verify-otp', {
    method: 'POST',
    body: { email, otp },
  });
}

export function validateReferralCode(code) {
  return request(`/api/auth/referrals/validate?code=${encodeURIComponent(String(code || '').trim())}`);
}

/**
 * Step 3: Register new user (after OTP verification)
 */
export function registerUser({
  idToken,
  signupVerificationToken,
  fullName,
  email,
  mobileNumber,
  password,
  referredByCode = null,
  riskDisclosureAccepted,
  investorAgreementAccepted,
  termsAccepted,
  privacyPolicyAccepted,
  kycConsentAccepted,
}) {
  const emailRegistrationBody = {
    fullName,
    email,
    mobileNumber,
    password,
    referredByCode,
    signupVerificationToken,
    riskDisclosureAccepted,
    investorAgreementAccepted,
  };

  const mobileRegistrationBody = {
    idToken,
    fullName,
    email,
    mobileNumber,
    password,
    referredByCode,
    termsAccepted,
    privacyPolicyAccepted,
    kycConsentAccepted,
    riskDisclosureAccepted,
    investorAgreementAccepted,
    privacyAccepted: privacyPolicyAccepted,
    kycConsent: kycConsentAccepted,
  };

  if (idToken && !signupVerificationToken) {
    return request('/api/auth/onboarding/register', {
      method: 'POST',
      body: mobileRegistrationBody,
    });
  }

  return request('/api/auth/register', {
    method: 'POST',
    body: emailRegistrationBody,
  });
}

/**
 * Step 4: Set MPIN (requires access token)
 */
export function setMpin(mpin) {
  return request('/api/auth/set-mpin', {
    method: 'POST',
    body: { mpin },
    auth: true,
  });
}

/**
 * Step 5: Email/password login (admin or investor password login)
 */
export function loginWithEmail(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function forgotPassword({ email, mobileNumber }) {
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body: { email, mobileNumber },
  });
}

/**
 * Step 6: Refresh access token
 */
export function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  return request('/api/auth/refresh-token', {
    method: 'POST',
    body: { refreshToken },
  });
}

// ── Login with MPIN ───────────────────────────────────────
export function verifyMpinLogin(mobileNumber, mpin) {
  return request('/api/auth/login', {
    method: 'POST',
    body: { mobileNumber, mpin },
  });
}

// ── Reset Password ────────────────────────────────────────
export function resetPassword(token, newPassword) {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: { token, newPassword },
  });
}

// ── KYC APIs ──────────────────────────────────────────────
export function verifyPan({ panNumber, panCardImage }) {
  const formData = new FormData();
  if (panCardImage) formData.append('panCardImage', panCardImage);
  if (panNumber) formData.append('panNumber', panNumber);
  return requestFormData('/api/kyc/pan-verify', { method: 'POST', formData, auth: true });
}

export function verifyAadhaar({
  aadhaarNumber,
  aadhaarLast4,
  address,
  aadhaarFrontImage,
  aadhaarBackImage,
}) {
  const formData = new FormData();
  if (aadhaarFrontImage) formData.append('aadhaarFrontImage', aadhaarFrontImage);
  if (aadhaarBackImage) formData.append('aadhaarBackImage', aadhaarBackImage);
  if (aadhaarNumber) formData.append('aadhaarNumber', aadhaarNumber);
  if (aadhaarLast4) formData.append('aadhaarLast4', aadhaarLast4);
  if (address) formData.append('address', address);
  return requestFormData('/api/kyc/aadhaar-verify', { method: 'POST', formData, auth: true });
}

export function uploadSelfie(file) {
  const formData = new FormData();
  formData.append('selfiePhoto', file);
  return requestFormData('/api/kyc/upload-selfie', { method: 'POST', formData, auth: true });
}

export function getKycStatus() {
  return request('/api/kyc/status', { auth: true });
}

export function submitKyc(form) {
  const formData = new FormData();
  if (form.panCardImage) formData.append('panCardImage', form.panCardImage);
  if (form.aadhaarFrontImage) formData.append('aadhaarFrontImage', form.aadhaarFrontImage);
  if (form.aadhaarBackImage) formData.append('aadhaarBackImage', form.aadhaarBackImage);
  if (form.selfiePhoto) formData.append('selfiePhoto', form.selfiePhoto);
  if (form.bankPassbookOrStatement) formData.append('bankPassbookOrStatement', form.bankPassbookOrStatement);
  formData.append('panNumber', form.panNumber || '');
  formData.append('aadhaarLast4', form.aadhaarLast4 || '');
  formData.append('dateOfBirth', form.dateOfBirth || '');
  formData.append('address', form.address || '');
  return requestFormData('/api/kyc/submit', { method: 'POST', formData, auth: true });
}

// ── Bank APIs ─────────────────────────────────────────────
export function linkBank({
  accountHolderName,
  bankAccountNumber,
  confirmBankAccountNumber,
  bankIfscCode,
  bankName,
}) {
  return request('/api/bank/link', {
    method: 'POST',
    body: {
      accountHolderName,
      bankAccountNumber,
      confirmBankAccountNumber,
      bankIfscCode,
      bankName,
    },
    auth: true,
  });
}

export function activateAccount() {
  return request('/api/auth/activate', {
    method: 'POST',
    body: {},
    auth: true,
  });
}


export function getBankDetails() {
  return request('/api/bank/details', { auth: true });
}

// ── Investments APIs ─────────────────────────────────────────────
export function getActivePlans() {
  return request('/api/plans', { auth: true });
}

export function getActiveCoupons() {
  return request('/api/coupons', { auth: true });
}

export function validateCoupon({ investmentPlanId, investmentAmount, couponCode }) {
  return request('/api/coupons/validate', {
    method: 'POST',
    body: { investmentPlanId, investmentAmount, couponCode },
    auth: true,
  });
}

export function applyInvestment({ investmentPlanId, investmentAmount, couponCode }) {
  return request('/api/investments/apply', {
    method: 'POST',
    body: { investmentPlanId, investmentAmount, couponCode },
    auth: true,
  });
}

export function createRazorpayCheckoutOrder({ investmentPlanId, investmentAmount, couponCode }) {
  return request('/api/payments/razorpay/checkout-order', {
    method: 'POST',
    body: { investmentPlanId, investmentAmount, couponCode },
    auth: true,
  });
}

export function verifyRazorpayPayment({ investmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  return request('/api/payments/razorpay/verify', {
    method: 'POST',
    body: { investmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature },
    auth: true,
  });
}

export function uploadPaymentReceipt({ investmentId, receiptFile, paymentAmount, paymentDate, paymentMode, bankReference }) {
  const formData = new FormData();
  formData.append('receiptFile', receiptFile);
  formData.append('paymentAmount', paymentAmount);
  formData.append('paymentDate', paymentDate);
  formData.append('paymentMode', paymentMode);
  formData.append('bankReference', bankReference);
  return requestFormData(`/api/investments/${investmentId}/upload-receipt`, {
    method: 'POST',
    formData,
    auth: true,
  });
}

export function getOwnInvestments() {
  return request('/api/investments', { auth: true });
}

export function getInvestmentById(investmentId) {
  return request(`/api/investments/${investmentId}`, { auth: true });
}

export function cancelInvestment(investmentId, reason) {
  return request(`/api/investments/${investmentId}/cancel`, {
    method: 'POST',
    body: { reason },
    auth: true,
  });
}

// ── Wallet & Withdrawals ─────────────────────────────────────────
export function getWallet() {
  return request('/api/wallet', { auth: true });
}

export function getWalletTransactions() {
  return request('/api/wallet/transactions', { auth: true });
}

export function getWithdrawalSettings() {
  return request('/api/withdrawals/settings', { auth: true });
}

export function requestWithdrawal(requestedAmountOrPayload) {
  const payload =
    typeof requestedAmountOrPayload === 'object' && requestedAmountOrPayload !== null
      ? requestedAmountOrPayload
      : { requestedAmount: requestedAmountOrPayload };
  const amount = Number(payload.requestedAmount ?? payload.amount ?? payload.withdrawalAmount ?? 0);
  return request('/api/withdrawals/request', {
    method: 'POST',
    body: { requestedAmount: amount },
    auth: true,
  });
}

export function getOwnWithdrawals() {
  return request('/api/withdrawals', { auth: true });
}

// ── Dashboard, Referral, Notifications ───────────────────────────
export function getInvestorDashboard() {
  return request('/api/dashboard', { auth: true });
}

export async function updateProfileDetails(profile) {
  saveAuthData({
    name: profile.name,
    email: profile.email,
    mobileNumber: profile.phone,
    city: profile.city,
    bankName: profile.bankName,
    bankAccountNumber: profile.accountNumber,
    upiId: profile.upiId,
  });
  return { success: true, profile };
}

export function getUserProfile() {
  return getInvestorDashboard().then((response) => response?.profile || response?.data?.profile || {});
}

export function getReferralTree() {
  return request('/api/referrals/tree', { auth: true });
}

export function getReferralCommissions() {
  return request('/api/referrals/commissions', { auth: true });
}

export function getWalletTransactionProof(transactionId) {
  return request(`/api/wallet/transactions/${transactionId}/proof`, { auth: true });
}

export function getNotifications() {
  return request('/api/notifications', { auth: true });
}

export function getNotificationPreferences() {
  return request('/api/notifications/preferences', { auth: true });
}

export function updateNotificationPreferences(preferences) {
  return request('/api/notifications/preferences', {
    method: 'PUT',
    body: preferences,
    auth: true,
  });
}

export function getNotificationSummary() {
  return request('/api/notifications/summary', { auth: true });
}

export function markNotificationRead(notificationId) {
  return request(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
    auth: true,
  });
}

export function markAllNotificationsRead() {
  return request('/api/notifications/read-all', {
    method: 'POST',
    auth: true,
  });
}

export function deleteNotification(notificationId) {
  return request(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export function getInvestorStatements() {
  return request('/api/statements', { auth: true });
}

export function getSecuritySummary() {
  return request('/api/security/summary', { auth: true });
}

export function getSupportTickets() {
  return request('/api/support/tickets', { auth: true });
}

export function createSupportTicket(ticket) {
  return request('/api/support/tickets', {
    method: 'POST',
    body: ticket,
    auth: true,
  });
}

// ── Admin APIs (KYC, Plans, Investments, Withdrawals, Ops) ──────
// Example: Get pending KYC for admin
export function adminGetPendingKyc() {
  return request('/api/admin/kyc/pending', { auth: true });
}

export function adminGetKycDocuments(kycId) {
  return request(`/api/admin/kyc/${kycId}/documents`, { auth: true });
}

export function adminGetUserKycDocuments(userId) {
  return request(`/api/admin/kyc/user/${userId}/documents`, { auth: true });
}

export function adminApproveKyc(kycId, adminNotes) {
  return request(`/api/admin/kyc/${kycId}/approve`, {
    method: 'POST',
    body: { adminNotes },
    auth: true,
  });
}

export function adminRejectKyc(kycId, reason, adminNotes) {
  return request(`/api/admin/kyc/${kycId}/reject`, {
    method: 'POST',
    body: { reason, adminNotes },
    auth: true,
  });
}

export function adminRejectKycDocuments(kycId, reason, adminNotes, docFlags) {
  return request(`/api/admin/kyc/${kycId}/documents/reject`, {
    method: 'POST',
    body: { reason, adminNotes, ...docFlags },
    auth: true,
  });
}

export function adminGetAllPlans() {
  return request('/api/admin/plans', { auth: true });
}

export function adminCreatePlan(plan) {
  return request('/api/admin/plans', {
    method: 'POST',
    body: plan,
    auth: true,
  });
}

export function adminUpdatePlan(planId, plan) {
  return request(`/api/admin/plans/${planId}`, {
    method: 'PUT',
    body: plan,
    auth: true,
  });
}

export function adminDeactivatePlan(planId) {
  return request(`/api/admin/plans/${planId}/deactivate`, {
    method: 'POST',
    auth: true,
  });
}

export function adminGetPendingInvestments() {
  return request('/api/admin/investments/pending', { auth: true });
}

export function adminGetAllInvestments() {
  return request('/api/admin/investments', { auth: true });
}

export function adminVerifyReceipt(investmentId, approved, rejectionReason) {
  const body = approved ? { approved } : { approved, rejectionReason };
  return request(`/api/admin/investments/${investmentId}/verify-receipt`, {
    method: 'POST',
    body,
    auth: true,
  });
}

export function adminActivateInvestment(investmentId, notes) {
  return request(`/api/admin/investments/${investmentId}/activate`, {
    method: 'POST',
    body: { notes },
    auth: true,
  });
}

export function adminGetPendingWithdrawals() {
  return request('/api/admin/withdrawals/pending', { auth: true });
}

export function adminGetWithdrawalSettings() {
  return request('/api/admin/withdrawals/settings', { auth: true });
}

export function adminUpdateWithdrawalSettings(settings) {
  return request('/api/admin/withdrawals/settings', {
    method: 'PUT',
    body: settings,
    auth: true,
  });
}

export function adminApproveWithdrawal(withdrawalId, adminNotes) {
  return request(`/api/admin/withdrawals/${withdrawalId}/approve`, {
    method: 'POST',
    body: { adminNotes },
    auth: true,
  });
}

export function adminProcessWithdrawal(withdrawalId, bankTransferReference, adminNotes) {
  return request(`/api/admin/withdrawals/${withdrawalId}/process`, {
    method: 'POST',
    body: { bankTransferReference, adminNotes },
    auth: true,
  });
}

export function adminRejectWithdrawal(withdrawalId, reason, adminNotes) {
  return request(`/api/admin/withdrawals/${withdrawalId}/reject`, {
    method: 'POST',
    body: { reason, adminNotes },
    auth: true,
  });
}

export function adminGetDashboard() {
  return request('/api/admin/dashboard', { auth: true });
}

export function adminGetReferralReport() {
  return request('/api/admin/referrals/report', { auth: true });
}

export function adminGetReferralCommissions() {
  return request('/api/admin/referrals/commissions', { auth: true });
}

export function adminReleaseReferralCommission(commissionId) {
  return request(`/api/admin/referrals/commissions/${commissionId}/release`, {
    method: 'POST',
    auth: true,
  });
}

export function adminGetReferralPreview(investmentId) {
  return request(`/api/admin/referrals/preview?investmentId=${encodeURIComponent(investmentId)}`, { auth: true });
}

export function adminSimulateReferralPayout(payload) {
  return request('/api/admin/referrals/simulate', {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

export function adminAdjustWallet(payload) {
  return request('/api/admin/wallet/adjust', {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

export function adminGetUser360(userId) {
  return request(`/api/admin/users/${userId}/360`, { auth: true });
}

export function adminGetFraudRules() {
  return request('/api/admin/fraud/rules', { auth: true });
}

export function adminGetSupportTickets() {
  return request('/api/admin/support/tickets', { auth: true });
}

export function adminRespondSupportTicket(ticketId, payload) {
  return request(`/api/admin/support/tickets/${ticketId}/respond`, {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

export function adminGetCoupons() {
  return request('/api/admin/coupons', { auth: true });
}

export function adminCreateCoupon(coupon) {
  return request('/api/admin/coupons', {
    method: 'POST',
    body: coupon,
    auth: true,
  });
}

export function adminUpdateCoupon(couponId, coupon) {
  return request(`/api/admin/coupons/${couponId}`, {
    method: 'PUT',
    body: coupon,
    auth: true,
  });
}

export function adminGetLegalDocuments() {
  return request('/api/admin/legal', { auth: true });
}

export function adminUpdateLegalDocument(documentKey, document) {
  return request(`/api/admin/legal/${documentKey}`, {
    method: 'PUT',
    body: document,
    auth: true,
  });
}

export function adminGetReferralSettings() {
  return request('/api/admin/referrals/settings', { auth: true });
}

export function adminUpdateReferralSettings(settings) {
  return request('/api/admin/referrals/settings', {
    method: 'PUT',
    body: settings,
    auth: true,
  });
}

export function adminGetUsers() {
  return request('/api/admin/users', { auth: true });
}

export function adminUpdateUser(userId, userData) {
  return request(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: userData,
    auth: true,
  });
}

/**
 * Fetch a specific user's bank details
 */
export function adminGetUserBankDetails(userId) {
  // Try the most likely backend route. If it doesn't exist, we'll handle the error in the UI.
  return request(`/api/admin/users/${userId}/bank`, { auth: true }).catch(() => null);
}

export function adminSuspendUser(userId, reason) {
  return request(`/api/admin/users/${userId}/suspend`, {
    method: 'POST',
    body: { reason },
    auth: true,
  });
}

export function adminGetFraudAlerts() {
  return request('/api/admin/fraud-alerts', { auth: true });
}

export function adminResolveFraudAlert(alertId, resolutionNotes, status) {
  return request(`/api/admin/fraud-alerts/${alertId}/resolve`, {
    method: 'POST',
    body: { resolutionNotes, status },
    auth: true,
  });
}

export function adminGetAuditLogs(query) {
  const url = query ? `/api/admin/audit-logs?query=${encodeURIComponent(query)}` : '/api/admin/audit-logs';
  return request(url, { auth: true });
}

export function adminGetMonthlyReport() {
  return request('/api/admin/reports/monthly', { auth: true });
}

export function adminGetInterestRates() {
  return request('/api/admin/interest/rates', { auth: true });
}

export function adminUpdateInterestRate(planId, monthlyInterestRate) {
  return request(`/api/admin/interest/rates?planId=${planId}`, {
    method: 'PUT',
    body: { monthlyInterestRate },
    auth: true,
  });
}

export function adminTriggerMonthlyInterestRun() {
  return request('/api/admin/interest/trigger', {
    method: 'POST',
    auth: true,
  });
}

// ── System APIs ─────────────────────────────────────────
export function healthCheck() {
  return request('/actuator/health');
}

export function getSwaggerUi() {
  return request('/swagger-ui.html');
}

export function getOpenApiJson() {
  return request('/v3/api-docs');
}
