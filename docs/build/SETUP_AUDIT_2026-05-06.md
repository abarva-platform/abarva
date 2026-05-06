# Setup / Admin Surface Audit · 2026-05-06

| Field | Value |
|---|---|
| **Doc path** | `docs/build/SETUP_AUDIT_2026-05-06.md` |
| **Date** | 2026-05-06 |
| **Author** | Architecture |
| **Status** | Complete — findings actionable |
| **Surface** | Setup / Admin (`/admin`, redirects from `/setup`) |
| **Front agent** | Steward |
| **Design principles applied** | 3-layer agent architecture · workflow-first nav · specialist catalog |

---

## Executive summary

Setup/Admin is architecturally the cleanest surface in the product for agent identity. Steward is correctly named and scoped throughout the spec and existing code. The design document (`SETUP_ADMIN_DATA_VIEW_FAILURE_MODE_DRIVEN_DESIGN.md`) defines Steward's voice register precisely: governance language, control-plane oriented, distinct from the other three agents.

One gap matches the pattern seen in Source (pre-fix), Tower, and Intelligence: **no SETUP_LEAD_AGENT constant**. This was created during this audit session and is the only code fix applied.

The deeper Setup issue is a build-readiness gap, not an agent architecture gap: Setup has no live Steward runtime (all deterministic view models), no wired specialists, and the SET-SPEC wave has not been written. The 3-layer architecture is documented correctly at the design level but has nothing to show at the code level beyond the view models.

---

## M1 · Current state inventory

### Front agent
**Steward** — correctly named in the build spec and all design documentation.

| Source | Agent reference | Status |
|---|---|---|
| `SETUP_BUILD_SPEC.md` §1 | "Setup is the **Steward-led** governance and integration surface" | ✓ Correct |
| `SETUP_ADMIN_DATA_VIEW_FAILURE_MODE_DRIVEN_DESIGN.md` | Steward voice register: governance language, control-plane oriented | ✓ Correct |
| `src/lib/admin/steward-setup-readiness.ts` | File comment: "Steward Setup / Admin control-plane read model" | ✓ Correct |
| `src/lib/admin/constants.ts` (created 2026-05-06) | `SETUP_LEAD_AGENT = 'Steward'` | ✓ Created |
| `src/app/api/chat/agent/route.ts` | `AGENT_VOICE['Steward']` registered | ✓ Correct |

### Routes
Setup canonically lives under `/admin` with a redirect from `/setup`:

| Route | Purpose | Status |
|---|---|---|
| `/setup` | Redirects to `/admin` | Active |
| `/admin` | Setup home / control center | Active |
| `/admin/connectors` | Connector health index | Active (fixture) |
| `/admin/connectors/[connectorId]` | Connector detail + auth | Active (fixture) |
| `/admin/users` | User roster | Active (fixture) |
| `/admin/users-access` | User access policy | Active (fixture) |
| `/admin/policies` | Policy governance | Active (fixture) |
| `/admin/data-trust` | Data trust and provenance | Active (fixture) |
| `/admin/ai-initiatives` | AI initiative registry | Active — wired to Tower feed |
| `/admin/audit` | Audit history | Active (fixture) |
| `/admin/agent-readiness` | Agent readiness matrix | Active |
| `/admin/architecture` | Architecture overview | Active |
| `/admin/reasoning` | Reasoning activity | Active |
| `/admin/invite` | User invitation | Active |
| `/admin/build-progress` | Build progress (internal) | Active |
| `/admin/production-readiness` | Production readiness | Active |
| `/admin/tenant` | Tenant configuration | Active (fixture) |

### API routes

| Route | Purpose |
|---|---|
| `POST /api/setup/initiatives` | Persist AI initiative records |
| `POST /api/admin/upload-dataset` | Dataset upload (25MB limit) |
| `GET /api/admin/evidence-quality-export` | Evidence quality export |
| `POST /api/admin/invite` | User invitation |
| `GET /api/admin/programs` | Program list for admin view |
| `GET /api/admin/users` | User list |
| `GET /api/admin/steward-stats` | Steward health stats |
| `GET /api/admin/production-readiness` | Production readiness data |

### Specialist status

| Specialist | Status | Location |
|---|---|---|
| DataSourceReadinessChecker | planned | — |
| PermissionAuditor | planned | — |
| IntegrationHealthMonitor | planned | — |
| AuditTrailComposer | planned | — |
| GateApprovalRouter | planned | — |

All Setup specialists are `planned`. No live Steward model invocation exists. All data is deterministic view-models or fixture.

---

## M2 · Agent architecture findings

### F-SET-001 · No SETUP_LEAD_AGENT constant (resolved)

**Finding:** Setup had no `SETUP_LEAD_AGENT` constant, matching the pattern found in Source (pre-fix), Tower, and Intelligence.

