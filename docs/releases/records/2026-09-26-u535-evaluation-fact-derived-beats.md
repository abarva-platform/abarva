# 2026-09-26-u535-evaluation-fact-derived-beats — Derive the Evaluation stage's checklist and gate from the event

## Release ID

`2026-09-26-u535-evaluation-fact-derived-beats`

## Status

`candidate`

## Plain-English Summary

On a Source event stage, the value numbers are computed from that event's own
recorded facts. The task checklist and the approval gate were not — they were
copied word for word from a worked example that ships with the product. An earlier
release measured that on all ten stages and made the copied parts say they were
copied. The release before this one reduced one stage. This release reduces a
second: **Evaluation**.

- **The checklist now opens with the scoring model itself** — the weighted criteria
  the event's archetype ranks bids on, each with its weight, and the auto-fail
  conditions declared for that event type. The example's Evaluation checklist was a
  single "upload the vendor bids" row with nothing saying what the bids would be
  scored against.
- **Then one row per value lever.** A lever the engine could quantify becomes a
  scoring input, carrying its computed range, the basis of the calculation and the
  document the figure was read from, with the archetype's own statement of how that
  lever moves the score. A lever the engine could *not* quantify becomes "provide
  the evidence", naming the exact facts that are missing. Add facts for another
  lever and the checklist changes shape.
- **The gate's confirm boxes state the real split** — how many levers went in with a
  computed score input and how many are still unevidenced, each naming the levers —
  alongside the criteria the ranking is actually performed on. Those counts move
  with the facts.
- **The approver is a role the archetype declares, not a person.** The example
  carried a named individual who exists only in the example file, and that name was
  being handed to the AI assistant as this event's approver. It is gone from this
  stage — leaving two stages that still expose one, down from four.

The other eight stages are unchanged and still declare that their checklist and gate
are example copy, so the AI assistant still receives that warning for them.

**Two findings changed the shape of this release, and both are corrections to the
work item rather than to the code.**

**One — the item asked for two things that cannot both be had.** It asks for a stage
that still exposes a person-named approver *and* for a stage where the archetype
declares a deliverable, so that what-generates-on-approval is not empty. Measured
over the three archetypes that can reach this code at all, the best-and-final stage
is the **only** one of the ten where every archetype declares a deliverable, and the
previous release already took it. Six stages — including all three that still expose
a person's name — declare none on any archetype. So no remaining stage satisfies the
second ask, the choice cannot escape it by picking differently, and this release
follows the first ask, which the item itself calls the highest-value half.

**Two — the reason the item gave for the second ask is not true today.** It warns
that an empty generates-list is "a visible regression". No reader can reach that
section: the only component that draws it is mounted by no route. On the path that
*is* reachable — the AI assistant's prompt — the empty list was already suppressed
before this change. Two test cases written against the page failed for exactly that
reason, which is how the premise got checked instead of inherited. The renderer was
corrected anyway, and is covered by mounting that component directly in a suite that
says in its own header that it proves a property of a component and not of a page.

## Layer Impact

Release lane: `global-control-lane`. Shared app behaviour for all clients, not
feature-gated. No client-scoped schema, seed, RLS or private data-plane change, so
this is not `client-data-lane`.

- **Layer 4 · Products (Source, and the agent surface that reads Source).** One more
  stage's two intake beats are composed from the event instead of copied. The
  per-beat provenance declaration flips for that stage and the grounding disclosure
  follows it.
- **Layer 3 · Canonical model — not touched.** No table, no read model, no
  migration. Nothing is read differently and no fact is recomputed. The value
  waterfall, the intel beat and every monetary figure are byte-identical: the new
  code reads evaluator results that were already computed and reshapes them into a
  checklist. It computes no new number and changes no existing one.
- **Layers 1–2 · intake and adapters — not touched.**

## Client Applicability

All clients, on the new revision, with no flag. Visible only on an event whose facts
are rich enough for the live stage view to build at all (at least one value lever
computed) — the same precondition that existed before; a thinner event still falls
back to the honestly-marked example view. No tenant is named, no tenant-specific
behaviour is added, and no tenant data is read, written or migrated.

## Changes Included

- `src/lib/source/facts/view/evaluation-fact-beats.ts` — **new.** Derives the
  Evaluation checklist and gate from the evaluator's per-lever results, the caller's
  citations and the resolved archetype's declarations (each lever rule's scoring
  hook, the weighted evaluation model, the declared stakeholders). It reads nothing
  from the example module. It derives and does not declare: the builder stays the
  only thing that decides a view's provenance.
