# 2026-07-28-source-standard-guidebook — Source Standard Guidebook

## Release ID

`2026-07-28-source-standard-guidebook`

## Status

`candidate`

## Plain-English Summary

This release adds a polished HTML guidebook explaining AbarVa Source as the sourcing execution layer
inside the standard product boundary. It clarifies how Source works with Knowledge, Cube, aVa,
Superset, and Observable, and separates standard workflows from optional accelerators.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Adds a static Source guidebook for product education and scope alignment.
- Governance: Reuses the standard product boundary and explicitly states that the guidebook does not
  authorize runtime, schema, data-plane, or provider activation.

## Client Applicability

- All clients: Applies as standard product education.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/abarva-source/SOURCE_STANDARD_GUIDEBOOK.html`
- `docs/releases/records/2026-07-28-source-standard-guidebook.md`

## QA / Validation

- Pass: `git diff --check -- docs/abarva-source/SOURCE_STANDARD_GUIDEBOOK.html docs/releases/records/2026-07-28-source-standard-guidebook.md`
- Pass: `npm run release:check`
- Pass: local Chromium render QA using bundled Playwright: 10 sections, 25 cards, 3 tables, 0 horizontal overflow offenders.

## Rollout Plan

Merge through pull request. This is documentation only and does not deploy runtime code or mutate
tenant data.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this static guidebook.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not applicable.

## Rollback Plan

Revert the documentation PR. No runtime rollback is required.

## Audit Evidence

- Pull request URL: https://github.com/abarva-platform/abarva/pull/5723
- Validation output: `git diff --check` and `npm run release:check`.

## Known Gaps

This guidebook does not complete Source runtime proof, Superset provisioning, Observable proof,
baseline activation, or sourcing workflow certification.
