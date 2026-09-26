# 2026-09-26-t481-home-executive-id-leak-behavioral-proof — the executive Home surface proves it hides internal evidence keys by rendering

## Release ID

`2026-09-26-t481-home-executive-id-leak-behavioral-proof`

## Status

`candidate`

## Plain-English Summary

The Home executive surface cites its evidence as a reader-facing count — "14 governed references" —
rather than printing the internal keys the record uses to identify that evidence. That is a real
control, and it had a guard. The guard did not work, and this change replaces it.

The old guard read three component files as text and asserted two things: that a doc comment saying
raw ids do not appear on the executive surface was present, and that one particular spelling of the
leak was absent. Both directions of that were measured on an unmodified tree before anything was
written here:

- Replacing the governed summary with a join of the cited identifiers — the actual leak, raw
  internal keys on the executive sidenote — left all three cases **green**, because the spelling
  used was not the one the assertion named.
- Rewording the doc comment turned the guard **red** while behaviour was byte-for-byte identical in
  effect.

A control that misses the defect it is named for and fires on a comment edit is not a control. The
property is now proved over behaviour: a new suite calls the same resolution the surface calls,
renders the two components that print it, and asserts the identifier is absent from what a reader
would see. A leak fails it however it is spelled, because the identifier itself is what it looks for.

No product code changed. This is a test-instrument change only.

## Layer Impact

- Lane: `global-control-lane`
- Layer 4 (Products — Home): the control that keeps internal evidence keys off the executive Home
  surface is now enforced by rendering that surface, not by matching bytes of its source. No
  rendered output, route, or component behaviour changes.
- Layers 1–3 (client intake, source adapters, canonical model): untouched. No schema, loader,
  projection, migration, or dataset change.

## Client Applicability

- All clients: Yes in the sense that the control now covers every reviewed Home golden bundle, and
  the tenant list is read from the module that declares it rather than written out here. No client
  sees any behaviour change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None. Tests only; nothing gated.

## Changes Included

- Added `src/components/home/v4/__tests__/executive-surface-raw-id-leak.test.tsx` — six cases, all
  behavioural: the claim path (`claimSource`), the exhibit path (`sourceForIds`), the unresolvable
  citation (`resolveEvidence`), the rendered record band sidenote (`RecordBand`), the rendered
  expanded evidence list (`ClaimCard`), and a case that asserts the population the others iterate.
- `src/app/(maestro)/home/__tests__/home-layer-boundary-contract.test.ts` — the byte-matching case
  is removed and replaced with a comment naming where the property is now proved and why a
  source-text assertion must not be re-added for it. The suite's other two cases are untouched and
  remain open under the same item.

## QA / Validation

**Red first, in the form this item's acceptance prescribes.** The acceptance for this row is the
mutation: re-apply the leak and require the replacement to go red. Eight mutations were applied one
at a time to product code — never to a test — each verified to have actually changed the file before
the suites were run. Both the new suite and the old byte-scan case were run under every one.

| # | Mutation (product code) | New behavioural suite | Old byte-scan case |
|---|---|---|---|
| — | none (baseline) | 6 passed of 6 | 3 passed of 3 |
| M1 | evidence summary replaced with `evidenceIds.map(String).join(", ")` | **4 failed of 6** | 3 passed — blind |
| M2 | same leak, in the one spelling the byte-scan named | **4 failed of 6** | 1 failed of 3 |
| M3 | claim-card label replaced with the key via a template literal | **1 failed of 6** | 3 passed — blind |
| M4 | resolver's unresolved statement prints the key, re-spelled | **2 failed of 6** | 3 passed — blind |
| M5 | record-count line replaced with the raw reference list | 6 passed — see below | 3 passed |
| M6 | doc comment reworded, behaviour identical | 6 passed — correct | **1 failed of 3 — false positive** |
| M7 | source references emptied, so the reference branch renders over nothing | **1 failed of 6** | 3 passed |
| M8 | claim-card label replaced with the key via `String()`, a third spelling | **1 failed of 6** | 3 passed |

