# 2026-09-25-source-financial-visibility-route-mounted — Gate exact financial magnitudes on three route-mounted Source surfaces

## Release ID

`2026-09-25-source-financial-visibility-route-mounted`

## Status

`candidate`

## Plain-English Summary

Three Source screens printed exact contract amounts to whoever opened them, without ever
asking whether that viewer is allowed to see exact financial values. This change makes each
of them ask, and makes the question impossible to skip by accident.

Two earlier changes in this family fixed components that already had the entitlement flag:
one removed a default that answered "yes" when a caller said nothing, the other fixed a
component that accepted the flag and then ignored it. The three here are a different case —
the flag appeared nowhere in their files at all, so there was nothing to default and nothing
to ignore. The question had simply never been put to them.

Backlog item `U-520`.

### Reachability was settled before anything was edited

The item named seven components and nineteen places where an amount is printed. Editing all
seven would have been wrong: some of those components are not reachable from any route, and a
guard added inside an unreachable component is a test that passes forever over a screen
nobody can open. So the route tree was read first, and the repository's generated
unreachable-components record was **regenerated** rather than trusted (it agreed — 415
unreachable files, no drift).

| component | verdict | how it is reached | amount sites |
|---|---|---|---|
| `RenewalCockpitView` | route-mounted | `/source/renewal/[contractId]` | 9 |
| `VendorResponseDecisionProofPanel` | route-mounted, three hops | `/source/events/[eventId]` → analytics canvas → inner workspace → responses stage view | 2 |
| `SourceExecutionRoomPage` | route-mounted | `/source/renewal/[contractId]/execution` | 1 |
| `SourceDecisionQueueView` | declared unreachable | on the orphan list; only test files import it | 3 |
| `BafoScenarioComparePanel` | declared unreachable | its only importer is itself on the orphan list | 3 |
| `SourcePortfolioReactivePanel` | declared unreachable | on the orphan list; only its own suite imports it | 1 |

12 + 7 = 19, which reconciles with the count the item measured. **Only the 12 reachable sites
are changed here.** The other 7 are named above and left alone deliberately.

### Two mechanisms, chosen per component and stated

The item offered a choice: pass the entitlement down as a required value, or strip the
amounts out of the data before the screen receives it. Both are used, for different reasons.

**A required value, for the amounts a component formats itself.** Each of the three
components now takes the entitlement as a required input, and its number formatter takes it as
a required second argument — so a place that formats an amount without answering the question
does not compile. Formatting for an entitled reader is byte-for-byte unchanged; only the
withheld label is shared, so there is one spelling of "withheld". A `null` amount still reads
"not priced" in both directions, because that is a fact about the contract and not about the
reader.

The eight duplicate local formatters the item mentions are **not** consolidated into one
shared formatter, on the item's own reasoning: a shared formatter that does not take the flag
would be no safer than eight that do not. What makes omission an error is the required
argument, not the sharing.

**Stripping amounts out of the data, for amounts written into sentences.** This was the part
the item's count did not predict, and it is the more important half.

Gating only the formatter calls left one screen reading "Annual spend — withheld" directly
above a sentence quoting the same amount in full. Those sentences are composed by the
calculation layer and rendered as text, never through a formatter, so no amount of work on
formatters reaches them. Measured on the restricted render before this change: **13 occurrences
across 3 distinct amounts** on the execution-room screen alone. A gate the next sentence walks
around is worse than no gate, because it tells the reader the figure was withheld while showing
it to them.

The renewal cockpit's sentences are redacted individually — there are eight, all in one file.
The execution room's are redacted in one pass where its data enters the screen, because they
come from five nested shapes rendered by five sub-sections, and a list of named fields is the
wrong instrument when the failure mode is a field nobody listed. Both use redaction machinery
that already existed for this purpose. For an entitled reader the pass is a strict no-op, which
is asserted rather than assumed.

### The three pass-through layers in between

The deepest of the three screens sits three layers below its route. Those in-between layers
carry the answer but never read it. They take it as **optional, defaulting to withheld** —
deliberately not required, and the asymmetry is the point:

- the screens that **consume** the answer require it, because that is where a silent caller
  would become an entitled reader;