- `src/lib/source/facts/view/stage-analytics-builder.ts` — the single `factBeats`
  switch becomes a two-entry lookup. A second ternary would have started the same
  growth into a per-stage chain that the ten-arm scaffold switch below it already
  is, and that switch needs a second table beside it to stay checkable.
- `src/components/source/canvas/analytics/ScopeGate.tsx` — the "Prepared for
  approval" section states that no deliverable is declared, instead of drawing an
  empty dashed box and then promising in its footer that "these are prepared
  automatically after the approval decision" with nothing above it to refer to.
  **This component is mounted by no route; see Known Gaps.**
- `src/lib/source/facts/__tests__/u535-evaluation-fact-derived-beats.test.ts` —
  **new**, 47 cases.
- `src/components/source/canvas/analytics/__tests__/ScopeGate.u535EmptyGenerates.test.tsx`
  — **new**, 4 cases, mounting the gate component directly and stating its reach.
- `src/lib/source/facts/__tests__/u533-stage-scaffold-provenance.test.ts` — the
  measurement, with a verdict split; see QA.
- `src/lib/source/facts/__tests__/u534-bafo-fact-derived-beats.test.ts` — its
  still-carrying set is now read off the builder rather than computed as "every
  stage but mine"; see QA.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.u533ScaffoldProvenance.test.tsx`
  — the render-path known positive, generalised to every flipped stage, plus a
  negative recording that the gate's deliverables reach this reader on neither
  branch.
- `docs/architecture/u533-stage-scaffold-provenance.json` — regenerated in the same
  change, so the before/after is one committed diff.

## QA / Validation

Everything below is an in-process function call or a component render. No database,
no network, no authentication, no route. **No signed-in run was performed and none
is claimed.**

### Baseline, same scope, clean worktree at `5d80f12d3`

The baseline was taken in a **separate checkout of `origin/main`**, not by stashing:
a stash shares the working tree it was taken from, and the point of the number is
that it was produced by code this branch has not touched.

| scope | before (clean `5d80f12d3`) | after |
|---|---|---|
| `src/lib/source/facts` + `src/components/source/canvas/analytics` + `src/lib/source/ava` | 77 suites / 947 tests / **0 failing** | 79 suites / 1003 tests / **0 failing** |
| the new stage suite, final file, against the pre-change source | 48 cases / **19 failing** | 47 cases / **0 failing** |

The case count moves from 48 to 47 **by design, not by deletion**: two of the
suite's blocks are `it.each` over sets read off the builder — the stages that still
carry — and that set loses a member when a stage flips. A constant list would have
had to be edited in lockstep, and the failure mode of forgetting is a case that
passes about a stage it no longer describes.

### The known positives this change was supposed to turn red

Nine cases across three existing suites went red. None was deleted or relaxed.

| suite | cases red | resolution |
|---|---|---|
| `u534-bafo-fact-derived-beats` | 4 | its still-carrying set was `ARMED_STAGE_KEYS.filter(k => k !== DERIVED_STAGE)` — a set defined by that suite's own subject, which silently asserted every other stage was example copy. Now read off `beatProvenance`. Its count case gained a second assertion (the set must exclude that suite's own stage), because a count alone would not have caught a builder that stopped deriving BAFO. |
| `u533-stage-scaffold-provenance` | 5 | counts updated 9/1 → 8/2; the two cases that read `DERIVED_STAGE_KEYS[0]` became `it.each` over the set; the per-stage generates verdict became a **rule read from the registry** rather than a typed constant; artifact regenerated. |
| `SourceAnalyticsCanvas.u533ScaffoldProvenance` | 1 (of the 9) | "exactly one flipped stage" → two, and the derived-content case became `it.each` rendering under each stage's own name instead of a hard-coded label. |

### The verdict split, which is the finding worth reading

The measurement classifies each field by two readings — does it agree with the
example, and does it move when the facts or the archetype move. A field that
disagrees with the example and follows **neither** is recorded as
`derived_from_neither`, the shape a hand-written replacement for a fixture takes,
and a case asserts that set is empty. That is the guard against swapping one fixture
for another.

Evaluation derives what-generates-on-approval to an **empty** list, because no
archetype declares a deliverable there. Empty disagrees with the example and follows
neither reading, so it landed under that verdict and **tripped the guard**.

