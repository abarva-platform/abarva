# Tower financial unknowns

## Release ID

`2026-10-11-tower-financial-unknowns`

## Status

`candidate`

## Plain-English Summary

Tower now shows when a budget, benefit, or evidence amount cannot be verified. A project cost no longer becomes an approved annual budget merely because it is present in a reviewed project row. An empty evidence queue is explained as missing information rather than a clean bill of health.

The serving reader also accepts an explicitly approved `FY26` fiscal label, checks that claim periods are real calendar dates, and uses the recorded claim amount for each program. Missing amounts stay distinct from recorded zero. Programs and evidence tasks with no recorded investment decision appear as needing a decision.

## Layer Impact

- **Release lane: `global-control-lane`.** This is shared Tower read and presentation behavior for every client.
- **Layer 4, products:** The Tower reader requires an explicit fiscal year and approval status before presenting an approved budget. Benefit and cleared-value amounts require explicit reconciliation, approved evidence, and a reporting period. Tower tabs and the program detail drawer explain missing amounts in plain language.
- **Layers 1–3:** No source files, adapters, canonical records, or stored data are changed.

## Client Applicability

- All clients: Applies to the shared Tower view when its serving rows are read.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tower serving reader, view model, executive tabs, program drawer, and focused tests.
- No data load, migration, or runtime configuration change.

## QA / Validation

- Focused Tower reader, view, and drill-down tests passed (181 tests for the original candidate; 135 focused tests after the follow-up gates).
- TypeScript type check passed.
- Focused ESLint passed.
- Release policy check passed.

## Rollout Plan

Merge this PR through the protected branch. The repository-owned ACA main deploy workflow builds and releases the resulting image. Verify the approved image digest and then inspect Tower in a signed-in browser for a tenant with missing budget and evidence values.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None in this PR.
- Approved image digest: Established by the main deploy workflow after merge.
- ACA runtime invariant: Verify the template and 100% traffic revision use the approved digest.
- Worker image invariant: No worker image change in this PR.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the changed Tower tabs.

## Rollback Plan

Revert the PR and release through the repository-owned ACA main deploy workflow. No schema or data rollback is required.

## Audit Evidence

- PR diff, focused test output, release policy check, deployment run, ACA digest readback, and signed-in Tower walkthrough.

## Known Gaps

This change does not approve an intake source or reload data. Budgets and financial benefits remain unavailable when their source period, approval, reconciliation, or evidence state is absent.