- the layers that only **carry** it default to withheld, which is the safe direction. A route
  that forgets restricts — visible, and reportable by whoever is affected. The opposite
  discloses in silence.

Requiring it on the carrier layers would also have added a mechanical argument to 78 places
across twelve test suites that have nothing to do with financial entitlement, which is the
large-diff-nobody-reads shape this backlog exists against.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared product behaviour for all clients and
is not feature-gated: wherever the existing Source access policy says a reader may not see
exact financial values, these three surfaces now honour that. It is not `client-data-lane`
(no schema, seed, ingestion, retrieval or private data-plane change), not `internal-admin`,
not `public-demo`, and not `experimental` (no flag, on by default).

- **Layer 4 — Products (Source).** Three route-mounted surfaces and three intermediate
  components change what a restricted reader sees. No change for an entitled reader, asserted.
- **Layer 4 — Products (routes).** Two renewal routes gain an entitlement read they did not
  have; one event route gains a second read in a scope that previously had none.
- **Layer 3 — canonical model: unchanged.** No schema, no migration, no loader, no read model,
  no stored value. This release only changes what is rendered, to whom.

The entitlement itself is read from the existing Source access policy, the same source the
already-gated Source routes use. This release introduces no new notion of who is entitled.

## Client Applicability

- All clients: yes — the gate applies wherever the access policy says a reader may not see
  exact financial values.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The behaviour is governed by the existing access policy, not a flag.

No client-visible change for a reader the policy already entitles.

## Changes Included

Components (entitlement consumed):

- `src/components/source/RenewalCockpitView.tsx` — required entitlement input; 9 formatter
  sites gated; 8 composed sentences redacted.
- `src/components/source/SourceExecutionRoomPage.tsx` — required entitlement input; 1
  formatter site gated; its view model redacted in one pass at entry.
- `src/components/source/canvas/responses/VendorResponseDecisionProofPanel.tsx` — required
  entitlement input; 2 formatter sites gated.

