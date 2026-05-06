# Setup / Admin Audit · v1

| Field | Value |
|---|---|
| Audit ID | `SETUP_AUDIT_2026-05-06` |
| Audit type | Consolidated M1+M2+M4+M5 (substrate · code · agents · doc drift). M3 Chrome deferred. |
| Sources compared | Spine doc · Setup build spec · Code · Substrate · ADMIN9 prior audit |
| Findings count | 8 compliance · 7 drift · 9 design observations |
| Front-agent decision | **Steward fronts Setup** (resolves spine-vs-code tension; see §6) |

---

## TL;DR

Setup has the most mature substrate of any AbarVa product surface — 7 admin_* tables with proper enums, a dedicated 5-rung trust ladder, agent-named ownership enums, and Atlas-specific persistence (atlas_threads, atlas_observations). The code is rich (21+ routes, 99 components) and ADMIN9 prior audit closed Wave-26 chrome work.

The drift sits in three places:
1. **Spine doc says Sentinel chats** (line 91 "Sentinel chat (data-scoped)") but **code has StewardEditorial.tsx woven across primary admin pages**. Three-way conflict among spine, code, and the user's broader "Setup = governance" framing.
2. **The 14 dataset families from spine doc are not 1:1 to substrate.** Substrate has 7 admin tables; spine specifies 14 family categories. The seven-vs-fourteen gap is the substrate work the spine anticipated but hasn't fully landed.
3. **Atlas has its own user-visible page** (`/admin/agents/atlas`) — a precedent that contradicts the front-agent-per-product rule. Multiple agents currently get user-visible surfaces in admin.

Under the refined architecture (front agent per product · specialists hidden), the resolution is: Steward fronts Setup chat, the Atlas page becomes a workflow page (cross-program signals), and the spine doc's "Sentinel chat" is recast as a Steward-fronted experience that routes to Sentinel-flavored data-health specialists behind the scenes.

---

## 1 · Compliance findings

### F-SU-001 · Setup substrate is unusually mature
[supabase/migrations/20260426120000_admin_connectors.sql](supabase/migrations/20260426120000_admin_connectors.sql) → [supabase/migrations/20260426120600_admin_setup_progress.sql](supabase/migrations/20260426120600_admin_setup_progress.sql). Seven admin_* tables, each with proper CHECK enums, RLS, and indexes. Most ambitious of any product surface.

### F-SU-002 · 5-rung trust ladder is enumerated and consistent
`admin_datasets.rung` enum: `raw, verified, blessed, ground_truth, audit_trail`. Used consistently across admin_dataset_approvals (from_rung/to_rung). Promotion workflow has substrate backing.

### F-SU-003 · Connector status enum models real readiness states
`admin_connectors.status`: `not_configured, configured_stub, blocked, deferred, active`. Matches dossier-style discipline — multiple states for not-yet-usable, doesn't pretend connectors are live.

### F-SU-004 · `admin_blockers` carries explicit `owner_agent` enum across the four canonical agents
`steward, nexus, sentinel, atlas`. Plus severity (critical/high/medium/low) and affected_scope (demo/pilot/production). This is a *substrate-level* recognition that work is divisible by agent — exactly the specialist-tagging the catalog needs.

### F-SU-005 · Atlas has dedicated persistence
`atlas_threads` (conversation containers; context_scope: portfolio/signal/use_case/cohort/integration) and `atlas_observations` (pillar: inventory/adoption/value/risk/cost/cross_pillar). Real DB-backed agent state — only Atlas has this depth.

### F-SU-006 · Audit log substrate is enumerated and active
`admin_audit_log.category`: auth, role_change, connector, dataset, approval, blocker, setup_progress, readiness_state, other. Covers admin/setup interactions.

### F-SU-007 · ADMIN9 prior audit framework matches the redesign rigor
[docs/build/ADMIN_COMPLETION_AUDIT.md](docs/build/ADMIN_COMPLETION_AUDIT.md) (461 lines) shows clean disposition methodology — KEEP/MERGE/REDIRECT/DEPRECATE for legacy routes. This is the precedent for how to scope the next admin wave.

### F-SU-008 · 11 admin/setup API routes covering core workflows
Approvals queue, dataset upload, evidence quality export, deployment status, user provisioning, AI initiatives. The plumbing exists for the workflows the spine specifies.

---

## 2 · Drift findings

### F-SU-101 · Spine doc says Sentinel chats; code has Steward editorial
- **Spine doc, line 91:** "Sentinel chat (data-scoped)"
- **Spine doc, line 154:** "Sentinel (agent on this surface) — Read-only across all segments. Composes data-health summaries. Surfaces gaps. Cites records by ID."
- **Spine doc, line 155:** "Steward (agent on this surface) — Handles upload mechanics, permission checks, classification enforcement. Different voice from Sentinel — operational, not interpretive."
- **Code:** `StewardEditorial.tsx` is woven into `/admin` (three acts), `/admin/connectors`, `/admin/production-readiness`. No comparable SentinelEditorial in admin.
- **Severity:** P1 — front-agent decision for Setup is not yet resolved.

