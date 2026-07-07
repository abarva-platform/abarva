# 2026-06-06-meridian-sacramento-profile-correction — Meridian Sacramento Integrated Profile Correction

## Release ID

`2026-06-06-meridian-sacramento-profile-correction`

## Status

`candidate`

## Plain-English Summary

Corrects the Meridian synthetic tenant profile so the next governed loader run uses the intended buyer story: a Sacramento-based integrated regional health system with 30+ hospitals, not a smaller generic healthcare profile. The profile remains explicitly synthetic and does not claim confidential PHS data is loaded.

## Layer Impact

- `client-data-lane`: Updates the Meridian dataset bootstrap file read before client-scoped context chunks, applications, initiatives, and vendor contracts are loaded.

## Client Applicability

- All clients: No.
- Specific clients: Meridian synthetic healthcare demo tenant only.
- Internal only: No.
- Public/demo only: Supports the Meridian/PHS-inspired pilot proof lane.
- Feature flag: Not applicable.

## Changes Included

- `datasets/meridian-health-synthetic-v1/00-profile/enterprise-profile.yaml`
- `docs/releases/records/2026-06-06-meridian-sacramento-profile-correction.md`

## QA / Validation

- Reviewed the profile fields for the intended Sacramento/Northern California integrated health system framing.
- Confirmed the profile retains the existing Meridian `client_id` and tenant key.
- Confirmed the data policy remains synthetic and excludes confidential PHS data claims.
- `git diff --check`
- `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. No Vercel runtime deploy is required for this dataset-only correction. The corrected profile becomes active when the private Azure loader reruns the Meridian reset/reload package.

## Rollback Plan

Revert this PR. If the corrected profile has already been loaded, rerun the governed Meridian reset/load process with the prior profile rather than manually editing production data.

## Audit Evidence

- Pull request for this change.
- Post-merge Meridian loader logs showing Phase 0 client profile success.
- Post-load signed-in Admin evidence map and source count screenshots.

## Known Gaps

The Azure Blob write authorization blocker remains open. This correction prevents bad profile facts from being loaded once that infrastructure gate is fixed; it does not itself persist Meridian context into the live data plane.
