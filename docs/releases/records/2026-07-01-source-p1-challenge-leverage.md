# 2026-07-01-source-p1-challenge-leverage — Source P1 Vendor Challenge Log

## Release ID

`2026-07-01-source-p1-challenge-leverage`

## Status

`candidate`

## Plain-English Summary

Source now turns the live-proven Vendor Response MVE Profiles into a vendor-specific challenge log and commercial leverage seeds. The Responses stage can show what procurement should clarify before evaluation and which deal points should be pushed into BAFO.

## Layer Impact

- `global-control-lane`: Adds shared Source runtime and UI behavior for vendor response analysis.
- `public-demo`: Improves the SkyHarbor lab demo flow with synthetic, clearly labeled vendor profiles, challenge rows, and BAFO asks.

## Client Applicability

- All clients: The UI and deterministic derivation are shared.
- Specific clients: Synthetic profile data only binds when the Source event is identified as SkyHarbor AMS.
- Internal only: None.
- Public/demo only: The seeded vendor evidence is synthetic demo evidence.
- Feature flag: Existing Source page flags continue to control the simplified front and workspace visibility.

## Changes Included

- Added vendor challenge log and commercial leverage seed types.
- Added deterministic derivation from Vendor Response MVE Profiles.
- Added the `VendorChallengeLeveragePanel` in the Responses stage.
- Bound challenge/leverage evidence into the Source ask route when MVE profiles exist for the event.
- Added focused derivation and render tests.

## QA / Validation

- Focused Jest: pass — proposal-intelligence tests and VendorChallengeLeveragePanel render test.
- Scoped ESLint: pass — Source proposal-intelligence, response panels, Source canvas shell, Source event page, and Source ask route.
- Full TypeScript: blocked by pre-existing missing dependency declaration errors unrelated to this slice; this release also fixed the local missing prop error surfaced by the first run.
- Release check: pending rerun after this record update.
- Live signed-in Source proof: not run yet; required after merge/deploy if this release is promoted.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, then run signed-in SkyHarbor Source proof on the Responses stage.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: None outside the normal ACA deployment workflow.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Existing ACA workflow updates worker jobs to the deployed image.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback by reverting this PR or shifting ACA traffic back to the prior known-good revision. No schema or data-plane migration is included.

## Audit Evidence

- PR URL: To be added.
- Local test output: To be added.
- ACA deploy run and signed-in browser proof: To be added if deployed.

## Known Gaps

This slice still does not prove extraction from arbitrary uploaded 100-page vendor proposals. It derives challenge and leverage output from the seeded MVE profile records proven in Source P1 Slice 1.
