# Source contract package calculation state

## Release ID

`2026-10-11-source-contract-package-calculation-state`

## Status

`candidate`

## Plain-English Summary

Contract-depth imports must not turn an authored proposal amount into a completed calculation. Keep the proposal and its evidence references available, but leave canonical value unsized until an executable rule and reconciled numeric inputs are recorded.

## Layer Impact

`client-data-lane`. The Layer 3 contract-depth loader and its readback contract change. No source file, schema, product layout, approval, or stored database row changes from this code release alone.

## Client Applicability

- All clients using the contract-depth package loader on a future governed run.
- Existing database records remain unchanged until a separately authorized repair.
- No feature flag is added.

## Changes Included

- Store a signal with null amount, `not_sized`, and `requires_sizing`; retain authored fields in payload with explicit source-stage and source-amount-state labels.
- Record a blocked calculation under rule version `2.0.0`, without a completion timestamp or monetary calculation output.
- Preserve cited evidence rows as pending numeric mapping rather than included formula inputs.
- Leave valuation amount and effective date unset; require sizing before finance review.
- Verify blocked calculations, unsized opportunities/valuations, unmapped inputs, and the absence of priced outputs as well as row counts.

## QA / Validation

- Four writer-level regression tests failed on the original implementation for the expected reasons.
- The existing CI-wired loader suite passes: 30 tests, including the real writer executed against a recording client without a database connection.
- Four mutations were killed: restored authored canonical amount, completed calculation, included nonnumeric input, and a fabricated valuation effective date.
- TypeScript and scoped ESLint passed; final release-check results are recorded with the PR.
- No live database repair, financial certification, or signed-in acceptance is claimed.

## Rollout Plan

Review and squash-merge the code fix first. Only the repo-owned ACA main deploy workflow may publish the shared image. This does not replay packages or repair historical rows.

Data changes are deferred until the separately approved repair window. The repair must bind exact tenant, dataset version, IDs, source hash, before-image hash, expected diff, and rollback. Full package reload is not approved by this release. Serialize any read-only inventory or future data job with the migration lane on the shared private operator job; preserve run and idle-restoration evidence.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: resolve from the successful main workflow before any operator run.
- ACA runtime invariant: digest-pinned web template and healthy 100%-traffic revision must match.
- Worker image invariant: both required workers must match the approved digest.
- Live signed-in proof: required after any later data repair, not claimed here.

## Rollback Plan

Revert the code through a reviewed PR if necessary; do not restore authored amounts as calculated values. A code revert cannot restore data. Any future repair must preserve an exact before-image and use an independently approved restoration or forward correction.

## Audit Evidence

PR diff, red-first writer assertions, mutation results, focused test/typecheck/lint/release-check output, and later private inventory/repair proof bundles. The loader suite is already included in `.github/workflows/unit-suites.yml`.

## Known Gaps

- No numeric sizing formula is added. Proposal payload amounts remain authored, not certified financial outputs.
- Historical stored amounts, performance units, baseline readiness, and cross-surface evidence counting remain separate reconciliation work.
- The shared private operator inventory depends on release of the migration lane's job reservation.
