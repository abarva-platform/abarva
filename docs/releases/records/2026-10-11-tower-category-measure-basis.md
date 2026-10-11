# 2026-10-11-tower-category-measure-basis — Source-row spend breakdown

## Release ID

`2026-10-11-tower-category-measure-basis`

## Status

`candidate`

## Plain-English Summary

The inactive Tower build now stages each annual spend category alongside one total for the same spend. Category rows have no business IDs in the intake, so they remain source-row-backed measures under the shared canonical spend metric. The total, its categories, and contract exposures carry distinct roles and nonadditivity warnings. Outcome period labels are retained as source text. The build also records missing AI evidence links, unmatched program IDs, conflicting Finance amounts and claim statuses, and usage rates with different denominators. Approved budget, fiscal-year funding, and claimable value remain unknown.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1: no intake file changes.
- Layer 2: the registered-intake adapter preserves category labels and outcome period labels with their source-row lineage, and reports missing relationships between source feeds without inferring joins.
- Layer 3: source-row category measures sit under the existing aggregate Metric object. No category business identity is inferred. Program approval and normalized outcome periods remain unknown. Separate AI claim objects retain feed-conflict and evidence-link flags, with claimable value null.
- Layer 4: the inactive Tower cost projection stores category rows and points each row to its canonical measure. The adoption and evidence projections store validation gaps. The current Tower read model does not yet render category amounts as a user-facing breakdown.

## Client Applicability

- All clients: no automatic data rollout.
- Specific clients: only an explicitly selected active registry tenant under a separately approved operator build.
- Internal only: candidate generation, dry stage, validation, and private stage operation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- The registered-intake candidate preserves source period labels and marks category rows as source-row identities with no business ID.
- The physical stage writes category measures and projects their rows. Its gate checks each measure against the original source row and checks that the category sum equals the single aggregate. Amount-role flags tell later consumers that category rows, aggregate rows, and contract exposures are separate grains; this stage does not technically prevent every downstream consumer from summing them.
- The stage identifies this plan as build `tower-registered-intake-partial/v2` and Tower projection version `4`, and binds any future load approval to this release record. The assessment ID, source-set hash, and operator idempotency key are unchanged because no earlier candidate was physically staged.
- Candidate coverage reports unregistered claim evidence IDs, AI claim programs without PMO links, Finance-value and claim-status conflicts, different usage-rate denominators, and the inability of a separate user-detail file to validate the claim usage feed. Interview text stays outside the candidate.
- Focused tests verify category lineage, money reconciliation, retained period labels, and the missing-approval refusal.

## QA / Validation

- `node --test scripts/tower/__tests__/registered-intake-physical-stage.test.mjs scripts/tower/__tests__/registered-intake-reload-candidate.test.mjs`: eleven passed, including balanced category amount mutations, blank claim fields, blank program IDs, and structurally matching raw detail with unreconciled user counts.
- Dry stage: 17 source-file metadata rows, 299 selected source records, 237 canonical objects, 308 measures, and 352 rows across nine Tower views. Stage quality gate passed with `materialized: false`; the exact load approval remains missing.
- The source-set hash is unchanged at `11d0f3f92b0c1da9cd4ca2bf369d0a90587b2deac15f4108262b1d154f829c40`. The generated candidate SHA is now `0428caec53f4a3a2366acf117ba42ec9a82e0cac94ab917fb6ce87a027e9821c`; earlier dry candidate SHAs and the 325-row physical preview are superseded. Any later approval and private stage must bind to the new candidate bytes and 352-row plan.
- `git diff --check`, focused ESLint, Node syntax checks, manifest validation, and all 11 release gates passed locally. CI must rerun on the final PR head.

## Rollout Plan

Merge through a PR after the base physical-stage release. The repo-owned main ACA workflow deploys the code. The data candidate remains inactive until its exact generated candidate SHA, source-set hash, assessment ID, and release record receive the required human-authored manifest approval. A private ACA operator job then stages and proves the exact candidate; a separate serving approval and promotion are required before the product reads it.

## Deployment Authority

- Repo-owned deploy workflow: only `.github/workflows/aca-main-deploy.yml` may shift shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: required for any later private operator job.
- ACA runtime invariant: required after the main deploy.
- Worker image invariant: required for the private operator job.
- Feature/env flag update path: none.
- Live signed-in proof required: after a separately approved serving promotion.

## Rollback Plan

Revert the PR and rebuild the inactive candidate. No active assessment is changed by this code release. If a later stage exists, do not promote it; the exact assessment and source version remain available for private review. A serving rollback uses the existing lifecycle pointer procedure.

## Audit Evidence

The PR diff and CI, dry-stage `candidate.json`, `stage-validation.json`, `stage-quality-gate.json`, and `stage-preflight.json` provide local evidence. Any later private stage needs its own ACA job, database readback, Blob proof receipt, and lifecycle evidence.

## Known Gaps

Category business IDs, an approved fiscal-year budget, approved program funding periods, resolved source conflicts, registered and approved claim evidence, and claimable value remain absent or unverified. AI benefit programs have no declared PMO crosswalk. The separate user-detail extract cannot validate claim usage, and interview evidence is outside this candidate. Contract overlap with category spend is unknown. The current Tower read model maps these cost rows to lineage without a displayed numeric value, so this release does not prove a visible cost breakdown. This release does not reload or promote data.
