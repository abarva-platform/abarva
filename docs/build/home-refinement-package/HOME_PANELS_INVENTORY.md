# Home Panels Inventory

**The 8 panels under Home.** Each panel has a job, a route, an audience signal, and a brief description.

---

## Panel inventory · ordered as they should appear in Home landing layout

### 1. Overview · `/home` (or `/home/overview`)

**Job:** First thing a user sees. Orient them to what's here. Status of the tenant. What needs attention.

**Audience signal:** Everyone (CFO, CIO, CSO, analyst, IT admin)

**Source:** Setup Redesign Package PR-A. Compressed Overview from 7 sections to 4 blocks (status / orientation / action queue / activity).

**No change in this package** — keeps current design from Setup Redesign Package.

---

### 2. Data Trust · `/home/data-trust`

**Job:** Provenance. What data is loaded. Where it came from. When refreshed. Trust ladder. Substrate completeness.

**Audience signal:** Admin, analyst (CXOs may glance but won't dwell)

**Source:** Setup Redesign Package PR-B. Absorbed Overview's substrate content + new blocks.

**No change in this package** — keeps current design.

---

### 3. AI Initiatives · `/home/ai-initiatives`

**Job:** The canonical inventory of AI initiatives running across the tenant. By Business Goal / By Category / All Initiatives views. Per-initiative detail with 7 tabs (Overview / KPIs / Stakeholders / Decisions / Vendors / Scenarios / Provenance).

**Audience signal:** CXO + admin (this is the most CXO-facing panel)

**Source:** AI Initiatives Substrate Package v1.1.

**No change in this package** — only route change from `/setup/ai-initiatives` to `/home/ai-initiatives`.

---

### 4. Agent Readiness · `/home/agent-readiness`

**Job:** Confirm agents (Sentinel · Atlas · Nexus · Steward) are wired correctly, have access to substrate, respond to test prompts. Engineering vs admin gap separation.

**Audience signal:** Admin, analyst (engineers / IT)

**Source:** Setup Redesign Package PR-C. Matrix as page hero + per-agent rail + eng/admin gap split.

**No change in this package** — keeps current design.

---

### 5. Connectors · `/home/connectors`

**Job:** Manage integrations (Google Drive, Slack, Asana, ServiceNow, etc.). Connection state, refresh schedules, scopes.

**Audience signal:** Admin only

**Source:** Existing surface from before Setup Redesign Package. Not touched in current packages.

**No change in this package.**

---

### 6. Tenant Profile · `/home/tenant-profile`

**Job:** Tenant context — industry, size, named CXOs, strategic context, vertical-specific notes.

**Audience signal:** Admin (CXOs may verify their context is right but rarely edit)

**Source:** Existing surface. Not touched in current packages.

**No change in this package.**

---

### 7. Configuration · `/home/configuration`

**Job:** Platform configuration that doesn't fit elsewhere — feature flags, integration secrets, compliance settings, audit log access.

**Audience signal:** Admin only (lowest CXO interest)

**Source:** Existing surface. Not touched in current packages.

**No change in this package.**

---

### 8. Learn · `/home/learn` ★ NEW IN THIS PACKAGE

**Job:** Product info, training, doctrine reference, glossary, agent explanations, quickstart for first-time tenant admins.

**Audience signal:** Everyone (especially new users; CXO-friendly)

**Source:** This package — shell only. Content fills in via follow-up Learn Content Package.

**Detail:** See LEARN_PANEL_SHELL.md for structure.

---

## Layout suggestion · Home landing

The Home landing page (`/`) shows a card grid of all 8 panels, with Overview content prominent at the top:

```
┌────────────────────────────────────────────────────────────────────┐
│ Home · Meridian Health                                              │
│ M. Castillo · CFO                                          [search] │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ OVERVIEW (the existing 4-block compressed Overview from PR-A)      │
│ - Status                                                           │
│ - Orientation                                                      │
│ - Action queue                                                     │
│ - Recent activity                                                  │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ EXPLORE                                                            │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│ │ AI           │ │ Data Trust   │ │ Agent        │                │
│ │ Initiatives  │ │              │ │ Readiness    │                │
│ │              │ │              │ │              │                │
│ │ 7 inits      │ │ 23 segments  │ │ 4 agents     │                │
│ │ $11.9M       │ │ HIGH conf    │ │ all ready    │                │
│ └──────────────┘ └──────────────┘ └──────────────┘                │
│                                                                    │
│ CONFIGURE                                                          │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│ │ Connectors   │ │ Tenant       │ │ Configuration│                │
│ │              │ │ Profile      │ │              │                │
│ │ 5 connected  │ │ Health · 8H  │ │ 12 settings  │                │
│ └──────────────┘ └──────────────┘ └──────────────┘                │
│                                                                    │
│ LEARN                                                              │
│ ┌──────────────┐                                                   │
│ │ Learn ★ NEW  │                                                   │
│ │              │                                                   │
│ │ Product info │                                                   │
│ │ Doctrine ref │                                                   │
│ │ Glossary     │                                                   │
│ └──────────────┘                                                   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

Three groups: **Explore** (operational, daily use), **Configure** (admin, periodic), **Learn** (orient, on-demand). Visual grouping makes the surface less overwhelming.

The grouping is also a soft role-segmentation hint — Explore is everyone, Configure is admin, Learn is everyone. Future role logic can collapse the Configure group entirely for non-admin users.

---

## Panel metadata · per ROLE_READINESS_DOCTRINE.md

Each panel carries this metadata structure (informational only today, enforced when role logic ships):

```typescript
type PanelMetadata = {
  id: string;
  label: string;
  route: string;
  group: 'explore' | 'configure' | 'learn';
  visibleToRoles: Role[];  // metadata only
  description: string;
  icon?: string;
};

const HOME_PANELS: PanelMetadata[] = [
  {
    id: 'overview',
    label: 'Overview',
    route: '/home',
    group: 'explore',
    visibleToRoles: ['admin', 'cxo', 'analyst', 'end_user'],
    description: 'Tenant status and what needs attention',
  },
  {
    id: 'data-trust',
    label: 'Data Trust',
    route: '/home/data-trust',
    group: 'explore',
    visibleToRoles: ['admin', 'analyst'],
    description: 'Data provenance and substrate completeness',
  },
  {
    id: 'ai-initiatives',
    label: 'AI Initiatives',
    route: '/home/ai-initiatives',
    group: 'explore',
    visibleToRoles: ['admin', 'cxo', 'analyst'],
    description: 'AI initiative inventory across the tenant',
  },
  {
    id: 'agent-readiness',
    label: 'Agent Readiness',
    route: '/home/agent-readiness',
    group: 'explore',
    visibleToRoles: ['admin', 'analyst'],
    description: 'Agent state and substrate access verification',
  },
  {
    id: 'connectors',
    label: 'Connectors',
    route: '/home/connectors',
    group: 'configure',
    visibleToRoles: ['admin'],
    description: 'Manage integrations and data sources',
  },
  {
    id: 'tenant-profile',
    label: 'Tenant Profile',
    route: '/home/tenant-profile',
    group: 'configure',
    visibleToRoles: ['admin'],
    description: 'Tenant context and named CXOs',
  },
  {
    id: 'configuration',
    label: 'Configuration',
    route: '/home/configuration',
    group: 'configure',
    visibleToRoles: ['admin'],
    description: 'Platform settings and feature flags',
  },
  {
    id: 'learn',
    label: 'Learn',
    route: '/home/learn',
    group: 'learn',
    visibleToRoles: ['admin', 'cxo', 'analyst', 'end_user'],
    description: 'Product info, doctrine, glossary',
  },
];
```

---

## What this looks like for non-admin users (future)

When role-based segmentation ships:

**End-user view** (e.g., a clinical informaticist at Meridian):
```
EXPLORE: Overview · AI Initiatives
LEARN: Learn
```
(Data Trust, Agent Readiness hidden; Configure group entirely hidden)

**Analyst view:**
```
EXPLORE: Overview · Data Trust · AI Initiatives · Agent Readiness
LEARN: Learn
```
(Configure group hidden)

**Admin view (today's everyone view):**
```
EXPLORE: Overview · Data Trust · AI Initiatives · Agent Readiness
CONFIGURE: Connectors · Tenant Profile · Configuration
LEARN: Learn
```

**CXO view** (CFO, CIO, CSO, CEO):
```
EXPLORE: Overview · AI Initiatives
LEARN: Learn
```
(Data Trust available but de-emphasized; Configure entirely hidden)

The metadata above makes these flips one-line filters when role logic lands.

---

## Acceptance criteria

```
✓ All 8 panels accessible from Home landing
✓ Overview is the prominent / default content
✓ Panels grouped visually as Explore / Configure / Learn
✓ Each panel has visibleToRoles metadata (informational; not enforced)
✓ Routes match HOME_PANELS_INVENTORY routes column
✓ Old /setup/{panel} routes 301-redirect to /home/{panel}
✓ Browser-Chrome verification: each panel reachable, no broken links
```

---

## What's NOT a Home panel

For clarity, these are NOT panels under Home. They're separate top-nav surfaces:

- Intelligence (separate)
- Strategic Moves / Moves (separate)
- Source (separate)
- Tower (separate)

And these are NOT panels at all (they may exist as routes but aren't panel-grade):

- Maestro (if exists, demoted to admin-only / hidden)
- Past `/dashboard` if exists (replaced by Home Overview)
- User profile / settings (in user menu, not nav)
- Auth / login pages (separate flow)
