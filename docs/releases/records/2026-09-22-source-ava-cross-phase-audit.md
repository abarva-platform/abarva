# 2026-09-22-source-ava-cross-phase-audit — Reconcile cross-phase Source audit readiness

## Release ID

`2026-09-22-source-ava-cross-phase-audit`

## Status

`candidate`

## Plain-English Summary

Source aVa now treats an explicit audit-completion question as a cross-phase question instead of
answering only from the event's current phase. The governed answer reconciles three existing read
models: Source New phase history, evidence processing readiness, and Stage 08 contract-formation
handoff readiness.

The answer refuses to call the event complete when an earlier phase has no governed history,
evidence is not ready, or the Contract 360 and Optimize handoff remains blocked. It returns one
next action from the earliest blocked lifecycle point rather than allowing a later artifact-review
task to outrank a missing earlier phase.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4 (Products — Source).** The signed-in Source event ask route recognizes a narrow
  cross-phase audit intent and composes existing governed read models into one answer packet.
- Layers 1-3 are unchanged. There is no intake mutation, source-adapter change, canonical-model
  write, schema change, migration, parser/index job, or tenant-data load.

## Client Applicability

- All clients: yes, when the shared Source event ask route receives the explicit cross-phase audit
  question shape.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added.

## Changes Included

- Add a narrow cross-phase audit question classifier and governed answer composer.
- Reuse the existing Source New phase-history state, Stage 05 candidate/NDA authority reader,
  evidence-readiness packet, and Stage 08 handoff readiness model.
- Route the explicit audit-complete / Contract 360 / Optimize question before the phase-local
  evidence branch.
- Add focused pure behavior and real-route NDJSON coverage.

## QA / Validation

Red first:

- The pure behavior suite failed because the cross-phase composer did not exist.
- The route suite failed because the question still entered the phase-local evidence branch and
  passed a current-stage context instead of building the cross-phase packet.

Green after implementation with Node `v24.15.0`:

- `npx jest src/lib/source/ava/__tests__/cross-phase-audit-governed-answer.test.ts --runInBand`
  passed 3 tests.
- `npx jest --runTestsByPath 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/value-ledger-negative-savings-routing.test.ts' --runInBand`
  passed 3 tests.
- The full `src/lib/source/ava/__tests__` run passed 25 suites and 331 tests.
- All three Source event ask route suites passed 3 suites and 18 tests.

Mutation proof:

- Reordering the action selection so evidence readiness outranked a historical phase gap failed the
  exact next-action assertion. Restoring lifecycle order returned the suite to green.

Node 24 typecheck, scoped ESLint, test-coverage census, release check, and diff check passed after
rebasing onto current `origin/main`. Hosted checks are required before any later merge.

## Rollout Plan

Open a pull request after all local gates pass. If separately approved for merge later, the
repo-owned ACA main deploy workflow will build and deploy the exact merged revision. This release
does not authorize or perform a migration, data job, manual Azure mutation, or shared-traffic
change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, only after a future merge.
- Shared runtime mutators: none in this candidate.
- Approved image digest: not applicable before merge/deploy.
- ACA runtime invariant: required after a future deployment; not claimed here.
- Worker image invariant: required after a future deployment; not claimed here.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, after a future deployment, using the exact cross-phase audit
  question on the governed event. This candidate does not claim signed-in acceptance.

## Rollback Plan

Revert the future squash commit through a pull request. No database, tenant-data, artifact,
approval, supplier, award, signature, or external-message rollback is required.

## Audit Evidence

- The pull request diff and hosted checks after it is opened.
- Focused red/green suite output and the lifecycle-order mutation failure.
- A future repo-owned deploy run, immutable runtime proof, and signed-in replay kept as separate
  evidence states.

## Known Gaps

- No merge, deployment, runtime proof, or signed-in acceptance is included in this candidate.
- The classifier is deliberately narrow. Broader audit questions continue through existing
  governed intent paths until an observed signed-in failure justifies widening it.
- The answer remains read-only. It does not approve evidence, select or contact a supplier, make an
  award, fabricate a signature, create a contract, publish Contract 360, or launch Optimize.
