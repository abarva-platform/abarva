# 2026-09-25-c517-shaper-single-brand-rewrite — One brand rewrite in the shared response shaper, and its position pinned

## Release ID

`2026-09-25-c517-shaper-single-brand-rewrite`

## Status

`candidate`

## Plain-English Summary

The user-facing assistant identity is `aVa`. An internal engine name must never reach the screen,
and the shared response shaper — the layer every advisor answer passes through — rewrote those
names twice: once before it compacts the answer, and once again at the very end.

The previous release found that removing the second rewrite left every existing test passing, and
deliberately did not act on that. A test that stays green when you delete something tells you the
thing is unguarded; it does not tell you the thing is useless. The second rewrite ran on text the
first had never seen — after the labels were substituted, after raw identifiers were stripped,
after the answer was compacted — so if any of those steps could expose a name the first pass could
not match, the second pass was doing real work and what was missing was a test, not a line.

That question is now settled by search rather than by sample. Whether a name is "visible" to the
rewrite depends on exactly one character on each side of it, so sweeping every printable character
on both sides is a complete answer to "can a later step expose a name", not a spot check — and the
sweep is repeated once inside each step in the window, with a check that each of those inputs
really does reach the step it was written for. Over 297,825 constructed answers, removing the
second rewrite changed the delivered text in **zero** of them, while 33,792 of those answers
carried a name the rewrite had to remove. Remove **both** rewrites and 33,738 answers leak a name,
in every one of the eleven inputs — so the sweep has teeth everywhere it claims to.

So the second rewrite is deleted, and the search that settled it ships as a permanent test.

The more valuable half of this change is not the deleted line. It is that the surviving rewrite's
**position** is now pinned. `aVa` is two characters shorter than the name it replaces, and the
compactor's budget is measured in characters, so an answer that is over budget with the name and
under budget without it must come back whole rather than summarised. Nothing asserted that before:
on the previous commit, deleting *either* rewrite left 59 of 59 tests passing, so the property was
attributable to neither, and moving the rewrite to the far side of the compactor was invisible.
After this change, deleting the rewrite fails 15 of 63 tests and moving it across the compactor
fails a test written for exactly that.

Nothing a user sees changes. The delivered answer is identical, character for character, on every
one of the 297,825 inputs measured.

## Layer Impact

Release lane: `global-control-lane` — shared answer-shaping behavior for all clients, not
feature-gated. It ships in that lane because the code path is shared; the observable change in it
is none.

- **Layer 4 — Products (shared advisor answer shaping).** One redundant text rewrite removed from
  `src/lib/answer/shared-response-shaper.ts`. Output is byte-identical over the measured corpus; no
  behavior change.
- **Layers 1–3 (client intake, source adapters, canonical model).** Untouched. No tenant data,
  schema, loader, migration or projection is involved.

## Client Applicability

- All clients: yes — the shared shaper is on every advisor answer path — but the observable change
  is none.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is proven output-identical, so gating it would gate nothing.

## Changes Included

- `src/lib/answer/shared-response-shaper.ts` — the second `BANNED_BRAND_RE` application, inside the
  trailing `normalizeWhitespace(normalizeAssemblyArtifacts(...))`, is removed. The surviving
  application, and the reason it has to run where it does, are documented at the call site.
- `src/__tests__/behaviors/shared-shaper-brand-window.test.ts` — new. Four tests: the rewrite covers
  every name the regex declares; the rewrite runs **before** the compactor; every input in the sweep
  reaches the step it was written for; and the adjacency sweep itself.

No migration, route, script, loader or projection changed.

## QA / Validation

**Clean baseline, same command and same scope on both sides.** The before side is a separate
detached worktree at `origin/main` `406b24498`, not a stash.

| | suites | tests | failing |
|---|---|---|---|
| before, 7 shaper/renderer suites on unmodified `main` | 7 | 59 | 0 |
| after, the same 7 plus the new control | 8 | 63 | 0 |

**The measurement that decided delete over keep.** The corpus is 11 inputs × 3 declared names × 95
printable ASCII characters on the left × 95 on the right = 297,825 rows, each run through the whole
shaper and its output hashed:

| configuration | rows | inputs carrying a bounded name | outputs leaking a name | rows differing from shipped |
|---|---|---|---|---|
| both rewrites (previous commit) | 297,825 | 33,792 | 0 | — |
| second removed (this change) | 297,825 | 33,792 | 0 | **0** |
| first removed, second kept | 297,825 | 33,792 | 0 | 0 |
| **both removed** | 297,825 | 33,792 | **33,738** | 33,772 |

The last row is the calibration, and without it the first two rows would be a clean corpus proving
nothing: all eleven inputs leak when both rewrites go (3,072 rows each, 3,018 for the one input
where compaction drops the name outright), so the sweep can see a difference wherever it claims to.
The two middle rows also show the two rewrites are interchangeable — either alone produces exactly
the shipped output — which is what "redundant" has to mean before a line is deleted for it.

