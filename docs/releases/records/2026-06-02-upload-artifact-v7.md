# 2026-06-02-upload-artifact-v7 — GitHub artifact upload action v7

## Release ID

`2026-06-02-upload-artifact-v7`

## Status

`candidate`

## Plain-English Summary

This release updates GitHub Actions artifact upload steps from older `actions/upload-artifact` versions to `actions/upload-artifact@v7`. These workflows produce CI and audit artifacts such as crawl reports, compliance packets, load-test outputs, and governance evidence. The change keeps artifact publishing on the current GitHub Actions runtime without changing product behavior.

## Layer Impact

`global-control-lane`: CI workflow artifact publishing only. No product UI, runtime route, data-plane schema, client data, feature flag, or customer-facing application behavior changes.

## Client Applicability

- All clients: Indirectly affected through healthier CI/audit artifact uploads.
- Specific clients: None.
- Internal only: Release operators, CI maintainers, and audit reviewers.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Update artifact upload actions in 19 workflow files, including post-deploy crawl, Lighthouse, bundle budget, dependency reporting, license/SBOM compliance, Azure governance, and RLS regression workflows.
- Add this release record for release-control traceability.

## QA / Validation

- PASS: `rg -n "actions/upload-artifact@v[46]" .github/workflows || true` returned no remaining v4/v6 workflow usages.
- PASS: `rg -n "actions/upload-artifact@v7" .github/workflows | wc -l` returned 22 v7 usages.
- PASS: PR checks on #2768 were green for AI surface control catalog, accessibility axe, architecture boundary, bundle budget, behavior coverage, dependency vulnerability report, hygiene gate, routes/disclaimers, license/SBOM, Lighthouse, ESLint, migration drift, no-auto-action boundary, production readiness, typecheck/reasoning, secret scanning, Wave 0, and Vercel contexts before this release record was added.
- NOT RUN YET: `git diff --check` and `npm run release:check -- --base origin/main --head HEAD`; to be run after this record is committed.
- NOT RUN YET: Post-merge main post-deploy crawl for this PR.

## Rollout Plan

Merge to `main`. The updated artifact action becomes active the next time each affected workflow runs. No Vercel runtime deploy, database migration, or application feature flag is required.

## Rollback Plan

Revert the PR to restore the prior artifact upload action versions in the affected workflows. No client data rollback or migration rollback is required.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2768
- CI run: To be added after release-control reruns with this record.
- Post-deploy crawl: To be added after merge if the standard main crawl runs.

## Known Gaps

This release only updates artifact upload actions. It does not change how artifact contents are generated, how long GitHub retains them, or which jobs are allowed to upload them. Any future artifact-retention, evidence-indexing, or compliance-pack structure changes should ship as separate release records.
