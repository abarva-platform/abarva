# 2026-10-05-moves-handoff-recap-host-reachability — Moves: pin the hand-off recap's reachability at its host call site (test-only)

## Release ID

`2026-10-05-moves-handoff-recap-host-reachability`

## Status

`candidate`

## Plain-English Summary

At the end of each phase of the redesigned capture flow there is a recap: a
read-back of every answer the person gave, each one marked with how it is known,
above a rollup that totals those bases. It is the last thing a person should see
before they commit a phase.

In the configuration the product actually serves, it was unreachable. The last
step of the flow has exactly one forward control, and the phase workspace always
fills that slot with the real governed approval control — so the only code path
that opened the recap had no caller. The remedy, behind a default-off flag, adds
a second, quieter control that opens the recap as a **review**: nothing is
submitted, the recap may not claim it was, and the governed approval control
travels onto the recap so the decision still runs through the existing gate
pipeline rather than a second submit path.

The rule itself, and the copy it licenses, are already covered twice — as a pure
module and on the flow component, where the approval control is a stub button.
What neither can establish is the part that made this a defect in the first
place: what the **phase workspace** passes down. That component supplies a
non-null approval slot on every path that mounts the flow — the real approval
control for someone who may approve a gate, an authorization note for everyone
else — which is precisely why the forward slot is always spent and why the flag
is the only thing that can open the recap. Nothing checked that.

This change adds no product behaviour. It adds six cases to the workspace
component's existing suite:

- **flag off (the default)** — the real governed control holds the last step's
  one forward control, there is no review control, and the recap is nowhere;
- **flag on** — the review control opens a recap built from the workspace's own
  saved answers, so a real captured answer is what reads back, not a label or a
  placeholder;
- **what travels** — the recap carries exactly one instance of the real governed
  control, offers no way into the next phase, and no heading says the phase was
  submitted or complete;
- **a viewer who cannot approve a gate** — still reaches the recap, and the
  authorization note travels in place of the control, so the flag and not the
  viewer's permission is what governs reachability, and the recap is no way
  around the gate;
- **the flag cannot manufacture a surface** — with the redesigned capture flow
  off, a tenant enrolled in this flag alone sees exactly today's product;
- **the basis read-back** — opened as a review, the recap carries the
  workspace's basis rollup *and* a per-question basis mark on every question row
  it lists, each stating the basis that was recorded.

The last two are the ones most worth having. The rollup is the workspace's one
fold of the declared bases — the same computation the gate dialog discloses — and
a review that showed the answers without it would drop the only thing that says
how they are known. And the per-question marks are passed as a separate slot
from the rollup: dropping that one prop leaves the rollup intact, so a case that
only looked for the rollup would not notice.

## Layer Impact

Lane: `experimental` — test-only cover for an existing feature-flagged,
non-default capability. No product file changes, so the live product is
unchanged on every code path regardless of flag state.

- `4 PRODUCTS` (Moves): **no change**. One existing test file gains cases. No
  component, route, API, flag registry or generated artifact is touched.
- `3 CANONICAL MODEL`: no change. No schema, no migration, no stored shape.

## Client Applicability

- All clients: No — nothing ships to any surface.
- Specific clients, selected by feature flag: the capability these cases cover
  is gated by `moves_capture_handoff_recap_v1`, conjoined at the route with
  `moves_capture_v2`. The recap flag's tenant list is **empty**, so the review
  control renders for nobody today. This change alters neither flag nor either
  list.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_capture_handoff_recap_v1` (tenant policy, default off),
  `moves_capture_v2`, `moves_charter_basis_v1` — all unchanged.

## Changes Included

- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — six cases pinning the hand-off recap's host call site: the flag that offers
  the review control, the recap's answers sourced from the workspace's captured
  values, the real governed control travelling onto the recap with no
  submission claim and no next-phase control, the non-approver path, the
  conjunction with the redesigned capture flow, and the basis rollup plus the
  per-question basis marks on a review.

No other file is modified. The suite is already registered by exact path in
`.github/workflows/ai-surface-control-catalog.yml`, so neither the catalog nor
the CI coverage census changes.

## QA / Validation

- `jest` (the six new cases) — **PASS**: 6/6.
- `jest` (`MovesPhaseStandaloneClient.test.tsx`, whole suite) — **PASS**:
  182/182, up from the 176 on `main`.
- `jest` (`src/components/strategic-moves/__tests__`, the whole directory) —
  **PASS**: 37 suites / 521 tests. The whole directory rather than the one
  suite, because the cases render through a component that sibling suites also
  render through.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit 0, no type errors.
- `eslint` on the changed file — **PASS**: 0 problems.
- Mutation check of the call site these cases claim to guard — **PASS**: seven
  mutations, seven deaths, each measured against the whole suite rather than
  only the new cases, and the suite restored to 182/182 after each. Hard-coding
  the review flag off failed 4 cases; hard-coding it on failed 1; removing the
  workspace's approval slot failed 5; dropping the basis rollup failed 1;
  blanking the answer read-back failed 1; giving an unauthorized viewer the real
  approval control failed 1; dropping the per-question basis marks failed 1. An
  eighth mutation — short-circuiting the branch that picks which approval
  control the slot holds — **survived and was discarded as a false survivor**:
  the fixtures all render a phase for which that branch was already not taken,
  so the mutation changes the file and no behaviour. It was replaced by the
  authorization mutation above, which does change what renders, and that one
  died.
- Visual signed-in walk — **NOT RUN**, and not applicable: this change ships no
  renderable difference, and the capability it covers renders for no tenant.

## Rollout Plan

Merge to `main` via squash PR. Nothing to roll out — no product code changes, so
the merged commit is inert at runtime. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow like any other commit.

## Rollback Plan

Revert the PR. Because the change is confined to one test file, reverting
removes test cover and nothing else; no data migration, no flag change, no
runtime effect either way.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`. This change shifts no shared Product/Lab traffic, mutates no
revision weights, and touches no Container App template, env var or secret.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: unchanged; this release pins none.
- ACA runtime invariant: unaffected — no runtime update is requested.
- Worker image invariant: unaffected — no worker job changes.
- Feature/env flag update path: not used; no flag or env var is touched.
- Live signed-in proof required: No — no renderable difference on any path, and
  the covered capability is enrolled for no tenant.

## Known Gaps

- **The review control is still enrolled for nobody.** These cases establish
  that the workspace wires the flag correctly; they do not establish that the
  recap reads well to a person, which needs a tenant enrolled and a signed-in
  walk. Until then the recap remains deployed and unreachable in the served
  configuration — the defect these cases describe is pinned, not retired.
- **The flow's own conjunction with the redesigned capture flow is resolved at
  the route, not here.** The workspace receives one already-conjoined prop, so
  the case for that conjunction pins the observable consequence — the flag alone
  grows no affordance on the legacy canvas — rather than a guard in this
  component that could regress on its own.
- **One mutation of the approval-slot branch is unreachable from these
  fixtures** and was discarded rather than reported as a gap; the branch it
  guards belongs to a different phase's arm, which has its own cases.
- The cases drive the recap through its own control and inherit whatever the
  basis fold produces for the answers they record. They assert every question
  row carries a mark stating the recorded basis; they do not re-prove the fold's
  arithmetic, which has its own suite.
- Nothing in this capability has been measured at phone width — jsdom does not
  lay out, so no test in this suite can establish it.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR.
- The reachability rule these cases feed is stated once as a pure module
  (`src/lib/programs/capture-handoff-reachability.ts`) and is covered, together
  with the flow component and a stub approval control, by
  `src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx`. This
  increment closes the join between that rule and the component that supplies
  the real control.
