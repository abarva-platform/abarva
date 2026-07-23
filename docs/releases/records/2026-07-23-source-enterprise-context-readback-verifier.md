# 2026-07-23-source-enterprise-context-readback-verifier — Source Enterprise Context Readback Verifier

## Release ID

`2026-07-23-source-enterprise-context-readback-verifier`

## Status

`deployed-runtime-proven`

## Plain-English Summary

Adds a read-only Source enterprise-context verifier. After a governed Source writeback has run, operators can prove that Azure/Postgres contains the expected enterprise-context records, facts, and governed readiness rows for one Source event, and that those rows remain intentionally conservative: `not_reviewed`, `committed_not_indexed`, and `pending` until a separate indexing and citation-proof promotion earns `agent_ready`.

## Layer Impact

- `client-data-lane`: Adds read-only verification over existing `enterprise_context_records`, `enterprise_context_facts`, and `governed_object_readiness` rows. No schema, data mutation, indexing, or promotion is included.
- `internal-admin`: Adds an operator-facing CLI command for VNet/ACA proof bundles.

## Client Applicability

- All clients: Generic for any tenant Source event whose facts have been written back.
- Specific clients: None hard-coded.
- Internal only: Operator command only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/context-writeback/readback.ts`: Summarizes Source writeback readback rows, checks records/facts/readiness alignment, and fails if rows are missing or prematurely promoted.
- `src/scripts/source/verify-source-enterprise-context-readback.ts`: Read-only CLI verifier that resolves a tenant-scoped Source event, reads persisted Azure/Postgres enterprise-context rows, writes `readback.json`, and optionally emits a base64 proof bundle for ACA operator logs.
- `package.json`: Adds `source:enterprise-context:verify-writeback`.
- `src/lib/source/context-writeback/__tests__/source-context-writeback.test.ts`: Adds regression coverage for passing readback and failure on missing facts or premature `agent_ready` promotion.
- `docs/backlog/source-product-backlog.md`: Records `SOURCE-INGEST-001d` as the readback-proof slice.

## QA / Validation

- PASS — `npx jest src/lib/source/context-writeback/__tests__/source-context-writeback.test.ts --runInBand` passed, 10/10 tests. Jest emitted existing duplicate-manual-mock warnings unrelated to this release.
- PASS — `npx eslint src/lib/source/context-writeback src/scripts/source/verify-source-enterprise-context-readback.ts` passed.
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` passed.
- PASS — `npm run source:enterprise-context:verify-writeback -- --help` printed read-only verifier usage and exited 0.
- PASS — `npm run release:check` passed.
- PASS — PR #5465 merged as `68b1570ebf4e7707346c8a68b1bf3e16193c2b79` after all GitHub checks passed.
- PASS — Repo-owned ACA main deploy run `30009823928` completed successfully for merge SHA `68b1570ebf4e7707346c8a68b1bf3e16193c2b79`.
- PASS — Independent ACA runtime invariant passed at `2026-07-23T13:15:47.752Z`: active revision `ca-abarva-web-lab-eastus--m68b1570e`, 100% traffic, digest `sha256:aa03c1ccd1f7f6704aff762b98706bb80b96188373e425d9d3e649493ef37ed3`, health OK, and both worker jobs on the same digest.
- PASS — Runtime read-only verifier proof from ACA/VNet passed on revision `ca-abarva-web-lab-eastus--m68b1570e` for Lakeshore event `LAKE-AMS-2026-C1402EFD` (`c05872d8-0465-4bc8-8eeb-ff3d42ac6761`): `records=14`, `facts=14`, `readinessRows=14`, `activePromotionViolations=0`, report path `/tmp/source-enterprise-context-readback-proof/readback.json`. The command did not use `--apply`.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merged commit, then verify the ACA runtime invariant. The verifier is inactive until an operator runs the read-only command. It is safe to run locally for dry readback or through an ACA operator job for VNet proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge to `main`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: No user-facing UI changes. Runtime proof should verify the command exists and, where data is available, read-only readback succeeds.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because this release is read-only.

## Audit Evidence

- PR: #5465.
- CI/release check: local `npm run release:check` passed; all GitHub PR checks passed before merge.
- ACA runtime proof: repo-owned ACA main deploy run `30009823928`; independent invariant active revision `ca-abarva-web-lab-eastus--m68b1570e`, digest `sha256:aa03c1ccd1f7f6704aff762b98706bb80b96188373e425d9d3e649493ef37ed3`.
- Operator readback proof: read-only ACA exec on revision `ca-abarva-web-lab-eastus--m68b1570e` returned pass with 14 records, 14 facts, 14 readiness rows, and 0 active-promotion violations for Lakeshore event `c05872d8-0465-4bc8-8eeb-ff3d42ac6761`.

## Known Gaps

- This does not run Source writeback apply.
- This does not index Source facts into Azure AI Search.
- This does not promote Source rows to `agent_ready`.
- This does not wire aVa retrieval to consume the newly written enterprise context rows.
