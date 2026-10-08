# U-595 — The P0 close names why it stopped

## Release ID

`2026-10-08-p0-close-names-why-it-stopped`

## Status

`candidate`

## Lane

`global-control-lane`

## Plain-English Summary

P0 is the first step of a Move, and one signed-in approval closes it: the
product builds the origination brief from what was captured at origination,
records the approving user as its signer, evaluates the governed P0 gate, and
advances the Move to the next phase. A single helper does all of that, and the
approval route reports what it returned.

That helper has five structurally different ways to finish, and only one of them
is a gate verdict. The Move row may not be readable at all. The Move may have
already left P0, in which case nothing was owed and nothing was wrong. The
origination brief may not have been created, so there was nothing to sign. The
helper may have thrown and had the error swallowed on purpose, because a failure
there must never break the approval write itself. And finally, the gate may have
genuinely reported a hard block.

Only that last one populated the field the route reported. The other four
returned the same shape — "did not advance", with an empty list of blocking
checks — and the route turned that emptiness into one sentence for all four:
that the approval could not advance the Move, and that the reader should check
the server logs for the phase close helper. That sentence went to a signed-in
product user, on the first step of a Move, as their only next action. They
cannot open a server log. Four different causes, each needing a different
response, arrived as one unexplained failure.

The already-left-P0 case was the worst of the four, because it is not a failure.
If the Move had advanced — a double submit, or a user returning to the P0 screen
after the close had already run — the product told them the gate was blocked and
the Move had not advanced, when it had. A benign no-op was reported as a refusal,
and the word "gate" was borrowed for a verdict the gate never gave.

This change has each stop name itself. Every one of the five outcomes now
carries its own name out of the helper, and the route turns that name into the
sentence the reader sees and into the error code the client branches on. Each
sentence says what stopped the close, what state the Move was left in as a
result, and what the reader can do about it: re-check the origination capture
the brief is built from, open the phase the Move is actually on, or re-submit
the approval because the approval itself was already recorded and a retry is
safe. None of them asks anyone to read a server log.

Three decisions are worth stating. Only a real gate verdict is allowed to answer
with the error code `gate_blocked`; the other four stops get their own codes, so
a client can no longer mistake an unreadable Move or an already-advanced one for
a gate refusal. The already-advanced response reports the phase the Move is
actually on, so the surface can route the user forward instead of leaving them
at a screen with nothing to do. And nothing here relaxes the gate: the hard-block
path still refuses with the same checks named in the same words, and no phase
advances that did not advance before. Only the claim about *why* a close stopped
changes.

The naming lives in its own module rather than inside the close helper, because
the helper is `server-only` and a suite cannot import it directly. Putting the
classification in a plain module makes the behaviour testable on its own instead
of being reachable only through a mocked route.

## Layer Impact

Release lane: `global-control-lane` — shared approval-route behaviour, identical
for every client and not feature-gated.

- **Layer 1 (Client intake)** — untouched. No intake tab, registry, or input
  file is read or written.
- **Layer 2 (Source adapters)** — untouched.
- **Layer 3 (Canonical model)** — read-only in effect. The close helper's reads
  and writes are byte-identical: the same Move row is read, the same brief is
  created and signed, the same gate is evaluated with the same arguments, and
  the same phase advance and gate decision record are written. The only new
  state is an in-memory field on the helper's own return value.
- **Layer 4 (Products)** — the Moves phase-gate approval response. Its HTTP
  status is unchanged for every outcome (409 on any non-advance, 200 on
  success). Its `error` code and `detail` sentence are now specific to the
  cause, and two descriptive fields (`outcome`, `movePhase`) are added.

No product owns this behaviour: the gate verdict still comes from
`evaluateGate`, and the phase state still comes from the canonical Move record.

## Client Applicability

All clients, immediately on deploy, with no flag and no per-tenant enrolment.

The change is a reporting change on a shared route. It cannot alter which Moves
can advance, because the advance decision is made by the same `evaluateGate`
call against the same records, and the hard-block refusal is unchanged. A client
mid-walk sees no difference unless their P0 close stops for one of the four
causes that previously reported nothing — in which case they now read what
happened instead of an instruction to consult a log.

No tenant-derived data, archetype declaration, or evidence state is read or
written by this change.

## Changes Included

- **New** `src/lib/programs/origination-close-outcome.ts` — the five outcomes of
  a P0 close as a named union, the error code each maps to, and the sentence each
  reads as. Deliberately not `server-only` so it is directly testable. The module
  comment records the four causes that previously collapsed into one message and
  why reporting an already-advanced Move as a gate block was the worst of them.
- **Changed** `src/lib/programs/origination-close.ts` — `CloseP0Result` gains a
  required `outcome` field and a `movePhase` field. Each of the five returns sets
  its own outcome; the initializer sets the error outcome so that any path which
  does not set one explicitly (only the catch) is reported as an error rather
  than as an unexplained non-advance. No read, write, gate call, or control flow
  changes.
- **Changed** `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts`
  — the P0 branch's non-advance response derives its `error` code and `detail`
  sentence from the outcome, and reports `outcome` and `movePhase`. The
  server-log sentence is gone. Status codes unchanged.
- **New** `src/lib/programs/__tests__/origination-close-outcome.test.ts` — 14
  cases in a directory already swept by the required AI surface control catalog.
- **Changed** the approval route's suite — 3 added cases pinning the route's use
  of the classifier, and one existing fixture updated to carry the field the
  helper really sets.
