# ADMIN-DATA — Native Admin Data Layer Audit

- Generated: 2026-04-27
- Slice: ADMIN-DATA1
- Status: code_complete (audit-only deliverable)
- Wave registered: `wave-admin-data` (status: planned)

---

## Executive summary

After `wave-admin-completion` shipped (10 of 11 slices merged at 91%), the canonical `/admin/*` tree at `src/app/(maestro)/admin/*` is content-rich: 8 pages with sub-tabs, drill-down drawers, action strips, deterministic AGENT1 reasoning. Every one of those pages, however, reads from **hardcoded TypeScript constants** in `src/lib/admin/*-page-view.ts` — `SETUP_ITEMS`, `SEED_USER_DETAILS`, `APEX_DETAIL_SEEDS`, `LOADED_FILES`, `CI_SNAPSHOT`, etc. The user (founder) has called this out: ADMIN18 (Overview pull-through) was deferred from `wave-admin-completion` for exactly this reason — "use deterministic seed for both timeline and activity" was unacceptable; it should pull native data.

The infrastructure to do this already exists in the codebase. `src/lib/source/commercial-mission-adapter.ts` is the canonical pattern for converting domain-specific table reads into typed read-models. `src/lib/atlas/repository.ts`, `src/lib/db/team.ts`, `src/lib/db/engagement.ts` all show the server-only `getServerSupabase()` adapter idiom. Around 80 Supabase migrations have already shipped (`supabase/migrations/`), creating tables like `audit_log` (021), `clients` (020), `teams`/`team_memberships` (018), `person_client_memberships` (035), `data_integrations` + `integration_health` (Tower W3), `evidence` (intelligence layer core), and many more. Some admin domains map onto these existing tables; others need new ones.

This audit produces (a) a per-page mapping of every hardcoded constant in the 8 admin page-views to the table that should back it, (b) DDL specs for 7 new admin-scoped tables, (c) TypeScript adapter contract signatures (no implementations), and (d) a 12-slice wave plan (`ADMIN-DATA2` through `ADMIN-DATA13`) registered as `backlog`. Sequencing is designed so adapter contracts merge first as a foundation, page-wiring lanes run in parallel against typed contracts (with fixture mode while migrations cook), migrations land later, and then the same adapter call sites swap fixture for real DB without touching pages. ADMIN18 (Overview depth) ships as `ADMIN-DATA12` against real data; AGENT1 context bundle moves from hardcoded constants to live DB in `ADMIN-DATA11`.

All write actions (Approve, Invite, Configure, Mark Resolved, Test Connection, Suspend), live model calls, and audit-event emission stay HARD-GATED — those are Wave 27+. This wave is **READ-ONLY**: real data flows in, but the same disabled-with-reason interaction model the founder approved in ADMIN10–ADMIN17 is preserved.

---

## 1. Existing infrastructure inventory

### 1.1 Supabase migrations catalogue

74 migrations exist in `supabase/migrations/`. Of those, **9 already create admin-relevant tables** that the ADMIN-DATA wave will consume:

| Migration | Tables created | Admin-relevance |
|---|---|---|
| `001_three_layer_data_model.sql` | `org_master_data`, `engagement_data`, `genome_patterns`, `data_audit_log`, `org_data_version` | `data_audit_log` is a partial historical predecessor to a tenant-scoped admin audit log, but its scope is narrow (data layer changes only). |
| `013_engagement_state.sql` | `persons`, `engagements`, `turns`, `relationship_notes` | `persons` is the canonical user identity table; admin Users & Access reads here. |
| `018_teams_and_memberships.sql` | `teams`, `team_memberships` | Tenant grouping. `teams.slug` is the tenant identifier across Atlas / Source / Programs. Admin role matrix reads here. |
| `020_clients_and_invoices.sql` | `clients`, `invoices` | `clients` is the tenant identity for client-facing tenants (Apex, Meridian). Admin tenant header reads here. |
| `021_audit_log.sql` | `audit_log` | Single-tenant-agnostic audit log. Recent activity strip CAN read this today, but it's narrow (`actor_person_id`, `action`, `target_table`, `target_id`); it does not capture admin-page interactions. New `admin_audit_log` either extends it or adds a parallel scope. |
| `029_cross_industry_core.sql` | `applications`, `integrations`, `data_sources`, `data_governance_policies`, `ai_models` | `integrations` is a foundational connector inventory but is shaped for system-system integrations, not for the admin-connector readiness rubric (pilot-blocker, steward-guidance, config-schema). New `admin_connectors` is preferable to overloading. |
| `035_user_roles.sql` | `person_client_memberships` (`user_role_type` enum: `maestro` / `client_viewer` / `observer`) | Person ↔ Client role membership. Admin Users & Access permission matrix reads here. |
| `20260421151200_data_integrations.sql` | `data_integrations` | Tower W3 connector inventory: tenant-scoped, status enum (`connected`/`partial`/`failed`/`paused`/`pending`), config_jsonb. Closer to admin connectors than `integrations` but still missing the required-for-pilot / required-for-production / steward-guidance fields. |
| `20260421151700_integration_health.sql` | `integration_health` | Tower W3 health snapshots. Admin connector "health trend" rendered today as deterministic 24-point seed CAN read here. |
| `20260421152500_intelligence_layer_core.sql` | `evidence`, `kpis`, `pattern_packs`, `external_events`, etc. | `evidence` is the intelligence-layer evidence store; admin Data Trust ladder CAN cross-reference but is not a 1:1 mapping (admin Data Trust is dataset-scoped, not signal-scoped). |

**Conclusion:** Foundational identity (`persons`, `teams`, `clients`, `person_client_memberships`) and audit (`audit_log`) tables exist. Connector / integration tables exist but are shaped for Tower / cross-industry inventory, not for admin readiness rubric. **No** admin-specific tables for setup-progress, dataset-trust ladder, dataset approvals, dataset quality scorecard, production-readiness blockers, or admin-page audit currently exist.

### 1.2 Adapter pattern (from existing code)

The canonical pattern, copied from `src/lib/source/commercial-mission-adapter.ts` and `src/lib/atlas/repository.ts`:

