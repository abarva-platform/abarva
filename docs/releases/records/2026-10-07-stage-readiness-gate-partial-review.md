# 2026-10-07-stage-readiness-gate-partial-review — A phase gate reads the transition review as it stands

## Release ID

`2026-10-07-stage-readiness-gate-partial-review`

## Status

`candidate`

## Plain-English Summary

A phase could not be closed because an **optional** question in the transition
readiness workbook had been left blank, and nothing on screen could clear it.

The workbook asks required and recommended questions. Leaving a recommended
question's cell empty is the expected thing to do — it is optional. But a blank
response cannot be reviewed from the review surface at all: it can be neither
accepted nor rejected, because an unanswered response must never pass as an
answered one. Its decision therefore stayed open forever.

The gate was reading the review through a loader that answers a different
question — "may these responses feed the next phase's prompt?" — which reports
nothing at all unless **every** response has been decided. One permanently open
optional response therefore read to the gate as *no workbook had ever been
reviewed*. The phase gate returned a refusal, the phase build returned a
refusal, and both said "complete the readiness workbook with an evidence-backed
answer and source reference" about a workbook whose every required question was
already answered, accepted and sourced. There was no control anywhere that
could resolve it.

The same misreading also mis-stated the ordinary case: a workbook reviewed down
to one held required response was reported as a workbook nobody had reviewed,
naming no held response — so a reviewer was told to redo work that was done and
was never told which single answer was holding the phase.

The gate now reads the stored review as it stands and applies the required-only
rule it already owns and already published in its own refusal text. Nothing is
relaxed for a required response: one that is not accepted, not answered, or not
sourced still holds its evidence family, and a review in which no required
response has been decided at all is still reported once, as one missing
workbook, rather than once per evidence family. The next-phase prompt reading is
unchanged and still admits only a finished review.

## Layer Impact

Release lane: `global-control-lane` — shared application behaviour for all
clients, not feature-gated and not client-scoped.

- **Layer 4 (Products — Moves):** the phase-gate transition reading and the
  phase-build evidence reading. Both now consult the stored transition review in
  its current state instead of only a completed one.
- No change to Layer 1 intake, Layer 2 adapters, or Layer 3 canonical model. No
  schema, migration, or stored-artifact format change: the same review artifact
  is read, by a second reading with a different admission rule.

## Client Applicability

- All clients: yes — this is control-plane behaviour for the Moves phase gate
  and phase build, not client-scoped data.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The corrected reading applies wherever a transition
  readiness workbook review exists; where none exists the gate is unchanged.

## Changes Included

- `src/lib/programs/stage-readiness-workbooks/gate-proposal-context.ts` (new) —
  `loadStageReadinessGateProposals`, the partial-review reading. It validates the
  same artifact, move and transition as its finished-only sibling in
  `./accepted-context` and admits any set of dispositions. Its doc comment states
  why the two readings exist and must not be collapsed.
- `src/lib/programs/stage-readiness-workbooks/gate-readiness.ts` — two
  required-only readings. The P1 branch no longer requires every *recommended*
  response to be decided, which is what its own next-action text has always
  said. The wholly-unreviewed branch now asks whether any **required** response
  has been acted on, so a review with decisions in it is reported per family and
  a review with none is still reported once as a missing workbook.
- `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts` — the
  transition reading takes the partial-review loader.
- `src/app/api/v1/deliverables/generate-phase/route.ts` — the same for the phase
  build's evidence reading. Its prompt reading is untouched and stays
  finished-only.
- `src/lib/programs/__tests__/stage-readiness-workbook-offer.test.ts` — six new
  cases beside the existing gate-counting ones, in a directory the required
  check suite sweeps.
- `src/lib/programs/stage-readiness-workbooks/__tests__/accepted-context.test.ts`
  — the new loader's cases, placed beside the strict loader's so the one
  difference that matters is pinned against the same fake artifact store.
