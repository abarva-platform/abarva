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
- Layer 4: an inactive version 5 Tower projection carries the same fields and source-linked affected-function information in program and AI-case rows. The existing program and AI-case drawers can show this context in plain words after that version is separately approved to serve. The existing active projection remains selected.

## Client Applicability

- All clients: no automatic data change.
- Specific clients: one registry-selected synthetic tenant is approved for a private stage of the exact assessment; serving remains unchanged.
- Internal only: candidate generation, validation, and release review.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds an explicit `source-fields-v1` candidate variant. The prior default candidate remains byte-for-byte identical.
- Uses a new assessment ID derived from the unchanged source hash and the new rule version, so prior load and serving approvals cannot select the changed projection.
- Preserves program sponsor, technology owner, source status, source phase, and declared affected-function relationships. An affected function does not become a primary funding domain.
- Preserves AI-case business function, business segment key, source status, sponsor role, operational owner role, and expected value archetype. A case without a declared tool has no tool identity in the new projection.
- Passes these fields through the Tower read model into existing detail drawers. The program drawer labels affected functions as work areas, distinct from funding categories. The AI-case drawer labels the expected kind of benefit as an unverified plan, separate from Finance status.
- Adds a dataset manifest with a human-supplied declaration and exact load approval for this assessment and source-set hash. No serving approval is recorded.

## QA / Validation

- Focused candidate and physical-stage tests: 16 passed, including source-row parity, altered relationship refusal, invented tool refusal, and the private-job identity gate after exact approval. Before this manifest, the stage refused to reuse the prior assessment's approval.
- Tower serving-reader and detail-drawer tests: 28 passed, including the separation of affected function from funding domain, preservation of source roles through the view model, and plain-language display. Focused ESLint, TypeScript typecheck, `git diff --check`, and all 11 release gates passed.
- The initial dry stage passed before approval with `materialized: false` and approval status `missing_or_mismatched`. After the human-supplied manifest was added, a fresh dry stage again passed without writing data. Its preflight reports `load_approval_status: approved`, `physical_quality_gate_status: pass`, the exact assessment and source-set hash below, 237 objects, and the same nine view counts.
- New assessment `tower-registry-candidate-a70df3b56bffc9be`, source-set hash `11d0f3f92b0c1da9cd4ca2bf369d0a90587b2deac15f4108262b1d154f829c40`, candidate SHA-256 `bc04b5bbd56115272c41973bafea26bf5e76834467f76f934fc48272d9889c14`.
- Dry stage produced 17 source-file metadata rows, 327 selected source records, 237 canonical objects, 308 measures, and 352 rows across nine Tower views. The added 28 source records are program-to-function relationships already in the approved source-file set.
- Prior default candidate SHA-256 remains `0428caec53f4a3a2366acf117ba42ec9a82e0cac94ab917fb6ce87a027e9821c`.
- The new manifest binds the private stage to 237 expected canonical objects, the assessment and source-set hash above, and this release record. The approved post-manifest dry stage passed before any private write.
- The manifest validator passed. Existing unrelated manifest warnings remain warnings; this new manifest has no validator warning. All 11 release gates and `git diff --check` passed.

## Rollout Plan

Keep this variant inactive. Merge the exact-version manifest through a protected PR, deploy it through the repo-owned ACA workflow, then run a digest-pinned private stage job. Check the private proof bundle and independent database readback. A separate serving approval, preflight, promotion, and signed-in product proof are required before selecting it for Tower.

## Deployment Authority

- Repo-owned deploy workflow: only `.github/workflows/aca-main-deploy.yml` may shift shared web traffic.
- Shared runtime mutators: none in this release.
- Approved image digest: capture after the manifest deploy and bind it to the private operator job.
- ACA runtime invariant: verify template, healthy 100% traffic revision, and worker images on the approved digest.
- Worker image invariant: required before the private stage job.
- Feature/env flag update path: none.
- Live signed-in proof required: after a separately approved serving promotion.

## Rollback Plan

Before a private write, revert the manifest PR to withdraw the load authorization. After a private write, keep the new assessment inactive and use the guarded lifecycle controls for any later serving rollback. The previously approved candidate bytes and active assessment remain unchanged by the stage.

## Audit Evidence

The PR diff, focused test output, dry-stage `candidate.json`, `stage-preflight.json`, `stage-validation.json`, and `stage-quality-gate.json` support this release. The manifest records the exact approval; private write and serving proof must be recorded separately after execution.

## Known Gaps

Ten programs have no declared affected-function relationship; no program has an explicit primary funding domain or approved fiscal-year funding in this source set. The 28 declared relationships remain informational until canonical function objects and governed relationship edges are materialized and read back. The AI intake has no declared crosswalk to the separate benefit and usage feeds, so Finance status, funded amount, and vendor cannot be attached to those AI cases. A tool rollout registry, reconciled Finance values, approved evidence, and normalized quarterly results remain separate source and governance work. The new field projection is not loaded or visible in the product.
