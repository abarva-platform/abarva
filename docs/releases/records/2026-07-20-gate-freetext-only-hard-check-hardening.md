# 2026-07-20-gate-freetext-only-hard-check-hardening — Hard gate checks can no longer pass on free text alone

## Release ID

`2026-07-20-gate-freetext-only-hard-check-hardening`

## Status

`released`

## Plain-English Summary

**Live incident**: attempting to live-verify the P3 architecture generation +
approval cycle (backlog item 95), a real Move (MEMBER AI ASSIST) was
advanced from P3 to P4 in production despite ZERO P3 deliverables ever being
generated — the "Approve & Build" action only queues async generation jobs
and never itself advances the phase; a separate phase-advance action was
what actually moved it, and it should have been blocked by 2 unmet hard
gates. Root cause: the `requirements_design_outcome_trace` hard check
(P3→P4) had a free-text fallback — `/\b(requirement|trace|outcome|...)\b/
.test(phaseCaptureText)` — that matches almost any P3-phase module's
free-text capture containing common words like "outcome" or "validation",
with NO requirement that any real deliverable, evidence, or even a
completed module exist. Auditing the rest of `governance.ts` at the user's
request found this same free-text-only escape hatch on 7 more HARD
(blocking) checks across 3 more phase transitions — two of which
(`launch_readiness_attested`, `tower_cadence_defined`, P5→P6) had **no real
signal alternative at all**, purely regex-matched text. This release closes
every one of those 8 gaps: each free-text fallback now additionally
requires at least one `phase_N_*` module to be genuinely `completed` (a
real, explicit user action), not merely present with in-progress draft
text.

## Layer Impact

- **global-control-lane**: `src/lib/programs/governance.ts`'s phase-gate
  engine, used by every Moves program. Affects 8 specific hard checks across
  4 phase transitions (P2→P3, P3→P4, P4→P5, P5→P6); every other check
  (already backed by a real deliverable/evidence/sign-off) and every soft
  criterion is completely unchanged.

## Client Applicability

- All clients: yes — every Move's gate evaluation for the 8 affected checks.
  A Move currently relying on free-text-only satisfaction of one of these
  checks (with no completed module) will find that check newly blocked on
  the next evaluation. See Known Gaps for the real Move this incident
  already affected.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/lib/programs/governance.ts`:
  - Added `phaseModulesCompleted(phase)` — true when at least one
    `program_modules` row for `phase_${phase}_*` has `status === 'completed'`
    (not just present/in-progress).
  - Added `&& phaseModulesCompleted(fromPhase)` to the free-text fallback
    branch of 8 hard checks: `discovery_baseline_attested`,
    `discovery_stakeholders_named`, `p2_readiness_cleared`,
    `discovery_notes_ingested` (P2→P3); `requirements_design_outcome_trace`
    (P3→P4, the incident check); `execution_milestones_defined`,
    `execution_success_criteria_defined` (P4→P5);
    `launch_readiness_attested`, `tower_cadence_defined` (P5→P6). Every
    check's OTHER real-signal branches (a real deliverable, `isSignedOff`,
    `hasProgramEvidence`, a real discovery-report field, `milestoneRows
    .length > 0`, etc.) are untouched — this only tightens the free-text
    escape hatch specifically.
  - Deliberately did NOT touch soft (carry-forward) criteria — being lenient
    there is explicit, documented product design (soft items carry as
    caveats, they don't block).
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts` — 3 new
  tests: (1) reproduces the exact live incident — `requirements_design_
  outcome_trace` no longer passes on matching free text with 0 deliverables
  and an `in_progress` (not completed) module; (2) confirms it DOES pass
  once the same module is marked `completed` (the real signal now
  required); (3) confirms the P5→P6 pair (`launch_readiness_attested`,
  `tower_cadence_defined` — the two checks that previously had NO real
  signal at all) now also require a completed module.

## QA / Validation

- `npx jest src/lib/programs/__tests__/governance-evaluate-gates.test.ts
  src/lib/programs/__tests__/governance-gates.test.ts` — 25/25 pass (22
  existing + 3 new). All 22 pre-existing tests pass UNCHANGED — confirming
  every existing passing scenario already had a real completed-module
  signal backing it, not just free text.
- `npx jest src/lib/programs/__tests__` (full dir) — 525/527 pass; the 2
  failures are the same pre-existing, unrelated issues confirmed multiple
  times earlier this session (SSN-quarantine PII test, tenant-display-name
  drift).
- Also ran every other gate/advance consumer test found in the repo:
  `advance/__tests__/route.test.ts`, `phase-gate-advancement-flow.test.ts`
  (integration), `advancePhase.test.ts` (agent tool), `PhaseAdvanceButton
  .test.tsx`, `gate-advance-contract.test.ts` — 62/62 pass, no regressions.
- `npx eslint src/lib/programs/governance.ts
  src/lib/programs/__tests__/governance-evaluate-gates.test.ts` — 0 errors.
- `git diff --check` — clean.

