# Agent Guidelines

- When checking off an item in `TODO.md`, move the completed task to a `DONE` section and note the completion date.
- Always update `TODO.md` when adding, completing, or removing tasks so it reflects the current plan.

## Modularization Strategy

We are **gradually and incrementally** modularizing `index.html` — but in **baby steps only**.

- **Do NOT proactively refactor** large chunks of code. Wait for user requests.
- When a user asks for a change that naturally allows a small, self-contained piece to be split into its own module (e.g., a JS file, CSS file, or HTML partial), **do so**.
- After extracting a module, **inform the user** that you're following this protocol.
- **Update `README.md`** regularly to document the evolving architecture — explain what modules exist, what they do, and how they connect.
- **Review the architecture periodically** to ensure the gradual modular structure remains clean, cohesive, and maintainable.
- Keep modules small and focused. Prefer many small modules over few large ones.

