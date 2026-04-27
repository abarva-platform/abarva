# Backlog Operating Model

## Codex execution model

Use supervised multi-agent mode when safe.

- One supervisor owns preflight, branch hygiene, validation, PR checks, merges, and final state.
- Workers operate on independent file scopes only.
- One branch and one PR per slice.
- No `git add .`.
- Do not stage unrelated files.
- Stop for non-trivial conflicts, scope creep, failed CI outside scope, auth/security/API/model/upload/persistence ambiguity, or visual/product judgment.

## PR lifecycle

Codex/Claude must test, open PRs, monitor checks, fix in-scope failures, resolve trivial conflicts, and merge when green and scoped.

Every PR body must include:

1. Summary
2. Files changed
3. Validation results
4. Production-readiness impact
5. Out-of-scope confirmation
6. Whether tracker/manifest was updated
7. Next action

## Model budget

Default to Codex Spark Medium.

Escalate only for:

- non-obvious TypeScript/Next.js failures
- repeated CI failure
- auth/security/tenant behavior
- runtime/API/model/upload/persistence ambiguity
- complex architecture reconciliation

## Production readiness rule

Every slice must evaluate `docs/build/production-readiness.json` using `docs/build/PRODUCTION_READINESS_UPDATE_PROTOCOL.md`.

Do not overstate readiness:

- Docs/spec completion is not runtime readiness.
- Seeded data is not production data.
- Deterministic tests are not live persona validation.
- UI shell is not full-flow readiness.
- `code_complete` is not `production_ready`.

## Design compliance gate for UI

Before UI changes, read and cite the Experience System, Design Decisions Lock, Visual Acceptance Criteria, relevant wireframes, and component specs.

UI must follow:

- warm off-white / ivory canvas
- dark navy / charcoal typography
- restrained dark-sky-blue accents
- table-forward data presentation
- visible journey/stage progress
- compact contextual agent guidance
- no generic chatbot wrapper
- no generic AI sparkle
- no Sanskrit symbols

## Brand rule

Use name-only AbarVa wordmark until final logo asset is supplied.

- Abar near-black / black
- Va dark blue / dark sky blue
- Va close to Abar
- no symbol for now
- do not invent a new symbol
