# 2026-06-30-source-ava-artifact-context-binding — Source aVa Artifact Context Binding

## Release ID

`2026-06-30-source-ava-artifact-context-binding`

## Status

`candidate`

## Plain-English Summary

Source aVa now sees the Source evidence and generated artifacts that belong to the active sourcing event. Before this release, non-Apex live Source events answered mostly from the `source_events` intake row, so aVa could say evidence was missing even after documents had been uploaded and parsed. This release binds the event's Source artifact registry rows, parsed chunks, and parsed facts into the same event advisor context.

## Layer Impact

- `global-control-lane`: Updates shared Source aVa event-answer context binding for all tenants using `/api/v1/source/[eventId]/nexus/ask`.
- No schema, RLS, migration, tenant seed, or raw document browsing change.

## Client Applicability

- All clients: Source event aVa answers can use tenant-scoped Source event artifacts as sourcing-stage evidence.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
- `docs/releases/records/2026-06-30-source-ava-artifact-context-binding.md`

## QA / Validation

- `npx eslint src/app/api/v1/source/[eventId]/nexus/ask/route.ts` — passed.
- `npx tsc --noEmit --pretty false` — blocked by pre-existing unrelated missing declarations for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`; no new Source route TypeScript error was surfaced before those baseline failures.
- Live proof planned after deploy on SkyHarbor Source event `e64177a2-e75b-4604-8584-fa60386225ae` by asking Source aVa what blocks D09 release, what vendors must provide, and what changed after the AMS evidence pack was loaded.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, wait for the new healthy revision, assign 100% traffic to it, and run signed-in SkyHarbor Source aVa proof.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: none outside the normal deploy workflow.
- Approved image digest: assigned by the ACA deploy workflow after merge.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives 100% traffic only after the new revision is healthy.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, SkyHarbor Source aVa answers and Source D09 evidence/export proof.

## Rollback Plan

Revert this route-level context-binding change and redeploy the prior healthy ACA revision. No data rollback is required because no schema or tenant data is changed.

## Audit Evidence

- Source evidence upload and D09 proof folder: `/Users/anand/Downloads/source-skyharbor-ams-live-rerun-2026-06-30T224056115Z`
- Pre-fix Source aVa answers showed event-row-only evidence and did not mention loaded artifacts in `/Users/anand/Downloads/source-skyharbor-ams-live-rerun-2026-06-30T224056115Z/ava-proof`.
- Post-deploy proof will be added to the same Source P0 Slice 3 evidence bundle.

## Known Gaps

This release does not add an operator-job wrapper for `process-source-artifact-generation-queue`; the live D09 proof still uses the signed-in Source route with the deployed JSON heartbeat. It also does not turn Source into generic document Q&A; artifacts are bound as sourcing-stage evidence only.