### F-SU-102 · 14 dataset families in spine doc · 7 admin tables in substrate
- **Spine §C.01 to C.14** specifies 14 dataset families: enterprise profile, org structure, IT system landscape, IT financials, KPI dictionary, active programs, sourcing artifacts, program deliverables, evidence ledger, operating telemetry, vendor and contract, compliance, industry context, cross-program signals.
- **Substrate** has admin_connectors, admin_datasets, admin_dataset_approvals, admin_dataset_quality, admin_blockers, admin_audit_log, admin_setup_progress.
- **Note:** Most family-specific data lives in *non-admin* tables (e.g., `applications` for IT system landscape, `kpis` for KPI dictionary, `enterprise_graph_*` for relationships). The "14 families" is a UI organization concept; the substrate stores them across many tables. Drift is at the *organizational layer*, not necessarily a build gap.
- **Severity:** P2 — partly an organizational concept, partly real gaps. Worth confirming each family has substrate.

### F-SU-103 · `/admin/agents/atlas` page exists — front-agent-per-product violation
- **Code:** [src/app/(maestro)/admin/agents/atlas/page.tsx](src/app/(maestro)/admin/agents/atlas/page.tsx) — Atlas has a user-visible agent-named page.
- **New rule:** Under workflow-first / one-front-per-product, agent-named pages retire in favor of workflow-named pages.
- **Treatment:** Rename to `/admin/cross-program-signals` (or similar workflow name); Atlas-flavored content stays, the URL/header doesn't reference Atlas.
- **Severity:** P2

