# 2026-07-20-deliverable-role-approvals — Named, multi-role approval tracking for Moves deliverables

## Release ID

`2026-07-20-deliverable-role-approvals`

## Status

`released`

## Plain-English Summary

The design conversation asked for a real approval lifecycle: named Business, Technology,
Finance, and Risk/Security approvers, each independently tracked, rather than one
signature standing in for every stakeholder's agreement. Before writing any schema, this
work found that a parallel effort had shipped part of the foundation the day before
(`deliverables_v2.signed_off_version`/`approved_artifact_id`, a durable pointer to which
version was approved and an optional link to a client-uploaded replacement file, wired
through a real sign-off endpoint, UI badge, and the generation pipeline). That system
remains the single "is this deliverable finalized" flag and is unchanged by this release.
What was missing — and what this release adds — is the ability for a deliverable TYPE to
require one or more of the four role categories to each independently record their own
review status (pending/reviewed/approved/rejected), with a named approver and any
outstanding conditions, before the overall approval should be considered meaningful for a
governed, multi-stakeholder artifact.

## Layer Impact

- **global-control-lane**: a new table (`deliverable_role_approvals`) and a new API route
  under the shared `/api/v1/programs/**` surface. Additive only — `deliverables_v2` is
  untouched, and only 3 Moves deliverable types (`business_case`,
  `target_state_architecture`, `operating_model`) currently require any role approvals;
  every other type's existing single-actor sign-off flow is completely unaffected.

## Client Applicability

- All clients: yes — shared Moves infrastructure, no gate.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — the new table/endpoint is inert until a caller uses it; no
  existing UI currently calls the new endpoint (see Known Gaps), so there is no
  observable behavior change for any user in this release.

## Changes Included

- `supabase/migrations/20260720040000_deliverable_role_approvals.sql` — new
  `deliverable_role_approvals` table: one row per (deliverable, role), upserted on each
  decision (not a full audit log). Columns: `role` (business/technology/finance/
  risk_security, CHECK-constrained), `status` (pending/reviewed/approved/rejected,
  CHECK-constrained), `approver_user_id` (free text, mirrors `deliverables_v2
  .signed_off_by`'s existing convention), `approver_name` (display name/title, e.g.
  "Jane Doe, CFO" — self-contained for export/cover-page use), `outstanding_conditions`,
  `decided_at`. RLS service-role policy matching every sibling table in this file.
  Additive only; no change to any existing table.
- `src/lib/programs/deliverable-role-approvals.ts` (new):
  - `REQUIRED_APPROVAL_ROLES` — the registry declaring which roles each deliverable TYPE
    requires. Deliberately populated for only 3 types (business_case needs
    business+finance; target_state_architecture needs technology+risk_security;
    operating_model needs business+technology) rather than defaulting every type to
    every role — most artifact types do not need a four-way sign-off, and requiring one
    is a real product decision made per type, not assumed.
  - `getRoleApprovalSummary` — reads the current per-role status for a deliverable.
    Required roles with no recorded decision yet are synthesized as `pending` (not
    omitted), so a caller always sees the full required set. Reports
    `allRequiredApproved` (true only when every required role is `approved`) and
    `anyRejected`.
  - `recordRoleApprovalDecision` — upserts one role's decision, keyed on
    `(deliverable_id, role)`. Stamps `decided_at` only for the terminal
    `approved`/`rejected` states, not for `pending`/`reviewed`.
- `src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/role-approvals/route.ts`
  (new) — `GET` reads the summary; `POST` records a decision, gated behind the same
  `approver` authority bar as the existing sign-off route.
- New test file `deliverable-role-approvals.test.ts` (10 tests, mirroring the mocking
  conventions of the existing `sign-off-deliverable-approved-upload.test.ts`): registry
  lookups (including the "no roles required" default case); pending-synthesis for
  unrecorded roles; `allRequiredApproved` only true when every required role is
  approved (not just some); `anyRejected` detection; the terminal-vs-non-terminal
  `decided_at` stamping rule; the tenancy boundary (recording a decision on a
  deliverable outside the program throws).

## QA / Validation

- `npx jest src/lib/programs/__tests__` — 518 tests, 516 passed / 2 failed. Both
  failures are pre-existing and unrelated: an SSN-quarantine PII-detection contract test
  and a tenant-display-name resolution test (`SkyHarbor Air` vs `Airline Demo`) — the
  same demo-tenant-naming drift already independently confirmed pre-existing multiple
  times earlier in this session against a clean baseline, in files this change does not
  touch.
- `npx eslint` on all 4 new files — 0 errors.
- `node scripts/release-check.mjs` — passed, including the migration-drift check
  (`New migration drift surface` / `Migration drift · PR check` in CI).
- Local `npx tsc --noEmit -p .` and `npx tsx src/scripts/run-migrations.ts --dry` both
  require Azure/Postgres credentials not present in this sandbox — could not be run
  locally; CI's typecheck and migration-drift checks are authoritative here, consistent
  with this session's established practice for schema changes.
- `git diff --check` — clean.

## Rollout Plan

