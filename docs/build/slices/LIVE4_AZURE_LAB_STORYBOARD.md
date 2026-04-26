# Slice Contract: LIVE4

## Identity

| Field | Value |
|---|---|
| ID | LIVE4 |
| Name | Azure Lab Storyboard |
| Category | demo |
| Status | code_complete |
| Risk | low |
| Wave | wave-13 |
| Created | 2026-04-26 |
| Author | Lane D |

## Goal

Create a TypeScript storyboard model, deterministic Jest tests, and markdown documentation
explaining the Azure private data plane architecture story for a live demo. The storyboard guides
sales engineers and founders through an 8-slide, 17-minute walk covering the data trust problem,
the two-plane architecture, Azure resource group split, private data plane components, evidence
without raw data, boundary enforcement, May 4 lab deployment plan, and client-specific caveats.

## Files Produced

| File | Purpose |
|---|---|
| `src/lib/qa/azure-lab-storyboard.ts` | TypeScript storyboard model with types and `buildAzureLabStoryboard()` builder |
| `src/__tests__/integration/qa/azure-lab-storyboard.test.ts` | Deterministic Jest tests for storyboard shape and invariants |
| `docs/demo/AZURE_PRIVATE_DATA_PLANE_LAB_STORYBOARD.md` | Full markdown storyboard with speaker notes and slide sections |
| `docs/build/slices/LIVE4_AZURE_LAB_STORYBOARD.md` | This slice contract |
| `docs/build/build-slices.json` | LIVE4 entry appended (status: code_complete, wave: wave-13) |
| `docs/build/production-readiness.json` | LIVE4 note appended to `production_deployment` component notes |
| `docs/build/build-waves.json` | LIVE4 added to wave-13 completedSlices |

## Acceptance Criteria

- [x] `src/lib/qa/azure-lab-storyboard.ts` exports `StoryboardSlideType`, `StoryboardSlide`,
      `AzureLabStoryboard`, and `buildAzureLabStoryboard()`.
- [x] Storyboard contains exactly 8 slides covering narrative, architecture (×2), demo_step (×2),
      trust_story, plan, and caveat slide types.
- [x] `totalSlides` equals `slides.length`; `totalDurationMinutes` equals sum of `durationMinutes`.
- [x] `generatedAt` is hardcoded `'2026-04-26'`; `schemaVersion` is `1`.
- [x] All string fields are non-empty; all slide IDs are unique.
- [x] `whatLabProves` has 5 entries; `whatLabDoesNotProve` has 5 entries;
      `whatRemainsClientSpecific` has 5 entries.
- [x] `fortune500TrustRationale` is non-empty and longer than 50 chars.
- [x] `may4LabPlan` is non-empty.
- [x] Jest suite passes with 100% deterministic results.
- [x] TypeScript compiles with no errors (`npx tsc --noEmit`).
- [x] ESLint passes with zero warnings (`npx eslint --max-warnings=0`).
- [x] Markdown storyboard covers all 8 slides with speaker notes, what to show, what not to claim.
- [x] `build-slices.json` contains LIVE4 entry with `code_complete`.
- [x] `production-readiness.json` `production_deployment` notes array contains LIVE4 note;
      no status fields changed.
- [x] `build-waves.json` wave-13 contains LIVE4 in `completedSlices`.

## Validation Commands

```bash
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/qa/azure-lab-storyboard.test.ts --no-coverage
npx eslint --max-warnings=0 src/lib/qa/azure-lab-storyboard.ts src/__tests__/integration/qa/azure-lab-storyboard.test.ts
```

## Scope

TypeScript model, tests, and documentation only. No application code changes, no runtime
modifications, no migrations, no model calls, no network calls, no IaC changes.

## What Is NOT Claimed

- No production-readiness component status is promoted.
- No Azure resources are provisioned; this is documentation and model code only.
- No compliance attestation or data residency proof.
- No push, merge, or PR opened.

## Code Complete: 2026-04-26