### F-SU-104 · No specialist/capability registry in substrate
- **Substrate has:** `owner_agent` as enum on blockers (4 values), `atlas_threads` (one agent's persistence)
- **Substrate lacks:** A `specialists` or `capabilities` table that would enumerate the narrow workers behind the four front agents.
- **Severity:** P1 under refined architecture. Catalog lives in `docs/architecture/specialist-catalog.md`; eventually it could be substrate-backed for runtime routing.

### F-SU-105 · `admin_blockers.owner_agent` parallel-all pattern echoes Source
Same pattern as Source (F-M2-101): per-row agent ownership, no single-lead-per-stage. Under workflow-first, this becomes "which capability bucket the blocker belongs to" — useful tagging, not user-visible role assignment.

### F-SU-106 · No per-user RLS yet; service-role-only ✅ RESOLVED — Phase 5 shipped 2026-05-07
~~Every admin/setup table uses `FOR ALL TO service_role USING (true)`.~~  
**Resolution:** Phase 5 per-user RLS rollout shipped 2026-05-07:
- Migration `20260507100000_rls_role_helpers.sql`: role helper functions + `clients.tenant_key`
- Migration `20260507120000_admin_per_user_rls_read.sql`: per-user read policies for all 7 admin tables (tenant_admin-gated)
- Migration `20260507140000_per_user_rls_write.sql`: write policies for admin tables (tenant_admin-gated; audit_log append-only)
- 108-test negative test suite at `src/__tests__/integration/security/per-user-rls.test.ts`
- Operations runbook at `docs/build/RLS_OPERATIONS_RUNBOOK.md`
- **Severity:** ~~P0 for pilot~~ → **Closed**

### F-SU-107 · Spine doc's "Sentinel chat" pattern not implemented in admin code
No SentinelChat component visible under `/admin/**`. The chat affordance described in spine §D.2 ("Ask about your [segment name]") exists conceptually but doesn't have a ready-made component.
- **Severity:** P1 — depends on resolution of F-SU-101 (which agent fronts Setup chat).

---

## 3 · Design observations

### F-SU-201 · Four agents are all named in admin substrate but only Atlas has dedicated persistence
- Steward, Nexus, Sentinel, Atlas all appear in `admin_blockers.owner_agent` enum. Only Atlas has its own threads/observations tables.
- **Observation:** Atlas was treated as more "agent-like" than the others during admin substrate buildout — has conversational persistence (threads), structured outputs (observations with pillar enum). The other three agents don't have parallel substrate.
- **Implication for redesign:** Under workflow-first, the right move is probably to either (a) generalize the Atlas persistence pattern to all agents (give each `<agent>_threads` + `<agent>_observations`) or (b) generalize to a single `agent_threads` + `agent_observations` with `agent_name` column. The latter is simpler and fits the specialist model.

### F-SU-202 · Steward is the de facto editorial voice in admin code
StewardEditorial.tsx is the most-used admin agent component. Steward "speaks" to admins on the landing, connectors, and production-readiness pages. This makes Steward = Setup-front the path of least resistance for the redesign.

### F-SU-203 · "Acts registry" pattern is the most interesting setup primitive
[src/lib/admin/setup-acts-registry.ts](src/lib/admin/setup-acts-registry.ts) implements a "three-act story" structure (what we know / reason / upload) for the Setup landing page. This is workflow-first thinking already in code — admins see *acts* (what to do), not agents. Under the refined model, this pattern is exactly right and should propagate.

### F-SU-204 · Trust ladder (5 rungs) is well-modeled but not exposed to spine doc's 14-family structure
The 5-rung ladder applies to *datasets*, not *families*. A family could have records at all 5 rungs. This isn't drift — but the spine doc could be more explicit about how rungs render per family.

### F-SU-205 · Connector inventory parallels integration discovery in Setup-build-spec
[supabase/migrations/20260426120000_admin_connectors.sql](supabase/migrations/20260426120000_admin_connectors.sql) — kind enum: erp, spend_analytics, contract_management, identity, data_warehouse, crm, observability, ticketing. This is solid domain modeling. Worth confirming the spine doc's enterprise data inventory aligns to this enum (e.g., spend_analytics ↔ family 04 IT financials).

### F-SU-206 · Quality dimensions in `admin_dataset_quality` are well-thought
6 NUMERIC(5,2) fields: completeness, freshness, schema_conformance, lineage, sample_agreement, overall. This is the right level of granularity — not just "good/bad" but meaningful sub-scores. The spine doc's "coverage scoring" mentioned in §B.4 should bind to this table.

### F-SU-207 · Tenant private schemas are a clean isolation pattern
`client_apex_retail_private`, `client_meridian_health_private`, etc. — per-tenant Postgres schemas with tenant_metric_observations and tenant_metric_upload_batches. Deeper than RLS for sensitive data.

### F-SU-208 · `setup-data-broker.ts` is the seam to inventory substrate
This file is the broker pattern (per memory's "Knowledge-layer broker boundary") for setup data — admin tier reads inventory through this, not direct vector/graph access. Cleaner than Source's situation.

### F-SU-209 · Production readiness logic has its own substrate path
Multiple admin_blockers + admin_setup_progress + production-readiness API surfaces. The pilot/production gating story has substrate, code, AND UI — three layers consistently. Strongest example of three-layer rigor in the product.

---

## 4 · Setup vocabulary matrix · drift summary

| Concept | Spine doc | Code (admin lib) | Substrate | Drift |
|---|---|---|---|---|
| Front agent in chat | Sentinel | Steward (editorial) | All 4 named in blockers | **F-SU-101** — pick Steward |
| Dataset families | 14 (C.01–C.14) | "segments" referenced loosely | 7 admin_* tables; dataset content elsewhere | F-SU-102 |
| Trust rungs | 5 (raw → audit_trail) | dataset-trust-model.ts | `admin_datasets.rung` 5-state enum | OK |
| Connector states | Multiple in spine | connectors page | `status` 5-state enum | OK |
| Agent persistence | Implied | Atlas thread/obs only | `atlas_threads`, `atlas_observations` | F-SU-201 — generalize |
| Specialist registry | Not specified | Catalog doc | None | F-SU-104 |
| RLS | Per-tenant required | Service-role only | Service-role only | F-SU-106 — gating pilot |

---

## 5 · Architectural reconciliations Setup forces

The Setup audit forces three decisions the Source audit only flagged:

1. **Front-agent decision for Setup:** Steward (matches code, matches "governance is the through-line"). Spine doc's "Sentinel chat" gets recast as a Steward-fronted experience that calls Sentinel-flavored data-health specialists.
2. **Per-user RLS:** must close before pilot. P0.
3. **Atlas page rename:** `/admin/agents/atlas` → `/admin/cross-program-signals`. Workflow-first.

Plus one design observation that propagates back to all five products:

4. **Generalize Atlas thread/observation pattern:** the substrate `<agent>_threads` + `<agent>_observations` model is the right primitive for every agent. Not just Atlas. Either expand to all four (steward_threads, nexus_threads, etc.) or generalize to `agent_threads` with `agent_name` discriminator (simpler).

---

## 6 · Front-agent mapping · refined for Setup

Before this audit:

| Product | Front |
|---|---|
| Moves | Nexus |
| Source | Sentinel |
| Tower | Atlas |
| Intelligence | Sentinel |
| Setup | Steward (per memory) |

After Setup audit (no change to mapping; reasoning sharpened):

| Product | Front | Reason |
|---|---|---|
| Moves | Nexus | Lead orchestration across program workstreams |
| Source | Sentinel | Evidence integrity is the sourcing thesis (build spec line 17) |
| Tower | Atlas | Executive synthesis fits portfolio rollup |
| Intelligence | Sentinel | Evidence retrieval across worldview/industry/tenant corpora |
| **Setup** | **Steward** | StewardEditorial.tsx is the existing primary voice; "governance / configuration / readiness gates" is the through-line; spine doc's "Sentinel chat" reframes as Steward routing to data-health specialists |

---

## 7 · What the audit DID NOT cover

- **Per-route Chrome verification.** Same as Source M3 — needs a focused session.
- **Live data check** for the 14 dataset families against current Apex Retail substrate.
- **Per-corpus depth** (worldview/industry/tenant) — substrate exists but content quality wasn't audited.
- **`/admin/build-progress` content review** — this was post-merge content that may need refresh.
- **ADMIN9 wave-completion verification** — that prior audit's "depth-not-chrome" recommendations were planned but execution status not verified here.

---

End of Setup audit.
