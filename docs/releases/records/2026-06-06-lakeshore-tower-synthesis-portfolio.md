# 2026-06-06-lakeshore-tower-synthesis-portfolio — Lakeshore Tower Synthesis Portfolio

## Release ID

`2026-06-06-lakeshore-tower-synthesis-portfolio`

## Status

`candidate`

## Plain-English Summary

Tower synthesis no longer treats Lakeshore as an empty portfolio for the legacy Atlas synthesis route. The tenant-scoped loader now returns a Lakeshore-only Kyriba portfolio fixture with one Kyriba Move and one linked Source commercial-readiness event, so Atlas can synthesize the Lakeshore Tower story without falling back to Apex or fabricating missing instances.

## Layer Impact

- `global-control-lane`: Updates the shared Tower synthesis tenant loader and its regression tests. The behavior remains tenant-scoped and preserves the existing empty-state guardrail for unrelated tenants.
- `client-data-lane`: Adds a Lakeshore-specific typed portfolio fixture for the demo-readiness lane. It is synthetic/demo data and does not write database rows or migrations.

## Client Applicability

- All clients: Cross-tenant guardrails remain active.
- Specific clients: Lakeshore / Lakeshore Holdings receives the new Tower synthesis portfolio fixture.
- Internal only: No.
- Public/demo only: Yes, for Lakeshore demo-readiness proof.
- Feature flag: No new flag.

## Changes Included

- Adds `src/lib/reasoning/lakeshore-tower-portfolio.ts`.
- Updates `src/lib/reasoning/tenant-tower-portfolio.ts` to return the Lakeshore fixture only for `lakeshore` and `lakeshore-holdings`.
- Updates Tower synthesis tests to the current global agent output contract version and citation-hygiene wording.
- Adds tenant-loader regression coverage proving Meridian remains empty and does not receive Lakeshore or Apex identifiers.

## QA / Validation

- `npx jest src/lib/reasoning/__tests__/tenant-tower-portfolio.test.ts src/lib/reasoning/__tests__/tower-synthesis-context-builder.test.ts src/app/api/tower/synthesis/route.test.ts src/app/api/tower/synthesis/route.invariants.test.ts src/app/api/tower/synthesis/route-fix-c.test.ts --runInBand` passed: 5 suites, 50 tests.
- `npx tsc --noEmit --pretty false` was attempted in the temp worktree. It remains blocked by missing optional packages already known in this worktree: `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`; the only local type issue found during the run was fixed before this candidate record.

## Rollout Plan

Merge to main through PR review/CI. Once deployed, rerun `scripts/lakeshore/tower-atlas-federated-qa.mjs` against `https://app.abarva.ai`; the legacy synthesis check should move from watch to pass if the route is serving the new fixture.

## Rollback Plan

Revert the PR. The route will return to the prior honest empty-state behavior for Lakeshore and keep the cross-tenant leak guardrail intact.

## Audit Evidence

- Focused Jest output from the candidate worktree.
- Release Control Gate for this record.
- Post-merge Lakeshore Tower/Atlas QA report after deployment.

## Known Gaps

This is a typed demo-readiness fixture, not the final DB-backed Tower portfolio adapter. The Azure/private-plane and database-backed portfolio synthesis path remains future substrate work.
