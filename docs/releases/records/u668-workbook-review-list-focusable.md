# u668 — The stored workbook review list scrolls from the keyboard

## Release ID

`2026-10-17-moves-workbook-review-list-focusable`

## Status

`candidate`

## Plain-English Summary

The live walk scores the P3 gate page 95/100 for accessibility because of one axe finding: `scrollable-region-focusable`, a region that scrolls but cannot be reached from the keyboard.

The stored-workbook review list on a gate scrolls, by design, so every stored response can be judged. Its only focusable contents are the checkboxes. When the review is read-only, every one of those checkboxes is disabled. The list then still scrolls, but nothing inside it can take focus, so a keyboard user cannot scroll it.

The list now takes focus itself (`tabIndex={0}`). It keeps its existing group role and its "Stored workbook responses" label. Nothing else changes.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves phase workspace):** one attribute. No data, route or behaviour change.

## Client Applicability

- **All clients:** yes.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: `tabIndex={0}` on the scrolling review list.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: asserts it.

## QA / Validation

- Targeted phase-workspace tests pass. ESLint clean; `npm run typecheck` clean.
- The walk did not record the axe target, so this is the most likely source rather than a confirmed one: it is the gate page's only scrolling region whose focusable contents can all be disabled. The next post-deploy walk's accessibility score for the gate confirms or refutes it.

## Rollout Plan

Ships in the next repo-owned ACA main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's gate accessibility score.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **If the gate still scores 95, the finding comes from another region.** The walk should then record axe targets so the region can be named.

## Audit Evidence

- PR URL and CI run.
- The post-deploy walk summary.