**Mutations. Each was confirmed by `sha256` to have changed its file before its suite ran, so none
is a no-op reading as coverage.** Six were run and two survived; both survivors are reported below
rather than hidden.

| # | mutation | before, on `main` | after, this branch |
|---|---|---|---|
| M0 | second rewrite removed — the survivor this item was filed on | 59 of 59 pass | n/a (this is the change) |
| M1 | the surviving rewrite removed | 59 of 59 pass | **15 of 63 fail** |
| M2 | the rewrite moved to the far side of the compactor | 59 of 59 pass | **1 of 63 fails** |
| M3 | one name dropped from `BANNED_BRAND_RE` | — | **15 of 63 fail** |
| M4 | one sweep input shortened so it stops reaching its step | — | **1 of 4 fails**, naming the input and the step |
| M5 | the `banned_brand_leak` issue removed from the shaper | — | **SURVIVES all 63** |
| M6 | the deleted rewrite added back | — | **SURVIVES all 63** |

M1 and M2 are the point of the release: both were invisible before and both bite now. M4 exists
because a sweep whose inputs quietly stop triggering their steps is green over nothing, which is the
defect shape this backlog was opened against.

**M5 is a finding, filed as `C-518`, not fixed here.** The shaper reports a `banned_brand_leak`
issue when a name survives to the delivered text. It fired 0 times in 297,825 rows with the rewrite
in place and 33,738 times with it removed — so it is a live backstop for the rewrite's *absence*,
and simultaneously a check with no reachable input in the shipped configuration. Making it
reachable means changing the function's shape, which is out of scope here.

**M6 is stated rather than guarded.** Re-adding the deleted rewrite is behaviourally undetectable —
that is what "0 of 297,825 rows differ" means, so no behavioural test can catch it. A structural
assertion counting the applications would catch it and is deliberately not added: a text scan over
the source is the kind of control this backlog exists because of, and a duplicated no-op is untidy
rather than wrong.

**Other checks.**

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit 0, judged by exit
  code with `tsconfig.tsbuildinfo` removed first. Zero diagnostics.
- `npx eslint` on both changed files with `--max-warnings 0` — exit 0.
- `npx jest --runTestsByPath` on the six behaviour census suites, isolated — 6 suites, 59 tests, 0
  failing. Under a full `src/__tests__/behaviors` run those suites report failures on an unmodified
  tree as well; the control run is recorded in the pull request.
- No signed-in acceptance is owed: the delivered text is proven identical over 297,825 rendered
  answers, so a signed-in pass would have no subject.

## Rollout Plan

Squash merge to `main`. The repo-owned `aca-main-deploy` workflow builds the image from that SHA and
shifts Product/Lab web traffic. No migration to apply, no flag to set, no worker job to run.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`. Nothing
  in this change touches a workflow or an Azure resource.
- Shared runtime mutators: none. No ad-hoc `az containerapp update`, no `az acr build`, no env, flag,
  scale or secret change.
- Approved image digest: assigned by the main deploy workflow for the merge SHA; recorded in the
  pull request once the run completes.
- ACA runtime invariant: to be proven after deploy by reading both sides — the Container App
  template image and the image of the 100%-traffic revision must be the same `@sha256:` digest, and
  that revision must be Healthy and Running.
- Worker image invariant: not applicable and none owed. No worker job code changed, so a worker
  digest comparison here would be a proof with no subject.
- Feature/env flag update path: none.
- Live signed-in proof required: no, for the reason given under QA. If the delivered text had moved
  by one character this line would read the other way.

## Rollback Plan

`git revert` the squash and let the same workflow deploy the revert; or reassign 100% ingress traffic
to the previous ACA revision, whose digest is recorded in the previous release record. Both are safe
at any time: there is no migration, no persisted state and no flag, and the reverted code is proven
to produce identical text.

## Audit Evidence

- Pull request, with the before/after suite counts, the four-configuration corpus table and the six
  mutation results reproduced from this record.
- The `aca-main-deploy` run keyed to the squash SHA, and the two digests compared side by side.
- `src/__tests__/behaviors/shared-shaper-brand-window.test.ts` — the search is executable and
  recomputed by CI on every pull request, so this record's numbers are reproducible rather than
  quoted.

## Known Gaps

- `C-518` — the `banned_brand_leak` issue has no reachable input while the rewrite is in place (M5
  above). Filed, not fixed.
- Re-adding a duplicate rewrite is not structurally prevented (M6 above). Stated by choice.
- `BANNED_BRAND_RE`'s membership and the raw-identifier passes beside it are untouched; the item
  names both as separate questions.
