# Source contract answer calendar dates

## Release ID

`2026-09-26-source-contract-date-context`

## Status

`candidate`

## Plain-English Summary

The Source contract answer packet now preserves valid calendar dates returned as PostgreSQL DATE objects. It rejects invalid dates and continues to accept the selected contract only after tenant access and row identity checks. This aligns the contract answer's date basis with the governed Source contract record without altering that record or the Contract 360 page.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: read-only; no schema, row, or loader change.
- Layer 4 Source: normalize server-read dates before answer formatting; no model calculation or client-supplied date authority.

## Client Applicability

- All clients: yes, for selected-contract Source answers using the server-built packet.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added.

## Changes Included

- Normalize valid server-read calendar dates to date-only strings at the packet boundary.
- Keep invalid dates absent and preserve the existing tenant and contract identity checks.
- Add destination-level behavior and negative tests to the existing contract packet suite.

## QA / Validation

- Pass: red-first test showed a DATE object disappearing from the selected-contract model prompt while other authorized facts remained.
- Pass: deliberate date-loss and invalid-date-guard mutations failed the named tests; the restored suite passed.
- Pass: request-supplied date cannot replace the server-read date; a row for another tenant is refused.
- Pass: final destination suite 54/54, full TypeScript check, scoped ESLint, release check, and diff whitespace check.
- Not run: applicable CI before PR creation.
- Not run: live signed-in answer replay at candidate creation.

## Rollout Plan

Squash merge only after applicable CI and review. Only `.github/workflows/aca-main-deploy.yml` may deploy shared traffic. No migration, data build, environment change, or separate runtime mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: pending main workflow.
- ACA runtime invariant: pending independent readback.
- Worker image invariant: pending independent readback.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, ask the same selected-contract date question and compare with the refreshed Contract 360 page.

## Rollback Plan

Revert this commit through a new PR and the same main workflow. Preserve the existing tenant checks and refusal for unverifiable selected contracts.

## Audit Evidence

- Red-first destination failure and two failing mutations in the existing Source contract packet suite.
- PR, CI, immutable runtime and signed-in replay: pending at candidate creation.

## Known Gaps

- A date mismatch that persists after deployment may reflect divergent read projections or data. This change does not assert a live row type or reconcile canonical data.
