# 2026-05-30-section9-skyharbor-stress-profile - Section 9 SkyHarbor Stress Profile

## Release ID

`2026-05-30-section9-skyharbor-stress-profile`

## Status

`candidate`

## Plain-English Summary

This release teaches the full-module stress runner how to run the Packet 34
walkthrough against SkyHarbor Air. The runner already supported Apex, Meridian,
First Capital, and Northstar. SkyHarbor needed its own persona, tenant identity
markers, wrong-tenant leak checks, airline grounding vocabulary, and
airline-specific agent questions before Section 9.5 could be executed honestly.

## Layer Impact

- `qa-validation-lane`: Adds the SkyHarbor stress profile used by Section 9.5.
- `audit-control-lane`: Makes Apex and SkyHarbor walkthrough evidence use the
  same crawl harness.
- `runtime-app-lane`: No application runtime code change.
- `data-plane-lane`: No database mutation.

## Client Applicability

- All clients: No. This is a SkyHarbor crawl harness profile.
- Specific clients: SkyHarbor Air.
- Feature flag: None.

## Changes Included

- `scripts/audit/run-full-module-stress.mjs`

## QA / Validation

- PASS: `node --check scripts/audit/run-full-module-stress.mjs`
- PENDING: Section 9.5 live SkyHarbor production crawl after merge.

## Rollout Plan

Merge after CI is green. No production deployment is required for this harness
change, but Vercel may still build the branch through existing checks.

## Rollback Plan

Revert this PR. If the SkyHarbor crawl profile is wrong, regenerate the profile
from the canonical SkyHarbor persona definitions in `src/lib/auth/cxo-personas.ts`
and rerun Section 9.5.

## Audit Evidence

- Existing SkyHarbor persona source: `src/lib/auth/cxo-personas.ts`
- Existing SkyHarbor substrate source:
  `datasets/skyharbor-air-synthetic-v1/`

## Known Gaps

This PR only enables the stress runner. It does not execute or claim the
SkyHarbor walkthrough; that happens in Section 9.5 after this lands.
