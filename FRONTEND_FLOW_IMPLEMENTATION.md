# AnushaTrade Frontend Flow (API-Aligned)

## Base configuration
- API base URL: `https://api.anusgatrade.com` (or switch to `https://api.anushatrade.com` if that is the deployed host).
- Auth header: `Authorization: Bearer <accessToken>`.
- Access token refresh: `POST /api/auth/refresh-token` on `401`.

## Auth journey
1. `POST /api/auth/send-otp` with `mobileNumber`, `countryCode`, `channel`.
2. `POST /api/auth/verify-otp`:
   - Firebase path: `{ idToken }`.
   - Non-Firebase path: `{ mobileNumber, otp }`.
3. `POST /api/auth/register` with `signupVerificationToken` and profile + consent fields.
4. Login:
   - Password: `POST /api/auth/login` with `{ email, password }`.
   - MPIN: `POST /api/auth/login` with `{ mobileNumber, mpin }`.

## Onboarding route resolver
Use these fields from login/status APIs:
- `kycStatus`
- `bankVerified`
- `accountStatus`
- `mpinCreated`
- `onboardingStatus`

Route decision:
- `NOT_SUBMITTED` => `/kyc`
- `PENDING` => `/kyc/status`
- `APPROVED && !bankVerified` => `/bank/link`
- `APPROVED && bankVerified && accountStatus !== ACTIVE` => `/account/activate`
- `APPROVED && bankVerified && accountStatus === ACTIVE && !mpinCreated` => `/setup-mpin`
- Active => `/dashboard`

## Implemented in this repo
- API layer updates in `src/services/api.js`:
  - MPIN login aligned to `POST /api/auth/login`.
  - OTP send includes `channel`.
  - OTP verify supports payload object or Firebase token string.
  - Register supports both legacy and current payload shapes.
  - Bank linking payload aligned to backend fields.
  - Added `activateAccount()` API helper.
- Onboarding route utility: `src/utils/onboardingRouter.js`.
- Login redirect now follows onboarding status matrix: `src/pages/LoginPage.jsx`.
- Added onboarding routes:
  - `/dashboard`
  - `/kyc`
  - `/kyc/status`
  - `/bank/link`
  - `/account/activate`
  - `/setup-mpin`
  in `src/App.jsx`.

## Remaining recommended build-out
1. Replace onboarding placeholder pages with real forms and API integration for:
   - KYC submit/status polling
   - Bank linking
   - Account activation
   - MPIN setup
2. Add a startup bootstrap endpoint strategy (profile/session fetch after token restore).
3. Add masking utilities for PAN and bank account data in all UI tables/cards.
4. Add MPIN verification modal before high-risk actions (withdrawal requests, bank edits).
