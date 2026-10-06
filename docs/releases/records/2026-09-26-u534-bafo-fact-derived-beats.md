# 2026-09-26-u534-bafo-fact-derived-beats — Derive one stage's checklist and gate from the event

## Release ID

`2026-09-26-u534-bafo-fact-derived-beats`

## Status

`candidate`

## Plain-English Summary

On a Source event stage, the value numbers are computed from that event's own
recorded facts. The task checklist and the approval gate were not. They were
copied, word for word, from a worked example that ships with the product — on all
ten stages. The previous release measured that and made the copied parts say they
were copied. It deliberately did not reduce any of them.

This release reduces one. On the **best-and-final (BAFO) stage**, the checklist and
the gate are now built from the event:

- **The checklist is one row per value lever the event's archetype declares.** A
  lever the engine could quantify becomes "press this ask", carrying its computed
  range, the basis of the calculation and the document the figure was read from. A
  lever the engine could *not* quantify becomes "provide the missing evidence",
  naming the exact facts that are missing rather than a generic evidence list. Add
  the facts for another lever and the checklist changes shape.
- **The gate's confirm boxes state the real split** — how many levers went in with
  a computed ask and how many are still unevidenced, each naming the levers. Those
  counts move with the facts.
- **The approver is a role the archetype declares, not a person.** The example
  carried a named individual who exists only in the example file, and that name was
  being handed to the AI assistant as this event's approver. It is gone from this
  stage.
- **What generates on approval is the archetype's own deliverable for this stage**,
  which differs per archetype, instead of the example's fixed entry.

The other nine stages are unchanged and still declare that their checklist and gate
are example copy, so the AI assistant still receives that warning for them — and no
longer receives it for BAFO, because it would now be false.

**One finding changed the shape of this release.** A first pass recorded the new
gate's approver and its generates-list as "computed from the event's facts". They
are not: they come from the event's archetype, and they provably do not move when
the facts move. The measurement now distinguishes the two, because "derived from the
archetype" is a weaker claim about a specific event than "computed from its facts"
and recording them as the same thing would have been the exact over-claim this line
of work exists to remove.

## Layer Impact

Release lane: `global-control-lane`. Shared app behaviour for all clients, not
feature-gated. No client-scoped schema, seed, RLS or private data-plane change, so
this is not `client-data-lane`.

- **Layer 4 · Products (Source, and the agent surface that reads Source).** One
  stage's two intake beats are now composed from the event instead of copied. The
  per-beat provenance declaration flips for that stage and the grounding
  disclosure follows it.
- **Layer 3 · Canonical model — not touched.** No table, no read model, no
  migration. Nothing is read differently and no fact is recomputed. The value
  waterfall, the intel beat and every monetary figure are byte-identical: the new
  code reads the evaluator results that were already computed and reshapes them
  into a checklist. It computes no new number and changes no existing one.
- **Layers 1–2 · intake and adapters — not touched.**

## Client Applicability

All clients, on the new revision, with no flag. The change is visible only on an
event whose facts are rich enough for the live stage view to build at all (at least
one value lever computed), which is the same precondition that existed before; a
thinner event still falls back to the honestly-marked example view exactly as it
did. No tenant is named, no tenant-specific behaviour is added, and no tenant data
is read, written or migrated.

## Changes Included

- `src/lib/source/facts/view/bafo-fact-beats.ts` — **new.** Derives the BAFO
  checklist and gate from the evaluator's per-lever results, the caller's
  citations and the resolved archetype's declarations. It reads nothing from the
  example module. It derives and does not declare: the builder stays the only
  thing that decides a view's provenance.
- `src/lib/source/facts/view/stage-analytics-builder.ts` — one switch
  (`factBeats`) selects the derived beats for that stage, and the per-beat
  provenance is computed **from that same value** rather than from a second
  opinion about the stage key, so the label cannot drift from what the function
  returned.
- `src/components/source/canvas/analytics/view-model.ts` — the `fact_derived`
  docstring is widened to say what it now covers (derived for this event: from its
  facts, from its resolved archetype, or both), and to record why the union was
  **not** widened to a third member: a third member would make archetype-declared
  content disclose itself to the model as content "carried verbatim from the stage
  exemplar", which is false.
