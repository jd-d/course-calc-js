import { MAX_MANUAL_LESSON_PRICE_OPTIONS, formatFixed, parseNumber } from "./utils.js";

const PERSISTENCE_SCHEMA_VERSION = "2";
const LEGACY_PERSISTENCE_ENABLED_KEY = "course-pricing-save-enabled";
const LEGACY_PERSISTENCE_VALUES_KEY = "course-pricing-saved-inputs";
const PERSISTENCE_ENABLED_KEY = `${LEGACY_PERSISTENCE_ENABLED_KEY}-v${PERSISTENCE_SCHEMA_VERSION}`;
const PERSISTENCE_VALUES_KEY = `${LEGACY_PERSISTENCE_VALUES_KEY}-v${PERSISTENCE_SCHEMA_VERSION}`;
const PERSISTENCE_SCHEMA_META_KEY = "__persistenceSchemaVersion";
const DATA_PORTABILITY_FORMAT = "course-pricing-calculator";
export const DATA_PORTABILITY_VERSION = "1.0.0";
export const PERSISTENCE_KEY_V2 = PERSISTENCE_VALUES_KEY;

function normalizeLessonCostPersistedValue(value) {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (Array.isArray(value)) {
    const normalizedValues = value
      .map((entry) => parseNumber(entry, null))
      .filter((entry) => entry !== null && entry >= 0)
      .slice(0, MAX_MANUAL_LESSON_PRICE_OPTIONS)
      .map((entry) => formatFixed(entry, 2));
    return normalizedValues.join(", ");
  }
  return "";
}

export function normalizePersistedInputValues(values, options = {}) {
  const {
    desiredIncomeFieldKeys = [],
    persistedControlsPanelCollapsedKey,
    persistedAcceptableIncomeMinKey,
    persistedAcceptableIncomeMaxKey,
  } = options;

  if (!values || typeof values !== "object") {
    return null;
  }

  const normalized = { ...values };
  normalized[PERSISTENCE_SCHEMA_META_KEY] = PERSISTENCE_SCHEMA_VERSION;

  if (persistedControlsPanelCollapsedKey && Object.prototype.hasOwnProperty.call(normalized, persistedControlsPanelCollapsedKey)) {
    normalized[persistedControlsPanelCollapsedKey] = Boolean(normalized[persistedControlsPanelCollapsedKey]);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "lesson-cost")) {
    normalized["lesson-cost"] = normalizeLessonCostPersistedValue(normalized["lesson-cost"]);
  }

  desiredIncomeFieldKeys.forEach((key) => {
    const netKey = `__desiredIncomeNet_${key}`;
    if (normalized[netKey] === null || typeof normalized[netKey] === "undefined") {
      normalized[netKey] = null;
      return;
    }
    const parsed = Number(normalized[netKey]);
    normalized[netKey] = Number.isFinite(parsed) ? Math.max(parsed, 0) : null;
  });

  if (persistedAcceptableIncomeMinKey && Object.prototype.hasOwnProperty.call(normalized, persistedAcceptableIncomeMinKey)) {
    const value = normalized[persistedAcceptableIncomeMinKey];
    if (value === null || typeof value === "undefined") {
      normalized[persistedAcceptableIncomeMinKey] = null;
    } else {
      const acceptableMin = Number(value);
      normalized[persistedAcceptableIncomeMinKey] = Number.isFinite(acceptableMin) ? Math.max(acceptableMin, 0) : null;
    }
  }

  if (persistedAcceptableIncomeMaxKey && Object.prototype.hasOwnProperty.call(normalized, persistedAcceptableIncomeMaxKey)) {
    const value = normalized[persistedAcceptableIncomeMaxKey];
    if (value === null || typeof value === "undefined") {
      normalized[persistedAcceptableIncomeMaxKey] = null;
    } else {
      const acceptableMax = Number(value);
      normalized[persistedAcceptableIncomeMaxKey] = Number.isFinite(acceptableMax) ? Math.max(acceptableMax, 0) : null;
    }
  }

  return normalized;
}

