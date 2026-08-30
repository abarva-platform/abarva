# 2026-08-30-home-chapter-terminal-language — Home Chapter Terminal Language

## Release ID

`2026-08-30-home-chapter-terminal-language`

## Status

`candidate`

## Plain-English Summary

Home chapters with no verified statements now render as executive terminal states instead of
builder-facing absence messages. The page still refuses to invent conclusions, but the visible
language is appropriate for a leadership readout.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 / Products: updates Home v4 chapter rendering and the chapter-builder fallback copy. No
source, canonical, projection, serving, cube, or database schema changes are included.

## Client Applicability

- All clients: Yes, for Home v4 rendering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home routing/provider controls only.

## Changes Included

- `scripts/data-build/build-home-chapters.ts`: replaces empty-claim fallback prose with a cleaner
  executive terminal state.
- `src/components/home/v4/ChapterPage.tsx`: updates the empty chapter readout and card language.
- `src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx`: adds a regression test for an empty
  chapter so builder-facing absence language cannot return.

## QA / Validation

- `npx jest src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx tests/behaviors/build-home-chapters.test.ts --runInBand` — pass, 23/23.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow will publish the web runtime
with the next digest-pinned main deployment.

## Deployment Authority

- Repo-owned deploy workflow: Required for live web runtime.
- Shared runtime mutators: None in this release.
- Approved image digest: Set by the main ACA deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming the Home change is live.

## Rollback Plan

Revert the PR. This restores the prior Home chapter fallback copy and tests; no data rollback is
required.

## Audit Evidence

- Local Jest output for the Home v4 Tier 1 and chapter-builder behavior tests.
- Pull request and CI checks for this release candidate.
- ACA deployment run and signed-in Home proof after merge, if deployed.

## Known Gaps

This does not complete the deeper Home narrative quality work. It does not regenerate chapter
claims or run Claude-backed quality measurement.
