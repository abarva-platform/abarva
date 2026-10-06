# 2026-09-25-c513-unreachable-reason-claim-gate — check an unreachable control's stated reason against the tree

## Release ID

`2026-09-25-c513-unreachable-reason-claim-gate`

## Status

`candidate`

## Plain-English Summary

The AI surface control catalog lets a control be declared "real code, but no route
reaches it" by setting `routeReachable: false` and writing an `unreachableReason`
that explains what is not on a screen and what would put it there. Those reasons
make factual claims about the repository — this file names that component, nothing
imports it, it is recorded in that register. Until now the gate asked the reason for
exactly one thing: that it was at least forty characters long. Every factual clause
inside it could go false and the gate stayed green.

One already had. The Tower entry asserted that two QA inventory modules "still name"
the orphaned component as the one the Tower route renders. Both modules are on `main`
and neither contains that component's name in any casing — both had been repointed at
the shell that actually renders there. The claim inside the justification was false
while the justification itself was accepted.

This change derives those claims from the tree the same way `knownSuites` already is.
Three rules: every repository path named inside a reason must exist; a claim that one
file names, mentions, lists or imports something is read back off that file; and a
claim that nothing imports something is checked by walking the product files. A
naming claim the rules recognise but cannot resolve to a file and a symbol is reported
rather than skipped, so writing the same assertion more vaguely does not get past the
gate. The Tower entry's prose is corrected in the same change, and the false sentence
is kept verbatim as a fixture so the rules stay proven now that the catalog is clean.

## Layer Impact

Release lane: `global-control-lane` — a repository-wide control gate, not client-scoped
and not feature-flagged. It changes what CI accepts for every pull request; it changes
nothing a client can see.

- **Layer 4 — Products:** none at runtime. No product surface, route, component or
  answer path changes; nothing here is imported by application code.
