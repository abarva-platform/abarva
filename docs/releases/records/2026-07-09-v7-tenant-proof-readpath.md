# 2026-07-09-v7-tenant-proof-readpath - V7 Tenant Proof Read Path

## Release ID

`2026-07-09-v7-tenant-proof-readpath`

## Status

`candidate`

## Plain-English Summary

This release tightens the Intelligence and Home read path for tenants with an active V7 dossier. When V7 evidence is available, Intelligence now grounds synthesis in that current V7 dossier instead of blending older same-tenant context that may contain stale planning assumptions. Home also treats analytics and reporting estate questions as applications/systems evidence questions so current-state system names and tools are selected deterministically.

## Layer Impact

- `global-control-lane`: Shared answer assembly changes for Intelligence source selection and Home V7 question routing.
- `client-data-lane`: Tenant V7 evidence packs become the dominant source for live tenant answer proof once loaded and active.

## Client Applicability

- All clients: Applies to any tenant with an active V7 dossier.
- Specific clients: Meridian proof, SkyHarbor upgrade proof, and Lakeshore regression proof are the immediate validation targets.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/index.ts`: suppresses legacy same-tenant retrieval sources when an active V7 dossier is present.
- `src/lib/intelligence/ask/retrievers/v7-dossier.ts`: selects systems and data-estate dimensions for analytics, reporting, BI, lakehouse, clinical, claims, pharmacy, Epic, Clarity, Caboodle, Tableau, SAS, Power BI, and SQL questions.
- `src/lib/home/know/v7-home-ask.ts`: routes analytics/reporting estate questions to the V7 applications/systems topic.
- Focused regression tests for V7 dossier selection and Home routing.
- Live proof harness: `scripts/qa/v7-tenant-foundation-live-proof.mjs`.

## QA / Validation

- Pass: `npm run tenant-v6:validate -- --tenant meridian-health --out datasets/meridian-health-v6-v7-current-state-v1`.
- Pass: `npm run v7:tenant:derive -- --tenant meridian-health --out datasets/meridian-health-v6-v7-current-state-v1`.
- Pass: Meridian V7 Azure load through ACA operator job `job-abarva-private-operator-eus-zqok46j`.
- Fail before this fix: live signed-in Meridian Intelligence proof mixed active V7 evidence with older Meridian synthetic context and produced unsupported legacy claims.
- Pending: focused Jest, ESLint, release check, PR CI, ACA deploy, runtime invariant, and live signed-in proof rerun.

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the image. After deployment, verify the ACA runtime invariant and rerun the signed-in tenant proof harness against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Repo-owned ACA main deploy workflow only.
- Approved image digest: Pending merge and deploy.
- ACA runtime invariant: Pending post-deploy verification.
- Worker image invariant: No worker template change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. If a V7 pack itself regresses, use the `intelligence_v7.active_tenant_pack_runs` candidate/active contract history to restore the prior active contract after operator review.

## Audit Evidence

- Local proof output before fix: `proof/v7-tenant-foundation-live/2026-07-09T22-11-16-509Z`.
- Meridian load logs: `/tmp/abarva-meridian-v7-load-20260709T220620Z/04-logs.txt`.
- Post-fix focused tests, PR URL, deploy logs, runtime invariant output, signed-in transcripts, screenshots, and claim-to-source reports are pending.

## Known Gaps

SkyHarbor existing-tenant upgrade proof and Lakeshore full regression proof still need post-deploy rerun before this can be called live-proven.