An empty derivation and a hand-written fixture are not the same provenance: the
first is the faithful reading of an archetype that declares nothing, the second is
content a person typed. Conflating them left two bad options — weaken the guard, or
backfill the example's deliverable to keep the list non-empty. Instead the verdict
was split. `derived_empty` fires only on a value carrying no content at all;
everything non-empty still earns `derived_from_neither`, so the guard is unchanged
for every case it previously caught. Deliberately **not** implemented as
"falsy": `0` and `false` are content, and a field legitimately derived to zero must
not be excused by an accident of JavaScript truthiness.

Asserting the guard's list is still empty does **not** show the split is safe — that
list reads the same whether the guard works or has been defeated. So a new case
drives the predicate directly over a value of each shape and drives the verdict end
to end, and mutations 8 and 9 below are the proof it is not decorative.

### Mutation proof — eleven deliberate breakages, all caught

| # | mutation | failures |
|---|---|---|
| 1 | the approver reverts to the example's person-named literal | 3 |
| 2 | generates backfills the example's deliverable when the archetype declares none | 9 |
| 3 | the scored-lever guide uses the negotiation ask instead of the scoring hook | 1 |
| 4 | the scored / needs-evidence split ignores `insufficientEvidence` | 3 |
| 5 | the builder drops the new stage arm (the stage reverts to carrying) | 26 |
| 6 | the builder derives the stage but declares it example copy | 12 |
| 7 | the gate's confirm counts become written literals with plausible values | 1 |
| 8 | `derived_empty` widened to swallow **any** value — the fixture guard defeated | 1 |
| 9 | the empty test becomes falsiness, so a derived `0` escapes the fixture guard | 1 |
| 10 | the renderer draws the empty box again | 1 |
| 11 | the renderer suppresses the deliverables list on **both** branches | 1 |

Mutations 8 and 9 are the ones the split exists for, and each is caught by exactly
one case — the case added for it. That is the measurement, not a complaint: before
that case, mutation 8 left the whole suite green, which is what "the guard's own
assertion cannot detect the guard being defeated" means in practice.

Each mutation was applied through a harness that **asserts the file actually
changed** before running, because a no-op mutation is indistinguishable from a
survivor. The tree was restored to green after each.

### Other gates

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
  `tsconfig.tsbuildinfo` removed first — **exit 0**, no diagnostics, judged by exit
  code. A bare `npx tsc --noEmit` exits 134 on this host with no output, which reads
  as a false clean through a grep.
- `npx eslint` over all eight changed files — exit 0, no findings.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds the
digest-pinned image and shifts Product/Lab web traffic; no manual Azure command, no
flag, no migration, no data build. Active for all clients on the new revision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge to
  `main`. No other path is used and none is needed.
- Shared runtime mutators: none. This PR runs no `az` command and changes no
  Container App template, env var, flag, secret or scale setting.
- Approved image digest: produced by the deploy workflow for the merge SHA; recorded
  in the claim register and the pulse entry after the run completes.

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
  the artifact cannot silently go stale. Its diff for this release is the
  before/after: carried stages 9 → 8, derived 1 → 2, and the flipped stage leaving
  the list of views that still hand a person's name downstream.
- The baseline, known-positive and mutation tables above, measured in a dedicated
  worktree from `5d80f12d3` with the baseline read from a separate clean checkout of
  the same commit.
- ACA deploy run for the merge SHA and the digest read-back (recorded after the run
  completes).

## Known Gaps

- **Eight of ten stages still carry their checklist and gate.** The item's
  acceptance is explicitly one or two stages — "not all nine" — so this is the
  scope, not a shortfall. The artifact names the remaining eight.
- **`purpose` is still example copy on this stage**, as on every other. The per-beat
  declaration covers the two intake beats only; the per-field record in the
  architecture artifact is where the remaining carriage stays visible. A case pins
  it so the gap is deliberate.
- **The gate half of this change reaches no reader today, and the renderer fix sits
  in a component no route mounts.** The checklist half reaches both the rendered
  canvas and the model's prompt; the gate half reaches the prompt only. This was
  recorded by the previous release and verified independently here rather than
  inherited. The renderer correction is therefore **not** claimed as a user-visible
  fix; it is there so the empty box does not ship the day that component is mounted.
  Mount-or-delete for unreachable Source components is an existing open item and is
  where that gap belongs.
- **What-generates-on-approval is empty on this stage, and that is the honest
  answer**, not a missing feature. Whether these stages should have declared
  deliverables at all is an archetype-authoring question, not a rendering one, and
  it is not decided here.
- No signed-in run was performed and none is claimed. See Deployment Authority.
