# 2026-06-09-ws-d-derived-answerability — Derived answerability (WS-D)

## Release ID

`2026-06-09-ws-d-derived-answerability`

## Status

`candidate`

## Plain-English Summary

Removes the hardcoded answerability constants (every question was tagged
`PARTIALLY_ANSWERABLE` regardless of data) and replaces them with a status
DERIVED from measured pipeline state — loaded → indexed → retrievable → cited →
claim-supported. Each status carries a plain reason and a remediation lane, so a
report can say *why* a question is or isn't answerable and *what to load/fix*.
The question banks now carry only an honest pre-run hypothesis (`NOT_TESTED`, or
`NOT_LOADED` for designed negative tests); the live run computes the real status.

## Layer Impact

- `global-control-lane`: new pure library `src/lib/agent-data-coverage/` and a
  type change in `agent-golden` / `agent-domain-matrix` (answerability now the
  derived status). No runtime/answer-path change.

## Client Applicability

- All clients: Yes. Internal only: status is QA/governance-facing. Flag: none.

## Changes Included

- `src/lib/agent-data-coverage/{answerability,index}.ts` — `deriveAnswerability`,
  `AnswerabilityStatus` (10), `remediationLaneFor`, `isGrounded`.
- `src/__tests__/behaviors/agent-data-coverage.test.ts` — 11 cases.
- `agent-golden/types.ts`, `agent-domain-matrix/types.ts` — alias to the derived
  status; `suites.ts` / `matrix.ts` — constants → `NOT_TESTED` (negatives keep
  `NOT_LOADED`).
- `docs/governance/DERIVED_ANSWERABILITY_2026-06-09.md`.

## QA / Validation

- `npx jest` data-coverage + golden + matrix → 29/29 pass.
- `npx tsc --noEmit` / `npx eslint` → clean on touched files.
- `npm run audit:architecture-rules` / `release:check` / `validate:context-corpus`
  → green.
- Live signals (retrieval/index/cite counts) are fed by the ACA harness; the
  derivation logic is proven locally, the measured values are an ACA run.

## Rollout Plan

Merge to `main` after CI green. No migration. The verification harness imports
`deriveAnswerability` to compute measured statuses on the next ACA run.

## Rollback Plan

Revert the PR. Pure library + type alias; no data effect.

## Audit Evidence

- PR URL: (filled on open). Test log: 29/29.

## Context Ingestion Evidence

Not applicable. No ingestion — this derives a status from already-measured
signals.

## Known Gaps

- Wiring the derived status into the live verification report (replacing the
  per-question hypothesis with the measured status end-to-end) runs in the ACA
  harness; this PR ships the derivation + removes the constants.
