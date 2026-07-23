# 2026-07-23-source-artifact-quality-chat-event-id-fix — Source artifact-quality chat row-id hotfix

## Release ID

`2026-07-23-source-artifact-quality-chat-event-id-fix`

## Status

`candidate` — hotfix after live proof found the first artifact-quality packet branch falling
back to prose.

## Plain-English Summary

The first signed-in production probe after `SOURCE-ANALYTICS-CHAT-002` deployed showed the
Source event page and NDJSON route were live, but the new artifact-quality `agent-answer` line
did not appear. ACA logs showed the branch hit its safe catch. The cause: the route passed the
URL event slug into the artifact registry reader, while the registry is keyed by the resolved
Source event row id. The existing prose/context path already had that resolved event detail.

This hotfix passes `liveEventDetail.id` to the artifact-quality builder when available and
keeps the slug fallback for defensive compatibility.

## Layer Impact

- `global-control-lane`: one Source event-chat route fix, inside the already opt-in NDJSON
  branch.
- `source-read-model`: no schema or data change; reads the same artifact registry with the
  correct event identifier.

## Client Applicability

- All clients: yes, for Source event-chat artifact-quality questions.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
  - Passes `eventId: liveEventDetail?.id ?? eventId` to
    `buildArtifactQualityGovernedAnswer()`.
  - Adds `resolvedEventId` and safer non-`Error` message serialization to the branch fallback
    log.
- `src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts`
  - Guards that the route source keeps the resolved-row-id handoff.

## QA / Validation

- `pass` — `npm test -- --runTestsByPath 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts' src/lib/source/ava/__tests__/artifact-quality-governed-answer.test.ts --runInBand`
  - 2 suites, 10 tests passed.
  - Jest printed pre-existing duplicate manual mock warnings for mdast/micromark mocks.
- `pass` — `npx eslint 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts' 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts'`
- `pass` — `npm run release:check -- --base origin/main --head HEAD` after this QA section
  was updated.

## Rollout Plan

Open a PR, merge after checks pass, deploy through the repo-owned ACA main workflow, rerun the
independent ACA runtime invariant, and rerun the signed-in production NDJSON proof that failed
before this fix.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none from this PR.
- Approved image digest: to be recorded after merge/deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the hotfix merge. That restores the slug handoff and therefore the artifact-quality
branch may safely fall back to prose again rather than returning a structured packet.

## Audit Evidence

- Failing live proof before fix:
  `/private/tmp/source-analytics-chat-002-live-proof-202607230644/result.json`.
- ACA log marker before fix:
  `[source.nexus-ask.artifact-quality-governed-answer.failed]`.
- PR/deploy/proof: pending.

## Known Gaps

- This does not change any ingest, OCR, transcription, indexing, or enterprise-context
  promotion behavior.
