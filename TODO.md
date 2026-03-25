# TODO

## Priority Legend

- `P0`: correctness or trust blockers
- `P1`: foundation, maintainability, and important regressions
- `P2`: valuable feature and UX expansion
- `P3`: polish, optional exploration, and lower-leverage ideas

## Planning Notes

- `TODO.md` is the active roadmap source of truth.
- `REFACTOR.md` is historical prompt/context; do not treat it as the live plan.
- Prefer extending an existing workstream over creating duplicate roadmap items.
- Move completed items to `DONE` with a completion date.

## Workstream A: Refactor Foundation (`P1`)

Dependencies: keep behavior stable while continuing the baby-step modularization strategy.

- [ ] `A1` Finish Phase 2 UI-component extractions.
  - `Step 7`: Extract `js/desired-income.js` (~600 lines): gross/net conversion, locked gross values, display refresh, editing guards. This is the highest-risk extraction because it is most intertwined with DOM state.
  - `Step 8`: Extract `js/dialogs.js` (~400 lines): dialog open/close and focus-trap logic for Readme, Accounting, and Breakdown modals.
  - `Step 9`: Extract `js/collapsible.js` (~275 lines): register/unregister/toggle/refresh collapsible-section logic.
- [ ] `A2` Finish Phase 3 extractions and CSS cleanup.
  - `Step 10`: Extract `js/theme.js` (~100 lines): dark/light toggle, localStorage persistence, system preference detection.
  - `Step 11`: Extract `js/tooltips.js` (~230 lines): info-icon tooltip positioning, rendering, open/close.
  - `Step 12`: Extract shared theme CSS into `css/theme.css` and replace duplicated embedded theme styles in `resources.html` and `404.html` with `<link>`.
  - `Step 13`: Optional follow-on: split `styles.css` by component once the behavioral extractions are stable.
- [ ] `A3` Keep documentation aligned with the modularization slices.
  - Update `README.md` architecture notes whenever modules move.
  - Capture durable implementation reasoning in `WIKI.md` when a refactor changes module boundaries or testing expectations.
- [x] `A4` Add markdown lint tooling for repo docs.
  - Imported `.markdownlint.jsonc` and `.markdownlintignore`.
  - Added `scripts/lint_markdown.ps1` with local/global runner detection and optional `-Fix` mode.
  - Added repo guidance so Markdown edits can stay lint-clean without inventing ad hoc rules. (2026-03-24)

## Workstream B: Correctness & Trust (`P1`)

Dependencies: none. These should land ahead of broader UX expansion.

- [ ] `B1` Restore acceptable-income highlighting when dynamic lesson-price mode is active.
  - Current regression: green table-cell backgrounds no longer show outside fixed lesson price mode.
  - Acceptance hint: highlighting should match acceptable-income logic regardless of pricing mode.

## Workstream C: Core UX Improvements (`P2`)

Dependencies: safer after the desired-income and UI-control refactors in Workstream A.

- [ ] `C1` Revise time-off and day-off logic, including any related styling changes needed to keep the controls understandable.
- [ ] `C2` Add safety-margin controls and reorganize the relevant settings layout for clarity.
- [ ] `C3` Add a fast-tweak control strip above the pricing table.
  - Mirror selected high-impact sidebar inputs near the table so users can adjust values without scrolling back to the sidebar.
  - Design this so the exposed fields can later become user-configurable instead of being a one-off hardcoded strip.
- [ ] `C4` Expand pricing-table cell configurability.
  - Add controls to toggle which metrics appear in each cell, for example VAT, buffer, base price, hourly figure, and gross/net views.
  - Prefer a configuration model that can later support exposing additional outputs without rewriting cell rendering again.

## Workstream D: Reporting & Planning Surfaces (`P2`)

Dependencies: best tackled after Workstreams A and C reduce orchestration complexity.

- [ ] `D1` Add a filtered “valid candidates” table based on lesson-price and/or income ranges.
  - Candidate columns may include: students, classes per week, lesson price, price ex VAT, hourly net, lesson net, and similar derived values.
