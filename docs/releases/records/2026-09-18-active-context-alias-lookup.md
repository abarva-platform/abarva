# Active context alias lookup

## Release ID

`2026-09-18-active-context-alias-lookup`

## Status

`candidate`

## Plain-English Summary

The active module-context reader now resolves supported request aliases to the tenant keys used by active-access records. It no longer reports an available record as missing because an alias points to a different canonical representation.

## Release Lane

`global-control-lane`.

## Layer Impact

The global-control lane changes a Layer 4 Home/context read path only. It does not change intake files, canonical records, authorization, or tenant data.

## Client Applicability

All clients using the affected request aliases. No client-specific data is changed. No feature flag.

## Changes Included

Correct the active-access lookup map for the affected aliases and cover those mappings with a behavioral read test.

## QA / Validation

The three new active-record lookup cases failed before the fix and passed afterward. Reverting one alias in a mutation check made its case fail. The broader legacy suite has pre-existing fixture/read-model failures; this release does not claim that whole suite passes. TypeScript, scoped lint, and release gate are required before PR. Signed-in Home read remains pending.

## Rollout Plan

After PR and CI approval, use only the repository-owned ACA main deploy workflow. Read back the approved digest, then verify an affected active context on the deployed product.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest and ACA runtime invariant: pending deploy readback.
- Worker image invariant: pending deploy readback.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the affected active-context read.

## Rollback Plan

Revert through a new PR and the repository-owned deploy workflow if active lookup regresses. No persisted records need rollback.

## Audit Evidence

Focused baseline, passing test, and mutation results locally; PR, CI, digest invariant, and signed-in readback at later gates.

## Known Gaps

Active-access resolution does not itself prove that downstream canonical context slices contain records. Existing suite fixture failures remain separate.
