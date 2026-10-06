# 2026-09-20-qa-superseded-path-disposition — A QA report stopped calling shipped work "pending"

## Release ID

`2026-09-20-qa-superseded-path-disposition`

## Status

`candidate`

## Plain-English Summary

A QA report checks whether a piece of planned work has been built by looking on
disk for the file it expects. If it does not find the file, it has to say why.
Until now, one of these reports answered that question by guessing: three of its
checks searched for a filename, missed, and concluded the work had not been done
yet — printing "Deferred pending <SLICE> integration".

Re-measured against `origin/main`, all three conclusions were wrong. Every one
of those pieces of work is marked complete in the repository's own build-slice
register, and every module is on disk. They simply landed under names the checks
never searched for. Two of them guessed a tenant-scoped filename for work that
shipped as a tenant-agnostic module; the third guessed a `"...-contract.ts"`
suffix the module that shipped does not carry.

This matters more than the reverse mistake. If a report wrongly says work is
still pending, a reader who believes it waits for something that already exists,
or builds it a second time. These three said exactly that, and nothing in the
report's own test suite could catch it: the four tests covering these checks each
asserted the status was "pass **or** deferred" — two of the three possible
answers — so no behaviour of the subject could turn them red.

The repair is that an absent path's meaning is now **declared** rather than
inferred from the miss, using the shared register introduced in the two previous
changes to this family. It gains a fourth kind of declaration — "the work landed
somewhere else" — and that declaration only resolves to a pass once the place it
claims the work landed has actually been looked at. A path that is absent with
nothing declared about it is a failure that asks for the declaration; it can no
longer come back as a quiet deferral.

The report now reads `pass 14 / fail 0 / deferred 0`, where it read
`partial · pass 11 / fail 0 / deferred 3`.

## Layer Impact

**Release lane: `global-control-lane`** — shared engineering verification
behaviour, not gated by flag or tenant. No product layer changes. This is layer-4-adjacent QA/verification tooling only:
two modules under `src/lib/qa/`, their two suites, and the report's own build
document. No canonical model, adapter, intake or product surface is touched, and
no product behaviour changes for any tenant.

## Client Applicability

- All clients: no
- Specific clients: no
- Internal only: yes — engineering verification artifacts
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/qa/path-disposition.ts` — adds the `superseded` disposition
  (`slice` + `landedAt` + `note`) and an optional path observer on
  `resolvePathStatus`. The landing path is verified by observation, not taken
  from the register entry; a `superseded` entry resolved without an observer, or
  whose landing path is itself absent, is a `fail`. An entry whose own path is
  present is also a `fail` — two files cannot answer for one slice.
- `src/lib/qa/apex-source-program-storyline-verification.ts` — CH-09 to CH-12
  now resolve through the shared register via `resolveSliceCheck`. The
  candidate-filename scan is kept, so work that later lands at a searched-for
  name still passes with no edit here; only the *miss* changed. The register's
  five statuses are mapped onto the report's three explicitly, with anything
  other than pass/deferred becoming a fail, so a new path cannot enter this
  report without a declaration.
- `src/__tests__/integration/qa/apex-source-program-storyline-verification.test.ts`
  — the four `expect(['pass','deferred']).toContain(...)` assertions are replaced
  with measured ones naming the module each slice landed at, plus a check that no
  detail string still claims a pending integration, plus two tests that reach the
  undeclared-absence branch directly.
- `src/__tests__/integration/qa/path-disposition.test.ts` — five tests for the
  new disposition, including all three of its failure modes.
- `docs/build/APEX_SOURCE_PROGRAM_STORYLINE_VERIFICATION.md` — the
  "these slices have not merged" section is replaced by the measurement and a
  table of where each slice actually landed.

## QA / Validation

**Before / after, the exact command CI runs for this directory**
(`npx jest src/__tests__/integration/qa --no-coverage --ci $(node scripts/quality/qa-integration-ignore-args.mjs)`):
**0 failing before, 0 failing after; 33 suites / 817 tests → 33 suites / 825
tests.**

**The defect and its repair, from the real execution path.** Running
`runApexStorylineVerification()` on clean `origin/main` `d621b34b9`:

```
before:  overall=partial  pass=11  fail=0  deferred=3
after:   overall=pass     pass=14  fail=0  deferred=0
```

The three deferrals were CH-09 (LINK1), CH-10 (SRC33) and CH-11 (PROG15). Each
slice's status was read from `docs/build/build-slices.json` (`code_complete` for
all three) and each landing module confirmed by its own file header
(`// LINK1 — Source Program Link Model`, `// SRC33 — Linked Program Badge View
Model`, `// PROG15 · Complete Future Phase Deliverables`).

**CH-12 was already passing and is left alone.** The item was filed over four
`Deferred pending` strings in the source; only three are reachable. CH-12's
candidate scan already finds `src/lib/programs/program-source-link-view.ts`,
whose header reads `// PROG16 · Program Source Link View-model` — the real
module, not a coincidental filename match. Its deferral string was dead code.

