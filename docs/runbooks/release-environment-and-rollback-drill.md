# Release Environment and Rollback Drill Runbook

This runbook covers the release environment model and T039 rollback-drill
evidence path.

## Environment Model

| Environment | Purpose | Data posture | Promotion gate |
| --- | --- | --- | --- |
| Local worktree | Development and focused QA | Local fixtures or explicit dev credentials only | Focused tests, lint, release record |
| PR preview | Review the candidate branch before merge | No real client data unless an approved preview data plane exists | CI green, release record, reviewer approval |
| Pre-prod preview | Production-like rehearsal before customer impact | Synthetic or approved rehearsal tenant; no cross-client loading | Smoke matrix, SSO rehearsal, rollback dry-run |
| Pilot production, first client | First paying/client pilot environment | One client only, client-scoped data plane, live audit evidence | Founder/operator go, customer-safe comms plan |
| Multi-client production | Two or more clients live | One data plane per client, shared control plane only | Tenant isolation regression, per-client rollout plan |

## Promotion Rules

- Do not promote a client-data change from PR preview directly to production.
- Do not use a shared test tenant to prove client-data isolation.
- Pre-prod preview must prove auth, role mapping, data access, routes, telemetry,
  rollback, and release communications before a pilot production promotion.
- Pilot production means one real client can use the system under a signed pilot
  scope. It does not mean the multi-client operating model is complete.
- Multi-client production requires per-client rollout, rollback, isolation, and
  communications evidence.

## Rollback Drill

Run a rollback drill before the first client pilot and after every major release
lane change.

Minimum drill:

1. Select a harmless internal-admin or public-demo release candidate.
2. Capture PR number, commit SHA, deployment id, release record, and owner.
3. Promote to preview or pre-prod preview.
4. Inject a controlled failure or mark a synthetic P0 trigger.
5. Choose rollback method: Vercel rollback, feature disable, Git revert, or
   data-plane restore plan.
6. Execute in dry-run mode first.
7. Execute the approved rollback.
8. Re-run route, auth, tenant isolation, and release-control validation.
9. Attach evidence to the release record or drill packet.

## Required Evidence Packet

- release candidate id
- environment name
- owner and approver
- trigger
- rollback method
- command or console action transcript
- validation commands and results
- deployment id before and after rollback
- residual risk

## First-Client Pilot Definition

First-client pilot production is ready only when:

- one client is selected,
- the client-scoped data plane is isolated,
- SSO or approved fallback auth is tested,
- admin users are role-gated,
- data loading policy is signed,
- audit logging is append-only or captured with an approved interim control,
- support and incident communications are assigned,
- rollback drill evidence exists.

## Multi-Client Production Definition

Multi-client production is ready only when:

- each client has a separate data plane,
- client selection is never inferred from URL or demo defaults alone,
- tenant isolation probes pass for every client pair,
- deployments can roll out by client or by feature lane,
- incident communications can name affected clients precisely,
- backups, restore, and audit exports are client-scoped.

## Verification

Run:

```bash
node scripts/release/verify-release-environment-plan.mjs
```

## Completion Boundary

The repository-side plan is complete when this runbook, verifier, build
manifest, and release record merge.

T039 remains `In progress` until a real rollback drill is executed and its
evidence packet is attached.
