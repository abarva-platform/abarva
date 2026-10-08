# 2026-10-08-a-carried-soft-gap-states-its-cause — A carried soft gap states its cause

## Release ID

`2026-10-08-a-carried-soft-gap-states-its-cause`

## Status

`candidate`

## Plain-English Summary

When a Move crosses the P4→P5 gate while three of its softer criteria are still
unmet, the gate decision record is the auditable account of what was
outstanding. For three of those criteria it was recording the criterion's own
title instead of what was actually missing — a line reading "Funding or capacity
approval recorded" next to a criterion that was *not* satisfied. A later reader
could not tell whether the document was missing entirely or merely unsigned, and
neither state was named.

This change gives each of the three a stated cause, reusing the four-state
diagnosis already shipped for the blocking criteria.

It also fixes a second, quieter problem in the sentences themselves. Every
diagnosis sentence names a next action, and every one of those actions was a
build — "Run Approve & Build", "Regenerate", or a warning that re-running the
build would clear the signature. That is only true of a document some phase's
Approve & Build set produces. These three criteria wait on documents that **no**
build set produces: they are saved through the workspace assistant, and all eight
of the keys they accept are absent from the deliverable registry entirely. So the
old wording would have told a reader to run a build that cannot produce the
document, and warned them off a rebuild that could never have touched it —
prescribing an action ruled out by the same fact that caused the refusal.

The producer is now **derived** rather than declared: the sentence builder asks
whether the document's key appears in any phase build set, and takes a second
form when it does not. Deriving it has two consequences worth stating. A caller
cannot forget to supply it, because there is nothing to supply; and a document
later added to a build set gets the build wording back with no edit, so the new
branch cannot harden into a permanent exemption.

Only two of the four causes needed that second form. The other two are
structurally unreachable for these documents: the sign-off verdict resolves the
approval-currency scope before either of them, and an unregistered key resolves
to no phase, so the verdict returns a pass first. That is asserted in the suite,
not just stated here — if one of these keys is ever registered, the assertion
fails and the remaining two arms come into scope.

Nothing about which Moves pass or fail changes. The three criteria were and
remain soft, and their pass condition is byte-identical.

## Layer Impact

- Lane: `global-control-lane`

**Products** — the Moves phase-gate surface. The three criteria are soft, and
both blocked-message readers filter to hard failures before reading a reason, so
no on-screen sentence changes today. The field that does change is the reason
carried into the gate decision artifact, which the advance route writes for
every soft failure and which renders in that record's gap table.

**Canonical model** — untouched. No schema, no read model, no projection, no
migration.

## Client Applicability

- All clients: yes — gate reason wording is shared app behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This replaces text on a path that already reported a
  failure; it adds no control and opens no new state.

## Changes Included

- `src/lib/programs/deliverable-signoff-diagnosis.ts` — adds
  `DeliverableProducer`, `DELIVERABLE_PRODUCERS` and
  `resolveDeliverableProducer`, which answers whether a document key appears in
  any phase build set. Exact membership, matching the module's existing
  registry lookup. `describeDeliverableSignOffFailure` derives the producer
  internally and branches the `absent` and `not_signed_off` arms on it; the
  optional `phaseBuildSets` override exists so the branch can be exercised
  against a constructed set, including the case the shipped registry does not
  contain. The two build-shaped arms are unchanged, and the module docstring now
  records why.
- `src/lib/programs/governance.ts` — three criteria move from the bare boolean
  predicate to the verdict plus the sentence builder:
  `funding_approval_recorded`, `sponsor_alignment_confirmed` and
  `tower_handoff_plan_accepted`. The boolean each contributes is produced by the
  same call the predicate wraps, so the pass condition is unchanged. Each names
  the document by the spelling its own row carries, falling back to the primary
  spelling when no row exists, so an alias group does not report a document the
  Move does not have.
