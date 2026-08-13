const STORAGE_KEY = 'anusha-onboarding-draft';

export function getOnboardingDraft() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

export function saveOnboardingDraft(patch) {
  const current = getOnboardingDraft();
  const next = { ...current, ...patch };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearOnboardingDraft() {
  window.localStorage.removeItem(STORAGE_KEY);
}
