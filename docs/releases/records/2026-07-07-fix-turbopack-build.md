# 2026-07-07-fix-turbopack-build — Restore symbols deleted by 6ebe6d4a9 that broke the ACA build

## Release ID

`2026-07-07-fix-turbopack-build`

## Status

`candidate`

## Plain-English Summary

The production build (`npm run build`, Next.js 16 + Turbopack) was broken on `origin/main`, which blocked every Azure Container Apps deploy. The break came from an earlier "canvas three-column" merge (`6ebe6d4a9`) that landed half-applied: it deleted function/const/type definitions, dropped import statements, renamed context dimensions, changed a couple of shared type shapes, and left duplicate declarations and duplicate object keys behind — while leaving all the callers that still referenced the deleted/old symbols. Turbopack compiled cleanly, but Next.js then failed the build during its TypeScript pass. This change restores the deleted symbols from git history (they previously worked), re-adds the dropped imports, de-duplicates the duplicated declarations/keys, updates renamed dimension literals, and repairs two type shapes so `npm run build` completes with 0 errors. No feature behavior is intended to change; this is a build-restoration fix.

## Layer Impact

Release lane: `global-control-lane` (shared app/control-plane behavior for all clients; none of the touched code is tenant-gated). The changes span shared agent/answer libraries (`visible-answer-contract`, `intelligence/ask`, `atlas/llm`, `cio-tower`), context-ingestion types and adapters, the source canvas UI (`UniversalCanvasShell`, `AgentDock`), the source prompt registry, and a handful of API routes and pages. All are restorations/repairs of code that shipped before the broken merge.

## Client Applicability

- All clients: Yes — this restores the shared production build/deploy path; without it no client can receive any new deploy.
- Specific clients: n/a
- Internal only: No
- Public/demo only: No
- Feature flag: None (unconditional build fix)

## Changes Included

PR: `fix(build): restore symbols deleted by 6ebe6d4a9 that broke the Turbopack/ACA build` (branch `fix-turbopack-build`).

Representative repairs:
- `src/lib/agent/visible-answer-contract.ts` — restored `VISIBLE_ANSWER_CONTRACT_PROMPT`, `VISIBLE_ANSWER_CONTRACT_VERSION`, `VisibleAnswerViolation`, `assertVisibleAnswerContract`, `visibleAnswerIssueIds`; kept the refactor's new `VISIBLE_MODEL_OUTPUT_CONTRACT_PROMPT`.
- `src/lib/intelligence/ask/skyharbor-cto-readiness-source.ts` — restored `buildSkyHarborCtoReadinessNativeCanvasBlock` (+ helpers).
- `src/components/source/canvas/UniversalCanvasShell.tsx` — merged duplicate `displayAgentName`; restored dropped imports, deleted local helpers/consts (`isLakeshoreSharedServicesDemoEvent`, `isArtifactDraftVisible`, `LAKESHORE_CASE_STUDY_CHOICES`, `handleDraftWithSentinel`), the visible-text derivation block, the gate-sidebar wrapper adapters, and defined `CanvasContextStrip`/its props.
- `src/app/api/v1/source/[eventId]/artifacts/upload/route.ts` — removed the duplicate `selectSourceWriteAdapter` import; restored the `upload-sync` import.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`, `src/app/api/intelligence/ask/route.ts`, `src/lib/intelligence/ask/index.ts`, `src/lib/atlas/llm.ts`, `src/app/api/tower/ask/route.ts`, `src/components/agent/AgentDock.tsx`, `src/lib/auth/{canonical-auth-roster,demo-code}.ts`, `src/app/(maestro)/admin/page.tsx`, `src/app/sign-in/[[...sign-in]]/page.tsx` — restored dropped imports / deleted locals / removed dead broken blocks.
- `src/lib/context-ingestion/*` — updated renamed `ContextDimension` literals (`infrastructure_estate`→`infrastructure_cloud`, `business_capability`→`capabilities_value_streams`, `service_levels`→`operations_service_management`), guarded optional `exceptionMetadataRequirements`/`exceptionFormats`, restored `getFormatSupportProfile`/`assertRequiredFieldsMapped`, cast `DIMENSION_FAMILY_MAP` index sites, removed a duplicate `DomainSegment` type, adapted the (test-only) `template-alignment` consumer to the new metadata/profile shapes.
- `src/lib/ingestion/document-upload-parser.ts` — restored typed optional fields on `ParsedIngestionDocument.metadata`.
- `src/lib/enterprise-context/intelligence-read-model.ts` — restored `orgRows`/`businessUnitRows`/`kpis` locals; completed the chunk-backed overview return.
- `src/lib/source/agent-generation/prompt-registry.ts` — removed duplicate `d02/d03/d04/d24` prompt-registry entries (kept the newer aVa-voice/board-grade ones).
- `src/lib/crawl/persona-switcher.ts` — restored deleted `EXPLICIT_CRAWL_SURFACES`.
- `scripts/jobs/load-first-capital-v2.ts` — cast `DIMENSION_FAMILY_MAP` index access.

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 npm run build` — completes with exit code 0: "✓ Compiled successfully", TypeScript pass clean, "✓ Generating static pages (290/290)", page optimization finalized.
- `npx eslint` on touched files — 0 errors (only pre-existing unused-variable warnings).
- `node scripts/release-check.mjs --base origin/main --head HEAD` — expected to pass with this record present.

Note: the repo's `next build` runs a blocking TypeScript pass (no `typescript.ignoreBuildErrors`). Bare `tsc -p tsconfig.json` did not reproduce these errors (stale/cache-tolerant); `next build` was the only authoritative check, so fixes were verified by iterating the real build to green.

## Rollout Plan

Merge to `main` (squash). This unblocks the canonical ACA release path: build image from the merged SHA with `az acr build`, deploy to `ca-abarva-web-lab-eastus`, wait for healthy revision, shift 100% ingress, verify `https://app.abarva.ai`. No migration and no feature-flag change are part of this record.

## Deployment Authority

- Repo-owned deploy workflow: standard ACA lane (docs/runbooks/azure-container-apps-deploy.md).
- Shared runtime mutators: none introduced.
- Approved image digest: to be produced from the merged main SHA.
- ACA runtime invariant: `ca-abarva-web-lab-eastus`, 100% traffic to the new healthy revision.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: standard post-deploy `https://app.abarva.ai` route/browser check after the image is deployed.

## Rollback Plan

Revert the squash-merge commit on `main` and redeploy the prior image. This restores the previous state (which is the broken build), so rollback is only appropriate if this change is found to regress runtime behavior — in which case the specific offending file should be fixed forward rather than reverting the whole build fix.

## Audit Evidence

- PR URL: see the `fix-turbopack-build` PR on `abarva-platform/abarva`.
- Build log: `npm run build` exit 0, "✓ Compiled successfully in 28.4s", "✓ Generating static pages (290/290)".
- Git provenance: each restored symbol was taken from `git show 6ebe6d4a9^:<file>` (the last known-good pre-break state).

## Known Gaps

- `template-alignment.ts` is consumed only by a test; it was adapted to the new metadata/profile shapes rather than restoring the old shapes, so its associated test may need follow-up if it asserts the old fields.
- `sanitizeForTenantPrompt` (atlas/llm) was newly defined to satisfy a refactor call site that never created it; it deep-applies the existing `stripInternalReferences` scrubber. Behavior is best-effort scrubbing, not a formal tenant-isolation guarantee.
- This record does not itself deploy; the ACA image build/deploy is a separate, standard step.
