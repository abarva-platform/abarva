# 2026-06-07-final-azure-cutover-vercel-shutdown — Finalize Azure production DNS cutover and Vercel shutdown evidence

## Release ID

`2026-06-07-final-azure-cutover-vercel-shutdown`

## Status

`candidate`

## Plain-English Summary

This is the final step of moving `app.abarva.ai` off Vercel and onto Azure
Container Apps. We confirmed the Azure target is healthy and Azure-backed and
captured the exact DNS records needed. The operator then applied those records
at Namecheap; the `app` CNAME now points to the Azure environment, the custom
domain is bound (`SniEnabled`) and an Azure-managed certificate issued
(`Succeeded`). As of ~06:19Z, `https://app.abarva.ai` and `/api/health` return
200 from Azure with no Vercel headers — **the production cutover is complete**.
The operator then completed **signed-in browser QA** (`~06:42Z+`): `/home`,
`/intelligence`, `/strategic-moves`, `/source/queue`, `/tower`, `/admin` all
render signed-in; Responsible AI acknowledgment records to Azure Postgres; and a
fresh post-fix Azure log filter shows **0 Supabase references, 0 missing-column
errors, 0 HTTP 500**. The only remaining gate before Vercel removal is the
absence of Vercel credentials in this environment, so **Vercel is intentionally
left intact**. Important honest caveat: the app renders safely but Lakeshore is
**not rich-demo-ready** (Intelligence corpus not seeded, Moves empty, Tower no
substrate, Admin `0 records`) — a separate data-seeding task, not a runtime or
safety failure. **No sunset-ready claim is made.** This change is
documentation/evidence only; it adds no runtime code.

## Layer Impact

- `global-control-lane`: Documents the shared production hostname cutover from
  Vercel to the Azure Container App that serves all clients. No app/runtime
  code changes; evidence and operator runbook only.
- `client-data-lane`: Confirms (does not change) that the Azure runtime uses
  Azure Postgres (`DATABASE_URL` → `azure-postgres-control-database-url`,
  `ABARVA_DATA_PLANE=azure-postgres`) with no Supabase env/secret references.

## Client Applicability

- All clients: Yes — `app.abarva.ai` is the shared production entry point. The
  cutover affects every tenant once DNS is repointed.
- Specific clients: None hard-coded.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No.

## Changes Included

- Adds `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_DNS_CUTOVER.md`
  — Azure target confirmation, custom-domain validation requirement, and the
  exact Namecheap registrar records (TXT `asuid.app` + `app` CNAME/A) plus the
  Azure follow-up bind commands.
- Adds
  `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_SIGNED_IN_PROD_QA.md`
  — Azure-backed runtime proof obtainable without a session, plus the blocked
  signed-in QA checklist for all six surfaces.
- Updates `docs/build/supabase-sunset-proof-2026-06-07/README.md` with the
  runtime Supabase-removal proof against the live Azure revision.
- Adds this release record.

## QA / Validation

- Pass: `git diff --check` (no whitespace errors).
- Pass: `npm run release:check -- --base origin/main --head HEAD` (Release
  Control Gate + Pilot Data Loader Gate).
- Not run: targeted unit/behavior tests — this change touches only docs under
  `docs/`; no runtime files (`src/`, `scripts/`, config) changed.
- Verified (Azure CLI against `abarva-lab-sub`): Container App
  `ca-abarva-web-lab-eastus` ingress FQDN, active revision `--0000051` at 100%
  traffic, `/` and `/api/health` return 200 with
  `postgres/direct_postgres=true` and `azure_graph=postgres`.
- Verified: custom-domain verification ID
  `A8078EFAA2EC5EE0EBD7683E57858C95FFD118925265A1C3059FDB9865982C7A`; initial
  binding attempt returned `InvalidCustomHostNameValidation` (DNS still on
  Vercel at that time), as expected.
- Pass (post-cutover, ~06:19Z): `dig +short CNAME app.abarva.ai` →
  Azure FQDN (no `vercel-dns`); `curl -I https://app.abarva.ai` has no
  `server: Vercel` / `x-vercel-id`; `https://app.abarva.ai/api/health` → 200
  with `postgres/direct_postgres=true`, `azure_graph=postgres`; TLS cert
  `CN=app.abarva.ai` valid; custom domain bound `SniEnabled`; managed cert
  `mc-cae-abarva-sca-app-abarva-ai-8374` status `Succeeded`.