**Module split.** Two files per domain:
- `<domain>-adapter-types.ts` — TypeScript interfaces for inputs, outputs, summary shapes. Pure types; safe for client import.
- `<domain>-adapter.ts` — Server-only async functions that pull from Supabase via `getServerSupabase()` and return typed read-models.

**Server entry.** Every adapter starts with `import { getServerSupabase } from '@/lib/supabase-server';`. `getServerSupabase()` is memoized and reads `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Throws if unset — adapters never silently degrade.

**Typed reads.** Adapters use `.from('table').select(...).eq(...)` and cast the result through a typed row interface. Empty/missing data returns `[]` or `null` rather than throwing. See `getTeamsForPerson` in `src/lib/db/team.ts` for the canonical shape.

**Read-model translation.** Adapters do NOT return raw rows. They translate Supabase rows into a domain read-model that the page-view consumes. `commercial-mission-adapter.ts` line 255-289 (`createCanonicalMission`) demonstrates: takes a queue item, maps owner→agent, type→canonical type, status→state, returns a `SourceAgentMission`. Pages never see raw column names like `actor_person_id`; they see `userId` + `userName`.

**Test fixtures.** Test fixtures live separately (`src/lib/source/context-test-fixtures.ts` or similar). Real reads + fixtures share the same return type, so swapping them is a one-line change. ADMIN-DATA adopts this convention: adapters export both `getX(tenantSlug)` (real) and `getXFixture()` (deterministic) until migrations land.

**No write actions.** The Source / Atlas / Tower adapters are READ-ONLY. Writes happen via separate write-paths that are still scoped to non-admin domains. ADMIN-DATA adheres: every adapter is `Promise<T>` returning data, never `Promise<void>` mutating.

### 1.3 Existing admin-relevant tables found

| Table | Migration | Schema (key columns) | Currently consumed by | Reusable for admin? |
|---|---|---|---|---|
| `persons` | 013 | `id`, `email`, `display_name`, `primary_role`, `created_at` | `src/lib/db/team.ts`, `src/lib/atlas/repository.ts`, AGENT1 context bundle (indirectly via `tenant_user_roles`) | ✅ Yes — admin Users & Access user list reads here. |
| `teams` + `team_memberships` | 018 | `teams(id, name, slug)`, `team_memberships(team_id, person_id, role enum admin/maestro/observer)` | `getTeamsForPerson` (`src/lib/db/team.ts`) | ✅ Yes — admin role matrix uses `team_memberships.role`. |
| `clients` | 020 | `id`, `name`, `legal_name`, `industry_code`, `stripe_customer_id` | Atlas tenant header, Tower portfolio | ✅ Yes — admin tenant context bar reads `name`. |
| `person_client_memberships` | 035 | `person_id`, `client_id`, `role` (enum `user_role_type`: `maestro`/`client_viewer`/`observer`) | RLS policy enforcement, AGENT1 (indirectly) | ✅ Yes — admin per-tenant user permissions read here. |
| `audit_log` | 021 | `actor_person_id`, `action`, `target_table`, `target_id`, `old_value`, `new_value`, `created_at` | None app-side — table is policy-scoped but no reader exists yet | 🟡 Partial — narrow scope (data-mutation events, not admin-UI events). Recent activity strip will likely use this for the subset that maps. New `admin_audit_log` covers admin-scoped events. |
| `data_integrations` | 20260421151200 | `client_id`, `integration_type`, `provider_name`, `status enum`, `last_synced_at`, `config_jsonb` | `src/lib/data-trust/integration-loader.ts` (Tower) | 🟡 Partial — Tower-shaped. Admin connectors need additional fields (required-for-pilot, blocker-reason, steward-guidance, kind taxonomy with `erp`/`spend_analytics`/`contract_management`/`identity`). New `admin_connectors` rather than overloading. |
| `integration_health` | 20260421151700 | `integration_id`, `health_status enum`, `freshness_minutes`, `error_count`, `checked_at` | Tower health rollup | ✅ Yes — admin connector health trend reads here once `admin_connectors.id` ↔ `data_integrations.id` mapping is decided. |
| `evidence` | 20260421152500 | Intelligence-layer evidence | Atlas / Sentinel / Tower readers | 🟡 Partial — admin Data Trust is dataset-scoped, not signal-scoped. Cross-reference only. |
| `data_uploads` | 20260421151600 | Uploaded file inventory | Tower data ingest | ✅ Yes — admin Data Trust "Loaded files" tab reads here directly. |

---

## 2. Per-page data mapping

For each of the 8 canonical admin page-views, this section enumerates every hardcoded constant and classifies it:

- **CAN MIGRATE NOW** — existing table holds the data, adapter is the only missing piece.
- **NEEDS MIGRATION** — table doesn't exist; new admin table required (specced in Section 3).
- **STAYS DETERMINISTIC** — describes the platform, not tenant state (e.g. `AGENT_CAPABILITIES`, `TRUST_LADDER` rung definitions, `CATEGORY_LABELS`). These remain TypeScript constants.

### 2.1 — `/admin` (Overview) — `src/lib/admin/overview-page-view.ts` (123 lines)

**Hardcoded today:**
- `SETUP_ITEMS` (6 entries: data-trust, connectors, users-access, agent-readiness, production-readiness, architecture; each with `status` and `description`).
- Editorial copy (already replaced by AGENT1 in AGENT1B).

**Classification:**
- `SETUP_ITEMS` → **NEEDS MIGRATION** (`admin_setup_progress`). Status (`done`/`in_progress`/`pending`) is per-tenant state, not platform-level.

**Other data needs (currently absent — page does not yet show these):**
- Recent activity feed → **NEEDS MIGRATION** (`admin_audit_log`).
- Cross-page counts (open blockers, datasets pending approval, connectors not configured) → derived from the other admin tables; computed at adapter layer, not stored separately.

**Adapter contract:**

```typescript
// src/lib/admin/data/admin-overview-adapter-types.ts
export interface AdminOverviewSnapshot {
  tenant: { slug: string; name: string };
  setupSteps: ReadonlyArray<AdminSetupStep>;
  recentActivity: ReadonlyArray<AdminAuditEvent>;
  crossPageCounts: {
    openBlockers: number;
    datasetsPendingApproval: number;
    connectorsNotConfigured: number;
    invitesPending: number;
    productionReadinessGatesFailing: number;
  };
  generatedAt: string;
}

