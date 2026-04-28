# ADM6 · Users & Access Surface

Slice ID: ADM6
Slice name: Users & Access Surface
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (Lane G)

First Admin Users & Access surface that lifts the user-facing posture
out of the Steward brief without claiming any live auth runtime. The
surface is calm, Apple-like, and follows the AbarVa Visual Canon
(DES1) — every token comes from `@/lib/design/abarva-theme`. Read-only
and roles-only — **no real person names**, no live auth mutation, no
Clerk runtime read, no DB write, no API call.

## What changed

- New view helper
  [src/lib/admin/users-access-readiness.ts](../../../src/lib/admin/users-access-readiness.ts):
  - Public types: `UsersAccessRole`, `UsersAccessHealth`, `RiskySeverity`,
    `UserRoleSeed`, `TenantAccessPosture`, `ProgramAccessPosture`,
    `PendingInvitePlaceholder`, `RiskyPermissionFlag`,
    `UsersAccessSummary`, `UsersAccessReadinessView`.
  - Public helpers:
    - `buildUsersAccessReadinessView()` — composes the deterministic
      view from the seed.
    - `summarizeUsersAccess(view)` — totals + role-distribution
      sentence (e.g. "3 maestros, 2 sponsors").
    - `listRiskyPermissionFlags(view)` — flags ordered by severity
      (high → medium → low), stable on id.
  - Static seed of 7 canonical roles in canonical order:
    `platform_admin, tenant_admin, maestro, sponsor, investor,
    steward, observer`.
  - 3 tenant access postures (AbarVa Platform, Apex Retail, Meridian).
  - 4 program access postures anchored on the Apex Retail demo seed.
  - 1 pending-invite placeholder ("0 pending — invite system not
    wired").
  - 3 risky permission flags (medium · medium · low).
  - `createdFrom: 'deterministic_users_access_readiness_seed'`.
  - No `Date.now`, `Math.random`, `new Date(`, `fetch(`, no model
    providers, no auth / source / sentinel / atlas / nexus / agent
    imports.

- New component
  [src/components/admin/UsersAccessSurface.tsx](../../../src/components/admin/UsersAccessSurface.tsx):
  - **Server component** (no `'use client'`, no React hooks).
  - **All design tokens from `@/lib/design/abarva-theme`** — `COLORS`,
    `FONT`, `BORDER`, `RADIUS`, `SPACING`, `TYPE`. No local hex
    literals; no local `'DM Sans'` font literal.
  - Imports the `AgentBadge` AbarVa primitive for the Steward
    guidance label.
  - Eyebrow: `USERS & ACCESS · ADM6` (mono uppercase, 0.14em).
  - Title (h2 from `TYPE`): "Users & access posture".
  - Calm `auto-fit minmax(280px, 1fr)` grid:
    - Role inventory (counts by role, no names).
    - Tenant access posture summary.
    - Program access posture summary.
    - Pending invites placeholder.
    - Risky permission flags (severity pill + reason + suggested
      review).
    - Steward guidance block with `AgentBadge(agent="steward")` and
      three disabled future actions: Edit / Invite / Revoke — each
      labeled `future · not yet wired`.
  - Footer caption: "Source · deterministic users-access readiness
    seed · no live auth mutation".
  - Calm / Apple-like — no decorative emoji, no heavy borders, no
    large icons.

- New tests
  [src/__tests__/integration/admin/users-access-surface.test.ts](../../../src/__tests__/integration/admin/users-access-surface.test.ts):
  Covers
  - View determinism + canonical role coverage (all 7 roles).
  - Risky permission flags surfaced + severity ordering.
  - `summarizeUsersAccess` totals + role-distribution sentence
    invariants (no real person names).
  - No live mutation claim — regex on serialized output blocks
    "edit user", "inviting", "revoking", "user created", "user
    deleted" and asserts that any "invite" mention is annotated as
    deferred / not wired.
  - No real person names in serialized output (no
    `^[A-Z][a-z]+ [A-Z][a-z]+$` pair outside an explicit allow-list of
    canonical labels like `Apex Retail`).
  - **Canon hygiene assertions on `UsersAccessSurface.tsx`:** imports
    from `@/lib/design/abarva-theme`; no local hex literals (regex);
    no local `'DM Sans'` font literal (regex); no `'use client'`; no
    React hooks (`useState`, `useEffect`, `useMemo`, `useReducer`,
    `useCallback`); no Clerk import; renders the canonical eyebrow and
    footer; renders the disabled future verbs.
  - Module hygiene on the readiness view helper: no `Date.now`,
    `Math.random`, `new Date(`, `fetch(`, no anthropic / openai imports,
    no auth / source / sentinel / atlas / nexus / agent imports.

## What is deterministic today

- The view is byte-equal across repeated calls.
- All 7 canonical roles appear (test enforced).
- `summarizeUsersAccess` totals reconcile against the role-count sum.
- `listRiskyPermissionFlags` orders by severity.
- The serialized view never claims a live "edit user", "invite", or
  "revoke" verb in active voice (test enforced).
- No real person names appear in the serialized view (test enforced
  via a `^[A-Z][a-z]+ [A-Z][a-z]+$` regex with an allow-list of
  canonical labels).

## What is NOT yet wired

- **No live Clerk read.** The surface does not query Clerk; counts
  come from the deterministic seed.
- **No invite API.** Pending invites is `0` honestly; the placeholder
  caption reads "invite system not wired".
- **No permission editor.** Edit / Invite / Revoke render as disabled
  pills labeled `future · not yet wired`.
- **No DB write.** No mutation, no audit ledger entry, no PII.

## Admin page mount · deferred (intentional)

The existing
[src/app/(maestro)/platform/admin/page.tsx](../../../src/app/(maestro)/platform/admin/page.tsx)
is a complex client-rendered admin portal with its own sidebar, rail,
and 14 sub-views (Production Readiness Tracker, Build Progress, Quality
Ops, Maestros, Approvals, etc.). Lane G evaluated adding a mount and
elected **not to modify the page** in this slice to:

- Preserve the existing client-rendered Production Readiness Tracker
  and Build Progress wiring.
- Avoid co-mounting a server component inside an existing
  `'use client'` boundary, which would either require the parent to
  drop the directive or wrap the new surface in a client shim — both
  expand blast radius beyond the ADM6 scope.
- Keep the page's existing role gating (admin email allowlist + Clerk
  metadata) untouched.

The mount is therefore deferred to a follow-up slice (ADM6.1) that can
either add a dedicated `/platform/admin/users-access` route (server
component) or carefully refactor the parent to a server-shell pattern.
The new component is exported from `src/components/admin/UsersAccessSurface.tsx`
and is ready for either path.

## Honest fallbacks used

- Pending invites surface is `0 pending — invite system not wired`,
  not a fake invite count.
- Future actions render as disabled `future · not yet wired` pills,
  not interactive buttons.
- Sponsor-missing programs are flagged as `sponsor · missing`, not
  silently rendered as ready.
- Tenant isolation is reported per-tenant via an `isolation · intact`
  monospaced chip; the test seed asserts intact across all tenants
  matching the S7 probe baseline.
- Risky permission flags surface their severity, reason, and a
  suggested review; the suggested review is read-only.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/admin/users-access-surface.test.ts` — pass
- `npm run build` — pass

## Status

Code complete. Pending founder review. Local commit only — no push,
no merge, no PR per Lane G dispatch.
