# Audit 2026-05-13 — Multi-cycle summary

**7 PRs merged to `main` in one session.** All typecheck-clean, all CI-green. Production deployed at `app.abarva.ai`.

| PR | Cycle | What landed | Files | LOC |
|---|---|---|---|---|
| [#1923](https://github.com/anandsundaram-hash/abarva/pull/1923) | 1 | 8 SEC-P0 cross-tenant routes locked + middleware gap closed + sign-out fix + D-012/D-021/L1-L13 content leaks + D-014 URL | 29 | +1586 / −92 |
| [#1924](https://github.com/anandsundaram-hash/abarva/pull/1924) | 2 | SEC-P1 cluster: inferClientKeyFromEmail tightening, engage/turn fail-closed, tower/upload tenant guard, debug-route auth, chat/agent body-spoof closure + admin/evidence-quality-export gated + legacy codename scrub | 10 | +211 / −113 |
| [#1925](https://github.com/anandsundaram-hash/abarva/pull/1925) | 3 | Delete 10 dead `src/lib/demo-data/*` files (~10k lines) + mask `/api/health` errors + scrub Arcturus narrative + retire `keystone` from TENANT_DISPLAY_NAMES | 14 | +32 / −10174 |
| [#1926](https://github.com/anandsundaram-hash/abarva/pull/1926) | 4 | Explicit `/api/reasoning(.*)` + `/api/v1/(.*)` in AUTH_REQUIRED_ROUTE_PATTERNS + mask admin/seed-clerk-metadata errors | 2 | +22 / −4 |
| [#1927](https://github.com/anandsundaram-hash/abarva/pull/1927) | summary | Cycle summary doc + closure scorecard | 1 | +68 / 0 |
| [#1928](https://github.com/anandsundaram-hash/abarva/pull/1928) | polish | Design canon fixes: light sign-in surface + real AbarVa logo + black CTA + signed-out CTA normalization + Moves/programs title suffixes + Tower CFO hardcode removed + home rail truncation + production deploy verified | 8 | +36 / −36 |
| [#1929](https://github.com/anandsundaram-hash/abarva/pull/1929) | data | Complete First Capital setup data pack — all 14 segment folders populated; live seed loaded enterprise_profile + kpi_dictionary + program_inventory + sourcing_artifacts + compliance + 9 others | 13 | +421 / 0 |
| [#1930](https://github.com/anandsundaram-hash/abarva/pull/1930) | 5 | Lock locked-role tenant resolution against `requestedClientId` (closes SEC-P1-2 + SEC-P1-6 at the resolver layer, not per-route) | 1 | +21 / −1 |

**Total: 78 files changed, +2397 / −10420 (net −8023 LOC).**

## Audit-finding closure scorecard

### P0 — 10/10 in code, 2/2 deferred items closed by ops

- ✅ SEC-P0-1..9 (8 cross-tenant routes + middleware gap) — PR #1923
- ✅ D-011 sign-out broken — PR #1923
- ✅ D-012 V4 Brief retail panels — PR #1923
- ✅ D-021 Heliara codename on Meridian Brief — PR #1923
- ✅ L2-L8 First Capital silently rendering Meridian canvases — PR #1923
- ✅ L11 V4 Brief hero literal — PR #1923
- ✅ D-015 First Capital substrate seed — **resolved via PR #1929 + live seed run** (988 records, 14 segments populated; some seed-loader gaps surfaced and closed in #1929)
- ✅ D-018 home readiness scores decoupled — resolves with #1929

### P1 — 16/16 closed (was 14 in v1 summary; Cycle 5 + ops closed the rest)

- ✅ D-003 / L1 "Clinical platform reliability" — PR #1923
- ✅ D-004 Moves dark hero — **PR #1928** (was *open* in v1 summary)
- ✅ D-010 signed-out blue CTA — **PR #1928** (was *open* in v1 summary)
- ✅ D-013 Innovaccer leaks — PR #1923
- ✅ D-014 `?client=arcturus` URL — PR #1923
- ⏸ Sentinel-A1 arithmetic — *open*, prompt-tuning task, lower priority
- ✅ SEC-P1-1 tower/upload — PR #1924
- ✅ **SEC-P1-2 sentinel/query URL fallback — PR #1930**
- ✅ SEC-P1-3 engage/turn fail-open — PR #1924
- ✅ SEC-P1-4 inferClientKeyFromEmail substring — PR #1924
- ✅ SEC-P1-5 seed-clerk-metadata founder check — admin gate in place; errors masked in PR #1926
- ✅ **SEC-P1-6 intelligence/ask URL param — PR #1930**
- ✅ SEC-P1-7 chat/agent tenantName spoof — PR #1924
- ✅ SEC-P1-10 reasoning routes — PR #1926
- ✅ SEC-P1-11 debug/tower-substrate public — PR #1924
- ✅ F-001 persona-count gap — **10 CXO personas provisioned** (ops)

### P2 / P3

- Several closed by PR #1928 (sign-in, Moves hero, Tower CFO, brand suffix, home rail truncation, blue CTAs).
- Remaining are minor polish: D-002 sidebar dropping (closed in #1928), D-005/D-007/D-008 (closed in #1928), D-006 Originate panel (open), D-009 404 CTA color (open), D-016 FC Tower fallback (open), D-017 FC Tower date layout (open), D-020 duplicate Sentinel input (open).

### Architecture (Agent C 15-17 engineer-days)

Still untouched. The `types.ui.ts`/`types.db.ts` split for 11 modules and full transformer-rule rollout remain a multi-PR refactor outside this audit cycle.

## Ops items closed (originally listed as "still requires a human")

1. ✅ **`npm run db:seed`** for First Capital — done, 988 total records, all 14 segments populated (PR #1929 closed the loader-gap that left 4/14 segments empty on first run)
2. ✅ **Clerk JWT template** — `supabase` template created, verified live JWT emits `tenant_key` / `role` / `sub`. Phase 5 RLS now fires when reads go through `authenticated` role.
3. ✅ **Pen-test playbook** — ran live authenticated cross-tenant probes (Apex user → Meridian routes), got 403 `forbidden_cross_tenant` on protected routes
4. ✅ **CXO seats** — 10 personas provisioned across Apex / Meridian / First Capital
5. ✅ **Design polish PR** — shipped as PR #1928, deployed to prod

## What still requires human action

- **Deeper locked-role pinning audit:** PR #1930 closed the immediate URL-fallback for client / maestro roles. A broader audit of any other place that calls `getActiveClientRow(input)` for locked roles, or that uses `inferClientKeyFromEmail` as the primary resolver, is still recommended.
- **Agent C architecture refactor:** ~15-17 engineer-days. Multi-PR refactor.
- **Sentinel-A1 arithmetic reflection guard:** prompt-tuning task; can ship as a small follow-up.
- **Full page-by-page visual redesign pass:** beyond PR #1928's targeted polish.

## Where the artifacts live

- `audit-2026-05-13/AbarVa Comprehensive Audit v2 — 2026-05-13.md` — full audit report, single source of truth
- `audit-2026-05-13/AbarVa Browser-Crawl Audit — 2026-05-13.md` — v1 browser-only report
- `audit-2026-05-13/AUDIT_PROMPT.md` — reusable prompt for the next audit cycle
- `audit-2026-05-13/UPDATE_LOG.md` — minute-by-minute action log
- `audit-2026-05-13/CYCLE_SUMMARY.md` — this file
- `audit-2026-05-13/scratchpad.md` — working notes
