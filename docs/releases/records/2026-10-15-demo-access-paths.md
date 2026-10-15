# Balanced private-demo access paths

## Release ID

`2026-10-15-demo-access-paths`

## Status

`candidate`

## Plain-English Summary

The private demo entry separates existing approved viewers from visitors who need approval. Both paths have equal visual weight on desktop and stack on phones. Existing email-code and access-request behavior is reused unchanged.

## Release Lane

`public-demo`

## Layer Impact

The `public-demo` lane changes Layer 4 layout and explanatory copy only. No intake, adapter, canonical record, authentication policy, provider setting or workspace entitlement changes.

## Client Applicability

- All clients: no authenticated workspace change.
- Specific clients: none.
- Internal only: none.
- Public/demo only: anonymous visitors to `/demo`.
- Feature flag: none.

## Changes Included

- Approved-viewer sign-in appears on the left; the existing access-request flow appears on the right.
- Equal-width panels use matching borders, padding, radius and height at desktop widths, stacking below 760 pixels.
- Each path explains who it serves. Authentication remains separate from viewing authorization.
- Denied and unavailable states continue to withhold sign-in and playable media.

## QA / Validation

- The new two-path render assertion fails against the old layout; changing a path's accessible name is also rejected.
- Both existing sign-in suites and demo authorization/media/fence suites pass: 79 focused tests plus 26 navigation tests. No auth component or route edits. TypeScript exits zero and focused lint has no errors.
- Desktop geometry at 1440 pixels: both panels 544 pixels wide with matching height, border, radius and 32-pixel padding. At 390 pixels, both paths stack at 358 pixels wide with no horizontal overflow.
- Browser layout proof uses the real components in a development-only fixture; the fixture is removed before commit. It is not proof of email delivery or account provisioning.
- The request button opens the existing request form without submitting a new request.
- Lint, TypeScript, navigation, behavior and release checks are recorded before merge.

## Rollout Plan

Squash merge this presentation-only PR and deploy through the repo-owned ACA main workflow. Recheck the anonymous route at desktop and phone widths, including the existing request dialog. Verify authorized media remains unchanged.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: the workflow only.
- Approved image digest: the successful main workflow output.
- ACA runtime invariant: template and healthy 100%-traffic revision use that digest.
- Worker image invariant: both required deliverable workers use that digest.
- Feature/env update path: no changes.
- Live signed-in proof required: authorized media remains accessible; anonymous media requests remain denied.

ACR remains Premium. Docker Buildx retains `cache-from: type=gha` and `cache-to: type=gha,mode=max`. No ad-hoc image build, mutable image update, traffic mutation or pruning is included.

## Rollback Plan

Revert the layout through a PR and the same main deploy workflow. No identity-provider, tenant-data, migration or private-media rollback is required.

## Audit Evidence

Private evidence ID: `2026-10-15-demo-access-paths`. Desktop/phone captures and geometry are retained privately. Recipient identities and access operations are excluded from this public record.

## Known Gaps

This layout does not provision identities, send invitations or establish mailbox/code-entry acceptance. Existing provider account requirements continue to apply.
