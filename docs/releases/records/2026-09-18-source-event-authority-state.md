# 2026-09-18 Source Event Authority State

## Release ID

`2026-09-18-source-event-authority-state`

## Status

`candidate`

## Plain-English Summary

Adds a separately recorded request activation state and accepted RFI/RFP motion for sourcing events. The existing sourcing-motion field describes a different decision and is unchanged. Legacy events remain active and have no assumed RFI/RFP motion.

## Layer Impact

Release lane: `client-data-lane`. Layer 3 workflow authority: additive event columns and acceptance constraints. Layer 4 Source: a tenant-scoped reader exposes recorded authority after schema apply and fails closed before it. No current product page changes its behavior in this release.

## Client Applicability

- All clients: additive schema after separate migration approval and apply.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Additive `source_events` migration, not applied by this change.
- Tenant-scoped authority read helper and behavioral tests.

## QA / Validation

- Focused reader tests: five pass. The tests prove that stage text cannot stand in for an accepted solicitation motion, that incomplete acceptance fails closed, that tenant mismatches are not returned, and that a missing row differs from an unavailable schema. A deliberate motion-inference mutation failed the test and was restored.
- TypeScript, scoped ESLint and `node scripts/release-check.mjs --base origin/main --head HEAD` pass. CI is pending.

## Rollout Plan

Merge through a PR after checks. The repository-owned ACA workflow may deploy the dormant reader. Apply the migration only through the separately approved database workflow. Do not wire a request creator or motion-specific UI until the schema has been applied and verified. Read back default and constraint behavior before opening any request activation flow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: when the reader is wired into an event page, after migration approval and apply.

## Rollback Plan

Revert the dormant reader through a PR. Do not drop populated columns as a routine rollback; a later migration must first inspect whether accepted motions or requests exist.

## Audit Evidence

Focused test output, PR checks, separately authorized migration status/readback and later signed-in event proof.

## Known Gaps

The migration is not applied. Request creation, activation transitions, active-list exclusion, and UI wiring are separate guarded work. No event gains an RFI/RFP label merely because its legacy stage key is `rfp`.
