# 2026-10-01 — Source Stage 04 classified archetype

## Release ID

`2026-10-01-source-stage04-classified-archetype`

## Status

`candidate`

## Plain-English Summary

The Source New supplier-review panel now matches a governed supplier registry against the event's classified sourcing category and its shipped archetype. A coarse legacy event type no longer masks eligible candidates. Events without a valid classified category still show a mapping blocker rather than inferred suggestions.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source product projection: changes only the read-time supplier suggestion filter. Layer 3 supplier and event facts are unchanged.

## Client Applicability

- All clients: Source New events with a valid classified category.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source New event page passes the stored coarse event type separately from the classified category.
- Stage 04 panel uses the existing governed category-to-archetype resolver and refuses unclassified fallback matching.
- Behavioral coverage proves both a positive registry match and the negative unclassified case.

## QA / Validation

- The focused Stage 04 test failed before the fix when an accepted category and coarse event type disagreed, then passed after the fix.
- A mutation that removed the classified category was caught by the same test.
- Focused tests, TypeScript, ESLint, release checks, applicable CI, and signed-in post-deploy replay are recorded in the PR and private smoke ledger as they complete.

## Rollout Plan

Squash merge after applicable CI, then use only the repo-owned ACA main deploy workflow. No schema change, migration, data build, supplier contact, or invitation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on main.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: To be recorded after the workflow succeeds.
- ACA runtime invariant: Verify web template and sole 100%-traffic revision use the approved digest.
- Worker image invariant: Verify both required worker jobs use the same approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, replay the supplier suggestions for a classified Source New event and keep candidate acceptance distinct.

## Rollback Plan

Revert the PR through main and allow the repo-owned deploy workflow to release the prior read-time matching behavior. No data rollback is needed.

## Audit Evidence

PR, CI run, official deploy run, digest/runtime readback, and private signed-in smoke ledger entry.

## Known Gaps

This does not accept a supplier, select a respondent, establish NDA coverage, or authorize any external release.
