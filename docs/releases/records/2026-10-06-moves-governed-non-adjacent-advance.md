# 2026-10-06-moves-governed-non-adjacent-advance — A governed phase transition is no longer refused for being non-adjacent

## Release ID

`2026-10-06-moves-governed-non-adjacent-advance`

## Status

`candidate`

## Plain-English Summary

Moves phases normally advance one step at a time, and the assistant's
phase-advance tool enforced that by arithmetic: if the requested phase was not
the current phase plus one, the request was refused.

The governance layer, though, is what actually declares which transitions
exist, and that set is not "every next-step pair". It also declares an opt-in
transition that deliberately skips several phases for a Move whose tenant
policy and complexity tag qualify it — the whole point of that lane is that it
is not a single step. The governance evaluator resolves that transition and
checks it against a real hard criterion.

So the tool refused a transition the governance layer fully implements, and the
only alternative it offered the caller was to *bypass* the gate — that is, to
skip the very check that exists to govern the jump. The governed path was
unreachable through the assistant; the ungoverned one was not. A caller who
took the suggestion instead advanced one step onto the long route the lane
exists to avoid.

This change asks the evaluator about the transition the caller actually
requested and lets the evaluator's own "no such rule" verdict decide adjacency.
A transition no rule covers is still refused, with the same error and the same
suggested one-step alternative. A transition a rule does cover now goes through
the normal gate-and-approval flow, where an authorized workspace user reviews
it, rather than being rejected outright.

## Layer Impact

Release lane: `global-control-lane` — the guard is shared control-plane
behaviour for every client. The one new admissible transition stays
feature-gated behind the tenant-policy flag that already governed it.

- `4 PRODUCTS` (Moves) — one guard inside the assistant's phase-advance tool
  now reads the governance rule source instead of computing adjacency itself.
  No gate rule, criterion, severity, or approval requirement changed.
- Layers 1–3 (client intake, source adapters, canonical model) — untouched. No
  schema, migration, loader, adapter, dataset, or tenant data is involved.

## Client Applicability

- All clients: yes, in the sense that the guard is shared code. For a Move on
  the ordinary route the behaviour is unchanged, because an adjacent transition
  always has a rule and the evaluator never returns "no such rule" for it.
- Specific clients: the one new admissible case requires the tenant to be
  enrolled in the opt-in lane's flag AND the Move to carry the qualifying
  complexity tag. One tenant is enrolled today.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag. The newly reachable transition remains gated by
  the existing tenant-policy flag that already governed it; with that flag off,
  the evaluator returns "no such rule" exactly as before and the refusal is
  byte-identical.

## Changes Included

- `src/lib/agent/tools/program/advancePhase.ts` — the adjacency refusal is now
  derived from the evaluator's verdict for the requested pair instead of
  `to_phase !== fromPhase + 1`, and it runs after the gate evaluation rather
  than before it. The error code, the recovery text, the out-of-range check,
  the bypass exemption, the hard-fail block, and the approval requirement are
  all unchanged.
- `src/lib/agent/tools/__tests__/advance-phase-governed-transition.test.ts` —
  new suite, 9 cases. Wired by the existing directory-level invocation of
  `src/lib/agent/tools/__tests__` in `ai-surface-control-catalog.yml`, so it is
  not a dark suite.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- PASS — `npx jest src/lib/agent/tools/__tests__/advance-phase-governed-transition.test.ts`:
  9/9. Against the unfixed guard the suite fails 2 cases, both on the refusal
  that should not have fired; the case asserting the rule source really
  declares a non-adjacent transition passes on both sides, so the behavioural
  cases are not pinned against a pair production cannot present.
- PASS — `npx jest src/lib/agent/tools/__tests__ src/lib/agent/tools/program/__tests__`:
  14 suites, 100 tests. Covers the pre-existing phase-advance and approval-gate
  suites for this tool.
- PASS — `npx jest src/lib/programs/__tests__/governance-evaluate-gates.test.ts src/lib/programs/__tests__/governance-gates.test.ts`:
  2 suites, 54 tests. The evaluator and rule source are unmodified and still
  agree.
- PASS — mutation check, 6 mutations, 6 killed: drop the bypass exemption;
  treat every pair as governed; treat no pair as governed; read the wrong
  verdict key; `some` → `every`; restore the original arithmetic guard. The
  first attempt left the bypass-exemption mutation alive — the bypass case used
  a governed pair, so it never exercised the exemption — and a case for an
  ungoverned pair with bypass set was added, which kills it.
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- PASS — `npx eslint` on both changed files, exit 0.
- PASS — census honesty, measured in isolation. Regenerating on the unmodified
  base moves `testFiles` 2763 → 2764, so the committed census was already stale
  by one file before this branch. This branch's own delta on top of that is
  exactly +1 `testFiles` and +1 `coveredTestFiles` with `uncoveredTestFiles`
  unchanged at 164 — the proof that the new suite is registered rather than
  dark. Final 2765 / 2601.
- NOT RUN — live signed-in walk. This change has no runtime rollout of its own
  and the newly admissible transition needs a Move carrying the qualifying tag,
  which no Move on the critical demo path has.

## Rollout Plan

Merge to main. No migration, no flag change, no environment variable, no image
or traffic change. The guard ships with the next ordinary web image build from
main through the repo-owned deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. This
  change requests no deploy of its own.
- Shared runtime mutators: none. No `az containerapp update`, no traffic shift,
  no revision weight change, no template edit.
- Approved image digest: not applicable — no runtime update is requested here.
- ACA runtime invariant: unchanged by this release; whatever digest is approved
  at the next main deploy continues to govern.
- Worker image invariant: unchanged. No worker job is touched.
- Feature/env flag update path: none. No flag is created, enrolled, or
  unenrolled.
- Live signed-in proof required: no for this change on its own. The newly
  reachable transition should get a signed-in proof when a Move that qualifies
  for the opt-in lane is first taken through it.

## Rollback Plan

Revert the PR. The change is one guard in one function plus a new test file and
a regenerated census; nothing persists state, so a revert restores the prior
behaviour immediately with no data to undo. Reverting re-refuses the
non-adjacent governed transition, which is the pre-change behaviour, not a
broken one.

## Audit Evidence

- PR URL and its CI run on this branch.
- The new suite, which states the defect in its header comment and fails on the
  unfixed guard.
- The mutation results above.
- The census delta, reproducible with `npm run audit:test-ci-coverage:write` on
  the base and on this branch.

## Known Gaps

- The product's own phase-advance button computes its target as the current
  phase plus one, so the opt-in lane still has no front door in the Moves UI
  even after this change. Reaching it requires the REST advance endpoint, which
  has no adjacency guard, or the assistant tool fixed here. Making the button
  offer the lane needs the eligibility decision resolved server-side for the
  surface that renders it; that is not attempted here.
- The gate-criteria surfaces still list the criteria for the current phase plus
  one, so for a Move on the opt-in lane the panel names criteria that do not
  govern its transition and does not name the one that does. The criterion in
  question passes whenever the lane is reachable at all, so this misleads
  rather than blocks, but it is a real divergence between what the panel shows
  and what the evaluator decides, and it is not fixed here.
- The criterion-to-deliverable-key join remains inline literals inside the
  evaluator's switch, so guards over it must restate expectations as literals
  instead of enumerating a declared source.
- Three criteria are implemented in the evaluator's switch but named in no
  rule's check list, so they are never evaluated. Left alone; removing them is
  a separate judgment about whether they are planned or abandoned.
