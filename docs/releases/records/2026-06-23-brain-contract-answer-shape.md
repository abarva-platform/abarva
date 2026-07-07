# 2026-06-23-brain-contract-answer-shape — Brain contract answer shape and matrix proof hardening

## Release ID

`2026-06-23-brain-contract-answer-shape`

## Status

`candidate`

## Plain-English Summary

Makes Ava's streamed Ask answers conform more durably to the Brain Contract. A short answer that already had a `Next move:` line could still fail the browser gate because it was actionable but not explicitly shaped as consultant prose. This change requires streamed answers to carry readable contract framing before the renderer receives them, and hardens the tenant matrix `dims19` check so it reads visible browser text instead of raw React HTML comment seams.

## Layer Impact

- `global-control-lane`: Updates the shared Ask response policy used by Home, Intelligence, and other Ask-backed surfaces.
- `internal-admin`: Updates the tenant matrix QA harness that proves the Brain Contract against the deployed app.
- `client-data-lane`: No schema, ingestion, corpus, tenant data, search index, queue, or migration change.

## Client Applicability

- All clients: Yes, the shared Ask response policy applies to every tenant that uses Ava Ask.
- Specific clients: Not tenant-specific.
- Internal only: The QA harness change is operator-only.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts`
- `src/lib/intelligence/ask/response-policy.test.ts`
- `scripts/qa/tenant-matrix-gate.mjs`

## QA / Validation

- `npx jest src/lib/intelligence/ask/response-policy.test.ts --runInBand` passed.
- `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/response-policy.test.ts scripts/qa/tenant-matrix-gate.mjs` passed.
- `BASE_URL=https://app.abarva.ai node scripts/qa/tenant-matrix-gate.mjs` passed `dims19` for all five tenants against the deployed app after the harness hardening. The live deployed image still showed two answer-shape failures before this response-policy change is deployed: First Capital `readable`, SkyHarbor `visual`.
- `npm run release:check` must pass before PR.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the shared web runtime. No migration, data-plane write, queue job, DNS change, or feature flag update is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: No manual shared runtime mutation required.
- Approved image digest: Filled by the ACA main deploy workflow.
- ACA runtime invariant: Template image, traffic revision, and active revision image must match the deployed main digest before declaring runtime proof.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not affected.
- Live signed-in proof required: Yes, rerun `BASE_URL=https://app.abarva.ai node scripts/qa/tenant-matrix-gate.mjs` after deploy.

## Rollback Plan

Revert this PR and let the repo-owned ACA main deploy restore the previous runtime image. No data rollback or migration rollback is needed.

## Audit Evidence

- PR and CI once opened.
- Unit and eslint command output listed above.
- Tenant matrix output after deployment.
- ACA image/traffic invariant after deployment.

## Known Gaps

The tenant matrix cannot be fully green for the answer-shape columns until this response-policy change is merged and deployed. The `continuity` Brain Contract column remains a separate future gate extension.
