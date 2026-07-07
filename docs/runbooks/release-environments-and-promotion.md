<!-- markdownlint-disable MD013 -->

# Release Environments and Promotion Runbook

Mapped readiness items: `ABARVA_PILOT_READINESS_PLAN.xlsx` rows `T039` and the release-governance portion of the architecture backlog.

This runbook defines how AbarVa moves a change from development to preview,
single-client pilot production, and later multi-client production. It is an
operations document only; it does not deploy infrastructure, modify runtime
code, or approve private data-plane loading.

## Environment Definitions

| Environment | Purpose | Allowed evidence | Not enough for |
| --- | --- | --- | --- |
| Local development | Fast build, focused tests, local screenshots, draft docs. | Local command output, unit tests, typecheck, focused browser checks. | Buyer-facing production claims. |
| PR preview | Pre-prod review of the exact PR branch. | Required GitHub checks, PR URL, preview URL when available, release record, manual review notes. | Live client data-plane claims unless explicitly wired and evidenced. |
| Control-plane production | Shared app/control-plane behavior on `main`. | Merge evidence, required checks, release record, deployment or route smoke evidence when available. | Client data residency or private data-plane custody claims. |
| Single-client pilot production | One approved client scope running against its approved data-plane and auth posture. | Control-plane evidence plus client-scoped auth, isolation, data-load, audit, and rollback evidence. | Multi-client readiness. |
| Multi-client production | Repeatable production posture for two or more clients. | Per-client provisioning evidence, isolation replay, monitoring, rollback, runbooks, support ownership, and client-specific audit records. | Shortcutting a new client from a prior pilot. |

## Promotion Path

1. **Develop locally**
   - Branch from current `origin/main`.
   - Keep changes inside the selected release lane and ownership zone.
   - Run focused local validation for the touched layer.
   - Add or update a release record when release-relevant files change.

2. **Open PR**
   - Fill the PR template release classification, QA, rollout, and rollback
     sections.
   - Attach local validation and any manual browser or smoke evidence.
   - Do not call the PR production-ready because it is green locally.

3. **Pre-prod preview**
   - Let required checks run on the PR branch.
   - Use the preview URL, when available, for human review of product behavior.
   - If Vercel integration evidence is unavailable, record that as a known gap
     instead of inventing a deployment signal.
   - For auth-sensitive routes, verify Clerk behavior in preview or a deployed
     target before promotion.

4. **Protected merge**
   - Merge only through the protected PR path and merge queue posture.
   - Do not bypass checks with admin privileges.
   - Do not delete protected branches when branch deletion is disabled.
   - Record the merge commit in the tracker or release evidence when it closes a
     backlog row.

5. **Control-plane production validation**
   - Confirm the intended commit reached `main`.
   - Check that relevant required statuses passed.
   - Run route smoke, API smoke, or browser validation for the changed surface
     when runtime behavior changed.
   - If production deployment evidence is delayed or unavailable, mark the row
     `In progress`, not `Done`.

6. **Single-client pilot production gate**
   - Name the client scope explicitly.
   - Confirm user identity and role posture, including Clerk organization, SSO,
     and admin-only surfaces when applicable.
   - Confirm data access is client scoped and uses `client_id` through the
     adapter boundary.
   - Attach private data-plane evidence only for that client, such as approved
     load manifest, quarantine result, processing ledger, and commit summary.
   - Confirm rollback owner and last-known-good state for both control plane and
     data plane.

7. **Multi-client production gate**
   - Replay the provisioning and smoke sequence for each additional client.
   - Prove client isolation independently for each client pair.
   - Confirm per-client observability, incident ownership, and rollback path.
   - Confirm support and communication ownership before declaring multi-client
     production.

## Promotion Gates by Release Lane

| Lane | Preview gate | Production gate | Extra evidence |
| --- | --- | --- | --- |
| `global-control-lane` | Required checks and surface smoke. | Protected merge plus production route/API smoke when runtime changed. | Feature flag state if gated. |
| `client-data-lane` | Required checks plus migration/load dry-run where applicable. | Client-scoped data-plane evidence, isolation check, rollback owner. | Per-client manifest, RLS or adapter proof, load ledger. |
| `internal-admin` | Admin role/access review and focused admin smoke. | Protected merge plus admin-only access check. | Audit trail of admin action if consequential. |
| `public-demo` | Public route smoke, accessibility, and buyer-facing copy review. | Protected merge plus public route smoke. | Screenshot or crawl evidence. |
| `experimental` | Feature flag default-off proof. | Remains non-default until explicitly promoted. | Flag owner, expiration, rollback toggle. |

## First Pilot vs Later Pilots

For the first client, production means the single-client pilot scope is safe to
use with that client's approved users and approved data. It does not mean the
platform can onboard a second client without replay.

For a second or third client, repeat the private data-plane, auth, role,
quarantine, load, isolation, and rollback gates. Do not reuse first-client
evidence as second-client evidence unless the evidence is a shared control-plane
check and the release record says so.

## Rollback Drill

Run this tabletop before declaring a pilot production release complete:

1. Pick one recently merged control-plane PR.
2. Identify the last known good commit, deployment, and release record.
3. Identify whether rollback is a revert, deployment rollback, feature-flag
   toggle, job pause, or data-plane restore escalation.
4. Name the decision-maker, validation owner, and client communication owner.
5. Record what would be validated after rollback.
6. Update `docs/runbooks/rollback.md` if the drill exposes missing evidence.

The drill can be dry. Do not mutate production or client data during the drill
unless Anand explicitly approves a live rollback exercise.

## Drill Evidence Records

| Date | Scope | Evidence |
| --- | --- | --- |
| 2026-06-03 | Dry tabletop for AI-egress usage-cap enforcement rollback | `docs/build/ROLLBACK_DRILL_EVIDENCE_2026-06-03_AI_EGRESS_USAGE_CAP.md` |

## Status Reporting Rules

Use truthful status language:

- `Done`: merged, required checks passed, and the evidence required by the row
  exists.
- `In progress`: code or docs exist, but external, legal, live deployment,
  Vercel-integration, private-data-plane, or merge evidence is still missing.
- `Pending`: no durable repo artifact or external evidence yet.

Never mark multi-client production ready based only on a first-client pilot
release.

## References

- `docs/architecture/adr/ADR-0009-release-environments-and-pilot-production.md`
- `docs/releases/RELEASE_CONTROL_POLICY.md`
- `docs/runbooks/rollback.md`
- `docs/releases/templates/release-record-template.md`
- `.github/pull_request_template.md`
