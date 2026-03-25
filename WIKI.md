# Course Calc Wiki

This file captures durable implementation notes and longer-form explanations
that are worth preserving in the repository.

Use repo-relative paths only so the content stays portable if this file later
becomes a real wiki or documentation source.

## 2026-03-24: Planning and documentation hygiene adopted

### What changed

The repo now follows a more explicit project-management and documentation
structure:

- `TODO.md` is the active roadmap source of truth.
- roadmap items are grouped into priority bands and workstreams instead of a
  flat high/medium/low list
- `AGENTS.md` now explicitly requires TODO placement, README synchronization,
  and WIKI capture when work changes shipped behavior or long-lived project
  knowledge
- `README.md` now states the role of each core doc so planning, historical
  context, and shipped behavior are easier to keep separate

### Why this structure was adopted

The previous roadmap already had useful content, but it mixed refactor phases,
feature ideas, and priority buckets without a strong governance layer.

The new structure is meant to make three things clearer:

1. what should happen first
2. which items belong to the same workstream
3. where durable reasoning should live after a change is finished

### Current guidance

- Use `TODO.md` for active planning and sequencing.
- Keep `README.md` aligned with actual shipped behavior and architecture.
- Use `WIKI.md` for durable notes that would otherwise be lost in chat, such
  as tradeoffs, implementation rationale, and cross-file planning context.
- Treat `REFACTOR.md` as historical prompt material rather than the active
  execution plan.

## 2026-03-24: Markdown lint tooling imported

### What landed

The repo now has the same lightweight markdownlint workflow pattern adopted
from Fluisterlab:

- `.markdownlint.jsonc` for shared markdownlint rules
- `.markdownlintignore` for opt-out paths when needed
- `scripts/lint_markdown.ps1` as the PowerShell wrapper

### Why this approach fits this repo

This keeps Markdown quality enforcement simple without adding a larger Node
tooling layer to a mostly static site repo.

The wrapper looks for a repo-local markdownlint runner first and then falls
back to a global install, so contributors can use either setup.

### Current workflow

- Run `./scripts/lint_markdown.ps1` to lint all Markdown files.
- Run `./scripts/lint_markdown.ps1 -Fix` to apply supported fixes.
- If no runner is installed yet, the script prints the install commands
  instead of failing with an opaque command-not-found error.