- Pass (post-cutover unauthenticated route probe): `/home`, `/intelligence`,
  `/strategic-moves`, `/source/queue`, `/tower`, `/admin` all 307 → Clerk
  sign-in; `/api/health` 200 Azure-backed — no 5xx, no Vercel headers.
- Pass (operator signed-in browser QA ~06:42Z+): all six surfaces render
  signed-in; Responsible AI acknowledgment records to Azure Postgres; fresh
  post-fix Azure log filter after `2026-06-07T06:42:00Z` shows 0 Supabase refs,
  0 missing-column errors, 0 HTTP 500. Schema drift repaired by applying
  existing repo migrations to Azure Postgres (RAI ledgers, engagement
  `function_pack_key`, Lakeshore holding-group metadata) — tracked in PR #3266.
- Verified: no Supabase env var or secret on the active container; `DATABASE_URL`
  points to Azure Postgres secret.
- Not ready (out of scope, no failure): Lakeshore rich-demo content
  (Intelligence corpus, Moves, Tower substrate, Admin records) is not seeded.
- Pending: Vercel shutdown — no Vercel credentials in this environment.

## Rollout Plan

No runtime rollout from this PR. The production cutover itself was an
out-of-band operator action that is now **done**: the `app` CNAME was repointed
at Namecheap to the Azure environment, the custom domain was bound and an
Azure-managed certificate issued, and signed-in production browser QA passed.
Remaining operator step: remove Vercel once Vercel credentials are available
(production alias/domain, GitHub auto-deploys, env/secrets, then pause/delete
the project). Merge this PR to land the evidence and runbook.

## Rollback Plan

Documentation-only change — revert this PR to remove the docs; nothing in the
runtime is altered by merging. To roll back the live cutover itself, restore the
`app` CNAME at Namecheap to the Vercel target
`20a2a769684e17ea.vercel-dns-017.com` — this is fast and safe because the Vercel
project, domain, and env are still intact (not removed here). Optionally unbind
the Azure custom domain afterward.

## Audit Evidence

- PR containing this release record.
- `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_DNS_CUTOVER.md`
  (Azure target, DNS cutover, managed cert, registrar records, Vercel shutdown
  runbook).
- `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_SIGNED_IN_PROD_QA.md`
  (Azure-backed runtime proof + signed-in QA pass).
- `docs/build/supabase-sunset-proof-2026-06-07/README.md` (runtime
  Supabase-removal proof).
- Azure CLI reads against `abarva-lab-sub` / `rg-abarva-controlplane-lab-eastus`
  / `ca-abarva-web-lab-eastus` captured in the cutover doc.

## Known Gaps

- DNS cutover is **done and verified** (operator applied the records; agent
  verified). The `asuid.app` TXT never propagated but was not required —
  CNAME-based validation satisfied managed-certificate issuance.
- Signed-in production QA on `app.abarva.ai` is **done** (operator browser test,
  ~06:42Z+): all six surfaces render, Responsible AI records to Azure Postgres,
  fresh logs clean. Cross-tenant isolation / `ai_egress_audit.provider=anthropic`
  row-level inspection was not separately captured beyond the operator's browser
  pass and clean log filter.
- **Lakeshore is not rich-demo-ready** — Intelligence corpus not seeded, Moves
  empty, Tower no substrate, Admin `0 records`. This is a data-seeding gap, not
  a runtime/safety failure, and is explicitly out of scope here. No sunset-ready
  claim is made.
- Vercel shutdown is **not** performed — no Vercel credentials are present in
  this environment. Exact Vercel action taken: **none** — Vercel project,
  alias/domain, auto-deploys, env, and secrets are all left intact. The runbook
  for removal is in `FINAL_DNS_CUTOVER.md`; the signed-in QA gate is now passed,
  so removal only awaits Vercel access.
- No Azure resources were created or deleted by this agent; the custom-domain
  binding + managed cert were created on the operator's cutover; no secrets
  printed.
