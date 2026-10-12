# 2026-10-12-tower-registered-source-fields — Preserve declared source fields

## Release ID

`2026-10-12-tower-registered-source-fields`

## Status

`candidate`

## Plain-English Summary

This inactive Tower candidate keeps the owner, status, phase, business area, and value-category words already present in registered intake. It also carries a program's explicitly linked affected function, labeled as an affected function rather than a funding domain. The current approved assessment is unchanged. No new funding, Finance result, tool rollout, or dollar benefit is claimed.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1: no files or source-set membership change.
- Layer 2: the candidate adapter retains selected fields from the program and AI use-case tabs. It joins program-to-function relationships only by declared program ID and relationship type.
- Layer 3: typed program and AI use-case objects retain these source fields. Program metadata holds source-linked affected-function information; this candidate does not materialize canonical function objects or relationship edges. Primary funding domain and unsupported money remain unknown.
- Layer 4: an inactive version 5 Tower projection carries the same fields and source-linked affected-function information in program and AI-case rows. The existing active projection remains selected.

## Client Applicability

- All clients: no automatic data change.
- Specific clients: dry-run only for one registry-selected synthetic tenant; no private data-plane write.
- Internal only: candidate generation, validation, and release review.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds an explicit `source-fields-v1` candidate variant. The prior default candidate remains byte-for-byte identical.
- Uses a new assessment ID derived from the unchanged source hash and the new rule version, so prior load and serving approvals cannot select the changed projection.
- Preserves program sponsor, technology owner, source status, source phase, and declared affected-function relationships. An affected function does not become a primary funding domain.
- Preserves AI-case business function, business segment key, source status, sponsor role, operational owner role, and expected value archetype. A case without a declared tool has no tool identity in the new projection.
- Requires a new dataset manifest with named declaration review and a separate exact load approval before any physical write. No such approval is recorded in this release.

## QA / Validation

- Focused candidate and physical-stage tests: 16 passed, including source-row parity, altered relationship refusal, invented tool refusal, and refusal to reuse the prior approval.
- Tower serving-reader tests: 23 passed, including the separation of affected function from funding domain and preservation of source roles. Focused ESLint, TypeScript typecheck, `git diff --check`, and all 11 release gates passed.
- Dry stage: physical quality gate passed; `materialized: false`; approval status `missing_or_mismatched`.
- New assessment `tower-registry-candidate-a70df3b56bffc9be`, source-set hash `11d0f3f92b0c1da9cd4ca2bf369d0a90587b2deac15f4108262b1d154f829c40`, candidate SHA-256 `bc04b5bbd56115272c41973bafea26bf5e76834467f76f934fc48272d9889c14`.
- Dry stage produced 17 source-file metadata rows, 327 selected source records, 237 canonical objects, 308 measures, and 352 rows across nine Tower views. The added 28 source records are program-to-function relationships already in the approved source-file set.
- Prior default candidate SHA-256 remains `0428caec53f4a3a2366acf117ba42ec9a82e0cac94ab917fb6ce87a027e9821c`.

## Rollout Plan

Keep this variant inactive. After source owners review its field meaning, declare and approve a new dataset manifest, obtain an exact load approval for the new assessment, and run the governed private stage job. A separate serving approval and signed-in product proof are required before selecting it for Tower.

## Deployment Authority

- Repo-owned deploy workflow: only `.github/workflows/aca-main-deploy.yml` may shift shared web traffic.
- Shared runtime mutators: none in this release.
- Approved image digest: required for any later private operator job.
- ACA runtime invariant: required after a future deployment.
- Worker image invariant: required for a future private stage job.
- Feature/env flag update path: none.
- Live signed-in proof required: after a separately approved serving promotion.

## Rollback Plan

Discard or revert the inactive variant. The previously approved candidate bytes and active assessment remain unchanged. No data-plane rollback is needed for this dry-run release.

## Audit Evidence

The PR diff, focused test output, dry-stage `candidate.json`, `stage-preflight.json`, `stage-validation.json`, and `stage-quality-gate.json` support this release. No private write or serving proof is claimed.

## Known Gaps

Ten programs have no declared affected-function relationship; no program has an explicit primary funding domain or approved fiscal-year funding in this source set. The 28 declared relationships remain informational until canonical function objects and governed relationship edges are materialized and read back. The AI intake has no declared crosswalk to the separate benefit and usage feeds, so Finance status, funded amount, and vendor cannot be attached to those AI cases. A tool rollout registry, reconciled Finance values, approved evidence, and normalized quarterly results remain separate source and governance work. The new field projection is not loaded or visible in the product.
