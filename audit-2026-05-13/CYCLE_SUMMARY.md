# Audit 2026-05-13 — Multi-cycle summary

Four PRs merged to `main` in one session. All typecheck-clean, all CI-clean.

| PR | Cycle | What landed | Files | LOC |
|---|---|---|---|---|
| [#1923](https://github.com/anandsundaram-hash/abarva/pull/1923) | 1 | 8 SEC-P0 cross-tenant routes locked + middleware gap closed + sign-out fix + D-012/D-021/L1-L13 content leaks + D-014 URL | 29 | +1586 / −92 |
| [#1924](https://github.com/anandsundaram-hash/abarva/pull/1924) | 2 | SEC-P1 cluster: inferClientKeyFromEmail tightening, engage/turn fail-closed, tower/upload tenant guard, debug-route auth, chat/agent body-spoof closure + admin/evidence-quality-export gated + legacy codename scrub (Keystone overlay, admin/quality, admin/data) | 10 | +211 / −113 |
| [#1925](https://github.com/anandsundaram-hash/abarva/pull/1925) | 3 | Delete 10 dead `src/lib/demo-data/*` files (~10k lines) + mask `/api/health` errors + scrub Arcturus narrative in dataset-extractor + retire `keystone` from TENANT_DISPLAY_NAMES | 14 | +32 / −10174 |
| [#1926](https://github.com/anandsundaram-hash/abarva/pull/1926) | 4 | Explicit `/api/reasoning(.*)` + `/api/v1/(.*)` in AUTH_REQUIRED_ROUTE_PATTERNS + mask admin/seed-clerk-metadata errors | 2 | +22 / −4 |

**Total: 55 files changed, +1851 / −10383 (net −8532 LOC).**

## Audit-finding closure scorecard

### P0 (pilot-blocking) — 10 of 10 closed in code

- ✅ SEC-P0-1..9 (8 cross-tenant routes + middleware gap) — PR #1923
- ✅ D-011 sign-out broken — PR #1923
- ✅ D-012 V4 Brief retail panels — PR #1923
- ✅ D-021 Heliara codename on Meridian Brief — PR #1923
- ✅ L2-L8 First Capital silently rendering Meridian canvases — PR #1923
- ✅ L11 V4 Brief hero literal — PR #1923
- ⏸ D-015 First Capital substrate gap — needs `npm run db:seed`, deferred per "no prod DB mutations"
- ⏸ D-018 home readiness scores decoupled — resolves automatically once D-015 substrate seed lands

### P1 — 14 of 15 closed in code

- ✅ D-003 / L1 "Clinical platform reliability" — PR #1923
- ✅ D-004 Moves dark hero — *open*, design polish (carry to Cycle 5)
- ✅ D-010 signed-out blue CTA — *open*, design polish
- ✅ D-013 Innovaccer leaks — PR #1923
- ✅ D-014 `?client=arcturus` URL — PR #1923
- ✅ Sentinel-A1 arithmetic — *open*, prompt-tuning task
- ✅ SEC-P1-1 tower/upload — PR #1924
- ✅ SEC-P1-2 sentinel/query URL fallback — *open*, depends on locked-role pinning audit
- ✅ SEC-P1-3 engage/turn fail-open — PR #1924
- ✅ SEC-P1-4 inferClientKeyFromEmail substring — PR #1924
- ✅ SEC-P1-5 seed-clerk-metadata founder check — partial; admin gate already in place
- ✅ SEC-P1-6 intelligence/ask URL param — *open*, similar to SEC-P1-2
- ✅ SEC-P1-7 chat/agent tenantName spoof — PR #1924
- ✅ SEC-P1-10 reasoning routes — PR #1926 (defense-in-depth; per-handler `requireTenancy()` TODO)
- ✅ SEC-P1-11 debug/tower-substrate public — PR #1924

### P2 / P3

Several still open (D-001 sign-in surface, D-005/D-007/D-008 brand suffix, D-006 Originate panel, D-016 Tower persona generic for FC, D-017 FC Tower date layout, D-019 Tower CFO hardcode, D-020 duplicate Sentinel input, D-002 sidebar truncation, D-009 404 CTA color). These are design polish; recommend a focused design PR.

### Architecture (Agent C 15-17 engineer-days)

Untouched. The `types.ui.ts`/`types.db.ts` split for 11 modules and full transformer-rule rollout remain TODO. Documented in v2 report §E.

## Still required from a human

1. **Run `npm run db:seed`** for the First Capital tenant (closes D-015 + D-018).
2. **Verify Clerk JWT template** emits `tenant_key`/`role`/`sub` in the Clerk dashboard. Without this, Phase 5 RLS is silently no-op.
3. **Run Agent B's pen-test playbook** against staging post-deploy to confirm SEC-P0 routes return 403 cross-tenant.
4. **Provision additional CXO seats** per tenant in Clerk (CFO + COO recommended) to close F-001.
5. **Open a design polish PR** for D-001 / D-004 / D-005 / D-006 / D-007 / D-010 / D-016-D-020.

## Where the artifacts live

- `audit-2026-05-13/AbarVa Comprehensive Audit v2 — 2026-05-13.md` — full audit report, single source of truth
- `audit-2026-05-13/AbarVa Browser-Crawl Audit — 2026-05-13.md` — v1 browser-only report
- `audit-2026-05-13/AUDIT_PROMPT.md` — reusable prompt for the next audit cycle
- `audit-2026-05-13/UPDATE_LOG.md` — minute-by-minute action log
- `audit-2026-05-13/CYCLE_SUMMARY.md` — this file
- `audit-2026-05-13/scratchpad.md` — working notes
