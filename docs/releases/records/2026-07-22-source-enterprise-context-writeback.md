# 2026-07-22-source-enterprise-context-writeback — Source Enterprise Context Writeback

## Release ID

`2026-07-22-source-enterprise-context-writeback`

## Status

`candidate`

## Plain-English Summary

Source now has a governed writeback path that can project eligible typed Source facts into the Azure/Postgres enterprise context layer. The path is intentionally conservative: facts must be persisted, cited, non-stale, and valued before they are written, and the resulting governed readiness row stays `not_reviewed` plus `committed_not_indexed` until a later indexing and citation-proof job earns `agent_ready`.

## Layer Impact

- `client-data-lane`: Adds a Source-to-enterprise-context writeback module and operator entrypoint. It writes existing Source facts into existing enterprise context tables only when explicitly run with `--apply`; no schema migration is included.
- `internal-admin`: Adds a dry-run-first operator command for planning or applying one tenant-scoped Source event writeback. It is not wired to a user-facing route.

## Client Applicability

- All clients: The code path is generic for any tenant with persisted `source_event_facts`.
- Specific clients: None hard-coded.
- Internal only: Operator command only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/context-writeback/*`: Pure planner plus Azure/Postgres persistence seam for Source facts into `enterprise_context_records`, `enterprise_context_facts`, and `governed_object_readiness`.
- `src/scripts/source/writeback-source-facts-to-enterprise-context.ts`: Dry-run-first operator entrypoint that resolves a tenant-scoped Source event, reads its facts, reports eligibility/skips, and applies only with `--apply`.
- `package.json`: Adds `source:enterprise-context:writeback`.
- `src/lib/source/context-writeback/__tests__/source-context-writeback.test.ts`: Regression coverage for eligibility, deterministic replay IDs, readiness status, persistence mapping, and store failure handling.
- Follow-up runtime fix: the operator script uses a narrow Source event resolver instead of importing the full route query module, so the deployed ACA job runtime does not trip `server-only` under `tsx`.
- Follow-up data-shape fix: the writeback planner accepts finite numeric values returned from Azure/Postgres as strings, so valid cited numeric facts are not skipped as `missing_value`.
- Follow-up operator-job fix: the script accepts `SOURCE_WRITEBACK_CLIENT_KEY`, `SOURCE_WRITEBACK_EVENT_ID`, `SOURCE_WRITEBACK_APPLY`, and `SOURCE_WRITEBACK_OUT_DIR` env vars so the approved ACA operator-job wrapper can run dry-run/apply without unsupported npm pass-through arguments.

## QA / Validation

- PASS — `npx jest src/lib/source/context-writeback/__tests__/source-context-writeback.test.ts --runInBand`: passed, 7/7 tests. Jest also emitted existing duplicate-manual-mock warnings unrelated to this release.
- PASS — `npx eslint src/lib/source/context-writeback src/scripts/source/writeback-source-facts-to-enterprise-context.ts`: passed.
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`: passed after refreshing the isolated worktree's declared dependencies. The first attempt was blocked by missing installed Home graph dependencies (`@xyflow/react`, `@dagrejs/dagre`) in this worktree's `node_modules`.
- PASS — `npm run release:check`: passed after correcting this release record to include explicit pass/fail/not-run/blocked status for QA rows.
- PASS — `az containerapp exec ... node -e "<package/script presence check>"`: passed on deployed revision `ca-abarva-web-lab-eastus--m21a8161f`; package script was present and `src/scripts/source/writeback-source-facts-to-enterprise-context.ts` existed in the image.
- FAIL — `az containerapp exec ... npm run source:enterprise-context:writeback -- --client-key apex-retail --event-id apex-retail-ams-outsourcing-2026`: dry-run command failed before data access because the first merged script imported `src/lib/source/queries.ts`, which pulls a `server-only` dependency under `tsx` in the deployed operator runtime. Follow-up fix replaces that import with a narrow resolver.
- PASS — Follow-up fix validation: `npx eslint src/scripts/source/writeback-source-facts-to-enterprise-context.ts` passed.
- PASS — Follow-up fix validation: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` passed.
- PASS — Runtime dry-run after the operator import fix: `az containerapp exec ... npm run source:enterprise-context:writeback -- --client-key lakeshore --event-id c05872d8-0465-4bc8-8eeb-ff3d42ac6761` executed on revision `ca-abarva-web-lab-eastus--m45aee006` with no `server-only` error and no `--apply` mutation, but returned `factsRead=14`, `eligible=0`, `skipped=14`.
- FAIL — Follow-up investigation found the 14 facts were valid cited numeric facts; Azure/Postgres returned `value_numeric` as strings (for example `"8400000"`), while the planner only accepted JavaScript numbers.
- PASS — Numeric coercion fix validation: `npx jest src/lib/source/context-writeback/__tests__/source-context-writeback.test.ts --runInBand` passed, 8/8 tests. Jest also emitted existing duplicate-manual-mock warnings unrelated to this release.
- PASS — Numeric coercion fix validation: `npx eslint src/lib/source/context-writeback` passed.
- PASS — Numeric coercion fix validation: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` passed.
- PASS — Numeric coercion fix validation: `npm run release:check` passed.
- PASS — Runtime dry-run after numeric coercion deploy: `az containerapp exec ... npm run source:enterprise-context:writeback -- --client-key lakeshore --event-id c05872d8-0465-4bc8-8eeb-ff3d42ac6761` executed on revision `ca-abarva-web-lab-eastus--mcaf85929` with `factsRead=14`, `eligible=14`, `skipped=0`, and `writeStatus=not_applied`.
- PASS — Operator-job env support validation: `SOURCE_WRITEBACK_CLIENT_KEY=lakeshore SOURCE_WRITEBACK_EVENT_ID=c05872d8-0465-4bc8-8eeb-ff3d42ac6761 npm run source:enterprise-context:writeback -- --help` showed env-driven usage.
- PASS — Operator-job env support validation: `npx eslint src/scripts/source/writeback-source-facts-to-enterprise-context.ts` passed.
- PASS — Operator-job env support validation: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` passed.
- PASS — Operator-job env support validation: `npm run release:check` passed.
- NOT RUN — Operator-job apply after env support: pending merge/deploy of the env-driven script. Apply must run through the approved ACA operator-job lane, not web-container exec.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merged commit, then verify the ACA runtime invariant. The writeback itself remains inactive until an operator runs the command in dry-run or `--apply` mode. Applying writeback for client data should run through the approved ACA operator-job lane, not a production web request.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge to `main`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: No user-facing UI changes. Runtime proof should verify the deployed image contains the command; data write proof requires a governed operator job.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. If an operator has already applied writeback rows, rollback must be handled as a tenant-scoped data correction against `enterprise_context_records`, `enterprise_context_facts`, and `governed_object_readiness` rows whose `source_system`/provenance is `source_event_facts`.

## Audit Evidence

- PR: pending.
- CI/release check: pending.
- ACA runtime proof: pending.
- Operator dry-run/apply proof: pending.

## Known Gaps

- This does not index Source facts into Azure AI Search or mark them `agent_ready`.
- This does not wire aVa retrieval to consume the newly written enterprise context rows.
- This does not create a recurring learning loop; it provides the safe writeback primitive and operator entrypoint for the next governed job.
