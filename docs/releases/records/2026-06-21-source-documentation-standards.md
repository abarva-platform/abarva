# 2026-06-21-source-documentation-standards — Source artifact profile registry + documentation standards

## Release ID

`2026-06-21-source-documentation-standards`

## Status

`candidate`

## Plain-English Summary

Source deliverables were generated without a consistent audience, format, or language standard — client-facing memos could expose d-codes, AI model names, internal gate language, and scattered [CLIENT TO SET] placeholders. Vendor-facing RFPs could inadvertently include internal value sensitivity or scoring mechanics. There was no enforcement layer preventing these leaks.

This PR introduces a documentation standards layer per the founder brief `AbarVa_Source_Module_Documentation_Standards_and_Prompt.docx`:

1. **Artifact profile registry** (`source-artifact-profiles.ts`): All 40 Source deliverables (d01–d33 + dx series) now have a typed profile specifying audience, clientFacing boolean, defaultFormat, maxWords/maxSlides, evidenceMode, sourceRegisterPolicy, missingInputPolicy, visualDensity, allowedInternalLabels, requiredExhibits, and bannedTerms.

2. **Documentation standards module** (`source-documentation-standards.ts`): Language replacement map (d-codes → human titles; gate language → decision language), QA gate suite (8 gates covering banned terms, audience fit, executive readability, decision closure, required exhibits, length discipline, fabrication warning, missing-input consolidation), language policy block injector for generation prompts, banned terms scanner, and format router.

3. **Test suite** (25 tests, all passing): Covers registry coverage (all 40 codes present), banned terms scanning, QA gate behavior for both clean and violating content, format routing, and language policy block generation.

These components are library-only — nothing is wired into generation routes yet. Wiring generation prompts to bind `buildLanguagePolicyBlock()` and routing QA gates into the save path are P1 follow-ons.

## Layer Impact

- **global-control-lane**: new directory `src/lib/source/documentation-standards/` with 3 files. No schema, migration, route, or environment change.

## Client Applicability

All clients: standards apply to all Source artifact generation regardless of tenant. Profile registry is the universal binding contract for all 40 deliverables.

## Changes Included

- `src/lib/source/documentation-standards/source-artifact-profiles.ts` (NEW): `SourceArtifactProfile` type + full registry of 40 profiles + lookup helpers (`getSourceArtifactProfile`, `getAllSourceArtifactProfiles`, `getClientFacingProfiles`, `getProfilesByAudience`)
- `src/lib/source/documentation-standards/source-documentation-standards.ts` (NEW): `LANGUAGE_REPLACEMENTS`, `QA_GATES` (8 gates), `runDocumentQA`, `buildLanguagePolicyBlock`, `scanForBannedTerms`, `resolveArtifactFormat`
- `src/lib/source/documentation-standards/__tests__/source-documentation-standards.test.ts` (NEW): 25 tests

## QA / Validation

- TypeScript: PASS — `tsc -p tsconfig.json --noEmit` clean
- Tests: PASS — 25/25 (`npx jest src/lib/source/documentation-standards`)
- Logic review: PASS — client-facing profiles all have `allowedInternalLabels: false`; vendor-facing profiles (d09, d11, d22) additionally ban `"internal sensitivity"` and `"value floor"`; `runDocumentQA` correctly short-circuits for internal artifacts

## Rollout Plan

1. Merge PR to main (squash)
2. ACA auto-deploys updated web image (library-only; no observable change in product yet)
3. Wire `buildLanguagePolicyBlock(artifactCode)` into generation prompts (P1 follow-on)
4. Add `runDocumentQA` to artifact save path with blocker enforcement (P1 follow-on)

## Deployment Authority

- Repo-owned deploy workflow: aca-main-deploy auto-deploys on push to main
- Shared runtime mutators: none
- Env var change required: none
- Live signed-in proof required: no (library only; proof deferred to generation wiring)

## Rollback Plan

Remove `src/lib/source/documentation-standards/` directory. No runtime impact — the directory is not yet imported by any route.

## Known Gaps

- Generation prompts are not yet bound to profiles — `buildLanguagePolicyBlock` exists but is not called from `prompt-registry.ts` or `d09-map-reduce.ts`
- QA gate is not yet wired into the artifact save path — `runDocumentQA` exists but is not called from the generate route
- Three golden reference samples (Sourcing Strategy Memo, RFP Executive Summary, Executive Award Recommendation) are not yet authored — P1 backlog item

## Audit Evidence

- PR URL: (assigned on merge)
- CI: tsc + 25-test suite
- Post-deploy: library-only; no ACA proof required
