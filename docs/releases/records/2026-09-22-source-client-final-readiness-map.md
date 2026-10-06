# 2026-09-22-source-client-final-readiness-map — Source File Readiness Projection

## Release ID

`2026-09-22-source-client-final-readiness-map`

## Status

`candidate`

## Plain-English Summary

The Source event Files readiness map now recognizes an artifact that is already recorded as a client-final, current-authoritative version when deciding whether a gate artifact is ready for workflow use. Parser, search, graph, and enterprise-context promotion states remain separate and are not inferred from client-final acceptance.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 — Products: updates the Source event read-model presentation only. It does not change canonical data, artifact registry rows, parsing, indexing, graph projection, agent context governance, or approval writes.

## Client Applicability

- All clients: Source event Files readiness projection.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts`
- `src/lib/source/__tests__/source-event-shell-v2.test.ts`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`

## QA / Validation

- Red-first proof: the new shell projection test failed before the fix because client-final/current-authoritative metadata was not carried into file readiness items.
- Red-first proof: the new rendered canvas test failed before the fix with `0/1 ready` and the stale instruction to accept an already client-final artifact.
- Focused Jest after fix: `npx jest src/lib/source/__tests__/source-event-shell-v2.test.ts --runInBand` passed, 26/26.
- Focused Jest after fix: `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand` passed, 21/21.
- Mutation proof: temporarily reverting the file-use readiness predicate to require only the append-only acceptance row made the new rendered canvas test fail with `0/1 ready`; the source was restored afterward.

## Rollout Plan

Merge to `main`; the normal repo-owned Azure Container Apps deployment workflow will publish the product code. No migration, parser job, indexing job, data-build job, feature flag, or tenant-data operation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge for live product availability.
- Shared runtime mutators: None.
- Approved image digest: Pending repo-owned deploy.
- ACA runtime invariant: Pending repo-owned deploy.
- Worker image invariant: Required after deployment even though worker code is unchanged; both
  delivery worker images must match the approved web digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for the Files readiness map if this is claimed live.

## Rollback Plan

Revert the product and test changes. Rollback affects only the readiness-map projection and restores the previous append-only-acceptance-only behavior.

## Audit Evidence

- Focused Jest outputs listed above.
- Pull request and CI evidence pending.

## Known Gaps

This does not parse pending files, index parsed files, project graph state, promote artifacts into enterprise context, or mark anything agent-ready. Registry counts for stored, parsed, search-ready, graph-projected, and agent-ready remain governed data-plane states.
