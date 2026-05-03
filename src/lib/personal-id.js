export const CANONICAL_APP_BASE_URL = "https://tap-cup.base44.app";

const STORAGE_KEY = "tapcup_last_personal_id";
const ROLE_STORAGE_KEY = "tapcup_last_role";
const PAGE_STORAGE_KEY = "tapcup_last_page";
const VALID_ROLES = new Set(["consumer", "shop", "admin"]);

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function trimValue(value) {
  return `${value || ""}`.trim();
}

export function getSavedPersonalId() {
  const storage = getStorage();
  if (!storage) return null;
  return storage.getItem(STORAGE_KEY);
}

export function setSavedPersonalId(personalId) {
  const storage = getStorage();
  const value = trimValue(personalId);
  if (!storage || !value) return;
  storage.setItem(STORAGE_KEY, value);
}

export function clearSavedPersonalId() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
}

export function getCachedRoleContext() {
  const storage = getStorage();
  if (!storage) return { role: "consumer", page: "/consumer" };

  const role = storage.getItem(ROLE_STORAGE_KEY);
  const page = storage.getItem(PAGE_STORAGE_KEY);

  if (!VALID_ROLES.has(role)) {
    return { role: "consumer", page: "/consumer" };
  }

  return {
    role,
    page: page || `/${role}`,
  };
}

export function setCachedRoleContext(role, page = `/${role}`) {
  const storage = getStorage();
  if (!storage || !VALID_ROLES.has(role)) return;
  storage.setItem(ROLE_STORAGE_KEY, role);
  storage.setItem(PAGE_STORAGE_KEY, page || `/${role}`);
}

export function clearCachedRoleContext() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(ROLE_STORAGE_KEY);
  storage.removeItem(PAGE_STORAGE_KEY);
}

export function buildCanonicalChipUrl(personalId, path = "/consumer") {
  const value = trimValue(personalId);
  const routePath = path && path.startsWith("/") ? path : "/consumer";
  const url = new URL(routePath, CANONICAL_APP_BASE_URL);
  if (value) {
    url.searchParams.set("personal_id", value);
  }
  return url.toString();
}

export function getRouteForPersonalId(personalId, role = getCachedRoleContext().role) {
  const value = encodeURIComponent(trimValue(personalId));
  const targetRole = VALID_ROLES.has(role) ? role : "consumer";

  if (targetRole === "shop") return `/shop?personal_id=${value}`;
  if (targetRole === "admin") return `/admin?personal_id=${value}`;
  return `/consumer?personal_id=${value}`;
}

export function generatePersonalId(prefix = "NFC") {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}
