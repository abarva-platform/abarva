# 2026-09-25-t763-triage-verdict-declared-quarantine — A held test suite's verdict is declared where the coverage census reads it

## Release ID

`2026-09-25-t763-triage-verdict-declared-quarantine`

## Status

`candidate`

## Plain-English Summary

The repository measures how much of its own test suite CI actually runs. That measurement
separates a test file nobody has looked at (`untriaged`) from one somebody looked at and
deliberately left unrun (`declaredQuarantine`), because the first is work and the second is a
decision. It credits the second in exactly two shapes: a CI command names the file and then
subtracts it, or a scoped `scripts/quality/*-quarantine.json` declares it.

A verdict written into a triage record under `docs/architecture/` is neither of those. So three
Source workspace test files that were examined, verdicted, and assigned an owner kept reporting
as untriaged, and their directory kept its place near the top of the governed-risk ranking with
no untriaged work actually left in it. That ranking is what decides which directory gets wired
into CI next, so a draw from it came back already-decided and the analysis had to be redone by
hand. This change stops that.

**The mechanism was chosen from a measurement, not from taste.** Of the 395 test files the
census called untriaged on `31f6badae`, **20** already carried a verdict somewhere and **375**
carried none — so this is not a repository-wide vocabulary gap. Of those 20, only **3** carried a
verdict that declares a *hold*; the other 17 carried verdicts meaning work is owed
(`wire_into_ci`, `repair`, `update_with_reason_recorded`, `vacuous_control_proof`, `real`).
Teaching the census to read triage records would have had to credit those 17 as well, which
subtracts queued work from the ranking that decides what gets wired next. So the census
vocabulary is unchanged, and the three holds are declared in a scoped quarantine list where the
census already reads.

The entry cannot outlive its reason. Each of the three is held because it is a *source-text
scanner* — it reads a source file and asserts substrings of it, so a comment carrying the same
substring satisfies it and wiring it would buy a green check and no protection. A new checker
re-measures that property on every run: when a held suite stops reading source text, its entry
**fails**, and the file has to be wired and the verdict discharged. It also fails in the other
direction — a `held_unwired` verdict anywhere in the tree that brings no list entry — which is
what makes the triage record alone insufficient rather than merely discouraged.

## Layer Impact

Release lane: **`internal-admin`** — a repository-internal control and measurement. It ships no
product behaviour and no client-visible surface, so it is not `global-control-lane`; it touches
no tenant schema, seed, ingestion or retrieval, so it is not `client-data-lane`.

- **Layer 4 (Products):** none. No product surface, route, component, API or prompt is touched,
  and no runtime module imports anything in this change.
