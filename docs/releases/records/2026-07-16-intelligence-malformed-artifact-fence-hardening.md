# 2026-07-16-intelligence-malformed-artifact-fence-hardening — Intelligence Malformed Artifact Fence Hardening

## Release ID

`2026-07-16-intelligence-malformed-artifact-fence-hardening`

## Status

`candidate`

## Plain-English Summary

This release hardens Intelligence answer rendering against malformed governed artifact fences. It preserves the existing `decision-table`, `chart`, and `followups` artifact contract, but prevents near-fence JSON fragments from appearing in the visible aVa answer when Claude emits two backticks, a missing closing fence, or `records` instead of `rows`.

## Layer Impact

- `global-control-lane`: Intelligence answer packets now scrub governed artifact payload fragments from streamed text, packet prose, and the client packet-body fail-safe for all tenants.
- `global-control-lane`: The existing AI answer artifact contract is preserved; no new visual schema is introduced.
- `global-control-lane`: The rendered answer body should show executive prose plus typed tables/charts, not raw JSON or fence syntax.

## Client Applicability

- All clients: Yes, for Intelligence aVa answers.
- Specific clients: Meridian proof question is the regression target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Hardens `src/lib/intelligence/answer/structured-fence-stream-filter.ts` to strip valid and malformed governed artifact payloads during streaming.
- Extends `src/lib/intelligence/answer/structured-exhibits.ts` to accept `records` as a decision-table row alias and recover valid malformed near-fence decision tables.
- Applies the same governed-artifact cleanup in `src/lib/intelligence/answer/answer-safety.ts`.
- Adds a client-side packet body fail-safe in `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`.
- Adds focused regression tests for malformed `decision-table`, `chart`, and `followups` payload leakage.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts src/lib/intelligence/ask/__tests__/decision-table-gate.test.ts --runInBand`
- Pending: release checks, TypeScript validation, PR CI, ACA deploy, and signed-in Meridian browser proof after merge.

## Rollout Plan

Open a PR from the follow-up branch, merge through the approved PR lane, allow the repo-owned ACA main deploy workflow to build and deploy the digest-pinned image, then rerun the exact signed-in Meridian Intelligence proof question.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending ACA main deploy after merge.
- ACA runtime invariant: Pending ACA main deploy after merge.
- Worker image invariant: Pending ACA main deploy after merge.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and allow the ACA main deploy workflow to publish the previous behavior. No database migrations, production writes, or feature flags are introduced.

## Audit Evidence

- PR URL: Pending.
- Local proof: focused Jest tests listed above.
- Production regression proof before this fix: `/Users/anand/Projects/nexus/proof/intelligence-universal-answer-contract-20260716/`
- Post-deploy signed-in browser proof: Pending.

## Known Gaps

ACA deploy and live signed-in proof are pending until this candidate is merged.
