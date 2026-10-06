# 2026-10-05-u566-responses-stage-reachability — Whether an event is meant to reach the Responses stage is a journey question

## Release ID

`2026-10-05-u566-responses-stage-reachability`

## Status

`candidate`

## Plain-English Summary

A panel on the Source workspace — the Stage 04 vendor-readiness block, which carries a Request
authority row and a Strategy authority row — renders for nobody today. A signed-in walk read every
event the runtime serves and found the panel absent on all of them, including its own anchor
heading. The question that had to be answered first was not "what is wrong with the panel" but
"is any event *meant* to get there at all" — because if the answer were no, the panel and the two
authority rows inside it are dead code dressed as live product, and the honest fix is to say so
rather than to loosen the gate until something appears.

**The answer is yes, and it is decided per event by the event's sourcing journey, not by the
component.** The product has two journeys. The competitive sourcing journey visits the Responses
stage; the renegotiation journey declares that stage skipped and never visits it. The panel is
gated on the Responses stage, and the last phase the Source workspace shows is the market package —
the stage immediately before it. So on the competitive journey, an event sitting at the market
package is **one governed stage advance** away from the stage that mounts the panel. The walk
recorded an event at exactly that position.

That settles the branch: the panel is unreached *data*, not dead *code*. No UI change is owed, and
in particular the stage gate must not be widened — a panel that appears on an event whose journey
skipped the stage would be worse than one that appears on nobody. What is owed is a governed event
on the competitive journey that actually reaches the stage, which is data-plane work, and that is
filed as its own item rather than done here.

This change ships the settlement as a test, so the next reader does not have to re-derive it from
three modules. It changes no product code.

## Layer Impact

**Release lane: `internal-admin`.** Test-only. No client-visible behaviour, no data-plane change,
no public or demo surface.

- **Layer 3 (canonical model):** none. The journey definitions, the canonical stage order and the
  workspace phase rail are read, not modified.
- **Layer 4 (products):** none. No component, route, prompt or read model is touched. The Source
  workspace behaves exactly as it did before.
- **Test/tooling:** one case added to an existing suite.

## Changes Included

- `src/lib/source/__tests__/sourcing-motion-journeys.test.ts` — one case added, 10 → 11. It pins
  the three facts the settlement rests on: the last phase of the Source workspace rail is the
  market-package stage; on the competitive journey the next governed stage after it is Responses;
  and on the renegotiation journey no stage advances into Responses at all.
- `docs/releases/records/u566-responses-stage-reachability.md` — this record.

## Client Applicability

- All clients: no change
- Specific clients: none
- Internal only: yes — test scope only
- Public/demo only: no
- Feature flag: none

## QA / Validation

Measured over the one suite that changed, same scope before and after:

- Baseline on the branch point: `npx jest --runTestsByPath
  src/lib/source/__tests__/sourcing-motion-journeys.test.ts --no-coverage --ci` → **0 failing, 10
  passing**.
- After the change → **0 failing, 11 passing**.

The new case asserts behaviour that is already correct, so it cannot fail first. The equivalent
discipline is to prove it can fail at all, which was done with three separate mutations, each
reverted immediately:

| mutation | result |
|---|---|
| `responses` removed from the canonical stage order | 3 failing, 8 passing — the new case among them |
| `responses` inserted into the renegotiation journey after its baseline stage | 6 failing, 5 passing — the new case among them |
| a fifth phase appended to the Source workspace rail | **1 failing**, 10 passing — the new case alone |

The third is the one that matters: no other case in the repository objects to a fifth phase being
appended to that rail, and this one does.

Also run: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → exit `0`, no
diagnostics (the exit code is judged, not the output — a bare run exits `134` on an out-of-memory
crash and emits nothing, which reads as clean). `npx eslint` on the changed file → exit `0`.

Not verified, and named as such: the sourcing journey persisted on each served event was **not**
read from the data plane in this change. The settlement rests on the stage the walk recorded an
event occupying, and on the fact that the market-package stage belongs to the competitive journey
and is declared skipped by the other. If that event is instead persisted with the renegotiation
motion, it is sitting off its own journey — a data defect in its own right, and still not a reason
to change the panel.

## Rollout Plan

Merge to main. No runtime rollout: no product code, no migration, no flag, no image change. The
deploy workflow will build the merge commit as it builds every merge, and nothing in this change
depends on that build.

## Deployment Authority

Not applicable. This change cannot affect Azure Container Apps, deploy workflows, runtime images,
flags, environment variables, worker jobs, traffic, DNS or environment promotion.

- Repo-owned deploy workflow: unchanged
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime update
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: no for this change; **yes** for the successor item that seeds a
  reachable event, and the two merges whose rendering half is still unverdicted depend on it

## Rollback Plan

Revert the commit. There is no state to unwind: the change adds one test case and one document.

## Audit Evidence

- The PR for this record, and its CI run.
- The three mutation results in **QA / Validation**, each reproducible from the table.
- The journey definitions and the skipped-stage declaration in
  `src/lib/source/sourcing-motion-journeys.ts`, and the four-phase rail in
  `src/lib/source/new-workspace/phase-state.ts`, which are what the case reads.

## Known Gaps

- **The reachable subject is still owed, and it is data-plane work.** No served event occupies the
  Responses stage, so the vendor-readiness panel reaches no user and the rendering half of the two
  merges that added rows to it is unverdicted. Filed as a separate data-plane item: advance or seed
  one governed event on the competitive journey into that stage through the governed path, then
  verdict the rows on it. Nothing in this change makes the panel appear, by intent.
- **The workspace phase rail is journey-blind**, which this work found while settling the above and
  did not fix. The rail shows four phases for every event, ending at the market package. On the
  renegotiation journey that stage is declared skipped, so an event on that journey is shown a
  final phase labelled `Later` that its own governed path will never visit — a pending-work claim
  the model does not support. Filed as a separate UI item with the derivation; not touched here,
  because fixing a rail is not settling a reachability question.
