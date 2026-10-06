# Source Read-Model Contract Coverage Audit

## Release ID

`2026-09-26-source-k2-contract-audit`

## Status

`candidate`

## Plain-English Summary

Adds a reproducible declaration audit for the proposed Source read models. It distinguishes fields the contract can express from fields each model has actually declared, and names a missing aVa stale-answer policy field.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: read-only inspection of proposed projection contracts; no schema or data change.
- Layer 4 Source: no runtime route or product behavior change.

## Client Applicability

- All clients: the audit applies to shared Source read-model definitions.
- Specific clients: none.
- Internal only: operator audit.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/source/read-model-k2-audit.mjs` and focused tests.
- A focused test step in the existing Source integration CI workflow.
- `docs/architecture/source-k2-read-model-gap-audit.md` with the nine-property and thirteen-model matrix.
- No migration, model state change, or data build.

## QA / Validation

- Pass: red-first audit test failed before the parser was implemented; seven focused tests passed after implementation, including exact matrix agreement.
- Pass: re-spelled union/interface fields were reported unexpressible, not accepted through prose.
- Pass: deliberate re-spelling of two audit mappings failed the baseline and positive-control tests; mappings restored.
- Pass: scoped ESLint, TypeScript no-emit, `release:check`, and diff check.
- CI: pending PR creation.
- Signed-in proof: not applicable to this operator-only audit; no runtime product surface changes.

## Rollout Plan

Merge through a PR after applicable CI and review. The repo-owned ACA main workflow deploys the merge as usual, but this audit is not a web runtime feature and applies no schema or tenant data.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: verify if deployed.
- ACA runtime invariant: verify template, 100%-traffic revision and workers after deploy.
- Worker image invariant: verify both required jobs after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no for this non-runtime audit.

## Rollback Plan

Revert the audit and report through a PR. No schema or data rollback is involved.

## Audit Evidence

Focused test and mutation output, PR and CI results, and the measured matrix in the architecture report.

## Known Gaps

The aVa stale-answer permission has no contract field. All thirteen proposed models lack the eight expressible K2 declarations. Running read-model behavior and canonical data readback were not assessed.
