# 2026-07-01-source-p1-mve-simplefront-visibility — Source P1 MVE Profile Visibility

## Release ID

`2026-07-01-source-p1-mve-simplefront-visibility`

## Status

`candidate`

## Plain-English Summary

Source P1 Vendor Response MVE profiles were generated for SkyHarbor-style vendor response packages, but the simplified Source stage screen did not show them to the user. This release surfaces the same Vendor Response Profiles panel directly on the Stage 04 Responses simple front so a signed-in user can see the normalized sourcing-critical extraction record without hunting through internal workspaces.

## Layer Impact

- `global-control-lane`: Source stage rendering changes for the shared Source canvas component.
- `public-demo`: Improves the live demo path for Source P1 Vendor Response MVE Profile visibility.

## Client Applicability

- All clients: The render-path capability is shared, but the panel only appears when a Source event has a bound vendor response profile set.
- Specific clients: SkyHarbor/Airline Demo receives the current synthetic demo profile set.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Respects the existing Source simple-front behavior; no new flag.

## Changes Included

- `src/components/source/canvas/UniversalCanvasShell.tsx` now renders `VendorResponseProfilesPanel` below the Stage 04 Responses simple front when a profile set exists.

## QA / Validation

- PASS: `npx eslint src/components/source/canvas/UniversalCanvasShell.tsx src/components/source/canvas/responses src/lib/source/proposal-intelligence`.
- PASS: `npx jest src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts --runInBand`.
- NOT RUN YET: PR CI, ACA deploy, and signed-in browser proof. These run after the candidate branch is pushed and merged.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, then verify `https://app.abarva.ai/source/events/<eventId>?stage=responses` with a signed-in SkyHarbor/Airline Demo user.

## Deployment Authority

- Repo-owned deploy workflow: `ACA main deploy`.
- Shared runtime mutators: GitHub Actions Azure OIDC deploy workflow only.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by the ACA main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this UI-only commit and redeploy through the ACA main deploy workflow. No migration or data rollback is required.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- ACA deploy run: Pending.
- Signed-in proof folder: `/Users/anand/Downloads/source-p1-mve-profile-proof-2026-07-01T02-43-00-177Z`.

## Known Gaps

None known for the visibility fix. The synthetic profile content remains demo-labeled and should not be treated as production vendor evidence.
