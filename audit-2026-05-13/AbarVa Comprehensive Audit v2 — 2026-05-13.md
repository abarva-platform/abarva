# AbarVa Comprehensive Audit v2 — 2026-05-13

> **How this run was done.** Four parallel code-side subagents (seed-leak sweep, RLS / cross-tenant pen-test, broker-boundary + API-contract audit, sign-out bug root cause) ran in the background while a single foreground browser pass added depth to the 2026-05-13 v1 audit — cross-tenant Tower/Source/Moves provisioning checks, a re-run of Meridian's flagship Intelligence Brief, and verification of new Sentinel quality. Three of four subagents have returned and are incorporated; the sign-out root-cause agent is still running and will be appended.

---

## A. Executive verdict — one page

**This audit changes the verdict from the v1 run. The headline blocker is no longer demoware — it is security.**

| Audience | v1 verdict (2026-05-13 morning) | v2 verdict (now) |
|---|---|---|
| **Any first-customer pilot** | Demo-ready with content fixes | **NOT pilot-ready.** Eight unauthenticated cross-tenant attack paths (read AND write AND destructive) must be closed before a real customer logs in. |
| Prat (Apex story) | Yes after D-012 fix | **Yes** — Apex is fully provisioned and the strongest tenant. Same content fixes needed. Security holes are not visible in a demo, but they are visible to anyone you let log in. |
| Vipin / Sriram (cross-portfolio) | Yes with caveats | **No until D-021 (Heliara codename on Meridian) and the Meridian-substrate-defaults are fixed** — First Capital silently shows Meridian content on 7 Intelligence canvases. |
| Kiran (Meridian story) | No until D-012 | **No until D-021** — Meridian's flagship Intelligence Brief renders "Three bets above the line for **Heliara Health** this quarter" three times in the user-facing copy. |
| Sharad (First Capital story) | No until D-012 + D-013 | **No** — three of five primary surfaces are empty-state for First Capital (Tower, Source, Moves). Plus inherited Meridian content on 7 Intelligence canvases per Agent A. |

**Top blockers, ranked:**
1. **SECURITY-P0 cluster (8 routes)** — cross-tenant read/write/destructive paths reachable by any signed-in user, several by anonymous callers. Pilot-blocking. (Agent B.)
2. **D-021 P0 "Heliara Health" tenant-name leak** on Meridian's Intelligence Brief. Rendered 3× in user-facing copy on the headline surface.
3. **D-015 P0 First Capital substrate gap** — Tower, Source, and Strategic Moves all render empty-state on the live demo URL despite `/home` claiming 11 programs, 64% Tower readiness, etc.
4. **L2-L8 P0 First Capital silently rendering Meridian fixtures** across 7 Intelligence canvases (Today / By-Function / Patterns / Vendors / Strategy / Peer-Activity / Sessions). One default-prop pattern, seven surfaces. (Agent A.)
5. **D-012 P0** retail-content `ValueAtStakePanel` + `OpenTensionsPanel` — confirmed at `src/components/intelligence-v4/IntelligenceBrief.tsx:702-815`, hard-coded literals, zero props. Agent A pinned the exact location.

---

## B. Top-10 fix list (re-ranked for v2)

| # | Fix | Sev | Area | Sketch |
|---|---|---|---|---|
| 1 | Add `requireTenancy()` to all 8 P0 cross-tenant routes and assert `body.clientId === ctx.clientId` | P0 / pilot-blocker | `/api/tower/seed-demo`, `/api/data/upload`, `/api/setup/initiatives`, `/api/admin/upload-dataset`, `/api/turn/[turnId]/trace`, `/api/intelligence/query` | One helper applied per route; ~1 engineer-day total |
| 2 | Add `'/api/admin(.*)'` to `AUTH_REQUIRED_ROUTE_PATTERNS` in `src/proxy.ts:48-71` and add per-handler `requireAdminAuth()` | P0 | Middleware | Single-line middleware update + audit of all `/api/admin/*` handlers |
| 3 | Fix the V4 Brief `ValueAtStakePanel` + `OpenTensionsPanel` to read tenant-keyed data | P0 | `src/components/intelligence-v4/IntelligenceBrief.tsx:702-815` | Add `data: BriefData` prop, drop the hard-coded retail literal arrays, ship per-tenant fixtures |
| 4 | Remove all "Heliara Health" tenant-name renders | P0 | Meridian Intelligence Brief copy source | Confirm Meridian seed/copy and replace "Heliara" with "Meridian" everywhere it's still wired |
| 5 | Replace `= MERIDIAN_*` default props on the 7 V3 Intelligence canvases | P0 | `IntelligenceV3Page.tsx` + 7 canvas components | Centralize via `getTenantFixtures(clientKey)`; remove Meridian defaults; force `undefined` to mean "missing", not "use Meridian" |
| 6 | Provision First Capital substrate for Tower / Source / Moves | P0 | Seed scripts | Without this, no First Capital demo of the three operating surfaces is possible |
| 7 | Wire Sign-out button to `Clerk.signOut()` + redirect | P1 | App shell | Awaiting Agent D root cause; trivial fix once located |
| 8 | Replace `inferClientKeyFromEmail` substring matching + founder backdoor | P1 | `src/lib/client-config.ts:113-146` | Use exact Clerk metadata pinning for locked roles; remove `+apex@` / `firstcapital` substring fallbacks; remove `thesundaram.com → meridian` hardcode or feature-flag it |
| 9 | Retire `/api/intelligence/query` LLM→Cypher route (or scope it) | P1 | `/api/intelligence/query` | Returns raw graph node properties to client; regex-only write gate. If keeping, add tenant-bound Cypher template + property allowlist |
| 10 | Confirm Clerk JWT template emits `tenant_key`, `role`, `sub` for the `authenticated` role | P1 | Clerk dashboard + JWT template | Phase 5 RLS is currently a no-op because all server code uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS. If the JWT template isn't deployed, RLS is silently doing nothing |