Components (entitlement carried, optional, defaults to withheld):

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` — two hops: the canvas
  and its inner workspace section.
- `src/components/source/canvas/responses/ResponsesStageView.tsx`

Routes (entitlement read):

- `src/app/(maestro)/source/renewal/[contractId]/page.tsx`
- `src/app/(maestro)/source/renewal/[contractId]/execution/page.tsx`
- `src/app/(maestro)/source/events/[eventId]/page.tsx`

Shared:

- `src/lib/source/financial-display.ts` — one added function: redact amounts out of a view
  model's prose in a single pass, a strict no-op when entitled.

Tests:

- `src/components/source/__tests__/u520-financial-visibility.test.tsx` — new, 19 cases.
- `src/components/source/__tests__/RenewalCockpitView.estimate-disclosure.test.tsx` and
  `src/components/source/canvas/responses/__tests__/VendorResponseDecisionProofPanel.test.tsx`
  — each now states its entitlement answer, with the reason recorded inline. Neither
  assertion was weakened; both suites assert exactly what they asserted before.

## QA / Validation

**Baseline, measured on the same scope before any edit:** 4 suites, 28 tests, **0 failing**.
No absolute repository-wide failure count is quoted anywhere in this record.

**Red before green.** The new suite was written first and run against the unmodified
components: **9 failing of 14**. After the change: **19 passing of 19** (the suite grew as two
gaps below were found). The passing cases in the red run were the non-vacuity guards, which is
the correct red state — they confirm the fixtures reach the amounts at all.

**One fixture was vacuous and was caught by its own non-vacuity guard.** The decision-proof
panel's figure only exists when the vendor data carries a priced workbook; the fixture its own
suite uses does not, so the panel renders no amount. A restricted-direction assertion over
that fixture **passed against the unfixed component**, because there was nothing to find. The
fixture was rebuilt to reach the branch. This is recorded because the guard that caught it is
the reason the suite is worth anything.

**Mutation checks — every guard broken deliberately, both directions where it has two.**

| # | mutation | result |
|---|---|---|
| 1 | cockpit formatter gate weakened to `=== false` (re-open the fail-open case) | 1 of 19 failed |
| 2 | cockpit sentence redaction blinded to the identity function | 3 of 19 failed |
| 3 | prose redaction pass blinded (returns input unchanged) | 2 of 19 failed |
| 3b | prose redaction pass always redacts (breaks the entitled direction) | 1 of 19 failed |
| 4 | decision-proof panel gate deleted | 5 of 19 failed |
| 5 | canvas → inner workspace carries a literal "yes" | 1 of 19 failed |
| 5b | canvas → responses stage view carries a literal "yes" | 1 of 19 failed |
| 6 | responses stage view → panel carries a literal "yes" | 2 of 19 failed |

No mutation survived. Every guard restored, suite green again after each.

**Two gaps the mutation checks found, which review would not have.**

1. **Mutations 5 and 5b originally survived.** Every case mounted a leaf component directly,
   which says nothing about whether its ancestors pass the reader's real answer down. A literal
   "yes" substituted in the canvas left all 15 cases green. This is not hypothetical — it is
   how this whole component family was authored the first time, and the earlier record in this
   family says so in as many words. Cases that drive the intermediate layers with a restricting
   answer and read the leaf were added; both mutations now fail.
2. **The chain is three hops, not two.** Wiring the carrier prop surfaced an inner section
   inside the canvas that the item's description did not mention and a read of the call site
   did not reveal. It was found by mounting the real chain, not by reading it.

**Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
**exit 0**, 0 errors. Judged on the exit code, not on a grep: a bare `npx tsc --noEmit` exits
134 on this machine with no diagnostics, which greps as clean.

**Lint:** `npx eslint` over all 11 changed files — exit 0, no findings.

**Regression, scoped:**

- entitlement family (7 suites incl. the two earlier items' guards): 58 passing, 58 total.
- all analytics canvas suites (the 78 carrier call sites): 18 suites, 147 passing, unchanged.
- the whole owned directory, as CI runs it: 27 suites, 185 passing.

**CI coverage — proven, not asserted.** `.github/workflows/source-component-suites.yml` runs
`src/components/source/__tests__` by directory on `pull_request` and `merge_group`, and exists
precisely so a new sibling suite is covered by the first pull request that adds it. Proven by
running that exact command with `--listTests`: the new file is collected (1 match). No
workflow file needed editing, so nothing here competes with concurrent work on the
exact-path workflow.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow builds and deploys on
merge; there is no separate rollout step, no migration to apply and no flag to set.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the deploy workflow on merge; recorded in the pulse entry
  once the run completes.
- ACA runtime invariant: to be proven after deploy — Container App template image must equal
  the 100%-traffic revision image.
- Worker image invariant: not affected; no worker job changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes, and it is OWED, not done.** See Known Gaps.

## Rollback Plan

Revert the squash commit. No migration, no stored data and no flag state is involved, so the
revert is complete on its own. Reverting restores the previous behaviour, in which these three
surfaces print exact amounts to every reader — so a rollback reinstates the disclosure this
release closes, and should be a deliberate choice rather than a reflex.

## Audit Evidence

- The pull request for this record, and its CI run.
- The red-then-green numbers and the eight-row mutation table above, each reproducible with the
  commands named.
- `docs/architecture/unreachable-components.json`, regenerated during this change and unchanged
  by it — the basis of the reachability table.
- The new suite is itself the durable evidence: it asserts both directions per component and
  fails if any guard is removed.

## Known Gaps

- **Signed-in acceptance is owed.** Nothing here has been checked against the deployed build by
  a signed-in reader with a restricted policy. This record says `merged`-ready, not
  `live-proven`, and the distinction is deliberate.
- **The 7 amount sites in the three unreachable components are untouched**, listed in the table
  above. They are not a disclosure risk today because no route reaches them; they become one
  the moment any of those components is mounted. Whether each should be mounted or deleted is
  a separate question and is not decided here.
- **The prose-redaction finding generalises beyond this item and has not been swept.** Amounts
  composed into sentences by a calculation layer bypass every formatter-based gate by
  construction. This release fixes the two surfaces where it was measured; the same pattern is
  likely present on other Source and Tower surfaces that were counted by formatter call sites
  alone. Filed as a follow-up finding rather than fixed here.
- The intermediate carrier layers default to withheld. A route that forgets to pass the
  entitlement therefore restricts a reader who should be entitled — the safe direction, but a
  real failure mode, and the reason the three routes' reads are named explicitly above.
