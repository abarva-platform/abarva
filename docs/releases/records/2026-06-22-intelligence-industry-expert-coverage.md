# 2026-06-22-intelligence-industry-expert-coverage — Intelligence Industry Expert Coverage

## Release ID

`2026-06-22-intelligence-industry-expert-coverage`

## Status

`candidate`

## Plain-English Summary

Ask Ava's expert router now keeps at least one same-industry expert in the selected expert set when the tenant's industry is known and a relevant same-industry expert exists. This prevents a SkyHarbor airline question from being attributed only to generic cross-cutting experts while preserving cross-cutting specialists as supporting voices.

## Layer Impact

- `global-control-lane`: Shared deterministic expert routing changes for all tenants and surfaces using `routeQuestion`.
- `client-data-lane`: No tenant data writes, migrations, or data-plane changes.

## Client Applicability

- All clients: yes, any tenant with a known industry mapping.
- Specific clients: SkyHarbor Air is the motivating proof case; Apex Retail remains covered by the prior no-other-industry regression.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; this is deterministic routing correction.

## Changes Included

- `src/lib/intelligence/answer/router.ts`: preserves at least one relevant same-industry expert in the selected expert list when tenant industry is known.
- `src/lib/intelligence/answer/__tests__/router.test.ts`: proves SkyHarbor retains an airline expert and Apex excludes healthcare/airline leakage.

## QA / Validation

- `npx jest src/lib/intelligence/answer/__tests__/router.test.ts --runInBand` must pass before PR.
- `npx eslint src/lib/intelligence/answer/router.ts src/lib/intelligence/answer/__tests__/router.test.ts` must pass before PR.
- `npm run release:check` must pass before PR.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow builds and shifts the shared runtime. No migration, data load, DNS, or feature flag change is required. After deploy, run post-deploy crawl and inspect SkyHarbor `/intelligence/ask` transcript for tenant-safe answer behavior.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime rollout.
- Shared runtime mutators: no manual ACA mutation.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: verified by the ACA main deploy workflow after merge.
- Worker image invariant: verified by the ACA main deploy workflow after merge.
- Feature/env flag update path: none.
- Live signed-in proof required: post-deploy crawl plus targeted SkyHarbor Ask Ava proof when signed-in browser/auth state is available.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow. Since this release only changes deterministic routing and has no schema or data changes, rollback is code-only.

## Audit Evidence

- PR: to be added.
- CI: pending.
- Runtime proof: pending merge/deploy.

## Known Gaps

This guarantees same-industry expert coverage in the selected expert set. It does not replace live answer-quality evals or tenant-specific corpus/data sufficiency checks for every possible SkyHarbor question.
