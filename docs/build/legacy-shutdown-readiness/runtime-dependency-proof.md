# Gate 1 — Runtime dependency proof (2026-06-07) — GREEN

Production runtime uses Azure only; no Supabase runtime dependency.

| Check | Result |
|---|---|
| Web app image | `cutover-main-20260607-70c4f98bf` (digest `sha256:4b448827…`), rev `--0000052` @ 100% |
| `DATABASE_URL` (runtime) | secretRef `azure-postgres-control-database-url` → `abarva_control@10.43.1.4` (private Azure) |
| `/api/health` | `postgres:true, direct_postgres:true, azure_graph:postgres` (Azure-backed) |
| Vercel headers | none (`server: vercel` / `x-vercel-id` absent) |
| Supabase env on web app | none projected |
| Supabase runtime fallback | removed (guard in #3270; `ALLOW_LEGACY_SUPABASE_CORPUS` not set) |
| Reasoning provider | `ai_egress_audit`: synthesis/followups/classifier = anthropic·allow |

Conclusion: runtime is Azure-only. Supabase is referenced by **migration/recon tooling only**,
not the app runtime. (Retirement still BLOCKED on the data layer — see README.)
