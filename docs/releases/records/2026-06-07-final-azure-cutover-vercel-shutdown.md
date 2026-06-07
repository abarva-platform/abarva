# 2026-06-07-final-azure-cutover-vercel-shutdown — Finalize Azure production DNS cutover and Vercel shutdown evidence

## Release ID

`2026-06-07-final-azure-cutover-vercel-shutdown`

## Status

`candidate`

## Plain-English Summary

This is the final step of moving `app.abarva.ai` off Vercel and onto Azure
Container Apps. We confirmed the Azure target is healthy and Azure-backed,
attempted the custom-domain binding, and captured the exact DNS records needed
to repoint the domain. The actual DNS change could not be made automatically:
`abarva.ai` is hosted at Namecheap and this environment has no registrar
credentials, so the cutover is blocked on a manual operator action at the
registrar. Because the domain has not yet moved and no signed-in QA against the
production hostname was possible, **Vercel has not been touched** — that is the
correct, guardrail-compliant outcome. This change is documentation/evidence
only; it adds no runtime code.

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
  `A8078EFAA2EC5EE0EBD7683E57858C95FFD118925265A1C3059FDB9865982C7A`; binding
  attempt returned `InvalidCustomHostNameValidation` requiring TXT
  `asuid.app.abarva.ai`, as expected (DNS still on Vercel).
- Verified: no Supabase env var or secret on the active container; `DATABASE_URL`
  points to Azure Postgres secret.
- Blocked: DNS cutover (no Namecheap credentials), signed-in production QA (no
  session + domain still on Vercel), Vercel shutdown (no Vercel credentials and
  gated on DNS+QA).

## Rollout Plan

No runtime rollout. Merge to `main` to land the evidence and operator runbook.
The production cutover itself is an out-of-band operator action: (1) add the
TXT `asuid.app` + repoint the `app` record at Namecheap per
`FINAL_DNS_CUTOVER.md`; (2) run `az containerapp hostname add` then
`az containerapp hostname bind --validation-method CNAME` to provision the
managed certificate; (3) run signed-in QA; (4) only then remove Vercel.

## Rollback Plan

Documentation-only change — revert this PR to remove the docs; nothing in the
runtime or DNS is altered by merging. If the operator-side DNS cutover is later
performed and must be rolled back, restore the `app` CNAME to the Vercel target
`20a2a769684e17ea.vercel-dns-017.com` (Vercel project still intact because it is
not removed here).

## Audit Evidence

- PR containing this release record.
- `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_DNS_CUTOVER.md`
  (Azure target, validation error, registrar records, follow-up commands).
- `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_SIGNED_IN_PROD_QA.md`
  (Azure-backed runtime proof + blocked QA checklist).
- `docs/build/supabase-sunset-proof-2026-06-07/README.md` (runtime
  Supabase-removal proof).
- Azure CLI reads against `abarva-lab-sub` / `rg-abarva-controlplane-lab-eastus`
  / `ca-abarva-web-lab-eastus` captured in the cutover doc.

## Known Gaps

- DNS cutover is **not** performed — blocked on manual Namecheap registrar
  action. Exact records are recorded for the operator.
- Signed-in production QA on `app.abarva.ai` is **not** performed — domain still
  resolves to Vercel and no Clerk session is available.
- Vercel shutdown is **not** performed (no Vercel credentials; gated on DNS+QA).
  Exact Vercel action taken: **none** — Vercel project, alias/domain,
  auto-deploys, env, and secrets are all left intact, as required until the
  Azure path is proven healthy.
- No Azure resources were created or deleted; no DNS records changed; no
  secrets printed.
