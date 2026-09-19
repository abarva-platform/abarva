# 2026-09-19-source-approval-queue-self-approval-notice — Approval queue states who the record names as approver

## Release ID

`2026-09-19-source-approval-queue-self-approval-notice`

## Status

`candidate`

## Plain-English Summary

The Source admin event approval queue shows a reviewer a short statement before
they approve, send back or reject an event. That statement was one fixed
sentence shown to everyone, and it was labelled a self-approval notice.

A self-approval is a specific thing: the person approving is the person who
raised the event. The approve API derives that from the stored creator and
writes it onto the append-only approval record. The screen had the reviewer's
identity available to it and never looked at it, so it told a reviewer who had
nothing to do with creating the event that this was a self-approval, and told a
reviewer who *had* created it nothing about what the record would say.

Two statements now do two jobs. Every approver is told, in every case, that the
decision is recorded against them as the accountable human decision. The
self-approval sentence appears only when the screen can see that the approver is
the recorded creator, and says what the record will be marked with. When the
screen has no viewer identity it states the condition — "if you created this
event, the approval record is marked as a self-approval" — instead of implying
either answer, because the server marks the record either way.

## Layer Impact

`global-control-lane`. Layer 4 (Products · Source) only: one component's rendered
disclosure and the control catalog entry that declares it. No canonical model,
adapter, intake or data-plane behaviour changes, and no request the component
sends changes.

## Client Applicability

- All clients: no — the component this changes is mounted by no route today (see
  Known Gaps), so no signed-in user's screen changes.
- Specific clients: none.
- Internal only: yes, in effect — the corrected disclosure is exercised by the
  catalog's behavioral test in CI.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/AdminSourceEventApprovalQueue.tsx` — reads the
  `currentUserId` prop it already declared; derives self / peer / unknown from
  the event's stored creator; splits the accountable-decision caveat from the
  self-approval statement.
- `src/components/source/__tests__/AdminSourceEventApprovalQueue.controls.test.tsx`
  — three new cases over the three states; the existing risk-caveat case updated
  in place, with the reason beside it, to assert the caveat it was named for.
- `docs/security/ai-surface-control-catalog.json` — the `risk-caveat` control on
  this surface now declares `Accountable decision` alongside the existing
  evidence, so the unconditional caveat is part of the declared control.

## QA / Validation

Re-verified on clean `origin/main` `7a0542afd` before any edit. The backlog item
has two halves and only one was open: the rationale minimum it describes is
already enforced (`SOURCE_APPROVAL_REASON_MIN_LENGTH` gates approve, send back
and reject). The self-approval half was open and is worse than the item states —
the notice was not missing, it was unconditional, which is the weaker failure
because a caveat every reader sees carries no information about any of them.

Measured by rendering the real component, not read from the source.

- **Failing first, identical suite either side:** `4 failed / 10 passed` before →
  `0 failed / 14 passed` after
  (`src/components/source/__tests__/AdminSourceEventApprovalQueue.controls.test.tsx`).
- **Six mutations, six caught**, each file byte-restored afterwards and the
  restore verified with `diff -q`:
  1. relationship hard-wired to `self` (the unconditional notice restored) — 2 failed
  2. the peer branch deleted — 1 failed
  3. unknown viewer treated as peer (screen silently asserts no self-approval) — 1 failed
  4. the prop made unreadable again, i.e. the original defect — 2 failed
  5. the accountable-decision caveat renamed — 1 failed
  6. same rename measured against `audit:ai-surface-controls` — audit fails with
     `missing evidence token "Accountable decision"`, proving the new catalog
     entry is load-bearing rather than decorative.
- **Scope baseline, same command either side** (`npx jest src/components/source`,
  the second run with the changed files checked out from `origin/main`):
  **3 suites / 3 tests failing before → 3 / 3 after**, identical failing-suite
  list (`SourceArtifactDrawer`, `SourceOptimizeContractPage`,
  `source-canvas-reachability`), all pre-existing and unrelated; passing 393 → 396.
- `npm run audit:ai-surface-controls` exit 0 — 18 surfaces, 37 declared controls,
  26 of 37 behaviourally covered, unchanged by this release.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit 0,
  with `tsconfig.tsbuildinfo` removed first and the exit code judged rather than
  the output grepped.
- `npx eslint` on both changed source files: exit 0, no output.
- The suite is already wired: `.github/workflows/ai-surface-control-catalog.yml`
  runs this exact file by path on every pull request, so no workflow step was
  added.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds
and deploys from the merge commit. No migration, no flag, no operator job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge to `main`.
- Shared runtime mutators: none. No Azure command is run by hand for this change.
- Approved image digest: recorded after the deploy run completes.
- ACA runtime invariant: to be proven after merge — Container App template image
  equals the 100%-traffic revision image, digest-pinned.
- Worker image invariant: to be proven after merge — both non-manual worker jobs
  carry the same digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no**, and this is a statement about the
  component rather than a convenience. No route imports it, so there is no
  signed-in session that can open the screen. That is the open decision recorded
  under Known Gaps, not something this release resolves.

## Rollback Plan

Revert the merge commit. The change is one component's rendered text plus a
catalog evidence entry; nothing is written, migrated or cached, so a revert is
complete on the next deploy.

## Audit Evidence

- The pull request and its checks, including the `AI surface control catalog`
  job log showing this suite executing.
- The before/after and mutation numbers above, reproducible with
  `npx jest --runTestsByPath src/components/source/__tests__/AdminSourceEventApprovalQueue.controls.test.tsx`.
- `docs/security/ai-surface-control-catalog.json` — the declared control and its
  evidence.
- The approve route's own derivation of the same fact,
  `src/app/api/v1/source/events/[eventId]/approve/route.ts`, which is the
  authority the screen now describes rather than duplicates.

## Known Gaps

- **The component is mounted by no route.** It is in
  `docs/architecture/unreachable-components.json` and its catalog entry already
  records `routeReachable: false`. This release corrects a declared control that
  CI asserts on; it does not mount anything, and the mount-or-retire decision is
  an open backlog item owned elsewhere. If that decision is "retire", this change
  is deleted with the component and costs nothing.
- **The screen is not the authority on self-approval and does not try to be.**
  The server derives it from the stored creator on every request, so a viewer
  identity the screen lacks cannot be used to avoid the marker or the strict-mode
  refusal.
- **Strict mode is not mentioned on the screen.** When `GATE_APPROVAL_STRICT_MODE`
  is enabled the route refuses a self-approval with a 403; the component cannot
  read that flag, so it states what the record will say and leaves the refusal to
  arrive from the server. Telling the approver in advance would need the flag
  passed to the client, which is a separate change.
