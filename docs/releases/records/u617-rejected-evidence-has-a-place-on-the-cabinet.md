# u617 — A rejected evidence review has a place on the cabinet

## Release ID

`2026-10-08-rejected-evidence-review-visible`

## Status

`candidate`

## Plain-English Summary

The review ladder for an uploaded document has three outcomes. A parsed upload
waits for a human, who either accepts the extraction or rejects it. The Files &
Evidence cabinet showed two of the three.

One read asked for the waiting items and filled the review queue. A second read
asked for the accepted items and filled the reviewed list. Nothing asked for the
rejected ones. So when a reviewer rejected a parsed extraction, the card left the
queue on the decision and arrived nowhere: not in the reviewed list, not in a
list of its own, and the reason they had just typed was stored and never shown
again. The file itself stayed listed in the cabinet as an upload, so the reader
was left with a file that is visibly present and silently not counted, with
nothing on the page explaining why. The queue's own explainer sentence told them
that _"pending and rejected evidence is excluded from phase generation"_ —
naming a state the surface then refused to show.

Two things make that worse than a missing row.

The decision is one-way. The write that records it only acts on a review that is
still waiting, and its fallback refuses any attempt to record a different
decision than the one already stored. So nothing anywhere can turn a rejection
back into an acceptance. A reader who cannot see the rejection has no way to
learn that.

And the obvious recovery does not work. Uploading the same file again produces
the same extraction the reviewer had just rejected, so the one instruction a
reader would reach for first is the one that loops. The instruction that does
work — a corrected file, or a different source — was stated nowhere.

This change gives the rejected decision a place. The cabinet's decided-review
read now asks for both decided outcomes in one query and splits them, so the
accepted list is unchanged and the rejected ones arrive in a list of their own.
Each row names the state, the family and phase it was uploaded against, the date
it was rejected, and the reason the reviewer recorded. The section states the
action that can still succeed, and it does not offer an approve control, because
there is nothing here approving can act on.

It also moves the route behind that panel into a job that can block a merge. The
read is the only one the cabinet makes, so it decides everything a reviewer can
see about the evidence they have decided on, and its suite was named only by a
workflow that is required by nothing.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

Layer 4 (Products) only. Layers 1 (Client Intake), 2 (Source Adapters) and 3
(Canonical Model) are untouched: no schema, no migration, no adapter, no intake
change. No new column is read that the table did not already have, and nothing
is written: every change is on a read path and a render.

**Nothing about what counts as evidence changes.** Phase generation treats as
committed exactly what it treated as committed before — the accepted list is
derived from the same rows, with the same fields, and a case pins that a
rejected row is not in it and a waiting row is in neither list. Coverage,
readiness, gate criteria and the generation inputs are all untouched; this
change is about what the reader can see, not about what the Move counts.

## Client Applicability

- All clients: yes — the list appears for every tenant whose Move has a rejected
  evidence review.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. Gating the visible state would leave the invisible one on
  the ungated path, which is the reader every tenant has today.

## Changes Included

- `src/lib/programs/evidence-review-dispositions.ts` — **new.** Imports the
  decision domain type from `current-state-doc-ingest.ts` rather than restating
  it, so the column keeps one declaration (type-only, so the module stays
  importable by a suite despite that module being `server-only`). Exports the
  decided-decision set, a guard over it, the split of one read into the two
  lists, and the describer for a rejected row: its label, the action that can
  still succeed, and the recorded reason normalised to null when blank. No
  database access and no `server-only`.
- `src/app/api/v1/programs/[programId]/artifacts/route.ts` — the decided-review
  loader asks for the decided SET instead of the accepted value alone, derives
  both lists through the module, and returns the rejected one in its own field.
  The accepted list keeps the exact shape it had, without the reason: it has
  never carried one and widening it is not this change. One query where there
  was one query; no extra round trip.
- `src/components/strategic-moves/FileCabinetPanel.tsx` — reads the new field
  and renders the section. The next action comes from the module, so the page
  and any other reader of that fact cannot drift apart. The section renders only
  when there is a rejected review, and carries no control.
- `.github/workflows/ai-surface-control-catalog.yml` — C-415 slice 20: the
  cabinet's read route directory, wired as a directory with its one dynamic
  segment's brackets escaped, plus the cabinet's evidence-review rendering suite
  named by exact path in the liability-controls step.
- `.github/workflows/unit-suites.yml` — the route suite's exact path leaves this
  list, because a required job now sweeps its directory and a name here would be
  the quotable line in a job that blocks nothing. The comment block already
  documenting that migration for an earlier slice records this one too.
- `src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts` —
  three new cases in a new `describe`, plus capture-only instrumentation on the
  existing database mock. The mock's builder still resolves every row for a
  table exactly as before, so no existing case changes behaviour; what is added
  is a record of which column filters the route applied, which is how a case can
  ask _which_ decisions a read asked for.
- `src/components/strategic-moves/__tests__/FileCabinetPanel.evidence-review.test.tsx`
  — four new cases in a new `describe`. This suite already renders the real
  panel with its fetch mocked, so the cases pin the rendered section rather than
  the pure decision.
