# 2026-10-06-moves-governed-data-foundation-artifact-pack — An archetype that collects evidence and then uses it

## Release ID

`2026-10-06-moves-governed-data-foundation-artifact-pack`

## Status

`candidate`

## Plain-English Summary

A Move declares a use-case archetype, and that one declaration is read by two
separate catalogs. The first says which evidence to collect and who to
interview. The second says which exhibits, tables and evidence grounding the
documents produced later should get.

One archetype was declared in the first catalog and not the second. Brief
composition has no error path for that: when no pack answers, it falls through
to a generic single-row risk register and adds no evidence grounding at all. So
a Move declaring this archetype collected eleven required families of discovery
evidence, had them reviewed and approved, and then produced design, plan and
mobilise documents that could not see any of it.

Measured over all 21 shipped deliverable structures before this change: 21
grounded none of the archetype's evidence families, and 21 carried none of its
exhibits or tables. After: 19 ground the full family set and 18 carry the
archetype's own exhibits and tables. The two that still ground nothing do so by
design — a charter must not pre-empt the evidence phase, and a workshop guide is
a facilitation template.

This release adds that second-catalog entry: eleven evidence families named with
the SAME ids the first catalog collects under, five exhibits, nine tables, and a
governance boundary stating that "certified" means attested and that value is
not quantified before the baselines it rests on are signed off.

Naming the same ids in both halves is a product decision this is the first
archetype to take. Until now the two vocabularies were fully disjoint, which
meant the same underlying evidence was requested twice under two names and
neither half could tell. The case that measured that disjointness asked, in its
own comment, to be updated to the new number when the decision was taken; it
now asserts the shared id list explicitly.

## Layer Impact

Release lane: `global-control-lane` — shared deliverable-brief behaviour for all
clients, reached only by the archetype a Move declares.

- **Layer 3 — canonical model:** unchanged. No schema, no migration, no stored
  record. The evidence family ids used are the ones the discovery catalog
  already declares.
- **Layer 4 — products (Moves):** the deliverable brief served for this
  archetype now carries its evidence families, exhibits, tables and governance
  boundary instead of a generic fallback. No other archetype's brief changes.

## Client Applicability

- All clients: yes — a catalog declaration, not tenant-scoped data.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is inert for a Move that does not declare this
  archetype, because the pack is reached only by that declaration.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/archetype-pack-governed-data-foundation.ts`
  (new) — the pack. Content lives beside the contract rather than inside it, so
  a declaration can be added without editing the schema it is validated by.
- `src/lib/deliverables/orchestrator/briefs/archetype-packs.ts` — one import and
  one catalog entry.
- `src/lib/deliverables/orchestrator/briefs/evidence-family-vocabulary.ts` —
  eleven family entries with labels and what each grounds. The vocabulary is
  pinned equal to the union of the built-in packs' families in both directions,
  so a pack cannot name a family nothing declares.
- `src/lib/deliverables/orchestrator/__tests__/archetype-pack-governed-data-foundation.test.ts`
  (new, 10 cases).
- `src/lib/deliverables/orchestrator/__tests__/archetype-pack-config.test.ts`,
  `archetype-evidence-landing.test.ts`, `brief-library.test.ts` — three
  measurements this change legitimately moves, restated rather than loosened
  (see QA).
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/lib/deliverables/orchestrator/__tests__` — 54 suites,
  779 tests. The new suite is 10 of them, in a directory the unit-suites
  workflow already sweeps.
- **PASS** mutation check, 5 of 5 killed, against a green 779-test baseline:
  dropping one required family from the pack (4 failures); adding the
  blueprint's optional family, which would send a retrieval query for evidence
  the gate never asks for (7); renaming the risk-register table key (1);
  removing the catalog registration (5); weakening the governance boundary so it
  no longer forbids quantifying value early (1).
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit` — exit 0.
- **PASS** `npx eslint src/lib/deliverables/orchestrator` — exit 0.
- **PASS** `npm run audit:lib-orphans` — "No change against the baseline"; the
  new module is reached from product code, not only from its own test.
- **PASS** `npm run audit:test-ci-coverage:write` and
  `audit:tenancy-fence-coverage:write` — regenerated honestly. Covered test
  files 2565 → 2568 and total 2729 → 2732 against the committed census; the new
  suite is one of the three, the other two are drift the committed census had
  already accumulated. Uncovered test files unchanged at 164, which is the
  statement that the new suite is swept rather than dark.
- **NOT RUN** live signed-in walk. No runtime surface changed and no data was
  written; what a declaring Move's documents now contain is proven in the
  deliverable-brief report, not in a browser. The product-level proof belongs to
  the end-to-end walk recorded separately.

Three restated measurements, each with the reason:

1. The pack roster was pinned at five entries; it is six.
2. The two family vocabularies were pinned as fully disjoint, with a comment
   asking for the number to be updated when the sharing decision was taken. It
   now asserts the shared ids as a list, and additionally that they are exactly
   the required families the first catalog declares — the assertion that catches
   that catalog growing a required family the pack half never learns about.
3. One landing-report case asserted that a deliverable either grounds the
   archetype's families or withholds its assets, in both directions at once. For
   an archetype whose two halves share ids, the discovery plan — served by its
   own builder from the first catalog — reads as grounded while carrying no pack
   assets, which is correct attribution and not the defect the case exists to
   catch. It is now split: the direction that IS a defect (assets arriving in a
   deliverable grounded nowhere) still holds for every archetype without
   exception, and the other direction is pinned to that one permitted shape, so
   a composed brief losing its assets cannot hide there.

## Rollout Plan

Merge to main. The repo-owned ACA main deploy workflow builds and deploys in the
ordinary lane. No migration, no flag, no env var, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This change runs no Azure command.
- Approved image digest: whatever the main deploy workflow produces for the
  merge commit; this release pins none of its own.
- ACA runtime invariant: to be proven by the main deploy workflow as usual.
- Worker image invariant: unaffected; no worker job touched.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: not for this change on its own. It is required
  for the end-to-end claim that a declaring Move produces archetype-shaped
  documents, which this change is a precondition of and not a substitute for.

## Rollback Plan

Revert the commit. The catalog entry is the only thing reached: with it gone,
brief composition returns to the generic fallback it used before, which is the
behaviour every other undeclared archetype still gets. Nothing persisted, so
there is no data to unwind and no migration to reverse. The three restated test
measurements revert with the same commit.

## Audit Evidence

- The PR and its CI run.
- The before/after landing numbers are reproducible from
  `archetypeEvidenceLandingReport`, which reads the SERVED brief through
  `getArtifactBrief` rather than re-reading the declaration, so it cannot drift
  from what the model is actually told.
- `validateBuiltInArchetypePackCatalog()` returning empty, asserted in the new
  suite, is the statement that the shipped pack passes the same contract a
  configured one is held to.

## Known Gaps

- Two of the eleven shared evidence families land in the brief under ids the
  first catalog chose; the remaining four archetypes still use two disjoint
  vocabularies. Whether those should converge is the same product decision,
  taken once here and not retro-applied.
- The exhibits and tables declare what each document should contain; whether a
  generated document actually produces them is the generation quality gate's
  question, not this release's.
- A setup surface for declaring an archetype without shipping code exists for
  the config overlay path only. A deploying firm can still not do this from the
  product UI.
