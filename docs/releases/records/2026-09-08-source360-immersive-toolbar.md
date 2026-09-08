# 2026-09-08-source360-immersive-toolbar — Source 360 Immersive Toolbar

## Release ID

`2026-09-08-source360-immersive-toolbar`

## Status

`candidate`

## Plain-English Summary

Source 360 workspace routes now use the page's own product toolbar without also mounting the shared Nexus top navigation above it. This removes duplicate navigation chrome while preserving the standard shell for the rest of Source.

## Layer Impact

Release lane: `global-control-lane`

Layer 4/product surface only. No tenant data, schema, adapters, canonical objects, read models, assistant grounding, or data-build jobs are changed.

## Client Applicability

- All clients: Yes, for Source 360 workspace routes.
- Specific clients: No.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `src/components/chrome/MaestroChrome.tsx`
- `src/components/chrome/__tests__/MaestroChrome.test.tsx`

## QA / Validation

- `npx jest src/components/chrome/__tests__/MaestroChrome.test.tsx --runInBand` passed.
- `npx eslint src/components/chrome/MaestroChrome.tsx src/components/chrome/__tests__/MaestroChrome.test.tsx` passed.

## Rollout Plan

Merge through PR, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the updated web image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy before claiming live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for `/source/workspace`.

## Rollback Plan

Rollback the web runtime to the prior ACA image digest if the workspace route loses expected navigation, auth behavior, or page controls.

## Audit Evidence

- PR URL and CI checks.
- Focused shell test output.
- Post-deploy ACA runtime invariant.
- Signed-in Source 360 screenshot or DOM proof confirming a single Source 360 toolbar.

## Known Gaps

Signed-in product proof still requires a browser session for the intended tenant.