- **Control plane / CI:** `scripts/audit/ai-surface-control-catalog.mjs` gains a check.
  It runs on every pull request as `npm run audit:ai-surface-controls` in the required
  **AI surface control catalog** job, so the rules are wired the day they land rather
  than available to anyone who chooses to run them.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a repository control and its documentation
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/audit/lib/unreachable-reason-claims.mjs` — new. The three rules, the
  clause grammar, and the unresolved-claim rule. The tree is injected as an `io`
  object so the rules can be driven over a constructed tree rather than only this one.
- `scripts/audit/ai-surface-control-catalog.mjs` — builds that `io` once and calls the
  rules from the `routeReachable: false` branch, beside the length check that was
  previously the whole of it.
- `docs/security/ai-surface-control-catalog.json` —
  - the Tower entry's `unreachableReason` is corrected: the two QA modules are now
    described as naming the command-center shell, which they do, and the demo route
    checklist is named as the document that still points at the orphan, which it does;
  - the new suite is added to `knownSuites` on all five Tower controls, because it
    names that component and the existing reconciliation rule derives that list from
    the tree;
  - each of those five `behavioralTest.reason` strings gains one sentence saying the
    new suite mounts nothing, so a reader does not read a fourth listed suite as a
    fourth piece of render evidence.
- `src/__tests__/behaviors/unreachable-reason-claims.test.ts` — new, 8 cases.

## QA / Validation

**Failing first, measured against a clean worktree rather than a stash.** A detached
worktree at `origin/main` `e4b9abb5f` received the new suite and the catalog's
registration edits only — no rules, stale prose left in place. On that baseline the
suite is **6 failed / 2 passed of 8**. With the change: **0 failed / 8 passed**. The
two that pass in both states are the false-positive-direction cases, which is what a
false-positive guard should do — it must not start passing because the rules arrived.

**The known positive is real, not a fixture invented for the test.** Before any code
was written, both files the Tower reason names were read on `origin/main` `e4b9abb5f`:
`src/lib/qa/route-smoke-inventory.ts` and `src/lib/qa/founder-demo-route-checklist.ts`
exist and neither contains `ProgramPressureCards`, `program-pressure` or
`program pressure` in any casing. With the rules in place and the prose uncorrected,
`node scripts/audit/ai-surface-control-catalog.mjs` exits non-zero on the real catalog
and names both files. A detector calibrated only on fixtures would have passed this
catalog unchanged.

**Both directions, on the same rule.** The suite asserts the stale clause goes red and
that the identical clause shape about a file that *does* name the component stays
green, so the rules react to the fact rather than to the sentence. It also asserts
that when the Tower reason is stale the other two unreachable surfaces are not named
in the output — a rule that failed everything would satisfy the first assertion alone.

**The corpus is now clean, so the guard is kept alive deliberately.** The false
sentence is stored verbatim as `STALE_TOWER_REASON` and re-injected on every run. A
clean corpus and a blind detector are indistinguishable from outside, and fixing a
defect must not retire the evidence that proved it.

**Mutation — six mutations, six caught, no survivors.** Each was confirmed to change
behaviour before its result was read.

| # | Mutation | Failing cases |
|---|---|---|
| 1 | The call site is removed, so the rules never run | 6 |
| 2 | The attribution rule can never report | 3 |
| 3 | The path-existence rule is removed | 1 |
| 4 | The unresolved-claim rule is removed | 1 |
| 5 | The absence rule can never report | 1 |
| 6 | Trailing sentence punctuation is no longer trimmed off a path | 1 |

Mutation 6 is the one worth reading. It does not weaken the gate; it makes the gate
produce a **false** finding, reporting a path that exists as missing because the
sentence's full stop was read as part of the filename. The case that catches it is
"the real catalog passes". The false-positive guard is load-bearing.

**One deliberate near-miss, recorded because it nearly shipped.** The unresolved-claim
rule first compared a count of recognised verbs with a count of resolved clauses. On
one real reason the verb it had seen and the clause it had resolved were different
clauses, and the two counts were equal, so it reported nothing. Two errors cancelling
into agreement reads exactly like agreement. The rule now records the character span
of each resolved clause and asks whether each verb falls inside one.

- `node scripts/audit/ai-surface-control-catalog.mjs` — pass, 21 surfaces, 40 declared
  controls, 637 route entry points.
- `npx jest --runTestsByPath src/__tests__/behaviors/unreachable-reason-claims.test.ts`
  — 8 passed.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**,
  judged by exit code rather than by grepping the output, because a bare run exits 134
  on this machine with no diagnostics and greps clean.
- `npx eslint` on all three changed source files — exit 0.
- `npx jest src/__tests__/behaviors --runInBand` — scope regression recorded in the PR
  as before/after over the same directory.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in this change is imported by application
code, no route, component, migration or flag is touched, and no image needs to be
built for it to take effect. It becomes active as a pull-request gate on the next PR.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az containerapp` command is involved.
- Approved image digest: not applicable — no runtime image change is required.
- ACA runtime invariant: unaffected; the merge deploy is incidental to this change.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: no. This change alters no rendered surface.

## Rollback Plan

Revert the pull request. The rules live in one new module and one call site; reverting
restores the previous length-only check and the previous prose. No migration, no data
and no runtime state is involved, so the revert is complete on merge.

## Audit Evidence

- The pull request and its CI run, including the required **AI surface control
  catalog** job whose `npm run audit:ai-surface-controls` step executes the new rules.
- The baseline measurement above, taken in a detached worktree at `origin/main`
  `e4b9abb5f` rather than from a stash.
- The mutation table above, each row reproducible by applying the named mutation and
  re-running the suite.

## Known Gaps

- **The grammar is narrow, and that is a choice rather than an oversight.** It
  recognises anchored clause shapes — a repository path or an explicit quantifier
  followed by a naming or importing verb — and it does not attempt to understand
  arbitrary English. A reason can still assert something true-or-false that no rule
  reaches, for example "the Tower rebuild left this component behind". What it must
  not do is let a clause it *does* recognise go unchecked, and the unresolved-claim
  rule is what closes that.
- **Only `unreachableReason` is covered.** `behavioralTest.reason` on an uncovered
  control is prose of the same kind and is reconciled only through `knownSuites`; the
  rest of that sentence is still unchecked. That is the next drift of this shape and it
  is not repaired here.
- **One finding recorded rather than fixed, and it belongs to a different item.**
  `docs/demo/ABARVA_FOUNDER_DEMO_ROUTE_CHECKLIST.md` still names the orphaned component
  as the expected component for the Tower route, while the two TypeScript inventories
  it was derived from have moved on. The corrected prose now names that document, so
  the disagreement is stated in the catalog and checked by the gate rather than left
  silent — but the document itself is not updated here.
