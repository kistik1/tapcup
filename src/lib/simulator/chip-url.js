const DEFAULT_CHIP_ORIGIN = "https://tap-cup.base44.app";
const DEFAULT_CHIP_PATH = "/consumer";
const PERSONAL_ID_KEY = "personal_id";
const PERSONAL_ID_STORAGE_KEY = "tapcup_last_personal_id";

function trimValue(value) {
  return `${value || ""}`.trim();
}

export function normalizeSimulatorChipPayload(value) {
  const raw = trimValue(value);

  if (!raw) {
    return {
      raw: "",
      canonicalUrl: "",
      personalId: "",
      isCanonicalUrl: false,
    };
  }

  try {
    const url = new URL(raw);
    const personalId = url.searchParams.get(PERSONAL_ID_KEY)?.trim() || "";
    if (personalId) {
      return {
        raw,
        canonicalUrl: url.toString(),
        personalId,
        isCanonicalUrl: true,
      };
    }
  } catch {
    // Fall through to the legacy personal-id-only format.
  }

  const personalId = raw;

  return {
    raw,
    canonicalUrl: `${DEFAULT_CHIP_ORIGIN}${DEFAULT_CHIP_PATH}?${PERSONAL_ID_KEY}=${encodeURIComponent(personalId)}`,
    personalId,
    isCanonicalUrl: false,
  };
}

export function getPersonalIdFromChipPayload(value) {
  return normalizeSimulatorChipPayload(value).personalId;
}

export function getSimulatorConsumerRoute(personalId) {
  return `/consumer?${PERSONAL_ID_KEY}=${encodeURIComponent(trimValue(personalId))}`;
}

export function clearSimulatorBrowserState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PERSONAL_ID_STORAGE_KEY);
  window.sessionStorage.removeItem(PERSONAL_ID_STORAGE_KEY);
}