**Fix applied:** `src/lib/admin/constants.ts` created with `SETUP_LEAD_AGENT = 'Steward'` and `SETUP_PRODUCT_NAME = 'AbarVa Setup'`.

**Status:** Resolved.

---

### F-SET-002 · No live Steward runtime (acknowledged, Wave 2)

**Finding:** Setup/Admin has no live Steward model invocation. All surfaces are deterministic view-models. Unlike the other products, Setup does not even have a chat interface visible to the user — Steward only appears in the universal agent endpoint's voice map.

**This is correct for Wave 1.** The design spec explicitly reserves Steward as the governance-register voice for when the connector layer is live. Running Steward before connectors exist would produce an agent with no grounding.

**Wave 2 trigger:** When at least one connector (e.g., Microsoft Graph for M365 Copilot) is live, Steward should appear on `/admin` with connector health context, permission gap visibility, and integration health monitoring.

**Status:** Design-correct for Wave 1. No code change needed.

---

### F-SET-003 · /setup → /admin redirect naming gap

**Finding:** The product navigation calls this surface "Setup" but all canonical routes are under `/admin`. The redirect at `/setup/page.tsx` bridges the gap.

**Risk:** The `SETUP_LEAD_AGENT` and `SETUP_PRODUCT_NAME` constants use "Setup" as the canonical name. The route uses "admin". This naming divergence is intentional (admin is the protected route tree, setup is the product label) but could cause surface-detection bugs when the universal agent route checks `surface.startsWith('/admin')`.

**Fix (low):** Document in `src/lib/admin/constants.ts` that the setup surface key is `/admin` not `/setup`.

**Priority:** Low — informational only.

---

## M3 · Workflow-first nav findings

### F-SET-101 · Setup is inherently workflow-first

**Finding:** Unlike Tower (which had an agent-canvas-first problem to solve) or Intelligence (J-spine navigation), Setup is already workflow-anchored. Users navigate to connectors, users, policies, data-trust, audit — all workflow nouns. No agent name appears in nav labels.

**Status:** No action needed.

---

### F-SET-102 · AI Initiatives is the one live cross-surface data feed

**Finding:** `/admin/ai-initiatives` is wired to the real setup initiatives API (`/api/setup/initiatives`) and feeds the Tower setup initiatives panel. This is the only Setup route with real persistence (Supabase writes via the initiative registry).

**Observation:** This route is the connective tissue between Setup and Tower. Steward owns the registry; Atlas observes it. When Steward's runtime lands, this route is the first place to wire specialist output — the AI initiative record quality (missing sponsor, unclear baseline, no linked program) directly maps to the `DataSourceReadinessChecker` and `GateApprovalRouter` specialists.

---

## M4 · Specialist catalog gaps

All five Setup specialists are `planned`. Wave 2 priority order:

1. **DataSourceReadinessChecker** — connector health is the Setup product's core value. When a connector goes amber/red, Steward surfaces this. This specialist is the highest-impact first wire.
2. **IntegrationHealthMonitor** — checks adapter status across broker, vector, graph, external APIs; feeds the agent-readiness matrix.
3. **PermissionAuditor** — RBAC gaps and over-privileged accounts; surfaces in `/admin/users-access`.
4. **GateApprovalRouter** — routes gate approval requests; this specialist is cross-cutting (Setup owns the routing, but Nexus triggers gate checks on Programs).
5. **AuditTrailComposer** — compliance-ready audit trail; shared with the cross-product AuditTrailComposer in the Moves catalog.

---

## M5 · Architecture alignment

**Decision (2026-05-06):** Setup's front agent is **Steward**. Steward's voice register is:
- What is configured / what is degraded / what needs re-auth
- What data classes are active / what approval is pending
- Precise, calm, control-plane oriented

**What Steward does NOT do:**
- Program workflow guidance (Nexus)
- Source event advice (Sentinel)
- Portfolio synthesis (Atlas)
- Intelligence pattern validation (Sentinel)

---

## Action items

| # | Finding | Fix | Priority | Status |
|---|---|---|---|---|
| SET-A1 | No SETUP_LEAD_AGENT constant | `src/lib/admin/constants.ts` created | High | **Resolved** |
| SET-A2 | No live Steward runtime | Wait for connector layer (Wave 2) | — | Wave 2 |
| SET-A3 | /setup → /admin naming gap | Document in constants.ts | Low | Open |
| SET-A4 | Specialist wiring | Wire per priority order above in Wave 2 | Low | Wave 2 |
| SET-A5 | SET-SPEC wave not authored | Write `SETUP_BUILD_SPEC_V2.md` per backlog | Medium | Backlog |

---

*End of Setup audit.*
