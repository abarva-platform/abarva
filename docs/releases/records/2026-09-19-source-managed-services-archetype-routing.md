# 2026-09-19-source-managed-services-archetype-routing — Source Managed-Services Archetype Routing

## Release ID

`2026-09-19-source-managed-services-archetype-routing`

## Status

`candidate`

## Plain-English Summary

Source now routes legacy managed-service event-type fallback records to the managed-services sourcing playbook instead of the renewal playbook. Governed renewal classification still routes to the renewal playbook. This prevents a competitive managed-services RFP from receiving renewal-only evidence requirements when the newer classified category is not present.

## Layer Impact

Release lane: `global-control-lane`.

Layer 3 canonical/read-model interpretation: no tenant records, loaders, adapters, or source facts change. The deterministic category-to-archetype bridge now treats the coarse legacy managed-service event type as managed services unless the governed classifier category says renewal.

Layer 4 product projection: Source New Event intelligence and other archetype-backed projections receive the managed-services evidence contract for managed-services fallback events, while renewal-category events keep renewal requirements.

## Client Applicability

- All clients: yes, wherever Source archetype routing reads the shared resolver.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/archetypes/event-archetype-resolver.ts`: updates the coarse legacy managed-service fallback mapping.
- `src/lib/source/archetypes/__tests__/event-archetype-resolver.test.ts`: adds direct resolver regressions for managed-services fallback and renewal category precedence.
- `src/lib/source/new-workspace/event-intelligence.test.ts`: adds read-model regressions for managed-services and renewal evidence contracts.

## QA / Validation

- Pass: `npx jest src/lib/source/archetypes/__tests__/event-archetype-resolver.test.ts src/lib/source/new-workspace/event-intelligence.test.ts --runInBand`.
- Pass: `npx jest src/lib/source/facts/__tests__/stage-analytics-builder.test.ts --runInBand`.
- Pass: `npx eslint src/lib/source/archetypes/event-archetype-resolver.ts src/lib/source/archetypes/__tests__/event-archetype-resolver.test.ts src/lib/source/new-workspace/event-intelligence.test.ts`.
- Pass: `node scripts/quality/typecheck.mjs`.
- Pass: `node scripts/release-check.mjs`.

## Rollout Plan

Merge through a protected pull request. The repo-owned Azure Container Apps main deploy workflow can build and deploy the exact merge SHA. No migration, tenant data build, data mutation, feature flag, or manual data-plane operation is required.

## Deployment Authority

- Repo-owned deploy workflow: required for shared runtime rollout after merge.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: prove through the standard post-deploy runtime invariant if deployed.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes after deployment for a managed-services RFP and a renewal event if claiming live product proof.

## Rollback Plan

Revert the PR. No database rollback is required because this is code-only routing logic.

## Audit Evidence

- Pull request URL: https://github.com/abarva-platform/abarva/pull/7927
- Local validation output: see QA / Validation.
- Live runtime proof: not performed in this release candidate.

## Known Gaps

This release does not classify or backfill existing records, edit tenant data, add new archetypes, or change Source phase/progress UI.
