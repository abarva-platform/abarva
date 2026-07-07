# 2026-07-02-source-contract-optimization-operational-pressure-polish — Source Operational Pressure Formatting

## Release ID

`2026-07-02-source-contract-optimization-operational-pressure-polish`

## Status

`candidate`

## Plain-English Summary

This release fixes issues found during the live Source contract optimization proof. aVa now renders the operational-pressure finding as its own bullet under a heading instead of producing the awkward `Operational pressure: - ...` text. The Source ask route also pins event lookup to the already-resolved active client so a signed-in Source session does not intermittently fall into a false "event not found" path, and Source briefing notes use the live tenant label instead of stale Apex wording.

## Layer Impact

- `global-control-lane`: adjusts Source contract optimization answer text formatting, Source event lookup pinning, and Source briefing tenant-label hygiene.
- `public-demo`: improves the SkyHarbor signed-in contract optimization proof path.

## Client Applicability

- All clients: applies to Source ask event lookup and briefing tenant-label hygiene; answer formatting applies when Source contract optimization answers include an operational-pressure finding.
- Specific clients: SkyHarbor demo proof path.
- Internal only: no.
- Public/demo only: yes for the current proof scenario.
- Feature flag: none.

## Changes Included

- `src/lib/source/source-answer-engine.ts`: splits the operational-pressure bullet onto a new line.
- `src/lib/source/__tests__/source-answer-engine.test.ts`: adds a regression assertion that `Operational pressure: -` cannot reappear.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`: pins fallback Source event lookup to the active client key already resolved for the request.
- `src/__tests__/integration/source/source-nexus-route-tenant-scope.test.ts`: asserts the Source ask route keeps event lookup pinned to the resolved client boundary.
- `src/lib/source/multi-agent-briefing.ts`: replaces stale hardcoded Apex live-context labels with the live tenant label.
- `src/lib/source/__tests__/nexus-api-live-context.test.ts`: adds a SkyHarbor regression so non-Apex Source briefing evidence notes do not say `Live Apex context`.

## QA / Validation

- Passed: Focused Source answer-engine, Source Nexus route, and live-context Jest (`53` tests).
- Passed: Scoped ESLint for touched files.
- Passed: Full TypeScript check (`npx tsc --noEmit`).
- Passed: `npm run release:check`.
- Not run yet: Post-deploy signed-in Source browser/API proof.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, confirm 100% traffic on the merged SHA, then rerun the signed-in Source proof on `https://app.abarva.ai/source/events/SKYH-AMS-CONTRACT-OPT-2026?stage=responses`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the approved ACA deploy workflow.
- Approved image digest: assigned by the ACA deploy workflow after merge.
- ACA runtime invariant: verify active revision, 100% traffic, image digest, and `/api/health`.
- Worker image invariant: handled by the ACA deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the same ACA main workflow. No schema or data-plane migration is included.

## Audit Evidence

To be added after merge/deploy: PR URL, CI run, ACA deploy run, active revision/digest, and signed-in proof folder.

## Known Gaps

This is a narrow text-formatting polish. It does not change Source scoring, extraction, exports, or sourcing decision logic.
