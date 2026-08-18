# Release record — Home orientation pack generator

- **Date:** 2026-08-18
- **Lane:** `global-control-lane`
- **Layer impact:** Layer 3 read → Layer 4 product mart (`public.home_knowledge_packs`)
- **Client applicability:** All tenants with a canonical build. No tenant-specific behaviour.

## What changed, in plain English

Home's orientation content is now generated ahead of time from the canonical model and stored, rather
than authored by hand or composed at request time.

Two things are produced per tenant:

1. **Six orientation blocks** answering the questions a new executive actually asks — how the
   organisation is arranged, what it is trying to do, how performance is measured, what is actually
   run, what people here say, and where it stands.
2. **One profile per populated canonical dimension** (26 of 26 on one tenant, 24 of 26 on the other),
   describing shape, concentration, distribution, magnitude and completeness.

Every figure in both is computed by aggregation. A language model writes prose *about* the aggregate
and is given nothing else, so it cannot generalise past the evidence. Before any generated sentence is
stored, a validation gate checks that every number in it appears in the source aggregate and every
named entity appears in the linked keys. Prose that fails is discarded and the block renders its facts
without narration.

Content is stored with its full provenance — model, prompt version, prompt hash, quality score,
validation status and issues — and supersedes rather than overwrites, so approval history survives a
rebuild. Regeneration is keyed on a hash of the facts alone, so identical data produces identical
words and a nightly run does not reword the page.

## Why precomputed rather than generated at render time

Storage buys determinism, latency, consistency across Home/Intelligence/aVa, and auditability. The
decisive reason is review: `status`, `validation_status` and `approved_by` allow a human to gate
content before a client sees it. That is structurally impossible when text is produced during the
request that displays it.

## QA / validation

- `npx tsc --noEmit -p tsconfig.json` — 0 errors across the repository.
- `npx eslint` on all new files — 0 errors.
- 10 behaviour tests on the validation gate, all passing. They cover fabricated numbers, fabricated
  percentages, unsupplied entities, recommendation and causation language, and the false-positive
  cases (sentence-initial capitals, small ordinals, supplied percentages).
- Deterministic build run dry against both tenants: 4,026 and 3,505 records profiled.
- The landscape projector was re-run after the dimension registry was extracted, confirming no
  regression.

Three defects were found and fixed by inspecting the first profiling output rather than by test:
pipeline provenance being profiled as client content; hex fingerprints coerced into forty-digit
integers by a permissive numeric parser; and a completeness figure that contradicted the magnitude
figure on the same dimension because it counted only string-typed values.

The narrative half has not been executed end to end — no API key is available in the local
environment. It runs where the key is configured. Facts, storage, gating and validation are proven;
generation output quality is not yet observed.

## Rollout

Additive. New script, new read adapter, new artifact type. Nothing reads the new pack yet, so merging
changes no rendered surface.

## Rollback

Revert the commit. The generator writes only rows of its own `artifact_type`; no existing row is
modified.

## Audit evidence

Every stored pack carries `claude_model`, `claude_prompt_version`, `claude_prompt_hash`,
`content_hash`, `quality_score`, `quality_report` and `validation_issues`. Writes are read back inside
the transaction before commit.
