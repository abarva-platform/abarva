# 2026-06-25-intelligence-dossier-framework — Intelligence Dossier Framework

## Release ID

`2026-06-25-intelligence-dossier-framework`

## Status

`candidate`

## Plain-English Summary

Adds a first-class Intelligence Dossier layer so Ava Intelligence receives a bounded advisory briefing packet instead of a loose source dump. The packet separates tenant facts, corpus patterns, expert interpretation, benchmark caveats, options/tradeoffs, and missing evidence before Claude synthesizes the answer.

## Layer Impact

- `global-control-lane`: Changes shared Intelligence ask behavior for all clients using `/api/intelligence/ask`.
- `client-data-lane`: No schema, tenant data, migration, or ingestion changes. The dossier uses already retrieved sources and does not mutate client data.

## Client Applicability

- All clients: Yes, through the shared Intelligence ask path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new feature flag in this slice; existing retrieval/expert flags remain respected.

## Changes Included

- `src/lib/intelligence/dossiers/*`
- `src/lib/intelligence/compose-intelligence-answer.ts`
- `src/lib/intelligence/ask/index.ts`
- `src/lib/intelligence/ask/synthesizer.ts`
- `src/lib/intelligence/dossiers/__tests__/intelligence-dossier.test.ts`
- `docs/intelligence/*`

## QA / Validation

- `npx jest src/lib/intelligence/dossiers/__tests__/intelligence-dossier.test.ts --runInBand` passed.
- `npx eslint src/lib/intelligence/dossiers src/lib/intelligence/compose-intelligence-answer.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/synthesizer.ts` passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` passed.
- Initial `npx tsc --noEmit --pretty false` without heap override failed by Node heap OOM, not by TypeScript diagnostics.

Follow-up validation after deployed matrix exposed compatibility gaps:

- Live matrix against `ca-abarva-web-lab-eastus--m43157a58` passed render, Intelligence V2, dims19, grounding, raw-ID, and tenant-fence checks, but failed the legacy `prose` / `tables` / `charts` / `contributingExperts` shape columns for all five tenants.
- Added derived compatibility mirrors (`prose`, `tables`, `charts`, `graphs`, `contributingExperts`) from canonical `directAnswer` / `artifacts` / `expertsUsed`; renderer still uses canonical `artifacts`.
- Final Intelligence answers now use the dossier-selected expert council as metadata fallback when no advisor-specific override is active.
- `npx jest src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts src/lib/intelligence/dossiers/__tests__/intelligence-dossier.test.ts --runInBand` passed.
- `npx eslint src/lib/ava-answer/contract.ts src/lib/ava-answer/composeAvaAnswer.ts src/app/api/intelligence/ask/route.ts` passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` passed.

## Rollout Plan

Merge to main through PR, let the repo-owned Azure Container Apps main deployment build and deploy the approved image, then run signed-in Intelligence dossier crawl for SkyHarbor and Lakeshore before claiming live product completion.

## Deployment Authority

- Repo-owned deploy workflow: Required for live rollout.
- Shared runtime mutators: No manual ACA mutation from this PR.
- Approved image digest: Not applicable until merge/deploy.
- ACA runtime invariant: Must be verified after deployment.
- Worker image invariant: Not affected.
- Feature/env flag update path: None in this slice.
- Live signed-in proof required: Yes, before marking released.

## Rollback Plan

Revert the PR or redeploy the previous approved main image through the repo-owned Azure Container Apps deploy lane. No database rollback required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Signed-in crawl: pending.
- Local validation commands listed above.

## Known Gaps

- Signed-in deployed browser proof is not included in this candidate.
- Full 30-question SkyHarbor/Lakeshore crawl is not included in this candidate.
- Renderer panelization of dossier sections is not included in this backend/framework slice.
