# 2026-07-13-data-pr29-new-client-onboarding-proof — Repeatable New-Client Onboarding Proof

## Release ID

`2026-07-13-data-pr29-new-client-onboarding-proof`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable new-client onboarding proof that turns the enterprise
data-layer runway into an operator-facing pilot contract. The proof defines the
minimum input packet, the onboarding workflow, target data-layer write modes,
proof gates, and guardrails required before a new tenant can move from intake to
candidate proof and later active access consideration.

This release does not load new-client data, write production tenant data,
promote a candidate, update Active Tenant Access, or change module runtime
behavior.

## Layer Impact

- `global-control-lane`: adds the standard new-client onboarding proof contract
  for all future tenants.
- `internal-admin`: adds generated JSON, Markdown, HTML, and CSV proof artifacts
  under `reports/new-client-onboarding-proof/reference-pilot/`.
- Runtime behavior: no change.

## Client Applicability

- All clients: applies as a proof contract for future onboarding.
- Specific clients: none receive runtime data changes.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/new-client-onboarding-proof/new-client-onboarding-proof.ts`
- `scripts/audit/build-new-client-onboarding-proof.ts`
- `npm run audit:new-client-onboarding-proof`
- `reports/new-client-onboarding-proof/reference-pilot/*`

## QA / Validation

- Pass: `npm run audit:new-client-onboarding-proof`
- Pass: `npx eslint scripts/audit/build-new-client-onboarding-proof.ts src/lib/enterprise-data/new-client-onboarding-proof/new-client-onboarding-proof.ts`
- Pass: isolated TypeScript compile for the new-client onboarding proof
  builder with Node types.
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main` and deploy through the normal Azure Container Apps main
workflow. This adds proof artifacts only and does not load any new client data or
change runtime reads.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: to be populated by ACA main deploy.
- ACA runtime invariant: required after merge/deploy.
- Worker image invariant: required after merge/deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: standard post-deploy crawl if merged to main.

## Rollback Plan

Revert the PR. Since this release is proof/report-only and does not load data,
rollback does not require data repair.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4730
- New-client onboarding proof:
  `reports/new-client-onboarding-proof/reference-pilot/new-client-onboarding-proof.json`
- Input checklist:
  `reports/new-client-onboarding-proof/reference-pilot/pilot-input-checklist.csv`
- Workflow checklist:
  `reports/new-client-onboarding-proof/reference-pilot/onboarding-workflow.csv`

## Known Gaps

This release does not onboard an actual external client, ingest private client
files, promote a new tenant, or make modules read new-client candidate data by
default.