- `src/lib/programs/__tests__/current-state-doc-family-review-scope.test.ts` —
  six new cases in a new `describe`, hosted beside the existing cases over the
  same column rather than in a new file.

Deliberately **no census change**: no test file is added, and both wired paths
were already selected by the non-required workflow, so the coverage census reads
the same before and after. That was measured, not assumed, and it is what keeps
this clear of the two open releases that touch the census.

## QA / Validation

- **PASS** — `npx jest --runTestsByPath` on the three changed suites together →
  **48 of 48**, and that total was the baseline every mutation run was compared
  against.
- **PASS** — the six module cases: the decided set is exactly the non-pending
  half of the domain and the waiting value is **not** in it (the defect in one
  assertion — a read that asks for the accepted value alone asks for half of
  the decided ones); one read splits into the two lists in order; a waiting row
  lands in **neither** list, which is the ladder's invariant, since a waiting
  row in the accepted list would report evidence as committed before a human
  accepted it; a decision value the module does not recognise also lands in
  neither, so a value added to the column later cannot be rendered as accepted
  by a list that has not been taught what it means; the rejected state is named
  and its action names a corrected or different source while naming **neither**
  of the two actions that cannot work; and a blank or absent reason reads as no
  reason rather than an empty one, with the action proven independent of whether
  a reason was recorded.
- **PASS** — the three route cases: the decided read asks for both decided
  decisions and not for the waiting one (asserted against the captured filters,
  and the waiting queue's own filter is deliberately excluded from the
  assertion by shape, since it is a single value and the decided read's is a
  set); a rejected row leaves the route in its own field with its reason
  attached **and is not also in the accepted list**; and an accepted row stays
  in the accepted list, out of the rejected one, and still without a reason
  field — the control that makes the split non-vacuous.
- **PASS** — the four rendering cases: a rejected review's file name, state and
  recorded reason all reach the rendered section, none of which reached any
  surface before; the section states the action that can succeed, names the
  decision as not re-decidable, and contains **no** control; the section does
  **not** render for an accepted review, which is the control proving the
  decision is read rather than the section always rendering; and a reader
  without approval rights sees it too, because exclusion from generation is a
  fact about the Move and not a reviewer privilege.
- **PASS** — mutation testing, **eleven mutations, eleven killed.** Each
  mutation asserted its pattern occurred exactly once before being applied and
  refused to write otherwise, so none silently no-opped, and every run's total
  was compared against the 48-case baseline.
  1. The decided query narrowed back to the accepted value alone → killed, 1
     case. This is the original defect, and only the captured-filter case can
     see it: the suite's database mock resolves rows regardless of filters, so
     without that instrumentation this mutation survives.
  2. The rejected field removed from the response → killed, 2 cases.
  3. The rejected list fed from the accepted half of the split → killed, 2
     cases.
  4. The split pushing every row into both lists → killed, 5 cases, the widest
     kill, across both the module and the route.
  5. The waiting value added to the decided set → killed, 2 cases, one in each
     of those two suites.
  6. The next action reworded to prescribe uploading the file again and
     approving it → killed, 2 cases, one of them a rendered one. That pair is
     the proof the sentence the module owns is the sentence on the screen.
  7. The reason left un-normalised → killed, 1 case.
  8. The panel never reading the response's rejected field → killed, **3
     cases**. This is the mutation that matters most: it is the proof the
     route's answer reaches the rendered page rather than stopping at a correct
     value nothing consumes.
  9. The section rendered unconditionally → killed, 2 cases.
  10. The recorded reason not rendered → killed, 1 case.
  11. The section's next-action sentence dropped → killed, 1 case.
      The baseline was restored after the battery and **verified byte-identical to a
      pre-mutation backup of all three mutated files** by diff, then the suites were
      re-run green at 48 of 48.
- **PASS** — `npx jest src/lib/programs/__tests__` → **179 suites, 2,361
  tests.** The required catalog sweeps this directory, so the module cases are
  merge-blocking with no workflow edit.
- **PASS** — `npx jest src/components/strategic-moves/__tests__` → **48 suites,
  727 tests.**
- **PASS** — `npm run test:behaviors` → **208 suites, 2,162 tests.** This
  includes the requiredness control, which is what caught the duplicate naming
  the workflow wire created: with the route suite still named in the
  non-required workflow the control reported `1 named suite(s) in a non-required
job` and the behaviour case failed honestly. Removing that name is what made
  it green, and it is the reason the non-required workflow is in this change at
  all.
- **PASS** — the escaped directory argument was measured, not assumed:
  `npx jest --listTests` with the escaped spelling selects the route suite, and
  with the unescaped spelling selects **nothing at all**, because a bare
  positional is a regex and the unescaped brackets are a character class. The
  argument also stops at the parent directory, so the separately wired child
  route directories do not match it.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- **PASS** — `npx eslint` on all changed files, exit 0 and no warnings.
