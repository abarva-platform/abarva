# 2026-07-05-product-development-release-guidebook - Product Development And Release Guidebook

## Release ID

`2026-07-05-product-development-release-guidebook`

## Status

`candidate`

## Plain-English Summary

Adds a standalone HTML guidebook that defines the future AbarVa product development and release operating model for Product Dev, Product Preview, Product Prod, and future client-specific environments. The guidebook is written for Anand, future team members, and coding agents so everyone follows the same backlog, release, deployment authority, data-build, proof, and pilot-readiness rules.

This is a documentation and operating-governance change only. It does not deploy runtime code, mutate Azure, change Clerk, move DNS, migrate data, or load client datasets.

## Layer Impact

- `ops-release-lane`: Defines the human and agent operating rules for backlog intake, branch ownership, PR/release records, environment promotion, evidence, and emergency break-glass handling.
- `app-control-lane`: No runtime behavior changes. The guidebook describes how shared Product environments should be used and proved.

## Client Applicability

- All clients: Indirectly applies to all clients by defining how client-impacting work must be promoted and proved.
- Specific clients: None.
- Internal only: Yes. The artifact is for AbarVa internal product, engineering, release, and agent operations.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `docs/guides/product-development-release-guidebook.html`.
- Added this release record.

## QA / Validation

- Pass: HTML file was created as a standalone static artifact with responsive CSS and no runtime dependency.
- Pass: Guidebook content aligns to the current repo operating rules in `AGENTS.md`, `docs/releases/RELEASE_CONTROL_POLICY.md`, `docs/ops/aca-data-build-job-rule.md`, and the 2026-07-04 Product release operational evidence.
- Pass: `git diff --check -- docs/guides/product-development-release-guidebook.html docs/releases/records/2026-07-05-product-development-release-guidebook.md`.
- Pass: Non-ASCII scan reported `non_ascii=0` for the HTML guidebook and release record.
- Pass: Node content check confirmed the expected major guidebook sections are present.
- Pass: Browser visual smoke rendered the static HTML with Playwright and captured `reports/product-development-release-guidebook-preview.png`.
- Pass: `npm run release:check -- --base origin/main --head HEAD` completed successfully and reported no release-relevant file changes.

## Rollout Plan

Merge through the normal PR path. No Azure Container Apps deployment is required for the guidebook to exist in the repository. If the guidebook should be hosted in the product or docs site later, open a separate release to add navigation or publishing.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable. No runtime deployment.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not applicable for this documentation artifact.

## Rollback Plan

Revert the PR that adds the HTML guidebook and this release record. No runtime rollback, database rollback, Azure rollback, or Clerk rollback is required.

## Audit Evidence

- Guidebook: `docs/guides/product-development-release-guidebook.html`.
- Release record: `docs/releases/records/2026-07-05-product-development-release-guidebook.md`.

## Known Gaps

- The guidebook has not yet been linked from onboarding, release cadence, or backlog index pages.
- Product Clerk signed-in smoke remains a separate operational blocker; this guidebook names that class of blocker but does not fix Clerk configuration.
