# U-583 — A refusal that lists required evidence states what chose the requirement

## Release ID

`2026-10-07-evidence-framework-provenance-in-refusals`

## Status

`candidate`

## Plain-English Summary

Two controls on the Moves phase path hold a Move open by listing the evidence it is still waiting
for: submitting a phase gate, and asking the phase to build its documents. Both get that list from
one place. A readiness read resolves a discovery framework for the Move, the framework declares a
set of evidence families, and the families that are not yet covered become the named slots the
refusal reports.

The readiness read already records **what chose that framework**. It can be one of four things: a
declaration named it; the use-case argument was itself a framework name; keyword matching on the
Move's own text picked it; or nothing matched and the general-case framework applied. The read also
records a fifth, separate fact — that a declaration **was** supplied, named nothing in the catalog,
and was therefore discarded in favour of a different framework.

Both facts stopped at the step that turns families into slots, which reads only the family list. So
a refusal measured against a framework **nobody chose** called its slots "Required evidence" in
exactly the words it uses for a framework that was formally declared. An operator reading the screen
could not tell the two cases apart, and the one action that would resolve the mismatch — declaring
the Move's framework — was named nowhere, because nothing on the screen suggested the framework was
in question.

That is not a cosmetic gap. The slots a wrongly-resolved framework produces are real family names
from a real framework; they are simply the wrong framework's families. A Move can therefore be held
open by a long list of evidence that is genuinely missing and genuinely irrelevant, and the refusal
asserts it as the Move's requirement.

This release does **not** relax either control. The gate still refuses, the phase still does not
advance, no build is queued, and the slot list and its counts are unchanged byte for byte. What
changes is the claim about where the list came from:

- When a declaration chose the framework, the message is **unchanged** — the existing sentence was
  already true.
- Otherwise the refusal gains one sentence saying the slots are not a declared requirement, naming
  the framework that produced them and how it was chosen, and naming the discarded declaration when
  there was one.
- Both responses also carry the verdict as structured data, so a future surface can render it
  without re-deriving it.

The sentence reaches the screen through the refusal reader both phase surfaces already mount, which
renders the route's own `detail` as the lead. No new UI was added.

## Layer Impact

- `global-control-lane`: the Moves phase-gate submission route and the phase-build route. Shared
  behaviour for every client; no feature flag, no tenant list, no schema change.
- No change to layer 1 (client intake), layer 2 (source adapters) or layer 3 (the canonical model).
  No read model, metric, or fact value is touched; the refusal's own counts and slot names are
  preserved exactly.

## Client Applicability

- All clients: yes — the refusal wording and the new structured field apply wherever these two
  routes refuse.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is additive and the declared-framework case is byte-for-byte
  identical to today, so there is nothing to stage behind a flag.

## Changes Included

- New module `src/lib/programs/evidence-framework-provenance.ts`:
  `resolveEvidenceFrameworkProvenance` turns the two facts the readiness pack already records into a
  verdict (`declared`, `origin`, `basis`, `archetypeLabel`, `discardedDeclaration`, `statement`),
  and `appendEvidenceFrameworkProvenance` returns a route's own `detail` unchanged when the framework
  was declared or when no provenance could be resolved.
- `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts`: the readiness helper now also
  returns the provenance; the readiness read reports it under `transitionReadiness`, and the
  `transition_evidence_incomplete` refusal carries it and appends the sentence when the framework was
  not declared.
- `src/app/api/v1/deliverables/generate-phase/route.ts`: the same for the `required_evidence_open`
  refusal.
- New suite `src/lib/programs/__tests__/evidence-framework-provenance.test.ts` (21 cases).
- Host cases added to both existing route suites (5 and 2 cases).
- `docs/architecture/test-ci-coverage-census.json` regenerated.

No migration, no dataset, no seed, no workflow, no image, no flag registry entry.

## QA / Validation

