# Azure Customer Cutover Runbook

Date: 2026-05-21
Status: authored, not rehearsed
Data posture: synthetic/no-client-data until an approved customer cutover window

## Purpose

This runbook defines the operational path to move a customer tenant from the
current source database lane to the Azure Postgres data plane. It is written for
a controlled pilot cutover, not a bulk production migration.

The current Azure lab is a validated cutover candidate. It is not customer
cutover ready until the go/no-go gates below are green or explicitly waived.

## Named Roles

| Role | Responsibility |
|---|---|
| Founder / customer owner | Owns customer communication, cutover window, and final go/no-go. |
| Engineering lead | Runs freeze, copy, migration, parity, app, and rollback commands. |
| Security owner | Accepts or blocks remaining L3 security attention items. |
| Product QA owner | Verifies tenant surfaces, artifacts, and agent behavior. |
| Customer sponsor | Confirms business acceptance after smoke test. |

## Go / No-Go Gates

| Gate | Required state | Current lab evidence |
|---|---|---|
| Resource parity | Pass | `npm run azure:resource:parity`: 37 pass, 0 attention, 0 fail. |
| Schema migration | Pass | Azure migration job succeeded; 164 migrations present. |
| Tenant copy parity | Pass | Northstar context copy parity passed. |
| App health | Pass | `/api/health`: `postgres=true`, `direct_postgres=true`. |
| Observability | Pass | `npm run azure:observability:audit`: 13 pass, 0 attention, 0 fail. |
| Security | Pass or signed waiver | Current lab: 85 pass, 9 attention, 0 fail. |
| Connectivity smoke | Pass with logs | `job-azure-connectivity-smoke-eus-vyhijgl`: Postgres, Blob, Service Bus, Key Vault, Search all passed. |
| Authenticated surface matrix | Pass | 15/15 across Apex, Meridian, First Capital. |
| Load smoke | Pass | 117 requests, 0 errors, p95 1016.6ms. |
| Cross-tenant isolation | Pass | SEC-P0 probes: 8/8. |
| Artifact generation | Pass | Moves and Source artifact endpoints return 200; PPTX magic validated. |
| Agent quality | Pass or signed limitation | Current lab proves deterministic fallback; model-enabled run still needed. |
| Rollback rehearsal | Pass | Not rehearsed yet. |

## Phase 0 — Pre-Cutover Freeze

1. Announce freeze window to the customer sponsor and internal team.
2. Freeze tenant setup/data changes in the source system.
3. Freeze app deployments except the approved cutover build.
4. Record source and target database URLs by secret name only; do not paste
   raw credentials into the run log.
5. Confirm the target tenant key and tenant ID.
6. Confirm no real customer names or prohibited target names are introduced in
   source-controlled synthetic data.

Stop if the customer sponsor cannot confirm the freeze window.

## Phase 1 — Preflight Snapshot and Evidence

Run:

```bash
npm run azure:resource:parity
npm run azure:observability:audit
npm run azure:security:audit
```

Start and capture connectivity smoke:

```bash
az containerapp job start \
  -g rg-abarva-controlplane-lab-eastus \
  -n job-azure-connectivity-smoke-eus
```

Capture:

- execution name;
- execution status;
- replica name;
- logs showing Postgres, Blob, Service Bus, Key Vault, and Search pass.

Stop if any gate returns `fail`.

## Phase 2 — Final Delta Copy

Run the tenant copy job inside Azure/VNet. Public GitHub runners and the local
laptop are not authoritative because the Azure Postgres target is private-DNS
only.

Required pattern:

1. Dry-run tenant copy.
2. Review planned counts.
3. Real copy.
4. Parity check.

Evidence to capture:

- copy job execution name;
- tenant key;
- source counts;
- target counts;
- parity result;
- any skipped tables and why.

Stop if parity fails or any required tenant table is missing.

## Phase 3 — App Runtime Cutover

Confirm the Azure app is using the intended image and data plane:

```bash
az containerapp show \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --query '{revision:properties.latestReadyRevisionName,image:properties.template.containers[0].image,env:properties.template.containers[0].env}' \
  -o json
```

Required:

- `ABARVA_DATA_PLANE=azure-postgres`;
- `DATABASE_URL` projected from the Azure Postgres secret;
- `APPLICATIONINSIGHTS_CONNECTION_STRING` projected from a secret;
- current approved image tag.

Run:

```bash
curl -fsS https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io/api/health
```

Stop if `postgres` or `direct_postgres` is not true.

## Phase 4 — Product QA

Run:

```bash
BASE_URL=https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
  npx playwright test tests/e2e/primary-surfaces-tenant-matrix.spec.ts \
  --project=chromium --workers=1
```

Run authenticated load smoke:

```bash
npm run azure:load:primary-surfaces -- \
  --base-url https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
  --auth-mode demo-sign-in \
  --duration-seconds 60 \
  --concurrency 3 \
  --require-2xx \
  --p95-target-ms 10000 \
  --cookie-refresh-seconds 0 \
  --paths /home,/intelligence,/strategic-moves,/source,/tower
```

Run SEC-P0 probes with an authenticated same-tenant cookie and a known
other-tenant ID/key.

Stop if:

- any surface is unavailable;
- any primary route returns non-2xx;
- any cross-tenant probe fails;
- any product surface fabricates missing tenant data instead of showing an
  explicit gap.

## Phase 5 — Artifact and Agent QA

Verify core artifacts:

- Moves board-grade HTML decks;
- Moves business-case PPTX;
- Source CXO report HTML;
- Source CXO report PPTX;
- Source Deal Pack.

Required:

- HTTP 200;
- PPTX ZIP magic `504b0304`;
- no unsupported award/fund/proceed recommendation;
- explicit evidence gaps where data is missing.

Agent QA:

- deterministic fallback route must return evidence-aware, no-fabrication
  output;
- model-enabled run must be executed before a customer-facing agent demo is
  considered fully validated.

## Phase 6 — Go Decision

Go only if:

- all hard gates pass;
- security attention items are either closed or signed as pilot waivers;
- rollback path is still viable;
- customer sponsor accepts the validation evidence.

No-go if:

- any migration/parity/health gate fails;
- any cross-tenant probe fails;
- app runtime is not reading Azure Postgres;
- artifacts contradict kernel/judgment verdicts;
- a customer-facing model path is generic or fabricates missing data.

## Rollback

Rollback is traffic/data-plane reversal, not data deletion.

1. Stop new customer changes.
2. Switch runtime secret/reference back to the prior known-good database lane
   or prior deployed app target.
3. Restore previous Container App revision if the failure is image/runtime
   related.
4. Preserve Azure target database for forensics; do not truncate/delete.
5. Export failure evidence:
   - failing command;
   - timestamp;
   - revision;
   - tenant key;
   - route or job execution;
   - logs.
6. Notify customer sponsor with the rollback reason and next retry window.

## Post-Cutover Evidence Packet

Create one packet containing:

- final source and target row counts;
- migration job execution;
- copy job execution;
- `/api/health` output;
- observability audit output;
- security audit output or waiver;
- connectivity smoke logs;
- Playwright matrix result;
- load smoke result;
- SEC-P0 result;
- artifact endpoint results;
- agent QA transcript/result;
- customer sponsor sign-off.

## Current Rehearsal Gap

This runbook is authored but not rehearsed. Before a real customer cutover, run
one dry rehearsal against a synthetic tenant and store the full evidence packet
in `docs/architecture/azure/` or the designated audit-artifact folder.
