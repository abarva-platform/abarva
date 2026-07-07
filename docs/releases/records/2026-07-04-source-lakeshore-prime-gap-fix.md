# 2026-07-04-source-lakeshore-prime-gap-fix — Source Lakeshore Prime Gap Fix

## Release ID

`2026-07-04-source-lakeshore-prime-gap-fix`

## Status

`candidate`

## Plain-English Summary

This release tightens the Source Lakeshore demo path by fixing two prime-time gaps: Source artifact exports now tolerate common artifact-code aliases before dispatch, and D24 decision brief exports use the active client/event identity instead of a SkyHarbor-shaped default. It also improves Source aVa answer wording so broad answers lead with executive sourcing synthesis rather than mechanical evidence wording.

## Layer Impact

- `global-control-lane`: Updates shared Source export routing and Source aVa answer shaping used by Source events across clients.
- `public-demo`: Improves the Lakeshore and SkyHarbor demo experience by making key evaluation/BAFO/decision artifacts easier to export and by reducing client-facing answer mechanics.

## Client Applicability

- All clients: Source export alias normalization and aVa wording apply to shared Source runtime.
- Specific clients: Lakeshore benefits directly from client/event-specific D24 naming.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Source unified artifact render route normalizes artifact aliases such as `d16`, `d22`, `d24`, `evaluation-scorecard`, and `decision-brief` after tenant/event resolution.
- D24 decision brief payload builder preserves non-SkyHarbor tenant and event identity.
- Source aVa generic answer path replaces "is cited evidence for this sourcing read" wording with business-facing supporting detail and an executive lead sentence.
- Focused regression tests added/updated for D24 identity, artifact alias dispatch, and Source aVa visible wording.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/source/exports/__tests__/decision-brief-payload.test.ts src/lib/source/exports/__tests__/format-router.test.ts src/lib/source/__tests__/source-answer-engine.test.ts --runInBand` (`3` suites / `70` tests).
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit`.
- Pass: `npx eslint src/lib/source/exports/payloads/decision-brief-payload.ts src/lib/source/exports/spec-builder.ts src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render/route.ts src/lib/source/source-answer-engine.ts src/lib/source/exports/__tests__/decision-brief-payload.test.ts src/lib/source/exports/__tests__/format-router.test.ts src/lib/source/__tests__/source-answer-engine.test.ts`.
- Pass: `npm run release:check`.
- Pending: Live signed-in Source browser/API proof after deploy.

## Rollout Plan

Merge to `main`, build and deploy through the approved Azure Container Apps main deploy lane, then run signed-in Lakeshore Source export and aVa smoke checks against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`.
- Shared runtime mutators: Azure Container Apps image update for `ca-abarva-web-lab-eastus`.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Verify active revision receives 100% ingress traffic.
- Worker image invariant: Not applicable; no worker/job image change.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the Source export routing, D24 payload, and Source answer-engine changes and redeploy the previous healthy ACA revision through the approved lane. No schema or data migration is included.

## Audit Evidence

- PR URL: To be created.
- CI run: To be recorded.
- Deployment URL: `https://app.abarva.ai` after ACA rollout.
- Smoke output: To be placed in Downloads after signed-in verification.

## Known Gaps

Live deploy and signed-in browser proof are pending for this candidate.