## Rollout Plan

Merge to `main` via the protected PR lane (squash merge). Pure code change
— no migration, no flag. Deploy proceeds through the repo-owned
`aca-main-deploy` workflow; takes effect on the next gate evaluation for any
Move after the new revision receives traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, run
  [29762336738](https://github.com/abarva-platform/abarva/actions/runs/29762336738)
  (headSha `bfede3fb65562e2d4ae4e7e21356c98d02c72b53`, the #5154 merge
  commit), conclusion `success`.
- Shared runtime mutators: none used directly; deploy proceeded entirely
  through the standard workflow.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:1be850e11a371253714fc300ddbacb23c7b052798e2d54e3356e4fa09f5a1fb1`.
- ACA runtime invariant: **proven.** `az containerapp revision list`/`job
  list` confirm the 100%-traffic revision
  (`ca-abarva-web-lab-eastus--mbfede3fb`) and both
  `job-abarva-deliv-worker`/`job-abarva-deliv-worker-event` all resolve to
  the digest above.
- Worker image invariant: **proven** (see above).
- Feature/env flag update path: N/A — no flag.
- Live signed-in proof: **partially performed.** Navigated to `app.abarva
  .ai/strategic-moves` post-deploy and confirmed the app loads and functions
  normally — no regression; confirmed MEMBER AI ASSIST (the Move affected by
  the incident this release fixes) is unchanged, still at P4, as expected
  since this release does not revert it. The specific claim not yet
  exercised live: confirming a Move relying on free-text-only satisfaction
  of one of the 8 checks now shows it blocked, and that marking the module
  `completed` unblocks it. Not attempted in this pass — the live click-
  through that surfaced this exact bug already caused one unintended
  production state change this session, and repeating that risk against
  another real Move was deliberately avoided. Unit-test coverage (25/25
  passing, including a direct reproduction of the live incident) is the
  primary correctness evidence for this release.

## Rollback Plan

Revert the merge commit. No schema or data touched — reverting restores the
prior free-text-only behavior for these 8 checks, reopening the exact class
of gap this release closes (including the one that already caused a real
incident).

## Audit Evidence

- PR: [abarva-platform/abarva#5154](https://github.com/abarva-platform/abarva/pull/5154),
  all required checks passed (one Lighthouse CI Total Blocking Time flake —
  1029ms vs 1000ms budget on the homepage, unrelated to this backend-only
  change — cleared on re-run), squash-merged as
  `bfede3fb65562e2d4ae4e7e21356c98d02c72b53`.
- CI/deploy run: [aca-main-deploy #29762336738](https://github.com/abarva-platform/abarva/actions/runs/29762336738),
  conclusion `success`.
- Deployment: ACA revision `ca-abarva-web-lab-eastus--mbfede3fb`, 100%
  ingress traffic, image digest
  `sha256:1be850e11a371253714fc300ddbacb23c7b052798e2d54e3356e4fa09f5a1fb1`.
- Live proof: app-loads/no-regression confirmed on `app.abarva.ai/
  strategic-moves` post-deploy. The specific block-then-unblock behavior for
  one of the 8 hardened checks was not exercised against a live Move in this
  pass, deliberately, given the production risk this exact investigation
  already demonstrated.

## Known Gaps

- **The real Move affected by this incident (MEMBER AI ASSIST,
  `cd51e4fe-b5c4-4024-bc46-73afaff4e4b7`) is NOT reverted by this release.**
  It remains at P4 with a "Phase Gate Decision — P3 → P4 (override)" record
  (status `needs review`) that was created before this fix existed. This
  release prevents the SAME class of gap going forward; it does not attempt
  to move the Move back to P3 or delete/amend the existing gate-decision
  record, since reverting a real Move's phase is a data-mutating action
  outside a code-fix PR's scope and was not requested.
- **`generate-phase`'s async queuing and the phase-advance routes remain
  fully decoupled** — clicking "Approve & Build" still does not itself
  block or gate on whether the queued generation actually completed or
  produced quality-passing documents; a user could still click a separate
  "advance" action before generation finishes. This release only closes the
  specific free-text-only loophole that let hard gates report false
  positives; it does not couple generation completion to gate evaluation.
  That would be a larger, separate product change.
- **Only the free-text-only escape hatch was tightened, not every
  loosely-matched OR-branch.** Some checks (e.g. `execution_milestones_
  defined`'s `briefString.includes('milestone')`) still accept a
  semi-structured but not fully deliverable-backed signal (the program's
  approval-request brief snapshot). These were left alone as a judgment
  call — they come from a real, user-submitted structured brief, not
  arbitrary free-text module state, and were not implicated in the
  incident.
- **No live-generated real-Move proof yet** that the fix blocks a live
  advance attempt in production for one of the 8 checks — deferred to the
  dedicated live E2E backlog items (95/96), consistent with this session's
  established pattern, and specifically because the live attempt that
  surfaced this bug should not be repeated against another real Move without
  a deliberate, controlled test fixture.
