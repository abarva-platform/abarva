# 2026-10-06-moves-phase-gate-working-document-split — a phase gate stops being refused over a document it never reads

## Release ID

`2026-10-06-moves-phase-gate-working-document-split`

## Status

`candidate`

## Plain-English Summary

A Move advances one phase at a time through a single control: "Approve & Build".
It builds that phase's documents, waits for every one of them to finish, and then
submits the phase gate approval. Until this change, if **any** document in the
batch failed or was held below its quality bar, the workspace refused to submit
the gate at all, and told the reader to fix that document and re-run.

Not every document in a phase's build set is gate evidence. Every phase from P1
to P5 declares working documents beside its gate artifacts — a plan, a worksheet,
a workshop guide — and the deliverable registry marks them `gateArtifact: false`.
No gate check in `governance.ts` reads any of them. The design check that comes
closest resolves an alternatives list which the phase's own gate artifact already
satisfies.

So the workspace was strictly stricter than the governed gate it was asking. A
working document that failed for its own reasons — a workshop guide over-running
its length ceiling is the case that has actually been observed — blocked the one
forward control the phase has, over a document the server would never have asked
about. The reader was then pointed at a re-run that could not help, because
re-running it reproduces the same ceiling.

After this change the refusal is scoped to the documents the gate reads. A failed
gate artifact still refuses the submission, with a sentence that says which
documents the gate reads and why the re-run is the right next step. A failed
working document does not refuse — it is named, both in the status line the reader
sees and in the rationale carried into the approval record, so the failure is
stated rather than skipped. The governed gate on the server is unchanged and
remains the decision.

## Layer Impact

**Release lane: `global-control-lane`.** The behaviour is shared phase-workspace
logic for every client with a Move in P1–P5. It is not feature-gated and not
client-scoped.

- **Layer 4 — products (Moves).** The phase workspace's client-side refusal
  before submitting a gate approval is narrowed. One new pure module owns the
  decision; the two components that produce and consume the settled batch are
  wired to it.
- Layers 1–3 untouched. No intake, adapter, canonical-model, schema, migration or
  projection change. No new read of tenant data: the gate-artifact flag the split
  keys on already travelled from the deliverable registry through the existing
  build-enqueue response.
- **Server-side governance is untouched.** `phase-gate-approval` and
  `governance.ts` are not modified. A gate the server refuses is still refused;
  this only stops the client declining to ask.

## Client Applicability

- All clients: yes. Any Move whose phase build set contains a working document —
  which is every phase P1 through P5 — can now reach its gate when only that
  document failed.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is inside the existing settle path and applies
  on both the redesigned 3-step capture flow and the legacy canvas, because both
  route their gate submission through the same callback.

## Changes Included

- **Added** `src/lib/programs/phase-build-settlement.ts` — `classifyPhaseBuildSettlement`,
  a pure function over the settled batch. Returns the two failure sets split by
  the registry's `gateArtifact` flag, the refusal sentence when one is owed, and
  the caveat sentence when the submission proceeds with a working document
  missing. A new module rather than a condition inside the 10k-line phase
  workspace, both to keep the decision testable on its own and to avoid a
  collision in a hot shared file.
- **Modified** `src/components/strategic-moves/PhaseApproveAndBuild.tsx` —
  `BuildSettledResult` now also carries `succeeded` and `failed` as per-key
  records with the registry's `gateArtifact` flag. The existing `succeededKeys` /
  `failedKeys` lists are unchanged in content and shape, so no existing reader
  moves. The flag is already on every row (seeded from the registry spec, and
  echoed by the enqueue response), so nothing new is fetched.
- **Modified** `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` —
  `approvePhaseGateAfterBuild` resolves the classifier instead of testing
  `failedKeys.length`. Its two synthetic callers (the P0 gate, whose evidence is
  the origination brief, and the gate-only path for a phase whose outputs were
  already built) settle as one succeeded gate artifact. The approval rationale
  appends the caveat when there is one.
- **Added** `src/lib/programs/__tests__/phase-build-settlement.test.ts` — 13
  cases. Placed in a directory swept by CI.
- **Modified** `src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx`
  — one added case pinning the wiring: that the callback argument really carries
  the per-key flag, and that feeding the real argument through the classifier
  yields no refusal for a blocked working document.
- **Regenerated** `docs/architecture/test-ci-coverage-census.json`.
- **Added** this release record.

## QA / Validation

