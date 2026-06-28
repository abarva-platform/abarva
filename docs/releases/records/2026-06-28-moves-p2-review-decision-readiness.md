# 2026-06-28-moves-p2-review-decision-readiness — Moves P2 Review Decision Readiness

## Release ID

`2026-06-28-moves-p2-review-decision-readiness`

## Status

`candidate`

## Plain-English Summary

Adds the human review decision step between a P2 review package and P3 draft shaping. A reviewer can approve the P2 diagnostic for P3 draft work, request revisions, or hold for evidence. Approval opens only P3 draft readiness; it does not mark P2 final, does not approve P3 final, and does not bypass sponsor/signoff gates.

## Layer Impact

- `global-control-lane`: Adds shared Moves review-decision behavior and File Cabinet readiness display for all clients using the Moves artifact vault.
- `client-data-lane`: Extends the Moves review-decision table with nullable artifact-package pointers so decisions can cite the HTML visual companion and DOCX editable deliverable that were reviewed.

## Client Applicability

- All clients: Yes, for Moves review-decision behavior.
- Specific clients: Lakeshore is the live proof tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/deliverables/artifact-review-decisions.ts`
- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/review-decision/route.ts`
- `src/components/strategic-moves/FileCabinetPanel.tsx`
- `supabase/migrations/20260628180500_move_artifact_review_decision_package_ids.sql`
- Focused route and library tests for package IDs and readiness separation.

## QA / Validation

Candidate validation to run before release:

- Focused Jest for artifact review decisions and review-decision route.
- Scoped ESLint on changed TypeScript files.
- TypeScript check where feasible.
- `npm run release:check`.
- Azure/Postgres migration apply proof.
- Signed-in Lakeshore live proof: readiness before/after, persisted decision, P3 draft allowed, P3 final blocked.
- Signed-in wrong-tenant negative proof.

## Rollout Plan

Merge to `main`, deploy through the approved Azure Container Apps main lane, apply the non-destructive migration through the approved Azure/Postgres path, then run signed-in Lakeshore proof on `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: Azure Container Apps web image and approved Azure/Postgres migration path.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: To be captured after deploy.
- Worker image invariant: No worker-specific behavior changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Runtime rollback: shift ACA traffic back to the prior healthy revision. Data rollback is not required for normal rollback because the migration only adds nullable columns and indexes. If absolutely required, columns can be left unused until a later explicit cleanup migration.

## Audit Evidence

To be attached after live proof:

- PR URL and CI run.
- Deploy run, ACA revision, image digest, and health proof.
- Migration apply log.
- Signed-in Lakeshore screenshots/API payloads.
- Wrong-tenant screenshots/API payloads.
- Downloads proof bundle.

## Known Gaps

This release does not generate full P3/P4/P5 artifacts and does not mark P2 final. It only records the human decision that can allow P3 draft shaping while final gates remain honest.
