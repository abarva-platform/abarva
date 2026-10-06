# Source — a generated purpose fallback stops reading as the contract headline

## Release ID

2026-10-05-contract-headline-generated-fallback

## Status

Merged — not deployed and not live-proven by this record.

## Plain-English Summary

When a contract has no reviewed purpose, the database builds its story headline from a template:
`<vendor name>: contract purpose …`. The contract page is supposed to refuse that and show the
contract's own name instead, because a sentence about the *absence* of a reviewed purpose is not a
headline.

It was not refusing it. The page checked two things — that the headline was 60 characters or fewer,
and that it did not match a list of phrasings — and the current template defeats both:

- A later migration **reworded the template**. Two earlier migrations emit `contract purpose is not
  yet reviewed.`, which the phrasing list blocks. The current one emits `contract purpose requires
  reviewed context.`, which no listed phrase matches.
- The reworded sentence is **58 characters** for a short vendor name, so it passed the length gate
  too.

So the sentence rendered as the page heading. The defect was also **length-dependent**, which is why
it appeared on some contracts and not others:

| Vendor name | Emitted headline | Length | Outcome before |
|---|---|---|---|
| IMS Health | `IMS Health: contract purpose requires reviewed context.` | 55 | rendered |
| Kyndryl, Inc. | `Kyndryl, Inc.: contract purpose requires reviewed context.` | 58 | rendered |
| Databricks, Inc. | `Databricks, Inc.: contract purpose requires reviewed context.` | 61 | blocked by length, by accident |

The new control keys on the **generator's shape** — `<vendor>: contract purpose …` — rather than on
its wording, so rewording the tail again cannot defeat it. That is the specific way the previous
guard rotted: it listed phrasings, somebody else's migration changed the phrasing, and the guard
went quiet without anything failing.

## Layer Impact

Release lane: **global-control-lane**.

Layer 4 (product) only. One control added to `src/lib/source/contract-purpose-refusal.ts`, applied
in the contract header. No schema change, no migration, no read-model change, no change to what is
stored. The pre-existing phrasing check is **kept**, not replaced — this is an added condition.

## Client Applicability

**All clients**, through the shared global control lane, with no per-client gating and no feature
flag. Visible on any contract whose stored purpose summary is empty.

## Changes Included

- `src/lib/source/contract-purpose-refusal.ts` — `isGeneratedPurposeHeadline` and the two template
  tails the migrations emit.
- `src/app/(maestro)/source/preview/workspace/Contract360Surfaces.tsx` — the header applies it.
- `src/__tests__/behaviors/source-contract-headline-generated-fallback.test.ts` — new suite.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

| Check | Status |
|---|---|
| New suite | PASS — 10 cases |
| Pre-existing workspace suites | PASS — 37 suites, 340 tests, no regression |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| Mutation — header stops calling the control | PASS — failed as intended |
| Mutation — control always returns false | PASS — 6 cases failed as intended |
| Mutation — key on the exact tails, not the shape | PASS — failed as intended, **after a gap was closed** |
| Mutation — drop the vendor-less branch | PASS — 2 cases failed as intended |
| ESLint, `audit:lib-orphans`, census check | PASS |
| Signed-in acceptance | NOT RUN |

Two measurement notes worth recording, because both nearly produced a false result:

- **A suite-directory run reported nothing and read as success.** `jest "src/app/(maestro)/…"` matches
  0 tests, because the parentheses in `(maestro)` are parsed as a regex group. Escaped, the same
  path runs 37 suites and 340 tests. A silent pass from that pattern measures nothing.
- **The mutation that keys on the exact tails instead of the generator's shape initially survived.**
  The novel-tail case was being answered by the vendor-name branch, so nothing exercised the shape
  match on its own. The suite now pins each branch with the other *not* satisfying it, and the
  mutation fails. The control was already correct; the test was not measuring it.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration,
no data step, no migration.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. The header returns to showing the generated sentence on contracts with no
reviewed purpose; nothing else depends on the control.

## Audit Evidence

- The suite asserts the two template tails against the **migration files that emit them**, so the
  fixture is the string the database actually produces rather than a paraphrase of it. A guard
  tested against invented text is what failed here.
- A mutation that narrows the control back to a fixed list of phrasings fails, which is the specific
  regression that produced this defect.

## Known Gaps

- **The stored value is unchanged.** The database still generates the template sentence; this
  refuses it at the read path. Fixing the generator needs a migration, which is authored-and-applied
  work and not done here.
- The Story tab still carries the full generated text, which is deliberate — the header is the
  surface where it misreads as a finding.
- The contract page shows no explicit "purpose not yet reviewed" state in place of the refused
  headline; it falls through to the contract name. Surfacing the unreviewed state as a basis
  indicator is a separate slice.
- Not deployed and not live-proven. No signed-in readback. Backlog item A6 covers the wider
  "template text in titles and Story" failure; this closes the header half of it.
