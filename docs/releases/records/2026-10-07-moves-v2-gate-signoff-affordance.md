# 2026-10-07-moves-v2-gate-signoff-affordance — In-workspace gate deliverable sign-off

## Release ID

`2026-10-07-moves-v2-gate-signoff-affordance`

## Status

`candidate`

## Plain-English Summary

In the redesigned Moves phase workspace (v2), crossing a phase gate requires the
gate deliverable to be signed off, but the only control that records that sign-off lived on
the separate Files & Evidence page. A person working inside the phase workspace saw a
"Submit gate approval" action that could not succeed and no way, in that screen, to perform the
sign-off it depended on — a dead-end that only resolved if they happened to know to leave for the
evidence page.

This change adds an in-workspace **gate attestation ledger** to the phase gate step. It lists each
built gate deliverable with its sign-off state (signed off / draft awaiting sign-off / not yet
built / blocked) and mounts the existing sign-off control inline for a draft, so the whole
capture → build → sign-off → submit loop is completable without leaving the workspace. The submit
control now states plainly when it is waiting on a sign-off ("Sign off N document(s) to submit")
instead of appearing actionable and failing.

Presentation and arrangement only: no change to gate criteria, evidence rules, or the sign-off
backend. The sign-off itself reuses the existing deliverable-approval control and its existing
endpoint unchanged.

## Layer Impact

Release lane: **experimental** (feature-flagged, default off; ships only under `moves_workspace_v2`).

- **Layer 4 (Products — Moves):** phase-workspace gate step UI gains the attestation ledger and the
  submit-blocked feedback. A read-only API field is added so the workspace can show sign-off state
  it previously could only see on the evidence page.
- No change to Layers 1–3 (intake, adapters, canonical model). No change to gate evaluation or
  evidence governance.

## Client Applicability

- All clients: no (flag-gated, default off).
- Specific clients: whichever tenants are enrolled in the v2 workspace flag.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_workspace_v2` (the v2 phase-workspace shell this ledger renders inside).
  Flag off ⇒ byte-identical to today.

## Changes Included

- `src/app/api/v1/programs/[programId]/artifacts/route.ts` — expose `deliverableId`,
  `signedOffVersion`, `currentVersion` on generated-deliverable rows, read from the same
  `deliverables_v2` projection the evidence documents panel already uses (non-fatal; empty on read
  failure).
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — thread those three fields into
  the build-artifact type and the gate panel; pass the existing approve-capability flag to it;
  repoint the post-submit blocked message to the in-workspace ledger.
- `src/components/strategic-moves/PhaseApproveAndBuild.tsx` — the attestation ledger (gate
  deliverables only), inline mount of the existing `DeliverableApprovalAction` for a draft, and the
  submit relabel/disable + reason line when a built gate deliverable is unsigned.
- `src/components/strategic-moves/__tests__/phase-approve-and-build-gate-signoff.test.tsx` — new,
  5 cases.
- `docs/architecture/test-ci-coverage-census.json` — regenerated for the new test file.

## QA / Validation

- `npx eslint` on the changed source files: 0 errors (2 pre-existing unrelated warnings in
  `MovesPhaseStandaloneClient` confirmed present at HEAD).
- Full-repo typecheck: clean.
- New suite `phase-approve-and-build-gate-signoff.test.tsx`: 5/5 pass (ledger lists only gate
  deliverables; a draft mounts the sign-off control; submit disabled with the sign-off reason when a
  gate deliverable is unsigned; submit enabled when all signed; non-approvers see state only).
- Full `src/components/strategic-moves/__tests__` directory and the artifacts-route suite: pass.
- Coverage census: regenerated; no drift.

## Rollout Plan

Merge to main (squash). Becomes active only where `moves_workspace_v2` is enrolled, via the normal
ACA main deploy of the merged image. No migration. No data change. No shared-runtime mutation beyond
the standard repo-owned deploy of the new image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none beyond the standard deploy.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: must hold after deploy (template image = 100%-traffic revision = approved
  digest).
- Worker image invariant: unaffected.
- Feature/env flag update path: none required; renders only under the existing `moves_workspace_v2`
  enrollment.
- Live signed-in proof required: yes — confirm the gate step shows the attestation ledger and a
  draft deliverable can be signed off in-workspace for an enrolled tenant.

## Rollback Plan

Revert the PR and redeploy, or disable `moves_workspace_v2` for affected tenants (the ledger renders
only inside that flag). No migration to unwind; the added API fields are read-only and additive.

## Known Gaps

- The ledger surfaces sign-off for gate deliverables only (by design); non-gate working documents
  stay in the read-only build-status list, as no gate check reads them.
- A gate deliverable that is built but carries no `deliverables_v2` projection row renders as
  "unverified" and does not block submission — a deliberate conservative fallback so a missing
  read never permanently blocks a phase; it means sign-off state is shown only where the projection
  exists.
- This change does not address the separate, pre-existing hard-gate content requirements
  (attested baselines, named owners, a cleared discovery report, a validated solution route) — it
  only makes the deliverable sign-off reachable in-workspace. Those gate-content requirements are
  unchanged.
- Live signed-in proof for an enrolled tenant is still owed post-deploy (see Deployment Authority);
  this record is a candidate until that proof is captured.

## Audit Evidence

- PR URL: (to be filled on open).
- CI run: required checks on the PR.
- New test output: 5/5 as above.
- Live proof: signed-in capture of the gate step attestation ledger + an in-workspace sign-off,
  post-deploy.
