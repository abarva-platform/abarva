# 2026-07-20-role-approvals-ui — Multi-role approval status and decision UI

## Release ID

`2026-07-20-role-approvals-ui`

## Status

`candidate`

## Plain-English Summary

The `deliverable_role_approvals` data model and API (PR #5102) shipped with
no UI — a named Business/Technology/Finance/Risk-Security approver had no way
to see or record their role's decision anywhere in the product. This release
adds a `RoleApprovalsPanel` client component, mounted in the existing
Documents & Evidence panel next to the current single-actor "Approve as-is /
Upload approved version" action, that shows the tracked per-role status as
pills and lets a user record a role decision (reviewed / approved / rejected,
with an approver name and optional outstanding conditions). It renders
nothing for the large majority of deliverable types that require no role
approvals — this is additive, not a new universal gate.

While wiring the UI to the real API, a real bug was found in the data model
this UI reads: `REQUIRED_APPROVAL_ROLES`'s operating-model entry was keyed
`operating_model` (the orchestrator's internal mapped type name), but
`deliverables_v2.deliverable_type_key` — the actual column this system reads
and writes against — stores the phase-registry key `operating_model_design`.
The mismatch meant operating-model deliverables would have silently never
required any role approval since PR #5102 shipped. Fixed as part of this
release, with a regression test that checks every `REQUIRED_APPROVAL_ROLES`
key against the real registry.

## Layer Impact

- **global-control-lane**: a new client component
  (`src/components/strategic-moves/RoleApprovalsPanel.tsx`) and one wiring
  point in `PhaseDocumentsPanel.tsx`, plus a one-key data fix in
  `deliverable-role-approvals.ts`. No new API, no schema change.

## Client Applicability

- All clients: yes — the panel renders for any deliverable of a type in
  `REQUIRED_APPROVAL_ROLES` (currently `business_case`,
  `target_state_architecture`, `operating_model_design`), for every tenant.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — the panel self-determines visibility per deliverable
  by calling the existing GET endpoint and rendering nothing when
  `requiredRoles` is empty.

## Changes Included

- `src/lib/programs/deliverable-role-approvals.ts` — fixed
  `REQUIRED_APPROVAL_ROLES`'s operating-model key from `operating_model` to
  `operating_model_design` (the real `deliverableTypeKey` in
  `deliverable-registry.ts`, and the value actually written to
  `deliverables_v2.deliverable_type_key`). Added a code comment explaining
  the two distinct key spaces (registry key vs. orchestrator-mapped type)
  so this class of bug is easier to avoid next time a type is added.
- `src/lib/programs/__tests__/deliverable-role-approvals.test.ts` — two new
  tests: a registry-wide regression guard (every `REQUIRED_APPROVAL_ROLES`
  key must exist verbatim in `DELIVERABLE_REGISTRY`) and a direct assertion
  that `operating_model_design` (not `operating_model`) resolves the required
  roles.
- `src/components/strategic-moves/RoleApprovalsPanel.tsx` (new) — client
  component: fetches `GET .../role-approvals` on mount, renders a pill per
  required role (label, status, approver name, tooltip with outstanding
  conditions), an "All required roles approved" / "A required role rejected
  this version" summary line, and an inline form (role/status/approver
  name/outstanding conditions) that `POST`s a decision and refetches on
  success. Renders nothing when the deliverable's type requires no roles.
- `src/components/strategic-moves/PhaseDocumentsPanel.tsx` — mounts
  `RoleApprovalsPanel` inside `DocumentRow`, directly below the existing
  title/actions row (same `hasContent && dbRow` condition as the existing
  `DeliverableApprovalAction`, so it only shows for a deliverable that has
  actually been generated).

## QA / Validation

- `npx eslint` on all 4 changed/new files — 0 errors.
- `npx jest src/lib/programs/__tests__/deliverable-role-approvals.test.ts` —
  12/12 pass (10 existing + 2 new).
- `npx jest src/components/strategic-moves/__tests__` — 10/11 suites pass;
  `moves-liability-visible-controls.test.tsx` fails to parse due to a
  pre-existing Clerk ESM transform issue (`@clerk/backend`'s `.mjs` runtime
  file), confirmed present on a clean `origin/main` checkout of the same
  file with none of this change's edits applied — unrelated to this release.
- Local `npx tsc --noEmit -p .` requires the full monorepo type graph and
  historically crashes in this sandbox; CI's "Typecheck + reasoning-layer
  tests" is authoritative.
- `git diff --check` — clean.

## Rollout Plan

Merge to `main` via the protected PR lane (squash merge). Pure code change —
no migration. Deploy proceeds through the repo-owned `aca-main-deploy`
workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — to be
  confirmed after merge.
- Shared runtime mutators: none used directly.
- Approved image digest: to be recorded once the deploy workflow runs.
- ACA runtime invariant: to be proven after deploy.
- Worker image invariant: N/A — no worker job touches this UI path.
- Feature/env flag update path: N/A — no flag.
- Live signed-in proof required: yes — after deploy, open a real Move's
  Documents & Evidence view for a deliverable of one of the 3 covered types
  and confirm the role-approval pills render and a decision can be recorded
  and reflected without a page reload.

## Rollback Plan

Revert the merge commit. No schema or data is touched. The
`operating_model_design` key fix is itself a bugfix independent of the UI —
reverting the whole commit reintroduces the silent operating-model gap it
fixed, which is a regression, not a neutral rollback; if only the UI needs to
be pulled, keep the key fix and its test, and revert just the two UI files.

## Audit Evidence

- PR URL: to be added when opened.
- CI run: to be added when the PR's checks complete.
- Deployment URL / ACA revision: to be added after deploy.

## Known Gaps

- **No client-side authority gate on the decision form.** The server
  correctly requires `approver` authority or higher to `POST` a decision
  (unchanged from PR #5102); this UI does not hide or disable the form for a
  viewer without that authority — they would see a 403 only after clicking
  "Save decision". The existing `DeliverableApprovalAction` component has the
  same gap (no client-side role check either), so this matches established
  precedent rather than introducing a new inconsistency, but tightening both
  is a real, scoped follow-up.
- **Not yet wired into phase-gate enforcement.** This is purely a status
  display + decision-recording surface — `governance.ts`'s phase-gate engine
  still does not consult `allRequiredApproved` (tracked separately as backlog
  item 91).
- **No live-generated real-artifact screenshot yet** of the panel rendering
  non-empty pills for a real deliverable — every accessible Move in this
  tenant at last check was short the evidence needed to generate one of the
  3 covered deliverable types. Deferred to the dedicated live E2E backlog
  items (95/96), same reasoning as the DOCX-exhibit-rendering release.
- **The approver picks their own role from a dropdown** rather than the UI
  inferring it from the signed-in user's actual role/title — there is no
  existing per-user "role" attribute in this system to infer from (the
  existing single-actor sign-off has the same limitation: any authenticated
  approver can complete any step). This matches the pilot's documented
  self-approval model (see `project_gate_approval_model` — pilot: any user
  self-approves; prod: admin/maestro only) rather than being a new gap this
  release introduces.