- **PASS** — `npm run audit:tenancy-fence-coverage`, exit 0, no generated file
  changed.
- **PASS** — the coverage census is **unchanged in every count** before and
  after this change (`testFiles`, `coveredTestFiles`, `uncoveredTestFiles`,
  and the directory bands), and the wired directory is in none of the census gap
  lists afterwards. See Known Gaps for the inherited drift this change does not
  touch.
- **PASS** — Prettier established **per file, in place**, by restoring each
  file's base content at its own path and re-checking there rather than on a
  copy outside the tree. The two workflow files and the new module are clean.
  All five modified source files warn at the base as well. Two of the
  formatter's requested changes fell inside this change's own added lines and
  were **applied by hand**; every hunk that remains in any changed file sits
  outside this change's added lines, which was established by reading the hunk
  line numbers against the added ranges rather than by running `--write`.
- **NOT RUN** — no signed-in walk. This adds a section to a live product
  surface, so a walk is the only way to observe it. See Known Gaps.
- **NOT RUN** — the rejected state was not exercised against a live database.
  Its reachability is established by reading the write that records it and the
  rendering suite's real-component render, not by observing a row.

## Rollout Plan

Merge to `main` via squash. The change then rides the repo-owned Azure Container
Apps main deploy workflow like any other product change: no migration, no flag,
no data move, nothing to sequence. Until that deploy completes, a rejected
review stays invisible exactly as it is today. The workflow changes take effect
on the next run of those workflows and change no runtime behaviour at all.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
  by this release.
- Shared runtime mutators: none. This release runs no Azure command and mutates
  no shared runtime, traffic weight, revision or Container App template.
- Approved image digest: not applicable — no runtime image is selected,
  pinned or changed here.
- ACA runtime invariant: unaffected. No `az containerapp update` is performed,
  so no template/traffic/worker digest triple moves.
- Worker image invariant: unaffected. No worker job image or payload contract
  changes.
- Feature/env flag update path: not applicable. No flag is added, read or
  enrolled, and no environment variable changes.
- Live signed-in proof required: **yes.** A rendered section on a live product
  surface is observable only signed in, and nothing in this release has been
  observed that way. This record must not be read as `live-proven`.

## Rollback Plan

Revert the squash commit. There is no migration, no flag and no data change, so
the revert is complete and immediate: the route stops returning the rejected
field, the panel stops rendering the section, and the accepted list and the
waiting queue return to the exact reads they perform today. The two workflow
edits revert with it and only change which jobs collect which suites.

A narrower rollback is available if only the CI wiring is in question: reverting
the two workflow files alone leaves the product fix in place and returns the two
suites to the non-required workflow they were named by before.

## Audit Evidence

- The pull request for this record and its CI run.
- The three suites named under Changes Included, whose cases are the executable
  statement of the claim.
- `.github/workflows/ai-surface-control-catalog.yml` slice 20 and the
  liability-controls step, which are where the two suites now run in a job that
  can block a merge.
- The requiredness control's own output, which is the evidence that no suite is
  named in a non-required job that a required job already runs.

## Known Gaps

1. **No signed-in walk, so nothing here is `live-proven`.** The section's
   existence, position and wording on the real surface are unobserved. This is
   the standing human step for this workstream and it is owed for several
   earlier releases as well.
2. **The reason text is rendered as the reviewer stored it.** The write records
   a default sentence when a reviewer supplies none, so a row may show a
   generated reason rather than a human-written one. This change does not
   distinguish the two, and the field would have to carry that distinction for
   it to be able to.
3. **Re-deciding a rejected review is still impossible, by design, and this
   change only says so.** The surface now states that the decision cannot be
   re-decided and names the action that works. Whether a reviewer _should_ be
   able to withdraw their own rejection — and what that would mean for a
   coverage figure already computed from the accepted set — is a product
   question, not a defect, and it is not answered here.
4. **The committed coverage census is one behind its own tree at this base**
   (`testFiles 2868 -> 2869`, `coveredTestFiles 2704 -> 2705`), inherited from
   `main` and **not** produced by this change, which adds no test file and moves
   no count. It was deliberately left alone: the audit exits 0 and the census
   behaviour suite passes with the drift present, so it is a report rather than
   a gate, and regenerating it here would claim another release's delta as this
   one's and guarantee a rebase against the two open releases that touch that
   file. It is worth one standalone regeneration when nothing is in flight.
5. **The remaining directories named only by the non-required workflow are
   still dark.** Slice 20 closes one; `FileCabinetPanel.scroll-into-view.test.tsx`
   in the cabinet's own directory is not named by any required job, and an
   earlier measurement counted roughly forty such directories as an upper
   bound. Each needs its own pre-wiring green measurement; wiring them
   wholesale is not safe.
6. **A pending review whose evidence item does not resolve is still dropped
   silently** by the waiting-queue loader, with no banner and no row, while the
   evidence stays excluded from generation. Reachability is weak — both queries
   use the same tenant alias set and the ingest writes both rows together — so
   it is recorded as latent rather than fixed, unchanged by this release.
