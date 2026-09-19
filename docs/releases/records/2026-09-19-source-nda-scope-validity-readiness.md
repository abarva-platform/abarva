# 2026-09-19-source-nda-scope-validity-readiness — Source NDA Readiness Scope And Validity Gate

## Release ID

`2026-09-19-source-nda-scope-validity-readiness`

## Status

`candidate`

## Plain-English Summary

Source Stage 05 NDA readiness now stays blocked unless the current NDA artifact carries the supplier legal entity, the governed scope it covers, an effective validity window on the event's persisted readiness date, a review or approval state, and an artifact hash. The workspace card exposes the scope, validity evidence, and deterministic as-of date instead of treating a current approved file as sufficient by itself.

## Layer Impact

Release lane: `global-control-lane`.

Products: updates the Source projection UI and readiness helper for the new workspace lifecycle card. It changes only the readiness interpretation and display of already-provided artifact metadata.

Canonical model: no schema, migration, tenant data write, supplier communication, or legal approval workflow is introduced.

## Client Applicability

- All clients: applies wherever the Source new-workspace NDA readiness card is rendered after deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/new-workspace/nda-readiness.ts`
- `src/components/source/new-workspace/SourceNewFiles.tsx`
- `src/components/source/new-workspace/SourceNewWorkspace.tsx`
- `src/components/source/new-workspace/SourceNewWorkspace.test.tsx`
- `src/app/(maestro)/source/new/[eventId]/page.tsx`

## QA / Validation

- Failing-first focused Jest run: the added Stage 05 case failed because an NDA artifact with legal entity, approval, and hash but no scope or validity dates was incorrectly marked ready.
- Final focused Jest run: `npx jest --runTestsByPath src/components/source/new-workspace/SourceNewWorkspace.test.tsx --runInBand` passed 34 tests.
- Mutation check: removing the new scope and validity blockers made the focused suite fail on the added case; the blockers were restored and the focused suite passed again.
- Validity mutation check: allowing an expired or not-yet-effective window on the persisted event as-of date fails the focused rendered workspace cases.
- Signed-in acceptance was not performed and is still owed after deployment for product-visible proof.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps deploy workflow is the only approved path for shared Product/Lab web traffic. No migration or data-plane job is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime rollout.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: must be proven before claiming deployed/live.
- Worker image invariant: must match the approved digest if the deploy workflow updates shared runtime state.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before calling this product behavior `live-proven`.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow. Because no schema or data-plane mutation is included, rollback is limited to returning the readiness helper and card display to the previous interpretation.

## Audit Evidence

- Local focused Jest output for the failing-first, final, and mutation-restoration runs.
- PR URL and CI run after the branch is opened.
- ACA runtime invariant and signed-in browser evidence after merge/deploy, if this release proceeds to live proof.

## Known Gaps

This does not add a supplier registry, NDA template authority, waiver workflow, DocuSign provider, executed certificate storage, private evidence storage, or a schema/provider source for scope and validity fields. Rows that do not provide those fields remain blocked rather than inferred ready.
