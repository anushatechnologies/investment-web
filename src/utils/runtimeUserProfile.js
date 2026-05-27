import {
  getAccessToken,
  getAuthRole,
  getUserEmail,
  getUserId,
  getUserName,
  getUserPhone,
  getUserCity,
  getJoinedAt,
  getSavedBankName,
  getSavedBankAccount,
  getSavedUpiId,
} from '../services/api';
import { getApprovedProfileForCurrentUser, getPendingProfileRequestForCurrentUser } from './profileApprovalStore';

function toInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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

export function getRuntimeUserProfile() {
  const tokenPayload = parseJwtPayload(getAccessToken());
  const fallbackEmail = getUserEmail() || tokenPayload?.email || tokenPayload?.upn || '';
  const approvedProfile = getApprovedProfileForCurrentUser();
  const name =
    approvedProfile.name ||
    getUserName() ||
    tokenPayload?.fullName ||
    tokenPayload?.full_name ||
    tokenPayload?.name ||
    tokenPayload?.username ||
    deriveNameFromEmail(fallbackEmail) ||
    'User';
  const email = fallbackEmail;
  const userId = getUserId();
  const role = getAuthRole();

  const pendingRequest = getPendingProfileRequestForCurrentUser();

  return {
    ...approvedProfile,
    name,
    email,
    investorId: userId ? (String(userId).startsWith('UID') ? userId : `UID-${userId}`) : '',
    membership: role === 'admin' ? 'Administrator' : 'Investor',
    avatar: toInitials(name),
    kycStatus: pendingRequest ? 'Pending' : approvedProfile.kycStatus,
    phone: approvedProfile.phone || getUserPhone() || '',
    city: approvedProfile.city || getUserCity() || '',
    address: approvedProfile.address || '',
    joinDate: approvedProfile.joinDate || getJoinedAt() || '',
    bankName: approvedProfile.bankName || getSavedBankName() || '',
    accountNumber: approvedProfile.accountNumber || getSavedBankAccount() || '',
    upiId: approvedProfile.upiId || getSavedUpiId() || '',
    referralCode: approvedProfile.referralCode || tokenPayload?.referralCode || `${name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '')}${(userId || '0000').slice(-4).toUpperCase()}`,
  };
}