---

## C. Security findings (Agent B, full P0/P1 list)

### C.1 P0 — confirmed cross-tenant attack paths

| ID | Route | Defect | Why it leaks |
|---|---|---|---|
| **SEC-P0-1** | `POST /api/tower/seed-demo` (`src/app/api/tower/seed-demo/route.ts:7-30`) | No auth check; trusts `body.clientId`; calls `seedDemoData({ clientId, … })` against any tenant. | Meridian user can seed/overwrite Apex's tower data. |
| **SEC-P0-2** | `DELETE /api/tower/seed-demo` (lines 32-42) | Takes `clientId` from URL, calls `removeDemoData(clientId)`. No auth, no tenant match. | **Destructive** — any signed-in user can delete another tenant's tower data. |
| **SEC-P0-3** | `POST /api/data/upload` (`src/app/api/data/upload/route.ts:9-37`) | No auth; trusts `form.get('clientId')`; writes into Pinecone/Supabase scoped by that clientId. | Any caller can write engagement docs into any tenant. |
| **SEC-P0-4** | `POST /api/setup/initiatives` (`src/app/api/setup/initiatives/route.ts:84-191`) | No auth/tenancy check. Accepts `tenantKey` from URL/body and writes into `private_${tenantKey}.setup_ai_initiatives`. | Cross-tenant write into private schema. |
| **SEC-P0-5** | `GET /api/setup/initiatives` (lines 25-82) | Same — no auth; trusts `tenantKey` query param to read another tenant's initiatives (including financial fields when `financialVisibility=1`). | Cross-tenant read of AI initiative roadmap + financials. |
| **SEC-P0-6** | `POST /api/admin/upload-dataset` (`src/app/api/admin/upload-dataset/route.ts:9-60`) | No `auth()` call. `/api/admin/*` is NOT in `AUTH_REQUIRED_ROUTE_PATTERNS` (only the page route `/admin(.*)` is). Middleware fall-through requires only a signed-in user, not admin role. | Any client user can write tenant_metric datasets into another tenant. |
| **SEC-P0-7** | `GET /api/turn/[turnId]/trace` (`src/app/api/turn/[turnId]/trace/route.ts:7-20`) | No auth, no tenant filter. `SELECT … FROM turn_traces WHERE turn_id = $1`. | Any caller with a turn UUID can read another tenant's complete agent reasoning trace. UUIDs are guessable in logs / shared screenshots. |
| **SEC-P0-8** | `POST /api/intelligence/query` (`src/app/api/intelligence/query/route.ts:27-110`) | No auth. Direct Neo4j Cypher execution via `getGraphDriver().session().run(translated.cypher)` after LLM NL→Cypher translation. Write-ops blocked by regex only; reads unrestricted across all tenants in the graph. Also returns raw node `properties` blobs. | Cross-tenant graph read of every client's enterprise context, executive profiles, programs, relationships. Triple violation: broker-boundary + transformer rule + cross-tenant. |
| **SEC-P0-9** | `/api/admin/*` middleware gap (`src/proxy.ts:47-74`) | `AUTH_REQUIRED_ROUTE_PATTERNS` contains `'/admin(.*)'` (page route) but NOT `'/api/admin(.*)'`. | Every `/api/admin/*` route that doesn't self-check role is reachable by every signed-in client user. |

