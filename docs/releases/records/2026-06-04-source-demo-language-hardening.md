# 2026-06-04-source-demo-language-hardening — Source Demo Language Hardening

## Release ID

`2026-06-04-source-demo-language-hardening`

## Status

`candidate`

## Plain-English Summary

This change removes prototype/data-construction wording from buyer-facing Source portfolio and artifact surfaces. Source now describes client queues, curated workspaces, artifact state, and evidence chains instead of exposing seeded, seed-backed, tier, or raw provenance language during a Lakeshore or Apex walkthrough.

## Layer Impact

- `global-control-lane`: Updates shared Source UI copy and regression tests. No schema, ingestion, auth, or Azure substrate changes are included.

## Client Applicability

- All clients: Source portfolio and artifact drawer copy is shared across tenants.
- Specific clients: Lakeshore Holdings benefits immediately because its live product substrate now presents as client-scoped Source data rather than implementation scaffolding.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/source/SourceEventsPortfolio.tsx`: Replaces seeded/prototype queue language with client event queue language.
- `src/components/source/SourceArtifactDrawer.tsx`: Replaces seed-backed provenance and confidence labels with curated workspace/source labels.
- `src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx`: Replaces the Sentinel quote that exposed artifact tier/provenance internals with artifact state/source/evidence wording.
- `src/__tests__/behaviors/source-language-canon.test.ts`: Adds a guard against seeded Source portfolio language.
- `src/components/source/__tests__/SourceArtifactDrawer.test.tsx`: Updates provenance expectations and guards against seed-backed drawer labels.

## QA / Validation

- `npx jest src/__tests__/behaviors/source-language-canon.test.ts src/components/source/__tests__/SourceArtifactDrawer.test.tsx --runInBand` — passed.
- `rg -n "seeded|Seed-backed|seed-backed|Artifact tier:|Provenance:" src/components/source/SourceEventsPortfolio.tsx src/components/source/SourceArtifactDrawer.tsx 'src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx'` — only a code comment remains; rendered user copy is clean.

## Rollout Plan

Merge to `main`; Vercel deploy picks up the Source UI copy and tests with no manual runtime steps.

## Rollback Plan

Revert the PR. No data or migration rollback is required.

## Audit Evidence

- Release record: `docs/releases/records/2026-06-04-source-demo-language-hardening.md`
- Focused Jest output listed in QA / Validation.

## Known Gaps

This slice does not wire Source generation, DOCX, deal-pack ZIP semantics, or the broader Source audit backlog. It only removes high-visibility client-facing implementation language from the Lakeshore-relevant Source walkthrough path.