- `src/lib/programs/__tests__/deliverable-signoff-diagnosis.test.ts` — the pure
  module. Covers the derivation over all eight accepted keys, their absence from
  the registry (the fact the arm scoping rests on), the two new sentence forms,
  the five existing criteria keeping their build wording, the alias that no
  build set carries, and the flip back to build wording once a key joins a set.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts` — the wiring.
  Invokes the real gate evaluator with a mocked data plane, because the suite
  over the pure module stays green with all three evaluator arms reverted. The
  criterion's declared text is read from the rule catalog rather than copied, so
  a reworded criterion cannot make the assertion vacuous.

## QA / Validation

- `npx jest src/lib/programs/__tests__` — **PASS**, 182 suites / 2,480 tests.
- `npm run test:behaviors` — **PASS**, 208 suites / 2,163 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  **PASS**, exit 0.
- `npx eslint` on the four changed files — **PASS**, clean.
- `npm run release:check -- --base origin/main --head HEAD` — see below.
- Mutation testing — **12 mutations, 12 killed.** Both suites run together
  (142 cases at base):
  - producer forced to `phase_build` → 25 fail.
  - producer forced to `authorship_only` → 19 fail.
  - `absent` arm reverted to the single build sentence → 12 fail.
  - `not_signed_off` warning emitted for both producers → 12 fail.
  - `not_signed_off` warning emitted for neither → 7 fail.
  - all six diagnosis call sites stripped from the evaluator → 39 fail.
  - each of the three new arms reverted **individually** → 3 / 4 / 3 fail, so
    every arm is covered on its own rather than one carrying the others.
  - the row's own key spelling ignored in favour of the primary alias → 1 fail.
  - one criterion forced to pass → 3 fail.
  - the verdict's status dropped from one handoff → 1 fail.
- Census: **not changed.** No test file was added — the four changed files are
  all pre-existing. A regen reads `testFiles` +2, and a regen of the merge base
  with all four files reverted in place reads the **same** +2, so the drift is
  inherited and deliberately not carried.
- Prettier: measured per file, in place. `governance.ts` warns at the base too
  and its only unclean line is ~1,400 lines from any hunk here, so it was left
  alone rather than pulling a pre-existing reformat into the diff. The gate test
  file was clean at base, so the three unclean lines were mine and were
  formatted.
- Live signed-in walk — **NOT RUN.** Owed; see Known Gaps.

## Rollout Plan

Merge to `main`. No migration, no flag, no worker, no environment variable, no
Azure action. It reaches users with the next ordinary web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This change mutates no runtime.
- Approved image digest: not applicable — no deploy performed here.
- ACA runtime invariant: not asserted; nothing in this release deploys.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable; no flag.
- Live signed-in proof required: yes, before anyone calls this `live-proven`.
  Not performed here.

## Rollback Plan

Revert the PR. The three evaluator arms return to the one-line predicate call
they came from, which is in the diff verbatim, and the two sentence arms return
to their single form. Nothing persists state, no migration is involved, and the
new exports have no importer outside the module and its suite.

## Audit Evidence

- The two suites above, both merge-blocking through the required AI surface
  control catalog's directory-wired step for `src/lib/programs/__tests__`.
- The mutation results recorded under QA, including the three per-arm reverts.
- The derivation is read from the deliverable registry's own phase build sets,
  so the claim "no build produces this document" is checked against the registry
  on every call rather than asserted in a comment.

## Known Gaps

- **No signed-in walk.** Nothing in this release is `live-proven`.
- **The three criteria stay soft.** Promoting any of them is a governance call,
  not a code change, and is not attempted here.
- **The reason still does not reach a screen.** Both blocked-message readers
  drop soft failures before reading a reason, by design. This release improves
  the audit record; surfacing carried soft gaps to a signed-in reader is a
  separate product question.
- **The eight keys remain unregistered.** Registering them would make the other
  two diagnosis causes reachable for these documents and would need the
  producer-aware treatment extended to those arms. The suite asserts the
  unregistered state, so that change fails a test rather than shipping quietly.
- **One sentence names a control by name.** The authorship wording points at the
  workspace assistant. If that control is renamed, the sentence needs the same
  registry-derived treatment the document labels already have.
