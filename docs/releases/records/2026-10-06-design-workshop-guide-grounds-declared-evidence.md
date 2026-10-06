# 2026-10-06-design-workshop-guide-grounds-declared-evidence — The design workshop guide retrieves the evidence it carries forward

## Release ID

`2026-10-06-design-workshop-guide-grounds-declared-evidence`

## Status

`candidate`

## Plain-English Summary

A Move that declares what kind of work it is gets a matching list of evidence
families — the named buckets its discovery evidence is filed under. Each section
of a generated deliverable names the families it should be written from, and
those names are part of what the system searches the evidence corpus for when it
writes that section. Getting those names right is the whole reason a declared
archetype changes a deliverable at all: ask for a bucket the evidence is not
filed under and the answer comes back plausible and cites none of the client's
material.

Three deliverables are produced on the way out of the Discover phase. Two of
them named the declared archetype's families. The third — the guide that
prepares the design sessions — named none of them, so its searches asked for
generic buckets (a source register, evidence gaps, baseline metrics) while the
Move's approved evidence sat under the eleven buckets its declaration had asked
for. Two of that guide's sections exist specifically to carry accepted evidence
forward: one summarises the accepted findings, the other lists the specific
accepted evidence each design decision depends on. Both assert facts about the
client, and both were searching under the wrong names.

This declares those two sections as the landing sites for a declared archetype's
evidence families, which is the mechanism the other deliverables already use.

The guide had previously been recorded as grounding nothing *on purpose*,
alongside the charter, on the reasoning that it is a facilitation document. That
conflated two separate questions, and the two cases are opposites. The charter
authorises discovery before any of this evidence exists and its own sections
instruct the model not to assert discovery findings — so families it cannot use
would only widen its search, and it correctly stays ungrounded. The guide's
stated purpose is to prepare sessions *using accepted discovery evidence*. What
was right about "facilitation document" is that it should not carry a deck's
exhibits and tables, and that is unchanged: the archetype's exhibits and tables
are still withheld from it by name.

Two of the guide's other sections are deliberately left out. One plans session
logistics and one states what is still missing; neither enumerates accepted
evidence, and widening their searches by eleven families would pull material
those sections do not cite.

## Layer Impact

Release lane: `global-control-lane` — shared deliverable-composition behaviour
for all clients, not gated by a flag, reachable only through an explicit
archetype declaration.

- **Layer 4 — Products (Moves).** Deliverable brief composition only, for one
  deliverable type. Two sections of the design workshop guide gain the declared
  archetype's evidence families, which changes the per-section retrieval queries
  built for them. No other deliverable's grounding changes.
- No change to layers 1–3. No schema change, no read-model change, no adapter
  change, nothing written. Brief composition is a pure read-time projection.

## Client Applicability

