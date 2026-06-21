# 2026-06-21-scb-truth-gates — Shared Context Brain Truth Gates

## Release ID

`2026-06-21-scb-truth-gates`

## Status

`candidate`

## Plain-English Summary

Adds deterministic release gates for the Shared Context Brain so authored data, embeddings, patterns, and expert packs cannot silently drift away from the retrievable substrate.

Follow-up compatibility patch: removes the live container's `tsx` dependency on the `@/data/...` alias for the Apex CDP seed shim. The deployed truth-gate runner imports source files directly, so this shim must be resolvable without assuming the Next/Turbopack alias layer.

Second live-proof patch: the deployed runtime image copied `src/lib` and `src/scripts` for ACA jobs, but not `src/data`, so the private VNet truth-gate still could not load the Apex CDP seed after the import was made relative. The Docker runtime layer now includes `src/data` for operational scripts that intentionally execute from source inside ACA jobs.

Third live-proof patch: after `src/data` was packaged, the deployed proof progressed to the next source-executed dependency and failed on `intelligence/seeds/archetype-phase-deliverable-matrix.json`. The Docker runtime layer now also includes the top-level `intelligence` seed assets required by `src/lib/programs/enhancement-spec.ts` and `pattern-manifest.ts`.

## Layer Impact

- `global-control-lane`: Adds repo/CI validation scripts and release-check wiring. No application route behavior changes.
- `client-data-lane`: Adds validation coverage for client context record presence and embedded vector completeness, but does not mutate client data.

## Client Applicability

- All clients: Applies to all client context tenants when run with a live database or fixture snapshot.
- Specific clients: None.
- Internal only: Release/CI operators and build agents.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/scripts/intelligence/scb-truth-gates.ts`
- `src/scripts/__tests__/scb-truth-gates.test.ts`
- `src/lib/intelligence/seed-patterns-cdp.ts`
- `Dockerfile`
- `scripts/release-control/check-scb-truth-gates.mjs`
- `scripts/release-check.mjs`
- `package.json`

## QA / Validation

- PASS: `npx jest src/scripts/__tests__/scb-truth-gates.test.ts --runInBand`
- PASS: `npm run scb:truth-gates -- --static-only`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npx eslint src/scripts/intelligence/scb-truth-gates.ts src/scripts/__tests__/scb-truth-gates.test.ts`
- PASS: `npm run release:check`
- BLOCKED: Private-VNet SQL proof showed the live gate would correctly fail because `northstar-clinical` has vectorized chunks but zero `enterprise_context_records`.
- PASS: Private-VNet remediation loaded `northstar-clinical` structured records and SQL proof confirmed all dataset tenants have `enterprise_context_records` plus embedded chunks with non-null vectors.
- BLOCKED: A second private-VNet run of `npm run scb:truth-gates -- --require-live` reached the packaged gate but failed on `Cannot find module '@/data/apexretail/cdp-pattern-seed'`; this compatibility patch addresses that import path.
- BLOCKED: A third private-VNet run on deployed #3772 reached the relative import but failed on `Cannot find module '../../data/apexretail/cdp-pattern-seed'`; this confirmed the runtime image did not package `src/data`.
- BLOCKED: A fourth private-VNet run on deployed #3773 loaded `src/data` but failed on `Cannot find module '../../../intelligence/seeds/archetype-phase-deliverable-matrix.json'`; this confirmed the runtime image also needs the top-level `intelligence` seed folder.
- PASS: Deployed #3774 to ACA revision `m5a17bf76` at 100% traffic on image `sha256:2629cf2246764fbf5128dd869d465154672ae65e533fe8e895678cc46db394ef`.
- PASS: Private-VNet execution `job-abarva-private-operator-eus-5q6s1px` ran `npm run scb:truth-gates -- --require-live` and passed with `tenantKeys=6`, `authoredPatterns=3569`, and `authoredExpertPacks=54`.
- PASS: Post-deploy authenticated crawl run `27896104696` completed successfully for #3774.

## Rollout Plan

Merge to `main`. The static gate runs as part of `npm run release:check`. Live data-plane proof can be run inside the private VNet with `npm run scb:truth-gates -- --require-live`.

## Deployment Authority

- Repo-owned deploy workflow: Not changed.
- Shared runtime mutators: ACA deploy updates the runtime image after merge.
- Approved image digest: `sha256:2629cf2246764fbf5128dd869d465154672ae65e533fe8e895678cc46db394ef`.
- ACA runtime invariant: Template image and 100% traffic revision image both pointed to #3774 revision `m5a17bf76` after deploy.
- Worker image invariant: Private operator was temporarily pointed to the #3774 digest for the VNet proof, then restored to idle image `sha256:e7668ebbb670bc014893fcc3265341cc56810c98a73b104d05ef3a079c430b3c`.
- Feature/env flag update path: None.
- Live signed-in proof required: No UI change. Live VNet DB proof is required before marking W2.4 done.

## Rollback Plan

Revert the checker, release-check import, package script, tests, and this release record. No migration rollback and no data rollback are required.

## Audit Evidence

- Focused Jest output from the W2.4 branch.
- Static truth-gate output from the W2.4 branch.
- PR #3774 merged to main.
- ACA main deploy run `27895869086` completed successfully.
- Private-VNet proof execution `job-abarva-private-operator-eus-5q6s1px`.
- Post-deploy authenticated crawl run `27896104696` completed successfully.

## Known Gaps

W2.4 has no remaining known gap. W2.2 pgvector still needs its separate live extension/index/vector-retrieval proof before that tracker row can be marked done.
