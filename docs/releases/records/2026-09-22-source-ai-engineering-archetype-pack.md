# 2026-09-22 Source AI Engineering Archetype Pack

## Release ID

`2026-09-22-source-ai-engineering-archetype-pack`

## Status

`candidate`

## Plain-English Summary

Adds a dedicated Source event archetype for AI engineering partner selection. The existing category was previously routed through the generic digital product engineering pack; this release adds a separate AI evidence contract, scorecard, pricing model, clause protections, negotiation levers, industry-intelligence metric contract, governed aVa context, and synthetic candidate-row coverage so Source does not substitute a generic product-engineering playbook for an AI partner event.

## Layer Impact

- Release lane: `public-demo`.
- Layer 3 / governed contract model: adds one static Source archetype declaration, keeps the generic product-engineering pack registered, adds separate tenant-neutral industry-intelligence requirements for the AI pack, and realigns the public synthetic candidate registry rows to the active archetype. It does not add or load any client facts, benchmarks, suppliers, pricing observations, or evidence.
- Layer 4 Source projection: Source New event intelligence now resolves the existing AI engineering partner category to the dedicated playbook and surfaces its evidence gaps and metric requirements. Fixture completeness checks now use the category-routed archetype denominator so registry-only packs can remain available without pretending they have a live classifier route. No UI, route, event state, or write path changes.

## Client Applicability

- All clients: applies to Source event intelligence behavior wherever the existing AI engineering partner category is present.
- Specific clients: none.
- Internal only: none.
- Public/demo only: authored against existing synthetic request/category evidence.
- Feature flag: none.

## Changes Included

- `src/lib/source/archetypes/registry.ts`
- `src/lib/source/archetypes/event-archetype-resolver.ts`
- `src/lib/source/industry-intelligence/archetype-registry.ts`
- `datasets/source/candidate-supplier-registry-synthetic-v1/candidate_supplier_registry.csv`
- `datasets/source/candidate-supplier-registry-synthetic-v1/FIELD_GUIDE.md`
- `reports/source/servicenow-request-acceptance-matrix.json`
- Fixture completeness checks and tests for category-routed archetype coverage.
- Focused tests for resolver, registry differentiation, industry-intelligence coverage, and Source New event intelligence.

## QA / Validation

- Pass: red-first focused suite initially failed because AI engineering partner resolved to the generic digital product engineering pack and no dedicated industry pack existed.
- Pass: `npx jest src/lib/source/archetypes/__tests__/event-archetype-resolver.test.ts src/lib/source/archetypes/__tests__/differentiation.test.ts src/lib/source/industry-intelligence/__tests__/contract.test.ts src/lib/source/new-workspace/event-intelligence.test.ts --runInBand`.
- Pass: `npx jest src/__tests__/integration/source/source-servicenow-request-loader.test.ts src/lib/source/intake/__tests__/servicenow-request-event-handoff.test.ts src/lib/source/intake/__tests__/servicenow-sourcing-request-dataset.test.ts src/__tests__/integration/source/source-candidate-supplier-registry-loader.test.ts --runInBand`.
- Pass: `npx jest src/__tests__/behaviors/source-servicenow-request-acceptance-harness.test.ts --runInBand`.
- Pass: mutation changing the category mapping back to the generic digital product engineering pack failed the resolver and Source New event-intelligence tests.
- Pass: registry and industry-intelligence coverage tests require both generic product engineering and AI engineering partner packs to stay registered.
- Pass: mutation allowing official-public source authority for AI partner metrics failed the industry-intelligence benchmark-governance test.
- Pass: `npm run typecheck` exited 0.
- Pass: `npx eslint src/` exited 0 with existing warnings and no errors.
- Pass: `npm run release:check` exited 0.
- Pending: PR checks.

## Rollout Plan

Squash-merge after validation and hosted checks pass. The repo-owned Azure Container Apps main deploy workflow may publish the code after merge; no manual deployment, traffic mutation, data job, migration, or feature flag change is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` if merge triggers shared-runtime deployment.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge.
- ACA runtime invariant: required only if claiming deployed shared runtime after merge.
- Worker image invariant: required only if claiming deployed shared runtime after merge.
- Feature/env flag update path: none.
- Live signed-in proof required: no. The change is a static read-only contract projection and focused tests; no UI, route, tenant write, supplier action, or approval action is changed.

## Rollback Plan

Revert the PR. This restores the prior category-to-archetype mapping and removes the new static AI archetype/industry declarations and tests. No database rollback, tenant data repair, supplier communication cleanup, or event-state repair is required.

## Audit Evidence

- PR diff and hosted CI checks.
- Local focused Jest output.
- Mutation-proof output.
- TypeScript, ESLint, and release-check output.

## Known Gaps

No client-specific benchmark observations, supplier recommendations, supplier contact, invitation, award, tenant data write, migration, signed-in acceptance, or live runtime proof is included.
