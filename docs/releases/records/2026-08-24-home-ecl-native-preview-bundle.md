# 2026-08-24-home-ecl-native-preview-bundle — Home ECL native preview bundle

## Release ID

`2026-08-24-home-ecl-native-preview-bundle`

## Status

`candidate`

## Plain-English Summary

Changes the Home ECL preview provider so it builds the Home review bundle from ECL projection rows instead of wrapping dense ECL estate rows in the older golden-snapshot narrative. This prevents the preview from showing current dense estate counts while retaining stale chapter prose from a prior source plane.

## Layer Impact

`global-control-lane`: Home preview provider behavior changes when the explicit ECL projection provider is selected. No default provider is repointed, and no data-plane load is performed by this release.

## Client Applicability

- All clients: No default behavior change.
- Specific clients: Synthetic lab preview only when the ECL projection provider is explicitly requested.
- Internal only: Home/ECL validation and preview work.
- Public/demo only: None.
- Feature flag: Existing explicit provider selection.

## Changes Included

- `src/lib/home/preview/ecl-projection-bundle.ts` now builds an ECL-native Home review bundle: provenance, thesis, signal packet, chapters, visual datasets, and technology estate all come from the same ECL projection basis.
- `src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts` adds a regression test proving the ECL provider no longer carries the golden-snapshot executive headline when dense ECL rows are supplied.

## QA / Validation

- Pass — `npx jest src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts --runInBand --silent`
- Pass — `npx eslint src/lib/home/preview/ecl-projection-bundle.ts src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts`
- Pass — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false --project tsconfig.json`
- Pass expected before merge — `npm run release:check`

## Rollout Plan

Merge to main by pull request. The existing Home ECL preview remains gated by explicit provider selection and still requires populated `ecl_projection.home_enterprise_landscape` rows before it can render.

## Deployment Authority

- Repo-owned deploy workflow: Required only through the normal main deploy workflow after merge.
- Shared runtime mutators: None in this release.
- Approved image digest: Set by the repo-owned deploy workflow.
- ACA runtime invariant: Required before claiming deployed runtime.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes before claiming product/browser proof.

## Rollback Plan

Revert the PR to restore the prior ECL provider behavior. No schema or data rollback is needed.

## Audit Evidence

- Pull request for this release.
- Focused unit test proving ECL rows do not inherit the golden-snapshot headline.
- ESLint and TypeScript command output from the release branch.

## Known Gaps

Azure still needs a fresh governed ECL all-layer load/readback before the ECL Home preview can render against lab data. This release does not claim browser proof or default-provider cutover.