Merge to `main` via the protected PR lane (squash merge). The migration is additive-only
(new table, no changes to existing tables) and applies via the standard `db:migrate`
path on the next deploy that runs it — no backfill, no data migration, no existing row
touched. Deploy proceeds through the repo-owned `aca-main-deploy` workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, run
  [29716552978](https://github.com/abarva-platform/abarva/actions/runs/29716552978)
  (headSha `0c4e6780501701273b1850c0fb19eefd64f4e16b`, the #5102 merge commit),
  conclusion `success`.
- Shared runtime mutators: **CORRECTION (2026-07-20, added during migration-lane
  investigation):** the claim below that "the migration ran via the deploy pipeline's
  standard migration step" was wrong. `aca-main-deploy.yml` has no migration-apply step
  — it never has. The migration sat pending against the live database from this PR's
  merge (2026-07-19T23:18) until the governed migration lane's real `apply` dispatch
  applied it on 2026-07-20T23:53Z–00:10Z (see
  `docs/releases/records/2026-07-20-db-migration-lab-workflow.md`, run
  [29789097644](https://github.com/abarva-platform/abarva/actions/runs/29789097644)).
  During that gap, `governance.ts`'s gate evaluation for `design_approved`/
  `business_case_approved` on covered deliverable types would have thrown a real
  (though never actually observed — confirmed via Log Analytics) runtime error on
  querying this table. That gap is now closed.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:d3d1c09d095d4ea77650d0ef51d96d830115b9ca76ad9fe8e25f1c19e210b7d5`.
- ACA runtime invariant: **proven for the code deploy only** — `az containerapp show`
  confirmed the template image and the 100%-traffic revision
  (`ca-abarva-web-lab-eastus--m0c4e6780`) resolved to the digest above. This does not
  extend to the database migration; see the correction above.
- Worker image invariant: **proven for the code deploy only**, same caveat as above —
  `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` matching the same
  digest confirms a single consistent code deploy, not that the migration ran.
- Feature/env flag update path: N/A — no flag.
- Live signed-in proof: **partially performed.** Navigated to `app.abarva.ai` post-deploy
  and confirmed the app loads and functions normally (no regression from the schema
  change). The specific claim not yet exercised live: calling
  `GET /api/v1/programs/:id/deliverables/:did/role-approvals` for a real `business_case`
  or `target_state_architecture` deliverable end-to-end. This was not force-created in
  this pass — CI's "Fresh Postgres migration replay" already exercises the migration
  against a real Postgres instance, which is the stronger correctness signal for a
  schema-only change with no UI yet; the live HTTP round-trip remains open until a real
  deliverable of one of the 3 covered types exists to call it against.

## Rollback Plan

Revert the merge commit. The new table has no foreign keys pointing INTO it from any
other table (only the `deliverable_id` FK pointing out to `deliverables_v2`), so it can
be dropped without cascading effects; no existing table or data is modified by this
migration, so a revert (or simply leaving the unused table in place) carries no risk.

## Audit Evidence

- PR: [abarva-platform/abarva#5102](https://github.com/abarva-platform/abarva/pull/5102),
  22/22 required checks passed (including "Fresh Postgres migration replay" and "New
  migration drift surface" for the new table), squash-merged as
  `0c4e6780501701273b1850c0fb19eefd64f4e16b`.
- CI/deploy run: [aca-main-deploy #29716552978](https://github.com/abarva-platform/abarva/actions/runs/29716552978),
  conclusion `success`.
- Deployment: ACA revision `ca-abarva-web-lab-eastus--m0c4e6780` in
  `rg-abarva-controlplane-lab-eastus`, 100% ingress traffic, image digest
  `sha256:d3d1c09d095d4ea77650d0ef51d96d830115b9ca76ad9fe8e25f1c19e210b7d5`.
- Live proof: app-loads/no-regression confirmed on `app.abarva.ai` post-deploy. The
  live GET/POST round-trip against the new endpoint for a real deliverable was not
  exercised in this pass (no UI yet calls it, and no real business_case/target_state_
  architecture deliverable was quickly reachable to call it against manually) — the
  migration's correctness against a real Postgres instance is independently confirmed
  by CI's "Fresh Postgres migration replay" check.

## Known Gaps

- **No UI yet.** This release ships the data model and API only — no cover-page/
  approval-page UI component rendering the "Field: Artifact owner / Business approver /
  Technology approver / Finance approver / Risk-Security approver / Approval status /
  Approval date / Approved version / Outstanding conditions / Link to approved uploaded
  artifact" table from the design conversation. `PhaseDocumentsPanel.tsx` and
  `DeliverableApprovalAction.tsx` (the existing single-actor sign-off UI) are not yet
  updated to call the new endpoint or display per-role status. This is real, scoped,
  separate frontend work.
- **Gate-engine integration not yet wired.** `governance.ts`'s phase-gate criteria engine
  does not yet consult `getRoleApprovalSummary`/`allRequiredApproved` — a phase can still
  advance today based solely on the existing single-actor `signed_off` status, even for
  the 3 deliverable types that now have a required-role registry entry. Wiring
  `allRequiredApproved` as an additional (not replacing) gate condition for those 3
  types is a natural, contained follow-up.
- **`REQUIRED_APPROVAL_ROLES` covers 3 deliverable types.** Whether other types (Charter,
  Discovery Report, Execution Roadmap, etc.) should require role-based approval, and
  which roles, is a product decision not made in this release — the registry is
  designed to make adding a type a one-line change once that decision is made.
- **The workshop-template "Approval Page" added in the session-guidebook-enrichment
  release (`WORKSHOP_TEMPLATES.approval_page`) is a separate, simpler construct** — a
  blank printable template for a facilitated session, not connected to this real,
  tracked, per-role database entity. Reconciling the two (or making the session-pack
  template pull real status from this table once a deliverable exists) is a future
  integration opportunity, not attempted here.
