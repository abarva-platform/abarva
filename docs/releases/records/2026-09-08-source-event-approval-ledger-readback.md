# 2026-09-08-source-event-approval-ledger-readback — Source Event Approval Ledger Readback

## Release ID

`2026-09-08-source-event-approval-ledger-readback`

## Status

`candidate`

## Plain-English Summary

This release strengthens the Source event approval path by reading the approval ledger from the column the database actually stores (`approved_at`) and adding an operator verification script that proves a synthetic Source event can be approved, advanced, and read back through the same code path used by the product.

## Layer Impact

`global-control-lane`: Source event approval receipt display and DB migration proof are shared control-plane behavior for all Source users.

Layer 3 canonical/governance persistence: Source event approval receipts remain stored in the append-only `source_event_approvals` ledger.

Layer 4 product substrate: approval pages can display persisted approval history using the correct timestamp field.

Operational proof layer: the lab migration workflow gains a repository readback that verifies the approval ledger is usable, not merely present in migration history.

## Client Applicability

- All clients: yes, for Source event approval ledger display and verification.
- Specific clients: none.
- Internal only: the new verifier uses a synthetic non-client fixture tenant and is for operator proof.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/approval-ledger.ts` maps database `approved_at` into the ledger model timestamp.
- `src/lib/source/__tests__/approval-ledger-loader.test.ts` covers the timestamp mapping and query order.
- `src/lib/source/verify-event-approvals-readback.ts` creates a synthetic event, runs `applyApproval`, advances the stage, and reads the ledger back.
- `package.json` adds `db:verify:source-event-approvals`.
- `.github/workflows/db-migration-lab.yml` runs the new verifier during `mode=apply`.

## QA / Validation

Pass:

- Focused Jest for the approval ledger loader.
- Source approval route and migration regression tests.
- TypeScript compile.
- ESLint on touched files.
- `npm run release:check`.

Blocked:

- Signed-in approval-button proof could not be captured because the available browser session was missing or expired.

## Rollout Plan

Open a PR, squash merge to `main`, and let the repo-owned Azure Container Apps deploy workflow build and deploy the application image. The new migration-workflow verifier becomes active the next time the governed DB migration workflow runs in `mode=apply`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, an authenticated Source approval click should still be captured for any client-demo claim.

## Rollback Plan

Revert the PR to restore the previous ledger loader and remove the new verifier from the migration workflow. No schema rollback is required.

## Audit Evidence

After release, inspect the PR, GitHub Actions checks, ACA deploy run, runtime invariant output, and the next DB migration workflow apply artifact containing `event-approvals-readback`.

## Known Gaps

Signed-in Source approval UI proof is still required. The current browser session was missing or expired during this work, so this candidate does not claim a live approval-button proof.