- The two route suites — each now mocks both readings, by default from one
  stored review in the same call order, and one case per route drives them apart
  to pin which module the gate actually reads.

## QA / Validation

- PASS `npx jest src/lib/programs src/app/api/v1/programs src/app/api/v1/deliverables/generate-phase src/components/strategic-moves`
  — 396 suites, 5392 tests.
- PASS `npx jest --runTestsByPath src/lib/programs/__tests__/stage-readiness-workbook-offer.test.ts`
  — 17 of 17 (6 new).
- PASS `npx jest --runTestsByPath src/lib/programs/stage-readiness-workbooks/__tests__/accepted-context.test.ts`
  — 9 of 9 (6 new).
- PASS `npx jest --runTestsByPath "src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts"`
  — 27 of 27 (1 new).
- PASS `npx jest --runTestsByPath src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts`
  — 24 of 24 (1 new).
- PASS mutation probe, **12 of 12 killed**: restore the all-responses clause in
  the P1 branch; drop the any-required-decided arm; read "decided" as "accepted"
  rather than "not pending"; drop the move/transition guard in the new loader;
  fall back to recommended rather than required on an unreadable requirement;
  fall back to accepted on an unreadable decision; fall back to answered on an
  unreadable answer state; return an empty proposal list as a review; let
  unreadable review bytes throw; drop the no-predecessor guard; and revert each
  of the two routes' gate readings to the finished-only loader. One mutation
  survived the first pass — reading "decided" as "accepted" — and was a real
  uncovered behaviour, not a false survivor: a review whose every decision was a
  rejection is a reviewed workbook. A case for it was added and it now fails.
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- PASS `npx eslint` over every changed path — exit 0.
- PASS `node scripts/audit/moves-gate-consistency.mjs`.
- NOT RUN — live signed-in walk. No runtime proof is claimed; see Deployment
  Authority.

## Rollout Plan

Merge to `main` by squash. It reaches the shared Product/Lab runtime only
through the repo-owned ACA main deploy workflow, on its own schedule. No
migration, no environment variable, no feature flag, and no data-plane build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
  by this release.
- Shared runtime mutators: none. This release runs no Azure command and mutates
  no Container App template, revision weight, or traffic split.
- Approved image digest: not applicable — no runtime update is performed here.
- ACA runtime invariant: not asserted. This record claims `merged` only, never
  `live-proven`.
- Worker image invariant: unaffected; no worker job image changes.
- Feature/env flag update path: not applicable; no flag or env var changes.
- Live signed-in proof required: yes, before this behaviour may be called
  live-proven. Not performed here, and out of scope for the code lane.

## Rollback Plan

Revert the squash commit. The change is read-path only: no migration to unwind,
no stored artifact written in a new shape, and no format change to the review
artifact both readings consume. Reverting restores the finished-only gate
reading, and with it the refusal this release removes.

## Audit Evidence

- The PR for this branch, its diff, and its CI run.
- The mutation probe above, which is the load-bearing evidence: each of the
  twelve reversions names the reading it removes.
- The two route cases that drive the finished-only and as-it-stands readings
  apart: they are what pins the gate to the correct module rather than to a
  hand-rebuilt call sequence.

## Known Gaps

- **The next-phase prompt reading is still finished-only.** One undecidable
  blank optional response still means a phase's generation prompt receives none
  of the accepted workbook responses from the preceding transition, silently.
  That is a content-quality loss, not a refusal, and it is deliberately left out
  of this release: the prompt reading's own contract says only accepted
  responses are eligible, and widening when it answers is a separate judgement
  about generation input.
- **A blank response still cannot be decided from the review surface.** This
  release stops a blank *recommended* response from holding the phase; it does
  not give the reviewer a way to record a decision on one. A blank *required*
  response still holds the phase, which is correct.
- The gate's own blocker text for a partly reviewed workbook now names the
  holding evidence family and the reason, but not the individual question. The
  review surface names the response.
