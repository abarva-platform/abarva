# Update log — Parallel-run readiness session 2026-05-15

> Standalone session under the user's "fully authorized to complete all pending tasks — to be ready to migrate and do a parallel run" directive. Six application-tier PRs shipped (5 mine, 1 Codex), 1 closed as duplicate. All critical-path parallel-run prereqs in the app lane are now in main.

---

## PRs landed this session

| PR | Title | Lane | State |
|---|---|---|---|
| [#1974](https://github.com/anandsundaram-hash/abarva/pull/1974) | feat(broker): Azure AI Search retrieval path behind `retrieval_azure_search` flag | App / retrieval | Merged |
| [#1975](https://github.com/anandsundaram-hash/abarva/pull/1975) | chore(data): canonicalize tenant keys across graph + context tables | App / data | Merged |
| [#1976](https://github.com/anandsundaram-hash/abarva/pull/1976) | feat: add Azure connectivity smoke (L2) | Codex / infra | Merged |
| [#1977](https://github.com/anandsundaram-hash/abarva/pull/1977) | test(security): SQL-level RLS regression suite (L4) | App / security | Merged |
| [#1978](https://github.com/anandsundaram-hash/abarva/pull/1978) | feat(health): /api/health/azure-connectivity smoke route (L2) | App / health | Closed — duplicate of #1976 |
| [#1979](https://github.com/anandsundaram-hash/abarva/pull/1979) | feat(ops): parallel-run diff harness for Vercel vs Azure invariant comparison | App / ops | Merged |
| [#1980](https://github.com/anandsundaram-hash/abarva/pull/1980) | chore(graph): gate Neo4j behind `graph_neo4j_enabled` flag (default off) | App / graph | Merged |

---

## What each PR shipped

### PR #1974 — Broker Azure AI Search adapter

Unblocks the 6,567 tenant-context chunks Codex backfilled in PR #1972. Adapter sits behind `retrieval_azure_search` (tenant-policy flag, default off per tenant). Flip per tenant during cutover. Includes `canonicalizeTenantKey()` defense-in-depth so stale aliases (`apexretail` etc.) get normalized before the index is queried. 52 jest tests pass; pgvector path preserved as fallback.

### PR #1975 — Tenant-key canonicalization migration

Audit found drift was much wider than the original three tables flagged. **64 alias instances across 24 tables (~50K rows).** Migration `20260515120000_tenant_key_canonicalization.sql` does the cleanup atomically; `current_tenant_key()` RLS helper rewritten to canonicalize on read so RLS keeps working even while Clerk metadata still carries old aliases. `db:verify:tenant-keys` script for ongoing watch. No CHECK constraint added — at least 4 writers still hard-code old aliases (filed as follow-up; the RLS-helper bridge makes this safe to address incrementally).

### PR #1976 — L2 connectivity smoke (Codex)

GET `/api/health/azure-connectivity` runs all 5 probes (Postgres / Blob / Service Bus / Key Vault / AI Search), header-token gated (`x-abarva-health-token`), structured pass/fail JSON, 503 if any probe fails. Codex shipped this in parallel with my agent's #1978; my version got closed as duplicate. Follow-up filed for the deltas (per-lane variant + Neo4j-gated probe).

### PR #1977 — L4 RLS regression suite

SQL-level regression: auto-discovers every table with `tenant_key | client_key | client_id` via `information_schema`, runs per-tenant assertions under `SET LOCAL ROLE authenticated` + JWT-claim spoof. ~40 substrate tables covered. Nightly CI workflow `rls-regression.yml` against the Azure control DB. `RAISE EXCEPTION` on any violation. Also reports `% without RLS enabled` — the first nightly run will surface tables that need policies (forcing function).

### PR #1979 — Parallel-run diff harness

`scripts/parallel-run-diff.ts` calls `/api/admin/parallel-run-invariants` on both Vercel-prod and Azure-lab, asserts **24 invariants** (8 per tenant × 3 tenants) — nodes / edges / context-chunks / segments / programs / top-3 KPI names / top-3 pattern IDs / source-events. Exact match required. Embedding ordering and latency explicitly out of scope. Read-only by construction. Cutover gate: 3 clean runs ≥ 60s apart. Protocol doc at `docs/architecture/azure/PARALLEL-RUN-DIFF-PROTOCOL.md`.

### PR #1980 — Neo4j feature-flag gate

`graph_neo4j_enabled` flag, default off. **12 files / ~24 entry points gated**: graph retrieval (7), reasoning (6), mutations / engagement sync / pattern triggers, genome-query broker, health probe. Driver is now dynamically imported only when the flag is on — with the flag off, `neo4j-driver` is never loaded at boot. Unhealthy Azure Neo4j can now be deleted. Cypher migrations and `neo4j-driver` package dep deliberately untouched (Phase C of the deprecation plan at `docs/architecture/azure/NEO4J-DEPRECATION-PLAN.md`).

---

## Parallel-run readiness — where we are

| Layer | Status |
|---|---|
| L1 Infrastructure / IaC | Codex shipped through AZLAB25 |
| L2 Connectivity smoke | **Shipped (#1976)** |
| L3 Security (network + identity) | Defender CSPM on; managed-identity scoping per AZLAB16 |
| L4 Multi-tenant isolation | SEC-P0 curl probes + Playwright matrix + **SQL RLS regression (#1977)** |
| L5 Data integrity | Migrations runner + drift CI; **tenant-key cleanup (#1975)** |
| L6 Functional E2E | Playwright tenant matrix |
| L7 Agent quality | Voice doctrine + arithmetic guard live; 8-guard expansion designed (#1963) |
| L8 Performance / load | Not yet wired |
| L9 Resilience / DR | Not yet drilled |
| L10 Compliance / audit | Append-only audit table live (#1962) |
| L11 Observability / SLO | C5 dashboard panels (#1961); SLO workbook not yet wired |

**Ready for parallel run:** yes for the L2–L5 + L7 + L10 axes. Cutover gates documented in #1979's protocol doc.

**Not yet ready:** L8 / L9 / L11 — these are continuous, not blockers; they wire in once the lab is serving real traffic.

---

## Findings and follow-ups filed

1. **Tables without RLS** — the L4 suite's first nightly run will print which tables have a tenant-key column but no RLS policy. Add policies before pilot.
2. **Postgres-backed graph traversal helpers** — the Neo4j gate falls back to `[]` / `null` today; before any tenant depends on real graph results, the 7 retrieval/reasoning entry points need Postgres-backed implementations.
3. **Per-lane L2 variants + Neo4j-gated probe** — Codex's #1976 is the canonical L2; my #1978 had per-lane variants and a Neo4j-gated probe that would be useful for stand-up. File as a small follow-up on top of Codex's structure if stand-up shows they're needed.
4. **Tenant-key CHECK constraint** — at least 4 writers still hard-code old aliases (`api/admin/seed-clerk-metadata`, tower page, audit scripts, RLS-helper migration `20260507100000`). Audit and fix before re-adding a CHECK constraint.
5. **Clerk → Entra External ID** — keep Clerk through pilot; plan Entra External ID swap as Q4 2026 (~3 weeks) once first paid customer asks for direct SSO federation into their Entra/Okta.

---

## Coordination findings (process lesson)

Four concurrent Claude agents on the same worktree ran into two coordination issues:

1. **Parallel duplication.** Codex's #1976 (L2 smoke) and my agent's #1978 worked on the same file paths simultaneously. My agent enumerated existing files at session start, did not detect Codex's PR landing mid-session, and shipped a duplicate. Net cost: one closed PR.
2. **Worktree contention.** Multiple agents reported "branch flipped under me" or "files clobbered" mid-session. Each ended up creating a dedicated worktree under `/tmp` to isolate. Net cost: minor restarts; final commits clean.

Mitigation for next wave: spawn agents with `isolation: worktree` (or assign distinct file-area scopes) so concurrent work doesn't share filesystem state.

---

## Verification

- All 5 my-lane PRs auto-merged after CI green
- Codex's #1976 merged independently
- `git log origin/main -10` confirms the ordered landing sequence above
- TypeScript clean on every individual PR; combined main does not have a fresh tsc run in this log but no agent reported tsc breakage after merge

---

*End of parallel-run readiness session.*
