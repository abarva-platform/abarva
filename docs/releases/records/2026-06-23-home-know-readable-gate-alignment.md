# 2026-06-23-home-know-readable-gate-alignment — Home KNOW Readability and Gate Alignment

## Release ID

`2026-06-23-home-know-readable-gate-alignment`

## Status

`candidate`

## Plain-English Summary

Home KNOW answers now use a short consultant-readable shape (`Read:` and `Evidence:`) while still staying factual and deterministic. The tenant matrix also checks named expert routing through the Intelligence-mode ask path instead of requiring Home KNOW lookup answers to emit experts, which would violate the Home backend safety contract.

## Layer Impact

- `global-control-lane`: changes shared Home KNOW prose shaping and the existing deployed tenant-matrix proof script.
- `client-data-lane`: no data/schema/load change; the response still reads existing Home read models only.

## Client Applicability

- All clients: yes, all five canonical tenants using Home KNOW and the tenant matrix.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `src/lib/home/know/home-know-engine.ts`: shapes lookup, gap, chart, and graph prose as concise `Read:` / `Evidence:` sections without introducing decision-frame language.
- `scripts/qa/tenant-matrix-gate.mjs`: keeps Home-mode checks for factual retrieval, visual artifacts, and grounding, but probes named experts through the Intelligence-mode ask path where expert routing belongs.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand` passed 7/7, with pre-existing duplicate manual mock warnings.
- `npx eslint src/lib/home/know/home-know-engine.ts scripts/qa/tenant-matrix-gate.mjs` passed.
- Pre-fix deployed matrix on revision `ca-abarva-web-lab-eastus--m90ba1a2c`: 5/5 tenants render Home + Intelligence, expose 19 dimensions, ground tenant answers, block tenant leakage, but fail `readable`, `visual`, and `experts`.

## Rollout Plan

Merge to `main`, build the exact git SHA into an Azure Container Apps image, deploy to `ca-abarva-web-lab-eastus`, shift 100% traffic to the healthy revision, then rerun signed-in `scripts/qa/tenant-matrix-gate.mjs` and the reality crawl.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: Azure Container Apps web runtime only.
- Approved image digest: to be recorded after deploy.
- ACA runtime invariant: template image, active revision image, and 100% traffic revision must match.
- Worker image invariant: no worker image change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, tenant matrix plus screenshot/report refresh.

## Rollback Plan

Rollback the ACA web app to the previous approved digest or revert this PR. No data migration or schema rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deploy digest: pending.
- Live matrix/report: pending after deploy.

## Known Gaps

This aligns the Home KNOW readability and the matrix expert probe. It does not complete the deeper reality-crawl target, Tower's ask-thread adapter, or all strategy answer-quality work.
