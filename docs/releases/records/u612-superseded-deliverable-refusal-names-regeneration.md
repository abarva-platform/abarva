# u612 — A superseded document's sign-off refusal names the one action that works

## Release ID

`2026-10-08-superseded-deliverable-sign-off-refusal`

## Status

`candidate`

## Plain-English Summary

u607 gave the deliverable sign-off route's three unnamed refusals a cause and a
sentence each. Its own Known Gaps recorded one residual risk: the set of status
values that make the guarded write ineligible was established by reading the
writers of that column, and *"a future writer introducing a fourth value would
land in the eligible-at-read branch and be reported as 'not recorded'"*.

That fourth value is not in the future. It is in the product today.

The column's `CHECK` constraint admits four values, and the one u607 did not
account for is `superseded`. The solution-option approval route writes it — when
the chosen solution option for a Move is approved, every P3 architecture
document in that Move is set to `superseded`, deliberately, because an output
built on the prior basis may no longer satisfy a gate. That is correct
behaviour. What was wrong is what happened next.

A `superseded` document cannot satisfy the guarded write, so the sign-off route
fell through to the eligible-at-read branch — the branch written for a row that
**changed under the write**, a lost race. A superseded row did not change under
anything; it is exactly where the solution-option approval left it, durably. So
the reader was handed a sentence written for a transient condition, ending in
*"Reload the phase workspace and approve the version it then shows."* Reloading
re-renders the same superseded row. Approving it refuses identically. Every
time, forever.

A refusal that prescribes a remedy its own cause has already ruled out is worse
than one that says nothing, because the reader spends the retry before learning
it was never going to work.

`superseded` does clear, by one action and only one: generating the document
again. The orchestrator persists a regenerated document through a write that
carries no status filter and sets the status back to `draft`, which **is**
signable. So this change gives `superseded` its own refusal, which says the
document was superseded, says that approving it again will refuse the same way,
and names regeneration.

Four of the phase gates' **hard** criteria can be satisfied by sign-off and no
other way, and the four documents this affects are the P3 architecture set — one
of which is in the default P3 build set. A reader stuck in a loop of identical
refusals at P3 is a Move that does not reach P4.

The path that reaches this is approve-by-uploading-a-replacement. On the
plain-JSON approval path the P3 architecture lineage checks run first, and for a
superseded row those are expected to refuse on their own — the row is superseded
*because* the approved option changed, so the lineage stamped on the version is
stale by construction. The upload branch skips that block entirely, so the
guarded write is what answers. That narrowing is stated in the module and pinned
by the route case, which exercises the upload path rather than the JSON one.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

Layer 4 (Products) only, and only in the wording and status of one refusal.
Layers 1 (Client Intake), 2 (Source Adapters) and 3 (Canonical Model) are
untouched: no schema, migration, adapter, intake or read-model change. **No
route file changes at all.** The route already threads the status it read into
the refusal helper, so the new branch rides a value that was already being
passed — no call site is threaded and no new column is read. No gate criterion,
gate rule, deliverable registry entry or write path is modified: what is
signable, what supersedes a document, and what signing does are all unchanged.

## Client Applicability

- All clients: yes — the refusal wording and status change for every tenant
  whose Move has a superseded P3 architecture document.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. Gating a refusal's wording would leave the false remedy in
  place on the ungated path.

## Changes Included

- `src/lib/programs/deliverable-sign-off-outcome.ts` — `superseded` added to the
  status type (it belongs there: the `CHECK` constraint admits it and a writer
  writes it), a `deliverable_superseded` refusal code, and a branch returning
  `409` with a sentence that names regeneration. The header now records both
  ineligible values, which writer produces each, why `superseded` is terminal
  rather than a race, and the specific approval path that reaches it. The
  generic branch is deliberately left as the **last** arm, so a fifth value
  added later still falls there rather than borrowing a named state's sentence.
