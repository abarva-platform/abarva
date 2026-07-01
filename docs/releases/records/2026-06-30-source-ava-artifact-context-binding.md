# 2026-06-30-source-ava-artifact-context-binding — Source aVa Artifact Context Binding

## Release ID

`2026-06-30-source-ava-artifact-context-binding`

## Status

`candidate`

## Plain-English Summary

Source aVa now sees the Source evidence and generated artifacts that belong to the active sourcing event, and live Source answers no longer inherit seed-fixture blockers. Before this release, non-Apex live Source events answered mostly from the `source_events` intake row, so aVa could say evidence was missing even after documents had been uploaded and parsed. The first live proof after artifact binding showed the event evidence was now bound, but a stale static fixture layer still overlaid “RFP generation must remain blocked” language. This release binds the event's Source artifact registry rows, parsed chunks, and parsed facts into the same event advisor context, classifies those artifacts into sourcing-relevant evidence families, and keeps static seed validation reports out of live event answer status.

## Layer Impact

- `global-control-lane`: Updates shared Source aVa event-answer context binding and live answer readiness handling for all tenants using `/api/v1/source/[eventId]/nexus/ask`.
- No schema, RLS, migration, tenant seed, or raw document browsing change.

## Client Applicability

- All clients: Source event aVa answers can use tenant-scoped Source event artifacts as sourcing-stage evidence.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
- `src/lib/source/nexus-api.ts`
- `src/lib/source/source-answer-engine.ts`
- `src/lib/source/__tests__/nexus-api-live-context.test.ts`
- `docs/releases/records/2026-06-30-source-ava-artifact-context-binding.md`

## QA / Validation

- `npx eslint src/app/api/v1/source/[eventId]/nexus/ask/route.ts` — passed.
- `npx eslint 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts' src/lib/source/nexus-api.ts src/lib/source/source-answer-engine.ts src/lib/source/__tests__/nexus-api-live-context.test.ts` — passed.
- `npx jest src/lib/source/__tests__/nexus-api-live-context.test.ts src/lib/source/__tests__/source-answer-engine.test.ts --runInBand` — passed, 2 suites / 39 tests.
- `npx tsc --noEmit --pretty false` — blocked by pre-existing unrelated missing declarations for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`; no new Source route TypeScript error was surfaced before those baseline failures.
- First post-deploy proof on SkyHarbor Source event `e64177a2-e75b-4604-8584-fa60386225ae` confirmed aVa now binds `26` uploaded Source evidence artifacts, `19` generated artifacts, `50` parsed excerpts, and `26` structured facts.
- The same proof exposed the stale seed-fixture readiness overlay. A regression now asserts that live artifact-backed events do not inherit the “RFP generation must remain blocked” fixture defer and do not keep naming application inventory, ticket/SLA baseline, or agreement evidence as missing when those families are present.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, wait for the new healthy revision, assign 100% traffic to it, and run signed-in SkyHarbor Source aVa proof. Post-deploy proof must confirm both conditions: artifact evidence is bound and stale seed-fixture blockers no longer drive the visible answer.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: none outside the normal deploy workflow.
- Approved image digest: assigned by the ACA deploy workflow after merge.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives 100% traffic only after the new revision is healthy.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, SkyHarbor Source aVa answers and Source D09 evidence/export proof.

## Rollback Plan

Revert this route/context/answer-readiness change and redeploy the prior healthy ACA revision. No data rollback is required because no schema or tenant data is changed.

## Audit Evidence

- Source evidence upload and D09 proof folder: `/Users/anand/Downloads/source-skyharbor-ams-live-rerun-2026-06-30T224056115Z`
- Pre-fix Source aVa answers showed event-row-only evidence and did not mention loaded artifacts in `/Users/anand/Downloads/source-skyharbor-ams-live-rerun-2026-06-30T224056115Z/ava-proof`.
- First post-deploy proof after the artifact-binding deployment: `/Users/anand/Downloads/source-skyharbor-ams-live-rerun-2026-06-30T224056115Z/ava-proof-postfix`.
- Final post-deploy proof after the readiness-overlay fix will be added to the same Source P0 Slice 3 evidence bundle.
- Follow-up artifact segment classification fix: uploaded Source evidence is classified by file/content semantics before falling back to `source_origin`, so risk registers, agreements, ticket/SLA baselines, finance baselines, service catalog/scope files, and transition evidence are not collapsed into generic `sourcing_artifacts`.
- Follow-up uploaded-evidence priority fix: Source aVa scores uploaded, parsed, fact-bearing Source evidence ahead of generated draft artifacts so current-state citations and visible guidance are driven by the client evidence pack first.

## Known Gaps

This release does not add an operator-job wrapper for `process-source-artifact-generation-queue`; the live D09 proof still uses the signed-in Source route with the deployed JSON heartbeat. It also does not turn Source into generic document Q&A; artifacts are bound as sourcing-stage evidence only.