- **Layer 3 (Canonical model):** none. No schema, migration, loader or tenant data.
- **Repository controls / CI:** one new merge-blocking workflow step, one new quarantine list
  with its checker, one measurement script, and a refreshed committed census artifact.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — repository test-coverage bookkeeping
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/source-workspace-quarantine.json` — **new.** Declares the three held Source
  workspace suites with owner, reason, `heldBecause`, and the triage record each verdict is
  written in. Ratchet `ceiling: 3`.
- `scripts/quality/check-source-workspace-quarantine.mjs` — **new.** Re-measures each entry's
  reason (`readFileSync` / `toContain` counts, the same property the triage record recorded),
  fails an entry whose record no longer carries the verdict, and fails a `held_unwired` verdict
  anywhere in the tree that has no entry. Exits non-zero on any of these.
- `scripts/quality/check-source-workspace-quarantine.test.mjs` — **new.** Eight cases, including
  the mutation on the real held files rather than a fixture.
- `scripts/quality/triage-record-census-reconciliation.mjs` — **new.** Prints, per file, which
  untriaged unrun test files already carry a verdict and which verdict paths name a file that no
  longer exists. A measurement: it always exits 0 and gates nothing.
- `scripts/quality/triage-record-census-reconciliation.test.mjs` — **new.** Four cases.
- `scripts/quality/test-ci-coverage-census.mjs` — adds an `includeFileStatuses` option to
  `buildCensus`, off by default so the committed artifact stays byte-identical. The per-file
  `untriaged` flag was already computed and then dropped, so every consumer that wanted it had to
  subtract two published counts and guess which files the difference named.
- `.github/workflows/unit-suites.yml` — one new step, "Check the Source workspace quarantine",
  beside the existing T-478 steps. Triggered on `pull_request` and `merge_group`, so it blocks a
  merge.
- `package.json` — `audit:triage-record-reconciliation`.
- `docs/architecture/ci-gate-registry.json` — registers that script as `report`, with the reason
  it is deliberately not a gate.
- `docs/architecture/t478-source-workspace-wiring-triage.json` — each held verdict now points at
  its quarantine entry, and an amendment records the rule and the measurement behind it. The
  existing verdicts and rationales are unchanged.
- `docs/architecture/test-ci-coverage-census.json` — refreshed.

## QA / Validation

**Red first, then green, on the new control.** With the module present as a stub returning no
problems: **5 failed / 3 passed**. After the implementation: **0 failed / 8 passed**. The three
that passed against a stub are the guardrails an over-broad fix would break — a checker that
always returns "no problems" satisfies "accepts a valid entry" and "the real list is current" by
definition, and they are in the suite to keep a later change from reintroducing that.

**The measurement, before and after.**

| | before | after |
|---|---|---|
| `untriagedUnrunTestFiles` | 395 | **392** |
| `declaredQuarantineTestFiles` | 49 | **52** |
| `directoriesWithUntriagedUnrunTestFiles` | 189 | **188** |
| `highGovernedRiskDirectories` | 8 | **7** |
| the Source workspace directory on the governed-risk ranking | rank **2** of 9 | **not ranked** |
| untriaged files that already carry a verdict | 20 of 395 | **17 of 392** |
| untriaged files carrying no verdict anywhere | 375 | **375** |

The last row is the one that says nothing was widened: no file gained a triage credit except the
three that carry a `held_unwired` verdict. The directory leaves the ranking entirely because the
ranking filters on `untriagedUnrunTestFiles > 0`, and it now holds none — which is the honest
state, not a suppression: 33 of its 36 files run in CI and the other 3 are declared.

**Mutation: ten run, ten caught.** Each mutation's `sha256` was confirmed changed before the
suite ran, so no no-op mutation is counted as a catch.

| | mutation | caught by |
|---|---|---|
| M1 | the reason-expired branch made unreachable | "fails when a held suite stops being a source-text scanner" |
| M2 | the held-verdict-with-no-entry direction iterates an empty list | "fails a held_unwired verdict that brings no quarantine entry" |
| M3 | the discharged-verdict check made unreachable | "fails an entry whose triage verdict has been discharged" |
| M4 | the ratchet check made unreachable | "fails when the list grows without moving its exact ratchet" |
| M5 | one **real** entry removed from the list, ratchet moved with it | the real-repository case; checker exits 1 naming the file |
| M6 | the real list's `scope` changed to a directory the census will not resolve under | the real-repository case, 2 failures |
| M7 | a **real** held suite stops being a source-text scanner (`readFileSync`/`toContain` renamed in place) | the real-repository case: "reason expired: it reads source text 0 time(s)…" |
| M8 | `includeFileStatuses` forced on, so the committed artifact would carry it | "per-file statuses are off by default…" |
| M9 | the reconciliation drops its `untriaged` filter | "the real repository's reconciliation adds up" |
| M10 | per-file statuses published for covered files only | same case, 2 failures |

M5, M6 and M7 are the ones the item asked for: a mutation on a real held file, not a fixture.
M5 also demonstrates the "exactly one" property directly — removing one real entry moves
`untriagedUnrunTestFiles` by exactly 1, and that assertion is a permanent case in the suite
rather than a number quoted once.

**Scope baseline, same six suites, clean `origin/main` `31f6badae` in a separate worktree versus
this branch:** 6 suites / 105 tests passed before, 6 suites / 105 tests passed after — **0
failing before, 0 after**. A worktree rather than a stash, so the baseline is the real tree.

- `node --test scripts/quality/check-source-workspace-quarantine.test.mjs scripts/quality/triage-record-census-reconciliation.test.mjs` — **12 passed, 0 failed** (the exact CI step command, 13.7s).
- `node scripts/quality/check-source-workspace-quarantine.mjs` — **exit 0**, "3 held suites, every reason re-measured". Mutated: **exit 1**. Exit codes read directly, not through a pipe.
- `npm run audit:test-ci-coverage:check` — census drift and shape both current.
- `node scripts/audit/ci-gate-registry-check.mjs` — **exit 0**.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with `tsconfig.tsbuildinfo` deleted first — **exit 0**, judged on the exit code.
- `npx eslint` over the five changed/added scripts — **exit 0**.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout: nothing under
`src/` imports any file in this change, no route, component, prompt or data path is touched, and
the only executable additions run in CI and from the command line.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az` command, no image, no revision, no traffic.
- Approved image digest: not applicable — no runtime image changes.
- ACA runtime invariant: not asserted by this release and not owed by it. The merge still
  triggers the deploy workflow; its digest invariant is that run's own proof, recorded in the
  execution register, and is not a condition of this change being correct.
- Worker image invariant: not applicable. No byte under any worker path.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and none is claimed. There is no rendered surface. The
  subject is CI bookkeeping, observable only through the census artifact and the workflow step.

## Rollback Plan

Revert the PR. The change is additive and self-contained: deleting
`source-workspace-quarantine.json` and its checker returns `untriagedUnrunTestFiles` to 395 and
the directory to rank 2, and removing the workflow step removes the new merge-blocking check. No
migration, no data, no flag, no runtime state.

## Audit Evidence

- The PR and its checks.
- `docs/architecture/test-ci-coverage-census.json` — the refreshed measurement; the before/after
  numbers above are reproducible with `npm run audit:test-ci-coverage`.
- `node scripts/quality/triage-record-census-reconciliation.mjs` — reproduces the 17-of-392 list
  and the seven stale verdict paths named under Known Gaps.
- `docs/architecture/t478-source-workspace-wiring-triage.json` — the amendment recording the rule
  and the measurement behind it.
- The new workflow step's log on any pull request after merge.

## Known Gaps

- **Seventeen untriaged files still carry a verdict and are deliberately left that way.** Every
  one of them carries a verdict meaning work is owed, not a hold. Crediting them would subtract
  queued work from the ranking that decides what gets wired next. `audit:triage-record-reconciliation`
  lists them by name so the next agent does not re-derive the set.
- **Seven verdict paths name a file the census does not walk** — five in one 2026-09 triage
  record, two in another. A verdict about a file that no longer exists cannot expire, because
  nothing re-reads it. Measured here and filed as its own backlog item; not repaired in this
  change, because amending another item's record on the way past is how a verdict acquires an
  author who never examined it.
- **The `held_unwired` scope is one directory today.** The checker fails a `held_unwired` verdict
  found anywhere else, which surfaces the next one rather than silently ignoring it, but that
  verdict will need its own scoped list. That is deliberate: a single repository-wide list would
  lose the scope fence the census resolves entries under.
- The three held suites themselves are still unwired and still owned by their existing backlog
  item. This change records the hold honestly; it does not discharge it.
