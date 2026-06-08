# 2026-06-08-azure-runtime-governance - Retire Vercel Production Runtime Assumptions

## Release ID

`2026-06-08-azure-runtime-governance`

## Status

`candidate`

## Plain-English Summary

This release removes active Vercel production-runtime instructions from the repository now that `app.abarva.ai` is served by Azure Container Apps. It prevents future agents and operators from treating Vercel build hooks, Vercel smoke URLs, or Vercel status tokens as the canonical production path.

## Layer Impact

- `global-control-lane`: Updates shared release, deployment, readiness, and access-check guidance for all operators and agents.
- `internal-admin`: Updates admin production-readiness deployment-status labels from GitHub/Vercel to GitHub/Azure.

## Client Applicability

- All clients: Production runtime guidance and admin readiness labels now point to Azure.
- Specific clients: None.
- Internal only: Operator scripts, release scaffolds, and readiness/reporting surfaces.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Removed `vercel.ts`, `scripts/vercel-build.sh`, and the Vercel migration-session guard.
- Removed the `@vercel/config` package dependency.
- Repointed production e2e and smoke defaults to `https://app.abarva.ai`.
- Replaced the Vercel migration runbook with an Azure/Postgres migration runbook.
- Reworked `scripts/check-access.mjs` to validate Clerk, Azure/Postgres, GitHub CLI, Azure CLI, and Azure production health instead of Supabase, Pinecone, Neo4j, or Vercel.
- Updated admin deployment-status read models and tests from GitHub/Vercel to GitHub/Azure.
- Updated security posture and security questionnaire docs to describe Azure Container Apps as the current shared control-plane runtime.

## QA / Validation

- PASS: `node --check scripts/check-access.mjs`.
- PASS: `node scripts/audit/architecture-rules.mjs --self-test`.
- PASS: targeted admin deployment-status and readiness tests:
  `npx jest src/__tests__/integration/admin/deployment-status-ingestion.test.ts src/__tests__/integration/admin/deployment-status-card.test.ts src/__tests__/integration/admin/live-ci-status-stub.test.ts src/__tests__/integration/admin/production-readiness-live-refresh.test.ts src/__tests__/integration/admin/production-readiness-tracker.test.ts src/__tests__/integration/qa/production-readiness-page-verification.test.ts src/lib/admin/__tests__/release-ledger.test.ts --runInBand`.
- PASS: ESLint on touched runtime/test/script files.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. This is a repo-governance and operator-instruction update; it does not itself deploy an Azure image or mutate cloud resources. Future runtime deploys must use the Azure Container Apps path documented in `docs/deployment/migrations.md`.

## Rollback Plan

Revert the PR if the team intentionally re-enables Vercel as a production runtime. Do not partially restore `vercel.ts` or `scripts/vercel-build.sh` without a matching architecture decision and release record.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Additional evidence: `https://app.abarva.ai` remains the production smoke target in scripts and release templates.

## Known Gaps

Historical docs, archived reports, and third-party corpus references may still mention Vercel. This release removes active runtime/config/operator paths; a larger archive cleanup can follow separately if desired.
