# 2026-07-20-honest-override-labeling — Stop labeling normal soft-carry passes as "override"

## Release ID

`2026-07-20-honest-override-labeling`

## Status

`candidate`

## Plain-English Summary

Part of the Phase Advancement Control and Override Governance program (follow-up to the MEMBER
AI ASSIST incident audit). The Phase Gate Decision Record (`gate-override-artifact.ts`) collapsed
two very different situations into a single `override: boolean` field, rendered in the artifact
title as `(override)` whenever ANY soft (non-blocking) gate criterion was unmet — even though every
HARD (blocking) criterion had genuinely passed. This is exactly what made the MEMBER AI ASSIST
incident record read "Phase Gate Decision — P3 → P4 (override)", which looked like a human had
explicitly bypassed a gate. No such bypass occurred, or was even possible: neither
`phase-gate-approval/route.ts` nor `advance/route.ts` implements a working hard-gate bypass — both
unconditionally 409-block on any hard-severity check regardless of any bypass flag sent. The label
was simply wrong for what a soft-carry pass actually is.

This release splits the single `override` field into two honestly-named, orthogonal concepts:

- `softGapsCarried: boolean` — a normal, hard-gate-clean pass with an unmet optional criterion
  acknowledged and carried forward. Never rendered as "override" anywhere.
- `hardGateOverride: HardGateOverrideRecord | null` — reserved exclusively for a genuine, explicit,
  authorized bypass of a blocking criterion. Always `null` today, since no code path can produce a
  non-null value (hard checks always block in both routes). The shape exists so that if a
  deliberately designed, governed hard-override capability (explicit role, mandatory reason, named
  approver, timestamp, immutable audit record, optional second approval) is ever built, it has an
  honest place to record itself — this release does not build that capability, only the honest
  vocabulary for it.

Also fixed in the same pass: a stale integration test (`phase-capture-gate-routes.test.ts`) still
asserted the OLD, now-removed fabrication behavior from the companion fix
(`2026-07-20-phase-gate-fabrication-fix.md`, PR #5158) — it expected `ensurePhaseGateDeliverable`
to be called for the P5 terminal Tower handoff. Updated to assert the correct current behavior
(no deliverable mutation, `evaluateGate` is the sole check).

## Layer Impact

- **global-control-lane**: the Phase Gate Decision Record and both phase-advancing routes
  (`phase-gate-approval`, `advance`) are shared, tenant-agnostic Strategic Moves infrastructure.
  This changes the response/artifact field names and title/description language for all tenants
  identically — no tenant-specific behavior.

## Client Applicability

- All clients: Yes
- Specific clients: None
- Internal only: No
- Public/demo only: No
- Feature flag: None

## Changes Included

- `src/lib/programs/deliverables/gate-override-artifact.ts`: replaced `override: boolean` with
  `softGapsCarried: boolean` + `hardGateOverride: HardGateOverrideRecord | null`; rewrote the
  artifact HTML disposition banner/title/description/status logic to reserve "override" language
  exclusively for a genuine hard-gate override; added a `HardGateOverrideRecord` type (unused by
  any current call site, by design) and a module comment documenting why.
- `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts`: updated its
  `saveGateDecisionArtifact` call to the renamed fields (`softGapsCarried`, `hardGateOverride: null`
  — this route has no bypass mechanism at all).
- `src/app/api/v1/programs/[programId]/advance/route.ts`: updated its `saveGateDecisionArtifact`
  call and JSON response (`gateDecision.override` → `gateDecision.softGapsCarried` +
  `gateDecision.hardGateOverride: null`); added a comment clarifying `bypassGate` never lets a hard
  check through (the unconditional 409 already ran before this point).
- `src/lib/programs/origination-close.ts`: updated its `saveGateDecisionArtifact` call to the
  renamed fields.
- `src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts`: updated
  assertions to the renamed fields.
- `src/__tests__/integration/programs/phase-capture-gate-routes.test.ts`: fixed a stale P5
  terminal-handoff assertion that still expected the removed deliverable-fabrication call; now
  asserts `ensurePhaseGateDeliverable`/`signOffDeliverable` are never called and `evaluateGate` is.

## QA / Validation

- `npx jest` on the phase-gate-approval route test, the advance route test, and the
  phase-capture-gate-routes integration test — 19/19 passed.
- Confirmed via `git stash` A/B comparison: baseline (pre-change) had 22 failed suites / 42 failed
  tests across `src/lib/programs/__tests__`, `src/app/api/v1/programs/[programId]`, and
  `src/__tests__/integration/programs`; with this change, 21 failed / 41 failed — exactly the one
  stale test fixed, zero new failures. The remaining 21 failing suites are pre-existing and
  unrelated (confirmed identical failure set with and without this change).
- `npx eslint` on all six changed files — 0 errors.
- `git diff --check` — clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass (after this record was
  added).
- No live phase transition was run against production data, per the standing constraint from the
  incident follow-up.

## Rollout Plan

Standard PR → CI → squash merge to `main` → `aca-main-deploy.yml` builds and deploys the shared web
image → 100% traffic shift → ACA runtime-invariant verification → signed-in browser smoke check
that a Phase Gate Decision Record renders correctly (no phase transition attempted on a real Move).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged by this PR)
- Shared runtime mutators: none
- Approved image digest: set by the deploy workflow at merge time; verified post-deploy
- ACA runtime invariant: verified post-deploy
- Worker image invariant: not applicable
- Feature/env flag update path: not applicable
- Live signed-in proof required: yes, read-only smoke check only (no phase transition)

## Rollback Plan

Revert this PR. Pure relabeling/field-rename with no data migration — any existing
`phase_gate_decision` artifacts already written under the old `override` metadata key remain
readable (this change only affects newly written records); a revert simply reverts new records to
the old, less-honest labeling.

## Audit Evidence

- This release record.
- PR (to be opened) with the diff and CI run link.
- Companion fixes: `docs/releases/records/2026-07-20-phase-gate-fabrication-fix.md` (PR #5158),
  `docs/releases/records/2026-07-20-decouple-build-queue-approve.md` (PR #5159).

## Known Gaps

- This release makes the ABSENCE of a hard-gate override honestly visible; it does not build a new
  hard-gate override capability. Whether AbarVa should ever offer one (with the full governance
  spec: explicit authorized role, mandatory reason, named approver, timestamp, immutable audit
  record, optional second approval) is a deliberate product/security decision that needs its own
  design conversation before implementation — flagged separately, not decided here.
- The full 8-scenario regression suite spanning all phase-advancement endpoints (pending generation,
  failed generation, missing deliverable, incomplete approvals, normal gate failure, unauthorized
  override, authorized override, misleading override labeling) is tracked as a separate follow-on
  item; this PR covers the "misleading override labeling" scenario specifically.
- The stale-type-key free-text loophole found in `phase-capture/route.ts` (see the fabrication-fix
  record's Known Gaps) remains a separate, flagged follow-on item.
