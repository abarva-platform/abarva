# Track 02 — Page Experience + Shell

_Blueprint authority, active route ownership, TenantShell, AdminShell, secondary sub-nav, legacy retirement._

_Last updated: 2026-04-26 | Wave 21 complete | BLG1_

---

## Purpose

Track 02 owns the shell-level architecture of the Nexus app. This means:

1. **Route ownership map** — which routes exist, who owns them, and what their current status is
2. **Shell components** — TenantShell, AdminShell, TopBar, PrimaryNav
3. **Blueprint compliance** — every route follows the AbarVa page blueprint spec
4. **Secondary sub-nav** — the sticky contextual tab bar used throughout the product
5. **Legacy retirement** — dead code removal (TopBar.tsx, PrimaryNav.tsx when replaced)

The shell is the frame. Every other track (Programs, Source, Intelligence, Tower, Admin) renders inside the shell. Track 02 defines the contract for what the shell provides to each surface.

---

## Blueprint Authority

The AbarVa Page Blueprint spec defines the 4-layer layout for every product page:

```
Layer 1: TopBar (global — AbarVaLogo + user menu)
Layer 2: PrimaryNav (global — tenant switcher + main nav links)
Layer 3: SecondarySubNav (page-specific — section name + tab links)
Layer 4: Content Canvas (page-specific — the actual page content)
```

**Blueprint rules**:
1. Every route renders inside TenantShell or AdminShell — NEVER a bare layout
2. The TopBar is identical on all routes — no per-route modifications
3. PrimaryNav highlights the active top-level section
4. SecondarySubNav is optional — used only on routes with multiple tabs
5. Content canvas starts below all 3 nav layers, never obscured by them

---

## Active Route Ownership Map (16 Routes)

| Route | Shell | Active Nav | Sub-Nav | Track Owner | Status |
|---|---|---|---|---|---|
| `/` | Marketing layout | None | None | Marketing (Track 01 ref) | Working |
| `/tenant/[slug]/programs` | TenantShell | Programs | None | Track 03 | Working |
| `/tenant/[slug]/programs/[programId]` | TenantShell | Programs | 7-tab sub-nav | Track 03 | Working |
| `/tenant/[slug]/source/events/[eventId]` | TenantShell | Source | Hub tabs | Track 04 | Working |
| `/tenant/[slug]/intelligence` | TenantShell | Intelligence | Lens tabs | Track 05 | Working |
| `/tenant/[slug]/tower` | TenantShell | Tower | Lens tabs | Track 05 | Working |
| `/admin` | AdminShell | Setup | None | Track 06 | Working |
| `/admin/setup` | AdminShell | Setup | None | Track 06 | Working |
| `/admin/data` | AdminShell | Data | None | Track 06 | Working |
| `/admin/users` | AdminShell | Users & Access | None | Track 06 | Working |
| `/admin/agents` | AdminShell | Agent Readiness | None | Track 06 | Working |
| `/admin/production-readiness` | AdminShell | Production Readiness | None | Track 06 | Working |
| `/admin/build` | AdminShell | Build Progress | None | Track 06 | Working |
| `/admin/architecture` | AdminShell | Architecture | None | Track 06 | Working |
| `/tenant/meridian/programs` | TenantShell | Programs | None | Track 03 | Working |
| `/tenant/arcturus/programs` | TenantShell | Programs | None | Track 03 | Working |

---

## TenantShell Contract

`TenantShell` is the layout wrapper for all tenant-scoped routes.

```typescript
// src/components/shell/TenantShell.tsx
interface TenantShellProps {
  tenantSlug: string;
  activeSection: 'programs' | 'source' | 'intelligence' | 'tower';
  children: React.ReactNode;
}
```

**What TenantShell provides**:
1. TopBar with AbarVaLogo and user menu
2. PrimaryNav with tenant name, tenant switcher, and section links
3. A content area below the nav layers
4. Proper z-index stacking (nav above content)

**What TenantShell does NOT do**:
- Does not render SecondarySubNav — individual page components do that
- Does not fetch tenant data — parent server component does that
- Does not redirect unauthorized users — middleware handles auth

---

## AdminShell Contract

`AdminShell` is the layout wrapper for all admin routes.

```typescript
// src/components/shell/AdminShell.tsx
interface AdminShellProps {
  activeTab: 'setup' | 'data' | 'users' | 'agents' | 'production-readiness' | 'build' | 'architecture';
  children: React.ReactNode;
}
```

**What AdminShell provides**:
1. TopBar with AbarVaLogo and user menu
2. Admin tab navigation (7 tabs)
3. Content area
4. No tenant switcher (admin is global scope)

---

## SecondarySubNav Pattern

The SecondarySubNav is a Snowflake-style sticky bar that appears below the PrimaryNav. It shows:
- **Left**: current section name (e.g., "CDP Implementation")
- **Right**: tab links for the current page

```typescript
// src/components/shell/SecondarySubNav.tsx
interface SecondarySubNavProps {
  sectionName: string;
  tabs: Array<{
    id: string;
    label: string;
    href: string;
    active: boolean;
  }>;
}
```

