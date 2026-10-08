# 2026-10-07-moves-phase-refusal-names-open-evidence — A held phase names the evidence holding it

## Release ID

`2026-10-07-moves-phase-refusal-names-open-evidence`

## Status

`candidate`

## Plain-English Summary

When a Move phase will not build its documents or will not close its gate because
required evidence is still open, the server already works out exactly which items
are open and sends their names and next actions to the browser. The two screens
that report the refusal were reading only the summary sentence beside that list,
which states a count ("1 required evidence item is not yet approved") or a
category ("Required evidence must be approved, linked to a sourced workbook
answer, or formally resolved"). Neither sentence names anything, so a phase held
by a single item read as an unspecified pile of missing evidence and the one
control that would clear it was named nowhere on screen.

Both screens now read the named list and print it after the server's own
sentence, for example: `Open: P3 to P4 readiness workbook (Complete the P3 to P4
readiness review and accept each answer.)`. Where several items are open, the
first four are named and the rest are counted.

No gate was loosened. The refusals are unchanged: the build is still not queued,
the gate is still not approved, the phase still does not advance. Only the
message a human reads changed.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not feature-gated.

- Layer 4 products: Moves phase workspace. Two refusal readers now render a list
  the responses already carried. No new request, no new query, no new permission.
- Layers 1-3: unchanged. No intake, adapter, schema, or canonical-model change.

## Client Applicability

- All clients: yes — the two refusal readers are not flag-gated, so every tenant
  that reaches either refusal sees the named list.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added. The change is inside existing error paths.

## Changes Included

- `src/lib/programs/evidence-readiness/required-evidence-refusal.ts` (new leaf
  module): `readRequiredEvidenceGaps` normalizes the untrusted gap list from a
  refusal body, dropping an entry with no readable slot label rather than
  rendering a blank row; `describeRequiredEvidenceRefusal` returns the server's
  own detail followed by the named slots, or `null` when the body names nothing,
  so each caller keeps its existing fallback ladder for every other refusal code.
  Slot, action, and detail text are length-bounded.
- `src/components/strategic-moves/PhaseApproveAndBuild.tsx`: the phase-build
  enqueue error reads the named list above `detail`.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: the gate-approval
  blocked-message ladder reads the named list above `detail`, below the existing
  hard-check and capture-gap readings.
- `.github/workflows/ai-surface-control-catalog.yml`: the new component suite is
  added to the enumerated run list for its directory, which is covered per file
  rather than swept.
- `docs/architecture/test-ci-coverage-census.json`: regenerated.
- New suites: `required-evidence-refusal.test.ts` (unit) and
  `phase-build-required-evidence-refusal.test.tsx` (build call site); one case
  added to `MovesPhaseStandaloneClient.test.tsx` (gate call site).

## QA / Validation

- PASS `npx jest src/components/strategic-moves src/lib/programs/evidence-readiness
  src/app/api/v1/deliverables/generate-phase src/app/api/v1/programs` — 83 suites,
  979 tests.
- PASS mutation check, 9 mutations / 9 killed. Covered: the empty-list early
  return, dropping unnamed rows, the four-slot cap, the remainder clause, the
  detail lead, the next-action bracket, the text bounds, and — separately — each
  of the two call-site wirings, so removing either wiring fails rather than
  staying green.
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- PASS `npx eslint` over all six changed files — 0 errors (2 pre-existing
  unused-import warnings in the phase client, untouched by this change).
- PASS `npx prettier --check` after formatting.
- PASS census regeneration: test files 2782 to 2784, covered 2618 to 2620,
  uncovered flat at 164 — both new suites are CI-covered, neither is dark.
- PASS `npm run release:check -- --base origin/main --head HEAD`.
- NOT RUN: live signed-in proof. The refusal this most affects is the transition
  evidence refusal on the demo Move, and reaching it live depends on the pending
  evidence load and human approval, which are outside this lane.

## Rollout Plan

Merge to `main` by squash merge. The repository-owned ACA main deploy workflow
builds the digest-pinned image and shifts traffic. No migration, no flag, no
worker change, no data-plane job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded by the main deploy after merge.
- ACA runtime invariant: unchanged by this release; the standing invariant check
  applies to the deploy that carries it.
- Worker image invariant: unchanged; no worker code changed.
- Feature/env flag update path: not applicable, no flag added or changed.
- Live signed-in proof required: yes, for the message itself, once a phase on a
  signed-in walk is held by required evidence.

## Rollback Plan

Revert the squash commit. The new module has exactly two callers and both are
single expressions inside existing error ladders, so reverting restores the
previous `detail`-only message with no schema, flag, or stored-state change to
undo. Nothing in this release writes data.

## Audit Evidence

- The PR and its CI run.
- The mutation results above, in particular the two call-site mutations.
- The census delta showing both new suites covered and uncovered unchanged.
- The two route bodies that already carried the list:
  `src/app/api/v1/deliverables/generate-phase/route.ts` (409
  `required_evidence_open`) and
  `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts` (409
  `transition_evidence_incomplete`).

## Known Gaps

- The message is text only. A named slot is not a link to the control that
  clears it, so a reader still has to find the workbook or the evidence cabinet
  themselves.
- Four slots are named and the remainder is counted. A phase held by many
  families still ends in a count, by choice: naming eleven items inside one
  sentence reads worse than naming four and saying how many remain.
- The other refusal codes on both routes carry no gap list and are unchanged;
  they still report their own `detail`.
- The legacy program detail surface has its own refusal reader and was not
  changed; its route subtree is redirected away from the Moves phase path.
