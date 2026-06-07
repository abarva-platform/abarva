# 2026-06-07-latest-main-azure-prod-activation — Activate latest main on Azure

## Release ID
`2026-06-07-latest-main-azure-prod-activation`

## Status
`released`

## Plain-English Summary
Built and deployed `main@70c4f98bf` (Anthropic-only reasoning standard + first-party
egress policy) to Azure Container Apps, applied the pending Azure DB migrations
(incl. the AI-egress control plane + first-party `ai_policy`), and proved production
reasoning runs on Anthropic/Claude. `app.abarva.ai` serves the Azure app with no
Vercel headers and no Supabase runtime dependency.

## Layer Impact
- `global-control-lane`: runtime image + AI-egress schema/policy.
- `client-data-lane`: `clients.ai_policy` default + per-tenant Claude enablement;
  `source_events` dedup (soft-archive 3 duplicate groups) to unblock an idempotency migration.

## Client Applicability
- All clients: reasoning now Anthropic-enabled by default (first-party policy).

## Changes Included
- Image `cutover-main-20260607-70c4f98bf` (digest `sha256:4b448827…`), revision `--0000052` @ 100%.
- Migrations applied: ai_egress_control_plane (+ 6 others) and
  `20260607150000_anthropic_first_party_default_policy`.
- Operator action: `source-events-dedup.ts --apply` (soft-archive, reversible, no deletes).

## QA / Validation
- **PASS** — GATE-DEPLOY (Azure health, no Vercel headers), GATE-SCHEMA, GATE-LIVE-ANSWER (non-stub) all passed.
- **PASS** — provider proof: `ai_egress_audit` synthesis/followups/classifier = anthropic·allow.
- Signed-in browser QA: **not-run** (needs a Clerk persona session — Lane 4).

## Rollout Plan
Already rolled (revision `--0000052` at 100%).

## Rollback Plan
Shift traffic back to a prior healthy revision (`az containerapp ingress traffic set`).
Migrations are additive/idempotent; the source_events dedup is soft-archive (reversible by
clearing `lifecycle_state='archived'` on the affected rows).

## Audit Evidence
`docs/build/azure-container-apps-cutover-2026-06-07/PROD_ACTIVATION_LATEST_MAIN.md`.

## Known Gaps
- Signed-in browser QA (authed routes) pending a Clerk persona session (Lane 4).
- `enterprise_context_*` fact layer not yet in Azure — see the CXO audit record.