- `src/lib/programs/__tests__/deliverable-sign-off-refusal-naming.test.ts` —
  four new cases plus two existing cases corrected. The two corrections are the
  assertions that pinned the old state: the status-code partition case said
  `404` for *"every refusal but the already-signed one"* and now names two
  recorded-state departures, and the distinctness case counted 4 refusals and
  now counts 5. The unrecognised-status list gains `"SUPERSEDED"` so the match
  is pinned as exact rather than case-insensitive. No new file, so the coverage
  census is not touched.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__/deliverable-sign-off-refusal-naming.test.ts`
  → **21 of 21** (was 16 before u607's suite grew here; 17 at this base). The
  four new cases: the superseded refusal names itself rather than borrowing the
  race sentence or the already-approved one; it prescribes regeneration and
  **not** the retry that would refuse again; it says the retry is futile rather
  than leaving the reader to discover that; and the route emits it with `409`,
  the code and the sentence over the upload path. The fifth new case is
  reachability, not vocabulary — see below.
- **PASS** — **reachability pinned, not assumed.** `superseded` is written only
  to the P3 architecture document set, so the refusal is dead code unless those
  are registered documents a reader is actually asked to approve. One case
  imports that set and the deliverable registry and asserts the set is non-empty
  and every member is registered. This is import-based rather than source-text
  matching, so a rename cannot leave it passing against nothing.
- **PASS** — mutation testing, **nine mutations, nine killed**. Each mutation
  asserted its pattern occurred **exactly once** before being applied and
  refused to write otherwise, so none silently no-opped; the baseline was
  restored and verified byte-identical after each.
  1. The whole superseded branch removed → killed, 5 cases.
  2. `409` → `404` for superseded → killed, 3 cases.
  3. Superseded borrows the already-approved code → killed, 3 cases.
  4. The sentence's remedy replaced by the old reload-and-retry wording →
     killed, 2 cases. This is the mutation that matters: it reproduces the
     defect exactly.
  5. The futility clause dropped → killed, 1 case.
  6. The status match made case-insensitive → killed by the unrecognised-status
     case, which is why `"SUPERSEDED"` was added to it.
  7. The already-approved branch widened to catch every ineligible value →
     killed, 8 cases, including the three unrecognised-status cases that prove
     the last arm still receives what no named arm claims.
  8. An unregistered key in the superseded producer set → killed by the
     reachability case.
  9. The superseded producer set emptied → killed by the reachability case, so
     that case is not vacuous in either direction.
- **PASS** — **the cross-tenant status-code contract, checked first and
  deliberately.** u607's first attempt broke it, and this change could have
  broken it the same way.
  `src/__tests__/integration/programs/programs-mutation-routes-tenant-guards.test.ts`
  models a foreign resource id as a `false` from the write layer and pins `404`,
  so answering `409` there would both break that contract and let a caller tell
  a foreign id from an absent one by status code. The departure to `409` is safe
  here for the same reason the already-approved one is: reaching it requires a
  status read from a row already filtered to this Move. The guard suite ran
  alongside the new suite for every mutation and stayed green throughout.
- **PASS** — every suite that touches this route and both writers of the status
  it reads: the route's own suite, the solution-option approval route suite, the
  client-approval route suite, the sign-off write-layer suite and the two
  programs integration guard suites → **110 of 110** across two invocations
  (63 + 47).
- **PASS** — `npx jest src/lib/programs/__tests__` → **178 suites, 2,316
  tests**, the required catalog sweep that makes these cases merge-blocking with
  no workflow edit.
- **PASS** — **all test trees searched for assertions pinning the old state
  before writing.** Every reader of the module, the refusal codes and the status
  type is listed: the route, the module, this suite, and u607's record. Exactly
  two assertions pinned the behaviour being changed and both are corrected
  above. This is checked because a behaviour fix that leaves behind the
  assertion pinning the defect reddens `main` for everyone.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- **PASS** — `npx eslint` on both changed files, exit 0.
- **PASS** — `npm run audit:tenancy-fence-coverage`, exit 0, no generated file
  changed. Neither changed file is a fence-scoped suite.
- **PASS (inherited drift, not this change's)** — `npm run audit:test-ci-coverage`
  reports the committed census one behind its own tree, `+1/+1`. This change
  adds **no test file**, so it cannot move those counts, and that was proven
  rather than argued: the base content of both changed files was restored in
  place and the audit re-run, giving a **byte-identical** reading
  (`2863 -> 2864`, `2699 -> 2700`). The drift is the base's. See Known Gaps.
- **NOT RUN** — no signed-in walk. This changes what a refusal says on a live
  product surface, so a walk is the only way to observe it. See Known Gaps.
- **NOT RUN** — the superseded path was not exercised against a live database.
  Its reachability is established by reading the writer of that value and the
  registry membership of the documents it targets, not by observing a row.

## Rollout Plan

Merge to `main` via squash. The change then rides the repo-owned Azure Container
Apps main deploy workflow like any other product change: no migration, no flag,
no data move, nothing to sequence. Until that deploy completes the route keeps
its current wording, which is the pre-change behaviour.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only
  authority that may shift shared web traffic. Not invoked by this change.
- Shared runtime mutators: none. No `az containerapp` command, no traffic or
  revision weight change, no web or worker template change.
- Approved image digest: unchanged by this record; the main deploy workflow
  builds and pins it.
- ACA runtime invariant: unaffected here, and to be proven by the deploy
  workflow in the usual way before this is called live.
- Worker image invariant: unaffected. No worker code changes.
- Feature/env flag update path: not applicable. No flag.
- Live signed-in proof required: **yes** — see Known Gaps. This record may say
  `merged` and `deployed`; it may not say `live-proven`.

## Rollback Plan

Revert the squash commit. Two files and no state: the status type loses a value
it should have had, the superseded branch is removed, and a superseded document
returns to the lost-race sentence and `404`. No migration, no data, no deployed
artifact to unwind, no flag to flip, and no generated artifact to regenerate.
Reverting restores the false remedy but breaks nothing else — the route's
success path, both writers of the status column, the write layer and every gate
criterion are untouched by this change in both directions.

## Audit Evidence

- The pull request for this record and its CI run, in which the required
  `AI surface control catalog` check runs the changed suite.
- `src/lib/programs/deliverable-sign-off-outcome.ts` — the superseded refusal,
  with the writer, the terminality argument, the clearing action and the
  reachable approval path recorded in its header.
- `src/lib/programs/__tests__/deliverable-sign-off-refusal-naming.test.ts` — the
  21 cases, including the two corrected pins and the reachability case.
- `src/__tests__/integration/programs/programs-mutation-routes-tenant-guards.test.ts`
  — unchanged, and the suite that constrains where a `409` is permitted.
- `docs/releases/records/u607-deliverable-sign-off-names-its-refusal.md` — the
  record whose Known Gaps named this as a hypothetical; this one closes it as an
  actual.

## Known Gaps

- **A signed-in walk is owed.** The direction to observe first is the
  regression one: a document in `draft` still signs off unchanged and its
  approval badge appears, because that is the path a demo walk uses. Observing
  the superseded refusal itself requires approving a solution option and then
  attempting an upload approval on a P3 architecture document — stageable, but
  second. Nothing in this change is `live-proven`.
- **The plain-JSON approval path for a superseded P3 architecture document is
  still answered by the lineage checks, and their sentences were not
  re-litigated.** Those refusals carry a sentence and a `409` already, so they
  are not the unnamed-token defect; whether *"The current approved option or P3
  context snapshot is unavailable"* names an action the reader can take is a
  separate question, and a candidate for the next pass in this area.
- **The already-approved case still answers with a refusal, not an idempotent
  success**, exactly as u607 left it, and for the reason recorded there plus one
  more measured here: the success response reports the approver as the calling
  user, so answering success for an approval someone else recorded would
  misstate who approved it. That makes idempotency a provenance change, not a
  status-code change. Still a product call.
- **The committed coverage census is one behind its own tree on `main`, and this
  change does not correct it.** It has been so for five consecutive runs. This
  change adds no test file, so regenerating here would mean carrying a `+1`
  belonging to someone else's merge, and the audit states in its own output that
  the counts are a report rather than a gate. Left alone deliberately, and
  proven above to be the base's reading rather than this change's. The durable
  fix — having the gate accept a tree-derived regen, or serializing the write —
  needs a decision on which.
- **One pre-existing formatting warning in the changed suite is left as it
  is.** The file is not Prettier-clean on `main`, at a single hunk that this
  change does not touch; the formatter's requested change was diffed at the base
  and at this branch and is identical in both. Reformatting would pull unrelated
  churn into this diff.
- **The fifth value problem is narrowed, not closed.** The generic branch is now
  explicitly documented and tested as the last arm, so a value added to the
  column later is reported honestly rather than mislabelled — but it is still
  reported unspecifically. The structural fix is for the status domain and the
  write layer's eligible set to come from one declaration instead of two.
