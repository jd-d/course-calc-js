# Data portability format

This document tracks every published version of the calculator's JSON export/import structure so we can evolve it without breaking
people's saved files.

## Version 1.0.0 - 2025-02-15

**Introduced in:** Export/import controls on the settings panel.

**File extension:** `.json`

**Top-level shape:**

```json
{
  "format": "course-pricing-calculator",
  "version": "1.0.0",
  "exportedAt": "2025-02-15T12:34:56.789Z",
  "data": {
    "inputs": { "<form-field-id>": "..." },
    "persistenceEnabled": true,
    "theme": "dark"
  }
}
```

### Field notes

- `format` always equals `course-pricing-calculator`. Treat any other value as an incompatible file.
- `version` follows [semver](https://semver.org/). Bump the version whenever you change the payload in a way that is not fully backward compatible.
- `exportedAt` is an ISO-8601 timestamp generated at export time.
- `data` contains the actual calculator state. New keys can be added over time.
  - `inputs` matches the object returned by `captureInputValues()`. Keys map HTML input IDs to either string values or booleans, plus a handful of
    pseudo-keys prefixed with `__` for derived values (for example `__desiredIncomeNet_year`).
  - `persistenceEnabled` is a boolean mirroring the "Remember my inputs" toggle. When true, importing the file should immediately re-save the captured
    inputs to local storage.
  - `theme` stores the active light/dark mode. Acceptable values are `light` and `dark`.

### Forward-compatibility guidelines

- When adding new keys, prefer nesting them under `data`.
- Always document additions in this file with the new version number and the release date.
- When removing or renaming keys, update the import routine to gracefully handle older exports. If you cannot do that safely, bump the major version.
- Keep descriptive error messages for users when rejecting an incompatible file.
