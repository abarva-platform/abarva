# 2026-06-06-source-export-tenant-context-hardening — Source Export Tenant Context Hardening

## Release ID

`2026-06-06-source-export-tenant-context-hardening`

## Status

`candidate`

## Plain-English Summary

Source artifact exports now carry and honor the active client context more explicitly. This prevents a client-locked user from seeing a working Source page while a follow-on document export resolves the same event code with weaker tenant context. The agent-auth priming script also now checks that probe routes render the expected tenant name and no known foreign tenant name, instead of treating any signed-in 200 response as enough proof.

## Layer Impact

- `global-control-lane`: hardens shared Source export route behavior and shared agent-auth QA tooling.
- `client-data-lane`: improves tenant-scoped event-code to UUID resolution before reading Source substrate artifacts.
- `public-demo`: strengthens Lakeshore production demo proof for Kyriba Source/Moves artifact walkthroughs.

## Client Applicability

- All clients: Source export context hardening and auth proof script checks apply globally.
- Specific clients: Lakeshore is the immediate validated tenant for the Kyriba demo artifact proof.
- Internal only: Agent storage-state generation remains local-only under `.auth/`.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/source/queries.ts`: `getSourcingEvent` accepts an explicit requested client id.
- `src/lib/source/agent-generation/context-binder.ts`: event-code context binding retries through the active-client persisted UUID before returning not found.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render*/route.ts`: unified and legacy export routes pass the requested client id into context binding and access-policy resolution.
- `src/components/source/canvas/UniversalCanvasShell.tsx`: Source export links include the current `client` query param when present.
- `scripts/auth/prime-agent-client-auth-states.ts`: probe routes now assert expected tenant copy and reject known foreign tenant copy.
- `src/lib/source/agent-generation/__tests__/context-binder.test.ts`: coverage for event-code retry through active-client UUID.

## QA / Validation

Before merge:

- pass: `npx jest src/lib/source/agent-generation/__tests__/context-binder.test.ts --runInBand`
- pass: `npx eslint scripts/auth/prime-agent-client-auth-states.ts src/lib/source/agent-generation/context-binder.ts src/lib/source/queries.ts src/components/source/canvas/UniversalCanvasShell.tsx 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render/route.ts' 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-html/route.ts' 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-pdf/route.ts' 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-docx/route.ts' 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-xlsx/route.ts' 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-comparison-xlsx/route.ts'`
- pass: `git diff --check`
- pass: `npm run release:check -- --base origin/main --head HEAD`

Post-deploy planned:

- Refresh Lakeshore CFO/CIO agent auth states against `https://app.abarva.ai`.
- Rerun Lakeshore live Source/Moves page screenshot proof.
- Rerun Source artifact export proof for `d09_rfp_pack`, `d13_vendor_responses`, `d19_pricing_workbook`, and `d24_decision_brief`.

## Rollout Plan

Merge to main, allow the standard Vercel production deployment, then refresh the Lakeshore agent auth states and rerun the production proof pack. No migration or manual data change is required.

## Rollback Plan

Revert this PR. Existing Source pages and export routes return to ambient active-client resolution and the older auth primer probe behavior. No data rollback is required.

## Audit Evidence

- PR URL: to be added after opening PR.
- CI checks: to be captured on PR.
- Production deployment: to be captured after merge/deploy.
- Proof reports: `reports/agent-client-auth/` and `reports/lakeshore-source-moves-artifact-proof/`.

## Known Gaps

This does not complete Azure private-plane cutover and does not expand corpus depth. It only hardens tenant context for Source exports and proof tooling.
