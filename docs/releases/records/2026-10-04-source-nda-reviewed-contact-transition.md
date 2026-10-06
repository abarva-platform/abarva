# 2026-10-04-source-nda-reviewed-contact-transition - Reviewed supplier contact transition

## Release ID

`2026-10-04-source-nda-reviewed-contact-transition`

## Status

`candidate`

## Plain-English Summary

A supplier marked review-required may receive an event-specific named-contact approval after a human reviewer records evidence, provided the canonical contact is active and independently marked contact-allowed. Do-not-contact suppliers and contacts remain ineligible. The change creates no contact identity and sends no message.

## Layer Impact

- Release lane: `global-control-lane` with existing tenant- and event-scoped approval checks.
- Layer 3 canonical model: read-only supplier and contact policy; no canonical write.
- Layer 4 Source: one event-specific contact authority decision may be recorded by the existing authenticated approval route.

## Client Applicability

- All clients: reviewed supplier posture can be cleared only through the named approval path and an active allowed canonical contact.
- Specific clients: none.
- Internal only: authenticated Source stage approvers.
- Public/demo only: no public route or supplier-domain contact.
- Feature flag: no new flag.

## Changes Included

- Treat a declared `review_required` supplier posture as reviewable, not permanently prohibited.
- Preserve refusal for `do_not_contact`, missing policy, inactive/restricted canonical contact, missing reviewer and inadequate evidence.
- Keep event, vendor and candidate linkage in the existing transaction.

## QA / Validation

- Red-first behavior test reproduced the review-required rejection. A deliberate do-not-contact allowance mutation failed the negative test and was restored.
- Focused tests, Node 24 typecheck, scoped ESLint, release gates and applicable hosted CI/review must pass before merge.
- No contact row, approval row, provider email or NDA coverage is claimed by local QA.

## Rollout Plan

Squash-merge after applicable CI/review; only the repo-owned ACA main workflow deploys. The existing route still requires a named reviewer, evidence, current accepted candidate and active canonical contact before recording authority.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none from this PR.
- Approved image digest and runtime invariant: record after official deployment.
- Live signed-in proof required: yes; no approval should be inferred until the event contact authority is actually recorded and read back.

## Rollback Plan

Revert the conditional in a new PR and deploy through the same main workflow. Preserve any existing event approval rows for audit and review them before a policy rollback.

## Audit Evidence

PR/CI, signed-in approval and negative readback, official ACA digest and both worker images belong in the private smoke ledger.

## Known Gaps

The current synthetic event has no active canonical contact records. This code change does not populate them, does not set contact-allowed policy, and does not substitute for provider configuration, signature or executed-NDA review.
