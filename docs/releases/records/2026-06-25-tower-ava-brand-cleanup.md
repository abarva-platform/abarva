# 2026-06-25-tower-ava-brand-cleanup — Tower aVa Brand Cleanup

## Release ID

`2026-06-25-tower-ava-brand-cleanup`

## Status

`candidate`

## Plain-English Summary

Tower now presents the shared agent dock as aVa instead of Atlas, removes the top decision-support quote and masthead advisory clutter from Tower, and shows a clear tenant-data binding message when the Tower dashboard has no tenant-bound KPI/portfolio rows.

## Layer Impact

- `global-control-lane`: Updates the shared Tower React surface and Tower agent rail behavior for all clients.
- `client-data-lane`: No data schema or tenant data changes. The dashboard remains blank-safe when Tower-specific read-model rows are absent.

## Client Applicability

- All clients: yes, for the Tower surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/atlas/AtlasChatPanel.tsx`: product-facing Tower agent profile is aVa, not Atlas; visible Atlas text from legacy responses is rewritten before rendering; focused mode remains available for Tower.
- `src/components/tower/TowerIndexPage.tsx`: Tower mounts the focused aVa dock and no longer renders the top disclosure quote or masthead advisory disclosure; blank dashboard states now explain the missing Tower read model instead of appearing empty.
- Focused tests assert the aVa product profile, focused Tower rail, and retired static Tower runtime invariants.

## QA / Validation

- pass: focused ESLint for Tower/aVa rail files.
- pass: focused Jest for Tower/AgentDock invariants, `16 passed`.
- pass: `npm run release:check`.
- not-run: signed-in browser proof on deployed ACA revision, required after deploy.

## Rollout Plan

Merge to `main`, build the exact main SHA into ACR, deploy through Azure Container Apps, shift 100% traffic to the new healthy revision, and run a signed-in Tower smoke proof.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps deploy path only.
- Shared runtime mutators: only approved repo-owned deploy identity should mutate `ca-abarva-web-lab-eastus`.
- Approved image digest: pending deploy.
- ACA runtime invariant: template image, active revision image, and 100% traffic image must match the approved main digest.
- Worker image invariant: no worker image change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Rollback by shifting ACA traffic back to the prior healthy main revision. No data or migration rollback is required.

## Audit Evidence

- PR URL: pending.
- CI/checks: pending.
- Deployment revision/digest: pending.
- Browser screenshots: pending.

## Known Gaps

Tower can only populate portfolio KPI/graph dashboards when tenant-bound Tower rows exist. This release does not fabricate dashboard values or reload client data.
