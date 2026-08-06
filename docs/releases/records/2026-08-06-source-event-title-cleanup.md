# 2026-08-06-source-event-title-cleanup — Source Event Title Cleanup Operator

## Release ID

`2026-08-06-source-event-title-cleanup`

## Status

`candidate`

## Plain-English Summary

Adds a narrow operator repair for stale visible Source event title copy after demo tenant consolidation. The repair is scoped to the active SkyHarbor Source event rows and replaces one retired display label with the canonical display label.

## Layer Impact

Release lane: `client-data-lane`.

Layer 3 Canonical Enterprise Model: no canonical facts, metrics, contracts, value claims, or Tower/Source marts change. The script repairs presentation text stored on the persisted Source event wrapper.

Layer 4 Products: Source portfolio cards read `source_events.event_name`, so the cleanup removes stale copy from the signed-in Source portfolio without changing Source UI logic.

## Client Applicability

- All clients: No.
- Specific clients: One active demo tenant only.
- Internal only: Operational repair script and release evidence.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `scripts/ops/repair-skyharbor-source-event-titles.mjs`
- `package.json` scripts:
  - `ops:skyharbor-source-event-title:repair`
  - `ops:skyharbor-source-event-title:repair:apply`

## QA / Validation

Candidate validation:

- Pass: `node scripts/ops/repair-skyharbor-source-event-titles.mjs --self-test`
- Pass: `node --check scripts/ops/repair-skyharbor-source-event-titles.mjs`
- Pass: `npm run release:check`
- Follow-up pass: `node scripts/ops/repair-skyharbor-source-event-titles.mjs --self-test` after fixing final readback parameter handling.
- Follow-up pass: `node --check scripts/ops/repair-skyharbor-source-event-titles.mjs`

Live validation required after merge and deploy:

- First operator attempt reached the script but failed after the update phase during final sample readback because the non-filtered sample query supplied an extra SQL parameter. The operator restored idle successfully.
- Pending: Rerun through the ACA private operator job with the deployed digest-pinned image.
- Pending: Inspect the structured proof event `skyharbor_source_event_title_repair`.
- Pending: Run signed-in Source portfolio proof and confirm the stale label is absent.

## Rollout Plan

Merge to main, let the repo-owned Azure Container Apps deploy workflow build and deploy the image, then run the repair script through the ACA private operator job using the deployed digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: ACA private operator job for the database repair script only.
- Approved image digest: Captured after main deploy.
- ACA runtime invariant: Must be proven after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Code rollback is a revert of this release if the operator should no longer be available. The database repair is intentionally narrow and only replaces a retired display phrase in SkyHarbor Source event wrapper text. Restoring the retired phrase is not expected to be a valid rollback.

## Audit Evidence

- PR URL
- ACA main deploy run
- ACA operator job proof output
- Signed-in Source portfolio crawl logs

## Known Gaps

The script does not create or reclassify Source events. It only repairs stale visible text on existing rows.
