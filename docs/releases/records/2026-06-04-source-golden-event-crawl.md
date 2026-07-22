# 2026-06-04-source-golden-event-crawl — Source Golden Event Prod Crawl

## Release ID

`2026-06-04-source-golden-event-crawl`

## Status

`candidate`

## Plain-English Summary

This release refreshes the Apex Retail AMS Source Golden Event end-to-end spec after a production-only crawl. Stages 1 and 2 remain documented as green, while Stages 3 through 11 are still intentionally skipped because production does not yet expose the required user-visible proof for those stage contracts. Each remaining skip now explains the exact product gap in plain English instead of using terse audit codes.

## Layer Impact

`internal-admin` — Updates the internal QA and pilot-readiness test contract for the Source lane. No runtime route, database schema, tenant data, or production UI behavior changes.

## Client Applicability

- All clients: No runtime change.
- Specific clients: Apex Retail Golden Event QA contract only.
- Internal only: Source E2E crawl documentation and test skip reasons.
- Public/demo only: Not applicable.
- Feature flag: None.

## Changes Included

- `tests/e2e/source/golden-event-apex-ams.spec.ts`
  - Adds the 2026-06-04 crawl summary.
  - Replaces remaining Stage 3 through Stage 11 audit-code skips with plain-English gap descriptions.
  - Keeps Stage 2 as a default-skipped mutating probe unless `RUN_SCOPE_PROBE=1`.
  - Tightens the Stage 5 evaluation rubric selector to avoid a Playwright strict-mode false failure once the stage is enabled.

## QA / Validation

Production-only probes were run against `https://nexus-vert-kappa.vercel.app` with `BASE_URL` set by the prod E2E command and Clerk auth using `.env.local`.

- `npm run test:e2e:prod -- tests/e2e/source/golden-event-apex-ams.spec.ts --grep "Stage 3" --workers=1` — prod reached RFP; gap remains AI Draft label.
- `npm run test:e2e:prod -- tests/e2e/source/golden-event-apex-ams.spec.ts --grep "Stage 4" --workers=1` — prod reached Responses; gap remains seeded vendor visibility.
- `npm run test:e2e:prod -- tests/e2e/source/golden-event-apex-ams.spec.ts --grep "Stage 5" --workers=1` — prod reached Evaluation; gap remains gate advance control availability.
- `npm run test:e2e:prod -- tests/e2e/source/golden-event-apex-ams.spec.ts --grep "Stage 6" --workers=1` — prod reached Pricing; gap remains AI Draft label.
- `npm run test:e2e:prod -- tests/e2e/source/golden-event-apex-ams.spec.ts --grep "Stage 7" --workers=1` — prod reached BAFO; gap remains shortlist vendor visibility.
- `npm run test:e2e:prod -- tests/e2e/source/golden-event-apex-ams.spec.ts --grep "Executive Decision" --workers=1` — prod reached Executive Decision; gap remains required Evidence section.
- `npm run test:e2e:prod -- tests/e2e/source/golden-event-apex-ams.spec.ts --grep "Stage 9" --workers=1` — prod reached Selection; gap remains award-letter download proof.
- `npm run test:e2e:prod -- tests/e2e/source/golden-event-apex-ams.spec.ts --grep "Stage 10" --workers=1` — prod reached Transition; gap remains APX-CDP-2026 / Q3 / data-migration dependency reference.
- `npm run test:e2e:prod -- tests/e2e/source/golden-event-apex-ams.spec.ts --grep "Value Ledger" --workers=1` — prod reached Value; gap remains baseline/projected/realized Value Ledger columns.

Additional validation:

