# 2026-07-22-home-knowledge-pack-v3-prompt-first-ui — Home Knowledge Pack V3 Prompt-First UI

## Release ID

`2026-07-22-home-knowledge-pack-v3-prompt-first-ui`

## Status

`candidate`

## Plain-English Summary

Home Knowledge content generation now uses bounded Claude authorship calls instead of one broad writer call, so executive brief, use-case qualification, dimension stories, relationship reads, evidence reads, and strategic narratives are each explicitly required and quality-gated. The Home UI is wired to display the richer Postgres-backed pack as a compact CXO context cockpit with grouped navigation, authored dimension reads, richer use-case details, relationship graph views, and evidence/source metadata without raw row/fact/node count language.

## Layer Impact

- `global-control-lane`: Updates the shared Home Knowledge renderer and the Home pack generator used for all active demo tenants.
- `client-data-lane`: The generator writes tenant-scoped Home Knowledge packs and typed table rows through the governed data-build lane after deployment.

## Client Applicability

- All clients: All active Home Knowledge tenants receive the renderer improvements once the ACA deploy is live.
- Specific clients: The initial local canary proof covered Meridian Health System and FS Demo / First Capital.
- Internal only: None.
- Public/demo only: Demo tenants use the generated packs for the pilot/demo experience.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/build-home-knowledge-pack-v2.mjs`
- `src/lib/home/home-knowledge-design-contract.ts`
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`

## QA / Validation

- `node --check scripts/knowledge/build-home-knowledge-pack-v2.mjs` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` passed.
- `npx eslint scripts/knowledge/build-home-knowledge-pack-v2.mjs src/components/home/HomeKnowledgeDesignContractSurface.tsx src/lib/home/home-knowledge-design-contract.ts` passed.
- Local Claude dry-run canary passed for `meridian-health`: approved artifact, 19 dimensions, 5 use cases, validation `pass`, no validation issues.
- Local Claude dry-run canary passed for `first-capital` / FS Demo: approved artifact, 19 dimensions, 8 use cases, validation `pass`, no validation issues.
- Review ZIP generated at `/Users/anand/Downloads/home-knowledge-v3-prompt-first-review-2026-07-22.zip`.

## Rollout Plan

1. Merge this PR to `main`.
2. Deploy through the repo-owned ACA main deploy workflow.
3. Verify the ACA runtime invariant and health.
4. Run the governed ACA operator data-build job for Home Knowledge Pack V3 population against the shared Azure/Postgres data layer.
5. Verify Postgres row counts/status for all active tenants.
6. Run signed-in browser proof for Meridian and FS Demo first, then the remaining tenants.

## Deployment Authority

- Repo-owned deploy workflow: Required for the web runtime.
- Shared runtime mutators: Governed ACA operator job only for Postgres Home pack population.
- Approved image digest: Capture after ACA deploy.
- ACA runtime invariant: Required before claiming live UI.
- Worker image invariant: Required before running the data-build job.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback the ACA web revision to the prior digest if the renderer fails. If generated packs are loaded and fail quality review, mark the affected Home Knowledge packs `candidate`/superseded or restore the prior approved pack rows; do not delete historical evidence without an explicit data rollback record.

## Audit Evidence

- PR URL: Pending.
- Local validation output: commands listed above.
- Candidate pack artifacts and prompt/response dump: `/Users/anand/Downloads/home-knowledge-v3-prompt-first-review-2026-07-22.zip`.
- ACA revision, image digest, health, operator-job run id, and signed-in screenshots: Pending after merge/deploy.

## Known Gaps

- Live Postgres population and signed-in browser proof are pending this candidate PR merging and deploying.
- SkyHarbor and Apex Retail are intentionally tested after Meridian/FS Demo per execution order.
