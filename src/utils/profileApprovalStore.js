import { getUserId } from '../services/api';

const PROFILE_STORE_KEY = 'anusha-user-profile-by-id';
const PROFILE_REQUESTS_KEY = 'anusha-profile-update-requests';

function parseJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (_) {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getCurrentUserId() {
  return getUserId() || 'guest-user';
}

export function getApprovedProfileForCurrentUser() {
  const allProfiles = parseJson(PROFILE_STORE_KEY, {});
  return allProfiles[getCurrentUserId()] || {};
}

export function saveApprovedProfileForCurrentUser(profilePatch) {
  const userId = getCurrentUserId();
  const allProfiles = parseJson(PROFILE_STORE_KEY, {});
  allProfiles[userId] = {
    ...(allProfiles[userId] || {}),
    ...profilePatch,
  };
  saveJson(PROFILE_STORE_KEY, allProfiles);
}

export function getProfileRequests() {
  return parseJson(PROFILE_REQUESTS_KEY, []);
}

export function getPendingProfileRequestForCurrentUser() {
  const userId = getCurrentUserId();
  return getProfileRequests().find((request) => request.userId === userId && request.status === 'Pending');
}

export function submitProfileUpdateRequest(payload) {
  const userId = getCurrentUserId();
  const requests = getProfileRequests().filter((request) => !(request.userId === userId && request.status === 'Pending'));
  const requestItem = {
    id: `PRF-${Date.now()}`,
    userId,
    userName: payload.name || '',
    email: payload.email || '',
    submittedOn: new Date().toLocaleString(),
    status: 'Pending',
    updates: payload,
  };
  requests.unshift(requestItem);
  saveJson(PROFILE_REQUESTS_KEY, requests);
  return requestItem;
}

export function decideProfileUpdateRequest(requestId, decision) {
  const requests = getProfileRequests();
  const target = requests.find((request) => request.id === requestId);
  if (!target) return null;

  target.status = decision;
  target.reviewedOn = new Date().toLocaleString();

  if (decision === 'Approved') {
    const allProfiles = parseJson(PROFILE_STORE_KEY, {});
    
    // Strip out heavy base64 file arrays to avoid QuotaExceededError in localStorage
    const { 
      panProofFileData, 
      addressProofFileData, 
      panProofFiles, 
      addressProofFiles, 
      ...updatesWithoutFiles 
    } = target.updates;

    allProfiles[target.userId] = {
      ...(allProfiles[target.userId] || {}),
      ...updatesWithoutFiles,
      kycStatus: 'Verified',
    };
    saveJson(PROFILE_STORE_KEY, allProfiles);
  }

  // We will keep the files in the request store so the admin can view them even after approval/rejection.
  // The storage quota issue will be addressed by compressing the images on the frontend before upload.

  saveJson(PROFILE_REQUESTS_KEY, requests);
  return target;
}
