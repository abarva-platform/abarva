# 2026-05-28-meridian-context-layer-showcase - Meridian Healthcare Context Layer Showcase

## Release ID

`2026-05-28-meridian-context-layer-showcase`

## Status

`candidate`

## Plain-English Summary

Adds a Meridian-specific healthcare context-layer showcase so a pilot buyer can
see how synthetic operator files become evidence-backed, agent-ready context.
The release adds 26 upload templates, 8 guided upload scenarios, a template
catalog, a buyer-facing walkthrough, and a verifier that locks the showcase
floor.

## Layer Impact

- `client-data-lane`: expands Meridian's synthetic context-layer artifact set
  with healthcare-specific upload templates across clinical, revenue-cycle, IT,
  regulatory, vendor, workforce, finance, and data-platform dimensions.
- `app-control-lane`: no runtime changes.
- `agent-quality-lane`: clarifies which template families unlock Sentinel,
  Source, Moves, Tower, audit, and data-trust workflows.
- `ops-release-lane`: adds a deterministic verifier for the Meridian showcase.

## Client Applicability

- Meridian Health: directly applicable to the healthcare pilot walkthrough.
- Apex Retail, Northstar MedTech, SkyHarbor Air: no runtime or data changes.
- All clients: no control-plane behavior change.

## Changes Included

- `datasets/meridian-health-synthetic-v1/17-upload-templates/*`
- `datasets/meridian-health-synthetic-v1/18-upload-scenarios/*`
- `docs/build/meridian/MERIDIAN_CONTEXT_LAYER_SHOWCASE.md`
- `scripts/verify/meridian-context-showcase.mjs`
- `npm run verify:meridian-context-showcase`

## QA / Validation

- PASS: `npm run verify:meridian-context-showcase`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`

## Audit Evidence

- `docs/build/meridian/MERIDIAN_CONTEXT_LAYER_SHOWCASE.md` gives the
  buyer-facing explanation of the change, impact layer, and pilot use.
- `datasets/meridian-health-synthetic-v1/17-upload-templates/template-catalog.json`
  is the machine-readable catalog for the 26 upload templates.
- `datasets/meridian-health-synthetic-v1/18-upload-scenarios/*` provides the
  eight guided scenario walkthroughs with upload sets, agent value, and evidence
  checks.
- `npm run verify:meridian-context-showcase` verifies the 26-template,
  8-scenario, 26-dimension showcase floor.
- `npm run release:check -- --base origin/main --head HEAD` verifies the release
  control record and required audit sections.
- `git diff --check` verifies whitespace cleanliness before merge.

## Rollout Plan

Merge after CI is green. The change is docs and synthetic dataset content only;
it does not mutate production tenant data.

## Rollback Plan

Revert this commit to remove the Meridian showcase artifacts and verifier.
No database rollback is required.

## Known Gaps

This release proves Meridian's context-layer demonstration mechanics. It does
not create the full healthcare industry corpus. That corpus remains a separate
workstream targeting 20 or more dimensions and 50 or more patterns per
dimension.
