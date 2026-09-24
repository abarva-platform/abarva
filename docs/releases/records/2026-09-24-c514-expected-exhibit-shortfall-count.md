# 2026-09-24-c514-expected-exhibit-shortfall-count — Count the exhibits a deliverable asked for against the ones it received

## Release ID

`2026-09-24-c514-expected-exhibit-shortfall-count`

## Status

`candidate`

## Plain-English Summary

Generated deliverables declare, up front, which exhibits they expect. The generation
pass is deliberately allowed to omit an exhibit rather than fabricate a placeholder
one. Nothing compared the two lists, so a deliverable that asked for three exhibits
and received one produced no signal at all — no warning, no blocker, and no number.
The only absence check fired when a document had zero exhibits, which is the rarest
case, not the likely one.

The quality gate now counts them: how many exhibits the brief expected, how many
arrived, and which expected ones did not. The shortfall is reported as a named,
counted advisory alongside the other quality warnings, and the counts are carried in
the quality metrics so a later reviewer can read the number instead of inferring an
omission from a blank area on a slide.

This is deliberately advisory. Refusing to export a deliverable because an exhibit is
short is a product decision about whether a partial artifact is worse than a late one;
this change makes the shortfall visible and does not make that decision.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 PRODUCTS: adds an advisory quality signal to generated deliverable output.
  No product surface or route changes.
- **One persisted number moves, and it is named here rather than left to be discovered.**
  `pass` is computed from blockers alone (`blockers.length === 0`), so the advisory cannot
  block an export. But two persisted generation metrics are derived from the warning list:
  `manualEditNeeded` is true whenever any warning fired, and `qualityScore` is
  `max(0.5, 1 - warnings * 0.1)`. A generation that is short an expected exhibit will
  therefore record `manualEditNeeded: true` and a quality score 0.1 lower than before.
  That is the intended direction — a deliverable missing a visual it asked for genuinely
  needs a human before it ships — but it does mean the metric series has a step in it at
  this release, and a trend drawn across the boundary is not comparing like with like.
- No canonical model, adapter, intake, or tenant data is touched.

## Client Applicability

- All clients: applies to every deliverable generated through the orchestrated path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none — it rides the existing quality gate.

## Changes Included

- `src/lib/deliverables/orchestrator/quality-validator.ts` — greedy one-to-one match of
  expected exhibits to produced ones by kind; a counted, named advisory when any expected
  exhibit did not arrive.
- `src/lib/deliverables/orchestrator/orchestrator.ts` — the production path passes the
  resolved brief's expected exhibits into the gate. The request side exists only here;
  the gate cannot recover it from the request object.
- `src/lib/deliverables/orchestrator/types.ts` — three optional metrics fields. They are
  absent rather than zero when no expected list was supplied, because "not measured" and
  "measured, none expected" are different facts.
- `src/lib/deliverables/orchestrator/__tests__/c514-expected-exhibit-shortfall.test.ts` — new.

## QA / Validation

Measured against a clean checkout of `origin/main` `333f2d408` in a separate worktree,
same command and same scope on both sides — not a stash.

- New suite, before the fix: **6 failing of 6**. After: **7 passing of 7** (the seventh
  case did not exist before the production call site was wired, and is listed as
  mutation 1 below).
- Scope baseline `src/lib/deliverables/orchestrator/__tests__`:
  **24 suites / 315 tests / 0 failing before → 25 suites / 322 tests / 0 failing after.**
  The +7 is exactly the new suite; no existing test changed behaviour.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**,
  zero diagnostics, judged by exit code. (The first run of this caught a missing required
  property in the new fixture helper that the jest run had passed over.)
- `npx eslint` on the four changed files — exit 0.

**Five mutations, five caught.** Each was confirmed to change the source before the suite
was run, so that none is a no-op reading as coverage:

| # | Mutation | Failing cases |
|---|---|---|
| 1 | Production call site drops the brief and calls the gate with two arguments | 1 |
| 2 | Match by kind without consuming the produced exhibit (one exhibit credited twice) | 1 |
| 3 | Shortfall condition can never hold, so no advisory is ever raised | 3 |
| 4 | Every expected exhibit is counted as received | 5 |
| 5 | The missing-exhibit list is reported empty | 2 |

Mutation 1 is the one that matters most: a correct counter the production path never hands
a brief to is, from outside, the same as no counter.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the web image.
No migration, data load, flag change, or tenant data mutation.

## Deployment Authority

- Repo-owned deploy workflow: yes, main merge deploy.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: no. This change adds an advisory signal to a server-side
  quality result; it renders nothing and changes no gate outcome, so a signed-in lane
  would be a proof with no subject. The signed-in proof that IS owed — judging a rendered
  deck end to end — is tracked separately and is not claimed here.

## Rollback Plan

Revert the PR and let the repo-owned deploy workflow roll the image back. Nothing to undo
in data; the advisory is computed per generation and stored nowhere.

## Audit Evidence

- The contract this restores is stated in the repository's own type definition: the doc
  comment on the renderable exhibit's structured data says that when it is absent the
  renderer must not invent a generic diagram and the quality gate should surface the
  missing visual. The renderer half of that sentence shipped; the gate half did not.

## Known Gaps

- The match is by exhibit kind, so an artifact that returns an exhibit of the right kind
  under the wrong title counts as received. Title matching was not attempted because
  generated titles are meant to be the executive conclusion rather than the brief's
  category label, and matching on them would report false shortfalls on correct output.
- The advisory is computed and returned; it is not persisted, so it cannot yet be
  aggregated across generations to show whether omissions are rare or routine. Reading
  that trend needs a store, which this change does not add.
- Whether a shortfall should refuse the export is not decided here, and its absence is
  not a verdict either way.
- The end-to-end signed-in proof of a rendered deck — counting exhibits on the slides
  themselves rather than in the gate's result — remains owed and is tracked separately.
  This change makes that count possible; it does not perform it.
