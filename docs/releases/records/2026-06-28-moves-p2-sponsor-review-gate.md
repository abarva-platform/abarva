# 2026-06-28-moves-p2-sponsor-review-gate — Moves P2 Sponsor Review Gate

## Release ID

`2026-06-28-moves-p2-sponsor-review-gate`

## Status

`candidate`

## Plain-English Summary

Moves premium artifacts now have an explicit sponsor-review decision path. A P2 diagnostic can be approved for P3 draft shaping, sent back for revisions, or held for missing evidence without pretending the P2 artifact is final or bypassing sponsor/signoff gates.

## Layer Impact

- `global-control-lane`: Adds shared Moves review-decision behavior, API, UI, and P3 draft-readiness logic for all tenants.
- `client-data-lane`: Adds a non-destructive review-decision table keyed by tenant, move, phase, artifact, and version. Existing artifact rows are not modified or purged.

## Client Applicability

- All clients: Yes, for Moves premium phase artifacts.
- Specific clients: Live proof targets the Lakeshore P2 diagnostic move first.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Migration: `supabase/migrations/20260628160000_move_artifact_review_decisions.sql`
- API: `/api/v1/programs/:programId/artifacts/:artifactId/review-decision`
- UI: File Cabinet sponsor-review packet and decision controls.
- Gate logic: P3 draft generation can proceed only when P2 has an explicit `approve_for_p3_draft` decision; P3 final remains blocked by normal gates.
- Tests: phase guard and review packet/decision mapping.

## QA / Validation

Planned for this release candidate:

- Focused Jest for `assert-phase-ready` and `artifact-review-decisions`.
- TypeScript validation.
- Scoped ESLint on touched files.
- `npm run release:check`.
- Live signed-in proof after ACA deployment: P2 packet visible, P2 artifact opens, decision persists, P3 draft readiness true, P3 final readiness false, and wrong-tenant access blocked.

## Rollout Plan

Merge to main, apply the migration through the approved Azure/Postgres path, build the exact main SHA image through ACR, deploy to `ca-abarva-web-lab-eastus`, assign 100% traffic to the healthy revision, then run signed-in Lakeshore and wrong-tenant proof.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps release lane.
- Shared runtime mutators: Migration applies one additive table and RLS policies.
- Approved image digest: To be recorded after ACR build.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` must run the digest-pinned image for the merged SHA.
- Worker image invariant: No worker image change required.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Roll back ACA traffic to the prior healthy revision if UI/API behavior regresses. The migration is additive; if rollback is required, leave the table unused rather than dropping production audit data. A later explicit cleanup migration may remove the table only after approval.

## Audit Evidence

To be completed after validation and deployment:

- PR URL
- Commit SHA
- ACA revision
- Image digest
- Test output
- Live screenshots/API payloads
- Wrong-tenant proof

## Known Gaps

P2 final sponsor/signoff approval remains intentionally out of scope. This release only opens an audited path from review-ready P2 diagnostic to P3 draft shaping.
