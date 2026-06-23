# 2026-06-23-home-know-no-data-prose — Home KNOW No-Data Prose Quality

## Release ID

`2026-06-23-home-know-no-data-prose`

## Status

`candidate`

## Plain-English Summary

This release improves Home KNOW answers when related tenant context exists but the exact rows needed for a data or strategy question are missing. Instead of a terse one-line no-data answer, Home now explains the specific missing evidence path while keeping the response grounded and non-decision-oriented.

## Layer Impact

- `global-control-lane`: changes shared Home KNOW prose for no-data responses.
- `client-data-lane`: no schema, data, or loader change.

## Client Applicability

- All clients: yes.
- Specific clients: verified because the live crawl surfaced the miss most visibly on SkyHarbor, but the no-data prose path is shared.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Home KNOW routing only.

## Changes Included

- `src/lib/home/know/home-know-engine.ts`: richer no-data prose when related tenant coverage/gap metadata exists.
- `src/lib/home/know/__tests__/home-know-engine.test.ts`: updated no-data expectation to require a synthesized, grounded explanation.

## QA / Validation

- Passed: `npx jest src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand` — 23/23.
- Passed: `npx eslint src/lib/home/know/home-know-engine.ts src/lib/home/know/__tests__/home-know-engine.test.ts`.
- Pending after deploy: rerun deep signed-in reality crawl and compare against `268/290` from revision `ca-abarva-web-lab-eastus--m0448b6cf`.

## Rollout Plan

Merge to main, allow the repo-owned ACA main deploy workflow to build and deploy the exact SHA, then rerun the signed-in deep reality crawl.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: Azure Container Apps deployment only.
- Approved image digest: to be captured after deploy.
- ACA runtime invariant: template image, active revision image, and 100% traffic revision must match.
- Worker image invariant: no worker-specific change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, deep reality crawl.

## Rollback Plan

Rollback ACA to the previous healthy revision if the crawl regresses artifact presence, tenant fence, or leak checks.

## Audit Evidence

- Prior deployed crawl on `ca-abarva-web-lab-eastus--m0448b6cf`: `268/290`, artifacts all green, data/strategy misses caused by terse no-data prose.
- Pending evidence: PR, CI checks, deployed revision, crawl `summary.json`, and `report.html`.

## Known Gaps

Live proof is pending until this candidate is merged and deployed.
