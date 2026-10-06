# 2026-09-26-reconcile-register-silent — Report a register line that says nothing about the proof as its own state

## Release ID

`2026-09-26-reconcile-register-silent`

## Status

`candidate`

## Plain-English Summary

The signed-in-proof reconciler compares each release record's own account of its signed-in proof
against what the operator register says happened, joining the two on the pull request.

When register lines named the pull request but none of them said anything about a signed-in proof,
the reader set the register's account to `silent` — and then the comparison fell through every case
it has. `silent` is not `null`, not `conflicted`, not `obtained`, not `owed`, so the row reached the
default and came back **`agree`**. So *the register mentioned this release and said nothing about its
proof* was reported with the same word as *the register independently confirms what the record says*.

That is a false clean, which is the direction of error this module exists to avoid, and a false clean
is invisible. Measured on `origin/main` `2301644d9` with `--since 2026-09-19T00:00:00Z` over 220
records in the population: **34 rows** carried `registerSays: silent` and every one of them was
counted inside the 67 `agree`. After this change `agree` is 33 and `register-silent` is 34; the
34 rows that moved are the same 34, and no other row changed state.

**It is not folded into `no-register-line`.** The register did speak about this pull request, which is
a different fact from never having mentioned it, and the row now says which — it carries the deciding
line's stamp and identity so the line can be found and read.

**The 34 are two different defects, and the report says which per row rather than totalling them.**

- **`unread` — 22 of 34.** The deciding line HAS a sentence about a signed-in proof and this module's
  markers resolved no verdict from it. These are the expensive ones: one such line reports that the
  signed-in answer now carries the refreshed date — which reads like a run — against a record that
  says the replay did not run. That row is a candidate disagreement and it was reported as agreement.
- **`unmentioned` — 12 of 34.** No sentence in the deciding line mentions a signed-in proof at all.
  Some are deploy lines that legitimately had no proof to report; others owe a proof in words this
  reader does not recognise as signed-in, such as a positive live canvas readback being owed.

**No marker was loosened to resolve either kind.** An earlier item in this module records that
loosening a marker converts a refusal into a wrong answer. Both kinds are reported with the sentence
the deciding line offered, where there is one, and a human settles the row.

**A silent row is now given a deciding line, which it did not have before.** Previously a silent row
reported no stamp, no identity and no sentence, so a report that named 34 rows gave a reader nothing
to open. The choice uses the same two rules as any other deciding line — fewest other pull requests
first, then newest — because picking the newest silent line alone would usually pick a bulk citation
naming a dozen releases, and the row would then name a line that is not about it.

**A correction to the number as filed.** The item measured 33 rows at an earlier commit. The corpus
has since grown by one record in the population and the live count is 34. Stated here rather than
quietly reconciled, because the filed number is the one a reader will compare against.

## Layer Impact

Release lane: **`internal-admin`** — AbarVa-only operations tooling. Nothing here is client-facing and
nothing is feature-gated, because nothing in the product imports it.

- **Layer 4 — products:** none. No product surface, route, component or tenant read is touched.
- **Layer 3 — canonical model:** none. No schema, migration, projection or read model.
- **Platform tooling only:** one operator-facing reconciliation script and two behavioural suites.

