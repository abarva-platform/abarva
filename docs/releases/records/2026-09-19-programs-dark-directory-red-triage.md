# 2026-09-19-programs-dark-directory-red-triage — Triage the red suites in unwired Programs directories

## Release ID

`2026-09-19-programs-dark-directory-red-triage`

## Status

`candidate`

## Plain-English Summary

A survey of the Programs library found five test suites that were failing where
no workflow could report them — the directories they sit in are reached by no CI
step, so the failures had no audience. This change triages all five and repairs
the three that were false alarms, then wires the one directory that is now fully
green so it can never go quiet again.

None of the three repaired suites had found a product defect. Each had pinned a
literal that a deliberate change later moved:

- one named a specific tenant as its example of a denial branch, and that tenant
  was later promoted into the governed-foundation list, so it began taking the
  other branch. The denial itself never stopped working — both branches return
  403 — but the fixture had quietly stopped demonstrating the branch it was
  written for;
- one pinned a tenant display label that a rename changed;
- one matched raw machine keys in a generated answer after the answer began
  rendering human-readable labels instead.

All three are repaired the same way: the expectation is now **derived from the
same authority the product code consults**, rather than copied out of it by
hand. A future rename or list change travels into the test instead of arriving
as a false defect, and each derivation is guarded by a case that fails if the
derivation ever yields nothing — so none of them can start passing vacuously.

The remaining two suites are **real findings and are deliberately left failing**,
because repairing either requires a decision that is not this change's to make.
They are described under Known Gaps.

## Layer Impact

Release lane: `global-control-lane`. Shared repository tooling and test scope. No
client-scoped data, schema, ingestion or retrieval path is touched, and nothing
is feature-gated.

- **Products** — no product behavior changes. One module comment is untouched;
  no route, component, prompt, schema, API or data-plane path is modified. The
  only non-test source change is none: all edits are test files, one workflow
  step, one behaviors case, and this record.
- **CI / platform tooling** — one directory of the Programs library is now
  exercised on every pull request, and the ratchet that counts unreached
  directories comes down with it.

## Client Applicability

- All clients: no runtime change.
- Specific clients: none.
- Internal only: yes — test and CI scope.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/board-artifacts/__tests__/board-grade-route-guard.test.ts` —
  both denial-branch fixtures derived from the client registry and the
  foundation-tenant predicate, plus a new case asserting a real tenant exists
  for each branch.
- `src/lib/programs/board-artifacts/__tests__/load-move-business-case-input.test.ts` —
  moved here from the parent directory; display-label expectation taken from the
  canonical display-name authority, with a non-vacuous guard that the authority
  does not return the key unchanged.
- `src/lib/programs/archetypes/__tests__/generality.test.ts` — expectation
  derived from the archetype's own phase model and compared on a normalised
  form, with a negative half asserting the other archetype's disjoint families
  are absent.
- `.github/workflows/ai-surface-control-catalog.yml` — one step added, exercising
  `src/lib/programs/board-artifacts/__tests__`.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts` — the new
  directory added to the wired list with a suite floor; unreached-directory
  count lowered 37 → 35.

## QA / Validation

Baseline and after measured over the same scope with the same command, the
baseline taken in a separate pristine worktree at the exact base commit
`3f33502ac`.

- Item scope, the five named suites, `npx jest --runTestsByPath …`:
  **5 failed of 5 suites / 6 failed, 29 passed of 35 tests → 2 failed of 5
  suites / 3 failed, 33 passed of 36 tests.**
- Whole tree, `npx jest src/lib/programs`:
  **5 failed, 248 passed of 253 suites / 6 failed, 3528 passed of 3534 tests →
  2 failed, 251 passed of 253 suites / 3 failed, 3532 passed of 3535 tests.**
- Wired directory measured before wiring: 4 suites, 32 tests, all passing.
- Behaviors gate: 44 suites / 448 tests, 0 failed.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  **exit 0**, judged by exit code, 0 diagnostics.
- `npx eslint` over the four changed test files — **exit 0**.