// src/lib/admin/data/admin-overview-adapter.ts
export async function getAdminOverviewSnapshot(tenantSlug: string): Promise<AdminOverviewSnapshot>;
```

### 2.2 — `/admin/users-access` — `src/lib/admin/users-access-page-view.ts` (540 lines)

**Hardcoded today:**
- `ROLES` (5 role rows with member counts) — derivable from `team_memberships` + `person_client_memberships`.
- `SEED_USER_DETAILS` (5 users with permissions, recent activity) — derivable from `persons` + `audit_log` join.
- `SEED_INVITES` (pending/expired invites) — does not exist; needs Clerk integration in DATA11 or a new `admin_invites` table for the read-only mirror.
- `SEED_ROLE_SUMMARY` (per-role member count, scope, permission count) — derivable.
- `SEED_PERMISSION_MATRIX` — concept-level (which permissions each role has) — **STAYS DETERMINISTIC**.
- `SEED_ACTION_STRIP` — interaction affordances; HARD-GATED. **STAYS DETERMINISTIC**.
- `TABS` / `TAB_KEYS` / `DEFAULT_TAB` — UI structure. **STAYS DETERMINISTIC**.

**Classification:**
- User list → **CAN MIGRATE NOW** (read `persons` + `team_memberships` + `person_client_memberships`).
- Role summary counts → **CAN MIGRATE NOW**.
- User recent-activity → **CAN MIGRATE NOW** (`audit_log` filtered by `actor_person_id`).
- Pending invites → **NEEDS MIGRATION** (Clerk read-mirror or new `admin_invites`); **deferred** to Wave 27 if Clerk live read is preferred. ADMIN-DATA3 keeps invites as deterministic seed and notes the deferral.

**Adapter contract:**

```typescript
// src/lib/admin/data/admin-users-adapter-types.ts
export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  primaryRole: 'maestro' | 'client_viewer' | 'observer';
  tenantRoles: ReadonlyArray<{ tenantSlug: string; role: string }>;
  lastSignIn: string | null;
  status: 'active' | 'invited' | 'suspended';
}

export interface AdminUserDetail extends AdminUserRow {
  permissions: ReadonlyArray<string>;
  recentActivity: ReadonlyArray<{ at: string; action: string; targetTable: string }>;
}

export interface AdminRoleSummary {
  roleId: string;
  label: string;
  memberCount: number;
  scope: string;
  permissionCount: number;
}

// src/lib/admin/data/admin-users-adapter.ts
export async function getAdminUsers(tenantSlug: string): Promise<ReadonlyArray<AdminUserRow>>;
export async function getAdminUserDetail(tenantSlug: string, userId: string): Promise<AdminUserDetail | null>;
export async function getAdminRoleSummary(tenantSlug: string): Promise<ReadonlyArray<AdminRoleSummary>>;
```

### 2.3 — `/admin/agent-readiness` — `src/lib/admin/agent-readiness-page-view.ts` (462 lines)

**Hardcoded today:**
- `AGENT_CAPABILITIES` — per-agent canDo/cannotDo/unblockedBy lists. **Concept-level** (describes platform, not tenant state). **STAYS DETERMINISTIC**.
- `COVERAGE` — context-coverage matrix levels. Per-tenant readiness state. **CAN MIGRATE NOW** (derivable from existing connector + dataset readiness).
- `AGENT_DETAIL` — per-agent summary + topGap. Tenant-state-mixed. Split: detail copy is concept (deterministic); topGap is computed.
- `AGENT_LABELS` / `AGENT_GOVERNS` / `SURFACE_LABELS` / `TABS` — **STAYS DETERMINISTIC**.
- `SEED_ACTION_STRIP` — HARD-GATED affordances. **STAYS DETERMINISTIC**.

**Classification:**
- Coverage matrix → **CAN MIGRATE NOW** (derive from connector + dataset states).
- Agent posture (steward/nexus/sentinel/atlas readiness flags) → already handled by AGENT1 context bundle. ADMIN-DATA11 wires AGENT1's context bundle source from constants to live DB.

**Adapter contract:**

```typescript
// src/lib/admin/data/admin-agent-readiness-adapter-types.ts
export interface AdminAgentReadinessSnapshot {
  agents: ReadonlyArray<{ agentId: 'steward' | 'nexus' | 'sentinel' | 'atlas'; topGap: string }>;
  coverageMatrix: ReadonlyArray<{ surface: string; agent: string; level: 'full' | 'partial' | 'absent' }>;
  generatedAt: string;
}

// src/lib/admin/data/admin-agent-readiness-adapter.ts
export async function getAdminAgentReadiness(tenantSlug: string): Promise<AdminAgentReadinessSnapshot>;
```

### 2.4 — `/admin/connectors` — `src/lib/admin/connectors-page-view.ts` (713 lines)

**Hardcoded today:**
- `CATEGORY_LABELS` / `CATEGORY_ORDER` — taxonomy. **STAYS DETERMINISTIC**.
- `APEX_DETAIL_SEEDS` — per-connector vendor, label, status, config schema, sync attempts, requirements, blocker reason, steward guidance.
- `MERIDIAN_DETAIL_SEEDS` — same shape, different tenant.
- `HARD_GATE_REASON` — copy. **STAYS DETERMINISTIC**.

**Classification:**
- Per-connector data → **NEEDS MIGRATION** (`admin_connectors`). The existing `data_integrations` table is Tower-shaped; admin connectors need additional fields (`required_for_pilot`, `required_for_production`, `blocker_reason`, `steward_guidance`, `kind` taxonomy).
- Sync attempts / health trend → **CAN MIGRATE NOW** (`integration_health` if connector ID join exists; `admin_connectors.health_link_integration_id` foreign key bridges).
- Config schema (JSONB) → stored on `admin_connectors.config_schema`.

**Adapter contract:**

```typescript
// src/lib/admin/data/admin-connectors-adapter-types.ts
export interface AdminConnectorRow {
  id: string;
  kind: 'erp' | 'spend_analytics' | 'contract_management' | 'identity' | 'data_warehouse' | 'crm';
  vendor: string | null;
  label: string;
  status: 'not_configured' | 'configured_stub' | 'blocked' | 'deferred' | 'active';
  requiredForPilot: boolean;
  requiredForProduction: boolean;
  blockerReason: string | null;
  stewardGuidance: string | null;
  lastSyncAttempt: string | null;
}

