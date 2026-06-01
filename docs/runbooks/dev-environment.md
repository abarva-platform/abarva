# Developer Environment

## Commit Hooks

This repository uses Husky for local Git hooks:

- `pre-commit` runs `npm run secrets:staged`, then `npx lint-staged`.
- `commit-msg` runs `npx --no -- commitlint --edit ${1}`.

`lint-staged` formats and fixes staged files before a commit is created:

- `src/**/*.{ts,tsx,js,jsx}` runs `eslint --fix` and `prettier --write`.
- `**/*.{md,json,yml,yaml}` runs `prettier --write`.

Commit messages follow Conventional Commits. Allowed types are `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `ci`, `build`, and `revert`.

Secret scanning uses gitleaks:

- Staged-file hook: `npm run secrets:staged`
- PR-diff/full branch scan: `npm run secrets:scan -- --log-opts="origin/main..HEAD"`

If the hook finds a secret, remove the secret from the staged diff and rotate the credential if it was real.

## Setup

Run `npm install` after pulling hook changes. The `prepare` script installs Husky hook shims.

Use Node.js 24.x for consistency with the Dockerfile and `AGENTS.md`.

## Emergency Bypass

Use bypasses only when a local tool is broken and the same validation will be run another way before merge.

- Skip one hook run: `HUSKY=0 git commit -m "type(scope): message"`
- Skip Git hooks directly: `git commit --no-verify -m "type(scope): message"`

Record the reason in the PR and include the replacement validation command output.
