# 2026-09-30-moves-phase-input-grounding — Prevent unsupported later-phase input drafts

## Release ID

`2026-09-30-moves-phase-input-grounding`

## Status

`candidate`

## Plain-English Summary

Moves aVa no longer copies an entire earlier-phase capture into every empty
field in P2–P5 and presents those copies as phase-input proposals. P1 retains
its explicit P0-to-P1 mappings. For later phases, the draft action fails closed
unless phase-specific field mappings exist; it reports whether approved current
phase evidence was found and makes clear that no values were saved.

## Layer Impact

**Release lane: `global-control-lane`.** The behavior applies to the shared
Moves experience for every tenant.

- **Layer 4 (Products):** Moves aVa's phase-input chat and draft endpoint stop
  generating unsupported P2–P5 field proposals. No evidence, phase capture,
  approval, artifact, or gate state is written by this change.
- **Layer 3 (Canonical model):** the existing approved-evidence read is used
  only to report the current phase's evidence count and read availability; no
  canonical object or schema changes.

## Client Applicability

- All clients: yes, wherever Moves phase-input drafting is available
- Specific clients: none
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- Remove generic P2–P5 proposals that duplicated prior-phase text into every
  empty field.
- Preserve the explicitly mapped P0-to-P1 proposal behavior.
- Report current-phase approved-evidence count or an evidence-read failure in
  the no-draft explanation.
- Ground the phase-input prompt contract in reviewed current-phase evidence
  and forbid generic prior-phase carry-forward.
- Add regression tests covering P2–P5, the user-visible no-draft response,
  current-phase evidence counts, and fail-closed evidence-read errors.

## QA / Validation

- **Pass:** planted regression failed against the original behavior in all four
  later phases, showing the same upstream value copied into every proposed
  field.
- **Pass:** 9 targeted suites, 70 tests, including Moves aVa and approved
  evidence retrieval.
- **Pass:** agent chat route suite, 10 suites / 98 tests, including the
  current-phase evidence-read scope and refusal wiring.
- **Pass:** `npm run typecheck` using the repository's guarded TypeScript runner.
- **Pass:** targeted ESLint on all changed TypeScript files.
- **Pass:** CI coverage census check; committed census is current and these
  suites are already owned by workflow commands.
- **Pass:** `git diff --check`.
- **Pass:** `node scripts/release-check.mjs` with `--base origin/main --head HEAD`.
- **Pending:** GitHub CI and deployed signed-in verification.

## Rollout Plan

Merge through a pull request. If checks pass, deploy the exact merge SHA only
through `.github/workflows/aca-main-deploy.yml`, then verify the matching
revision, 100% traffic, worker digest invariant, and the signed-in Moves draft
flow. Do not claim runtime proof until that verification is captured.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside that workflow
- Approved image digest: pending exact merge-SHA deploy
- ACA runtime invariant: pending exact merge-SHA deploy
- Worker image invariant: pending exact merge-SHA deploy
- Feature/env flag update path: none
- Live signed-in proof required: yes; verify P2 reports current approved evidence but offers no unsupported copied field draft

## Rollback Plan

Use a revert pull request for the merged code and the repo-owned ACA deploy
workflow to return to the prior approved digest. No database migration, data
repair, or flag change is required.

## Audit Evidence

- PR and exact merge-SHA deployment records: pending
- Regression tests: `src/lib/programs/__tests__/phase-input-draft-proposals.test.ts`
  and `src/lib/programs/ava-chat/__tests__/packet.test.ts`
- CI logs and signed-in result: pending

## Known Gaps

P2–P5 field-aware evidence-to-capture mapping remains intentionally unavailable.
It should be added only with explicit field lineage, approved-source citations,
and tests that reject unsupported or mismatched field proposals. Current phase
evidence remains available through the evidence summary experience.
