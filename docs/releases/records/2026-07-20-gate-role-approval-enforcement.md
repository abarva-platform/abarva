# 2026-07-20-gate-role-approval-enforcement — Phase gates now require multi-role approval, not just sign-off

## Release ID

`2026-07-20-gate-role-approval-enforcement`

## Status

`released`

## Plain-English Summary

The multi-role approval system (`deliverable_role_approvals`, PR #5102) and
its UI (PR #5132) let a named Business/Technology/Finance/Risk-Security
approver record a decision, but nothing consumed `allRequiredApproved` yet —
a Move's P3→P4 or P4→P5 phase gate would advance on the existing
single-actor "signed off" flag alone, even for a deliverable type that the
system says requires multiple named roles. This release wires
`allRequiredApproved` into `governance.ts`'s `evaluateGate` as an ADDITIONAL
condition for the 2 gate checks whose deliverable types are covered
(`design_approved` for P3→P4, `business_case_approved` for P4→P5): a
deliverable must be both single-actor signed off AND — if its type requires
role approvals — have every required role approved before the check passes.
Deliverable types outside the 3-type registry are completely unaffected.

While wiring this, a real bug was found: the `design_approved` check's
`findDeliverable(...)` alias list (`design_spec`, `design`, `design_brief`,
`solution_design`, `operating_model_design`) never included
`target_state_architecture` — the literal registry key for that deliverable
type. A Target State Architecture deliverable therefore could never satisfy
`design_approved` at all, under any circumstance, before this fix (not
merely a role-approval gap — a pre-existing gate-matching gap). Fixed by
adding the alias.

## Layer Impact

- **global-control-lane**: `src/lib/programs/governance.ts`'s phase-gate
  engine, used by every Moves program regardless of tenant.

## Client Applicability

- All clients: yes — every Move's P3→P4 and P4→P5 gate evaluation is
  affected for the 3 covered deliverable types; every other check and every
  other deliverable type is unchanged.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — takes effect immediately on the next gate evaluation
  after deploy. A Move currently sitting signed-off-but-not-role-approved on
  a covered type will newly show that gate as blocked; see Known Gaps.

## Changes Included

- `src/lib/programs/governance.ts`:
  - Added `target_state_architecture` to `designRow`'s `findDeliverable(...)`
    alias list — a real pre-existing bug fix independent of role-approval
    enforcement (see summary).
  - Added `meetsApprovalBar(row)` — checks `isSignedOff(row)` first (existing
    behavior, unchanged), then, only if `requiredApprovalRolesFor(row
    .deliverable_type_key)` is non-empty, additionally calls
    `getRoleApprovalSummary(ctx, programId, row.id, row.deliverable_type_key,
    { supabase: sb })` and requires `allRequiredApproved`. Reuses the exact
    `sb`/`ctx`/`programId` already in scope in `evaluateGate` — no new
    Supabase client, no signature change up the call chain (already async).
  - `case 'design_approved'` and `case 'business_case_approved'` now call
    `await meetsApprovalBar(...)` instead of `isSignedOff(...)` directly.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts` — added a
  `deliverable_role_approvals` table case to the shared `tableResult` mock
  dispatcher and a `roleApprovalsFixture`, plus 3 new tests: (1) a
  signed-off `business_case` with only 1 of 2 required roles approved still
  fails `business_case_approved`; (2) the same deliverable with both roles
  approved passes; (3) a `design_brief`-typed deliverable (an alias NOT
  itself a `REQUIRED_APPROVAL_ROLES` key) passes on sign-off alone, with an
  empty role-approvals fixture, proving unaffected types need no
  `deliverable_role_approvals` row at all.

## QA / Validation

- `npx jest src/lib/programs/__tests__/governance-evaluate-gates.test.ts
  src/lib/programs/__tests__/governance-gates.test.ts` — 22/22 pass (19
  existing + 3 new). Confirmed the 19 pre-existing tests do NOT actually
  exercise the new async path (they use deliverable types outside the
  registry, or empty-deliverables scenarios that short-circuit before
  reaching the role-approval call) — the 3 new tests are the first real
  coverage of this code path.
- `npx jest src/lib/programs/__tests__` (full directory) — 521/523 pass; the
  2 failures are the same pre-existing, unrelated issues confirmed multiple
  times earlier this session (an SSN-quarantine PII contract test and the
  `SkyHarbor Air`/`Airline Demo` tenant-display-name drift).
- `npx eslint src/lib/programs/governance.ts
  src/lib/programs/__tests__/governance-evaluate-gates.test.ts` — 0 errors.
- Local `npx tsc --noEmit -p .` historically crashes in this sandbox; CI's
  "Typecheck + reasoning-layer tests" is authoritative.
- `git diff --check` — clean.

## Rollout Plan

Merge to `main` via the protected PR lane (squash merge). Pure code change —
no migration, no flag. Deploy proceeds through the repo-owned
`aca-main-deploy` workflow; takes effect on the next gate evaluation for any
Move after the new revision receives traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, run
  [29746393855](https://github.com/abarva-platform/abarva/actions/runs/29746393855)
  (headSha `2e1aad62f64bd26151f3ecbc838bcf19b3915770`, the #5141 merge
  commit), conclusion `success`.
- Shared runtime mutators: none used directly; deploy proceeded entirely
  through the standard workflow.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:2935eb7a9983d7cea02cde6fdd78fd11184d82375fe3786d8a7d013ea2340824`.
- ACA runtime invariant: **proven.** `az containerapp show`/`revision
  list`/`job list` confirm the template image, the 100%-traffic revision
  (`ca-abarva-web-lab-eastus--m2e1aad62`), and both
  `job-abarva-deliv-worker`/`job-abarva-deliv-worker-event` all resolve to
  the digest above.
- Worker image invariant: **proven** (see above) — no worker evaluates
  phase gates, but the digest match confirms a single, consistent deploy.
- Feature/env flag update path: N/A — no flag.
- Live signed-in proof: **partially performed.** Navigated to `app.abarva
  .ai/strategic-moves` post-deploy and confirmed the app loads and functions
  normally — no regression. The specific claim not yet exercised live:
  attempting to advance a real Move past P3→P4 or P4→P5 with a covered-type
  deliverable that is signed off but role-incomplete, and confirming the
  gate newly blocks. No Move in this tenant was in that exact state at the
  time of this check — deferred to backlog items 95/96, same reasoning as
  the prior 3 release records this session.

## Rollback Plan

Revert the merge commit. No schema or data touched — reverting restores the
exact prior behavior (single-actor sign-off alone sufficient for these 2
checks), including reverting the `target_state_architecture` alias fix,
which would reintroduce that pre-existing gap. If only the alias fix should
be kept, revert just the `meetsApprovalBar` wiring and its 2 call sites.

## Audit Evidence

- PR: [abarva-platform/abarva#5141](https://github.com/abarva-platform/abarva/pull/5141),
  all required checks passed, squash-merged as
  `2e1aad62f64bd26151f3ecbc838bcf19b3915770`.
- CI/deploy run: [aca-main-deploy #29746393855](https://github.com/abarva-platform/abarva/actions/runs/29746393855),
  conclusion `success`.
- Deployment: ACA revision `ca-abarva-web-lab-eastus--m2e1aad62` in
  `rg-abarva-controlplane-lab-eastus`, 100% ingress traffic, image digest
  `sha256:2935eb7a9983d7cea02cde6fdd78fd11184d82375fe3786d8a7d013ea2340824`.
- Live proof: app-loads/no-regression confirmed on `app.abarva.ai/
  strategic-moves` post-deploy. The gate-blocking behavior itself was not
  exercised against a real signed-off-but-role-incomplete Move in this
  pass — deferred to backlog items 95/96.

## Known Gaps

- **No migration/backfill for Moves that are already signed off but
  role-incomplete on a covered type.** Any such Move will find its gate
  newly blocked on the next evaluation after this deploys — this is the
  intended tightening, not a bug, but it is a real behavior change for any
  Move currently in that state. No such Move was identified as currently
  live in the tenants checked this session, but this was not exhaustively
  verified across every tenant/Move.
- **The gate's `failedChecks[].reason` text is unchanged** (static per-rule
  `describe` string, e.g. "Business case and value plan approved") — it does
  not distinguish "not signed off" from "signed off but role-incomplete" in
  the message a user sees. Extending `GateCheck.failedChecks` with an
  optional dynamic detail field to surface which specific role is still
  pending is a real, scoped UI/API follow-up, not attempted here (per the
  research: this would touch `types.db.ts` and every consumer that
  pattern-matches `failedChecks`, a broader change than this item's scope).
- **No live-generated real-Move proof yet** that a signed-off-but-role-
  incomplete deliverable actually blocks a real advance attempt in
  production — deferred to the dedicated live E2E backlog items (95/96),
  consistent with this session's established pattern for claims requiring a
  real deliverable of a covered type to exist.
