# 2026-07-20-phase-gate-fabrication-fix — Remove deliverable fabrication from phase-gate-approval

## Release ID

`2026-07-20-phase-gate-fabrication-fix`

## Status

`candidate`

## Plain-English Summary

A real Strategic Move ("MEMBER AI ASSIST") advanced from Phase 3 to Phase 4 with zero
real P3 deliverables ever generated. Root cause: `POST /api/v1/programs/:id/phase-gate-approval`
called a helper, `preparePhaseGateApprovalRecords`, that — for every phase, unconditionally —
created a placeholder `deliverables_v2` row (content: literally `"P{phase} gate approval
record\n\n{rationale}"`, no real generated content) under a hardcoded, stale type-key map, then
immediately signed it off, all *before* the real gate check (`evaluateGate`) ever ran. For P3 the
map's keys (`design_spec`, `requirements_traceability`) no longer match anything the real
orchestrator produces (it now emits `target_state_architecture` / `solution_design` /
`operating_model_design` / `sourcing_strategy`), so the fabricated row was the *only* row that
could ever exist under those keys — `evaluateGate`'s hard checks genuinely, correctly found this
fabricated evidence and passed. This was never a gate bypass or an override; it was a real
hard-gate pass on manufactured evidence. The route's own "(override)" label on this event
reflected only leftover *soft* criteria being carried forward — a separate, pre-existing labeling
issue, not a true bypass (tracked separately; see Known Gaps).

This release deletes the fabrication path entirely. The route no longer creates or signs off any
deliverable. `evaluateGate` (already hardened this session — role-approval bar in PR #5141,
completed-module requirement for free-text fallbacks in PR #5154) is now the single, authoritative
check against real `deliverables_v2` rows, with nothing duplicating or short-circuiting it.

## Layer Impact

- **global-control-lane**: `phase-gate-approval` is the shared, tenant-agnostic Strategic Moves
  phase-gate approval endpoint used by every client's Moves workspace. This change affects gate
  evaluation behavior for all tenants identically — no tenant-specific logic touched.

## Client Applicability

- All clients: Yes — every tenant's Moves phase-gate approval now requires a real, generated,
  signed-off deliverable (or real completed-module fallback) instead of a fabricated placeholder.
- Specific clients: None
- Internal only: No
- Public/demo only: No
- Feature flag: None — this is a correctness fix to always-on gate logic, not a new capability.

## Changes Included

- `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts`: deleted
  `PHASE_GATE_DELIVERABLES` map and `preparePhaseGateApprovalRecords()`; removed the
  `ensurePhaseGateDeliverable`/`signOffDeliverable` imports; the P0→P1 sponsor-authority grant
  (`ensureSponsorAuthorityForApprover`, unrelated to fabrication) is preserved as-is; `evaluateGate`
  is now called directly with no deliverable mutation beforehand.
- `src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts`: new test file
  (this route had zero prior automated coverage, which is directly why the fabrication bug shipped
  and ran undetected). Covers: hard-gate-failure block with no fabrication side effect, genuine
  gate-pass advance, soft-carry `override` labeling, capture-incomplete block, already-approved
  short-circuit, P0 delegation to `closeP0OnApproval` (both success and blocked), and
  permission-denied.

## QA / Validation

- `npx jest "src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts"` — 8/8 passed.
- `npx eslint "src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts" "src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts"` — 0 errors.
- `git diff --check` — clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass (after this record was added).
- No live phase transition was run against production data for this change, per explicit
  instruction after the incident — verification is unit/integration-test-only.

## Rollout Plan

Standard PR → CI → squash merge to `main` → `aca-main-deploy.yml` builds and deploys the shared
web image to `ca-abarva-web-lab-eastus` → 100% traffic shift → ACA runtime-invariant verification
(template image digest = 100%-traffic revision digest) → signed-in browser smoke check that the
`phase-gate-approval` GET/POST endpoints still respond correctly for a non-mutating read (no new
live phase transition attempted on a real Move; see QA/Validation).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged by this PR)
- Shared runtime mutators: none — no `az containerapp` commands run manually for this change
- Approved image digest: set by the deploy workflow at merge time; verified post-deploy
- ACA runtime invariant: verified post-deploy (template image = 100%-traffic revision image)
- Worker image invariant: not applicable — no worker job image changed
- Feature/env flag update path: not applicable — no flag involved
- Live signed-in proof required: yes, read-only endpoint smoke check only (no phase transition)

## Rollback Plan

Revert this PR. The prior fabrication behavior would return, but no data migration is involved —
this is a pure code revert. If a rollback is ever needed, prefer instead re-deploying the
previously approved digest via the standard ACA rollout path rather than reintroducing the
fabrication code, since the fabrication path is the confirmed root cause of a real production
incident and must not be resurrected even temporarily.

## Audit Evidence

- This release record.
- PR (to be opened) with the diff and CI run link.
- New test file: `src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts`.
- Prior incident context: PR #5154 (free-text hard-check hardening — real and valuable, but does
  **not** by itself close the path that caused the MEMBER AI ASSIST incident; that correction was
  made explicitly to the user after this deeper root cause was found).

## Known Gaps

- The route's `override: carried.length > 0` label (and the equivalent computation in
  `advance/route.ts`'s `overrode`) still conflates "soft criteria were carried forward" with "a
  human explicitly invoked and authorized an override." This is real but is being addressed as its
  own follow-on item (governed override mechanism: explicit role, mandatory reason, named approver,
  timestamp, immutable audit record, optional second approval for hard-gate overrides) — not
  bundled into this PR so this fix stays reviewable as a single, narrow root-cause correction.
- `PhaseApproveAndBuild.tsx` / `MovesPhaseStandaloneClient.tsx`'s `approvePhaseGateAfterBuild()`
  currently calls the gate-approval endpoint as soon as generation jobs are *queued*, not once they
  have actually completed. This fix makes the server-side gate check itself impossible to fool with
  fabricated evidence, but the asynchronous queue-vs-approve sequencing gap in the UI is a separate,
  still-open item (decouple `onBuildQueued` from job completion) tracked as its own follow-on.
  Callers hitting the gate immediately after queueing will now correctly receive `gate_blocked`
  (409) instead of a false pass, since there is no fabricated evidence left to paper over the wait.
- A second, related but distinct free-text loophole was found during this fix's verification pass:
  `phase-capture/route.ts` still creates `deliverables_v2` rows under the same stale type keys
  (`design_spec`, `requirements_traceability`, etc.) populated with the user's own raw capture text,
  and `governance.ts`'s `findDeliverable()` still accepts those stale keys as valid gate evidence.
  The current primary Moves UI (`PhaseDocumentsPanel.tsx`) does not expose a sign-off action on
  these rows, so this is not reachable through the path that caused the MEMBER AI ASSIST incident —
  but the generic `/deliverables/:id/sign-off` route performs no type-key validation, so it remains
  a latent second path to the same class of bug. Flagged as a separate follow-on task, not bundled
  into this PR.
