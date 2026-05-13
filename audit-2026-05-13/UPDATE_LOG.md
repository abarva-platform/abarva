# Audit 2026-05-13 — Update log

Running log of every action taken during the audit-fix cycle. New entries at the top.

---

## 2026-05-13 — Cycle 2 ship-log

**13:14 UTC** — Pushed `claude/xenodochial-mayer-a6483c` to origin. Opened [PR #1923](https://github.com/anandsundaram-hash/abarva/pull/1923) "Audit 2026-05-13: lock cross-tenant routes, fix sign-out, stop content leakage".

**13:15 UTC** — PR #1923 **MERGED** via squash (CI raced through; auto-merge wasn't needed). 4 commits squashed into main. Cycle 1 complete.

**13:20 UTC** — Worktree reset to `origin/main`; new branch `claude/audit-cycle-2` created.

**13:25–14:10 UTC** — Cycle 2 wave 1 (SEC-P1 cluster):
- `src/lib/client-config.ts` — `inferClientKeyFromEmail` tightened: exact-domain-suffix map + anchored local-part patterns for `@abarva.com` only. Removed substring-match-anywhere ("apex" anywhere in email → Apex). Founder backdoor (`thesundaram.com → meridian`) preserved as an explicit-domain entry, documented inline. (SEC-P1-4, SEC-P1-5)
- `src/app/api/engage/[engagementId]/turn/route.ts` — role gate now fails closed. Previously a try/catch around `getCurrentPerson()` swallowed errors and the sponsor check was skipped silently. Now 401 on auth error and 401 when caller is null. (SEC-P1-3)
- `src/app/api/tower/upload/route.ts` — added `requireTenancy()` + `clientId === ctx.clientId` assertion. Previously the route required a signed-in person but allowed cross-tenant uploads via the form `clientId` field. (SEC-P1-1)
- `src/proxy.ts` — removed `/api/debug/tower-substrate(.*)` from `PUBLIC_ROUTE_PATTERNS`. Public access leaked per-tenant initiative counts. Now requires authentication. (SEC-P1-11)
- `src/app/api/chat/agent/route.ts` — resolved authoritative tenant via `getActiveClientRow()` earlier in the handler; `tenantName` now uses the canonical client identity instead of `body.tenantName`. Removed the duplicate `getActiveClientRow()` call at line 390. (SEC-P1-7)

**14:15 UTC** — Cycle 2 wave 2 (admin response-type leaks):
- `src/app/api/admin/evidence-quality-export/route.ts` — added `requireTenancy()` gate. Previous comment claimed "admin layout gates access upstream" but layouts don't apply to API routes; the export was effectively unauthenticated. (Agent C HIGH)

**14:20 UTC** — Cycle 2 wave 3 (legacy codename cleanup):
- `src/lib/intelligence/seed-contradictions.ts` — replaced 4 user-visible "Keystone overlay" references with neutral "under-threshold procurement overlay" / "the under-threshold procurement overlay" phrasing. Doc-file paths in `sourceDocuments` arrays left alone (low impact, deferred to a follow-up).
- `src/app/(maestro)/platform/admin/quality/page.tsx` — removed the entire `keystone` tenant entry and the 4 `QUALITY_ACTIONS` rows keyed to it. `TenantKey` union shrunk to 3.
- `src/app/(maestro)/platform/admin/data/page.tsx` — `arcturus` display label renamed `Arcturus Financial Group` → `First Capital Financial`; `Arcturus_IT_Financial_Model_FY2025.xlsx` filename renamed `First_Capital_IT_Financial_Model_FY2025.xlsx`.

Typecheck clean after wave 1+2+3. Auth tests: 5 failures, all confirmed pre-existing on `origin/main` (Probe 3 / Probe 10 / module-access `keeps Setup limited` / source-access-policy `treats canonical client admin`). Not regressions.

---

## 2026-05-13 — Cycle 2: merging + continuing

**Plan:** push branch, open PR, self-merge (Code-lane authority per memory), then continue through deferred audit items.

Carrying forward from Cycle 1:
- 4 commits on `claude/xenodochial-mayer-a6483c`, 4 ahead of `origin/main`, working tree clean
- All typecheck-clean
- Audit docs (v1 + v2 reports + reusable prompt) in-tree at `audit-2026-05-13/`

Next batch (in priority order):
1. **SEC-P1 cluster** — `inferClientKeyFromEmail` substring/founder backdoor (SEC-P1-4/5), `engage/[id]/turn` fail-open try/catch (SEC-P1-3), `tower/upload` missing tenant check (SEC-P1-1), `/api/reasoning/*` 28 routes unscoped (SEC-P1-10), `/api/debug/tower-substrate` (SEC-P1-11), `/api/v1/sentinel/query` URL-fallback (SEC-P1-2).
2. **Admin route response-type leaks** — Agent C flagged `admin/seed-clerk-metadata`, `admin/invite`, `admin/users/provision` returning raw Clerk IDs / publicMetadata. `evidence-quality-export` auth gap (also a SEC-P0 listed under "no auth" in Agent C).
3. **Legacy codename cleanup** — Keystone overlay in `seed-contradictions.ts`, `Keystone Energy Holdings` in admin/quality page, `Arcturus Financial Group` in admin/data page + xlsx filename, the two `arcturus-*-demo.ts` files.
4. **Sentinel arithmetic reflection guard** (Sentinel-A1 from v1 audit) — only if time.

Deliberately deferred (still):
- D-015 First Capital substrate seed (DB mutation; needs human run)
- Full `types.ui.ts`/`types.db.ts` split for 11 modules (multi-day refactor)
- Clerk JWT template verification (dashboard task)
- Provisioning more demo personas (Clerk dashboard task)
