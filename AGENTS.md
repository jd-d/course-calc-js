# Agent Guidelines

- When checking off an item in `TODO.md`, move the completed task to a `DONE` section and note the completion date.
- Always update `TODO.md` when adding, completing, or removing tasks so it reflects the current plan.

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

If running locally and port binding is allowed, serve the repo over HTTP:
- Run (from repo root): `python3 -m http.server 4173 --bind 127.0.0.1`
- Open: `http://127.0.0.1:4173/` (or `http://localhost:4173/`)
- Stop: Ctrl+C

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
