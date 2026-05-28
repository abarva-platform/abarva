# 2026-05-28-healthcare-corpus-foundation - Healthcare Corpus Foundation

## Release ID

`2026-05-28-healthcare-corpus-foundation`

## Status

`candidate`

## Plain-English Summary

Adds a static healthcare corpus foundation for pilot readiness. The artifact
defines the operating dimensions, minimum pattern targets, evidence sources,
regulatory overlays, and agent workflows needed before healthcare-specific
patterns are authored or bound to tenant evidence.

## Layer Impact

- `corpus-knowledge-lane`: adds the healthcare corpus blueprint and
  machine-readable manifest under `docs/build/healthcare-corpus/`.
- `ops-release-lane`: adds a deterministic verifier for the corpus foundation
  acceptance thresholds.
- No runtime lane is changed. No app route, Meridian dataset file, database
  migration, seed script, or context-layer implementation is touched.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: healthcare pilots can use the foundation as the reusable
  industry corpus plan before tenant-specific evidence binding.
- Internal only: corpus authoring, acceptance review, and pilot-readiness QA.
- Public/demo only: not applicable.
- Feature flag: none.

## Changes Included

- `docs/build/healthcare-corpus/healthcare-corpus-blueprint.md`
- `docs/build/healthcare-corpus/healthcare-corpus-manifest.json`
- `scripts/verify/healthcare-corpus-foundation.mjs`
- `docs/releases/records/2026-05-28-healthcare-corpus-foundation.md`

## QA / Validation

- pass: `node scripts/verify/healthcare-corpus-foundation.mjs`
- pass: `npm run release:check`
- pass: `git diff --check`

## Rollout Plan

Merge after local validation and review. This change is documentation and a
local verifier only, so no Vercel deploy, database migration, tenant ingestion,
or environment-variable update is required.

## Rollback Plan

Revert the commit. Because no runtime code or data store is modified, rollback
only removes the static corpus artifact and verifier.

## Audit Evidence

The verifier requires at least 20 dimensions and at least 50 target patterns per
dimension. The manifest declares 22 dimensions with a total target of 1,220
healthcare patterns, plus evidence-source, regulatory-overlay, and agent
workflow requirements for every dimension.

## Known Gaps

This release does not author the individual 1,220 target patterns, bind any
tenant evidence, enqueue embeddings, or run Meridian-specific ingestion. Those
activities remain separate implementation lanes.
