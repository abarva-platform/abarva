# 2026-08-18-home-orientation-pack — Home orientation pack generator

## Release ID

`2026-08-18-home-orientation-pack`

## Status

`candidate`

## Plain-English Summary

Home's orientation content is now derived from the canonical model ahead of time and stored, rather
than authored by hand or composed while a page loads.

Two things are produced per tenant:

1. **Six orientation blocks** answering the questions a new executive actually asks — how the
   organisation is arranged, what it is trying to do, how performance is measured, what is actually
   run, what people here say, and where it stands.
2. **One profile per populated canonical dimension** — 26 of 26 on one tenant, 24 of 26 on the other
   — describing shape, concentration, distribution, magnitude and completeness.

Every figure in both is computed by aggregation. A language model receives that aggregate and nothing
else, and writes prose about it, so it cannot generalise past the evidence and never produces a
number. Before any generated sentence is stored, a validation gate checks that every number in it
appears in the source aggregate and every named entity appears in the linked keys. Prose that fails is
discarded and the block renders its facts without narration.

Storing rather than generating at render time is what makes review possible: `status`,
`validation_status` and `approved_by` let a human gate content before a client sees it, which is
structurally impossible when text is produced during the request that displays it. Packs supersede
rather than overwrite, so approval history survives a rebuild, and regeneration is keyed on a hash of
the facts alone, so identical data produces identical words.

## Layer Impact

Lane: `global-control-lane`.

- **Layer 3 (canonical model)** — read only. No canonical object, attribute or record is modified.
- **Layer 4 (product marts)** — writes a new `artifact_type` (`NexusHomeOrientationPackV1`) into the
  existing `public.home_knowledge_packs` table, using columns that were provisioned for generated
  content and previously unused (`render_pack`, `claude_model`, `claude_prompt_version`,
  `claude_prompt_hash`, `quality_score`, `quality_report`, `validation_status`, `validation_issues`).
  No existing artifact type is touched.

## Client Applicability

- All clients: yes — any tenant with a canonical build produces a pack. No tenant-specific branching.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is inert until a surface reads the pack, which this release does not
  do.

## Changes Included

- PR https://github.com/abarva-platform/abarva/pull/6482
- `scripts/data-build/build-home-orientation-pack.ts` — new generator.
- `scripts/data-build/landscape-dimensions.ts` — new. The canonical dimension registry, extracted so
  more than one build can read it; importing it from the projector previously executed that script's
  build as a side effect.
- `scripts/data-build/refresh-home-landscape.ts` — imports the registry instead of declaring it.
- `src/lib/home/orientation-pack-read-adapter.ts` — new read adapter, filtering on `status` and
  `validation_status`.
- `tests/behaviors/home-orientation-pack-validation.test.ts` — new, 10 tests.
- No migrations. No route changes.

## QA / Validation

**PASS**, with one item explicitly **NOT RUN** and named below.

- `npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors repo-wide.
- `npx eslint` on all new and changed files — PASS, 0 errors (2 warnings for intentional destructuring
  discards).
- `npx jest tests/behaviors/home-orientation-pack-validation.test.ts` — PASS, 10/10. Covers fabricated
  numbers, fabricated percentages, unsupplied entities, recommendation and causation language, and the
  false-positive cases (sentence-initial capitals, small ordinals, supplied percentages).
- Deterministic build run dry against both tenants — PASS. 4,026 and 3,505 canonical records profiled;
  26/26 and 24/26 dimensions.
- Landscape projector re-run after the registry extraction — PASS, no regression.

Three defects were found by inspecting the first profiling output rather than by test, and fixed:
pipeline provenance being profiled as client content; a permissive numeric parser coercing hex source
fingerprints into forty-digit integers and summing a free-text field to 84 trillion; and a
completeness figure reporting an attribute as 0% populated on the same dimension where it summed to
$1.5B, because it counted only string-typed values.

**NOT RUN:** the narrative generation half has not been executed end to end. No `ANTHROPIC_API_KEY` is
present in the local environment. Facts, storage, supersession, readback and the validation gate are
proven; generated output quality has not been observed.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing reads the new pack yet, no route changes, no migration,
no image or flag change. The generator runs on demand and is dry-run by default, requiring both
`HOME_PACK_WRITE=true` and `HOME_PACK_WRITE_APPROVED=true` to write. First write should run as an ACA
Job per the data-build job rule, in an environment where the API key is configured.

## Deployment Authority

Not applicable to this release — it does not affect Azure Container Apps, deploy workflows, runtime
images, feature flags, environment variables, worker jobs, traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: not invoked.
- Shared runtime mutators: none.
- Approved image digest: not applicable; no runtime image change.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this release. Required before any surface renders the pack.

## Rollback Plan

Revert the commit. No migration to unwind. The generator writes only rows carrying its own
`artifact_type`, so no existing row is modified and reverting leaves prior packs intact. If packs have
already been written, they can be retired with a status update rather than deleted, preserving the
audit trail.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/6482
- Every stored pack carries `claude_model`, `claude_prompt_version`, `claude_prompt_hash`,
  `content_hash`, `quality_score`, `quality_report` and `validation_issues`.
- Writes are read back inside the writing transaction and the transaction aborts on mismatch.
- Dry-run output written to the build's `--out-dir` (pack JSON per tenant plus `summary.json`).

## Known Gaps

- Narrative generation unexecuted locally (no API key). Quality of generated prose is unobserved.
- No surface reads the pack yet. Wiring Home to it is a separate change, pending the decision on
  Home's shape (chat-first, tabbed, or both).
- The validation gate rejects on the conservative side by design; the rejection rate against real
  generated output is unknown until the first keyed run, and a rate above 40% sets
  `validation_status` to `fail` so it cannot pass silently.
- `approved_by` / `approved_at` are written by no workflow yet. Packs land as `candidate`; there is no
  operator surface for promoting one to `approved`.
