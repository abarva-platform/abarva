# Product Prod Cutover Packet

## Purpose

This packet makes ENV-13 executable without improvising during public cutover. It defines the proof required before and after `app.abarva.ai` can be considered cut over to Product Prod.

It is intentionally non-mutating. Do not change DNS, Front Door, traffic weights, Container Apps revisions, secrets, migrations, data, or public runtime routing from this packet without explicit approval.

Machine-readable companion: `docs/azure/PRODUCT_PROD_CUTOVER_PACKET_2026-06.json`.

Verifier: `npm run azure:product-prod-cutover:verify`.

## Scope

- Public host: `app.abarva.ai`
- Target runtime: Azure Container Apps
- Source runtime must not be: Vercel
- Data allowed: synthetic, approved product telemetry, approved reference data
- Data disallowed: client private production data, unapproved client-confidential data, PHI, PII, raw client private documents

PHI is not accepted. PII is not accepted. Client private data belongs in client private planes.

## Dependencies

Product Prod cutover is blocked until these packets exist and are accepted:

- Product Prod provisioning packet
- Product Preview release-candidate gates
- Product Preview E2E rehearsal

## Approval Boundary

Explicit approval is required before:

- approving Product Prod subscription readiness
- approving the pinned image digest
- accepting applied database migrations
- accepting Product Prod smoke
- accepting signed-in browser QA
- accepting context health
- accepting monitoring and alert rules
- accepting rollback rehearsal
- changing DNS or Front Door
- approving public cutover

## Pre-Cutover Evidence Required

Collect before any public cutover:

- Product Prod subscription id
- ACA environment export
- Container App export
- active revision before cutover
- pinned image digest
- migration replay green
- public health endpoint HTTP 200
- `/api/health` proves Azure/Postgres/direct Postgres true
- no `server: Vercel`
- no `x-vercel-id`
- no Supabase runtime dependency
- signed-in browser QA report
- context health check report
- retrieval/citation/context-bundle proof
- artifact download proof
- Responsible AI acknowledgement proof
- monitoring dashboard links
- alert rule export
- rollback command
- explicit approval record

## Post-Cutover Evidence Required

Collect after approved cutover:

- public curl headers
- public health JSON
- DNS or Front Door export
- active revision after cutover
- traffic split export
- signed-in smoke after cutover
- context bundle trace after cutover
- artifact download after cutover
- Log Analytics error check
- rollback still available

## Hard Stops

Stop cutover if any of these are true:

- explicit cutover approval is missing
- a Vercel header is present
- `x-vercel-id` is present
- Supabase runtime dependency is present
- health endpoint is not HTTP 200
- `direct_postgres` is false
- context bundle is not proven
- signed-in QA is missing
- rollback command is missing
- monitoring is missing
- PHI or PII is present

## Command Templates

These are templates only. Do not run without approval.

```bash
npm run azure:cutover:runtime-smoke
```

```bash
curl -I https://app.abarva.ai/
```

```bash
curl https://app.abarva.ai/api/health
```

## Completion Rule

ENV-13 is not complete until pre-cutover evidence, approved cutover, and post-cutover evidence are all recorded in the execution ledger. Scaffold-ready means the process and verifier exist; it does not mean Product Prod is live.