export interface AdminConnectorDetail extends AdminConnectorRow {
  configSchema: Record<string, unknown> | null;
  recentSyncAttempts: ReadonlyArray<{ at: string; result: 'ok' | 'failed' | 'partial'; errorMessage?: string }>;
  healthTrend: ReadonlyArray<{ at: string; status: 'healthy' | 'degraded' | 'failed' | 'paused' }>;
}

// src/lib/admin/data/admin-connectors-adapter.ts
export async function getAdminConnectors(tenantSlug: string): Promise<ReadonlyArray<AdminConnectorRow>>;
export async function getAdminConnectorDetail(tenantSlug: string, connectorId: string): Promise<AdminConnectorDetail | null>;
```

### 2.5 — `/admin/data-trust` — `src/lib/admin/data-trust-page-view.ts` (730 lines)

**Hardcoded today:**
- `TRUST_LADDER` — concept (5 rungs: raw → verified → blessed → ground-truth → audit-trail). **STAYS DETERMINISTIC**.
- `DATASETS_BY_RUNG` — per-rung dataset list with summary.
- `DATASET_DETAIL_MAP` — per-dataset detail.
- `LOADED_FILES` — file uploads with size/type/uploaded-at/uploaded-by.
- `PROMOTION_REQUESTS` — pending/approved/rejected requests.
- `QUALITY_SCORECARD` — per-dataset pillar scores (completeness, freshness, schema, lineage, sample).
- `AUDIT_TRAIL` — per-dataset history.
- `TRUST_PROGRESSION` — derived from DATASETS_BY_RUNG; deterministic.
- `ACTION_STRIP` / `TABS` / `TAB_KEYS` — **STAYS DETERMINISTIC**.

**Classification:**
- Dataset list + per-rung counts → **NEEDS MIGRATION** (`admin_datasets`).
- Dataset detail → **NEEDS MIGRATION** (`admin_datasets`).
- Loaded files → **CAN MIGRATE NOW** (`data_uploads` from migration `20260421151600`).
- Promotion requests → **NEEDS MIGRATION** (`admin_dataset_approvals`).
- Quality scorecard → **NEEDS MIGRATION** (`admin_dataset_quality`).
- Audit trail → **CAN MIGRATE NOW** (`audit_log` filtered by `target_table='admin_datasets'`).

**Adapter contract:**

```typescript
// src/lib/admin/data/admin-datasets-adapter-types.ts
export interface AdminDatasetRow {
  id: string;
  slug: string;
  label: string;
  domain: string;
  rung: 'raw' | 'verified' | 'blessed' | 'ground_truth' | 'audit_trail';
  rowCount: number | null;
  ownerPersonId: string | null;
  lastUpdatedAt: string;
}

export interface AdminDatasetDetail extends AdminDatasetRow {
  lineageSources: ReadonlyArray<string>;
  schemaSummary: ReadonlyArray<{ column: string; dtype: string; nullable: boolean }>;
  qualityScorecard: AdminDatasetQuality | null;
  recentApprovals: ReadonlyArray<AdminDatasetApprovalRow>;
}

export interface AdminDatasetQuality {
  datasetId: string;
  completeness: number;
  freshness: number;
  schemaConformance: number;
  lineage: number;
  sampleAgreement: number;
  overall: number;
  measuredAt: string;
}

export interface AdminDatasetApprovalRow {
  id: string;
  datasetId: string;
  fromRung: AdminDatasetRow['rung'];
  toRung: AdminDatasetRow['rung'];
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  reason: string | null;
}