- `npx eslint tests/e2e/source/golden-event-apex-ams.spec.ts` — passed.
- `npm run release:check` — passed.
- `npm run test:e2e:prod -- tests/e2e/source/golden-event-apex-ams.spec.ts --grep "Stage 3|Stage 4|Stage 5|Stage 6|Stage 7|Executive Decision|Stage 9|Stage 10|Value Ledger" --workers=1` — passed as the crawled-stage skip contract; 9 skipped with the refreshed inline gap descriptions.
- `npm run test:e2e:prod -- tests/e2e/source/golden-event-apex-ams.spec.ts --workers=1` — attempted against prod; the default run is currently blocked by Stage 1 drift before the Stage 3 through Stage 11 skipped tests execute. Prod renders the Source workspace, but the known-green Stage 1 mutating test now expects the older strategy artifact editor slots while the current Document tab shows DB-backed stored documents.

## Rollout Plan

Merge the PR to `main`. The change becomes active as the updated QA contract in the repository. No data migration or runtime rollout is required.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable for the original test-contract-only crawl record.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable for the original test-contract-only crawl record.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes for any later runtime Source approval UX release; not required for this original crawl-record-only contract update.

## Rollback Plan

Revert the PR to restore the prior Golden Event skip annotations and selector behavior. No database or infrastructure rollback is required.

## Audit Evidence

- Production probe logs are held locally under `/private/tmp/golden-event-probe/` for this crawl session.
- PR diff will show the updated Stage 3 through Stage 11 gap comments and crawl summary.
- CI and release-check output on the PR provide repository-level validation evidence.

## Known Gaps

Production still lacks the following Golden Event proof surfaces before Stages 3 through 11 can be unskipped: RFP and Pricing AI Draft labels, Responses and BAFO vendor visibility, Evaluation gate-advance control, Executive Decision Evidence section and full decision brief proof, Selection award-letter download, Transition APX-CDP-2026 dependency reference, and Value Ledger baseline/projected/realized columns with decision linkbacks.

The default full Golden Event run also needs a separate Stage 1 follow-up: either restore the expected strategy artifact editor slots in prod or update the Stage 1 mutating test to the current DB-backed document workflow. That is outside this Stage 3 through Stage 11 incremental crawl PR.

## 2026-07-22 Golden Event Extension Addendum

### Scope

The SRC-004 Apex Retail AMS golden-event spec now adds explicit coverage for the four Source shell features shipped after the original June crawl:

- `SOURCE-SHELL-003`: stage-keyed approvals ledger records Strategy, Scope, and RFP gate approvals through the real approval API and expects an 11-row approvals workspace.
- `SOURCE-SHELL-004`: artifact acceptance is exercised through the Files workspace and remains separate from the stage approval ledger.
- `SOURCE-SHELL-005`: Responses stage asserts the real vendor-response coverage UI, including per-vendor lever coverage, instead of the old Scope sample fallback.
- `SOURCE-SHELL-006/007`: future-stage shell previews assert stage-matched content or honest placeholders rather than silent Scope fallback content.

### QA / Validation

- `npx eslint tests/e2e/source/golden-event-apex-ams.spec.ts` — passed for the extended spec.
- `SOURCE_AUTH_REFRESH=1 npx playwright test tests/e2e/source/golden-event-apex-ams.spec.ts --grep "SOURCE-SHELL" --workers=1 --timeout=120000` — blocked locally before governed crawl completion because the developer machine cannot resolve the private Azure Postgres lab hostname used by the Source test-reset and acknowledgment paths: `getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com`.
- `az postgres flexible-server show --name pg-abarva-context-lab-001 --resource-group rg-abarva-database-lab-eastus2 --query "{publicNetworkAccess:network.publicNetworkAccess,privateDnsZoneArmResourceId:network.privateDnsZoneArmResourceId,fullyQualifiedDomainName:fullyQualifiedDomainName}" -o json` — confirmed `publicNetworkAccess` is `Disabled` and the server is bound to the private DNS zone `privatelink.postgres.database.azure.com`.

### Current Status

The new golden-event assertions are committed as the next test contract, but they are not claimed green from this laptop. A real governed crawl must run from an environment with private Azure Postgres reachability, or after deploying this branch through an approved runtime that can reach the private data plane.

### UX Note

The P1 approval workflow also needs a focused UX simplification pass. Recommendations are captured in `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md`; that note intentionally does not change product UI in this test-only branch.
