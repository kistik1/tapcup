const DRAFT_KEY_PREFIX = "tapcup_pref_draft";

function draftKey(profileId, prefId) {
  return `${DRAFT_KEY_PREFIX}:${profileId}:${prefId || "new"}`;
}

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function savePreferenceDraft(profileId, prefId, state) {
  const storage = getStorage();
  if (!storage || !profileId) return;
  try {
    storage.setItem(draftKey(profileId, prefId), JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function loadPreferenceDraft(profileId, prefId) {
  const storage = getStorage();
  if (!storage || !profileId) return null;
  try {
    const raw = storage.getItem(draftKey(profileId, prefId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPreferenceDraft(profileId, prefId) {
  const storage = getStorage();
  if (!storage || !profileId) return;
  storage.removeItem(draftKey(profileId, prefId));
}
