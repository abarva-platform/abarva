# Source Optimize orphan cleanup

## Release ID

`source-optimize-orphan-cleanup-2026-09-12`

## Status

candidate

## Plain-English Summary

Removes an unmounted legacy Optimize lever-table component and its standalone test. The active Optimize surface already owns the rendered negotiation-lever table, so the product now has one implementation and one source of truth for signal-stage sizing.

## Layer Impact

`global-control-lane`; presentation-only. No schema, migration, tenant data, or operator job changes.

## Client Applicability

All clients using the Source Contract 360 Optimize surface. No client data is changed.

## Changes Included

- Removed the unmounted legacy `ContractLeverTable` implementation.
- Removed its test, which exercised dead code rather than the mounted product path.
- Kept the mounted `ContractLeverTableContent` implementation as the single Optimize lever table.

## QA / Validation

- Targeted Contract 360 behavior tests pass.
- Source workspace browser contract tests pass.
- ESLint passes for changed files.
- Release check passes.
- Post-deploy signed-in proof must assert one `Negotiation levers` table, no legacy `BUYER ASK` table, and signal-stage rows rendered as `Not sized`.

## Rollout Plan

Merge through the protected PR lane, deploy through the repository-owned ACA main workflow, verify the digest-pinned runtime invariant, then run the signed-in Source Optimize proof.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` is the only shared web deployment authority.

## Rollback Plan

Revert the squash merge through a follow-up PR and redeploy through the same protected ACA workflow. No data rollback is required.

## Audit Evidence

PR and protected ACA deployment artifacts will record the merge SHA, image digest, runtime invariant, health check, and signed-in rendered-table assertions.

## Known Gaps

The portfolio register/depth identity reconciliation remains a separate data-source gap and is intentionally unchanged by this presentation cleanup.
