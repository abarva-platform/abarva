# 2026-07-30-home-knowledge-projection-ui-closure — Home Knowledge Projection UI Closure

## Release ID

`2026-07-30-home-knowledge-projection-ui-closure`

## Status

`candidate`

## Plain-English Summary

This release makes the Home Knowledge page consume built inventory projections through the governed reader contract, reports absent suggested-question packets honestly, and improves narrow-screen layout so the assistant panel no longer forces a desktop-width page.

## Layer Impact

Release lane: `global-control-lane`.

Products: Home Knowledge route rendering and API envelopes are affected.

Canonical model: No canonical schema, source data, publication membership, baseline identity, or tenant data is changed.

Consumption projections: No projection rebuild is included. The reader normalizes existing projection payload aliases to the Home Explore contract.

## Client Applicability

- All clients: no.
- Specific clients: preview tenants using the Home Knowledge route.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Home Knowledge route activation controls apply.

## Changes Included

- Home Knowledge consumption reader projection alias normalization for application and vendor inventory reads.
- Search availability semantics now distinguish an empty built search table from a no-match query.
- Suggested questions now read `module_knowledge_packet_v1` and return not-loaded when the packet is absent.
- Narrow viewport layout contains the shell, top controls, and assistant panel without reserving desktop side-rail width.
- Focused reader and render-gate regression tests.

## QA / Validation

- `npx jest src/lib/knowledge/consumption-server/__tests__/reader.test.ts --runInBand` passed.
- `npx jest src/components/knowledge/__tests__/render-gate-integration.test.tsx --runInBand` passed.
- `npx eslint src/lib/knowledge/consumption-server/reader.ts src/lib/knowledge/consumption-server/__tests__/reader.test.ts src/components/knowledge/shell/KnowledgeShell.tsx src/components/knowledge/ava/AvaDock.tsx src/components/knowledge/shell/ModuleSwitcher.tsx src/components/knowledge/shell/ModeTabs.tsx src/components/knowledge/shell/LensPicker.tsx` passed.
- D0 read-only reconciliation was completed before code edits. Detailed local evidence is in the operator proof folder and is intentionally not committed to the public repository.

## Rollout Plan

Merge to main through PR. Use the repo-owned Azure Container Apps main deploy workflow to build and deploy the resulting image. No manual shared-runtime mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime activation.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the main deploy workflow after merge.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment if worker images are updated by the workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, repeat Home Knowledge route/API/browser proof after deployment.

## Rollback Plan

Revert this PR and redeploy main through the repo-owned ACA workflow. No data rollback or projection rebuild is required because this release does not mutate tenant data.

## Audit Evidence

- PR diff and CI checks.
- Local D0 reconciliation proof folder generated before repair.
- Post-deploy signed-in browser/API proof after ACA deployment.

## Known Gaps

- Suggested questions still require a built `module_knowledge_packet_v1` packet before they can render as available.
- The exact phrase tested during D0 was absent from searchable content; positive search certification should use a term that exists in the active published search projection.
- Evidence drawer certification must be repeated after application/vendor rows are available in the deployed UI.