**Mutation testing: 8 mutations, 8 caught.** One escaped on the first pass and
the suite was strengthened rather than the result accepted — a mutation that
downgraded the register's `fail` verdict to `deferred` survived, because with
every path declared, no test reached that branch. An unreached branch is an
unprotected one, and the branch in question is precisely where the wording this
item was filed about would come back. `resolveSliceCheck` is now exported and
two tests reach it directly. Re-run after: caught.

| # | Mutation | Caught by |
|---|---|---|
| 1 | `superseded` passes without observing the landing path | landing-path-absent test |
| 2 | a missing observer is believed instead of failing | no-observer test |
| 3 | a present-but-superseded path stops failing | two-files test |
| 4 | LINK1's `landedAt` points at a module that does not exist | 3 tests |
| 5 | one register key misspelled, so the absence is undeclared | 4 tests |
| 6 | register `fail` downgraded to `deferred` | undeclared-absence test |
| 7 | SRC33 attributed to LINK1's module | CH-10 detail test |
| 8 | the candidate scan no longer passes on a present file | 5 tests |

**Wider scope, measured against a clean `origin/main` worktree over the same
three directories** (`integration/qa`, `integration/source`, `integration/programs`,
run without the quarantine ignore-args so the known-red suites are included):
**14 failed / 43 failing tests before, 14 failed / 43 failing tests after** —
the same suites, none of them touched here — with passing tests 3151 → 3159.

**The mutation harness was proven to run before any result was trusted.** Its
first invocation reported a clean pass having executed `Tests: 0 total`: zsh does
not word-split an unquoted variable, so jest received one nonexistent path.
Re-run with a shell array, which reports 47 tests.

**Gates.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty
false` exit 0, with `tsconfig.tsbuildinfo` removed first and the exit code judged
rather than the output grepped. `npx eslint` on all four changed source files
exit 0. `npm run audit:lib-orphans` exit 0, "No change against the baseline" — no
new orphan, since both modules were already on it.

**Quarantine.** Neither suite is quarantined; both run on every PR today. No
quarantine entry was added, removed or relaxed, and no assertion was weakened to
reach green.

**No signed-in proof is owed and none is claimed.** Nothing in this change is
reachable from a signed-in surface. Both modules' only consumers are their own
test suites; no route, component, API handler or agent path imports either.

## Rollout Plan

Merge to main. The repo-owned ACA main deploy workflow builds and deploys as it
does for any merge. There is no runtime rollout step specific to this change and
no runtime behaviour depends on it — the modules execute only under jest.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: whatever the main deploy workflow produces for the merge
  SHA; recorded in the claim log once the run settles.
- ACA runtime invariant: to be proven after merge — Container App template image
  digest equal to the digest on the 100%-traffic revision.
- Worker image invariant: both deliverable worker jobs carry the same digest.
- Feature/env flag update path: none; no flag or environment variable changes.
- Live signed-in proof required: **no.** Nothing here is reachable from a
  signed-in surface and no product surface changes.

## Known Gaps

- **The deploy is not yet proven.** The ACA runtime invariant (Container App
  template digest equal to the digest on the 100%-traffic revision) is recorded
  in the Deployment Authority section as owed, not done. It is verified against
  the run keyed to the merge SHA and written into the claim log afterwards.
- **One downstream register still carries the old claim.**
  `docs/build/production-readiness.json` holds an evidence string saying this
  report's checks "are deferred pending Wave 19 integration". That is now false,
  but it is a dated evidence entry in a register with its own owner, and
  rewriting it here would widen a bounded change into someone else's artifact.
  Filed as a separate backlog item rather than absorbed.
- **The candidate-filename scan is kept, and it is still a guess** — just a
  guess that can no longer invent a reason when it misses. The stronger fix
  would be for each check to read its slice id out of the build-slice register
  and resolve the module from there, so no filename is guessed at all. That is a
  larger change across a family of verifiers and is not attempted here.
- **Only this report was re-measured.** Sibling verifiers in `src/lib/qa/` were
  repaired for absent-path disposition in the two preceding changes, but none of
  them has been checked for this specific variant — a check that concludes "not
  built" from a filename miss when the work shipped elsewhere.

## Rollback Plan

Revert the single squash commit. No migration, no data change, no flag, no
runtime state. The reverted state is the current `origin/main` behaviour, in
which the report reads `partial 11/0/3`.

## Audit Evidence

- PR on `abarva-platform/abarva`, with the before/after report output and the
  mutation table in the body.
- CI: the Integration suites workflow's `src/__tests__/integration/qa` job, which
  runs both changed suites on every PR.
- `docs/build/APEX_SOURCE_PROGRAM_STORYLINE_VERIFICATION.md` — the measurement
  and the slice-landing table, in the artifact's own document.
- The ACA deploy run keyed to the merge SHA, with template and traffic digests
  compared; recorded in the claim log.
