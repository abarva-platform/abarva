# 2026-09-26-reconcile-inexact-attribution — Report inexact register attribution as its own state

## Release ID

`2026-09-26-reconcile-inexact-attribution`

## Status

`candidate`

## Plain-English Summary

The signed-in-proof reconciler compares each release record's own account of its signed-in proof
against what the operator register says happened. To find the register's account it matches on the
pull request, and when several register lines name that pull request it prefers the line naming the
**fewest** other pull requests — because a line naming only this pull request is about this pull
request, while a line naming ten is citing it.

That preference was right and is unchanged. What was missing is the case where the winner of the
preference still names more than one. The reconciler already counted how many pull requests the
deciding line named, and then discarded the number — so a verdict drawn from a line about one
release was indistinguishable from a verdict drawn from a bulk citation that happened to mention it.

Each row now carries an explicit `attribution` of `exact`, `inexact` or `none`, and a row decided by
a line naming more than one pull request reports `inexact-attribution` as its own state instead of
handing back a verdict that reads as a judgement about that record. **The row is not dropped**: the
comparison it would otherwise have reported is retained as `comparedVerdict`, because a line naming
two releases may well be about both, and a reader who establishes that recovers the verdict without
re-running anything.

The measured answer to the item's second half, per row rather than as a count: over 218 records in
the population, **59 rows rest on a register line naming more than one pull request** — 8 on a line
naming 2, 4 on a line naming 6, 3 on a line naming 14, 21 previously reported `agree` by a line
naming **118**, and 23 previously reported `ambiguous` by a line naming **190**. Those rows are now
named individually in the report with the count that decided each one, so the magnitude is visible:
2 and 190 are the same state and are not remotely the same evidence.

One of those rows is worth quoting as the reason the state is needed. A record about an evidence-read
resilience change took its verdict from a register line whose only proof sentence is about catalog
controls on unmounted components — a line that names 14 pull requests and is an account of none of
them. The old report presented that as `agree`.

**A correction to the item as filed, which is the honest part of this change.** The item names its
live consequence as the tenth member of an earlier disagreement population. That population was
repaired before this ran, so the corpus now reports `disagree 0` and the filing's own example no
longer exists. The rule is therefore asserted over constructed registers rather than over that
disagreement: a suite whose premise is "the live corpus contains a disagreement decided by a
multi-pull-request line" goes red the moment the corpus improves, which reads as a regression and
invites weakening the rule. The live magnitude is recorded here as an observation, where improving it
is progress rather than a failure.

## Layer Impact

Release lane: **`internal-admin`** — AbarVa-only operations tooling. Nothing here is client-facing
and nothing is feature-gated, because nothing in the product imports it.

- **Layer 4 — products:** none. No product surface, route, component or tenant read is touched.
- **Layer 3 — canonical model:** none. No schema, migration, projection or read model.
- **Platform tooling only:** one operator-facing reconciliation script and its behavioural suite.

