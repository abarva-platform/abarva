# 2026-09-26-u529-source-event-shell-f8-clauses — Behavioural suite for the four Source event-shell clauses

## Release ID

`2026-09-26-u529-source-event-shell-f8-clauses`

## Status

`candidate`

## Plain-English Summary

The Source event shell — the page an operator sees when they open a sourcing
event — is required to carry four things: one navigation bar and not two, a
phase rail drawn from that event's own journey, exactly one next action, and
blockers that name their own reason instead of a generic line. Until now
nothing in the repository asserted any of the four. A grep for the duplicate-nav
rule across the whole tree found only the nav component itself, and the shell
had no test file of its own.

This adds one behavioural suite that mounts the shell the way its route mounts
it — inside the same chrome the route's layout wraps it in — and asserts each
clause separately, so a failure says which one broke.

Two things are worth stating plainly.

**The item named the wrong component.** The backlog row filed
`src/components/source/canvas/EventWorkspace.tsx` as the shell and said two
routes mount it. On the commit this was written against, that file has no
importers anywhere outside itself, neither named route mounts it, and its own
doc comment describes it as the right-pane tab strip: no header, no phase rail,
no blocker list. A suite written over it would have asserted four clauses about
a surface nobody can reach. The shell those routes reach is
`SourceAnalyticsCanvas`, so the suite was retargeted onto that.

**One clause is met differently than the row assumed.** The rail's labels do
track the event's own journey — an event on the contract-optimization journey
gets that journey's stage names, not the canonical ones — and the suite proves
it by asserting both that the journey's labels appear and that the canonical
names it renames do not.

No product code changed. This is a test file and this record.

## Layer Impact

Release lane: `global-control-lane` — the assertion runs for every client's
build of the shared Source shell, and is not gated behind a flag or scoped to
one tenant. Nothing client-scoped, internal-admin, public-demo or experimental
is touched.

- **Products (layer 4)** — Source only, and read-only: the suite renders the
  event shell and asserts what it draws. No product behaviour changed.
- **Canonical model (layer 3)** — untouched. The suite reads the shell view
  model that the shell already builds; it writes nothing and adds no new
  source of truth.
- Layers 1 and 2 are untouched.

## Client Applicability

- All clients: no behaviour change.
- Specific clients: none.
- Internal only: yes — CI assertion only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.f8ShellClauses.test.tsx` — new, six cases across the four clauses.
- This release record.

No product file, route, migration, script or dataset changed.

## QA / Validation

**Scoped clean baseline**, measured in a separate worktree checked out at the
exact merge base (`dd43f102a`), not a stash:

| scope | before | after |
|---|---|---|
| `src/components/source/canvas/analytics/__tests__` | 18 suites / 152 tests / 0 failing | 19 suites / 158 tests / 0 failing |

**Mutation proofs — seven mutations, seven caught**, each confirmed to change
rendered output first, each reverted from a pristine copy of the file rather
than by hand:

| # | mutation to the shell | clause it should break | assertion that fired |
|---|---|---|---|
| 1 | the journey rail claims `role="navigation"` | 1 — no second navbar | landmark count 1 → 2 |
| 2 | the rail ignores the journey the event declares | 2 — rail from event data | a declared journey stage is missing from the rail |
| 3 | the canvas ignores the supplied stage view and always uses the `SAMPLE_*` fallback | 2 — no sample text | a sample fixture string renders in the shell |
| 4 | a second stage status strip is rendered | 3 — one next action | next-action chip count 1 → 2 |
| 5 | the blocker panel prints one generic line instead of each reason | 4 — specific blockers | zero `"<artifact>: <why>"` reasons found |
| 6 | the rail renders zero checkpoints | 2 — population guard | rail population assertion, not the property |
| 7 | the primary nav landmark is removed from the top nav | 1 — population guard | landmark population assertion, not the count |

Mutations 6 and 7 exist for one reason: an "exactly one" or "labels match"
assertion passes vacuously when the thing under test never renders. They prove
the population guard in each clause fires first, so an empty shell fails rather
than reads as clean. Mutation 3 also breaks clause 4, which is expected — the
sample stage view leaves required inputs open, so the blocker surface does not
render at all.

Every case is signed in, because the top nav renders its landmark only for a
signed-in user; a signed-out mock would have made clause 1 count zero landmarks
and pass for the wrong reason.

**Other gates**

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit 0, 0 diagnostics, with `tsconfig.tsbuildinfo` deleted first.
- `npx eslint` on the new file — exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see the PR.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in this change is imported by the
application, served by a route, or built into an image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command was run for this change.
- Approved image digest: not applicable — no image content changed.
- ACA runtime invariant: unchanged by this release; the deploy run for the merge
  commit still asserts it.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no, and this is a limit rather than a
  certainty.** The change adds a test file and nothing else; no product surface
  renders differently after this merge than before it. The suite mounts the
  shell with a mocked signed-in session, which is a render of the component, not
  a signed-in run of the route against live tenant data.

## Rollback Plan

Revert the PR. There is nothing else to undo: no migration, no flag, no runtime
template and no data.

## Audit Evidence

- PR URL and CI run — recorded in the PR.
- The clean-baseline numbers above, reproducible by running the scoped jest path
  in a worktree at `dd43f102a` and again on this branch.
- The mutation table above; each row names the edit and the assertion that fired.

## Known Gaps

- **The backlog row's premise is corrected here, not in the row.** The pulse and
  backlog entries record that `EventWorkspace.tsx` is unreachable. Whether that
  component and its sibling `EventStepRail.tsx` — also with zero importers —
  should be deleted or wired is a product decision and is filed separately, not
  taken here.
- **Clause 3 is asserted over the stage operating-status panel**, which is the
  shell's single stage-level next action. Per-step "Next action" cells inside
  the evidence table are a different grain and are deliberately not counted; if
  the product later declares those part of the same clause, the case needs
  widening rather than the assertion loosening.
- No signed-in run, per the item's own boundary.
