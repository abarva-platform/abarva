# 2026-07-20-phase-capture-evidence-integrity — Close the phase-capture free-text gate-deliverable loophole

## Release ID

`2026-07-20-phase-capture-evidence-integrity`

## Status

`candidate`

## Plain-English Summary

Second, independent instance of the exact defect class fixed in
`docs/releases/records/2026-07-20-phase-gate-fabrication-fix.md` (PR #5158), found during the
required audit follow-up ("Phase Capture Evidence Integrity" — the next bug backlog item named by
the user after closing the Phase Advancement Control program).

`phase-capture/route.ts` auto-created a real, gate-satisfying `deliverables_v2` row (type key
`design_spec`, `requirements_traceability`, etc. — all genuinely registered deliverable types, not
stale keys) the moment a phase's capture sections were filled in, using nothing but the user's raw
capture-field text concatenated into markdown. That row was left `in_review`, one call away from
being flipped to `signed_off` by the generic sign-off route
(`deliverables/[deliverableId]/sign-off/route.ts`), which accepted ANY in_review/draft deliverable
from ANY authorized approver with no check on how its content was produced. Once signed off, a hard
gate check reading real `deliverables_v2` evidence would pass on content that was never generated,
reviewed, or deliberately authored — the same MEMBER AI ASSIST incident shape, via a second door.

Unlike the earlier incident, this exact path was not confirmed exploited in production — it is
fixed here as a proven, reachable latent defect (traced end-to-end through real code, not
hypothesized), per the user's explicit instruction: "Even though the current UI does not expose the
full exploit path, a latent route that can create stale-key deliverables from free text and later
allow generic sign-off is still an evidence-integrity problem."

## Root cause

1. `phase-capture/route.ts` called `ensurePhaseGateDeliverable` for every phase's required gate
   deliverables once capture sections were complete, tagging the created row's content
   `structured_data.source: "phase_capture"` — correctly labeling its own provenance, but nothing
   downstream ever checked that label.
2. The generic sign-off route flipped any `in_review`/`draft` row to `signed_off` given only
   approver authority — no check that the deliverable's type key is one the codebase actually
   produces, and no check on the content's provenance.
3. `governance.ts`'s hard checks read `deliverables_v2` by type key alone (`findDeliverable(...)`
   alias matching), so a signed-off capture-text row satisfied the same checks real generated
   evidence would.

## Fix

