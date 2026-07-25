# 2026-07-25-home-v4-approval-activation-lifecycle — reject, retire, and rollback for V4 candidate packs

## Release ID

`2026-07-25-home-v4-approval-activation-lifecycle`

## Status

`candidate` — verified locally, not yet merged. The new migration has not yet been applied to the
real database as of this record (see Rollout Plan and Known Gaps).

## Plain-English Summary

Before this PR, the only action available for a V4 book-mode candidate was "approve" (with an
optional override for a flagged one). That leaves three real gaps: there was no way to explicitly
decline a candidate (it just sat forever, or was silently superseded by the next one), no way to
pull a tenant's active pack down without immediately promoting a replacement, and no way to
reactivate a previous pack if a newer one turns out worse. This PR adds all three as first-class,
audited actions, alongside the first automated tests this pack-lifecycle code has ever had.

- **Reject**: decline a candidate outright, with a required reason. It never goes live.
- **Retire**: pull down the currently-active pack for a tenant on purpose (e.g. to intentionally
  fall back to the older renderer), without approving a replacement.
- **Rollback**: reactivate a specific earlier pack (previously retired or rejected), displacing
  whatever is currently active. Every reactivation records what it displaced.

Every action requires a written reason and records who took it and when — the same audit
discipline the existing "approve" action already had.

## Layer Impact

- `internal-admin`: all new surfaces (migration columns, library functions, API routes, review-queue
  UI) are internal operator/reviewer tooling — platform-admin-gated, not client-visible. No
  canonical-model or client-data-lane change.

## Client Applicability

- Internal only: no tenant-facing route or content changes. This governs how AbarVa staff move a
  reviewed candidate through its lifecycle; it does not change what any tenant sees.
- Feature flag: none — same platform-admin gate (`isPlatformAdminSession()`) as the existing approve
  action and `/home/v4-preview` itself.

## Changes Included

- `supabase/migrations/20260725230000_home_knowledge_v4_lifecycle_actions.sql` (new): adds
  `'rejected'` to the `status` CHECK constraint, and `rejected_by`/`rejected_at`/`reject_reason`/
  `retired_by`/`retire_reason`/`rollback_of_pack_id` columns.
- `src/lib/home/home-knowledge-v4-review.ts`: new `rejectHomeKnowledgeV4Candidate`,
  `retireHomeKnowledgeV4ActivePack`, `rollbackHomeKnowledgeV4Pack`, and
  `listHomeKnowledgeV4PackHistoryForTenant`; extended `HomeKnowledgeV4ReviewCandidate` and the
  review-queue query with the new columns.
- New API routes: `src/app/api/admin/home-knowledge-v4/{reject,retire,rollback,history}/route.ts`,
  each gated by `isPlatformAdminSession()`, mirroring the existing `approve/route.ts` pattern.
- `src/components/home/v4/HomeV4ReviewQueue.tsx`: reject and retire actions on each candidate row,
  and a per-tenant version-history panel with a rollback action on any retired/rejected pack.
- `src/lib/home/__tests__/home-knowledge-v4-review.test.ts` (new): 18 tests against a real
  in-memory transactional mock of the actual SQL statements (no prior automated coverage existed
  for this lifecycle at all) — covering approve/reject/retire/rollback state transitions,
  one-active-pack enforcement, tenant isolation, and precondition errors.

## QA / Validation

- `pass` — `npx eslint` on all changed files, zero findings.
- `pass` — full-project `tsc --noEmit` (expanded heap), zero errors.
- `pass` — full production `npm run build`, zero errors; confirmed all 4 new API routes registered
  in the route manifest.
- `pass` — new test suite: 18/18 passing.
- Migration syntax was reviewed manually; `npm run db:migrate:dry` could not be exercised in this
  environment (no reachable database — the real Postgres instance sits inside a private VNet, per
  standing project constraint). See Rollout Plan for how this gets applied and verified for real.

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds and deploys the new image (containing the new
   migration file and the new routes/UI).
2. Apply the migration for real via the governed ACA operator job
   (`scripts/ops/submit-aca-operator-job.mjs --image <new-digest> --script db:migrate:ci`), using
   the digest produced by this PR's deploy — not skipped, unlike the prior
   `home_knowledge_v4_job_runs` migration's known gap (see Known Gaps in
   `2026-07-25-home-v4-overall-position-mixed-clarity.md`).
3. Verify the migration applied: confirm the new columns exist and the CHECK constraint accepts
   `'rejected'`.
4. Live signed-in verification on `/home/v4-preview` as a platform admin: confirm reject/retire
   actions and the version-history/rollback panel render and function against the real database.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: the governed ACA operator job for the migration apply step (see Rollout
  Plan step 2) — not a shared-web-traffic change, a one-off migration-apply execution.
- Approved image digest: the digest produced by this PR's `aca-main-deploy.yml` run.
- ACA runtime invariant: verified same as every prior deploy in this workstream.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the new admin actions specifically (see Rollout Plan
  step 4) — not a tenant-facing surface, but a real state-mutating admin capability.

## Rollback Plan

Revert the PR. The new columns and `'rejected'` status value are additive (no existing row or query
depends on them), so reverting the code leaves the schema addition harmless and unused; a full
schema rollback (dropping the columns/reverting the CHECK constraint) is a separate, explicit
follow-up only needed if the columns must be removed entirely, not merely disabled.

## Audit Evidence

- This PR's diff and CI run.
- `aca-main-deploy.yml` run for this merge, once available.
- The governed migration-apply job's execution log and `provisioningState`, once run.
- Post-deploy live signed-in screenshots of the new reject/retire/rollback UI, once captured.

## Known Gaps

- This PR does not change `/home/v4-preview`'s content-review UI (still static fixtures for the
  visual/content preview) — only the review-queue header's lifecycle actions. Wiring the preview's
  actual content display to live database rows is separate work.
- No "un-reject" action exists (a rejected candidate cannot be turned back into a reviewable
  candidate) — the only path back from `rejected` is rollback, which reactivates it directly as
  approved. If a reviewer rejects by mistake and wants to reconsider without immediately going
  live, that's a real gap, not addressed here.
- Concurrent-admin races (two reviewers acting on the same tenant simultaneously) are handled by
  Postgres row locking (`FOR UPDATE`) within each action's own transaction, but no test exercises
  actual concurrent execution — the mock-based tests are single-threaded by construction.
