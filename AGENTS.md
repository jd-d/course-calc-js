# Agent Guidelines

- When checking off an item in `TODO.md`, move the completed task to a `DONE` section and note the completion date.
- Always update `TODO.md` when adding, completing, or removing tasks so it reflects the current plan.

## Browser Verification Workflow (PR Preview)

This repo uses GitHub Pages PR previews (see `.github/workflows/pages.yml`). When a change needs real browser verification (service worker behavior, caching, layout, input interactions), prefer validating via the PR preview URL instead of relying on local `file://` or localhost.

### When To Create Or Reuse A PR

- Prefer **one PR per scope** (a coherent fix/feature). Keep PRs small enough to merge quickly.
- If the work clearly belongs to an **existing open PR** (same scope, same area), continue on that PR's branch and push more commits to it.
- If the work is a **new scope**, create a **new branch + PR** (non-draft) so the preview deploy runs.
- Avoid "one PR per tiny tweak": batch follow-up tweaks into the same PR while staying within the scope.

### Cap Open PRs

To limit merge conflicts and review overhead, keep at most **2 active open PRs** (excluding automation like Dependabot) at a time:
- If a 3rd scope appears, either merge one PR first, or explicitly decide to fold the new work into an existing PR.

### Preview-Based Test Loop

- Create/reuse PR, wait for GitHub Actions to comment the preview URL.
- Reproduce/verify the behavior on the preview: `https://{owner}.github.io/{repo}/previews/pr-{N}/`.
- Iterate by pushing commits to the same PR branch until verified.

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
