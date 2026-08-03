# 2026-08-03-home-match-moves-style — Home Styling Alignment

## Release ID

`2026-08-03-home-match-moves-style`

## Status

`candidate`

## Plain-English Summary

Updates the Home command center visual treatment so its typography, color tokens, page chrome, navigation rail, cards, and panel hierarchy align with the established Moves product surface.

## Layer Impact

Lane: `global-control-lane`.

Products: Home surface styling changes only. The change updates CSS presentation for the existing Home command center component and does not alter product data, canonical records, source adapters, tenancy, loaders, or prompts.

## Client Applicability

- All clients: Yes, for users who can access the Home command center.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/ai-success-command-center/AiSuccessCommandCenter.module.css`
- `docs/releases/records/2026-08-03-home-match-moves-style.md`

## QA / Validation

- Pass: `npx eslint src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx`
- Pass: `npm run release:check`
- Pending: ACA deployment evidence after merge.
- Pending: signed-in browser proof for the Home route after deployment.

## Rollout Plan

Merge the PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared web runtime. No migration, data build, feature flag, or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned main deploy workflow.
- ACA runtime invariant: Verify after deployment.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home route visual check after deployment.

## Rollback Plan

Revert the CSS change and merge through the same repo-owned deployment workflow. No data rollback is required.

## Audit Evidence

- PR URL: Pending.
- CI/release validation: Pending.
- ACA deployment run: Pending.
- Signed-in Home route proof: Pending.

## Known Gaps

Signed-in browser proof cannot be captured until this candidate is merged, deployed by the repo-owned workflow, and checked against the production Home route. No data, schema, loader, prompt, or feature-flag gap is known for this CSS-only surface change.
