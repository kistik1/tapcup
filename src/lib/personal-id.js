const STORAGE_KEY = "tapcup_last_personal_id";

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function getSavedPersonalId() {
  const storage = getStorage();
  if (!storage) return null;
  return storage.getItem(STORAGE_KEY);
}

export function setSavedPersonalId(personalId) {
  const storage = getStorage();
  if (!storage || !personalId) return;
  storage.setItem(STORAGE_KEY, personalId);
}

export function clearSavedPersonalId() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
}
