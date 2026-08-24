# 2026-08-23-home-ecl-projection-preview-bridge — Home ECL Projection Preview Bridge

## Release ID

`2026-08-23-home-ecl-projection-preview-bridge`

## Status

`candidate`

## Plain-English Summary

Home preview can now opt into the dense ECL Home projection as its technology-estate evidence source with `provider=ecl_projection_db`. The route keeps the reviewed deterministic chapter bundle, but replaces the evidence records used by architecture, data-flow, and record-browse views with rows read from `ecl_projection.home_enterprise_landscape`.

## Layer Impact

- `global-control-lane`: Adds an opt-in preview reader path for Home.
- `Layer 4 PRODUCTS`: Home preview can consume ECL projection evidence when explicitly requested.
- `Layer 3 CANONICAL MODEL`: No schema or canonical-object contract change.
- `client-data-lane`: Reads synthetic dense lab/preprod ECL projection rows; no writes.

## Client Applicability

- All clients: No.
- Specific clients: Synthetic dense Meridian lab/preprod proof package only.
- Internal only: Yes, for governed preview/browser QA.
- Public/demo only: No.
- Feature flag: Query parameter `provider=ecl_projection_db` on `/home/preview`.

## Changes Included

- `src/app/(maestro)/home/preview/page.tsx`
- `src/lib/home/preview/ecl-projection-bundle.ts`
- `src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts`
- `docs/releases/records/2026-08-23-home-ecl-projection-preview-bridge.md`

## QA / Validation

- `npm exec -- jest src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts --runInBand` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npm exec -- tsc -p tsconfig.json --noEmit --pretty false` passed.

## Rollout Plan

Merge to main and deploy through the repo-owned ACA workflow. Browser QA should then use `/home/preview?tenant=meridian-health&provider=ecl_projection_db` and verify the architecture, data-flow, and record-browser evidence counts/rendering before any default Home route is repointed.

## Deployment Authority

- Repo-owned deploy workflow: Required before shared runtime use.
- Shared runtime mutators: None in this PR.
- Approved image digest: Not applicable until the repo-owned deploy workflow builds the next image.
- ACA runtime invariant: Must be verified by the deploy workflow.
- Worker image invariant: Not changed by this PR.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming the ECL-backed Home preview works in the browser; not claimed by this PR.

## Rollback Plan

Revert this release record and the Home preview reader changes. The default Home preview snapshot path remains available because the ECL provider is opt-in.

## Audit Evidence

- `src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts`
- `src/lib/home/preview/ecl-projection-bundle.ts`

## Known Gaps

- This does not repoint the default `/home` route.
- This does not regenerate Claude-authored chapters from ECL context.
- Browser proof is still required after deploy.
