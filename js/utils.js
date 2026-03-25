export const ERROR_MESSAGE_INVALID = "please enter a valid number";
export const ERROR_MESSAGE_EMPTY = "this field is required";
export const MAX_MANUAL_LESSON_PRICE_OPTIONS = 3;
export const ERROR_MESSAGE_LESSON_PRICE_LIST_FORMAT = "use comma-separated prices (for example: 95, 105)";
export const ERROR_MESSAGE_LESSON_PRICE_LIST_MAX = `enter up to ${MAX_MANUAL_LESSON_PRICE_OPTIONS} prices`;

const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatFixed(value, fractionDigits = 1) {
  const fixed = value.toFixed(fractionDigits);
  return fixed.replace(/\.0+$/, "").replace(/(\.[0-9]*[1-9])0+$/, "$1");
}

export function parseNumber(value, fallback = 0, { min = -Infinity, max = Infinity } = {}) {
  if (value === null || value === undefined) {
    return fallback;
  }
  const normalized = typeof value === "string" ? value.trim() : value;
  if (normalized === "") {
    return fallback;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

export function parseNumericValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = typeof value === "string" ? value.trim() : value;
  if (normalized === "") {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateNumberInput(input, { fallback = 0, min = -Infinity, max = Infinity, required = true } = {}) {
  if (!(input instanceof HTMLInputElement)) {
    return {
      value: fallback,
      valid: true,
      empty: false,
      message: null,
    };
  }
  const raw = typeof input.value === "string" ? input.value.trim() : "";
  if (raw === "") {
    if (required) {
      return { value: fallback, valid: false, empty: true, message: ERROR_MESSAGE_EMPTY };
    }
    return { value: fallback, valid: true, empty: true, message: null };
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return { value: fallback, valid: false, empty: false, message: ERROR_MESSAGE_INVALID };
  }
  if (parsed < min || parsed > max) {
    return { value: fallback, valid: false, empty: false, message: ERROR_MESSAGE_INVALID };
  }
  return { value: parsed, valid: true, empty: false, message: null };
}

export function getFieldInfoIcon(input) {
  if (!(input instanceof HTMLElement)) {
    return null;
  }
  const control = input.closest(".control");
  return control ? control.querySelector(".info-icon") : null;
}

export function getFieldErrorMessageElement(input) {
  if (!(input instanceof HTMLInputElement) || !input.id) {
    return null;
  }
  const control = input.closest(".control");
  if (!(control instanceof HTMLElement)) {
    return null;
  }
  const errorId = `${input.id}-error`;
  const existing = document.getElementById(errorId);
  if (existing instanceof HTMLElement && control.contains(existing)) {
    return existing;
  }
  const message = document.createElement("span");
  message.id = errorId;
  message.className = "visually-hidden";
  control.appendChild(message);
  return message;
}

export function applyFieldValidationA11yState(input, message) {
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const hasMessage = Boolean(message);
  input.setAttribute("aria-invalid", hasMessage ? "true" : "false");

  if (input.dataset.validationBaseDescribedby === undefined) {
    input.dataset.validationBaseDescribedby = input.getAttribute("aria-describedby") || "";
  }

  const messageElement = getFieldErrorMessageElement(input);
  if (messageElement) {
    messageElement.textContent = hasMessage ? message : "";
  }

  const baseIds = (input.dataset.validationBaseDescribedby || "")
    .split(/\s+/)
    .map((id) => id.trim())
    .filter(Boolean);

  if (hasMessage && messageElement) {
    if (!baseIds.includes(messageElement.id)) {
      baseIds.push(messageElement.id);
    }
    input.setAttribute("aria-describedby", baseIds.join(" "));
    input.setAttribute("aria-errormessage", messageElement.id);
  } else {
    if (baseIds.length) {
      input.setAttribute("aria-describedby", baseIds.join(" "));
    } else {
      input.removeAttribute("aria-describedby");
    }
    input.removeAttribute("aria-errormessage");
  }
}

export function applyFieldValidationState(
  input,
  message,
  { fieldErrorClass, infoIconErrorClass, onInfoIconUpdate } = {},
) {
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  if (message) {
    input.classList.add(fieldErrorClass);
  } else {
    input.classList.remove(fieldErrorClass);
  }
  applyFieldValidationA11yState(input, message);
  const infoIcon = getFieldInfoIcon(input);
  if (infoIcon) {
    if (message) {
      infoIcon.classList.add(infoIconErrorClass);
      infoIcon.dataset.tooltipError = message;
    } else {
      infoIcon.classList.remove(infoIconErrorClass);
      delete infoIcon.dataset.tooltipError;
    }
    if (typeof onInfoIconUpdate === "function") {
      onInfoIconUpdate(infoIcon);
    }
  }
}

export function updateInputValueIfAllowed(input, result, value, { allowEmpty = false, force = false, fieldErrorClass } = {}) {
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  if (input.dataset.editing === "true") {
    return;
  }
  if (!force && fieldErrorClass && input.classList.contains(fieldErrorClass)) {
    return;
  }
  if (result?.empty && allowEmpty) {
    return;
  }
  input.value = value;
}

export function parseManualLessonPrices(
  rawValue,
  {
    maxCount = MAX_MANUAL_LESSON_PRICE_OPTIONS,
    formatMessage = ERROR_MESSAGE_LESSON_PRICE_LIST_FORMAT,
    maxMessage = ERROR_MESSAGE_LESSON_PRICE_LIST_MAX,
  } = {},
) {
  const raw = rawValue === null || rawValue === undefined ? "" : String(rawValue).trim();

  if (!raw) {
    return {
      values: [],
      valid: true,
      empty: true,
      message: null,
    };
  }

  const rawTokens = raw.split(",");
  const tokens = [];
  for (const token of rawTokens) {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      return {
        values: [],
        valid: false,
        empty: false,
        message: formatMessage,
      };
    }
    tokens.push(normalizedToken);
  }

  if (tokens.length > maxCount) {
    return {
      values: [],
      valid: false,
      empty: false,
      message: maxMessage,
    };
  }

  const values = [];
  for (const token of tokens) {
    const parsed = Number(token);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return {
        values: [],
        valid: false,
        empty: false,
        message: formatMessage,
      };
    }
    values.push(parsed);
  }

  return {
    values,
    valid: true,
    empty: false,
    message: null,
  };
}

export function formatCurrency(symbol, value) {
  if (!Number.isFinite(value)) {
    return `${symbol}0`;
  }
  const rounded = Math.round(value);
  const formatted = numberFormatter.format(Math.abs(rounded));
  return rounded < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function formatCurrencyDetailed(symbol, value, digits = 2) {
  if (!Number.isFinite(value)) {
    return `${symbol}0.00`;
  }
  const absolute = Math.abs(value);
  const formatted = absolute.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return value < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function formatCurrencyOrDash(symbol, value, digits = 2) {
  return Number.isFinite(value) ? formatCurrencyDetailed(symbol, value, digits) : "-";
}

export function formatNumberValue(value, maximumFractionDigits = 2) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

export function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
