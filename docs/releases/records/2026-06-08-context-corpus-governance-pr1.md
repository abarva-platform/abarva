# 2026-06-08-context-corpus-governance-pr1 — Governance policy + canonical contract

## Release ID

`2026-06-08-context-corpus-governance-pr1`

## Status

`candidate`

## Plain-English Summary

PR-1 of the AbarVa-wide Context & Corpus Governance Framework: the canonical policy contract every
context/corpus object must conform to before any agent may use it. Adds the typed `GovernedObject`
model + Zod schema + controlled enums + the `evaluateGovernedObject` gating function (which BLOCKS
the two real defect classes — "loaded but not indexed" and "agent_ready but not cite-render
verified"), the policy doc, both enforcement trackers, and the AGENTS.md governance section so every
agent (Codex, Claude Code, Cursor) is bound by it. Types + policy + docs only — no runtime behavior
change yet (runtime enforcement lands in PR-4 CI validators + PR-5 runtime bundle).

## Layer Impact

**global-control-lane**: a new shared governance library (`src/lib/governance/`) + an `AGENTS.md`
policy section. No data-plane, schema, migration, retrieval, or runtime path change in this PR —
pure types/Zod/policy/docs. The contract iterates `CANONICAL_TENANT_KEYS` (code, not hand-typed).

## Client Applicability

- All clients: defines the governance contract that will apply to every tenant's datasets.
- Not applicable yet at runtime: PR-1 is the contract + docs; enforcement is PR-4 (CI) + PR-5 (runtime).
- Feature flag: none.

## Changes Included

- `src/lib/governance/context-corpus-policy.ts` — `GovernedObject` + Zod + enums + `evaluateGovernedObject`/`isAgentUsable`.
- `src/lib/governance/__tests__/context-corpus-policy.test.ts` — 9 tests (incl. Lakeshore + #3322 traps, PHI-in-corpus, tenant-drift).
- `docs/governance/CONTEXT_CORPUS_POLICY.md`, `…ENFORCEMENT_TRACKER_2026-06-08.md`, `context-corpus-enforcement-tracker.json`.
- `AGENTS.md` — "Context & corpus governance (MANDATORY)" section.

## QA / Validation

- `jest src/lib/governance` — **9/9 passed**.
- `tsc --noEmit` — **passed** (0 errors in changed files).
- `eslint` — **passed** on changed files.

## Rollout Plan

Merge to `main`. No runtime rollout — types/policy/docs only; nothing deploys or changes behavior.

## Rollback Plan

Revert this PR. No migrations, no data, no runtime path touched — pure revert.

## Audit Evidence

- PR URL + CI run.
- `docs/governance/CONTEXT_CORPUS_GOVERNANCE_BRIEF_2026-06-08.md` (PR sequence) + PR-0 (#3328).

## Known Gaps

Enforcement is not yet active at build/runtime — PR-4 wires the CI validators + workflow, PR-5 the
runtime bundle filter. The large taxonomies (industry/function/process_area/use_case_category) are
required-non-empty strings here; closing them to ratified enums is a tracked follow-up.
