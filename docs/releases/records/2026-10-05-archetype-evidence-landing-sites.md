# 2026-10-05-archetype-evidence-landing-sites — Where a declared archetype's evidence families land is now declared, not spelled

## Release ID

`2026-10-05-archetype-evidence-landing-sites`

## Status

`candidate`

## Plain-English Summary

A Move declares an archetype, and the archetype carries a short list of the evidence families that
use case normally needs — the baselines, inventories and operational records a senior consultant
would ask for. When the system composes a deliverable, it is supposed to push that list into the
sections of the document that assert client facts, so retrieval goes looking for the right
evidence and the model is told what it is expected to be grounded in.

It chose those sections by **the spelling of the section's key**. A section received the archetype's
evidence families only if its key contained `current_state`, `baseline`, `signal`, `findings` or
`environment`. That rule was written for the early diagnostic deliverables, whose sections happen to
be named that way, and was never revisited as the deliverable set grew.

Twenty-one deliverable structures ship today. **Eight of them have no section key matching that
rule at all**, so for those a perfectly well-declared archetype contributed nothing — the list was
computed and then landed nowhere, with no error, no warning and nothing in the brief to say so.
Four of the eight (solution design, operating model, sourcing strategy, readiness and change plan)
also declare no evidence families of their own on any section, so those four were going to the
model with **no declared evidence grounding whatsoever**. On the thirteen structures that do match,
the rule finds at most **one** section, while every structure has between two and seven sections
that the structure itself marks as asserting client facts.

This change stops guessing. A deliverable structure may now name the sections that carry the
archetype's evidence families, and five structures do. It is additive by construction: the spelling
rule still applies, so no structure loses a landing site it had.

The deeper reason to fix it here rather than by widening the pattern is that the pattern is an
inference about identity from a name, which is the one thing the data operating model says never to
do. Widening it would move the boundary; it would not remove the guess. And it gets worse the
moment an archetype can be configured rather than coded: a configured archetype's evidence families
would reach a section only if somebody, years earlier, happened to spell that section's key one of
five ways.

## Layer Impact

**Release lane: `global-control-lane`.** Deliverable composition is shared app behaviour.

- **Layer 1 (client intake):** none.
- **Layer 2 (source adapters):** none.
- **Layer 3 (canonical model):** none. No schema, migration, read model or metric is touched. The
  evidence families named are the ones the archetype packs already declare.
- **Layer 4 (products):** Moves only, and only in what a generated deliverable's brief *asks for*.
  Five Moves deliverable types now carry the declared archetype's evidence families on two to three
  of their sections where they previously carried none. That changes the retrieval queries built
  for those sections and the "expected evidence" line the model is given. It changes no route, no
  component, no stored artifact and no existing generated output.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` — new optional
  `archetypeEvidenceSectionKeys` on `DeliverableStructure`, documented with the defect it exists to
  close. Declared on five Moves structures: `root_cause_worksheet`, `solution_design`,
  `operating_model`, `sourcing_strategy`, `readiness_and_change_plan`. Each declaration names only
  the sections that assert client facts — never the executive-decision, verdict or recommendation
  sections, which are judgment over the evidence and should not pull a use case's baselines.
- `src/lib/deliverables/orchestrator/artifact-brief-registry.ts` — `composeBrief` enriches a
  section when it is **declared** a landing site **or** matches the existing spelling rule. Seven
  lines, additive.
- `src/lib/deliverables/orchestrator/__tests__/archetype-evidence-landing.test.ts` — new suite, 14
  cases. Pins the landing sites per section rather than per structure, because a
  structure-wide "the families are in here somewhere" assertion is satisfied by whichever section
  the old rule happened to match.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.
- `docs/releases/records/2026-10-05-archetype-evidence-landing-sites.md` — this record.

## Client Applicability

- All clients: yes, for the five Moves deliverable types named above, whenever a Move declares an
  archetype the artifact-pack catalog recognises.
- Specific clients: none singled out. No tenant data, seed, registry or allowlist is touched.
- Internal only: no
- Public/demo only: no
- Feature flag: **none, by intent.** The change is additive — it adds families to sections that had
  none and removes nothing — and the shared flag registry is currently the base of several open
  changes in this area, so taking a seat in it would have put this change into an avoidable
  conflict with them for no behavioural benefit.

## QA / Validation

Lane: Moves CODE lane, local validation on an isolated worktree off `origin/main` at `e2d5096330`.

| check | command | result |
|---|---|---|
| new suite | `npx jest .../__tests__/archetype-evidence-landing.test.ts` | **PASS** — 14 of 14 |
| whole orchestrator suite directory | `npx jest src/lib/deliverables/orchestrator/__tests__` | **PASS** — 46 suites, 541 tests, 0 failing |
| typecheck | `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | **PASS** — exit `0` |
| lint | `npx eslint` on the three changed source files | **PASS** — exit `0` |
| CI wiring of the new suite | `npm run audit:test-ci-coverage:write` | **PASS** — `coveredTestFiles` 2550 → 2551, `uncoveredTestFiles` unchanged at 164 |
| signed-in walk | — | **NOT RUN** — see Known Gaps |

