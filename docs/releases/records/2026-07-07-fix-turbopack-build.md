# 2026-07-07-fix-turbopack-build — Restore symbols deleted by 6ebe6d4a9 that broke the ACA build

## Release ID

`2026-07-07-fix-turbopack-build`

## Status

`candidate`

## Plain-English Summary

The production build (`npm run build`, Next.js 16 + Turbopack) was broken by an earlier "canvas three-column" merge (`6ebe6d4a9`) that landed half-applied: it deleted function/const/type definitions, dropped import statements, renamed context dimensions, changed a couple of shared type shapes, left duplicate declarations and duplicate object keys behind, and stripped required AI-surface governance tokens — while leaving all the callers/tests that still referenced the deleted/old symbols. A parallel effort already landed a build fix on `main` (including a `next.config` `typescript.ignoreBuildErrors: true` safety net plus repairs to the files it touched). This change is rebased on that `main` and layers the additional files `main` did NOT touch — genuinely runtime-broken code (`ignoreBuildErrors` masks type errors but does not fix missing symbols, duplicate object keys, or undefined variables): it restores deleted symbols from git history, re-adds dropped imports, de-duplicates the duplicated declarations/keys, updates renamed dimension literals, repairs two type shapes, and restores the AI-surface control governance rendering (AILabel, citation-gap notice, human-approval-gate tokens). `npm run build` completes with 0 errors and `scripts/audit/ai-surface-control-catalog.mjs` passes. No feature behavior is intended to change; this is a build/governance restoration fix.

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

- `NODE_OPTIONS=--max-old-space-size=8192 npm run build` — completes with exit code 0: "✓ Compiled successfully", "✓ Generating static pages (290/290)", page optimization finalized.
- `node scripts/audit/ai-surface-control-catalog.mjs` — passes (22 surfaces) after restoring the AgentDock + approval-queue governance tokens (was red on `main` HEAD, stripped by `6ebe6d4a9`).
- `npx eslint` on touched files — 0 errors (only pre-existing unused-variable warnings).
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed.

Note: `main` runs `next build` with `typescript.ignoreBuildErrors: true` (added by the parallel effort), so the type-check stage is non-blocking there. This PR does not remove that flag; instead it fixes the genuinely-broken runtime code (missing symbols, duplicate object keys, undefined vars, stripped governance tokens) that the flag would otherwise mask.

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
- The `Behavior coverage floor` CI check fails on `main` HEAD (independently of this PR) because `tenant-onboarding.test.ts` still asserts old client demo emails (`cio@apex-retail.example.com`, etc.) that the launch-roster rewrite of `canonical-auth-roster.ts` deliberately removed. This PR leaves `canonical-auth-roster.ts` identical to `main`, so it neither causes nor fixes that failure; it is tracked as a separate reconciliation task.
- This record does not itself deploy; the ACA image build/deploy is a separate, standard step.
