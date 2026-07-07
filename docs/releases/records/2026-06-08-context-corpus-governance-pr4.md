# 2026-06-08-context-corpus-governance-pr4 — CI gate + exception file

## Release ID

`2026-06-08-context-corpus-governance-pr4`

## Status

`candidate`

## Plain-English Summary

PR-4 of the Context & Corpus Governance Framework: the hard, static CI gate that
makes the policy strict for every agent (Codex or Claude Code). It adds
`npm run validate:context-corpus` (four independently-runnable subcommands) and a
GitHub workflow that runs on any PR touching governance code. The gate fails the
build when: an exception in `policy-exceptions.json` is expired/malformed/
duplicate/non-canonical (CI-enforced expiry — exceptions cannot rot into
permanence); a governance module hand-types tenant keys instead of importing
`CANONICAL_TENANT_KEYS`; runtime code mints `agent_ready` without routing through
the policy contract; or a canonical enum is defined more than once. The pure
exception validator is unit-tested and the gate was negative-tested (a planted
expired exception fails it).

## Layer Impact

**global-control-lane**: CI enforcement + governance tooling only. New: pure
validator `src/lib/governance/policy-exceptions.ts`, CI orchestrator
`src/scripts/governance/validate-context-corpus.ts`, workflow
`.github/workflows/context-corpus-governance.yml`, `docs/governance/policy-exceptions.json`
(empty default), npm scripts. No schema, no migration, no data, no runtime path.

## Client Applicability

- All clients: the gate enforces the contract uniformly; exceptions are scoped to
  canonical tenant keys / `corpus_global` / `all` and always expire.
- No client-facing behavior change.
- Feature flag: none.

## Changes Included

- `src/lib/governance/policy-exceptions.ts` — Zod schema + `validateExceptions(raw, today)`.
- `src/lib/governance/__tests__/policy-exceptions.test.ts` — 9 tests (expiry, duplicates, non-canonical, broad-scope warnings).
- `src/scripts/governance/validate-context-corpus.ts` — exceptions / tenant-coverage / agent-readiness / duplicates checks; exits non-zero on failure.
- `.github/workflows/context-corpus-governance.yml` — runs the gate + the exception tests.
- `docs/governance/policy-exceptions.json` — empty healthy default.
- `docs/governance/CONTEXT_CORPUS_CI_GATE_2026-06-08.md` — what it checks + exception format.
- `package.json` — `validate:context-corpus[:*]` scripts. Trackers updated.

## QA / Validation

- `jest policy-exceptions.test.ts` — **9/9 passed**.
- `npm run validate:context-corpus` — **passed** (all four checks green on the clean tree).
- Negative test — a planted expired exception **fails** the gate (exit 1) as designed.
- `tsc --noEmit` — **passed** (0 errors repo-wide).
- `eslint` (changed files) — **passed**.

## Rollout Plan

Merge to `main`. The workflow then runs on every governance-touching PR. No
runtime rollout. Branch protection can add "Context corpus governance gate" as a
required check once observed green on a few PRs.

## Rollback Plan

Revert this PR. CI/tooling only; no migrations, no data, no runtime path.

## Audit Evidence

- PR URL + CI run. Gate doc + exception file + unit tests. Brief + PR-0..PR-3.

## Known Gaps

The agent-readiness check is a static grep that catches the literal `agent_ready`
mint outside the contract; the runtime guarantee that bundles are built only via
`buildValidatedAgentContextBundle` lands in PR-5, after which the check can be
tightened to require that call site. Live tenant-coverage/readiness numbers come
from the ACA-job reports (PR-6).
