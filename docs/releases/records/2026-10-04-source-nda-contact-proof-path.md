# 2026-10-04-source-nda-contact-proof-path - Operator Proof Path Alignment

## Release ID

`2026-10-04-source-nda-contact-proof-path`

## Status

`candidate`

## Plain-English Summary

The manual contact-intake workflow now validates the same mode-specific proof directory that its private operator job writes. This lets a dry run finish its quality check without changing any contact records.

## Layer Impact

- Release lane: `internal-admin` for a manual operator workflow.
- Layer 1-3: no intake data, adapter, canonical model, or tenant rows change.
- Layer 4: no product surface changes. The workflow quality check reads an existing proof artifact.

## Client Applicability

- All clients: no product or data change.
- Specific clients: none.
- Internal only: the manual synthetic contact-intake workflow.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- One shared mode-specific output directory for the operator and proof validator.
- A regression test for the dry-run and apply path contract.

## QA / Validation

- PASS: the regression test failed against the original mismatched validator path and passed after the correction.
- PASS: deliberately restoring the mismatched validator path made the test fail; restoring the fix returned it to green.
- PASS: three workflow/proof tests and seven contact-intake tests.
- PASS: local `npm run typecheck`, scoped ESLint, and all 11 `npm run release:check` gates.
- PENDING: hosted checks and a fresh operator dry run.
- NOT RUN: contact data apply or signed-in NDA coverage.

## Rollout Plan

Squash merge through a PR after checks and review. This workflow is manual-only; no run is triggered by merge. Rerun `dry_run` with the same hash-pinned synthetic input and inspect the proof before considering a separately authorized apply. The normal repo-owned main workflow governs any shared runtime deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this release.
- Approved image digest: verify separately if a main deploy occurs.
- ACA runtime invariant: verify the web template, sole 100%-traffic revision, and required workers before runtime claims.
- Worker image invariant: verify separately; no worker code changes here.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this operator-path fix; the NDA phase still needs its own Stage 05 readback.

## Rollback Plan

Revert the workflow and test through a PR. Do not run apply as a rollback mechanism. This release makes no data changes.

## Audit Evidence

- PR, hosted CI, and operator rerun: to be recorded after execution.
- Prior dry run wrote `live-dry-run/summary.json`; the validator previously read `live-dry_run/summary.json`.

## Known Gaps

- Contact apply remains separately authorization-gated. A successful dry run is not canonical contact readback, provider delivery, or NDA coverage.