1. `phase-capture/route.ts` no longer creates any `deliverables_v2` row. Capture text persists only
   as `program_modules` state — informing the workspace and generation context (and the existing
   `phaseCaptureText` free-text fallback checks in `governance.ts`), never itself a signable gate
   artifact. The route's stale `PHASE_GATE_DELIVERABLES` map is deleted entirely (its own comment,
   "Approve is gated on a deliverableId the Save response never returned," was confirmed stale: the
   real approval route (`phase-gate-approval/route.ts`, fixed in PR #5158) and the client
   (`MovesPhaseStandaloneClient.tsx`) never consume the response's `deliverableId` field).
2. `deliverables/[deliverableId]/sign-off/route.ts` adds two independent, defense-in-depth checks
   before any sign-off:
   - **Recognized type key** — the deliverable's type key must be in `RECOGNIZED_DELIVERABLE_TYPE_KEYS`,
     the union of the orchestrator's `DELIVERABLE_REGISTRY` and the agent-authored
     `ALLOWED_PROGRAM_DELIVERABLE_TYPES` (completeDeliverable.ts). An unrecognized key is rejected
     with `unsupported_artifact_type` (422). A small number of legacy alias keys `governance.ts`
     still recognizes for historical Moves (`program_seed_brief`, `program_seed`,
     `discovery_synthesis`, `discovery_findings`, `approval_business_case`,
     `mobilization_handoff_package`, `mobilization_package`, `benefits_realization_plan`,
     `value_contract`) are deliberately NOT included — if a real historical row under one of those
     keys ever needs signing off, that should be a one-line, auditable addition, not a silent
     allowance made without knowing whether any such row exists in production.
   - **Provenance** — for the plain JSON-body approval path (not a file upload), the deliverable's
     current `deliverable_versions` row is checked; if its `structured_data.source === 'phase_capture'`,
     sign-off is rejected with `capture_text_not_signable` (422). The file-upload approval path is
     unaffected — it already creates a new, properly-sourced `client_approved_upload` version, which
     remains the correct way to promote a capture-derived deliverable to real evidence.

## Layer Impact

- **global-control-lane**: shared Strategic Moves phase-capture and deliverable sign-off routes.
  Behavior change: `phase-capture` no longer creates any `deliverables_v2` row (confirmed no
  consumer depended on the removed response fields); sign-off now rejects two classes of request it
  previously silently accepted.

## Client Applicability

- All clients: N/A (no client-specific behavior; no feature flag)

## Changes Included

- `src/app/api/v1/programs/[programId]/phase-capture/route.ts`: removed
  `PHASE_GATE_DELIVERABLES`/`ensurePhaseGateDeliverable` deliverable-creation block and the now-stale
  `deliverableId`/`deliverableIds`/`recordCreated`/`recordError` response fields.
- `src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route.ts`: added the
  recognized-type-key and capture-provenance checks described above.
- `src/__tests__/integration/programs/phase-capture-gate-routes.test.ts`: new regression test
  proving P3 capture completion never creates a `deliverables_v2` row and never calls
  `ensurePhaseGateDeliverable`/`signOffDeliverable`.
- `src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/__tests__/route.test.ts`
  (new file): 4 tests — rejects an unrecognized type key, rejects capture-derived provenance on a
  legitimately-registered type key (the exact exploit shape), signs off a normal recognized/real
  deliverable, and confirms authority is still checked before either new guard runs.

## QA / Validation

- `npx jest src/__tests__/integration/programs/phase-capture-gate-routes.test.ts` — 7/7 passed (6
  existing + 1 new).
- `npx jest` (sign-off route test) — 4/4 passed, all new.
- Broad sweep (`src/lib/programs/__tests__`, `src/app/api/v1/programs/[programId]`,
  `src/__tests__/integration/programs`) shows the same 21 pre-existing, unrelated failing suites as
  every prior PR this session — zero new failures; none of the failing suites reference
  `phase-capture` or `sign-off`.
- `npx eslint` on all changed/new files — 0 errors.
- `git diff --check` — clean.
- Local `tsc -p tsconfig.json --noEmit` crashes on this machine (known, pre-existing environment
  issue — see `feedback_typecheck_workflow_artifact.md`); CI's "Typecheck + reasoning-layer tests"
  check is authoritative.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass (after this record was
  added).
- No live phase transition or production data mutation was run to verify this — proven entirely via
  unit/integration tests, consistent with the standing constraint from the incident audit.

## Rollout Plan

Standard PR → CI → squash merge to `main` → ACA deploy → runtime-invariant verification.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged by this PR)
- Shared runtime mutators: none
- Approved image digest: set by the deploy workflow at merge time; verified post-deploy
- ACA runtime invariant: to be verified post-deploy
- Worker image invariant: not applicable
- Feature/env flag update path: not applicable
- Live signed-in proof required: read-only health check only. This PR closes a *latent* path
  (unreachable through the current primary UI, per the earlier incident audit's finding that no UI
  surface currently exposes signing off a phase-capture-created deliverable) — there is no existing
  UI flow to click through, and per the incident's own constraint, no live phase-transition testing
  should be performed against production data.

## Rollback Plan

Revert this PR. `phase-capture` would resume creating gate-satisfying deliverables from raw capture
text, and sign-off would resume accepting any type/provenance — reintroducing the same defect class.
Revert only if the new sign-off guards are found to incorrectly block a genuine, real deliverable
sign-off in production; if so, the fix is to extend `RECOGNIZED_DELIVERABLE_TYPE_KEYS` or narrow the
provenance check, not to revert wholesale.

## Audit Evidence

- This release record.
- PR (to be opened) with the diff and CI run link.
- Companion fixes from the same incident-audit program:
  `docs/releases/records/2026-07-20-phase-gate-fabrication-fix.md` (PR #5158),
  `docs/releases/records/2026-07-20-decouple-build-queue-approve.md` (PR #5159),
  `docs/releases/records/2026-07-20-honest-override-labeling.md` (PR #5160),
  `docs/releases/records/2026-07-20-phase-advancement-regression-suite.md` (PR #5161),
  `docs/incidents/2026-07-20-member-ai-assist-p4-phase-integrity-disputed.md` (PR #5162).

## Known Gaps

- The provenance check only distinguishes `phase_capture`-sourced content from everything else. It
  does not yet enforce a positive artifact-contract check (e.g., that a `design_spec` deliverable's
  content actually covers the `DELIVERABLE_REGISTRY` entry's required sections) for content sourced
  any other way — that is a broader "content must meet the artifact contract, not merely be
  non-empty" investment the user flagged as future work, not undertaken here to keep this fix
  narrowly scoped to the proven defect.
- `RECOGNIZED_DELIVERABLE_TYPE_KEYS` deliberately excludes 9 legacy alias keys `governance.ts` still
  recognizes for historical Moves. If a real production row under one of those keys is ever found
  awaiting sign-off, extending the allowlist is a one-line, documented fix — not done speculatively
  here without visibility into whether any such row exists.