// src/lib/admin/data/admin-datasets-adapter.ts
export async function getAdminDatasets(tenantSlug: string): Promise<ReadonlyArray<AdminDatasetRow>>;
export async function getAdminDatasetDetail(tenantSlug: string, datasetId: string): Promise<AdminDatasetDetail | null>;
export async function getAdminDatasetApprovals(tenantSlug: string, status?: AdminDatasetApprovalRow['status']): Promise<ReadonlyArray<AdminDatasetApprovalRow>>;
export async function getAdminDatasetQuality(tenantSlug: string, datasetId: string): Promise<AdminDatasetQuality | null>;
```

### 2.6 — `/admin/build-progress` — `src/lib/admin/build-progress-page-view.ts` (558 lines)

**Hardcoded today:**
- `CI_SNAPSHOT` — recent CI runs. Deterministic seed.
- Wave / slice manifests — already read from `docs/build/build-waves.json` and `docs/build/build-slices.json` server-side (ADMIN15).

**Classification:**
- Wave / slice tables → already file-backed (manifests). **STAYS FILE-BACKED** — these are platform build state, not tenant state.
- CI snapshot → **STAYS DETERMINISTIC** in this wave; live CI is Wave 27 (gh API integration). Page does not wire to DB.

**Adapter contract:** None required. Build Progress is the one admin page that does NOT need a DB-backed adapter; it's already reading manifests from `docs/build/*.json`. ADMIN-DATA7 reuses the existing manifest reader and adds nothing.

**Note:** ADMIN-DATA7 is therefore the smallest lane (essentially a no-op verification slice that confirms manifest readers are stable; can also be merged into ADMIN-DATA13 regression).

### 2.7 — `/admin/production-readiness` — `src/lib/admin/production-readiness-page-view.ts` (500 lines)

**Hardcoded today:**
- `TABS` — UI. **STAYS DETERMINISTIC**.
- `HISTORY_STRIP` — past readiness assessments.
- Tile expansions, gate criteria, blocker drawer content (per ADMIN16).

**Classification:**
- Per-tile readiness state (Demo / Pilot / Production: ready/partial/blocked) → derived from cross-page state (datasets, connectors, blockers, agents). Computed at adapter layer.
- Gate criteria → **STAYS DETERMINISTIC** (concept-level).
- Per-blocker detail (W32F BlockerDetail drawer) → **NEEDS MIGRATION** (`admin_blockers`).
- History strip → **NEEDS MIGRATION** (`admin_readiness_history` — small enough to fold into `admin_audit_log` rather than a dedicated table; folding chosen).

**Adapter contract:**

```typescript
// src/lib/admin/data/admin-production-readiness-adapter-types.ts
export interface AdminBlockerRow {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedScope: 'demo' | 'pilot' | 'production';
  status: 'open' | 'in_progress' | 'resolved' | 'waived';
  ownerAgent: 'steward' | 'nexus' | 'sentinel' | 'atlas';
  blockerReason: string;
  unblockSteps: ReadonlyArray<string>;
  openedAt: string;
  resolvedAt: string | null;
}

export interface AdminProductionReadinessSnapshot {
  tiles: ReadonlyArray<{
    scope: 'demo' | 'pilot' | 'production';
    status: 'ready' | 'partial' | 'blocked';
    failingCriteria: ReadonlyArray<string>;
  }>;
  blockers: ReadonlyArray<AdminBlockerRow>;
  history: ReadonlyArray<{ at: string; scope: string; status: string; note: string }>;
}

// src/lib/admin/data/admin-production-readiness-adapter.ts
export async function getAdminProductionReadiness(tenantSlug: string): Promise<AdminProductionReadinessSnapshot>;
export async function getAdminBlockers(tenantSlug: string, status?: AdminBlockerRow['status']): Promise<ReadonlyArray<AdminBlockerRow>>;
export async function getAdminBlockerDetail(tenantSlug: string, blockerId: string): Promise<AdminBlockerRow | null>;
```

### 2.8 — `/admin/architecture` — `src/lib/admin/architecture-page-view.ts` (489 lines)

**Hardcoded today:**
- `ARCHITECTURE_PLANES`, `PLANE_COMPONENTS`, `AZURE_SERVICES`, `AZURE_TARGET_ARCHITECTURE`.

**Classification:** ALL **STAYS DETERMINISTIC**. Architecture is a description of the platform, not tenant state. Per-plane health summary (component active/partial/deferred) likewise describes platform reality, not per-tenant state. No DB backing needed. ADMIN-DATA9 verifies this and is therefore the smallest UI-page lane.

**Adapter contract:** None.

---

## 3. New tables required (DDL specs)

The following DDL is the **target shape** — actual migration files ship in ADMIN-DATA10. Each table is tenant-scoped via `client_id` (matching the existing convention) and policy-protected via service-role-only RLS, mirroring `data_integrations` and `audit_log`.

### 3.1 — `admin_connectors`

```sql
CREATE TABLE admin_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN (
    'erp', 'spend_analytics', 'contract_management', 'identity',
    'data_warehouse', 'crm', 'observability', 'ticketing', 'other'
  )),
  vendor TEXT,
  label TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'not_configured', 'configured_stub', 'blocked', 'deferred', 'active'
  )),
  config_schema JSONB DEFAULT '{}'::jsonb,
  data_integration_id UUID REFERENCES data_integrations(id) ON DELETE SET NULL,
  last_sync_attempt TIMESTAMPTZ,
  required_for_pilot BOOLEAN NOT NULL DEFAULT false,
  required_for_production BOOLEAN NOT NULL DEFAULT true,
  blocker_reason TEXT,
  steward_guidance TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_connectors_client ON admin_connectors(client_id);
CREATE INDEX idx_admin_connectors_status ON admin_connectors(client_id, status);
CREATE INDEX idx_admin_connectors_kind ON admin_connectors(client_id, kind);
ALTER TABLE admin_connectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_admin_connectors" ON admin_connectors
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

`data_integration_id` foreign key bridges admin_connectors to the existing Tower W3 data_integrations row, enabling `integration_health` lookups for the health trend without duplicating health storage.

### 3.2 — `admin_datasets`

```sql
CREATE TABLE admin_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  domain TEXT NOT NULL,
  rung TEXT NOT NULL CHECK (rung IN (
    'raw', 'verified', 'blessed', 'ground_truth', 'audit_trail'
  )),
  row_count BIGINT,
  owner_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  lineage_sources TEXT[] DEFAULT ARRAY[]::TEXT[],
  schema_summary JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, slug)
);
CREATE INDEX idx_admin_datasets_client_rung ON admin_datasets(client_id, rung);
ALTER TABLE admin_datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_admin_datasets" ON admin_datasets
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### 3.3 — `admin_dataset_approvals`

```sql
CREATE TABLE admin_dataset_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES admin_datasets(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  from_rung TEXT NOT NULL CHECK (from_rung IN (
    'raw', 'verified', 'blessed', 'ground_truth', 'audit_trail'
  )),
  to_rung TEXT NOT NULL CHECK (to_rung IN (
    'raw', 'verified', 'blessed', 'ground_truth', 'audit_trail'
  )),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  requested_by UUID NOT NULL REFERENCES persons(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_by UUID REFERENCES persons(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  reason TEXT
);
CREATE INDEX idx_admin_dataset_approvals_status ON admin_dataset_approvals(client_id, status);
CREATE INDEX idx_admin_dataset_approvals_dataset ON admin_dataset_approvals(dataset_id, requested_at DESC);
ALTER TABLE admin_dataset_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_admin_dataset_approvals" ON admin_dataset_approvals
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### 3.4 — `admin_dataset_quality`

```sql
CREATE TABLE admin_dataset_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES admin_datasets(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  completeness NUMERIC(5,2) NOT NULL CHECK (completeness BETWEEN 0 AND 100),
  freshness NUMERIC(5,2) NOT NULL CHECK (freshness BETWEEN 0 AND 100),
  schema_conformance NUMERIC(5,2) NOT NULL CHECK (schema_conformance BETWEEN 0 AND 100),
  lineage NUMERIC(5,2) NOT NULL CHECK (lineage BETWEEN 0 AND 100),
  sample_agreement NUMERIC(5,2) NOT NULL CHECK (sample_agreement BETWEEN 0 AND 100),
  overall NUMERIC(5,2) NOT NULL CHECK (overall BETWEEN 0 AND 100),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_dataset_quality_dataset ON admin_dataset_quality(dataset_id, measured_at DESC);
ALTER TABLE admin_dataset_quality ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_admin_dataset_quality" ON admin_dataset_quality
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### 3.5 — `admin_blockers`

```sql
CREATE TABLE admin_blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  affected_scope TEXT NOT NULL CHECK (affected_scope IN ('demo', 'pilot', 'production')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'waived')) DEFAULT 'open',
  owner_agent TEXT NOT NULL CHECK (owner_agent IN ('steward', 'nexus', 'sentinel', 'atlas')),
  blocker_reason TEXT NOT NULL,
  unblock_steps JSONB DEFAULT '[]'::jsonb,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_admin_blockers_client_status ON admin_blockers(client_id, status);
CREATE INDEX idx_admin_blockers_scope ON admin_blockers(client_id, affected_scope, status);
ALTER TABLE admin_blockers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_admin_blockers" ON admin_blockers
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### 3.6 — `admin_audit_log`

Distinct from existing `audit_log` (021) which is data-mutation-scoped. `admin_audit_log` captures admin-page interaction events (sign-in, role-change, connector-config, etc.) and tenant-readiness state transitions.

```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  actor_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    'auth', 'role_change', 'connector', 'dataset', 'approval',
    'blocker', 'setup_progress', 'readiness_state', 'other'
  )),
  action TEXT NOT NULL,
  target_kind TEXT,
  target_id UUID,
  summary TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_audit_log_client_recent ON admin_audit_log(client_id, created_at DESC);
CREATE INDEX idx_admin_audit_log_category ON admin_audit_log(client_id, category, created_at DESC);
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_admin_audit_log" ON admin_audit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

ADMIN-DATA writes are **out of scope** — this wave only **reads** `admin_audit_log`. Event emission happens in Wave 27 when actions un-gate.

### 3.7 — `admin_setup_progress`

```sql
CREATE TABLE admin_setup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL CHECK (step_id IN (
    'data_trust', 'connectors', 'users_access', 'agent_readiness',
    'production_readiness', 'architecture'
  )),
  status TEXT NOT NULL CHECK (status IN ('done', 'in_progress', 'pending')) DEFAULT 'pending',
  description TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, step_id)
);
CREATE INDEX idx_admin_setup_progress_client ON admin_setup_progress(client_id);
ALTER TABLE admin_setup_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_admin_setup_progress" ON admin_setup_progress
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

`admin_setup_progress` is computed/cached, not source-of-truth. The recomputation function (also out of scope here) reads from `admin_connectors`, `admin_datasets`, `team_memberships`, `admin_blockers` and writes the rolled-up step status.

---

## 4. Adapter contract specs (TypeScript signatures only)

### 4.1 — `src/lib/admin/data/admin-overview-adapter-types.ts`

```typescript
import type { AdminAuditEvent, AdminSetupStep } from './admin-audit-log-adapter-types';

export interface AdminOverviewSnapshot {
  tenant: { slug: string; name: string };
  setupSteps: ReadonlyArray<AdminSetupStep>;
  recentActivity: ReadonlyArray<AdminAuditEvent>;
  crossPageCounts: {
    openBlockers: number;
    datasetsPendingApproval: number;
    connectorsNotConfigured: number;
    invitesPending: number;
    productionReadinessGatesFailing: number;
  };
  generatedAt: string;
}
```

### 4.2 — `src/lib/admin/data/admin-overview-adapter.ts`

```typescript
import { getServerSupabase } from '@/lib/supabase-server';
import type { AdminOverviewSnapshot } from './admin-overview-adapter-types';

export async function getAdminOverviewSnapshot(tenantSlug: string): Promise<AdminOverviewSnapshot>;
export async function getAdminOverviewFixture(tenantSlug?: string): AdminOverviewSnapshot;
```

### 4.3 — `src/lib/admin/data/admin-users-adapter-types.ts`

```typescript
export interface AdminUserRow { /* see Section 2.2 */ }
export interface AdminUserDetail extends AdminUserRow { /* see Section 2.2 */ }
export interface AdminRoleSummary { /* see Section 2.2 */ }
```

### 4.4 — `src/lib/admin/data/admin-users-adapter.ts`

```typescript
export async function getAdminUsers(tenantSlug: string): Promise<ReadonlyArray<AdminUserRow>>;
export async function getAdminUserDetail(tenantSlug: string, userId: string): Promise<AdminUserDetail | null>;
export async function getAdminRoleSummary(tenantSlug: string): Promise<ReadonlyArray<AdminRoleSummary>>;
export function getAdminUsersFixture(): ReadonlyArray<AdminUserRow>;
```

### 4.5 — `src/lib/admin/data/admin-connectors-adapter.ts`

```typescript
export async function getAdminConnectors(tenantSlug: string): Promise<ReadonlyArray<AdminConnectorRow>>;
export async function getAdminConnectorDetail(tenantSlug: string, connectorId: string): Promise<AdminConnectorDetail | null>;
export function getAdminConnectorsFixture(tenantSlug: 'apex-retail' | 'meridian-bank'): ReadonlyArray<AdminConnectorRow>;
```

### 4.6 — `src/lib/admin/data/admin-datasets-adapter.ts`

```typescript
export async function getAdminDatasets(tenantSlug: string): Promise<ReadonlyArray<AdminDatasetRow>>;
export async function getAdminDatasetDetail(tenantSlug: string, datasetId: string): Promise<AdminDatasetDetail | null>;
export async function getAdminDatasetApprovals(tenantSlug: string, status?: AdminDatasetApprovalRow['status']): Promise<ReadonlyArray<AdminDatasetApprovalRow>>;
export async function getAdminDatasetQuality(tenantSlug: string, datasetId: string): Promise<AdminDatasetQuality | null>;
export async function getAdminLoadedFiles(tenantSlug: string): Promise<ReadonlyArray<AdminLoadedFileRow>>;
export function getAdminDatasetsFixture(): ReadonlyArray<AdminDatasetRow>;
```

### 4.7 — `src/lib/admin/data/admin-blockers-adapter.ts`

```typescript
export async function getAdminBlockers(tenantSlug: string, status?: AdminBlockerRow['status']): Promise<ReadonlyArray<AdminBlockerRow>>;
export async function getAdminBlockerDetail(tenantSlug: string, blockerId: string): Promise<AdminBlockerRow | null>;
export function getAdminBlockersFixture(): ReadonlyArray<AdminBlockerRow>;
```

### 4.8 — `src/lib/admin/data/admin-audit-log-adapter.ts`

```typescript
export interface AdminAuditEvent {
  id: string;
  category: 'auth' | 'role_change' | 'connector' | 'dataset' | 'approval' | 'blocker' | 'setup_progress' | 'readiness_state' | 'other';
  action: string;
  actorPersonId: string | null;
  actorDisplayName: string | null;
  targetKind: string | null;
  targetId: string | null;
  summary: string;
  createdAt: string;
}

