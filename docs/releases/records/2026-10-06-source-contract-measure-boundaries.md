# 2026-10-06-source-contract-measure-boundaries - Contract measure boundaries in Source answers

## Release ID

`2026-10-06-source-contract-measure-boundaries`

## Status

`candidate`

## Plain-English Summary

Source contract answers now say when support fees, consumption, invoicing, and payments are not established by the loaded contract packet. They continue to show annual value, annual commitment, full-term commitment, and actual annual spend as separate measures. Actual spend is not presented as proof that an invoice was issued or paid.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 (Products): changes Source's answer wording for a selected contract. Layers 1-3 and their canonical facts are unchanged.

## Client Applicability

- All clients: yes, when asking Source about a selected contract's financial measures.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added.

## Changes Included

- Source workspace visual answer formatting and a focused negative-measure behavior test.
- Explicit CI registration for the existing test file.
- No migration, data load, or external provider change.

## QA / Validation

- PASS: Red-first behavior test confirmed that unsupported amounts were omitted before the change.
- PASS: A mutation substituting actual spend for paid amount made the test fail.
- PASS: Source aVa unit suite (26 suites, 403 tests), TypeScript check, ESLint, focused CI pair (2 suites, 33 tests), and orphan audit.
- PASS: CI coverage census was regenerated after registering the test file.
- NOT RUN: Applicable PR CI and review, pending PR creation.
- NOT RUN: Signed-in answer replay after deployment; local tests are not live acceptance.

## Rollout Plan

Squash merge the reviewed PR after applicable checks pass. The repo-owned ACA main deploy workflow alone may update the shared runtime. No database apply or configuration change is needed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: verify from the successful main deploy run.
- ACA runtime invariant: verify the template and 100%-traffic revision use that digest.
- Worker image invariant: verify required worker images against the approved digest before claiming runtime completion.
- Feature/env flag update path: none.
- Live signed-in proof required: ask about distinct contract financial measures and verify explicit unknowns for unsupported amounts.

## Rollback Plan

Revert the PR through a new reviewed change and deploy via the repo-owned main workflow. No data rollback is required.

## Audit Evidence

PR checks, the main deploy run and digest readback, and a signed-in answer capture after deployment.

## Known Gaps

The current selected-contract answer packet does not contain governed support-fee, consumption, invoice, or payment amounts. This change refuses to infer those amounts; it does not add them.