- All clients: yes — but only reachable for a Move that declares an archetype
  with an artifact pack. An undeclared Move resolves no pack and is unaffected.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The behaviour is reached by declaration, not by a flag.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` — the
  design workshop guide declares `archetypeEvidenceSectionKeys` for its two
  carry-forward sections, with the reasoning for the two it excludes and for why
  the charter is the opposite case.
- `src/lib/deliverables/orchestrator/__tests__/archetype-evidence-landing.test.ts`
  — the guide joins the per-section landing cases; the two pinned verdicts that
  recorded it as deliberately ungrounded are rewritten with the distinction they
  were missing; five new cases pin the retriever reach, the preserved generic
  families, the excluded sections, the charter contrast, and the still-withheld
  exhibits.
- `src/lib/deliverables/orchestrator/__tests__/archetype-pack-governed-data-foundation.test.ts`
  — the measured landing list for the data-foundation pack drops the guide and
  keeps the charter; the asset-withholding list is unchanged.
- `docs/architecture/test-ci-coverage-census.json` — refreshed. See QA below:
  the delta is pre-existing drift on `main`, not this change's.

## QA / Validation

- PASS — `npx jest src/lib/deliverables/orchestrator/__tests__` (the CI-wired
  directory for this module): 55 suites, 821 tests.
- PASS — the five sibling suites elsewhere that name this deliverable type
  (reasoning-layer archetype reach, quality-bar wiring, the orchestrated
  deliverable map, phase deliverables, the phase workspace client): 5 suites,
  282 tests.
- PASS — mutation testing, 6 of 6 killed:
  1. drop the declaration entirely → 4 failures;
  2. declare only one of the two carry-forward sections → 2 failures;
  3. over-declare all four fact-asserting sections → 1 failure;
  4. stop feeding section families to the retrieval-query builder → 1 failure;
  5. declare a landing site on the charter as well → 4 failures;
  6. stop withholding the pack's exhibits from the guide → 2 failures.
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit`, exit 0.
- PASS — `npx eslint` on all three changed source files, exit 0.
- PASS — `npm run release:check -- --base origin/main --head HEAD`.
- Census honesty: regenerating the coverage census on an **unmodified**
  `origin/main` checkout produces the identical `testFiles` 2752→2753,
  `coveredTestFiles` 2588→2589, `pullRequestCoveredTestFiles` 2587→2588. This
  change adds no test file and contributes nothing to those counts; the refresh
  is carried only so the drift guard is satisfied. If a sibling release lands the
  same counts first, this hunk becomes a no-op.
- NOT RUN — live signed-in verification. This changes what a generated
  deliverable is told to retrieve, and the generated output can only be judged
  against the private data plane with the demo Move's evidence loaded and
  approved, which has not happened yet.

## Rollout Plan

Merge to `main`. No flag, no migration, no data build. It becomes active for a
declaring Move on the next repo-owned ACA deploy from `main`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none. This change performs no Azure operation.
- Approved image digest: not applicable at merge time; the next `main` deploy
  pins its own digest.
- ACA runtime invariant: unchanged by this release; to be proven by the deploy
  that carries it, not by this record.
- Worker image invariant: not applicable. No worker job changes.
- Feature/env flag update path: not applicable. No flag, no environment
  variable.
- Live signed-in proof required: yes, before this may be called live-proven —
  and it is downstream of the demo Move's evidence load and human approval.

## Rollback Plan

Revert the commit. The change is a declaration on one deliverable structure plus
its test coverage; reverting restores the previous composition exactly, because
nothing is persisted and no stored record carries the declaration. Deliverables
already generated are unaffected — they hold their generated content, not a
reference to this declaration.

## Audit Evidence

- The PR and its CI run.
- The per-section landing cases and the five retriever-reach cases in
  `archetype-evidence-landing.test.ts`, which measure the served brief and the
  queries built from it rather than restating the declaration.
- The measured landing list in the data-foundation pack suite, which records the
  before and after per deliverable.
- The mutation results listed above.

## Known Gaps

- **The generated output is not yet verified.** This fixes what the guide is
  told to search for. Whether the resulting guide actually cites the right
  evidence can only be judged once the demo Move's discovery evidence is loaded
  and approved, which is a data-lane step and a human approval, not code.
- **The charter stays ungrounded, by decision.** If a later product call wants
  the charter to carry an archetype's families, it is a one-line declaration —
  but the charter's own section instructions currently forbid asserting
  discovery findings, so the two would have to change together.
- **The archetype's own per-phase declaration is still inert.** Each archetype
  declares, per phase, the evidence it requires, the deliverables it produces and
  the criteria for leaving that phase. Nothing in the product reads any of it;
  the phase-to-deliverable mapping and the phase gates are both held elsewhere as
  their own lists. Reconciling them would add gate criteria to live Moves, so it
  is a product decision rather than a wiring gap and is deliberately not shipped
  here.
- **Two sections of the guide are excluded on judgment.** The session plan and
  the design-exit readiness section do not enumerate accepted evidence today. If
  a reviewer reads them as evidence-asserting, adding them is a two-key change
  and the excluded-sections case states the current reading.