**Visual spec**:
- Background: `#FFFFFF` (white) or `#F8F7F4` (warm off-white)
- Border-bottom: `1px solid #E5E5E5`
- Tab text: `14px DM Sans Medium`
- Active tab: black underline `2px`
- Sticky: `position: sticky; top: <PrimaryNav height>px`

**Where SecondarySubNav is used**:

| Route | Sub-Nav Tabs |
|---|---|
| `/tenant/[slug]/programs/[programId]` | Overview, Workshops, Deliverables, Evidence, Intelligence, Missions, Gate |
| `/tenant/[slug]/source/events/[eventId]` | Hub, Vendors, Pricing, Intelligence, Missions, BAFO |
| `/tenant/[slug]/intelligence` | Overview, Patterns, Evidence, Signals |
| `/tenant/[slug]/tower` | Portfolio, Scorecards, Pressure, Executive Brief |

---

## Shell Design Tokens

The shell uses these tokens (defined in `src/lib/design-tokens.ts`):

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#F8F7F4` | Shell background, page canvas |
| `--color-foreground` | `#0A0C12` | Shell text, nav labels |
| `--color-nav-active` | `#0F1E3F` | Active nav item background |
| `--color-nav-hover` | `#1B2B5C` | Nav item hover state |
| `--color-border-subtle` | `#E5E5E5` | Shell separators, sub-nav border |
| `--color-white` | `#FFFFFF` | Cards, panels, sub-nav background |

**Banned tokens** (must not appear in shell components):
- `#14B8A6` (teal) — replaced by `#0F1E3F`
- Any cyan variant — not in design canon
- Any hardcoded hex not in the token list above

---

## Legacy Code Retirement Plan

Several shell-related components from earlier development remain and must be cleaned up in Wave 29 (SHELL8):

| Component | Location | Issue | Action |
|---|---|---|---|
| `TopBar.tsx` (old) | `src/components/legacy/` | Replaced by new shell | Delete |
| `PrimaryNav.tsx` (old) | `src/components/legacy/` | Replaced by TenantShell | Delete |
| `Sidebar.tsx` | `src/components/legacy/` | Never used in current design | Delete |
| Unused CSS vars | `globals.css` | Teal/cyan colors not in design canon | Delete the vars |

**Rule**: Do NOT delete legacy files until a full route smoke test confirms all 16 routes return 200 without them.

---

## Slice Backlog for This Track

| ID | Title | Status | Wave | Notes |
|---|---|---|---|---|
| PX1 | Page Blueprint Architecture | completed | wave-1 | Blueprint contract |
| PX2 | Blueprint Compliance Validator | completed | wave-21 | Validator done |
| SHELL1 | Route Registration + Shell Wiring | completed | wave-20 | Route registration |
| SHELL2 | TenantShell Component | completed | wave-20 | TenantShell done |
| SHELL3 | AdminShell Component | completed | wave-20 | AdminShell done |
| SHELL4 | SecondarySubNav Component | completed | wave-20 | SubNav done |
| SHELL5 | Active Route Highlighting | completed | wave-20 | Nav highlighting |
| SHELL6 | Blueprint Compliance Script | completed | wave-20 | Compliance script |
| SHELL7 | Shell Verification Test Suite | completed | wave-20 | QA28 basis |
| SHELL8 | Legacy Shell Code Retirement | backlog | wave-29 | Dead code cleanup |
| SHELL9 | Route Registry Automation | backlog | wave-29 | Auto-registry |

---

## Per-Slice Specs

### SHELL8 — Legacy Shell Code Retirement (Wave 29)

**Goal**: Remove TopBar.tsx (old), PrimaryNav.tsx (old), Sidebar.tsx, and unused CSS variables.

**Pre-condition**: QA31 (Vercel production smoke test) must pass before starting.

**Files to delete**:
- `src/components/legacy/TopBar.tsx`
- `src/components/legacy/PrimaryNav.tsx`
- `src/components/legacy/Sidebar.tsx`

**Files to modify**:
- `src/app/globals.css` — Remove `--color-teal-*` and `--color-cyan-*` variables

**Acceptance criteria**:
- `npx tsc --noEmit` returns 0 errors after deletions
- All 16 routes return 200 after deletions

---

### SHELL9 — Route Registry Automation (Wave 29)

**Goal**: Auto-generate ROUTE_REGISTRY from the Next.js `app/` directory structure.

**Files to create**:
- `scripts/generate-route-registry.ts`
- `src/lib/routes/registry.generated.ts`

**Acceptance criteria**:
- Generated registry matches manually-maintained one
- Includes all 16 tenant + admin routes

---

## Blueprint Compliance Checklist

Before marking any route-level slice as complete:

- [ ] Route renders inside TenantShell or AdminShell (not bare layout)
- [ ] TopBar shows AbarVaLogo (via AbarVaLogo.tsx — never hand-coded)
- [ ] PrimaryNav highlights the correct active section
- [ ] SecondarySubNav (if applicable) shows correct tabs with correct active state
- [ ] Content canvas starts below all nav layers (no overlap)
- [ ] All nav text uses DM Sans (not Georgia)
- [ ] No hardcoded hex colors in page components
- [ ] No teal, cyan, or sparkle emoji
- [ ] Route returns 200 in smoke test
- [ ] TypeScript compiles with 0 errors
