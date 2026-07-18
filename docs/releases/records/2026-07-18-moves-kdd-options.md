# 2026-07-18-moves-kdd-options — Moves Key Design Decision Options

## Release ID

`2026-07-18-moves-kdd-options`

## Status

`candidate`

## Plain-English Summary

Moves can now record a Key Design Decision as a structured set of selected and rejected options. The decision record is attached to the existing decision-thread dossier for the Move, so the team can later see what was chosen, what was not chosen, and why.

## Layer Impact

- `client-data-lane`: Adds the tenant-scoped `decision_thread_options` table with RLS policies that follow the existing decision dossier tenancy model.
- `global-control-lane`: Adds a shared Moves gate-step action, API route, and dossier rendering so every tenant can use the same KDD structure after the migration is applied.

## Client Applicability

- All clients: Available wherever Moves decision dossiers are enabled after deployment and migration application.
- Specific clients: Meridian Health is the intended smoke tenant for this slice.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- Migration: `supabase/migrations/20260718161000_decision_thread_options.sql`
- API route: `src/app/api/v1/programs/[programId]/decision-options/route.ts`
- Decision helper: `src/lib/decisions/auto-linker.ts`
- Moves UI: `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- Dossier UI: `src/app/(maestro)/admin/dossiers/page.tsx`, `src/app/(maestro)/dossier/[threadId]/page.tsx`
- Test: `src/lib/decisions/__tests__/auto-linker-options.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/decisions/__tests__/auto-linker-options.test.ts src/lib/programs/__tests__/origination-submit-contract.test.ts --runInBand`
- Pass: `npx jest src/lib/decisions src/lib/programs/__tests__/origination-submit-contract.test.ts --runInBand`
- Pass: `npx eslint src/lib/decisions/auto-linker.ts src/lib/decisions/__tests__/auto-linker-options.test.ts src/app/api/v1/programs/[programId]/decision-options/route.ts src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/app/(maestro)/admin/dossiers/page.tsx src/app/(maestro)/dossier/[threadId]/page.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending: signed-in browser crawl after merge, migration, and ACA deployment.

## Rollout Plan

Merge by PR to `main`, apply the database migration through the approved migration path, then deploy through the repo-owned Azure Container Apps main workflow. After deployment, run a signed-in Meridian smoke: record three KDD options on a Move gate step, verify the options save, open the dossier, and confirm selected/rejected options render correctly.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared web runtime.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending ACA deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR to remove the UI/API/helper reads. If no production decision options have been written, the migration can be rolled back by dropping `decision_thread_options`; otherwise leave the table dormant until data retention is reviewed.

## Audit Evidence

- PR URL: Pending.
- Merge SHA: Pending.
- ACA deployment proof: Pending.
- Browser proof bundle: Pending.

## Known Gaps

- This slice does not make KDD capture mandatory for gate approval.
- This slice does not add the Phase Intelligence tab.
- This slice does not author the healthcare Contact Center Agent Assist Function Pack.
