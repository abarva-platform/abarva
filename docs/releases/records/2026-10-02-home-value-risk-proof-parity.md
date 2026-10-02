# 2026-10-02-home-value-risk-proof-parity - Home Proof Parity

## Release ID

`2026-10-02-home-value-risk-proof-parity`

## Status

`candidate`

## Plain-English Summary

Home's investment amounts now use one display precision across the chapter, advisor, and walkthrough exports. A derived grouping retains the date carried by its source rows. The advisor makes a repeated register-wide risk role explicit instead of leaving an item-level ownership question unanswered. Export copy omits empty caveats and handles singular counts.

## Layer Impact

- `global-control-lane`: shared Home presentation, deterministic read-model metadata, advisor response, and export wording.
- Canonical objects, source rows, relationship edges, and tenant data are unchanged.

## Client Applicability

- All clients using the shared Home read path; the current qualifying source set remains synthetic reference material.
- No client-specific data change and no new feature flag.

## Changes Included

- Shared compact currency formatting for the investment readout on page, advisor, and export.
- Source-date propagation for programs without a declared priority when their source dates agree.
- Visible advisor ownership limit for a register with one constant role, plus clearer governed-record citation labels.
- Singular/plural and zero-count export wording corrections.

## QA / Validation

- PASS: Focused Home read-model, advisor, component, and export suites, 91 tests.
- PASS: TypeScript typecheck and targeted ESLint.
- PASS: Home ratchet, 844/872 tests with the same 12 baselined suites and no movement.
- NOT RUN: PR CI and signed-in browser/export proof; required before the release is called live-proven.

## Rollout Plan

Squash-merge after checks pass, then deploy through the repository-owned ACA main workflow. Verify the digest-pinned web and worker images, signed-in chapter and advisor output, and HTML/PDF export parity.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- No shared runtime mutator outside that workflow; no env or flag changes.
- Verify template image, 100%-traffic revision image, and required worker images match the approved digest.

## Rollback Plan

Revert through a protected-main PR and the same ACA main workflow. No data rollback is required.

## Audit Evidence

PR checks, main deploy run, independent runtime invariant, and signed-in chapter/advisor/export proof will be recorded in the release report.

## Known Gaps

- Recorded budgets and forecasts do not establish client-attested realized value.
- This release does not add dependency joins or a change-over-time series.