**Recommended pen-test smoke** (Agent B's exact list): use Apex CIO demo creds, run authenticated curl against Meridian-scoped clientIds for each P0 route. Expect all to succeed; lock them via `requireTenancy()` + explicit `body.clientId === ctx.clientId`.

### C.2 P1 — needs closer look

| ID | Route | Concern |
|---|---|---|
| SEC-P1-1 | `POST /api/tower/upload` | Requires `getCurrentPerson()` but never asserts `form.get('clientId')` matches the caller's tenant. |
| SEC-P1-2 | `POST /api/v1/sentinel/query` | Locked-role users with NO pinned key fall through to `requestedClientId`. |
| SEC-P1-3 | `POST /api/engage/[engagementId]/turn` | Sponsor role gate wrapped in try/catch with bypass-on-error (line 84). Fail-open. |
| SEC-P1-4 | `inferClientKeyFromEmail` | Substring matching: `+apex@` anywhere → Apex; `firstcapital` anywhere → First Capital; `thesundaram.com` → Meridian (founder backdoor). Spoofable display names. |
| SEC-P1-5 | `seed-clerk-metadata` | Hardcoded `isFounder` email check (`anand.sundaram@thesundaram.com`) grants admin-equivalent privileges. |
| SEC-P1-6 | `/api/intelligence/ask` | URL param `?client=…` honored via `getActiveClientRow(requestedClient)` fallback when Clerk metadata absent. |
| SEC-P1-7 | `/api/chat/agent:289` | `canonicalClientDisplayName({ name: body.tenantName }) ?? "Apex Retail Group"` — body-controlled tenant name can flip chat context. |
| SEC-P1-8 | `/api/v1/atlas/{chat,ask}` | Admin/investor flows bypass tenant pin and rely on cookie check. Audit cross-tenant Atlas access. |
| SEC-P1-10 | All `/api/reasoning/*` routes | In-memory demo stubs without auth. Will silently start crossing tenants when persisted. Add `requireTenancy()` now. |
| SEC-P1-11 | `/api/debug/{vip,tower-substrate}` | `tower-substrate` is in `PUBLIC_ROUTE_PATTERNS`. Returns per-tenant initiative counts publicly. |

### C.3 RLS coverage summary

- App uses `SUPABASE_SERVICE_ROLE_KEY` everywhere (`src/lib/supabase-server.ts:7`). Service role bypasses RLS entirely.
- Per migration `016_rls_service_role_only.sql`: "all client-side DB access is blocked; all server-side access uses SUPABASE_SERVICE_ROLE_KEY".
- Phase 5 RLS (`20260507*`) added per-user policies on top, **in anticipation of future direct-Supabase clients**.
- **RLS is currently defense-in-depth only.** What protects production today is per-route `requireTenancy()` / `checkTenantAccessByKey` calls. Roughly **50 of 152 API routes don't call any standard auth helper**.
- Clerk JWT template named `supabase` must emit `tenant_key`, `role`, `sub` for RLS to fire when reads ever happen through `authenticated` role. **Verify this is actually deployed in Clerk** — if not, the Phase 5 RLS work is silently no-op.

### C.4 Tenant-key resolution fragmentation

**10 distinct resolution paths** found:
1. `resolveSessionRole` + `resolvePinnedSessionClientKey` (`src/lib/auth/access-routing.ts:60`)
2. `getActiveClientKey` / `getActiveClientRow` (`src/lib/active-client.ts:62`)
3. `getCurrentUser` (`src/lib/auth/current-user.ts`)
4. `requireTenancy` (`src/lib/auth/tenancy.ts`)
5. `requireAtlasTenancy` (`src/app/api/v1/atlas/_auth.ts`)
6. `assertTenantAccess` / `checkTenantAccess` / `checkTenantAccessByKey` (`src/lib/auth/tenant-access.ts`)
7. `tenantKeyForProgramCode` (`src/lib/auth/tenant-access.ts:195`)
8. `requireAdminAuth` / `requireAdminDecide`
9. `inferClientKeyFromEmail` (substring matching + founder backdoor)
10. Direct `getActiveClientRow(requestedClientId)` from URL/body input.

This is the surface area where chained bugs hide.

---

## D. Content / seed leaks (Agent A, full list)

### D.1 P0 — confirmed and located

- **D-012**: `ValueAtStakePanel` + `OpenTensionsPanel` are hard-coded retail literals at `src/components/intelligence-v4/IntelligenceBrief.tsx:702-815`. Both functions take **zero props** and are unconditionally rendered. (This is the v4 component; the v3 panels may also be affected.)

- **D-021** (new this run): "Heliara Health" tenant name rendered 3× in user-facing copy on Meridian's `/intelligence` Brief:
  - Agent breadcrumb: "Intelligence Conductor · **Heliara Health** · The Brief"
  - Opener: "I composed this brief for **Heliara Health** from the corpus…"
  - H1: "Three bets above the line for **Heliara Health** this quarter."
  - Source: a Meridian display-name was swapped to "Heliara Health" somewhere in the brief composer; not yet traced.

### D.2 P0 — Meridian-fixture defaults across 7 First Capital canvases (Agent A finding L2-L8)

Every non-Brief Intelligence canvas in v3 defaults to `MERIDIAN_*` fixtures and is only overridden when `isApexBound`. Result: **First Capital silently renders Meridian fixtures on:**

| Canvas | Default prop | Default value | File |
|---|---|---|---|
| Vendors | `spend` | `MERIDIAN_VENDOR_SPEND` (Epic, Innovaccer, Abridge, Cohere) | `VendorsCxoCanvas.tsx:43` |
| ByFunction | `rows` | `MERIDIAN_BY_FN_ROWS` | `ByFunctionCxoCanvas.tsx:63` |
| MyStrategy | bullets | `MERIDIAN_STRATEGY_BULLETS` | `MyStrategyCxoCanvas.tsx:14` |
| Patterns | patterns | `MERIDIAN_PATTERNS` (P-HC-005, P-HC-007…) | `PatternsCxoCanvas.tsx:34` |
| PeerActivity | rows | `MERIDIAN_PEER_ROWS` | `PeerActivityCxoCanvas.tsx:25` |
| Sessions | sessions | `MERIDIAN_SESSIONS` | `SessionsCxoCanvas.tsx:26` |
| Today | items | `MERIDIAN_TODAY_ITEMS` | `TodayCxoCanvas.tsx:45` |

`IntelligenceV3Page.tsx:237-261` only passes overrides when `isApexBound`. First Capital → no override → Meridian content displayed.

### D.3 P0 / P1 individual content leaks

| ID | Tenant | Leak | File:line |
|---|---|---|---|
| L1 | Apex Retail Enterprise Context | Card title "Clinical platform reliability" | `src/lib/enterprise-context/intelligence-read-model.ts:174-183` |
| L9 | First Capital `/home` Module 02 | "Innovaccer renewal in 8 months. Vendor substrate informed." | `src/components/home/tenant-home-fixtures.ts:548` |
| L10 | First Capital `/home` Action 02 | "Open Innovaccer renewal scan (8 months out)" | `src/components/home/tenant-home-fixtures.ts:597-602` |
| L11 | Any non-retail tenant | V4 Brief hero is hard-coded retail literal | `src/components/intelligence-v4/IntelligenceBrief.tsx:102-104` |
| L12 | First Capital | Demo opener mentions "Innovaccer renewal in 8 months" | `src/components/intelligence-v3/demo-data.ts:275` |
| L13 | First Capital | Today item "Innovaccer renewal" with rationale "Innovaccer pattern" | `src/components/intelligence-v3/demo-data.ts:201, :268` |

### D.4 Legacy codename survivors (156 non-test references)

Per memory, Heliara / Keystone / Brindlemark / Arcturus should be gone. Per Agent A, **156 non-test references survive** (Agent B clarifies that `arcturus` and `brindlemark` are partly intentional canonical fallbacks; `keystone` and `heliara` are not).

Highlights:

| Codename | Where | Context |
|---|---|---|
| Heliara | (none in `src/lib`) | But **rendered 3× to user-facing copy** on Meridian Brief — D-021 |
| Keystone | `src/app/(maestro)/platform/admin/quality/page.tsx:120-121, :272` | "Keystone Energy Holdings" rendered as tenant in admin quality view |
| Keystone | `src/lib/admin/setup-acts-registry.ts:1177` | `keystone: 'Keystone Energy Holdings'` display-name wiring |
| Keystone | `src/lib/intelligence/seed-contradictions.ts:193, :195, :209, :313, :329` | Active intelligence content references "Keystone overlay" |
| Keystone | `src/scripts/seed/smoke-executive-profiles.ts:53` | "Composite Keystone maestro greets Jonathan" |
| Keystone | `supabase/migrations/20260507100000_rls_role_helpers.sql:60` | Benign migration update; no active code path uses keystone for routing |
| Arcturus | `src/app/(maestro)/platform/admin/data/page.tsx:105, :114` | "Arcturus Financial Group" tenant card + `Arcturus_IT_Financial_Model_FY2025.xlsx` filename |
| Arcturus | `src/lib/dataset-extractor.ts:124,361,548,572,606,724` | Live narrative text surfacing in dataset analysis output |
| Arcturus | `src/lib/demo-data/arcturus-tech-demo.ts`, `arcturus-full-demo.ts` | Two whole demo files keyed on Arcturus |
| Arcturus | `src/lib/admin/setup-acts-registry.ts:1034, :1368, :1405` | Tenant fallback fixtures named Arcturus |
| Arcturus | `src/lib/tower/vendor-portfolio.ts:111` | Adapter narrative: "Seeded composite vendor inventory for Arcturus Financial / First Capital." |
| Arcturus | Per Agent B | `arcturus` IS the canonical `ClientKey` for First Capital (not legacy). User-facing slug is `first-capital`. This is per-design but confusing; source of `?client=arcturus` URL leak found in v1 browser audit. |
| Brindlemark | `src/lib/client-config.ts:39` | Listed in `CLIENT_KEY_TO_DB_NAME[arcturus]` as a historical name candidate. Defensive fallback, not a leak path. |
| Brindlemark | `src/scripts/enterprise-context/load-enterprise-context.ts:60`, `chunk-enterprise-context.ts:63`; `src/components/intelligence-v3/IntelligenceV3Page.tsx:126` | Live alias used in tenant-name matching. |

---

## E. Architecture audit (Agent C)

### E.1 Broker-boundary violations

| File:line | Direct import | Severity |
|---|---|---|
| `src/app/api/intelligence/query/route.ts:2,5,78-81` | `neo4j-driver` + `getGraphDriver()` + raw Cypher | **HIGH** (this is also SEC-P0-8) |
| `src/app/api/health/route.ts:2,21` | `getGraphDriver().session()` | LOW (liveness only) |
| `src/app/api/engagements/create/turn/route.ts:10-11` | `@/lib/graph/engagement-sync`, `@/lib/graph/mutations` | MEDIUM (graph write from route) |
| `src/app/api/identity/turn/route.ts:9` | `syncPersonToGraph` from `@/lib/graph/mutations` | MEDIUM |
| `src/app/api/engage/[engagementId]/turn/route.ts:9-13,41` | Multiple direct graph-retrieval imports + `assembleCrossClientContext` | **HIGH** (cross-client reads must flow through broker) |
| `src/app/api/admin/upload-dataset/route.ts:2,63` | Inline `createClient(supabaseUrl, supabaseKey)` | MEDIUM |
| `src/components/intelligence-v3/cxo-fixtures.ts:9`, `demo-data.ts:5` | Components own "tenant data" shape | MEDIUM |

**Good news:** No direct `EnterpriseDataRoom` imports in `src/app/**` or `src/components/**`. No direct Pinecone imports in app-tier. Vector access correctly routed through `lib/`.

### E.2 API contract gaps (transformer rule)

**Only `lib/programs` has done the post-demo `types.ui.ts` / `types.db.ts` split.** Every other domain (`source`, `atlas`, `intelligence/db/*`, `knowledge`, `reasoning`, `sentinel`, `tower`) still ships a single `types.ts` mixing UI contracts and DB types.

**Untyped JSON responses leaking internal fields:**

| Route | Leak |
|---|---|
| `src/app/api/intelligence/query/route.ts:89-95` | Raw Cypher string + unwrapped Neo4j node `properties` blob to client. Property allowlist absent. |
| `src/app/api/admin/seed-clerk-metadata/route.ts:190` | Clerk `user.id` + Supabase `person.id` UUIDs |
| `src/app/api/admin/invite/route.ts:99` | Raw `inv.publicMetadata` passthrough |
| `src/app/api/admin/users/provision/route.ts:283-296` | `personId`, `assignments[].detail` (can contain raw Supabase error messages) |
| `src/app/api/health/route.ts:14-29` | Postgres/Neo4j `error.message` strings — may include connection strings or schema names |
| `src/app/api/v1/source/events/route.ts:128` | Raw `event` row from `createSourcingEvent` |
| `src/app/api/admin/evidence-quality-export/route.ts` | "No auth on this route — admin layout gates upstream" — but admin layout never runs for API routes. **Unauthenticated full evidence export.** (This is also SEC-P0-related.) |

**Estimated effort to bring all sampled routes to SAFE:** ~15-17 engineer-days. Plus follow-on for 28 unsampled `/api/reasoning/*` routes.

---

## F. Browser-side findings (this run)

### F.1 Tenant provisioning matrix

Verified by direct navigation across all 5 primary surfaces × 3 tenants.

| Surface | Apex Retail | Meridian Health | First Capital |
|---|---|---|---|
| `/home` | ✅ populated | ✅ populated | ⚠️ populated but readiness scores decoupled from actual substrate |
| `/intelligence` | ✅ populated | ✅ populated (v4 Brief, Heliara name leak) | ⚠️ populated but 7 canvases default to Meridian fixtures |
| `/strategic-moves` | ✅ 8 moves, $100M at stake | ✅ 8 moves, $157M at stake | ❌ "NO MOVES YET — Strategic Moves appear here once a signal becomes an executive program" |
| `/source` | ✅ 7 events, $90M | ✅ 5 events, $75M | ❌ "Create your first sourcing event" empty-state |
| `/tower` | ✅ ROI 1.3×, $5.4M risk, 3 pressures | ✅ ROI 1.1×, $5.4M risk, 3 pressures, Epic Systems 38-day renewal | ❌ "no substrate", "No tenant pressure signals were derived from the DB" |

**Apex 5/5 · Meridian 5/5 · First Capital 2/5.**

But First Capital's `/home` claims **Tower 64% / Source 70% / Moves 65% / Intelligence 72% ready** and "11 programs observed · NIM compression top of mind". Those numbers don't match the actual substrate state. **D-018 P0** — home readiness scores are decoupled from substrate.

### F.2 Sentinel quality (live test sample)

**Carlos Rivera (Apex CIO) — 2 questions tested in v1 run:**
- Q2 (vendors + renewals): tenant-grounded with $ figures (Salesforce $14.6M, AWS $13.6M, Adobe $8.8M, $217.8M total exposure) but arithmetic self-correction is wrong (re-ranks Adobe $8.8M above AWS $13.6M as "true rank"). **B grade.**
- Q24 (CFO consultant-speak rewrite): A grade. Named real Apex org-chart people (Robert, Jennifer, Carlos, Lynne, Margaret), tied to F200 pattern, offered cross-surface handoff to Moves.

**Anita Krishnamurthy (Meridian CDIO) — this run:**
- Brief auto-composed for the persona. Headline says **"Three bets above the line for Heliara Health this quarter"** — D-021. Decision cards properly Meridian: Population Health AI for ACOs (87/100, $8-$24M, P-HC-014), Ambient AI Clinical Documentation expansion (82/100 in-portfolio MH-01, P-HC-005, 141% of committed), Sepsis Early Warning (74/100, P-HC-024). Pattern reference accurate. Below-the-line 7 evaluating bets (Epic AI Revenue Cycle MH-04, Claims Denial Prediction, Prior Auth Automation, Patient Access conversational, SAP Joule for Finance, Clinical Risk Stratification, Imaging AI radiology workflow). **Move cascade pattern: "If MH-04 succeeds · 3 follow-on bets become natural in 12-18 months."** Strong. **A grade content marred by Heliara naming.**

**Sentinel quality grade across both personas: B+ content, with arithmetic and naming defects pulling individual answers down.**

### F.3 Design + UX deltas vs v1

- **Sign-in surface may have been repainted between v1 and v2** — saw cream/light background + muted grey "Sign in" button on one re-load. Worth re-verifying D-001 against the current deploy. (v1 captured a dark navy + solid-blue surface.)
- **V4 Brief layout** (Meridian) drops the Enterprise Context tab in narrower viewports — possibly responsive collapse, possibly removal. New "Above the line · Top 3 this quarter" framing with binding patterns + measured/commit ratios + decision-action chips (Originate now / Approve scale-up / Wait · MH-07). This is better than v3 content-wise.
- **Two "Ask Sentinel Intel" inputs** present on Meridian Brief (D-020 P3) — possible duplicate input element.
- **Tower persona is hard-coded to CFO** regardless of logged-in user (D-019 P2). On Meridian Tower, shown as "DAVID PARK · CFO · MERIDIAN HEALTH · 07:29 AM PT" even with Anita Krishnamurthy CDIO logged in. On Apex Tower, "M. CASTILLO · CFO · APEX RETAIL · 05:57 AM PT" regardless of logged-in CIO.

---

## G. Full P0/P1/P2/P3 defect log (deduped, v2)

### P0 — pilot-blocking / demo-killing
| ID | Surface | Defect | Fix sketch |
|---|---|---|---|
| **SEC-P0-1..9** | 8 API routes + middleware | Cross-tenant read/write/destructive paths reachable by signed-in or anonymous users | Add `requireTenancy()` + middleware fix |
| **D-012** | `/intelligence` Brief Value/Tensions panels | Hard-coded retail content for all tenants at `IntelligenceBrief.tsx:702-815` | Per-tenant fixtures + props |
| **D-021** | Meridian `/intelligence` Brief | "Heliara Health" rendered 3× as tenant name in user-facing copy | Replace Heliara → Meridian everywhere in brief composer |
| **D-015** | First Capital `/tower`, `/source`, `/moves` | All three empty-state; substrate not seeded | Seed scripts for First Capital |
| **D-018** | First Capital `/home` | Readiness scores decoupled from actual substrate state | Derive from substrate, not fixtures |
| **L2-L8** | First Capital Intelligence canvases | 7 canvases default to `MERIDIAN_*` fixtures; First Capital silently shows Meridian content | `getTenantFixtures(clientKey)` helper; force-undefined defaults |
| **L11** | V4 Brief hero | Hero literal hard-coded retail at `IntelligenceBrief.tsx:102-104` | Move to per-tenant data payload |
| **A-EVQ** | `/api/admin/evidence-quality-export` | Comment claims auth via "layout gate" — layouts don't run for API routes. Anonymous full export | Add `requireAdminAuth()` |
| **A-UD** | `/api/admin/upload-dataset` | No auth check; takes `clientId` from form data; writes Supabase + Pinecone | Add `requireAdminAuth()` + tenant match |

### P1
| ID | Surface | Defect | Fix sketch |
|---|---|---|---|
| D-001 | `/sign-in` | Dark navy bg + solid-blue CTA off-canon — but may have been fixed mid-audit; **re-verify** | Rebuild on canon if still broken |
| D-003 / L1 | Apex Enterprise Context | "Clinical platform reliability" card title — healthcare term in retail tenant | Tenant-aware card titles |
| D-004 | `/strategic-moves` | Hero strip is black-on-white island on cream page | Bring hero into canon |
| D-010 | `/signed-out` | Hero CTA "Enter client workspace" is solid blue | Black/ghost per canon |
| D-011 | App shell | Sign-out button is a no-op; only `Clerk.signOut()` works | **Awaiting Agent D root cause** |
| D-013 / L9 / L10 / L12 / L13 | First Capital `/home` + Intelligence demo | Innovaccer (healthcare vendor) referenced in 4 First Capital surfaces | Replace with banking vendor (Finxact / FIS HORIZON) |
| D-014 | First Capital URL | `?client=arcturus` legacy codename in URL params | Canonical key `first-capital`; though Agent B notes `arcturus` is per-design canonical ClientKey internally — at minimum, strip from URL |
| Sentinel-A1 | Sentinel Intel | Arithmetic self-correction wrong — re-ranks $8.8M Adobe above $13.6M AWS as "true rank" | Reflection check before answer commits |
| SEC-P1-1..11 | Multiple routes (see C.2) | Mixed-severity tenant-scope concerns; tenant-key resolution fragmentation; founder backdoor | Per-route hardening |

### P2
| ID | Surface | Defect |
|---|---|---|
| C-001 | Sign-in / app header | "AI Success Platform" tagline alignment with positioning |
| D-005 | `/strategic-moves` title | "\| AbarVa Nexus" suffix differs from "· AbarVa" / "\| AbarVa" elsewhere |
| D-006 | `/strategic-moves/new` | Nexus chat panel is dark navy on cream — may be intentional brand treatment |
| D-007 | `/source` title | "Source · AbarVa" — third brand-suffix variant |
| D-016 | First Capital Tower header | Persona display falls back to generic "PORTFOLIO EXECUTIVE" |
| D-019 | Tower (all tenants) | Persona is hard-coded to CFO regardless of logged-in user |

### P3
| ID | Surface | Defect |
|---|---|---|
| D-002 | Home left rail | "Production Readin…" label truncation |
| D-008 | Top nav | Tenant indicator says "Apex Retail" / "Meridian Health" / "First Capital" — inconsistent with hero ("Apex Retail Group", etc.) |
| D-009 | 404 CTA | "GO TO HOME" button is dark-navy filled, technically not pure-canon black |
| D-017 | First Capital Tower header | Date layout broken: "Wednesday, [newline] May 13" with cut-off year |
| D-020 | Meridian Intelligence Brief | Two "Ask Sentinel Intel" input fields present (possible duplicate) |

### Findings (not defects)
| ID | Note |
|---|---|
| F-001 | Demo personas: Apex 2 / Meridian 2 / First Capital 1. Audit prompt assumed 3 per tenant. Provision CFO + COO seats per tenant for the multi-CXO demo story. |
| F-002 | `/admin/*` sub-routes mostly 404 for client CIO persona. Admin lives in home left rail. |
| F-003 | Programs and Strategic Moves are unified; `/programs` redirects to `/strategic-moves`. |
| F-004 | RLS is currently defense-in-depth only — all server code uses `SUPABASE_SERVICE_ROLE_KEY`. Phase 5 per-user RLS won't fire until direct-Supabase clients are added AND the Clerk JWT template emits `tenant_key`/`role`/`sub`. Verify JWT template deployment in Clerk dashboard. |

---

## H. Cross-tenant patterns

Five distinct defect classes affecting more than one tenant — fix the pattern, not the instance:

1. **Hard-coded tenant content in shared components** (D-012 V4 panels, L11 V4 hero). Pattern: function takes no props, returns retail literals, unconditionally rendered. Fix once, three tenants benefit.

2. **`= MERIDIAN_*` default prop pattern** (L2-L8). Seven Intelligence v3 canvases. Pattern: `function CxoCanvas({ rows = MERIDIAN_X })`. First Capital → no override → Meridian content. Fix the pattern (force `undefined` to mean missing) and 7 canvases benefit.

3. **Tenant-name codename leaks** (D-021 Heliara on Meridian Brief; D-003/L1 Clinical on Apex). Same shape: backend display-name string not specialized per tenant.

4. **First Capital substrate gap** (D-015 Tower/Source/Moves + D-018 home decoupled scores). One missing seed pack causes 3+ broken surfaces.

5. **Cross-tenant API routes** (SEC-P0-1..9). Pattern: route accepts `clientId`/`tenantKey` from request input, no server-side check against caller's session. Fix one helper (`requireTenancy() + assert body.clientId === ctx.clientId`), apply 8+ places.

---

## I. Suggested next moves

### 48 hours — pilot-readiness
1. Fix the 8 SEC-P0 routes (`requireTenancy()` + assertion). ~1 engineer-day.
2. Fix the `/api/admin/*` middleware pattern (`src/proxy.ts:48-71`). ~1 hour.
3. Run Agent B's pen-test curl playbook against staging to confirm closure.
4. Fix D-021 Heliara codename on Meridian Brief.
5. Fix the V4 panels (D-012) and V3 default-prop pattern (L2-L8). One PR with `getTenantFixtures` helper.

### 7 days — demo-readiness for all 3 tenants
6. Seed First Capital substrate for Tower / Source / Moves.
7. Wire D-011 sign-out (await Agent D for the one-line fix).
8. Fix Innovaccer leaks on First Capital (L9, L10, L12, L13).
9. Replace `inferClientKeyFromEmail` substring matching + founder backdoor (SEC-P1-4, SEC-P1-5).
10. Confirm Clerk JWT template emits `tenant_key`/`role`/`sub` (F-004).
11. Re-paint or re-verify the sign-in surface design.

### 30 days — quality plumbing
12. `types.ui.ts` / `types.db.ts` split for `intelligence`, `atlas`, `source`, `reasoning`. ~9 engineer-days.
13. Add typed response interfaces to the 8 admin routes returning inline JSON.
14. Retire or scope `/api/intelligence/query` (LLM→Cypher). Recommend retiring; if kept, tenant-bound template + property allowlist.
15. Migrate graph mutations out of route handlers (engagements/create/turn, engage/[id]/turn, identity/turn) into broker writes.
16. Synthetic-harness Sentinel 25-question battery × 5 personas as a nightly regression check. Cross-tenant content leaks like D-012 should fail the harness immediately.
17. Audit-log Atlas admin/investor cross-tenant access paths (SEC-P1-8).

---

## J. Memory updates to make

- Update `demo_accounts.md` with the canonical roster (done in v1 session).
- Add a **`security_audit_2026-05-13.md`** memory note listing the 8 SEC-P0 routes so any future agent working in these files sees the unauthenticated-access flag immediately.
- Note in `feedback_broker_boundary.md` that `/api/intelligence/query`, `/api/engagements/create/turn`, `/api/identity/turn`, `/api/engage/[id]/turn` are current broker-boundary violations.
- Note that `arcturus` is canonical ClientKey for First Capital (not retired), per Agent B's clarification — update memory if it currently says all four codenames are dead.
- Note that Phase 5 per-user RLS is currently no-op because service role bypasses RLS and the Clerk JWT template's deployment status is unverified.

---

## K. What this audit did not cover

Honest scope:
- **Full Sentinel 25-question battery on all 5 personas** — only 2 questions tested on Apex CIO + 1 on Meridian CDIO. The synthetic harness in §I.16 is the right way to do this systematically.
- **Drive the Originate flow end-to-end and measure turn-count** to P1 promotion across 3 archetypes per tenant — documented gap.
- **Performance / Core Web Vitals** — Sentinel TTFT (~8s observed on Apex Q2) is acceptable but unmeasured p50/p95.
- **Accessibility audit** — no Axe/Lighthouse run.
- **Mobile / responsive** — only the unintended narrow-viewport collapse of Enterprise Context tab was noted.
- **28 `/api/reasoning/*` routes** — not sampled in the contract or RLS audits.
- **The four sub-agents I didn't spawn**: copy/voice consistency, Lighthouse pass, code-quality / dead-code sweep, mobile responsive pass.

---

## L. Agent run log

| Agent | Status | Findings |
|---|---|---|
| A — Seed-leak sweep | ✅ completed (169s, 90,814 tokens) | D-012 exact location, L1-L14 content leaks, 156 codename survivors |
| B — RLS / cross-tenant pen test | ✅ completed (373s, 159,396 tokens) | 8 P0 unauthenticated cross-tenant routes, middleware gap, 11 P1 concerns, 10-path tenant-key resolution fragmentation, RLS-is-no-op observation |
| C — Broker-boundary + API contracts | ✅ completed (170s, 101,826 tokens) | 12 broker-boundary issues, 3 HIGH-severity routes, transformer rule applied to 1 of 12 domains |
| D — Sign-out bug root cause | ✅ completed (359s, 87,832 tokens) | Root cause located; one-line fix; 6 duplicated sites — see §M |

---

## M. Sign-out bug — root cause + one-line fix (Agent D)

### Location
- **Button JSX**: `src/components/shell/AppTopBar.tsx:306-324`
- **Handler**: `src/components/shell/AppTopBar.tsx:79-82`

Same broken pattern duplicated in 6 places:
- `src/components/shell/AppRail.tsx:215`
- `src/components/shell/AppTopBarEditorial.tsx:49`
- `src/components/shell/AppTopBarTwoBar.tsx:59`
- `src/components/chrome/ClientChrome.tsx:147`
- `src/components/AbarvaNav.tsx:358`
- `src/components/shell/AppTopBarBlack.tsx:9` (re-exports AppTopBar)

### Current broken code

```ts
const { signOut } = useClerk();
const router = useRouter();

function handleSignOut() {
  clearActiveClientContext();
  void signOut(() => router.push("/signed-out"));
}
```

### Why it fails

Three reinforcing problems, all consequences of the deprecated callback overload:

1. **`router.push("/signed-out")` is a soft App Router transition.** `/signed-out` is in `PUBLIC_ROUTE_PATTERNS` (`src/proxy.ts:23`); the proxy doesn't redirect, the SPA just renders `LoggedOutLandingPage` over the still-mounted Clerk session.
2. **The `void` discards the returned `Promise<void>`.** Errors in `clerkjs.signOut(...)` (e.g. "clerk not loaded", network failure on `/v1/sessions/<id>/remove`) are swallowed silently — the button appears to work but the underlying call fails or no-ops.
3. **`useClientContext()` re-runs on every render** (`src/lib/use-client-context.ts:74-91`) and re-persists the client cookie + can `router.replace` back to the same path. Re-render churn keeps the React tree alive instead of letting a hard navigation flush the in-memory Clerk instance.

The DevTools workaround (`window.Clerk.signOut().then(()=>window.location.href='/sign-in')`) works because it awaits the unmodified `signOut()` and uses `window.location.href` (hard nav) — which is exactly what `signOut({ redirectUrl })` does under the hood.

### Fix

Replace `handleSignOut` body in all 6 sites:

```ts
async function handleSignOut() {
  clearActiveClientContext();
  await signOut({ redirectUrl: "/signed-out" });
}
```

Recommend extracting a single `useSignOut()` hook in `src/lib/auth/` to eliminate the 6-way drift and keep the cookie-clear + Clerk-call ordering canonical. `ClerkProvider` already has `afterSignOutUrl="/"` (`src/app/layout.tsx:54`); per-call `redirectUrl` overrides it, so `/signed-out` is preserved.

`DemoCodeSignIn` (`src/components/auth/DemoCodeSignIn.tsx:179`) correctly uses `window.location.assign(redirectUrl)` after `setActive` for the sign-IN side — the product just lacks the symmetric pattern on sign-OUT.

---

*Generated 2026-05-13 by Claude Code orchestrating 4 parallel subagents + 1 foreground browser pass against `nexus-vert-kappa.vercel.app`. Working notes in `scratchpad.md` and `AbarVa Browser-Crawl Audit — 2026-05-13.md` in the same directory.*
