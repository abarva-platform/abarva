# 2026-06-22-moves-program-evidence-register — Moves Program Evidence Source Register

## Release ID

`2026-06-22-moves-program-evidence-register`

## Status

`candidate`

## Plain-English Summary

Moves deliverables can now cite committed move-specific program evidence even when the newer human-review table has not been populated yet. This closes the SkyHarbor canary gap where the generated content existed but export was blocked because the source register stayed empty.

## Layer Impact

`global-control-lane`: Updates the shared Moves deliverable evidence assembly path used by the deliverable worker before generation and export.

`client-data-lane`: Reads already-committed `program_evidence_items` rows for the current tenant and move. It does not create schema, mutate client data, or bypass tenant scoping.

## Client Applicability

- All clients: Moves deliverables with move-scoped program evidence can benefit.
- Specific clients: SkyHarbor production-lab canary is the initial validation target.
- Internal only: Direct program evidence rows are marked `internal_only` in governed evidence.
- Public/demo only: Not applicable.
- Feature flag: No new flag; this is a retrieval/source-register fix.

## Changes Included

- `src/lib/deliverables/orchestrator/evidence-assembler.ts`: adds a controlled fallback from move-scoped `program_evidence_items` into governed evidence when approved review rows are absent.
- `src/lib/deliverables/orchestrator/__tests__/surface.test.ts`: adds a regression test for committed program evidence producing a source register when tenant context retrieval and review rows are empty.

## QA / Validation

- `npm test -- src/lib/deliverables/orchestrator/__tests__/surface.test.ts --runInBand` passed: 8 tests.
- `npx eslint src/lib/deliverables/orchestrator/evidence-assembler.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts` passed.
- VNet production-lab proof is required before marking released: requeue the SkyHarbor canary deliverable runs, run the deliverable worker in the ACA/VNet context, then verify artifact persistence and source-register presence from the private data plane.

## Rollout Plan

Merge/deploy through the normal Azure Container Apps image path. After the image is active for the web/worker runtime, run a VNet job to requeue the blocked SkyHarbor canary runs and execute/observe the deliverable worker until all four deliverables are terminal.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None.
- Approved image digest: To be recorded after deployment.
- ACA runtime invariant: Web and worker must run the same application image revision for this fix.
- Worker image invariant: Deliverable worker must use the patched image before rerun.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, SkyHarbor agent crawl plus private data-plane artifact/read proof.

## Rollback Plan

Rollback to the previous ACA revision/image. No schema rollback is required. Any canary deliverable runs created during validation can be left as blocked/superseded or requeued again after rollback if needed.

## Audit Evidence

- Focused unit test and ESLint output from the release branch.
- VNet job logs for SkyHarbor canary requeue, worker execution, and final artifact/read proof.
- Browser crawl evidence for signed-in SkyHarbor Moves visibility after rerun.

## Known Gaps

Native artifact download/client-visible file review proof remains pending until the patched image is deployed and the canary runs are regenerated.
