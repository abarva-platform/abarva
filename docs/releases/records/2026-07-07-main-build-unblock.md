# 2026-07-07-main-build-unblock — Fix 15 pre-existing bugs blocking main's production build

## Release ID

`2026-07-07-main-build-unblock`

## Status

`candidate`

## Plain-English Summary

While deploying an unrelated Tower fix (PR #4516), we discovered `main`'s production
build (`npm run build`) was already broken — the ACA deploy for the commit immediately
before that merge had already failed. This release record covers 15 distinct,
independently-verified bugs found and fixed while chasing the build to a real, working
state one error at a time. None of these are stubs — each was confirmed by getting a
real `npm run build` to advance past it, and every touched file passes eslint clean.

The bugs cluster into four themes:

1. **Context-ingestion / admin cluster** — `template-registry.ts` referenced an entire
   "exception intake" subsystem (`SUPPORTED_CONTEXT_UPLOAD_FORMATS`,
   `getTemplateFormatCoverage`, `FORMAT_SUPPORT_PROFILES`,
   `buildExceptionMetadataRequirements`) that was never defined. `admin/page.tsx` had an
   entire dead code block left over from a prior page redesign (8 undefined symbols,
   none referenced by the actual render) plus a genuinely-missing `sourceFiles` fetch
   call. Two files indexed `DIMENSION_FAMILY_MAP` with a wider type than its declared
   keys allow (`vendor_contracts` and other legacy dimensions aren't universal-family
   dimensions) — fixed with a defensive `in`-guarded lookup.
2. **visible-answer-contract.ts / tower-w7 cluster** — rewrote
   `VISIBLE_ANSWER_CONTRACT_PROMPT` and `assertVisibleAnswerContract` against their own
   pre-existing test file (`src/lib/agent/__tests__/visible-answer-contract.test.ts`,
   which fully specifies the contract) after an initial guess proved wrong; all 7 tests
   pass. Wired the missing `v6VisibleOutputAudit` field into Tower's
   `CioTowerAnswerResult` using the now-real function. Implemented
   `buildSkyHarborCtoReadinessNativeCanvasBlock` (was referenced, never defined).
   Deduplicated two `displayAgentName` function declarations with different arities.
3. **Intelligence PR #4518 typing cluster** — `AskPayload`/`AskOptions` were missing
   `richText` and `companionCanvasEnabled` fields that were already read/passed
   elsewhere in the same routes — looks like incomplete typing from the Intelligence
   CXO-storytelling PR that merged concurrently with this investigation.
4. **Source upload/nexus-ask missing-import cluster** — several genuinely-called
   functions/types were never imported (`UploadSubstrateSyncResult`,
   `syncUploadToCanvasSubstrate`, `getSourcingEventForResolvedClient`,
   `buildContractOptimizationMveProfile`, `buildSkyHarborAmsExistingContractInput`,
   `isSkyHarborContractOptimizationEvent`), plus one duplicate import removed.

## Layer Impact

Release lane: `global-control-lane` (shared app/control-plane code — none of these
fixes are tenant-gated; they restore code paths used across Tower, Intelligence,
Home, Atlas, and Source for all clients).

## Client Applicability

- All clients: yes — these are shared library/route fixes, not tenant-specific.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — all fixes restore existing, unconditional code paths.

## Changes Included

13 files: `scripts/jobs/load-first-capital-v2.ts`, `src/app/(maestro)/admin/page.tsx`,
`src/app/api/admin/context-layer/manifest-load/route.ts`,
`src/app/api/chat/agent/route.ts`, `src/app/api/intelligence/ask/route.ts`,
`src/app/api/v1/source/[eventId]/artifacts/upload/route.ts`,
`src/app/api/v1/source/[eventId]/nexus/ask/route.ts`,
`src/components/source/canvas/UniversalCanvasShell.tsx`,
`src/lib/agent/visible-answer-contract.ts`, `src/lib/cio-tower/answer.ts`,
`src/lib/context-ingestion/template-registry.ts`, `src/lib/intelligence/ask/index.ts`,
`src/lib/intelligence/ask/skyharbor-cto-readiness-source.ts`.

## QA / Validation

- `npx eslint <file>` clean (0 errors) on every touched file at each step.
- `npx jest src/lib/agent/__tests__/visible-answer-contract.test.ts` — 7/7 passed
  (this is the authoritative pre-existing spec for the rewritten contract logic).
- `npx jest src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts` — 2/2 passed.
- `npm run build` (real `npm install`, not a symlinked worktree, `NODE_OPTIONS=--max-old-space-size=8192`)
  advanced through 15 successive failures to this state, each one a genuine
  Turbopack/TypeScript build error that these fixes resolve.
- **Known gap:** a full `npx tsc --noEmit -p .` scan after these 15 fixes still shows
  ~264 remaining errors across ~24 files, so `npm run build`'s full-project typecheck
  step still does NOT pass end-to-end. The dominant remaining clusters are
  `AgentDock.tsx` (59 errors — undefined locals like `thread`, `focused`, `agent`,
  `suggestedActions`, consistent with a component left mid-migration; needs its
  intended contract reconstructed, not a mechanical fix) and ~40 hand-authored entries
  in `UNIVERSAL_CONTEXT_TEMPLATES`/the Meridian healthcare template array in
  `template-registry.ts` that were never wired to the new
  `exceptionFormats`/`formatProfiles`/`exceptionMetadataRequirements` fields (mechanical,
  but out of scope for this PR). See Known Gaps.

## Rollout Plan

Standard ACA rollout on merge: GitHub Actions "ACA main deploy" builds from the merge
SHA. **This PR alone does not make main's build succeed end-to-end** — the remaining
~264 tsc errors (see Known Gaps) will still fail the Docker build's typecheck step
until follow-up work lands. This release record documents real, verified progress
toward that goal, not a claim that deploy is unblocked.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/*aca-main-deploy*` (existing, unmodified)
- Shared runtime mutators: none added
- Approved image digest: n/a — this PR does not by itself produce a deployable image
- ACA runtime invariant: unchanged
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: not yet possible — blocked on the remaining tsc
  errors documented above. Live verification of the original Tower fix (PR #4516)
  is deferred until a follow-up PR resolves `AgentDock.tsx` and the template-registry
  array gap.

## Rollback Plan

Revert the merge commit; no migration or data change to unwind, code-only.

## Audit Evidence

- PR URL: (to be filled in when opened)
- Full `npx tsc --noEmit -p .` output showing the remaining 264-error baseline this
  PR reduces from, available in the session transcript.

## Known Gaps

- `AgentDock.tsx` (59 tsc errors): needs investigation of its intended prop/state
  contract before it can be fixed — out of scope here, tracked as follow-up.
- `template-registry.ts` `UNIVERSAL_CONTEXT_TEMPLATES` + Meridian healthcare template
  array (~40 entries, ~45 tsc errors): mechanical but sizable — each entry needs
  `exceptionFormats`/`formatProfiles`/`exceptionMetadataRequirements` derived the same
  way `NORTHSTAR_CONTEXT_TEMPLATES` now does. Tracked as follow-up.
- `UniversalCanvasShell.tsx` (34 remaining errors), `nexus/ask/route.ts` (32 remaining,
  beyond the 2 import fixes in this PR), `atlas/llm.ts` (23), `intelligence/ask/index.ts`
  (19 remaining beyond `companionCanvasEnabled`), `csv-upload-connector.ts` (13): not yet
  triaged individually; likely a mix of the same missing-import/missing-field patterns
  fixed here, but not yet confirmed file-by-file.
- Main's own CI checks (ESLint, Typecheck + reasoning-layer tests, and several others)
  were already failing before this PR for reasons that overlap with — but are broader
  than — what this PR fixes; they are not expected to go green from this PR alone.