- PASS `npx jest --runTestsByPath` over the new suite and both route suites — 3 suites, 87 tests.
- PASS mutation sweep, **12 mutations, 12 killed**, covering: removing a member of the
  declared-basis set; reordering the discard check behind the basis check; making an unrecognised
  basis fall through as declared; appending the sentence unconditionally; dropping the
  absent-provenance guard; rendering a blank framework label; counting a blank declaration as a
  discard; reverting each route's `detail` to its unconditional literal; dropping each route's
  resolved provenance; and defaulting a provenance when the readiness read failed.
- PASS `npm run test:behaviors` — 202 suites, 2102 tests.
- PASS `npx jest src/lib/programs src/components/strategic-moves src/app/api/v1/programs
  src/app/api/v1/deliverables` — 430 suites, 6200 tests.
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- PASS `npx eslint` over all six changed/added files — 0 errors, 0 warnings.
- PASS census regenerated with `audit:test-ci-coverage:write` after merging the current base: 2830
  test files / 2665 covered, with uncovered flat at 165 — which is the proof the new suite is reached
  by a CI command rather than added as a dark file. The base's committed census reads 2829/2664, so
  no drift is outstanding and this branch's delta is exactly its own one new file. (The base has now
  moved twice while this branch was open; each time the census was regenerated over the new base
  rather than conflict-resolved, so what is committed is the true total. Earlier figures on this
  record, against bases since superseded: 2825/2661 → 2826/2662, and 2828/2664 → 2829/2665.)
- PASS `audit:tenancy-fence-coverage:write` — no change to the fence census.
- NOT RUN: any signed-in walk. The new sentence is reached only by a refusal on a signed-in Move
  against the private data plane, which this lane cannot and must not drive.

## Rollout Plan

Merge to `main` by squash. The change is served by the next repo-owned ACA main deploy; it needs no
migration, no flag, and no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Nothing here deploys.
- Shared runtime mutators: none. No `az` command, no revision weight, no Container App template
  change.
- Approved image digest: not applicable — this release introduces no runtime image change of its
  own.
- ACA runtime invariant: unchanged; to be proven by the main deploy that carries this commit.
- Worker image invariant: unchanged. The queue worker is not touched.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof required: yes, for the rendered sentence. Owed and not claimed here.

## Rollback Plan

Revert the squash commit. The three code files are additive at every edit: the new module has no
other caller, and each route edit is a single expression that falls back to the prior literal. No
data was written, no schema changed, so a revert is complete and immediate. The regenerated census
would need one regeneration after the revert.

## Audit Evidence

- The PR and its CI run.
- The mutation sweep table above: 12 mutations, 12 killed, with each mutation naming the behaviour
  it removed.
- The census delta with uncovered held flat, as the wiring proof for the new suite.
- The declared-framework assertions in both route suites, which pin that today's wording is
  preserved exactly when the existing sentence is true.

## Known Gaps

1. **No surface renders the structured verdict.** Both responses now carry it, and the appended
   sentence reaches the screen through the refusal reader the two phase surfaces already mount, but
   nothing renders `origin`, `basis` or `discardedDeclaration` as a field. A dedicated panel for the
   several diagnostic signals that now flow and render nowhere is still owed and is tracked
   separately.
2. **Three other readers of the same readiness pack still drop both facts**: the stage-readiness
   workbook route, the stage-readiness evidence-pack route, and the workspace evidence-readiness
   route. They report coverage rather than refusing, so they assert less, but they present the same
   family list without saying what chose it.
3. **The upstream cause is not addressed here and is not a code gap.** A Move whose framework was
   never declared will still be graded against an inferred one; this release makes that visible
   rather than preventing it. The declaration itself is a data-lane step.
4. **The internal-consistency gap found while measuring this is untouched**: a framework's
   per-phase declared deliverable keys and its own deliverable specification keys are two id spaces
   that disagree for several frameworks, and one legacy read path silently substitutes the charter
   specification when a key resolves nothing. That path's only component host has no mount, so it
   was left alone rather than wired.
