# 2026-10-06-moves-route-decision-withholds-unconfirmable — P2 route decision stops offering a choice that cannot validate

## Release ID

`2026-10-06-moves-route-decision-withholds-unconfirmable`

## Status

`candidate`

## Plain-English Summary

On the P2 Discover capture screen, a reviewer validates the solution route: they answer three
questions (what the solution produces, how much the workflow changes, how much roles and
accountability change), the product derives a recommended route from those answers, and the
reviewer either confirms that recommendation or corrects it with a rationale.

For four of the forty-five answer combinations those three questions can express, no route follows
from the answers, and the screen says so — it shows the recommendation as "Not yet determined". It
nevertheless offered "Confirm recommendation" as a choice. Picking it stored an empty route, which
the validator rejects, so no validated route existed. Every control on the form was filled in and
nothing on the page objected.

That mattered more than a cosmetic gap, because a validated route is a hard requirement in two
consecutive phase gates — leaving P2 and leaving P3. A reviewer who confirmed a non-recommendation
was parked against a hard gate that no further capture could clear, and the gate's own message
named neither the cause nor the way out. The only exit was the other choice, "Correct
recommendation", and nothing said so.

This change stops offering a choice that cannot succeed. When no route follows from the answers,
"Confirm recommendation" is withheld, and a short note explains that there is no recommendation to
confirm and points at the two things that do work: record the route with "Correct recommendation"
and a rationale, or revise the three answers above. Where a route does follow, the form is
unchanged.

No gate was loosened or tightened by this change. The combination it withholds never produced a
validated route; it simply stopped being offered.

## Layer Impact

Release lane: `global-control-lane` — shared product behaviour for all clients, with no feature gate
of its own.

- **Products (Moves):** the P2 solution-route capture control and the note beside it. This is the
  only behavioural change.
- **Canonical model:** unaffected. No schema, stored shape, or gate rule changed. The decision
  values written to the capture section are the same ones as before.

## Client Applicability

- All clients: yes — the capture control is shared by every host that renders the solution-route
  question, and the rule is not client-scoped.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added. The redesigned 3-step capture flow remains behind its existing flag;
  this change applies to that flow and to the other hosts of the same control alike, because the
  fix is in the shared control rather than in any one host.

## Changes Included

- `src/lib/programs/solution-route-decision.ts` — new. The single place that answers "can confirming
  work against this recommendation?", plus the offered choices and the reason to show when it
  cannot. New module rather than an edit to the route-assessment file, to keep it clear of
  in-flight work on the hot shared modules.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the solution-route capture form
  renders its decision options from that module and shows the reason when confirming is withheld.
  The two hardcoded `<option>` elements are gone.
- `src/lib/programs/__tests__/solution-route-decision.test.ts` — new suite, 8 cases.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 4 new cases.
- `docs/architecture/test-ci-coverage-census.json` — regenerated for the new suite.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__/solution-route-decision.test.ts` — 8 tests. The rule
  is driven through the real resolver rather than asserted against itself, and the four
  unconfirmable answer combinations are written out as literals so a change to the recommendation
  table has to move the list rather than quietly re-derive it.
- **PASS** `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` —
  216 tests, including the 4 new cases.
- **PASS** `npx jest src/lib/programs/__tests__` — 129 suites, 1309 tests. Whole directory, not only
  the new suite.
- **PASS** Mutation check, 6 mutations, 6 killed: the availability rule inverted; the offered-choice
  list forced to both values; the reason forced to null; the reason's named exit removed; the
  component's reason element deleted; the component's options hardcoded back to the two literals.
  Each was applied from a committed baseline and reverted, and the baseline was re-run green after.
- **PASS** `npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` on the four changed files — 0 errors. The two warnings on the component file
  are unused imports that are present and identical on `origin/main`; verified by linting
  `origin/main`'s copy of the same file.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** Live signed-in walk. This change is not deployed by this record and the walk depends
  on a phase whose inputs are not yet loaded and approved; see Known Gaps.

## Rollout Plan

Merge to `main` via squash. No migration, no feature flag, no environment variable, no worker job,
and no runtime mutation. It reaches the product with the next ordinary image build and deploy
through the repo-owned deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Not invoked by this record.
- Shared runtime mutators: none. No Azure command is run by this change.
- Approved image digest: not applicable; no runtime update is requested here.
- ACA runtime invariant: unchanged by this record.
- Worker image invariant: unchanged by this record.
- Feature/env flag update path: none; no flag is added, enrolled, or altered.
- Live signed-in proof required: yes, before this is described as live-proven. Not claimed here.

## Rollback Plan

Revert the squash commit. The change is four files with no stored-data component: the capture
section's value shape is unchanged, so records written while this is live are readable before and
after a revert, and records written before it remain readable. Reverting restores the previous
control exactly, including the choice this change withholds.

## Audit Evidence

- The PR for this branch, its CI run, and the diff of the four source files.
- The new suite and the 4 added component cases, which state the mechanism in their own comments.
- The mutation results listed under QA / Validation.
- The regenerated census: total test files and covered test files each move by two — one for the new
  suite and one for a file already on `main` that had not been counted — with uncovered test files
  unchanged at 164.

## Known Gaps

- **Live signed-in proof is still owed** and is not claimed. The phase this control sits on cannot
  be walked end-to-end yet: its dataset manifest still records no owning client key and neither a
  load nor a serving approval, so the evidence the route validation references is not available to
  select. That is a data-lane and human-approval dependency, not a code one, and it is unchanged by
  this record.
- **The reason text is advisory, not enforced.** Nothing prevents an API client or an agent from
  writing a stored decision of "confirm" against answers that resolve to no route. Such a record is
  rejected by the validator exactly as before, so no gate can be passed by it, but the write itself
  is not refused at the boundary. Refusing it server-side is the stricter follow-up and was left out
  deliberately: it would be a new refusal on a write path, which is a product decision rather than a
  dead-end repair.
- **Why no route follows from those four answers is unchanged.** All four are the "mixed" solution
  output with workflow and role change both below material. Whether that combination *should* map to
  a route is a product judgement about the recommendation table, not a defect, and this change does
  not make it. It only stops presenting a choice that cannot act on it.
- **The recommendation shown for those answers still reads "Not yet determined"** with no guidance on
  which answer to revisit. The note names revising the answers as an option but does not say which
  of the three is the one that leaves the route unresolved.