- **Changed** `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__/origination-close-outcome.test.ts`
  — 14 of 14 cases pass.
- **PASS** — mutation testing of the classifier, 8 mutations, 8 killed, no
  survivors. Each mutation was applied against a pristine copy with an asserted
  single-occurrence match, and the baseline was restored and re-run green
  afterwards (14 of 14). The mutations: map the already-advanced outcome to the
  gate-block code (3 cases fail); give the success outcome a non-null code (1);
  collapse two stop codes together (1); drop the branch that avoids claiming a
  named check when the gate named none (1); include the phase clause when the
  phase is unknown (1); drop the whitespace collapse that the omitted clause
  needs (1); reinstate the server-log sentence (2); collapse two stops to the
  same sentence (1).
- **PASS** — mutation testing of the route wiring, 2 mutations, 2 killed. A
  correct classifier behind an unchanged route would be a fix nobody sees, so
  both halves of the wiring were mutated away: hardcoding the error code back to
  the gate-block value fails 3 cases, and restoring the previous server-log
  detail sentence fails 3 cases.
- **PASS** — `npx jest --runTestsByPath` on the approval route's suite — 42 of
  42 pass (39 before this change, 3 added).
- **PASS** — `npx jest src/lib/programs/__tests__` — 171 suites, 2210 tests, all
  pass. The whole directory was run rather than the new suite alone.
- **PASS** — `npx jest --runTestsByPath src/__tests__/integration/programs/phase-capture-gate-routes.test.ts`
  — 7 of 7 pass. This suite also mocks the close helper, so it is the second
  consumer of the changed return shape.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit` — exit 0, whole project.
- **PASS** — `npx eslint` on all five changed and added source files — exit 0,
  no findings.
- **PASS** — census regenerated with `npm run audit:test-ci-coverage:write`.
  `coveredTestFiles` 2679 → 2680, `uncoveredTestFiles` 165 unchanged,
  `testFiles` 2844 → 2845. The covered count rising by exactly the one added
  file with the uncovered count unchanged is the proof the new suite is wired,
  not dark.
- **NOT RUN** — live signed-in walk of the P0 close against a deployed revision.
  This task holds no authority to declare or advance a live Move, so nothing
  here is `live-proven`. See Known Gaps.
- **NOT RUN** — `npm run release:check -- --base origin/main --head HEAD` at the
  time of writing; run before the PR is opened.

## Rollout Plan

Squash-merge to `main` with auto-merge. The repo-owned ACA main deploy workflow
builds the digest-pinned image and shifts Product/Lab web traffic; this change
needs no migration, no backfill, no flag, and no per-tenant enrolment step.

No data-build job, no schema change, and no tenant input re-load is required.

## Deployment Authority

The repo-owned ACA main deploy workflow (`.github/workflows/aca-main-deploy.yml`)
is the only authority that may shift shared Product/Lab web traffic. This change
was prepared in a branch worktree and ran no Azure command, mutated no shared
runtime, and touched no revision weight or Container App template.

This record may say `merged` and, after the workflow runs, `deployed`. It may
not say `live-proven` until the ACA runtime invariant is proven (template image,
100%-traffic revision image, and required worker job images all matching the
approved digest) and a signed-in walk of the P0 close is captured. Neither has
been done.

## Rollback Plan

Revert the squash commit. The change is additive and stateless: one new module,
one new field on an in-memory return type, and one response body. Reverting
restores the previous error code and sentence exactly and needs no data repair,
because no persisted record, gate decision, phase value, or deliverable row is
written differently by this change. There is nothing to migrate back.

A partial rollback is also safe: reverting only the route edit restores the
previous response while leaving the classifier unused, and the type system still
compiles.

## Audit Evidence

- The classifier module's own comment records the four causes that previously
  collapsed into one message, and why an already-advanced Move being reported as
  a gate block was the worst of them.
- The new suite's header records the exact sentence that was being shown and why
  a product surface must not hand a product user a server log as a next action.
- The mutation results above are the evidence that the suite is non-vacuous and
  that the wiring, not just the derivation, is pinned.
- The census delta is the evidence that the new suite runs in CI.

## Known Gaps

- **The close helper's own per-return outcome assignment is not pinned by a
  behavioural suite.** `origination-close.ts` is `server-only` and no suite
  imports it directly — the two suites that exercise it both mock it — so the
  five assignments are held by the type system (the field is required on the
  return type, and each value is a checked literal) and by the route's response
  shape, not by a test that calls the helper. Giving that helper a test host is
  the obvious follow-on and would pin the mapping end to end.
- **The route's suite is wired only in a non-required job.** The three added
  route cases live in a directory named by `unit-suites.yml`, which no required
  check depends on, so they run on the PR but cannot by themselves fail a merge.
  The 14 classifier cases — where all of the logic is — are in a directory swept
  by the required AI surface control catalog and are merge-blocking. The required
  catalog's directory list was deliberately not edited this run to avoid
  conflicting with a queued PR that is already changing that workflow file.
- **Not `live-proven`.** No signed-in walk has exercised any of the five
  outcomes against a deployed revision. In particular the already-advanced path
  is the one most likely to be met in practice (a double submit) and the one
  whose previous behaviour was most misleading, and it has been verified only by
  test.
- **The four previously-silent causes remain untriaged as failures.** This change
  reports them accurately; it does not reduce how often they happen. If a real
  walk meets `brief_not_created` or `close_errored`, the underlying cause is
  still whatever it was — the difference is that the reader will now know which
  one it was and that the approval was recorded.
