# Investor App KYC + Onboarding Handoff

This document explains the recent KYC/onboarding implementation for the investor app frontend team.

## What Changed

The investor app now supports KYC upload and reupload after login. MPIN creation is no longer treated as full onboarding completion by itself. The frontend should always route investors from the backend onboarding state instead of assuming that MPIN means dashboard access.

Key behavior now supported:

1. Investor can log in before KYC is complete.
2. Investor can upload initial KYC documents after login.
3. Investor can reupload only rejected/requested KYC documents after admin review.
4. Approved KYC is locked from accidental re-submission.
5. MPIN can exist while KYC is still incomplete, but dashboard remains locked until KYC, bank, account activation, and MPIN are all complete.

## Backend Endpoints Used By Investor Frontend

### 1. Login

Endpoint:

```http
POST /api/auth/login
```

Email/password body:

```json
{
  "email": "investor@example.com",
  "password": "Investor@123"
}
```

Mobile/MPIN body:

```json
{
  "mobileNumber": "9876543210",
  "mpin": "2468"
}
```

Important response fields:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "role": "INVESTOR",
  "userId": "...",
  "kycStatus": "NOT_SUBMITTED",
  "accountStatus": "PENDING",
  "onboardingStatus": "PASSWORD_CREATED",
  "bankVerified": false,
  "mpinCreated": false,
  "nextStep": "COMPLETE_KYC"
}
```

Frontend requirement:

Store all onboarding fields from login. Do not only store tokens.

### 2. Get Current KYC Status

Endpoint:

```http
GET /api/kyc/status
Authorization: Bearer <accessToken>
```

Response shape:

```json
{
  "kycStatus": "REUPLOAD_REQUIRED",
  "onboardingStatus": "KYC_PENDING",
  "accountStatus": "PENDING",
  "bankVerified": false,
  "mpinCreated": true,
  "canUpload": true,
  "profile": {
    "panNumber": "ABCDE1234F",
    "aadhaarLast4": "1234",
    "dateOfBirth": "1995-01-20",
    "address": "User address"
  },
  "submission": {
    "id": "kyc-id",
    "userId": "user-id",
    "status": "REUPLOAD_REQUIRED",
    "panCardPath": "kyc/file.png",
    "panCardStatus": "APPROVED",
    "aadhaarFrontPath": "kyc/file.png",
    "aadhaarFrontStatus": "REUPLOAD_REQUIRED",
    "aadhaarFrontRejectionReason": "Image is blurry",
    "aadhaarBackStatus": "APPROVED",
    "selfieStatus": "APPROVED",
    "bankProofStatus": "APPROVED",
    "rejectionReason": "Image is blurry",
    "adminNotes": "Upload a clearer Aadhaar front"
  }
}
```

Frontend requirement:

Use `profile` to prefill PAN, Aadhaar last 4, date of birth, and address. Use `canUpload` to enable or disable the KYC form.

### 3. Submit Initial KYC Or Reupload

Endpoint:

```http
POST /api/kyc/submit
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

Multipart fields:

```text
panNumber
aadhaarLast4
dateOfBirth
address
panCardImage
aadhaarFrontImage
aadhaarBackImage
selfiePhoto
bankPassbookOrStatement
```

Rules:

1. Initial KYC requires all five files.
2. Reupload requires only files that are missing, `REJECTED`, or `REUPLOAD_REQUIRED`.
3. Reupload must contain at least one new file.
4. Approved KYC returns `canUpload: false`; the frontend should disable the form.

### 4. Account Activation

Endpoint:

```http
POST /api/auth/activate
Authorization: Bearer <accessToken>
```

Frontend requirement:

Save the full response and route using the same onboarding resolver. Do not hard-code `/setup-mpin`.

### 5. Set MPIN

Endpoint:

```http
POST /api/auth/set-mpin
Authorization: Bearer <accessToken>
```

Body:

```json
{
  "mpin": "2468"
}
```

Important behavior:

MPIN creation does not automatically mean the account is ready for dashboard. If KYC or bank/account activation is still incomplete, backend returns an onboarding state that should route the user back to the correct pending step.

Frontend requirement:

Save the full response and route using the onboarding resolver. Do not hard-code `/dashboard`.

## Status Values

KYC status values:

```text
NOT_SUBMITTED
PENDING
APPROVED
REJECTED
REUPLOAD_REQUIRED
```

Document status values:

```text
NOT_UPLOADED
PENDING
APPROVED
REJECTED
REUPLOAD_REQUIRED
```

Account status values:

```text
PENDING
ACTIVE
SUSPENDED
DEACTIVATED
```

Important status mapping:

`REJECTED` and `REUPLOAD_REQUIRED` must both show a reupload action.

