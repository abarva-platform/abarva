# 2026-08-01-skair-day-one-live-readback - Day-One Live Breach Readback

## Release ID

`2026-08-01-skair-day-one-live-readback`

## Status

`candidate`

## Plain-English Summary

Adds a live DB-backed day-one breach readback command for the isolated synthetic lab lane. The command re-evaluates the conservation scorecard after the Phase A candidate repair and can seed or graduate only the application and vendor entity-resolve expectations to fail when those two live checks pass.

## Layer Impact

Lane: `client-data-lane`.

Operations layer: reads design-expectation state and can seed or update only two application/vendor expectation rows when explicitly requested and live counts pass.

Evidence layer: reads source-field evidence to recompute expected application, vendor, derivation, partial-claim, and chunk counts.

Working layer: reads entity candidates for Phase A entity-resolve checks.

Knowledge, publication, consumption, and metrics layers: read-only counts for breach reporting.

Product layer: no product route or UI change.

## Client Applicability

- All clients: No.
- Specific clients: Isolated synthetic lab lane only.
- Internal only: Yes, operator verification only.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `scripts/qa/skyharbor-day-one-breach-readback.mjs`
- `package.json` script `qa:skair-day-one-breach-readback`
- Schema-drift hardening for `publication.projection_version.retired_at`, which exists in some exports/contracts but not in the isolated lab DB.
- Parameter-cast hardening for the explicit promotion seed path.

## QA / Validation

Local validation before merge:

- Pass: `node --check scripts/qa/skyharbor-day-one-breach-readback.mjs`.
- Pass: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json ok')"`.
- Pass: `npm run release:check`.
- Pass: restricted-token added-line scan.

Runtime validation after deploy:

- Not run yet: run through the isolated private operator job against the approved digest-pinned image.
- Not run yet: preserve the proof bundle in Downloads.

## Rollout Plan

Merge through PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image. The readback command becomes available only when explicitly invoked by an operator job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not changed by this release.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; this is an operator data-plane readback.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow. If the explicit promotion mode has updated the two expectation rows, change only those rows back to `on_breach='warn'` through the approved private operator path.

## Audit Evidence

- PR URL
- CI run
- Azure Container Apps deploy workflow run
- Operator job logs
- `day-one-live-breach-readback.json`
- `day-one-live-breach-readback.csv`
- `day-one-live-derivation-rule-breakdown.csv`
- Downloads ZIP with SHA-256

## Known Gaps

This command does not certify canonical promotion, publication, baseline activation, Cube parity, product rendering, or signed-in Knowledge behavior.