The exit code is what is judged on the typecheck: a bare run can exit `134` on an out-of-memory
crash and emit nothing, which reads as clean output.

The whole directory was run, not only the suites that looked related, because the change is in a
composition function that 46 suites in that directory reach.

Seven mutations, each applied with an assertion that the pattern matched exactly once, each
reverted immediately and the baseline re-run afterwards:

| mutation | result |
|---|---|
| `composeBrief` ignores the declaration (spelling rule only) | **5 failing** of 14 |
| `composeBrief` ignores the spelling rule (declaration only) | **1 failing** |
| `composeBrief` enriches every section (both conditions dropped) | **5 failing** |
| the "no pack resolved" guard removed | **1 failing** |
| one structure's whole declaration removed | **1 failing** |
| one declared key given a one-character typo | **2 failing** |
| one declared key named twice in the same declaration | **1 failing** |

Two of those seven first read as survivors and were not. The anchor text used to apply them
appeared more than once in the file, the assertion refused the edit, and the suite then ran against
the **unmutated** file and reported 14 passing. They were reapplied against the declaration block,
which is unique, and both killed. A mutation that reports a clean pass is a reason to check that it
applied at all.

## Rollout Plan

Merge to `main` with squash. No migration, no flag, no environment variable, no image change, no
data build. The change takes effect for deliverables generated after the merge commit is built and
deployed by the repo-owned deploy workflow, on its normal schedule.

## Deployment Authority

- Repo-owned deploy workflow: unchanged. `.github/workflows/aca-main-deploy.yml` is not touched.
- Shared runtime mutators: none. No `az containerapp` command, no traffic weight, no revision.
- Approved image digest: not applicable — no runtime update is performed by this change.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: none — no flag is declared or changed.
- Live signed-in proof required: not for merge. It **is** required before anyone claims the
  improved grounding is visible in a generated artifact; see Known Gaps.

## Rollback Plan

Revert the commit. There is no state to unwind — no migration, no stored artifact, no flag, no
registry entry, no generated data. Deliverables generated while it was live keep whatever they
were generated with; nothing re-reads the declaration after generation. A narrower rollback is
available without a revert: delete the `archetypeEvidenceSectionKeys` line from any single
structure and that structure returns to the previous behaviour on its own, because the spelling
rule is still in place underneath.

## Audit Evidence

- The PR for this record and its CI run.
- The seven mutation results above, each reproducible from the table.
- The census delta `2550 → 2551` with `uncoveredTestFiles` unchanged, which is what proves the new
  suite is actually run by a workflow rather than merely present on disk.
- The counts in the summary are reproducible from the shipped catalogs: 21 structures, 8 with no
  section key matching the spelling rule, at most 1 matching section on the other 13, and 2–7
  sections per structure that the structure itself marks as asserting client facts.

## Known Gaps

- **Three of the eight structures with no matching key were deliberately left alone**, and they are
  not oversights. Two of them are excluded from archetype exhibits and tables already because they
  are approval and facilitation instruments rather than analyses, and pulling a use case's
  baselines into them would be wrong. The third never reaches this composition path at all — it is
  routed to a purpose-built builder earlier. None of the three is given an empty declaration,
  because an empty declaration would change no behaviour and would therefore be a line no test can
  kill. The cost is that a reader cannot yet tell "no landing site by intent" from "no landing site
  by accident" for those three without reading the routing.
- **The spelling rule is still in the code.** It is what the other thirteen structures rely on, and
  removing it would mean declaring landing sites on all of them in one change. Those thirteen also
  still get at most one landing site each, which is almost certainly too few. Retiring the rule by
  declaring the remaining structures is the natural successor item, and it is a larger product
  judgement than this change.
- **Nothing reports a structure that has no landing site.** The new suite would catch a declared key
  that names no section, and it catches a key named twice, but a structure that declares nothing and
  matches nothing is still silent. A report of that state has no surface to render on today, so one
  was not added rather than adding a module that only its own test reaches.
- **An archetype pack's `keyEvidenceFamilies` are free strings** checked against no vocabulary. A
  typo in a pack produces a retrieval query for a family that does not exist and no signal. That is
  independent of this change and gets worse once packs are configurable; it is not fixed here.
- **No signed-in walk was performed.** This change alters what a generated deliverable's brief asks
  for, which is only observable by generating one. The suites prove the brief now carries the
  families on the named sections; they do not prove the retrieved evidence or the generated prose
  improved. Nobody should describe this as live-proven until a generation on a governed Move is
  walked and compared.
