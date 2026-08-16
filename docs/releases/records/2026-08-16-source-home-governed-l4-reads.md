# 2026-08-16 — Source and Home Governed L4 Reads

## Release ID

`2026-08-16-source-home-governed-l4-reads`

## Status

`candidate`

## Plain-English Summary

Home and Source now prefer the governed Source Layer 4 / cube projections when they render vendor, contract, scope, and cube coverage. Older canary tables remain a fallback only when governed rows are not available.

## Layer Impact

Layer 4 / Products (`global-control-lane`): updates Home and Source read paths so refreshed governed Source projections can appear in product surfaces. This does not write data or promote tenant access by itself.

## Client Applicability

- All clients: Source workspace snapshot lookup prefers governed consumption views.
- Specific clients: Home contract/vendor anchors update for the active healthcare and airline demo tenants when Source L4 rows exist.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/source-v4-workspace-snapshot.ts` reads `consumption.*` before falling back to legacy canary slices.
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts` and `live/portfolioAdapter.ts` name the governed cube path in UI proof rails.
- `src/app/(maestro)/home/page.tsx` reads Source L4 contract/vendor/scope summaries for Home anchors and healthcare summary cards.

## QA / Validation

- Pass: targeted ESLint on changed product read files.
- Pending: `npm run release:check`.
- Not run: signed-in Home and Source runtime proof; this requires deployed code plus governed data-build readback first.

## Rollout Plan

Merge through PR and deploy through the repo-owned Azure Container Apps main workflow. Product surfaces will show refreshed rows only after the approved Source L4/cube data-build job has written and readback proof has passed.

## Deployment Authority

- Repo-owned deploy workflow: approved session authority.
- Shared runtime mutators: repo-owned ACA main deploy only.
- Approved image digest: resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after data-build readback.

## Rollback Plan

Revert the PR and redeploy. The data-plane rows remain governed by their own data-build proof and can still be inspected through operator scripts.

## Audit Evidence

- PR and deploy evidence to be added after merge.
- Targeted ESLint output.
- Release control gate output.
- Future Source L4/cube readback proof and signed-in Home/Source screenshots.

## Known Gaps

This change does not run the data-build job. It also leaves non-Source Home domains on their existing read paths.
