# 2026-06-22-intelligence-tenant-expert-routing — Intelligence Tenant Expert Routing

## Release ID

`2026-06-22-intelligence-tenant-expert-routing`

## Status

`candidate`

## Plain-English Summary

Ask Ava was using Apex Retail data in the answer body, but the structured exhibit envelope rerouted contributing experts without the tenant's industry. That could show a healthcare expert chip on a retail answer. The same proof surfaced unsafe chart inference: dollar figures mentioned in prose were being scraped into board-grade-looking charts even when the numbers were not additive. This release passes the resolved tenant industry into the AgentAnswer expert router and suppresses prose-scraped charts/tables so the visible attribution and exhibits match the evidence.

## Layer Impact

- `global-control-lane`: Shared `/api/intelligence/ask` response metadata changes for all tenants. The answer stream keeps the same shape, but contributing expert labels are now tenant-industry-aware and unsafe heuristic charts/tables are no longer emitted.
- `client-data-lane`: No data writes, migrations, or tenant data changes.

## Client Applicability

- All clients: yes, any tenant using Ask Ava through the shared Intelligence route.
- Specific clients: Apex Retail is the motivating proof case.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; this corrects routed metadata in the existing AgentAnswer event.

## Changes Included

- `src/app/api/intelligence/ask/route.ts`: passes `expertIndustryForClientKey(tenantClientKey)` into both AgentAnswer routing paths and still emits citation/expert-only AgentAnswers when no safe exhibits exist.
- `src/lib/intelligence/answer/structured-exhibits.ts`: stops inferring tables/charts from prose or cited-source text; table-shaped asks can still render evidence/source tables.
- `src/components/agent-answer/AgentAnswerRenderer.tsx`: renders attribution and global source chips cleanly when an AgentAnswer has no typed table/chart exhibits.
- `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`: regression coverage proving Apex routes to retail experts, excludes the healthcare clinical expert, and does not fabricate exhibit rows from mentioned figures.
- `src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts`: regression coverage proving prose/source figures do not become inferred charts.
- `src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx`: regression coverage for citation-only AgentAnswers.

## QA / Validation

- `npx jest src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand` passed before the exhibit-suppression expansion; rerun required before final PR update.
- `npx eslint src/app/api/intelligence/ask/route.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts src/lib/intelligence/answer/structured-exhibits.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/agent-answer/AgentAnswerRenderer.tsx src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx` must pass before PR.
- `npm run release:check` must pass before PR.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow builds and shifts the shared runtime. No migration, data load, DNS, or feature flag change is required. After deploy, run the post-deploy crawl and target Apex `/intelligence` Ask proof to confirm healthcare expert labels do not appear on retail answers and no auto-summed chart appears unless typed structured data is provided.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime rollout.
- Shared runtime mutators: no manual ACA mutation.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: verified by the ACA main deploy workflow after merge.
- Worker image invariant: verified by the ACA main deploy workflow after merge.
- Feature/env flag update path: none.
- Live signed-in proof required: post-deploy crawl plus targeted Apex Ask Ava expert-label/exhibit proof when signed-in browser/auth state is available.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow. Since this release only changes response metadata/exhibit emission and has no schema or data changes, rollback is code-only.

## Audit Evidence

- PR: to be added.
- CI: focused Jest command listed above; release gate to be run before PR.
- Runtime proof: pending merge/deploy.

## Known Gaps

The regression tests prove the server-side AgentAnswer metadata and no-inferred-exhibit behavior. Browser-visible proof remains pending until the release is deployed and a signed-in Apex Ask Ava question is run against the live app. This does not implement model-authored typed charts/tables; it prevents unsafe inferred charts/tables until that durable contract lands.