- `src/lib/source/facts/__tests__/u534-bafo-fact-derived-beats.test.ts` — **new**,
  42 cases.
- `src/lib/source/facts/__tests__/u533-stage-scaffold-provenance.test.ts` — the
  previous release's measurement, extended with two more readings and four new
  cases; five of its cases were the known positives this change was supposed to
  turn red, and they were updated rather than relaxed. See QA below.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.u533ScaffoldProvenance.test.tsx`
  — the render-path known positive, re-pointed by search and extended.
- `docs/architecture/u533-stage-scaffold-provenance.json` — regenerated in the same
  change, so the before/after is one committed diff.

## QA / Validation

Everything below is an in-process function call or a component render. No database,
no network, no authentication, no route. **No signed-in run was performed and none
is claimed.**

### Baseline, same scope, clean worktree at `7186eec31`

| scope | before | after |
|---|---|---|
| the three suites this change touches | 3 suites / 50 tests / **0 failing** | 4 suites / 99 tests / **0 failing** |
| the new suite, final file, against the pre-change source | 42 tests / **13 failing** | 42 tests / **0 failing** |
| every suite that imports the builder, the view model or the grounding builder (11 suites) | — | 209 tests / **0 failing** |

The 13 failures were measured by restoring the two source files to `HEAD` with the
final test file in place, so they are a reading of the same assertions against the
old behaviour rather than an earlier draft's numbers.

### The five known positives the previous release planted, and what happened to them

| case | went red | resolution |
|---|---|---|
| `bafo declares both intake beats as scaffold` | yes | **split**, not relaxed: `it.each` over the nine that still carry, plus a case over the one that does not. Both sets are read **off the builder**, so flipping the next stage moves the cases instead of breaking them. |
| `names the exemplar the view was actually built from` | yes | the stage is now **searched** for (first stage that still carries) instead of the literal `"bafo"`, and the exemplar is asserted by object identity rather than by name. |
| `records exactly the five fields that are carried on every armed stage` | yes | updated to nine carried / one derived, and to the corrected derivation split. |
| `matches the committed artifact field for field` | yes | the artifact is regenerated in this same change. |
| render: `renders the carried task titles but not the carried approver` | yes | the stage is now searched for among those that still carry a person-named approver (three of the four remain), and a new case asserts the flipped stage renders its **derived** titles and **none** of the example's. |

### The reading that caught an over-claim

The previous measurement took two readings per field: does it agree with the
example, and does it follow the caller. Those two cannot tell a derived value from a
hand-typed one — the item's own acceptance says so ("a hand-written alternative to a
fixture is still a fixture"). Two readings were added:

- **does it move when the facts move** — rebuild the same stage from a fact bag that
  quantifies one more lever;
- **does it move when the archetype moves** — rebuild it against a different
  rule-bearing archetype with that archetype's own facts.

Result, on the flipped stage: `tasks` and `gate.confirms` move with the facts;
`gate.approver` and `gate.generates` do **not** move with the facts and **do** move
with the archetype. The first pass had recorded all four as fact-derived. The
artifact now records `archetype_derived` for the two, and a third verdict —
`derived_from_neither` — exists for a field that differs from the example while
following nothing. A case asserts that set is empty; the mutation table below proves
that case is not decorative.

The fixture fact keys in both suites are read off `rule.computation.inputs` rather
than typed. Typing them was the first draft and produced keys belonging to no rule
in the registry, so a "richer" fact bag quantified nothing extra and a movement case
failed for a reason unrelated to the code under test.

### Mutation proof — eight deliberate breakages, all caught

| # | mutation | failures |
|---|---|---|
| 1 | per-beat provenance ignores the derived flag (always reports carried) | 11 |
| 2 | the checklist half reverted to the example's array | 9 |
| 3 | the approver returns the example's person-named literal | 6 |
| 4 | the confirm boxes become a fixed, non-moving array with plausible counts | 5 |
| 5 | generates-on-approval returns the example's entry | 4 |
| 6 | evidence rows drop the missing fact keys for a generic phrase | 1 |
| 7 | the stage condition inverted — derive the nine, carry the one | 47 |
| 8 | the checklist replaced by a **hand-written** list (a fixture swapped for a fixture) | 9 |

Mutation 8 is the one worth reading. It passes every assertion about differing from
the example and fails on the `derived_from_neither` guard, which records `tasks`
under that verdict — so the guard against swapping one fixture for another fires on
the real shape of that mistake rather than on a contrived one.

Each mutation was confirmed to change behaviour before its failure count was
recorded (a no-op mutation reads exactly like a caught one), and the tree was
restored to green after each.

### Other gates

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit
  0**, no diagnostics. Judged by exit code: a bare `npx tsc --noEmit` exits 134 on
  this host with no output, which reads as a false clean through a grep.
- `npx eslint` over all six changed files — exit 0, no findings.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds the
digest-pinned image and shifts Product/Lab web traffic; no manual Azure command, no
flag, no migration, no data build. Active for all clients on the new revision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge to
  `main`. No other path is used and none is needed.
- Shared runtime mutators: none. This PR runs no `az` command and changes no
  Container App template, env var, flag, secret or scale setting.
- Approved image digest: produced by the deploy workflow for the merge SHA;
  recorded in the claim register and the pulse entry after the run completes.
- ACA runtime invariant: to be proved read-only after the deploy — Container App
  template image digest == 100%-traffic revision image digest, and both worker job
  images on the same digest. Not claimed until read from Azure.
- Worker image invariant: unchanged by this release; verified as part of the
  invariant check above.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no, and this is a decision rather than an
  omission.** The item's acceptance says no signed-in claim may be made unless a
  signed-in run is actually performed; none was, so none is. The rendered change is
  proved by driving the real builder through the real canvas shell in a component
  render, which is a render and not an acceptance. The stage whose gate changed is
  rendered by a component no route mounts, which the previous release measured — so
  the gate half reaches the model's prompt and no reader, and signing in would not
  observe it.

## Rollback Plan

`git revert` the squash commit and let the same deploy workflow ship the revert.
There is no migration, no persisted state and no flag, so the revert is complete in
one step. Reverting restores the previous behaviour exactly: that stage's checklist
and gate go back to example copy and the disclosure returns for it. Nothing
persisted has been written in the derived shape, so there is no data to unwind.

## Audit Evidence

- PR URL and its CI run (recorded on merge).
- `docs/architecture/u533-stage-scaffold-provenance.json` — the measurement, and
  regenerable on demand:
  `ABARVA_UPDATE_U533_PROVENANCE=1 npx jest --runTestsByPath src/lib/source/facts/__tests__/u533-stage-scaffold-provenance.test.ts`.
  The suite fails when the committed artifact and the live measurement disagree, so
  the artifact cannot silently go stale.
- The baseline, known-positive and mutation tables above, measured in a dedicated
  worktree from `7186eec31`.
- ACA deploy run for the merge SHA and the digest read-back (recorded after the run
  completes).

## Known Gaps

- **Nine of ten stages still carry their checklist and gate.** The item's acceptance
  is explicitly one stage — "do not widen to all ten" — so this is the scope, not a
  shortfall. The remaining nine are the next slice and the artifact names them.
- **`purpose` is still example copy on the flipped stage**, and the per-beat
  declaration does not say so: it covers the two intake beats only, and reports
  `scaffoldSource: null` once neither is carried. That is the field's documented
  contract, and the per-field record in the architecture artifact is where the
  remaining carriage stays visible. A case pins it so the gap is deliberate rather
  than discovered later.
- **No archetype declares a gate criterion, a deliverable or a stage-model row for
  the `value` stage.** That is why the value stage — the obvious first pick, since
  the value waterfall is already live there — was not chosen: its derived gate would
  have had an empty generates-list. A case asserts this is still true, so if an
  archetype ever authors that stage the next agent is told.
- **The gate half of this change reaches no reader today.** The only component that
  renders a gate approver is mounted by no route. The checklist half reaches both
  the rendered canvas and the model's prompt; the gate half reaches the prompt only.
  That asymmetry is the previous release's measurement and is unchanged here.
- No signed-in run was performed and none is claimed. See Deployment Authority.