Seven of eight caught. M1, M3, M4 and M8 are the four the old guard could not see, and M1 is the
exact leak the old case was named for. M6 is the false positive, now a non-event. M7 is the
self-check: it blinds the population that one case iterates and that case fails, so the population
assertions are live rather than decorative.

**M5 is recorded as out of scope, not as a gap.** It changes what a record-count line summarises
from a count to the list of source references behind it. Those are register values, not internal
keys — a claim's own prose may legitimately name one — so asserting their absence would pin a
design choice as a control, and the property under test here is the internal key. Stated rather than
quietly asserted, and stated rather than quietly omitted.

**The first draft of the new suite had a vacuous assertion, and it is worth recording.** Its
reference-leak check iterated the evidence references of a claim that had none, so it asserted
nothing — the same failure this item exists against, in a different costume. M5 surviving is what
exposed it. Every loop now asserts how many times it ran, one case selects a claim whose evidence
genuinely carries references so the branch renders, and M7 proves those assertions fire.

**Scoped baselines, measured in a separate clean worktree at the same base commit — not a stash.**

| scope | before (`fb433aa90`) | after |
|---|---|---|
| the two directly affected suites | 3 suites / 11 tests / 0 failing | 3 suites / 8 tests / 0 failing (+1 new suite of 6) |
| `src/__tests__/behaviors` | 139 suites / 1348 tests / **0 failing** | 139 suites / 1348 tests / **0 failing** |
| `src/components/home` + `src/app/(maestro)/home` + `src/lib/home` | 78 suites / 733 tests / **11 suites, 26 tests failing** | 79 suites / 739 tests / **11 suites, 26 tests failing** |

The 26 failures in the wider Home scope are pre-existing and not caused here: the failing suite sets
at the base commit and at this branch head are identical, compared path by path, with only elapsed
times differing. They are outside this item's acceptance and are not claimed as fixed.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
  `tsconfig.tsbuildinfo` deleted first — **exit 0**, judged by exit code rather than by grepping for
  `error TS`.
- `npx eslint` on both touched files — exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — recorded in the pull request.

## Rollout Plan

Merge to `main` through a pull request and squash merge. The repo-owned Azure Container Apps main
deploy workflow publishes the digest-pinned image as it does for every merge. Nothing in this change
is reachable from a product surface at run time, so there is no separate activation step, no
migration, and no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none. No Azure command is run by hand for this change.
- Approved image digest: resolved by the deploy workflow after merge.
- ACA runtime invariant: proven after deploy — Container App template image, the 100%-traffic
  revision image and the required worker job images all on the same digest, read-only.
- Worker image invariant: same digest as the web template, verified read-only.
- Feature/env flag update path: none.
- Live signed-in proof required: **No.** Test files only; no route, component output, or rendered
  copy changes, so there is nothing a signed-in session could observe that it could not observe
  before.

## Rollback Plan

Revert the pull request. The only consequence is that the property returns to being unguarded, since
the guard being removed here was measured not to hold it. No data, migration, or runtime state is
involved.

## Audit Evidence

- The pull request and its CI run, recorded in the register entry for item `T-481`.
- The mutation table above: each row is reproducible by applying the named edit to product code and
  running the two suites named.
- `docs/architecture/t479-stale-suite-triage.json`, row 2 of the `T-479` draw, which records the
  original measurement that mutation `M4` survived at that base commit. That record is a snapshot of
  its base commit and is deliberately not restamped here.

## Known Gaps

- **Item `T-481` is not closed.** This change takes row 2 of the `T-479` draw and the one case its
  acceptance names. Still open under the same item: rows 1, 13 and 18 of that draw — row 18 being
  eighty-eight regex cases over five files — and the two remaining byte-matching cases in the
  layer-boundary contract (a filesystem-boundary scan and a diagnostics-flag scan), neither of which
  has a demonstrated blind spot but both of which read bytes.
- Neither suite touched here runs in CI. The directory is named by a ratchet baseline that spells it
  with an unescaped parenthesised segment, which jest reads as a capture group, so the baseline
  matches a path that does not exist. That is a separate open item and is deliberately not fixed
  here.
- The record-count summarisation described under M5 is covered by no control. Recorded, not filed:
  it is a design choice about register values, not a governed property, and the decision of whether
  it should become one is not this item's.