The script reads release records from git and an operator-root register; it writes nothing.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — operator/agent release bookkeeping
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/signed-in-proof-reconcile.mjs` — new exported states `EXACT`, `INEXACT`,
  `UNATTRIBUTED` and verdict `INEXACT_ATTRIBUTION`; new `attributionOf()`; `reconcileRecord` returns
  `attribution` and `comparedVerdict`; `reconcile` counts the new bucket; `formatReport` prints the
  bucket second (ahead of `ambiguous`) and, per row, how many pull requests decided it and what the
  comparison alone would have read.
- `scripts/exec/signed-in-proof-reconcile.test.mjs` — 11 new cases.

`reviewReleaseLine`, the release-step half of this module and its only importer elsewhere
(`scripts/exec/append-claim.mjs`), is deliberately unchanged: it does no pull-request matching at
all, because its caller already knows which records the release is about. A negative control pins
that, so attribution cannot leak into the writer.

## QA / Validation

Baseline measured in a **separate clean detached worktree at `origin/main` 2e91a64ec**, not by
stashing, over the same scope both sides.

- **Red first:** `scripts/exec/signed-in-proof-reconcile.test.mjs` — 67 passed / 0 failed at
  `origin/main`; 69 passed / **9 failed** with the cases added and the fix not written; 78 passed /
  0 failed after. Two of the 11 new cases pass on unfixed code **by design** and are named: the
  fixture PRECONDITION (it asserts the constructed register parses into lines naming 1, 2, 2, 1 and
  12 pull requests, so no case below passes for the wrong reason), and the NEGATIVE CONTROL that the
  writer is untouched — an over-broad fix that leaked attribution into `reviewReleaseLine` breaks it.
- **Mutation proof: 11 mutations, 11 caught, 0 no-op.** Applied one at a time, and **each edit was
  proven to have changed the file by comparing its sha256 before and after**, so a no-op could not
  read as a catch. The source file was restored to its pre-mutation digest
  `8af2262a4ccda0d16e9dfdd35b77c920feb434a2938b5cd76e44db04fe20c2f4` at the end. The mutations: the
  bound off by one (`>1` to `>2`); over-broad (`>=1`, every attributed line inexact); the defect
  itself restored (verdict ignores attribution); no-line reading as exact; `comparedVerdict`
  withheld, i.e. the row dropped; the report note withheld; the magnitude hardcoded; the bucket left
  out of the counts; **rule 1 inverted** to prefer the line naming the most pull requests; the bucket
  computed but never printed; attribution leaked into the writer.
- **One mutation SURVIVED first and it was a real hole in my test, reported rather than smoothed.**
  Replacing `row.registerLinePullRequests` with the literal `2` in the report passed, because the
  single row the case was shown happened to have that value — a printed constant is indistinguishable
  from a measurement when the expected value is the constant. The case now asserts over a report
  containing a 2 **and** a 12, so no constant satisfies it; that mutation is caught, giving 11 of 11.
- **Sibling suites, all green:** `append-claim` 70/0 (the importer), `toolchain-manifest` 17/0,
  `build-execution-queue` 194/0, `build-source-board` 84/0, `queue-provenance` 30/0,
  `register-time-authority` 311/0, `fossil-claims` 91/0, `register-citation-check` 22/0,
  `cli-entry` 34/0, `deploy-proof-resolver` 44/0, `worktree-retention` 27/0,
  `worktree-sweep-hazard` 38/0.
- **Pre-existing failure, not mine, and confirmed rather than assumed:** `id-collision.test.mjs` is
  69 passed / 1 failed on the case *"the reader classifies far more of the corpus as updates than as
  filings"* — **identically** in the clean `origin/main` baseline worktree. Untouched here.
- Typecheck, ESLint and `node scripts/release-check.mjs --base origin/main --head HEAD`: see the
  pull request.

## Rollout Plan

Merge to `main` through a pull request. The repo-owned ACA main deploy workflow builds and deploys
the digest-pinned image as it does for every merge. This change has **no runtime rollout**: nothing
in the deployed application imports either file.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
- Shared runtime mutators: none in this change
- Approved image digest: read from the deploy run keyed to this merge SHA
- ACA runtime invariant: verified post-merge from Azure, template image equals the 100%-traffic
  revision image
- Worker image invariant: not asserted by this release; the worker jobs are pre-existing and
  untouched, and nothing here reaches them
- Feature/env flag update path: none
- **Live signed-in proof required: NO, and none is owed.** This change touches one operator script
  and its test file. It reaches no route, no rendered component, no tenant data and no agent prompt,
  so there is nothing a signed-in session could observe.

## Rollback Plan

Revert the squash commit. No migration, no data change, no flag, no runtime dependency — a revert
restores the previous reader behaviour immediately and nothing else moves.

## Known Gaps

- **This makes 59 rows visible; it does not resolve them.** Deciding which register line each of
  those rows should actually have been read against is per-row human work, and 46 of the 59 are
  decided by lines naming 118 or 190 pull requests, which are almost certainly about none of them.
  Nothing here repairs a record or appends a register line.
- **A silent register line still reads as agreement.** 33 rows in the population have register lines
  that name their pull request and say nothing at all about a signed-in proof; `registerSays` is
  `silent` and `compareAccounts` returns `agree`. That is out of this item's scope — it is a question
  about the comparison rule, not about attribution — and it is filed separately rather than fixed
  here. The new `attribution: none` state keeps those 33 distinguishable from the 84 rows the
  register never mentions at all, which is the part this change owed them.
- **No bound was swept.** The rule is "more than one", taken from the item, not a magnitude
  threshold chosen from the corpus. A line naming 2 and a line naming 190 get the same state, and the
  report prints the count per row so a reader can tell them apart. If a threshold is ever wanted, the
  distribution above is the evidence for choosing one.
- **The live population is not asserted by any test.** CI cannot read the operator root, so the 59
  and its distribution are an operator-side observation quoted here. The rule itself is asserted over
  constructed registers, which is deliberate: a case whose premise is a property of the live corpus
  goes red when the corpus improves.

## Audit Evidence

- Pull request URL and CI run: see the pull request.
- `node scripts/exec/signed-in-proof-reconcile.test.mjs` — 78 passed / 0 failed. CI runs this file as
  its own required job in `.github/workflows/execution-queue-toolchain.yml`.
- The live per-row population is reproduced with
  `node scripts/exec/signed-in-proof-reconcile.mjs --register <operator register> --since 2026-09-19T00:00:00Z`,
  which prints the `inexact-attribution` section named row by row. CI cannot see the operator root,
  so that output is an operator-side observation and is quoted above rather than asserted by a test.
- Known gap, stated rather than hidden: this makes the 59 rows **visible**; deciding which register
  line each one should actually have been read against is per-row human work this does not do.
