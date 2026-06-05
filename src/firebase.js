import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const isOtpTestMode = import.meta.env.VITE_FIREBASE_OTP_TEST_MODE === 'true';

const defaultFirebaseConfig = {
  apiKey: 'AIzaSyBa1Arilraettuqi_8IA0v4Qae0mwrkYjQ',
  authDomain: 'anushabazaar-2288e.firebaseapp.com',
  databaseURL: 'https://anushabazaar-2288e-default-rtdb.firebaseio.com',
  projectId: 'anushabazaar-2288e',
  storageBucket: 'anushabazaar-2288e.firebasestorage.app',
  messagingSenderId: '64875938387',
  appId: '1:64875938387:web:0654cd73f58b6408ba7ca6',
  measurementId: 'G-9S05BL12HY',
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || defaultFirebaseConfig.databaseURL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || defaultFirebaseConfig.measurementId,
};

// Check if Firebase keys are real (not placeholders)
const hasRealKeys = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_');

let app = null;
let auth = null;

if (hasRealKeys) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth.useDeviceLanguage();

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (isLocalhost && isOtpTestMode) {
    auth.settings.appVerificationDisabledForTesting = true;
  }
} else {
  console.warn('[Firebase] Skipped initialization — API keys are placeholders. OTP test mode is active.');
}

function getMissingFirebaseKeys() {
  if (isOtpTestMode && !hasRealKeys) return []; // Don't report missing keys in test mode
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
  ];
  const configuredValues = {
    VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
    VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
    VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
    VITE_FIREBASE_APP_ID: firebaseConfig.appId,
    VITE_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  };
  return required.filter((k) => !configuredValues[k] || configuredValues[k].startsWith('YOUR_'));
}

export function getFirebaseOtpPreflightError() {
  if (isOtpTestMode && !hasRealKeys) {
    return ''; // No error in test mode without real keys
  }

  const missingKeys = getMissingFirebaseKeys();
  if (missingKeys.length) {
    return `Missing Firebase env config: ${missingKeys.join(', ')}`;
  }

  const host = window.location.hostname;
  const protocol = window.location.protocol;
  const isLocalhostHost = host === 'localhost' || host === '127.0.0.1';

  if (protocol !== 'https:' && !isLocalhostHost) {
    return 'OTP requires HTTPS. Open this app on an HTTPS domain or localhost.';
  }

  return '';
}

export function getReadableFirebaseOtpError(err) {
  const code = err?.code || '';
  const msg = err?.message || '';

  if (code === 'auth/invalid-app-credential' || msg.includes('auth/invalid-app-credential')) {
    return 'OTP setup failed: add this domain in Firebase Auth > Settings > Authorized domains and verify API key restrictions allow identitytoolkit.googleapis.com.';
  }
  if (code === 'auth/captcha-check-failed') {
    if (msg.includes('MALFORMED') || msg.includes('malformed')) {
      return 'reCAPTCHA check is malformed. If OTP test mode is enabled, use only Firebase test phone numbers; otherwise disable test mode and retry.';
    }
    return 'reCAPTCHA verification failed. Please refresh and try again.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many OTP attempts. Please wait a few minutes and retry.';
  }
  if (code === 'auth/invalid-phone-number') {
    return 'Invalid mobile number format. Please check and try again.';
  }
  if (code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' || code.includes('api-key-not-valid')) {
    return 'Firebase API key is not configured. Use email/password login or set up Firebase credentials.';
  }
  return '';
}

/**
 * Sets up an invisible reCAPTCHA verifier on the fixed container element.
 * Call once before sending OTP.
 */
export async function setupRecaptcha() {
  if (!auth) throw new Error('Firebase is not initialized. Configure Firebase API keys or use email/password login.');
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, signInWithPhoneNumber proceeds.
      },
    });
    await window.recaptchaVerifier.render();
  }
  return window.recaptchaVerifier;
}

/**
 * Clears reCAPTCHA verifier and container so next attempt can recreate it safely.
 */
export function resetRecaptcha() {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (_) {
      // no-op
    }
    window.recaptchaVerifier = null;
  }
  const container = document.getElementById('recaptcha-container');
  if (container) container.innerHTML = '';
}

/**
 * Sends OTP via Firebase Phone Auth.
 */
export async function firebaseSendOtp(phoneNumber) {
  if (!auth) throw new Error('Firebase is not initialized. Use email/password login in test mode.');
  const appVerifier = window.recaptchaVerifier || (await setupRecaptcha());
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  window.confirmationResult = confirmationResult;
  return confirmationResult;
}

/**
 * Verifies OTP entered by the user.
 */
export async function firebaseVerifyOtp(otpCode) {
  const confirmationResult = window.confirmationResult;
  if (!confirmationResult) {
    throw new Error('No OTP session found. Please resend OTP.');
  }
  return confirmationResult.confirm(otpCode);
}

/**
 * Gets Firebase ID token from current user.
 */
export async function getFirebaseIdToken() {
  if (!auth) throw new Error('Firebase is not initialized.');
  const user = auth.currentUser;
  if (!user) throw new Error('No Firebase user signed in.');
  return user.getIdToken(true);
}

export { app, auth };
