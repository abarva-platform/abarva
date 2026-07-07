# 2026-06-03-commercial-discount-policy — Commercial Discount Policy

## Release ID

`2026-06-03-commercial-discount-policy`

## Status

`candidate`

## Plain-English Summary

Adds explicit annual-prepay and multi-year discount rules to the internal pilot
pricing posture. The policy defines discount ceilings, the trade AbarVa must
receive for each concession, founder approval expectations, and the evidence
that must be retained before a discount is quoted or written into an SOW.

## Layer Impact

- `internal-admin`: gives founder and sales preparation workflows a controlled
  discount policy for pricing conversations, SOW drafting, and approval
  evidence.
- `public-demo`: no public route or buyer-facing page changes.

## Client Applicability

- All clients: applies as internal commercial guidance unless superseded by a
  signed SOW or founder-approved account exception.
- Specific clients: none.
- Internal only: pricing governance and deal-desk posture.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/gtm/pilot-pricing-and-packaging.md`
- This release record.

## QA / Validation

- Pass: `git diff --check`
- Pass after commit: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through the protected PR path. After merge, this becomes the current
internal discount policy for annual-prepay and multi-year pricing discussions.

## Rollback Plan

Revert the PR if founder pricing posture changes or counsel/commercial review
requires a different approval model. Signed customer paper continues to govern
over this internal guidance.

## Audit Evidence

- Backlog rows: `T061`, `T062`.
- PR URL: https://github.com/abarva-platform/abarva/pull/2984
- Local QA commands listed above.

## Known Gaps

- Founder approval of the policy is still required before marking the rows
  `Done`.
- Any client-specific discount must still be approved and retained with the
  account/SOW record.