- [ ] `D2` Add a more detailed accountant view that shows the actual calculation breakdowns, including cost multipliers and tax applications, so users can verify the math.
- [ ] `D3` Consider spreadsheet export with visible calculations and formulas.
- [ ] `D4` Explore calendar-style planning views for future months once the core calculation and reporting flows are stable.

## Workstream E: Data Model Expansion (`P2`)

Dependencies: easier once refactor work has separated calculation logic from UI orchestration.

- [ ] `E1` Add custom cost items with custom frequencies.
  - Users should be able to define a label and choose frequency types such as weekly, monthly, annual, per lesson, per student, per active day, per active week, and per active month.
  - Keep the data model extensible so these costs flow cleanly into reports and pricing outputs.
- [ ] `E2` Support more output types in pricing-table cells.
  - Examples: monthly income, weekly income, and other derived outputs that users may want to expose in the table.
  - Prefer a reusable output-registration pattern rather than special-casing each new field.

## Workstream F: PWA & Polish (`P3`)

- [ ] `F1` Add a “Save as an app!” explainer button with succinct platform-specific guidance for iPhone, Android, and other supported platforms.
- [ ] `F2` Auto-select light or dark mode by time of day, with a lock control that prevents automatic switching while still allowing manual theme changes.

## DONE

- [x] Remove extra bottom whitespace from the table-grid results column.
  - Stopped the results column from stretching to match the taller controls
    panel.
  - Removed forced full-height behavior from the pricing/results cards so
    they hug their rendered content. (2026-03-25)

- [x] Clean up local workspace noise after the docs/tooling commit.
  - Ignored `course-calc-js.code-workspace` as a local editor artifact.
  - Ignored `lint-docs-check.txt` as local markdown-lint output.
  - Ignored `artifacts/primary-ui-smoke.png` as generated smoke-test output.
  - Ignored `See--WSL2--github-wsl.lnk` as a local shortcut artifact.
  - Ignored `.vscode/settings.json` as local editor environment config.
  - Restored the executable bit on `scripts/primary_ui_smoke.py` because the
    remaining diff was mode-only, not a content change. (2026-03-25)

- [x] **Step 6 — Extract `js/calculations.js` (~500 lines):** `getInputs()`, `computeNetIncomeFromRevenue()`, cost helpers, `shouldHighlightIncome()`, `buildCostsSummary()`. Refactor `getInputs()` to accept a `controls` object param instead of reading globals. (2026-02-15)
- [x] **Step 4 — Extract `js/accounting-report.js` (~425 lines):** `buildAccountingReport()` + its ~140-line embedded CSS template. Takes calculation results, returns standalone HTML string. (2026-02-15)
- [x] **Step 5 — Extract `js/pricing-table.js` (~570 lines):** `buildPricingTable()` + `findBestPricingCombination()`. Takes inputs + calculation results, returns HTML. (2026-02-15)
- [x] **Step 3 - Extract `js/storage.js`:** moved persistence/data-portability logic into `js/storage.js`, wired `app.js` imports, and updated service-worker precache. (2026-02-14)
- [x] **Step 1 - Scaffold module entry point:** switched `index.html` app script to module mode and updated service worker precache list. (2026-02-14)
- [x] **Step 2 - Extract `js/utils.js`:** moved shared formatting, parsing, validation, escaping, and manual lesson price parsing helpers into `js/utils.js` and imported them from `app.js`. (2026-02-14)

