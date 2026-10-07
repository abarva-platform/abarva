# 2026-10-07-moves-phase-gate-submit-without-rebuild — a phase gate can be submitted without rebuilding the document it just approved

## Release ID

`2026-10-07-moves-phase-gate-submit-without-rebuild`

## Status

`candidate`

## Plain-English Summary

A Move phase could not be left once its gate asked for an approved document.

The phase workspace has one forward control, "Approve & Build". It generates
every document the phase declares, and when the batch finishes it submits the
phase gate approval. Two of the gate's hard checks read a human sign-off of a
document that the batch itself writes — and writes as an unapproved draft. So
the first submission always failed those checks, which is by design: the
reviewer is supposed to read the draft and approve it.

The problem was what came next. Submitting the gate again meant running Approve
& Build again, because that was the only trigger the submission had. Running it
again regenerates the same documents, and a generated version is written as a
draft — which resets the row the gate reads from "signed off" back to "draft"
and clears the approval the reviewer had just recorded. The refusal message said
so in as many words: approve the draft, "then re-run Approve & Build". Following
that instruction destroyed the thing it had just asked for, so the loop had no
exit and the phase could not be left at all.

This change gives the workspace a second forward action: submit the phase gate
approval from the documents already on the record, without rebuilding them. It
appears beside Approve & Build once every document the gate reads is built, it
carries its own pre-commit confirmation stating that nothing is regenerated, and
the blocked message now names it instead of sending the reader back to a rebuild.

Nothing about the gate itself moved. The same approval endpoint runs, the server
remains the only authority on whether the gate passes, and a refusal is reported
back unchanged. No criterion changed severity, no phase became easier to exit,
and a document held below its quality bar still refuses the submission by name.

Two secondary honesty fixes came out of the same wiring, because the submission
is now reported separately from a build:

- A submission that read documents off the record no longer says it just built
  them.
- A document whose stored artifact was held below its quality bar is excluded
  from the submitted set rather than counted as built — the status list renders
  a held artifact as "Built", so without this a quarantined gate document would
  have been submitted as a succeeded one.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, with
no feature gate.

- Layer 4 (Products — Moves): the phase workspace gains a second forward action
  and two corrected status sentences. The gate decision itself is unchanged.
- Layer 3 (Canonical model): untouched. No schema, migration, read model, or
  deliverable record changed.

## Client Applicability

- All clients: yes, for any Move at a phase whose build set contains a document
  a gate check reads. The control is derived from the deliverable registry, so no
  client is singled out.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The action sits inside the existing authorized-approver
  branch of the phase workspace and inherits its `canApproveGates` check and its
  capture blocker, so an unauthorized session sees no new control.

## Changes Included

- `src/lib/programs/phase-build-settlement.ts` — new exported decision
  `planPhaseGateSubmitWithoutBuild`, beside the existing post-build
  `classifyPhaseBuildSettlement`. Owns which documents count as on the record,
  the refusal reasons, the action label and the pre-commit summary.
- `src/components/strategic-moves/PhaseApproveAndBuild.tsx` — renders the second
  action beside the build action (both travel through the step-header portal
  together), adds its confirmation dialog, and reports the submission through the
  existing `onBuildSettled` contract with a new `source` discriminator.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the gate
  submission states what it submitted rather than claiming a build, and the
  blocked message names the no-rebuild submission instead of a rebuild.
- Tests: `src/lib/programs/__tests__/phase-build-settlement.test.ts`,
  `src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx`,
  `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`.

No new test file, so both committed census reports are unchanged.

## QA / Validation

- PASS `npx jest src/lib/programs/__tests__/phase-build-settlement.test.ts` — 32
  tests, 19 of them new, including a premise pin: the two criteria that read a
  post-build sign-off are still declared hard and still name documents their own
  phase builds. If either stops being true the pin fails and the control has to
  be re-justified.
- PASS `npx jest src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx`
  — 26 tests, 9 new, covering the wiring: the action appears only once the gate
  document is on the record, submits with no request to the generator, is absent
  for a held artifact, is disabled under a parent blocker, is withheld mid-batch
  while a sibling is still running, lets a fresh build overrule a stale held
  status, reaches the step-header portal beside the build action, and comes back
  enabled after a refusal.
- PASS `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 221 tests, 1 new: the real host submits the gate from documents already on
  the record, issues no generator request before or after the refusal, says the
  documents were already on the record rather than just built, and names the
  no-rebuild submission in the blocked message.
- PASS mutation testing: 12 mutations applied, 12 killed. One survived its first
  pass — removing the in-flight guard changed nothing observable, because a fresh
  batch resets every row to queued and the plan then refuses for want of a built
  gate document anyway. The guard is still load-bearing in one state the suite did
  not reach (the gate document succeeded while a sibling is still running, where
  submitting would race the settle effect into a second submission), so that state
  now has its own case and the mutation is killed. Coverage spans each refusal
  branch, the held-artifact status set, the submitted-set filter, the `source`
  discriminator, the portal grouping, the stale-status guard, the parent-blocker
  guard, the in-flight guard, and both host sentences — including the defect
  itself as a negative control (restoring "then re-run Approve & Build" fails two
  cases).
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- PASS `npx eslint` on all six changed files — 0 errors (2 pre-existing
  unused-import warnings in the host file, untouched by this change).
- PASS `npm run release:check -- --base origin/main --head HEAD`.
- NOT RUN: live signed-in walk. The new action needs a signed-in authorized
  approver on a Move whose phase documents are already built, which is a
  human-in-the-loop step outside this lane.

## Rollout Plan

Squash merge to `main`. The repo-owned ACA main deploy workflow builds and
deploys the image; no migration, no flag, no environment variable, no worker job
and no manual runbook step. Visible to an authorized approver on the phase
workspace once that revision carries 100% traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change. No Azure command is run from this
  branch and no shared traffic, revision weight or container template is touched.
- Approved image digest: assigned by the main deploy workflow for the squash
  commit; not pinned here.
- ACA runtime invariant: to be proven after deploy — template image, 100%-traffic
  revision image and worker job images must all match that digest.
- Worker image invariant: unchanged. No worker, job or queue contract changed.
- Feature/env flag update path: not applicable; no flag was added or enrolled.
- Live signed-in proof required: yes, before this may be called live-proven. The
  proof is one authorized-approver submission of a phase gate from already-built
  documents, with no generator request in the network log.

## Rollback Plan

Revert the squash commit and redeploy the prior digest-pinned image. The change
is additive and stateless: it adds a client action and two message strings, and
writes nothing new to any table, so a revert restores the previous behaviour
exactly — including the loop this fixes. No migration, no data backfill, no flag
to unset.

## Audit Evidence

- PR URL and its CI run (unit suites, typecheck, lint, release gate, census
  gates).
- The three test suites named above, which an auditor can run directly.
- The mutation table in the PR body: 12 of 12 killed, with the defect applied as
  a negative control.

## Known Gaps

- A product question this change deliberately does not answer: a phase's only
  rebuild is all-or-nothing, so a reviewer who wants one document regenerated
  after approving the others still loses every sign-off in that phase. The
  no-rebuild submission removes the dead end; it does not add per-document
  regeneration, which is a larger design decision about version lineage.
- The status list still renders a document whose stored artifact was held below
  its quality bar as "Built". This change stops that reading from reaching the
  gate submission, but the row label itself is unchanged and is worth a separate
  look.
- The sign-off itself is recorded on a different surface (Files & Evidence). The
  blocked message names that surface and the action to use afterwards, but the
  two steps are still on two screens.
- Not live-proven. Merged and deployed is not the same as proven; the signed-in
  approver walk above is still owed.
