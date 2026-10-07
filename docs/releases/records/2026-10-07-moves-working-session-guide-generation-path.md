# 2026-10-07-moves-working-session-guide-generation-path — four working guides were written as board papers

## Release ID

`2026-10-07-moves-working-session-guide-generation-path`

## Status

`candidate`

## Plain-English Summary

A Move phase builds two kinds of document. Most are decision artifacts: they
state a recommendation, carry a risk table, and ask a sponsor to approve
something. A few are working-session guides: they prepare the sessions where
those decisions get made, and they are explicitly not allowed to make the
decisions themselves.

The generation pipeline has a separate path for a working guide, and it is a
real path — it changes what the draft pass is asked to write, who the review
pass impersonates and what it looks for, what standard the rewrite pass holds
the draft to, what the render pass must preserve, how each individual section is
framed, what the next-actions list may contain, which exhibits and tables are
expected, and what the size and purpose rules say. Eleven decision points in
all.

Every one of those eleven asked the same question: is this document the design
guide? Five of the documents a phase can build are working guides, not one. The
other four took the decision-artifact path. They were drafted under an
instruction to "include the required decision tables, risk/issues/dependencies
table ... and a clear recommendation with next steps", reviewed by a pass told
to behave as a board-committee partner and to flag "unclear or missing
decisions" and anything "too short for a board-grade artifact", rewritten to
strengthen "the decision ask", and rendered with an instruction to preserve a
recommendation. Each of those four declares the opposite of that twice over: its
own quality bar switches the recommendation, decision-section and risk-table
requirements off, and its own profile says in writing that the guide "does not
make new sponsor, funding, design, or execution decisions".

The four affected documents are the guides for the design, planning,
mobilization and execution-kickoff sessions — one in each of the last four
phases, so a Move walked end to end hits this four times.

The pipeline already had the right signal. One pass — the executive-layer
assembly — reads the declaration rather than the document's name, and correctly
asks for "a concise description of what this working guide enables, not a
decision ask". The other eleven read a name. This change gives them the same
declaration to read.

Two things follow from making the path declaration-driven. The size-and-purpose
rules used to state the purpose as a hand-written sentence about design scope,
which is simply false for a mobilization or kickoff guide; each guide now states
its own declared purpose. And the acceptance checks each document declares for
itself — typed as "profile-specific acceptance checks, in addition to global
gates" — turned out to have no reader anywhere in production, while a required
CI check asserts every phase document declares some. They are now stated to the
pass that has to satisfy them. No gate, threshold or check was changed to
accommodate any of this; the bars are read, never written.

## Layer Impact

- **Layer 4 — Products (Moves).** Phase document generation only. Which prompt
  path a document takes, and the purpose rules stated inside the working-guide
  path.
- **Layer 3 — Canonical model.** Unchanged. No schema, no read model, no
  projection, no stored value, no gate rule, no criterion.
- **Layers 1–2 — Intake and adapters.** Unchanged.

Lane: `global-control-lane` — shared control-plane generation behaviour for all
clients, with no feature gate.

## Client Applicability

- All clients: yes — shared control-plane generation behaviour.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is inert for the sixteen decision artifacts and
  byte-identical for the one guide that already took the guide path, apart from
  the purpose lines described above.

## Changes Included

- `src/lib/deliverables/orchestrator/working-session-guide.ts` — new leaf
  module. Owns the predicate (read from the three declared requirement flags,
  not a list of document names) and the purpose rules each guide declares for
  itself. Its header records the defect, the measurement, and why the predicate
  reads flags rather than keys.
- `src/lib/deliverables/orchestrator/prompt-builder.ts` — the eleven call sites
  read the declaration; the one-document literal is deleted; three prose
  fragments that were specific to one guide are generalised or sourced from the
  guide's own profile.
- `src/lib/programs/__tests__/phase-deliverable-working-session-guide.test.ts` —
  new suite (13 cases), in a directory swept by a required check.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No migration. No route. No script. No workflow change. No flag.

## QA / Validation

- **PASS** — new suite, 13 cases. It splits every document any phase can
  request on any confirmed route into the two paths and asserts both sides by
  name rather than by count, so a new document has to land on a named side. It
  then drives the real production request builder for each of the three
  previously-misrouted later-phase guides and reads five passes' prompts back,
  asserting both what each must now say and what it must no longer say. Plus
  the predicate's three-flag conjunction and its module fence, the five-section
  fixed structure every guide is served, each guide's purpose being its own
  rather than one shared sentence, and the two negative cases — a decision
  artifact still on the decision path, and the design guide still on the path it
  already had.
- **PASS** — `npx jest src/lib/deliverables src/lib/programs src/lib/ai`: 467
  suites / 6,347 tests, 0 failures.