**Nine mutations applied and reverted, nine caught, with a passing control after
each revert.** Each breaks one thing the change claims:

1. the guard's governed-foundation branch removed → 1 failed of 4;
2. every remaining tenant added to the foundation list, making the legacy branch
   unreachable → 1 failed of 4. This is the one that proves the derivation
   cannot silently pass on a tenant that no longer demonstrates its branch;
3. the display-label fallback passes the raw key through → 1 failed of 4;
4. the display-label fallback returns null → 1 failed of 4;
5. the generated answer resolves its requirements against a fixed archetype
   instead of the caller's → 1 failed of 3. This is the load-bearing one: it is
   caught only by the negative half of the assertion;
6. the generated answer names no families at all → 1 failed of 3;
7. the new workflow step deleted → 3 failed of 11;
8. the unreached-directory count left at its old value while the wiring lands →
   1 failed of 11;
9. a loose test file re-created in the parent directory → 1 failed of 11.

**A measurement worth stating, because it was not the expected one.** Wiring one
directory lowered the unreached count by **two**, not one. The second is the
parent directory itself: its only test file was the loose one, so moving that
file into `__tests__` left the parent holding no test file at all and it left
the census entirely. One directory was covered and one stopped being a test
directory — different things. The ratchet reported the discrepancy and the
number was corrected to the measured value rather than the assumed one.

## Rollout Plan

Merge to main. The repo-owned ACA main deploy workflow runs on merge as usual.
No migration, no flag, no data build, no manual runbook.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No Azure command is run by this change.
- Approved image digest: unchanged by this release; the deploy that follows the
  merge carries the ordinary main image.
- ACA runtime invariant: verified after merge by
  `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no.** Four test files, one workflow step and
  one record; no route, component, prompt, schema, API or data-plane path is
  touched, so there is no product surface on which a signed-in check could
  demonstrate anything.

## Rollback Plan

Revert the merge commit. The only runtime-visible effect is one additional CI
step; reverting removes it and restores the previous ratchet value. No migration
or data change to unwind.

## Audit Evidence

- The pull request and its check run, including the new step's own log lines —
  the step is confirmed executing on a runner, not inferred from the workflow
  file.
- Baseline figures above, reproducible at `3f33502ac` in a pristine worktree.
- The nine mutation results, each reproducible by applying the named change.

## Known Gaps

**Two of the five suites are still failing, on purpose.** Both are real findings
whose repair needs a decision this change may not take on its own:

1. **An archetype registry integrity gap.** Two analysis-method keys referenced
   by one archetype have no entry in the method library, so a test asserting
   that every referenced key resolves cannot pass. Authoring the two missing
   entries is a content decision about what those methods are; it is already
   tracked as an open backlog item, and this red test is that item's acceptance
   criterion rather than a separate defect. Not repaired here, and deliberately
   not weakened.

2. **A governed promotion gate refuses four of the six registry-declared
   tenants.** The symbol naming the canonical tenant list resolves to two
   different lists depending on which module imports it — one declares six
   tenants, the other two. The promotion evaluator imports the two-tenant one,
   so a learning candidate belonging to any of the other four is hard-blocked
   with the reason `non-canonical client_key`, and the failing suite is the
   instrument that has been saying so into a directory nobody runs. This is an
   existing open P0 whose stated acceptance is to settle which list is
   authoritative. **It is not repaired here because the only repair available
   without that decision is to widen a governance allowlist** — a loosening of a
   gate that controls what may enter agent context, which is not a change to
   make as a side effect of a test triage.

Consequently the two directories holding those suites are **not wired**, in
keeping with the rule that a red directory is resolved before it is wired.

Historical release records and verification artifacts reference the moved test
file at its former path. Those are dated records of what was run at the time and
are deliberately left unedited rather than rewritten.
