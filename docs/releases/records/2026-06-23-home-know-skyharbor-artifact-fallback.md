# 2026-06-23-home-know-skyharbor-artifact-fallback — Home KNOW SkyHarbor Artifact Fallback

## Release ID

`2026-06-23-home-know-skyharbor-artifact-fallback`

## Status

`candidate`

## Plain-English Summary

This release prevents SkyHarbor Home KNOW artifact questions from returning blank answers when one read-model query fails under crawl pressure. Home now returns a partial answer with a specific table, chart, graph, or gap artifact instead of an empty response.

## Layer Impact

- `global-control-lane`: changes the shared Home KNOW answer path used by signed-in Home asks.
- `client-data-lane`: no schema or data migration; the change reads existing tenant read models more defensively.

## Client Applicability

- All clients: the blank-response guard and fail-soft read-model behavior apply globally.
- Specific clients: targeted regression coverage focuses on SkyHarbor because the live failures were SkyHarbor-only.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Home KNOW routing only; no new flag.

## Changes Included

- `src/lib/home/know/home-know-engine.ts`: fail-soft read-model fetches, read-error gaps, data/cloud/security/initiative table fallbacks, and coverage-backed chart fallback.
- `src/app/api/intelligence/ask/route.ts`: final Home KNOW blank-response guard that returns a visible artifact gap instead of an NDJSON error-only blank card.
- `src/lib/home/know/__tests__/home-know-engine.test.ts`: SkyHarbor regressions for the failing table, chart, graph, and exact-unknown prompt families.

## QA / Validation

- Passed: `npx jest src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand` — 23/23 tests.
- Blocked by existing dependency/type setup, not this patch: `npx tsc --noEmit` currently fails on missing declarations/packages for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.
- Pending after merge/deploy: rerun deployed deep reality crawl against the next ACA revision and compare against the `271/290` baseline from `ca-abarva-web-lab-eastus--mf9ee5ae4`.

## Rollout Plan

Merge to main, build the exact git SHA into an Azure Container Apps image, deploy to `ca-abarva-web-lab-eastus`, move 100% traffic to the new healthy revision, then rerun the signed-in deep reality crawl.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: Azure Container Apps deployment only.
- Approved image digest: to be captured after ACR build.
- ACA runtime invariant: template image, active revision image, and 100% traffic revision must match.
- Worker image invariant: no worker image change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, deep reality crawl with SkyHarbor artifact prompts.

## Rollback Plan

Rollback the ACA web app to the previous healthy revision, currently `ca-abarva-web-lab-eastus--mf9ee5ae4`, if the deployed crawl regresses tenant fence, Home expert leakage, raw ID leakage, or overall answer quality.

## Audit Evidence

- Prior baseline: live ACA revision `ca-abarva-web-lab-eastus--mf9ee5ae4`, reality crawl `271/290`, SkyHarbor `39/58`.
- Focused regression command: `npx jest src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand`.
- Pending evidence: PR URL, CI checks, deployed ACA revision, deep crawl `summary.json`, and `report.html`.

## Known Gaps

Deployed live proof is pending. Frontend release completion remains blocked until the post-deploy crawl shows no blank/no-prose SkyHarbor artifact responses.