- **PASS** — mutation testing, 20 mutations / 20 killed. The defect itself is
  the first negative control: restoring the one-document literal fails 7 of 13
  cases. Then each of the twelve wiring points separately (eleven call sites and
  the purpose-rules insertion), the module fence, and each of the three
  requirement flags dropped from the conjunction. The three flag mutations are
  the reason the suite does not rely on the totality split alone: all sixteen
  decision artifacts set all three flags, so dropping any one conjunct leaves
  the split unchanged and would have read as a false survivor. A hand-built
  signal case discriminates them directly. Two further mutations cover the
  purpose source (a constant instead of the profile's declaration) and the
  acceptance-checks line.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit`, exit 0.
- **PASS** — `npx eslint` over the changed paths, exit 0.
- **PASS** — `npm run audit:test-ci-coverage:write`: uncovered flat, so the new
  suite is reached by CI rather than dark. See Known Gaps on the committed
  counts.
- **PASS** — `npm run audit:tenancy-fence-coverage:write`: no change.
- **NOT RUN** — live signed-in walk. This changes what a generation prompt says,
  so proving it end to end means generating one of the four guides on a Move
  that has reached its phase. That is held by a pending evidence load and an
  in-app human approval, neither of which is in this lane.
- **NOT RUN** — generated-output comparison. No before/after document pair was
  produced, for the same reason. The claim this record makes is about which
  instructions the writer receives, which the suite reads directly out of the
  prompts.

## Rollout Plan

Squash merge to `main`. The repo-owned ACA main deploy workflow builds and
deploys from the merge commit as usual. No migration to apply, no flag to enrol,
no env var to set, no worker job to run.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only
  path that may shift shared web traffic.
- Shared runtime mutators: none in this change. No ad-hoc Azure command, no
  revision weight change, no Container App template edit.
- Approved image digest: whatever digest the main deploy workflow produces for
  the merge commit; this record does not pin one.
- ACA runtime invariant: unchanged by this release — it carries no env, flag,
  scale, or secret update, so no `az containerapp update` is required.
- Worker image invariant: unchanged. No worker job image moves.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof required: not for this change to be correct (it is which
  prompt text is selected, read back by the suite), but see Known Gaps: it is
  not `live-proven` until one of the four guides is built on a real Move.

## Rollback Plan

Revert the squash commit. The new module has one importer, added in this change,
and reverting restores the previous reading — the four guides go back to the
decision-artifact prompt path. Nothing is persisted by this code, there is no
written state to unwind, no migration to roll back, and no flag to unset. A
revert restores the original misrouting; it does not leave anything in an
intermediate state.

## Audit Evidence

- The PR and its CI run (linked from the PR body).
- The new suite is the readable statement of the split and of the eleven
  wirings, and it names both sides of the split rather than counting them.
- The mutation log is summarised under QA above, with the defect's own negative
  control first and the false-survivor hazard recorded.
- The census regeneration is the proof the new suite is reached by CI.

## Known Gaps

- **Not live-proven.** None of the four guides has been generated with this
  change in place, because the Move on the critical path has not reached their
  phases. This record says `candidate`, not `released`.
- **The one guide with no declared structure.** One of the five working guides
  is served by its own builder rather than the shared structure catalog. It is
  on the correct path now and its served brief does declare five fixed
  sections, which the new suite asserts, but it reaches that brief by a
  different route than the other four and nothing in this change unifies them.
- **The prose still names "five required sections" as a word.** All five guides
  are served exactly five fixed sections today and the suite asserts it, so the
  sentence is true; a sixth guide with a different section count would need
  either a different count in the prose or that sentence derived. Pinned rather
  than derived, deliberately, because deriving it would have changed the one
  guide whose generated output is known to work.
- **Acceptance checks are stated, not verified.** They now reach the writer,
  which is the half that was missing. Nothing checks the finished document
  against them — they remain behavioural assertions in prose. Whether any of
  them should become a measured check is a product decision and is out of scope.
- **A blocking check for these documents still assumes a decision, and it is
  observe-only.** The quality contract arms `decision_clarity` — a blocking
  check that the decision requested is unmistakable on the first page — for
  every client-facing document that is not an evidence binder, and the five
  working guides qualify: none of them narrows its rubric, so the default
  rubric applies. That check's premise is the opposite of what these documents
  declare, and this change makes them less likely to satisfy it by accident,
  because they are no longer told to state a decision ask. It cannot quarantine
  anything today: enforcement is gated on the `deliverable_quality_contract`
  flag, which is enrolled for no tenant, and none of these profiles requires a
  visual renderer, so the contract runs observe-only and records the state
  without blocking. This was measured before deciding not to touch the check
  here. If that flag is ever enrolled, the contradiction becomes live and the
  fix belongs in the guides' declared rubric, not in the check — weakening a
  blocking control is not something to do in the same change that alters the
  prose it measures.

- **The committed census was already behind.** The regeneration moves test
  files 2,802 → 2,805 and covered 2,638 → 2,641 while this change adds exactly
  one suite, so `main`'s committed counts were two short of its own tree when
  this was measured. Uncovered is flat either way. The numbers here are this
  tree's truth; if a sibling lands first, this needs regenerating rather than
  merging.

## Related

- `src/lib/deliverables/orchestrator/quality-bar-registry.ts` — the single place
  the five working guides are declared, which the predicate now reads.
- `src/lib/programs/__tests__/phase-deliverable-quality-contract-coverage.test.ts`
  — the required check that asserts every phase document declares acceptance
  checks, which until now nothing in production read.