- [x] Add an `Average monthly` acceptable-income basis (12-month average) alongside `Per active month`, with correct conversion and square-highlighting logic. (2026-02-11)
- [x] Fix buffer tooltip overflow and show fixed-price buffer shortfall line (`Annual ... -X% buffer`) with matching acceptable-income highlight logic. (2026-02-11)
- [x] Clarify buffer toggle semantics: buffer affects dynamic target price only; manual fixed prices stay fixed, with an explanatory tooltip in the table UI. (2026-02-11)
- [x] Implement hybrid pricing input model so desired income and manual lesson prices can be active together (max 3 manual prices + dynamic block). (2026-02-11)
- [x] Fix Desired Gross/Net Income fields becoming hard to overwrite in normal browser sessions — `change` handler no longer re-sets `dataset.editing` after blur (issue #6). (2026-02-10)
- [x] Stop resetting acceptable income range max to 0 when left empty — `normalizePersistedInputValues` now preserves `null` instead of converting via `Number(null)=0`. (2026-02-10)
- [x] Relax auto-correct for min/max lesson price — deferred render to `change` (blur) instead of every keystroke, with editing guards to prevent value rewriting mid-edit. (2026-02-10)
- [x] Add service-worker update toast (offline-safe) so users can reload into the latest version without DevTools. (2026-02-10)
- [x] Add "Clear all app data" button that clears localStorage, unregisters the service worker, purges caches, and reloads. (2026-02-10)
- [x] Add runtime version diagnostics — app.js logs build version and SW controller status on load. (2026-02-10)
- [x] Make the left Inputs sidebar collapsible to a minimal right-pointing handle (`>`), with one-click re-expand. (2026-02-10)
- [x] Bump cache/storage versioning to unstick stale browser data while migrating existing saved key field values. (2026-02-08)
- [x] Investigate and fix conditions where Desired Net Income fields become negative and then stop syncing when another income basis field is edited. (2026-02-08)
- [x] Allow comma-separated manual lesson price preferences (max 4) and render each preference as its own mini box in each pricing-table cell. (2026-02-08)
- [x] Audit PR #3 review comments for current relevance and apply remaining fixes. (2026-02-08)
- [x] Fix touch scrolling on pricing table - added `touch-action: pan-y` to `button.price-line` elements so vertical scrolling works when finger is on table buttons. (2026-01-20)
- [x] Fix JavaScript syntax error in resources.html - missing closing brace in the theme initialization IIFE catch block. (2026-01-20)
- [x] Fix broken GitHub link in resources.html - DATA_FORMAT.md link pointed to wrong repository name (`course-pricing-calculator` instead of `course-calc-js`). (2026-01-20)
- [x] Add JSON export/import buttons that let users move their calculator setup between browsers, saving files with a versioned schema. (2025-02-15)
- [x] Rename Net Income section simply to Desired Income, and add two
  buttons: Toggle Gross/Net, and Toggle Gross/Net (lock amount). Pressing
  the Toggle Gross/Net button when Net incomes are being displayed will
  switch to displaying the equivalente gross income amounts instead.
  Pressing the other Toggle "Gross/Net (lock amount)" button will instead
  "lock" the amounts entered but regard them as Gross amounts and
  recalculate other values across the page accordingly. When the toggle is
  pressed, the section title must clearly indicate which values are being
  displayed, Net or Gross, by toggling between the title Desired Net Income
  and Desired Gross Income as appropriate. (2025-10-19)
  - [x] Add an optional acceptable income ranges section under the Desired
    Income section where the user can enter from and to values of what they
    consider an acceptable income range, and they can enter this either
    monthly or annually. (These also follow the new Net/Gross toggle
    system). (2025-10-19)
    - [x] If acceptable income is filled in, either min or max, or both,
      let's give the squares of the lesson price table a shaded green
      background when they fall within acceptable income range. Pick a nice
      suitable green shade that fits both light and dark modes or different
      green shades for each. It should also be shades of green that are
      compatible with red text in case the lesson price rules make the text
      red for square shaded green. (2025-10-19)
- [x] Add an hours per lesson box somewhere appropriate in the inputs. And
  also then add a net (or gross depending on net/gross toggles) hourly
  income (which doesn't populate of lesson length hasn't been filled in -
  say that in the info pop-up). (2025-10-20)
- [x] Add an input field after "Students per Class" for "Lesson length (mins)" and use it to append hourly pricing (e.g., "(€XX/hr)") to each lesson price in the table. (2025-10-20)
- [x] Add a radio button next to the annual target field to decide if targets are gross or net and adjust calculations accordingly. (2025-10-20)
- [x] Ensure on mobile that the preset buttons appear above the form and
  reduce the large space that appears between the blog title and the form
  (see pic). (2025-09-30)
- [x] Swap the prominence of prices with and without VAT so the price including VAT is shown as the primary figure, with the VAT-exclusive amount secondary. (2025-09-30)
- [x] Consolidate the pricing table to display only the buffered price, omitting separate breakeven and buffered values. (2025-09-30)
