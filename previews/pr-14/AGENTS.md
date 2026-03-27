# Agent Guidelines

- When checking off an item in `TODO.md`, move the completed task to a `DONE` section and note the completion date.
- Always update `TODO.md` when adding, completing, or removing tasks so it reflects the current plan.

## Planning & Prioritization Governance

- Treat `TODO.md` as the single active roadmap source of truth for this repo.
- For every feature, fix, refactor, or docs change request:
  1. place it in `TODO.md` first or merge it into an existing roadmap item,
  2. explain how it fits the current sequencing or workstream,
  3. then implement.
- If the user does not provide a priority, assign one using this default lens:
  - `P0`: correctness or trust blockers
  - `P1`: foundation, maintainability, or important regressions
  - `P2`: valuable feature and UX expansion
  - `P3`: polish, optional exploration, or lower-leverage ideas
- Prefer extending an existing workstream item over creating a duplicate top-level TODO entry.
- Keep TODO entries specific enough to preserve intent, dependencies, and expected behavior.
- Push back when a request conflicts with roadmap coherence, quality, or safe sequencing; propose a better order when needed.

## README & Wiki Hygiene

- Keep `README.md` aligned with shipped behavior, repo structure, and active architecture guidance.
- When a change affects workflow, modularization, testing expectations, or user-visible behavior, update `README.md` in the same change when practical.
- Keep a root `WIKI.md` as the durable knowledge log for substantial implementation notes, tradeoffs, diagnostics, and planning context worth preserving beyond a single chat.
- Write `WIKI.md` entries using repo-relative paths only so the content stays portable.
- Keep `WIKI.md` concise and durable; capture reusable reasoning, not chat transcript phrasing.
- Treat `REFACTOR.md` as historical prompt/context, not the active roadmap.

## Markdown Quality

- Follow the repo markdownlint rules from `.markdownlint.jsonc` when creating or editing Markdown files.
- Keep modified Markdown files lint-clean when practical.
- Use `scripts/lint_markdown.ps1` to run markdownlint, or `scripts/lint_markdown.ps1 -Fix` to apply automatic fixes where supported.

## Local Vs Cloud

- Local/interactive (IDE): ask the user for PR strategy up-front per scope, and offer faster local verification options where available.
- Cloud/non-interactive (Codex cloud / ChatGPT app): defer to the platform's own operating constraints and defaults. Do not introduce extra decision gates that could block completion.

## Browser Verification Workflow

When a change needs real browser verification (service worker behavior, caching, layout, input interactions), prefer one of the following:

### Option A (Preferred): PR Preview (HTTPS)

This repo uses GitHub Pages PR previews (see `.github/workflows/pages.yml`). The preview URL is deterministic:
`https://{owner}.github.io/{repo}/previews/pr-{N}/`

Important:

- Use PR previews only for trusted branches in the same repo. Do not rely on previews for fork PRs unless workflows are explicitly hardened for forks (this workflow uses `pull_request_target`).

### Option B (Fallback/Fast Path): Temporary Local Server (HTTP)

If running locally, use any simple static HTTP server that serves the repo
root. This project is a static site and does not require Vite or another
bundler dev server.

Examples:

- Run (from repo root): `python3 -m http.server 4173 --bind 127.0.0.1`
- Open: `http://127.0.0.1:4173/` (or `http://localhost:4173/`)
- Stop: Ctrl+C
- Or use Five Server / Live Server and the local URL it provides.

Notes:

- `file://` cannot validate service worker behavior. Use `http://` or `https://`.
- If port binding is blocked/sandboxed, use the PR preview option instead.

### When To Create Or Reuse A PR

- Prefer **one PR per scope** (a coherent fix/feature). Keep PRs small enough to merge quickly.
- If the work clearly belongs to an **existing open PR** (same scope, same area), continue on that PR's branch and push more commits to it.
- If the work is a **new scope**, create a **new branch + PR** (non-draft) so the preview deploy runs.
- Avoid "one PR per tiny tweak": batch follow-up tweaks into the same PR while staying within the scope.

### PR Strategy Prompt (Local/Interactive)

At the start of each new scope, the agent should:

- List open PRs (use `gh pr list` if available), report the count, and summarize relevant PRs.
- Recommend one of: add to an existing PR, create a new PR, or work directly (no PR), and explain why.
- Ask the user to choose.

The agent should also suggest merging PRs that appear ready to keep the number of open PRs manageable.

### Preview-Based Test Loop

- Create/reuse PR, wait for GitHub Actions to comment the preview URL.
- Reproduce/verify the behavior on the preview: `https://{owner}.github.io/{repo}/previews/pr-{N}/`.
- Iterate by pushing commits to the same PR branch until verified.

### Minimum Post-Render Smoke Checks

After UI or modularization changes, always run a quick browser smoke pass once the page is rendered. Verify at least:

- The lesson price table renders with rows/cells after default load or after one recalculate action.
- Settings data-portability controls respond (Import JSON opens file picker flow, Export JSON triggers download flow).
- Reset/clear controls respond (reset saved inputs and clear app data buttons execute their handlers).
- No blocking runtime errors appear in browser console (`pageerror` / uncaught reference errors).

### Primary UI Smoke Test Fixture

- For screenshot-based UI verification, use `tests/primary-ui-smoke-settings.json` as the baseline import config.
- Run `scripts/primary_ui_smoke.py` against the URL from your local static
  server to execute the primary smoke flow and capture a screenshot with this
  fixture.
- This smoke test is the default reference for future visual checks unless a task explicitly requires different inputs.

### If An Agent Cannot Open PRs

- They should still create a branch and commit changes.
- Then ask a human (or a PR-capable agent) to push/open the PR so the preview deploy can be used for verification.

## Modularization Strategy

We are **gradually and incrementally** modularizing `index.html` — but in **baby steps only**.

- **Do NOT proactively refactor** large chunks of code. Wait for user requests.
- When a user asks for a change that naturally allows a small, self-contained piece to be split into its own module (e.g., a JS file, CSS file, or HTML partial), **do so**.
- After extracting a module, **inform the user** that you're following this protocol.
- **Update `README.md`** regularly to document the evolving architecture — explain what modules exist, what they do, and how they connect.
- **Review the architecture periodically** to ensure the gradual modular structure remains clean, cohesive, and maintainable.
- Keep modules small and focused. Prefer many small modules over few large ones.
