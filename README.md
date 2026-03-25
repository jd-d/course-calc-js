# course-pricing-calculator

Something for working out costs and income.

## Project docs

Use the repo docs with distinct roles so planning and implementation context stay tidy:

| File | Role |
| ------ | --------- |
| `README.md` | Current shipped behavior, architecture overview, deployment/testing guidance |
| `TODO.md` | Active prioritized roadmap and workstreams |
| `WIKI.md` | Durable implementation notes, tradeoffs, and planning context worth preserving |
| `DATA_FORMAT.md` | JSON import/export schema and compatibility notes |
| `REFACTOR.md` | Historical refactor prompt/context, not the active roadmap |

When work changes behavior, architecture, or workflow expectations, update the relevant docs in the same change when practical.

## Markdown lint

Markdown in this repo uses `.markdownlint.jsonc` for rule configuration and
`.markdownlintignore` for any excluded paths.

Run the lint wrapper from PowerShell:

```powershell
./scripts/lint_markdown.ps1
```

Apply automatic fixes where markdownlint supports them:

```powershell
./scripts/lint_markdown.ps1 -Fix
```

The script looks for a repo-local `markdownlint` runner first and then falls
back to a global install. If no runner is available, it prints the install
commands to use.

## Architecture

The project is gradually being modularized. Currently:

| File | Purpose |
| ------ | --------- |
| `index.html` | Main application HTML structure (~1,050 lines) |
| `styles.css` | All main application CSS (~2,050 lines) |
| `app.js` | Main application entry, orchestration, and event wiring |
| `js/utils.js` | Shared utility helpers (formatting, parsing, validation, HTML escaping) |
| `js/storage.js` | Persistence and data-portability logic (save/load/migrate/export/import) |
| `js/accounting-report.js` | Pure renderer that builds standalone accountant report HTML output |
| `js/pricing-table.js` | Pure renderer for pricing table HTML and best-match lookup |
| `js/calculations.js` | Calculation-focused helpers (`getInputs(controls, context)`, income math, cost summaries, breakdown builders) |
| `pwa.js` | Progressive Web App registration |
| `service-worker.js` | Offline caching logic |
| `resources.html` | Helpful resources page |
| `404.html` | Custom 404 page |

**Icons:** SVG icon sprites are defined at the top of `index.html` (`#icon-info`, `#icon-chevron-down`) and referenced throughout using `<svg><use href="#icon-..."></use></svg>`.

**Note:** we are following the incremental modularization protocol in baby steps. The standalone report template lives in `js/accounting-report.js`, pricing table rendering in `js/pricing-table.js`, and calculation-heavy logic now in `js/calculations.js` so `app.js` remains focused on entry-point orchestration.

## Progressive Web App support

The calculator now exposes a web app manifest and service worker so it can be installed on supported devices and keep working offline. Static assets and core pages are precached, and subsequent navigation attempts fall back to the cached calculator when the network is unavailable.

The service worker cache key is versioned (`course-pricing-calculator-v*`) so new deployments can invalidate stale cached assets. Local persisted calculator inputs are also versioned and migrated forward automatically so existing saved field values are retained after storage upgrades.

## Data portability

Use the **Export JSON** and **Import JSON** buttons in the Settings panel to move your saved setup between browsers. Exports include every input value, display toggle, and layout preference plus the active theme. The JSON schema is versioned in [`DATA_FORMAT.md`](./DATA_FORMAT.md) so future updates remain compatible with earlier downloads.

## Deployment options

This project is a static site. For local development you can serve the repo
with any simple static HTTP server, including Five Server, Live Server, or
`python3 -m http.server`.

This repository publishes the static site defined in `index.html` to
GitHub Pages using the **Pages (prod + previews)** workflow in
`.github/workflows/pages.yml`. The workflow runs for pushes to `main`,
pull requests targeting `main`, and any manual `workflow_dispatch`
invocations. Each run builds the site once and uploads it as a shared
`site-dist` artifact that every deployment job reuses.

### Production deployment (`main`)

When commits land on `main`, the workflow deploys the contents of the
`site-dist` artifact to the root of the `gh-pages` branch. This publishes
the production site at the repository's standard GitHub Pages URL.

### Pull request preview deployments

Pull requests against `main` trigger the same workflow. Their builds are
published to `gh-pages` under `previews/pr-<number>/`, and the workflow
comments the preview URL on the pull request so you can verify changes
before merging. The comment step writes back to the pull request thread,
so the workflow file must grant it `issues: write` permissions (and
optionally `pull-requests: write`) to keep that automation functioning.

### Preview cleanup

Preview directories are removed automatically when a pull request
closes, courtesy of `.github/workflows/cleanup-preview.yml`.

## Manual regression test

Use the primary screenshot smoke with the shared fixture:

- Settings fixture: `tests/primary-ui-smoke-settings.json`
- Script: `python3 scripts/primary_ui_smoke.py --url http://127.0.0.1:5500/ --screenshot artifacts/primary-ui-smoke.png`
- Replace the URL with whatever local static server you are using. Five
  Server, Live Server, and `python3 -m http.server` are all valid.

Use these steps to confirm acceptable-income persistence treats blank maximums as an open range.

1. Load the calculator and enable the **Remember my inputs** option.
2. Set an acceptable minimum income value, leave the maximum field blank, and toggle any basis if desired.
3. Reload the page. The acceptable income inputs should show the saved minimum and an empty maximum, and the acceptable range shading should extend through the full graph to represent no upper bound.

Use these steps to confirm hybrid dynamic + manual lesson-price rendering works correctly.

1. In **Lesson price preferences**, enter up to three values in **Set a specific lesson price (incl. VAT)**, for example `95, 105, 115`.
2. Confirm each pricing-table cell shows one dynamic target block plus one mini manual block per entered value.
3. Edit any field in **Desired Net/Gross Income** while manual prices are filled in, and confirm desired-income fields remain editable.
4. Toggle **Include buffer** and confirm both the dynamic and manual blocks update consistently.

Use these steps to confirm Desired Net Income values do not go negative in manual lesson-price mode.

1. Enter a very low manual lesson price (for example `1`) so projected profitability is poor.
2. Confirm the Desired Net Income fields do not display negative values.
3. Change a different desired-income basis field and confirm all related desired-income fields continue syncing.
