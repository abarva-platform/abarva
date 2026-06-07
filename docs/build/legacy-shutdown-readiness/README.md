# Supabase Retirement Readiness — STATUS: BLOCKED (2026-06-07)

> **Supabase MUST NOT be retired / paused / frozen / deleted.** Retirement is BLOCKED.

## Verdict
Supabase still holds the `enterprise_context_*` fact/context layer that Azure
`abarva_control` lacks. Retirement is unsafe until that layer is migrated to Azure
**and** Gates 4–6 pass **and** Anand explicitly approves deletion.

## Gate status

| Gate | Status | Note |
|---|---|---|
| G1 — Runtime dependency | ✅ GREEN | Runtime is Azure-only; see `runtime-dependency-proof.md` |
| G2 — Read-only reconcile | ⛔ **BLOCKED** | No Supabase **source** connectivity (see below) |
| G3 — Migrate missing data | ⛔ blocked by G2 | `enterprise_context_*` must move Supabase→Azure |
| G4 — Search/index rebuild | ⏳ pending G3 | |
| G5 — Signed-in QA | ⏳ pending | personas in hand |
| G6 — Final backup/restore | ⏳ pending | `job-supa-final` captured table backups earlier (re-verify) |
| G7 — Shutdown decision | ⛔ NOT SAFE | DO NOT RETIRE |

## Blocker — Supabase source connectivity stripped (cause of `ECONNREFUSED`)
`job-supa-recon-eus` fails `ECONNREFUSED` because its Supabase **source** secret was
removed. Verified 2026-06-07:
- `job-supa-recon-eus`, `job-supa-drain-apply-eus`, `job-supa-final-eus` each carry
  **only** `TARGET_DATABASE_URL` → `azure-postgres-control-database-url` (Azure). No
  Supabase source secret on any of them (they read Supabase fine earlier today).
- `.env.local` carries only Azure URLs (`TARGET`/`AZURE_LAB`/`ABARVA_AZURE` → `abarva_control`).
- Key Vault `kv-abarva-lab-001` is private (`PublicNetworkAccess=Disabled`) — not enumerable from outside the VNet.

**Governance note:** Supabase source access was removed from the operator jobs
**before** `enterprise_context_*` parity to Azure was proven — counter to the
do-not-retire posture. The data is not deleted; the access to migrate it out is gone.

## Unblock (one of)
1. Confirm the Supabase secret still exists in `kv-abarva-lab-001`; re-wire it into
   `job-supa-recon-eus` as `SOURCE_DATABASE_URL` (secret-by-reference). Needs an
   identity with KV access (coordinate with Codex / decommission-prep lane).
2. Provide a read-only Supabase connection string via the secrets channel (not chat);
   it will be wired as a job secret for the in-VNet reconcile/migration only — never
   into app runtime, never as a fallback.

Once unblocked: run Gate-2 reconcile (`supabase-azure-reconcile.{json,csv}`,
`missing-data-register.csv`), then Gate-3 migration of `enterprise_context_*`
(idempotent, IDs/tenant-keys/provenance/timestamps preserved), then Gates 4–6.