## Frontend Routing Rules

Use this routing order after login, after status refresh, after KYC submit, after account activation, and after MPIN setup:

1. If `kycStatus` is missing or `NOT_SUBMITTED`, route to `/kyc`.
2. If `kycStatus` is `PENDING`, route to `/kyc/status`.
3. If `kycStatus` is `REUPLOAD_REQUIRED` or `REJECTED`, route to `/kyc`.
4. If `kycStatus` is `APPROVED` and `bankVerified` is false, route to `/bank/link`.
5. If `kycStatus` is `APPROVED`, `bankVerified` is true, and `accountStatus` is not `ACTIVE`, route to `/account/activate`.
6. If account is active and `mpinCreated` is false, route to `/setup-mpin`.
7. Only route to `/dashboard` when account is active, KYC is approved, bank is verified, and MPIN is created.

Existing implementation:

```text
src/utils/onboardingRouter.js
```

## Investor UI Requirements

### KYC Page

Existing implementation:

```text
src/pages/KycPage.jsx
```

Required behavior:

1. Fetch `/api/kyc/status` on page load.
2. Prefill profile fields from `response.profile`.
3. Show current overall KYC status.
4. Show document-level status and rejection reason.
5. On initial submit, require all five files.
6. On reupload, require only missing, `REJECTED`, or `REUPLOAD_REQUIRED` files.
7. Disable the form when `canUpload` is false.
8. After submit, save `kycStatus: PENDING` and route to `/kyc/status`.

### KYC Status Page

Existing implementation:

```text
src/pages/KycStatusPage.jsx
```

Required behavior:

1. Poll `/api/kyc/status`.
2. Save the full onboarding status from the response.
3. Show document-level statuses.
4. Show reupload button for `REJECTED` or `REUPLOAD_REQUIRED`.
5. Show bank linking CTA when KYC is `APPROVED`.

### Sidebar / Onboarding Card

Existing implementation:

```text
src/components/Sidebar.jsx
```

Required behavior:

1. Show `KYC Documents` link while user is logged in.
2. Treat `NOT_SUBMITTED`, `REJECTED`, and `REUPLOAD_REQUIRED` as actionable KYC states.
3. Treat `PENDING` as in review.
4. Do not unlock dashboard navigation until full onboarding is complete.

### Dashboard

Existing implementation:

```text
src/pages/Dashboard.jsx
```

Required behavior:

Show KYC as:

```text
APPROVED -> Approved
PENDING -> In Review
REUPLOAD_REQUIRED / REJECTED -> Reupload Requested
NOT_SUBMITTED -> Pending Upload
```

## Backend Files Changed

Backend implementation is mainly in:

```text
investment/src/main/java/com/anushabazaar/backend/service/AuthService.java
investment/src/main/java/com/anushabazaar/backend/service/PlatformService.java
investment/src/main/java/com/anushabazaar/backend/controller/KycController.java
```

Important backend behavior:

1. Password login and MPIN login both return onboarding state.
2. `setMpin` sets onboarding status to `ACTIVE` only when KYC is approved, bank is verified, and account status is active.
3. `getOwnKycStatus` returns `canUpload`, `profile`, and onboarding flags.
4. Rejected documents are treated as required reupload documents.

## Frontend Files Changed

Frontend implementation is mainly in:

```text
investment-web/src/pages/KycPage.jsx
investment-web/src/pages/KycStatusPage.jsx
investment-web/src/components/Sidebar.jsx
investment-web/src/pages/Dashboard.jsx
investment-web/src/pages/SetupMpinPage.jsx
investment-web/src/pages/AccountActivatePage.jsx
investment-web/src/utils/onboardingRouter.js
```

## QA Checklist

Test these flows in the investor app:

1. New investor logs in after registration and lands on `/kyc`.
2. Investor uploads all KYC documents and lands on `/kyc/status`.
3. Admin approves KYC, investor refreshes status and sees bank linking CTA.
4. Admin rejects full KYC, investor sees reupload action.
5. Admin marks one document as reupload required, investor is required to upload only that document.
6. Investor creates MPIN before KYC is complete and is still routed back to KYC/status instead of dashboard.
7. Dashboard opens only after KYC approved, bank verified, account active, and MPIN created.
8. Approved KYC form is disabled and cannot be submitted accidentally.

## Common Mistakes To Avoid

1. Do not use `mpinCreated` alone to unlock dashboard.
2. Do not treat `REJECTED` as terminal; it should allow reupload.
3. Do not require all documents on reupload when only one document was requested.
4. Do not hard-code redirects after `/api/auth/set-mpin` or `/api/auth/activate`.
5. Do not ignore `/api/kyc/status.profile`; use it to prefill the KYC form.
