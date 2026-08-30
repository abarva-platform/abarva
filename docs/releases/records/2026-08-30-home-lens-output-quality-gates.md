# 2026-08-30-home-lens-output-quality-gates — Score Home writer lenses on generated output

## Release ID

`2026-08-30-home-lens-output-quality-gates`

## Status

`candidate`

## Plain-English Summary

The Home narrative writer puts on a different "hat" for each page — board adviser for the executive
brief, enterprise architect for the technology page, and so on. Until now the only tests of those
hats read the configuration file that declares them and checked it contained the words its own
author had written. That proves the hats are *described* differently. It cannot tell whether the
generated writing actually differs, which is the thing that matters to a reader.

This change measures the generated prose instead. It adds three things: a record of whether each
page's hat actually reached the writer at all, a score for whether each hat changed the writing, and
checks that read the finished text for the specific mistakes each hat is told to avoid. It also
moves the existing builder-vocabulary check to the moment a narrative is promoted for readers, so
the check covers what ships rather than a snapshot that may be older than the text on the page.

No narrative has been regenerated and nothing is deployed. This is measurement apparatus and gates.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 3 / canonical model:** unchanged. No schema, migration, or projection change.
- **Layer 4 / products:** unchanged at runtime. The Home page reads promoted snapshots exactly as
  before; the promotion path gains one refusal.
- **Build/QA tooling:** the plan-only chapter measurement run reports three new dimensions.

## Client Applicability

- All clients: no
- Specific clients: Meridian and SkyHarbor measurement runs only (plan-only, no writes)
- Internal only: yes — build tooling and gates
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/data-build/home-lens-quality.ts` (new) — lens vocabulary signatures, divergence scoring,
  and the output-level `must_not_do` checks. Pure and deterministic; no model call.
- `scripts/data-build/build-home-chapters.ts` — records `lensSource` per chapter and **refuses the
  measurement run** if any chapter fell back to the thin built-in lens; adds divergence and
  `must_not_do` results to each measurement variant; reports the application/deployment counts used
  as the oracle.
- `scripts/data-refresh/promote-golden-snapshots.mjs` — refuses to promote a narrative whose raw
  statements carry builder vocabulary.
- `scripts/data-build/__tests__/home-lens-quality.test.ts` (new) — 10 cases.
- `scripts/data-refresh/__tests__/run-promote-golden-snapshots-tests.mjs` (new) — 7 cases.

### Why the fallback refusal exists

`chapterDefinitionForPacket` silently reverted to the short built-in lens string when the packet
carried no lens contract for a page, and nothing recorded that it had happened. Every contract test
still passed, because those tests read the contract file rather than the prompt that was actually
built. A whole run could therefore be written on the old lenses and look clean. Divergence scored
under that condition would measure the wrong prompt, so the run now refuses instead of reporting a
number nobody can act on.

## QA / Validation

- PASS `npx jest scripts/data-build/__tests__/home-lens-quality.test.ts` — 10/10
- PASS `node scripts/data-refresh/__tests__/run-promote-golden-snapshots-tests.mjs` — 7/7
- PASS `npx jest src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx` — no regression
- PASS `npm run test:ecl-home-narrative-layer` — no regression
- PASS `npx eslint` on all five changed/added files
- PASS `tsc --noEmit -p tsconfig.json` (full project, clean). Note: the project-wide run needs
  `NODE_OPTIONS=--max-old-space-size=8192`, and it caught a `readonly`-to-mutable assignment that
  the Jest run had compiled without complaint — Jest green is not a type check.

### Gates observed failing

Both new gates ship with a planted failure, because a gate never seen failing is not a gate:

- **Divergence:** two chapters given the same prose under different lenses score cosine `1.0` and
  separation `<= 0` for every lens — the "eight hats, one voice" failure the config-level tests
  cannot see.
- **Promotion:** a narrative containing `adapter` / `projection` / `schema` is refused, and the
  refusal quotes the offending statement. `adapter` is deliberately chosen: it has no laundering
  rule in the renderer, so it is wording that would otherwise reach a reader untouched.

## Rollout Plan

Merge to main. No runtime rollout, no image build, no traffic change, no migration. The measurement
run is plan-only; `build-home-chapters.ts` still has no `:apply` path.

## Deployment Authority

- Repo-owned deploy workflow: not exercised
- Shared runtime mutators: none in this change
- Approved image digest: not applicable
- ACA runtime invariant: not affected
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: no — no product surface changes

## Rollback Plan

Revert the commit. The three new checks are additive; the two new files are unreferenced by any
runtime path, and the promotion refusal returns to its prior gate set on revert.

## Audit Evidence

- Test output for both new suites, including the two planted failures.
- The measurement JSON written by `--measure-quality`, once a run with credentials is performed.

## Known Gaps

- **The measurement has not been run.** These are the instruments; the three-variant table still
  needs a run with credentials. Defaults are deliberately unchanged until that table is reviewed.
- **Judgment-class `must_not_do` rules are not checked.** Seven rules (for example "treat expected
  value as realized value") need a judgment call, and the report lists them as explicitly unchecked
  rather than implying coverage the run does not have.
- **The inventory-opening check is a proxy**, not a proof: it tests the opening sentence for record
  counts and technology-entity density. The definition is stated in the report so the number is
  interpretable.
- **Term classes are hand-authored.** Two chapter pairs deliberately share a class because their
  hats are genuinely adjacent; low separation there is interpretable, not automatically a defect.
- The golden-snapshot refresh path now carries the gate, but no snapshot has been regenerated.