The script reads release records from git and an operator-root register; it writes nothing.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — operator/agent release bookkeeping
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/signed-in-proof-reconcile.mjs` — new exported verdict `REGISTER_SILENT`, new silence
  kinds `UNREAD` and `UNMENTIONED`, and `silenceOf()`. `compareAccounts` reports a silent register
  account as its own state, read before the four comparisons because there is nothing to compare.
  `reconcileRecord` now chooses a deciding line among silent lines too, by the same
  fewest-pull-requests-then-newest rule factored out rather than written twice, and returns
  `registerSilence` alongside the line's stamp, identity and sentence. `reconcile` counts the new
  bucket; `formatReport` prints it ahead of `no-register-line`, names each row with its kind, its
  deciding line's coordinates and what the row would have read before this change, and reports the
  `unread`/`unmentioned` split as two numbers.
- `scripts/exec/signed-in-proof-reconcile.test.mjs` — 11 new cases.
- `scripts/exec/append-claim.test.mjs` — 1 new negative control on the other caller.

### The second caller, and what a writer-side check would have caught

`compareAccounts` is shared with `reviewReleaseLine`, the release-step half of this module, whose only
importer is `scripts/exec/append-claim.mjs`. So this change does move the writer's per-row verdict for
a quiet line — and it does not move what the writer *does*, for two reasons, both pinned by cases:
`contradicted` is the disagreements and a silence is not one, and `append-claim.mjs` short-circuits
above the review entirely when the line it is about to write reads `silent`.

That short-circuit is also the measured answer to the item's last question. **A writer-side check
would have caught 0 of the 34.** For every one of those 34 rows, *every* register line naming that
pull request reads `silent`, so at the moment each line was written the writer skipped the comparison
by design. The number is a measurement, not an inference: reproduced by walking the 34 rows'
matched lines and counting how many would have reached the comparison at all, which is zero.

The negative control for this is deliberately run against an **unreadable** checkout. Asserting
"nothing was printed" over a readable one proves nothing — a silence is not a contradiction, so
deleting the short-circuit prints nothing either and the case survives the only mutation it exists
for. Reaching the review at all over an unreadable checkout reports `UNDETERMINED`, which is the
observable difference, and that is what the case asserts.

## QA / Validation

Baseline measured in this run's own **clean worktree at `origin/main` `2301644d9`** before any edit —
not by stashing — over the same scope both sides.

- **Red first:** `scripts/exec/signed-in-proof-reconcile.test.mjs` — 78 passed / 0 failed at
  `origin/main`; 80 passed / **9 failed** with the 11 cases added and the fix not written; 89 passed /
  0 failed after. Two of the 11 pass on unfixed code **by design** and are named: the fixture
  PRECONDITION (both quoted register lines must parse, name exactly one pull request each, and both
  read `silent`, or every case below it would be testing some other state), and the regression guard
  that a silent row keeps `attribution: none`.
- **The attribution guard is load-bearing, not decoration.** `verdict` is overridden to
  `inexact-attribution` whenever attribution is inexact, so attributing a silent deciding line would
  have reported the silence as a batch-citation problem and hidden it a second time.
- **Mutation proof: 4 mutations, 4 caught, 0 no-op, 0 surviving.** Applied one at a time and reverted
  from a saved copy each time.
  1. The defect restored — the `silent` branch deleted from `compareAccounts`, so silence returns to
     `agree`: **8 of the 11 new cases red** (81 passed / 8 failed).
  2. `silenceOf` inverted, so a sentence-bearing silence classifies as `unmentioned` and vice versa:
     **exactly the two kind-specific cases red** (87 / 2) — the split is asserted, not merely
     printed.
  3. The silent deciding line picked by newest alone instead of fewest-then-newest: **1 red** (88 / 1)
     — the case pins the older exact line beating a nine-pull-request sweep, so "newest wins" fails.
  4. `append-claim.mjs`'s silence short-circuit removed: **the new negative control red** (70 / 1).
- **Every mutation was proven to change behaviour, not just the file.** Each was applied by a
  substitution whose match was verified present before and absent after, and each produced a
  different pass/fail count — so none of the four was a no-op reading as a catch.
- **Sibling suites, all green:** `append-claim` 71/0 (the importer), `toolchain-manifest` 17/0,
  `build-execution-queue` 194/0, `build-source-board` 84/0, `queue-provenance` 30/0,
  `register-time-authority` 311/0, `fossil-claims` 91/0, `register-citation-check` 22/0,
  `cli-entry` 34/0, `deploy-proof-resolver` 44/0, `worktree-retention` 27/0,
  `worktree-sweep-hazard` 38/0.
- **Pre-existing failure, not mine, and confirmed rather than assumed:** `id-collision.test.mjs` is
  69 passed / 1 failed on the case *"the reader classifies far more of the corpus as updates than as
  filings"*. Neither `id-collision.mjs` nor its suite is touched here, and the suite file is
  byte-identical to `origin/main`, verified by `diff` against `git show origin/main:`.
- ESLint clean on all three changed files. Typecheck is not affected — these are `.mjs` operator
  scripts outside the TypeScript project. `node scripts/release-check.mjs --base origin/main
  --head HEAD`: see the pull request.

## Rollout Plan

Merge to `main` through a pull request. The repo-owned ACA main deploy workflow builds and deploys the
digest-pinned image as it does for every merge. This change has **no runtime rollout**: nothing in the
deployed application imports either file.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
- Shared runtime mutators: none in this change
- Approved image digest: read from the deploy run keyed to this merge SHA
- ACA runtime invariant: verified post-merge from Azure, template image equals the 100%-traffic
  revision image
- Worker image invariant: not asserted by this release; the worker jobs are pre-existing and
  untouched, and nothing here reaches them
- Feature/env flag update path: none
- **Live signed-in proof required: NO, and none is owed.** One operator script and two test files. It
  reaches no route, no rendered component, no tenant data and no agent prompt, so there is nothing a
  signed-in session could observe.

## Rollback Plan

Revert the squash commit. No migration, no data change, no flag, no runtime dependency — a revert
restores the previous reader behaviour immediately and nothing else moves.

## Known Gaps

- **This makes 34 rows visible; it resolves none of them.** In particular the 22 `unread` rows each
  have a sentence about a signed-in proof that this reader could not resolve, and reading each one to
  decide whether it reports a run, a debt, or neither is per-row human work. Some of those will turn
  out to be real disagreements that were counted as agreement. Filed as its own item rather than
  attempted here, because resolving them by widening a marker is exactly the move an earlier item in
  this module records as converting a refusal into a wrong answer.
- **The report suggests no repair.** It names the kind, the deciding line's stamp and identity, and
  the sentence where there is one. It does not propose a marker, amend a record, or append a register
  line.
- **`--strict` is unchanged and still exits non-zero only on `disagree` or `ambiguous`.** A
  `register-silent` row is a row for a human to read, like `no-register-line`, not a gate; making 34
  rows fail a flag nothing in CI runs would be a threshold decision this item did not ask for.
- **The live population is not asserted by any test.** CI cannot read the operator root, so the 34,
  the 22/12 split and the 0-of-34 writer answer are operator-side observations quoted here. The rule
  itself is asserted over two real register lines quoted into the suite and over constructed
  registers — deliberate, because a case whose premise is a property of the live corpus goes red the
  moment the corpus improves, which reads as a regression and invites weakening the rule.
- **Two real records are named by the suite.** Two cases parse records committed to this repository
  and will fail if either is renamed, which is the existing convention in this suite: the assertions
  are about records, not about strings typed into a test.

## Audit Evidence

- Pull request URL and CI run: see the pull request.
- `node scripts/exec/signed-in-proof-reconcile.test.mjs` — 89 passed / 0 failed, and
  `node scripts/exec/append-claim.test.mjs` — 71 passed / 0 failed. CI runs both as their own
  required jobs in `.github/workflows/execution-queue-toolchain.yml`.
- The live per-row population is reproduced with
  `node scripts/exec/signed-in-proof-reconcile.mjs --register <operator register> --since 2026-09-19T00:00:00Z`,
  which now prints a `register-silent` section row by row with each row's kind, its deciding line's
  stamp and identity, and the sentence where there is one. CI cannot see the operator root, so that
  output is an operator-side observation and is summarised above rather than asserted by a test.
  Register sentences are otherwise deliberately kept out of this record.
- Before/after counts on the same corpus and window: `agree` 67 → 33, `register-silent` 0 → 34,
  `disagree` 0 → 0, `ambiguous` 9 → 9, `no-register-line` 85 → 85, `inexact-attribution` 59 → 59.
  Exactly 34 rows changed state and all 34 moved from `agree` to `register-silent`.