| Check | Result |
|---|---|
| `npx jest src/lib/programs/__tests__` (whole directory) | **PASS** — 122 suites / 1241 tests, 0 failing |
| `npx jest src/components/strategic-moves/__tests__` (whole directory) | **PASS** — 42 suites / 593 tests, 0 failing |
| `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | **PASS** — exit 0 |
| `npx eslint` over the five changed files | **PASS** — 0 errors. Two `no-unused-vars` warnings in the phase workspace were measured on the unmodified base first and are pre-existing, not introduced here. |
| `npm run release:check -- --base origin/main --head HEAD` | see below |
| Live signed-in walk | **NOT RUN** — see Deployment Authority. |

Both directories were run whole, not only the related suites: the change edits a
callback contract two hosts implement, and a host refactor's blast radius is not
confined to the suites named after the files touched.

**The suites can fail.** Eleven mutations, each applied by a helper that refuses
unless its pattern occurs exactly once in the target file, so a mutation that
silently edits nothing cannot read as a survivor. The tree was staged before
mutating and each mutation was restored from a byte-compared backup.

Eight against the classifier, run against `phase-build-settlement.test.ts`:

| # | Mutation | Result |
|---|---|---|
| 1 | Gate/working split inverted | **KILLED** — 4 of 13 failed |
| 2 | A failed gate artifact never refuses | **KILLED** — 3 of 13 failed |
| 3 | The refusal names every failed key, not just the gate ones | **KILLED** — 1 of 13 failed |
| 4 | The nothing-built refusal removed | **KILLED** — 1 of 13 failed |
| 5 | Plural helper always returns the singular | **KILLED** — 3 of 13 failed |
| 6 | The caveat is always absent | **KILLED** — 3 of 13 failed |
| 7 | The refusal hard-codes a phase number | **KILLED** — 1 of 13 failed |
| 8 | The caveat hard-codes a phase number | **KILLED** — 1 of 13 failed |

Three against the wiring, run against `phase-approve-and-build-settle.test.tsx`:

| # | Mutation | Result |
|---|---|---|
| 9 | Every failed key reported as a gate artifact | **KILLED** — 1 of 11 failed |
| 10 | Every succeeded key reported as a working document | **KILLED** — 1 of 11 failed |
| 11 | The failed array reported empty | **KILLED** — 1 of 11 failed |

Mutations 3, 4, 7, 8 and 9–11 each kill exactly the case written for them, so no
case passes on a neighbour's assertion.

One expectation is deliberately written as a literal rather than derived: the
per-phase list of documents no gate check reads. An expectation read off the
declaration under test cannot see that declaration change, and the whole split
rests on which documents carry the flag. If a phase's working documents are
re-declared as gate artifacts, that case fails and the split has to be
re-justified rather than quietly widening.

**Census.** Re-measured on the merged base, because the first measurement went
stale: a sibling merged into `main` while this branch was being validated, and
the base this branch now sits on is that merge. Measured in a **separate,
pristine `origin/main` worktree** rather than by stashing in this tree — a stash
taken mid-merge also removes the sibling's files and the resulting count cannot
be attributed. Regenerating in that pristine worktree produces **no change at
all**, so `main`'s committed census (2758 / 2594 / 2593) is current and the +1
standing drift that earlier runs of this lane recorded has been absorbed. This
branch regenerates to 2759 / 2595 / 2594 — exactly +1 on all three, which is the
one test file it adds — with `uncoveredTestFiles` unchanged, which is the proof
that the new suite is swept by a CI job rather than merely present.
`audit:tenancy-fence-coverage:write` produced no change.

The new suite's directory, `src/lib/programs/__tests__`, is swept wholesale.
`src/components/strategic-moves/__tests__` is not — its suites are named one by
one in `.github/workflows/ai-surface-control-catalog.yml`. No new file was added
there; the wiring case was added to a suite already named at that step, so no
registration change is owed and no suite is left dark.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA deploy workflow builds and deploys
the merge commit as it does every merge. No migration, no flag, no env var, no
worker job, no image pin change. The change is client-side logic in an existing
bundle and takes effect with that deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — this release pins no image and changes
  no runtime template.
- ACA runtime invariant: not applicable; nothing here mutates shared web traffic,
  revision weights or the web Container App template.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof required: **yes**, and it is **NOT RUN** here. This
  release may say `merged` and, after the deploy workflow, `deployed`. It may not
  say `live-proven`. A signed-in walk is a human step this lane does not take.

## Rollback Plan

Revert the merge commit. The restored behaviour is the previous blanket refusal:
a gate submission declined whenever any document in the batch failed. Nothing
persists from this change — it writes no row, no migration, no flag and no
artifact. The one trace it leaves on a Move that advanced under it is the caveat
sentence appended to that phase's approval rationale, which is additive text in
an existing record and is not read by any gate check, so a revert leaves it
readable and harmless.

There is no partial-rollback hazard. Reverting only `phase-build-settlement.ts`
without the two component edits would not compile, so the revert is of the whole
merge commit.

## Audit Evidence

- `src/lib/programs/phase-build-settlement.ts` — the module's own comment records
  the measurement the split rests on: which keys carry `gateArtifact: false` per
  phase, and that no gate check reads them.
- `src/lib/programs/__tests__/phase-build-settlement.test.ts` — the per-phase
  literal list, and the refusal and caveat cases.
- `src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx`
  — the wiring case, which drives a real two-document batch through the enqueue
  and poll routes and asserts the callback argument.
- The mutation tables above. Reproducible: apply the listed mutation, rerun the
  named suite.
- The approval rationale written by the phase workspace now carries the caveat
  text, so a Move that advanced with a working document missing says so in its
  own approval record.

## Known Gaps

- **The working document is still missing and this change does not build it.** It
  names the gap and lets the phase advance. Why a given working document failed —
  a length ceiling on a workshop guide is the known case — is a separate, open
  question about those documents' quality bars, not something this release
  addresses or claims to.
- **No live signed-in walk.** The behaviour is proven by component-level
  execution of the enqueue and poll routes against stubbed fetches, not by a
  signed-in session. That proof is owed and is a human step.
- The `succeeded.length === 0` refusal is deliberately left as it was, keyed on
  the whole batch rather than narrowed to gate artifacts. Narrowing it would be a
  new refusal — a phase whose gate artifact was built in an earlier batch and
  omitted from this one would start being blocked — and this release only
  loosens. The server gate remains the authority on whether the gate document is
  actually signed off, and refuses with its own precise reason when it is not.
- The two synthetic callers settle as a single `gateArtifact: true` record under
  a placeholder key. That is faithful for both (P0's gate evidence is the
  origination brief; the gate-only path's outputs were already built and
  approved) but it means neither exercises the split. Both are covered only by
  the existing cases for their own paths.
