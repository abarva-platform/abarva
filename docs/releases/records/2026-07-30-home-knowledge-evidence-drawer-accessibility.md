# 2026-07-30-home-knowledge-evidence-drawer-accessibility — Home Knowledge Evidence Drawer Accessibility

## Release ID

`2026-07-30-home-knowledge-evidence-drawer-accessibility`

## Status

`candidate`

## Plain-English Summary

The Home Knowledge evidence drawer now behaves like an accessible modal drawer. When a user opens evidence details, focus moves into the drawer, keyboard focus remains inside the drawer, Escape closes it, and focus returns to the control that opened it.

## Layer Impact

- global-control-lane: Shared Home Knowledge UI behavior changes for all authorized users of the product surface.
- Products: Updates Home Knowledge UI behavior only. No canonical data, projection, publication, or provider contract changes are included.

## Client Applicability

- All clients: Home Knowledge users who can access the evidence drawer receive the keyboard and accessibility behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/knowledge/EvidenceDrawer.tsx`
- `src/components/knowledge/__tests__/evidence-drawer-accessibility.test.tsx`

## QA / Validation

- Pass: `npx jest src/components/knowledge/__tests__/evidence-drawer-accessibility.test.tsx --runInBand`
- Pass: `npx eslint src/components/knowledge/EvidenceDrawer.tsx src/components/knowledge/__tests__/evidence-drawer-accessibility.test.tsx`

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps deploy workflow will make the UI behavior active with the next product image deploy.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not changed by this UI-only release.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Home Knowledge evidence-drawer interaction after deploy.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps workflow. No data rollback, projection rebuild, or migration rollback is required.

## Audit Evidence

- PR review and CI for this branch.
- Focused drawer accessibility test output.
- Post-deploy signed-in browser proof for the evidence drawer interaction.

## Known Gaps

`module_knowledge_packet_v1` construction is intentionally out of scope and remains a separate data-plane operation.