export async function getAdminAuditEvents(tenantSlug: string, options?: {
  limit?: number;
  category?: AdminAuditEvent['category'];
  since?: string;
}): Promise<ReadonlyArray<AdminAuditEvent>>;

export function getAdminAuditEventsFixture(): ReadonlyArray<AdminAuditEvent>;
```

### 4.9 — `src/lib/admin/data/admin-setup-progress-adapter.ts`

```typescript
export interface AdminSetupStep {
  id: 'data_trust' | 'connectors' | 'users_access' | 'agent_readiness' | 'production_readiness' | 'architecture';
  label: string;
  status: 'done' | 'in_progress' | 'pending';
  description: string;
  computedAt: string;
}

export async function getAdminSetupProgress(tenantSlug: string): Promise<ReadonlyArray<AdminSetupStep>>;
export function getAdminSetupProgressFixture(): ReadonlyArray<AdminSetupStep>;
```

### 4.10 — `src/lib/admin/data/admin-agent-readiness-adapter.ts`

```typescript
export async function getAdminAgentReadiness(tenantSlug: string): Promise<AdminAgentReadinessSnapshot>;
export function getAdminAgentReadinessFixture(): AdminAgentReadinessSnapshot;
```

### 4.11 — `src/lib/admin/data/admin-production-readiness-adapter.ts`

```typescript
export async function getAdminProductionReadiness(tenantSlug: string): Promise<AdminProductionReadinessSnapshot>;
export function getAdminProductionReadinessFixture(): AdminProductionReadinessSnapshot;
```

### Index export

```typescript
// src/lib/admin/data/index.ts
export * from './admin-overview-adapter';
export * from './admin-users-adapter';
export * from './admin-connectors-adapter';
export * from './admin-datasets-adapter';
export * from './admin-blockers-adapter';
export * from './admin-audit-log-adapter';
export * from './admin-setup-progress-adapter';
export * from './admin-agent-readiness-adapter';
export * from './admin-production-readiness-adapter';
```

---

## 5. Migration vs adapter sequencing

Some adapters can be built immediately against existing tables. Some require new migrations first. To avoid serialization, ADMIN-DATA2 ships **adapter contracts plus fixture-mode default**, then page-wiring lanes (DATA3–9) consume the contracts (calling fixture by default). Migrations land in DATA10. After DATA10 merges, the same adapter implementations swap fixture for real DB calls — pages and tests don't change.

### Wave structure

| Slice | Type | Depends on | Complexity | Notes |
|---|---|---|---|---|
| ADMIN-DATA1 | docs | — | M | This audit + wave registration. |
| ADMIN-DATA2 | code | DATA1 | L | Adapter contracts + types + fixture mode. Foundation. Blocks DATA3-9. |
| ADMIN-DATA3 | code | DATA2 | M | `/admin/users-access` consumes adapter (fixture). |
| ADMIN-DATA4 | code | DATA2 | M | `/admin/connectors` consumes adapter (fixture). |
| ADMIN-DATA5 | code | DATA2 | L | `/admin/data-trust` consumes adapter (fixture). |
| ADMIN-DATA6 | code | DATA2 | M | `/admin/agent-readiness` consumes adapter (fixture). |
| ADMIN-DATA7 | code | DATA2 | M | `/admin/build-progress` audit (no adapter; manifest already file-backed; smallest lane). |
| ADMIN-DATA8 | code | DATA2 | M | `/admin/production-readiness` consumes adapter (fixture). |
| ADMIN-DATA9 | code | DATA2 | M | `/admin/architecture` audit (no adapter — concept-only; smallest lane). |
| ADMIN-DATA10 | sql | DATA2 | XL | New admin tables + seed SQL for Apex Retail + Meridian Bank demo continuity. |
| ADMIN-DATA11 | code | DATA10 | L | AGENT1 context bundle source: hardcoded constants → live DB. |
| ADMIN-DATA12 | code | DATA10 | M | ADMIN18 (Overview pull-through) rebuilt against real data. |
| ADMIN-DATA13 | qa | DATA12 | S | Visual + data regression lock. Extends ADMIN19 suite. |

### Parallelization

- **Tier 1:** ADMIN-DATA2 (1 lane, ~1 hour). Foundation; blocks others.
- **Tier 2:** ADMIN-DATA3, DATA4, DATA5, DATA6, DATA7, DATA8, DATA9 (7 parallel lanes, ~30 min each, ~2 hours total with 4-lane orchestration). Each touches its own admin page only — minimal merge conflicts.
- **Tier 2-parallel:** ADMIN-DATA10 (migrations + seed SQL) can run alongside Tier 2 because pages use fixture mode by default; no app dependency on live tables yet.
- **Tier 3:** ADMIN-DATA11, DATA12 (sequential after DATA10 merges; ~1.5 hours combined).
- **Tier 4:** ADMIN-DATA13 (regression lock; ~30 min).

### Sequencing rationale

Adapter contracts FIRST means page-wiring lanes can run in parallel against typed contracts (with fixture data) BEFORE migrations land. Once migrations land in ADMIN-DATA10, the same adapter implementations swap fixture for real DB calls — pages don't change. This is the same pattern that worked for `wave-admin-completion` Tier 2 (ADMIN11–17 all touched their own page-view file).

---

## 6. Backwards compatibility

- **Existing admin pages must continue to render during the migration.** No flicker, no broken routes. ADMIN-DATA3–9 each gate behind a feature flag check: when adapter returns empty/error, fall back to current hardcoded constants. Once DATA10 + DATA11 land cleanly, fallback is removed in DATA13.
- **Test fixtures replace today's hardcoded constants but match exact shape so tests pass.** `getAdminConnectorsFixture('apex-retail')` returns the same 6-connector list as `APEX_DETAIL_SEEDS` today.
- **Demo continuity:** seed SQL (DATA10) ensures Apex Retail demo still shows the same content after switch to real DB. Meridian Bank demo identical.
- **AGENT1 reasoning unchanged at the API surface.** Only the source of context changes from hardcoded constants to DB query (DATA11). The `AgentContextBundle` shape, `generateStewardEditorial` signature, `computeAllPostures` signature, and `buildAgentChoices` signature are all preserved.
- **No URL changes.** `searchParams` contract preserved per ADMIN19 lock.

---

## 7. Hard-gated boundaries (still deferred to Wave 27)

Even with real data flowing in for READ:

- **Write actions stay disabled.** Approve, Reject, Invite, Configure SSO, Test connection, Mark resolved, Suspend, Change role — all render disabled with reason chip per ADMIN10–17 conventions.
- **Live model calls still hard-gated.** Steward / Nexus / Sentinel / Atlas runtime model invocation does not happen in this wave.
- **Audit log writes stay disabled.** `admin_audit_log` is READ-ONLY in this wave. Event emission happens via app-level events later (Wave 27 or dedicated AUDIT-WRITE wave).
- **Live Clerk integration deferred.** ADMIN-DATA3 reads `persons` + `team_memberships` from Supabase; live Clerk users API call defers to Wave 27. Pending invites stay deterministic until then.
- **Production-readiness rollup:** `admin_setup_progress` + `production-readiness` tile state are computed by adapters but never **written back** to drive the `production_ready` flag in `docs/build/production-readiness.json`. That promotion is a manual process and stays so.

---

## 8. Wave plan

| ID | Slice | Type | Depends on | Complexity |
|---|---|---|---|---|
| ADMIN-DATA1 | This audit | docs | — | M |
| ADMIN-DATA2 | Adapter contracts + types + fixture mode | code | DATA1 | L |
| ADMIN-DATA3 | `/admin/users-access` wired | code | DATA2 | M |
| ADMIN-DATA4 | `/admin/connectors` wired | code | DATA2 | M |
| ADMIN-DATA5 | `/admin/data-trust` wired | code | DATA2 | L |
| ADMIN-DATA6 | `/admin/agent-readiness` wired | code | DATA2 | M |
| ADMIN-DATA7 | `/admin/build-progress` audit (manifest-backed) | code | DATA2 | S |
| ADMIN-DATA8 | `/admin/production-readiness` wired | code | DATA2 | M |
| ADMIN-DATA9 | `/admin/architecture` audit (deterministic-only) | code | DATA2 | S |
| ADMIN-DATA10 | Admin tables migrations + Apex/Meridian seed | sql | DATA2 | XL |
| ADMIN-DATA11 | AGENT1 context wired to real DB | code | DATA10 | L |
| ADMIN-DATA12 | ADMIN18 Overview pull-through (real data) | code | DATA10 | M |
| ADMIN-DATA13 | Visual + data regression lock | qa | DATA12 | S |

---

## 9. Risks

- **Schema drift between adapter types and SQL DDL** → mitigated by (a) typed Supabase client casts, (b) zod runtime validation at adapter boundary in DATA2, (c) DATA13 regression compares fixture shape vs live-read shape.
- **Performance on per-page Supabase queries** → batch via `Promise.all` or single join. DATA2 specifies index targets; DATA10 ships matching `CREATE INDEX` statements.
- **Real Clerk users may not have tenant assignments in test environments** → fall back to fixture in dev/test; DATA3 implements detection.
- **Existing tests expect specific hardcoded values** → DATA13 loosens to shape-only assertions where exact-value lock is brittle, but preserves count + key-ID assertions.
- **Migration dependencies on tables that don't exist** → migration order matters. DATA10 migrations are written in a single PR with sequential filenames; CI runs them in order. DATA10 explicitly documents the run order in its slice doc.
- **Demo continuity break** → DATA10 ships seed SQL whose row counts and key columns match today's hardcoded constants for Apex Retail. DATA13 includes a snapshot test: "after seeding, `/admin/connectors?tenant=apex-retail` renders the same 6 connector labels as before."
- **AGENT1 context-bundle silent regression** → DATA11 is gated behind a feature flag so it can be reverted in 1 PR if AGENT1 reasoning changes unexpectedly; DATA13 includes parity test (hardcoded vs DB) in fixture mode.

---

## 10. Out of scope (Wave 27+)

- Write actions: Approve dataset, Invite user, Configure SSO, Test connection, Mark resolved, Suspend user, Change role.
- Live model gateway calls (Steward / Nexus / Sentinel / Atlas runtime).
- Audit-event emission from admin-page interactions.
- Live Clerk users API integration (read-mirror is read-only via Supabase `persons`).
- Per-tenant configuration of `admin_connectors.config_schema` (UI form for filling JSONB).
- Build-progress live CI integration (gh API).
- Per-blocker resolution workflow (state machine for `admin_blockers.status` transitions).
- `admin_setup_progress` recomputation Edge Function (cron / trigger-based).
- Production-readiness automated promotion (`production_ready: true` flag flip).

---

## 11. Effort estimate

- ADMIN-DATA1 (this audit): ~45 min (done).
- ADMIN-DATA2 (adapter contracts + types + fixture mode): ~1 hour.
- ADMIN-DATA3–9 (parallel page wiring, 7 lanes): ~30 min each, ~2 hours total with 4-lane parallelization.
- ADMIN-DATA10 (migrations + seed): ~1.5 hours (7 migrations + seed for two demo tenants + verification).
- ADMIN-DATA11 (AGENT1 wired live): ~1 hour.
- ADMIN-DATA12 (ADMIN18 rebuilt): ~45 min (depth components already exist; just swap data source).
- ADMIN-DATA13 (regression lock): ~30 min.

**Total wave: ~7–8 hours wall-clock with multi-agent parallelization.**

---

## 12. Compliance posture

- No app code touched in this slice.
- No migrations applied (specs only — DATA10 ships them).
- All JSON files updated parse cleanly.
- TSC clean, build clean, hygiene gate 11/11.
- `production_ready` never promoted.
- `wave-admin-data` registered as `planned`.
- ADMIN-DATA2 through ADMIN-DATA13 registered as `backlog`.
