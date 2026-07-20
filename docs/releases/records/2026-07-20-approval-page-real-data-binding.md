# 2026-07-20-approval-page-real-data-binding — Approval Page workshop template now shows real tracked status

## Release ID

`2026-07-20-approval-page-real-data-binding`

## Status

`candidate`

## Plain-English Summary

The session-guidebook enrichment release (PR #5099) added an "Approval
Page" workshop template — a printable, blank fill-in-the-blank page for a
facilitated session. It was a separate, disconnected construct from the
real, tracked multi-role approval system shipped shortly after
(`deliverable_role_approvals`, PR #5102/#5132) — the two never spoke to each
other, explicitly flagged as a Known Gap in both prior release records.
This release closes that gap: when a Design Session Pack is generated for a
phase whose sessions feed a deliverable type that (a) requires role
approvals and (b) already has a real deliverable and tracked approval
records, the rendered Approval Page appendix now shows the REAL approver
name, status, and decided date for each required role — instead of a blank
row to fill in by hand. Every other workshop template kind, and the
Approval Page itself for any deliverable with no real data yet (the common
case, since most session packs are generated before a deliverable exists),
is completely unchanged.

## Layer Impact

- **global-control-lane**: `src/lib/programs/playbook/design-session-pack.ts`,
  used by every Moves program's Design Session Pack generation (`POST
  /api/v1/programs/[programId]/playbook`). Additive rendering change only —
  no new API, no schema change (reads the existing `deliverable_role_
  approvals` table via the existing `getRoleApprovalSummary`).

## Client Applicability

- All clients: yes — any Move whose current phase's sessions feed
  `business_case`, `target_state_architecture`, or `operating_model_design`
  and already has a real deliverable + tracked approvals for it will see
  real data in the next generated session pack.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — self-determines per render; no real data yet means no
  visible change from today's behavior.

## Changes Included

- `src/lib/programs/playbook/design-session-pack.ts`:
  - `fetchApprovalPageData(ctx, programId, deliverableTypeKeys, opts?)` (new,
    exported) — filters the given type keys to those covered by
    `requiredApprovalRolesFor`, queries `deliverables_v2` for real rows of
    those types for this program, and calls the existing
    `getRoleApprovalSummary` for each row found. Returns `{}` (no query at
    all) when none of the fed types require role approval — the common case,
    kept cheap.
  - `renderWorkshopTemplateAppendix(kinds, approvalData?)` — for the
    `approval_page` kind specifically, when real data is present for it,
    renders one row per (deliverable type × required role) with the real
    approver name (`APPROVAL_ROLE_LABELS`-matched role label, "—" for an
    unnamed approver), status, and decided date (`YYYY-MM-DD`, "—" if not
    yet decided) — instead of the single blank `&nbsp;` row. Every other
    kind, and `approval_page` with no real data, is byte-for-byte the same
    blank-row behavior as before this change.
  - `renderDesignSessionPackHtml(playbook, moveName, approvalData?)` — new
    optional third parameter, defaulting to `{}` (no behavior change if
    omitted, so any other caller is unaffected).
  - `generateDesignSessionPack` — now collects the playbook's deduped
    `feedsDeliverables` type keys, calls `fetchApprovalPageData`, and passes
    the result through to the HTML renderer. Still fully backward compatible
    — its own signature is unchanged, and the only behavior difference is
    the appendix content when real data exists.
- `src/lib/programs/playbook/__tests__/design-session-pack-approval-data.test.ts`
  (new, 6 tests): confirms the blank-row fallback is unchanged with no data;
  confirms real approver name/status/decided-date render when data is
  supplied, with no blank cells in that specific section; confirms an
  unrelated template kind (`decision_log`) stays blank even when
  `approval_page` has real data; and 3 tests for `fetchApprovalPageData`
  itself (no query for uncovered types, real resolution for a covered type
  with a real row, and an empty result when the covered type has no
  deliverable row yet).

## QA / Validation

- `npx jest src/lib/programs/playbook/__tests__/design-session-pack-approval-data.test.ts`
  — 6/6 pass.
- `npx jest src/lib/programs/playbook
  src/lib/programs/__tests__/deliverable-role-approvals.test.ts` — 26/26
  pass (all pre-existing tests unaffected).
- `npx eslint src/lib/programs/playbook/design-session-pack.ts
  src/lib/programs/playbook/__tests__/design-session-pack-approval-data.test.ts`
  — 0 errors.
- Confirmed the sole existing caller
  (`src/app/api/v1/programs/[programId]/playbook/route.ts`) calls
  `generateDesignSessionPack(ctx, { moveId, moveName, playbook })` — its
  call site is unchanged; the new behavior is entirely internal to the
  function.
- Local `npx tsc --noEmit -p .` historically crashes in this sandbox; CI's
  "Typecheck + reasoning-layer tests" is authoritative.
- `git diff --check` — clean.

## Rollout Plan

Merge to `main` via the protected PR lane (squash merge). Pure code change —
no migration, no flag. Deploy proceeds through the repo-owned
`aca-main-deploy` workflow; takes effect on the next Design Session Pack
generation after the new revision receives traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — to be
  confirmed after merge.
- Shared runtime mutators: none used directly.
- Approved image digest: to be recorded once the deploy workflow runs.
- ACA runtime invariant: to be proven after deploy.
- Worker image invariant: N/A — no worker job generates session packs.
- Feature/env flag update path: N/A — no flag.
- Live signed-in proof required: yes — after deploy, generate a Design
  Session Pack for a real Move's phase that feeds a covered deliverable type
  which already has real tracked role-approval data, and confirm the
  rendered Approval Page appendix shows the real approver name/status/date.

## Rollback Plan

Revert the merge commit. No schema or data touched — reverting restores the
prior behavior (Approval Page always renders blank), re-opening the exact
gap this release closes.

## Audit Evidence

- PR URL: to be added when opened.
- CI run: to be added when the PR's checks complete.
- Deployment URL / ACA revision: to be added after deploy.

## Known Gaps

- **No live-generated real-pack proof yet.** As with the prior release
  records this session, no Move in the tenants checked had both a covered
  deliverable type generated AND real tracked role-approval decisions
  recorded at the same time — deferred to the dedicated live E2E backlog
  items (95/96).
- **Only the HTML session-pack render path is bound.** If any other surface
  independently renders `WORKSHOP_TEMPLATES.approval_page` (none identified
  in this session's research, but not exhaustively verified across the
  whole codebase), it would still show the blank template.
- **Row grouping is by deliverable type, not visually separated per type**
  when a phase feeds multiple covered types at once (e.g. both
  `target_state_architecture` and `operating_model_design` in the same P3
  pack) — each role row is annotated with its deliverable type in
  parentheses rather than under a per-type sub-heading. Acceptable for the
  common single-covered-type case; a nicer per-type grouping is a possible
  future polish, not attempted here.