export function migrateLegacyPersistenceIfNeeded(options = {}) {
  const { normalizeOptions } = options;
  try {
    const hasVersionedEnabled = localStorage.getItem(PERSISTENCE_ENABLED_KEY);
    const hasVersionedValues = localStorage.getItem(PERSISTENCE_VALUES_KEY);
    if (hasVersionedEnabled !== null || hasVersionedValues !== null) {
      return;
    }

    const legacyEnabled = localStorage.getItem(LEGACY_PERSISTENCE_ENABLED_KEY);
    const legacyValuesRaw = localStorage.getItem(LEGACY_PERSISTENCE_VALUES_KEY);

    if (legacyValuesRaw) {
      try {
        const parsedLegacyValues = JSON.parse(legacyValuesRaw);
        const normalizedLegacyValues = normalizePersistedInputValues(parsedLegacyValues, normalizeOptions);
        if (normalizedLegacyValues) {
          localStorage.setItem(PERSISTENCE_VALUES_KEY, JSON.stringify(normalizedLegacyValues));
        }
      } catch (error) {
        // Ignore malformed legacy data.
      }
    }

    if (legacyEnabled === "true" || legacyEnabled === "false") {
      localStorage.setItem(PERSISTENCE_ENABLED_KEY, legacyEnabled);
    }
  } catch (error) {
    // Ignore storage errors.
  }
}

export function readPersistenceEnabled() {
  try {
    const current = localStorage.getItem(PERSISTENCE_ENABLED_KEY);
    if (current === "true" || current === "false") {
      return current === "true";
    }
    return localStorage.getItem(LEGACY_PERSISTENCE_ENABLED_KEY) === "true";
  } catch (error) {
    return false;
  }
}

export function readPersistedValues(options = {}) {
  const { normalizeOptions } = options;
  try {
    const parseAndNormalize = (raw) => {
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return normalizePersistedInputValues(parsed, normalizeOptions);
      }
      return null;
    };

    const currentRaw = localStorage.getItem(PERSISTENCE_VALUES_KEY);
    const currentValues = parseAndNormalize(currentRaw);
    if (currentValues) {
      return currentValues;
    }

    const legacyRaw = localStorage.getItem(LEGACY_PERSISTENCE_VALUES_KEY);
    const legacyValues = parseAndNormalize(legacyRaw);
    if (legacyValues) {
      return legacyValues;
    }
  } catch (error) {
    // Ignore parsing errors.
  }
  return null;
}

export function clearPersistedInputs() {
  try {
    localStorage.removeItem(PERSISTENCE_VALUES_KEY);
    localStorage.removeItem(PERSISTENCE_ENABLED_KEY);
    localStorage.removeItem(LEGACY_PERSISTENCE_VALUES_KEY);
    localStorage.removeItem(LEGACY_PERSISTENCE_ENABLED_KEY);
  } catch (error) {
    // Ignore storage errors.
  }
}

export function savePersistedInputs(values, options = {}) {
  const { normalizeOptions } = options;
  const normalizedValues = normalizePersistedInputValues(values, normalizeOptions);
  if (!normalizedValues) {
    return false;
  }
  try {
    localStorage.setItem(PERSISTENCE_VALUES_KEY, JSON.stringify(normalizedValues));
    localStorage.setItem(PERSISTENCE_ENABLED_KEY, "true");
    localStorage.removeItem(LEGACY_PERSISTENCE_VALUES_KEY);
    localStorage.removeItem(LEGACY_PERSISTENCE_ENABLED_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

export function buildDataPortabilityPayload({ captureInputValues, persistenceEnabled, theme }) {
  return {
    format: DATA_PORTABILITY_FORMAT,
    version: DATA_PORTABILITY_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      inputs: captureInputValues(),
      persistenceEnabled,
      theme,
    },
  };
}

export function buildDataPortabilityFilename() {
  const timestamp = new Date().toISOString().replace(/[:]/g, "").split(".")[0];
  return `course-pricing-settings-${timestamp}.json`;
}

export function triggerJsonDownload(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseImportedPayload(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error("The selected file was not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("The selected file does not contain the expected data.");
  }
  if (parsed.format !== DATA_PORTABILITY_FORMAT) {
    throw new Error("This file is not a Course Pricing Calculator export.");
  }
  if (typeof parsed.version !== "string") {
    throw new Error("The export file is missing its version number.");
  }
  if (parsed.version !== DATA_PORTABILITY_VERSION) {
    throw new Error(`Unsupported export version: ${parsed.version}.`);
  }
  return parsed;
}
