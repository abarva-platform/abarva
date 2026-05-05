<<<<<<< cursor/nav-regression-diagnosis-ac9d
# Nav Regression — Strategic Moves renders wrong nav

**Filed:** 2026-05-04  
**Severity:** Visual regression, production  
**Status:** Diagnosed — awaiting greenlight to fix

---

## Summary

Strategic Moves (`/strategic-moves`, `/strategic-moves/[moveId]`, `/strategic-moves/new`) renders `AbarvaNav` — a Fraunces-styled, compact nav bar with tenant chip, ⌘K hint, and avatar (no Sign out button). Every other authenticated surface (Tower, Source, Intelligence, Home) renders `AppTopBar` inside `AppShell` — the standard Inter-font cockpit nav with full module links, user identity, and Sign out button.

---

## Which file is rendering the wrong nav

**`src/components/chrome/MaestroChrome.tsx`**

`MaestroChrome` has a pass-through list (`SHELL_SURFACE_PREFIXES`) for routes whose pages render `AppShell` + `AppTopBar` themselves. Those routes bypass `AbarvaNav`:

```ts
const SHELL_SURFACE_PREFIXES = [
  '/admin',
  '/home',
  '/tower',
  '/source',
  '/intelligence',
  '/learn',
  '/product',
] as const;
```

`/strategic-moves` is **not** in this list. As a result, `MaestroChrome` wraps Strategic Moves pages in:

```tsx
<div style={{ minHeight: '100vh', background: '#F7F2EA', color: '#171412' }}>
  <nav aria-label="Primary"><AbarvaNav activePage={activePage} /></nav>
  <main id="main-content">{children}</main>
</div>
```

Additionally, the Strategic Moves page components (`StrategicMovesHomeClient`, `StrategicMoveDetailView`, `StrategicMoveOriginateClient`) do **not** render `AppShell` themselves — they render content directly, relying entirely on whichever chrome the layout provides.

---

## Which file should be rendering instead

**`src/components/shell/AppTopBar.tsx`** via **`src/components/shell/AppShell.tsx`**

This is what Tower, Source, Intelligence, and Home all use. Their page-level components (e.g., `TowerIndexPage`, `SourcePortfolioPage`) wrap content in `<AppShell>`, which renders `AppTopBar` — the correct global nav with Inter font, full module links (Home, Setup, Moves, Source, Intelligence, Tower, Learn, Product), user avatar + name, and Sign out button.

---

## Mechanism of the divergence

The architecture has two nav paths:

| Path | Renders | Used by |
|------|---------|---------|
| `MaestroChrome` → `AbarvaNav` | Fraunces wordmark, compact module links, tenant chip, ⌘K, avatar dropdown (no Sign out at top level) | Any `(maestro)` route **not** in `SHELL_SURFACE_PREFIXES` |
| Page → `AppShell` → `AppTopBar` | Inter brand text, full cockpit nav, avatar + Sign out button | Tower, Source, Intelligence, Home, Learn, Product, Admin |

Strategic Moves falls through to `AbarvaNav` because:
1. Its route `/strategic-moves` is not in `SHELL_SURFACE_PREFIXES`
2. Its page components don't render `AppShell`

---

## Which commit introduced the regression

The divergence is the result of two gaps compounding:

### Gap 1: `SHELL_SURFACE_PREFIXES` never included `/strategic-moves`

**Commit `51786ab3`** — `feat(shell): patch MaestroChrome + AppRail for shell-native surfaces (#484)` — introduced the pass-through mechanism on 2026-04-27. It listed `/admin`, `/tower`, `/source`, `/intelligence`. Strategic Moves didn't exist yet, so it wasn't included.

When Strategic Moves was later added (2026-05-03), it was moved under `(maestro)` in commit `7e6660ac` to inherit `AppChrome` — but nobody added `/strategic-moves` to the prefix list nor wired `AppShell` into the page components.

### Gap 2: Strategic Moves pages never adopted `AppShell`

**Commit `a338229b`** — `feat(strategic-moves): implement v0.2 schema and new strategic moves surfaces` — created the page components rendering content directly (no `AppShell` wrapper). All subsequent PRs (PR-1 #1500, PR-2 #1502, PR-3 #1503) refined styling and tokens but never introduced `AppShell`.

### Causal PR

The regression became visible with **PR-1 (#1500)** `fix(strategic-moves): load brand and canon design tokens at maestro layout` (commit `95616c1b`, 2026-05-04) and **PR-2 (#1502)** `fix(strategic-moves): restore PR-2 pixel-match commits to main` (commit `14670d10`, 2026-05-04). These PRs pixel-matched the prototype HTML — which drew its own nav for design completeness — into production components. The prototype's nav HTML (`14-strategic-moves-home.html`, lines 385–396) was a design-time affordance that should have been discarded, per INTEGRATION.md's intent: "Authenticated app navbar, sits between Programs and Control Tower" (i.e., reuse the existing nav, don't draw a new one).

---

## Proposed fix

Two-part fix, either of which alone would work, but both together is cleanest:

### Option A: Add `/strategic-moves` to pass-through list + wrap pages in `AppShell` (recommended)

1. **`src/components/chrome/MaestroChrome.tsx`** — Add `'/strategic-moves'` to `SHELL_SURFACE_PREFIXES`:

   ```ts
   const SHELL_SURFACE_PREFIXES = [
     '/admin',
     '/home',
     '/tower',
     '/source',
     '/intelligence',
     '/learn',
     '/product',
     '/strategic-moves',   // ← add
   ] as const;
   ```

2. **`src/components/strategic-moves/StrategicMovesHomeClient.tsx`** — Wrap the returned JSX in `<AppShell surface="programs" showProductNav>`.

3. **`src/components/strategic-moves/StrategicMoveDetailView.tsx`** — Same `<AppShell>` wrapper.

4. **`src/components/strategic-moves/StrategicMoveOriginateClient.tsx`** — Same `<AppShell>` wrapper.

5. **`src/components/shell/AppTopBar.tsx`** — Update the `programs` nav item's `match` function to also match `/strategic-moves`:

   ```ts
   match: (pathname) =>
     pathname === '/programs' ||
     pathname.startsWith('/programs/') ||
     pathname === '/engagements' ||
     pathname.startsWith('/engagements/') ||
     pathname === '/strategic-moves' ||
     pathname.startsWith('/strategic-moves/') ||
     (pathname.startsWith('/tenant/') && pathname.includes('/programs')),
   ```

### Option B (minimal): Skip `AppShell`, just swap `AbarvaNav` for pass-through

If wrapping in `AppShell` introduces layout conflicts with the existing strategic-moves CSS module layout, the minimal fix is:

1. Add `'/strategic-moves'` to `SHELL_SURFACE_PREFIXES` in `MaestroChrome.tsx`
2. Render `<AppTopBar showProductNav />` at the top of each strategic-moves page component (before existing content)
3. Update the `programs` match function in `AppTopBar.tsx` as above

---

## Files to modify

| File | Change |
|------|--------|
| `src/components/chrome/MaestroChrome.tsx` | Add `'/strategic-moves'` to `SHELL_SURFACE_PREFIXES` |
| `src/components/strategic-moves/StrategicMovesHomeClient.tsx` | Wrap in `<AppShell>` |
| `src/components/strategic-moves/StrategicMoveDetailView.tsx` | Wrap in `<AppShell>` |
| `src/components/strategic-moves/StrategicMoveOriginateClient.tsx` | Wrap in `<AppShell>` |
| `src/components/shell/AppTopBar.tsx` | Extend `programs` item match to include `/strategic-moves` |

---

## Verification

After fix, confirm:
- `/strategic-moves` renders `AppTopBar` (Inter font, Sign out visible, "Moves" tab active)
- `/tower`, `/source`, `/intelligence` still render `AppTopBar` (no double nav)
- `/strategic-moves/[moveId]` and `/strategic-moves/new` also get `AppTopBar`
- No duplicate nav bars on any surface
=======
# Strategic Moves — Nav regression diagnosis (2026-05-04)

## Symptom

Clicking Strategic Moves replaces the global nav (`AppTopBar`) with a
different nav component (`AbarvaNav`). All other authenticated surfaces
(Tower, Source, Intelligence, Home, Programs) render the standard
global nav. Strategic Moves is the only outlier.

Violates `docs/design/strategic-moves/INTEGRATION.md`:
> "Don't redesign the global AbarVa nav — assume it's there, don't draw it."

## Root cause

### Which file renders the wrong nav

`src/components/chrome/MaestroChrome.tsx` — the `AbarvaNav` component
(lines 32–38). This is the nav component rendered for any route NOT
listed in `SHELL_SURFACE_PREFIXES`.

### Which file should render instead

Shell-native surfaces (Tower, Source, Intelligence, Home) are listed in
`SHELL_SURFACE_PREFIXES` (lines 9–17). For these routes, `MaestroChrome`
passes through (`<>{children}</>`) and each page wraps itself in
`<AppShell>` which renders `<AppTopBar>` — the standard global nav.

`/strategic-moves` is **not** in `SHELL_SURFACE_PREFIXES`. So
`MaestroChrome` wraps it in `<AbarvaNav>` instead.

### The two nav components

| Component | File | Used by |
|---|---|---|
| `AbarvaNav` | `src/components/AbarvaNav.tsx` | `MaestroChrome` fallback (engagements, platform, strategic-moves) |
| `AppTopBar` | `src/components/shell/AppTopBar.tsx` | `AppShell` (Tower, Source, Intelligence, Home, Admin) |

`AbarvaNav` is a standalone nav bar with Fraunces-styled links, inline
`⌘K` hint, and avatar-only user menu (no sign-out button visible
without clicking the avatar).

`AppTopBar` is the standard global nav with Inter font, product tabs,
identity display, and sign-out.

### Which commit introduced the divergence

The divergence is an **omission**, not an introduction:

1. **`51786ab3`** (`feat(shell): patch MaestroChrome + AppRail for shell-native surfaces (#484)`)
   Added `SHELL_SURFACE_PREFIXES` with `/admin`, `/tower`, `/source`,
   `/intelligence`. Strategic Moves didn't exist yet.

2. **`7e6660ac`** (`fix(strategic-moves): inherit maestro shell to restore canonical nav/account`)
   Moved `/strategic-moves` into the `(maestro)` route group to inherit
   `MaestroChrome`. But did NOT add `/strategic-moves` to
   `SHELL_SURFACE_PREFIXES`, and the page components were not wrapped in
   `<AppShell>`. Result: `MaestroChrome` renders `AbarvaNav` for these
   routes.

3. **`82c54330`** (`feat(home): HOM-IDX-DEFAULT (#496)`)
   Added `/home` to the prefix list. `/strategic-moves` still omitted.

**No PR ported the design reference HTML nav into the app layout.** The
divergence is simply that Strategic Moves routes get `AbarvaNav`
(the `MaestroChrome` default) while every other surface gets
`AppTopBar` (via `AppShell`).

### Was the design reference nav illustrative-only?

Yes. `INTEGRATION.md` explicitly states the nav in the design reference
HTML (`14-strategic-moves-home.html`) is illustrative. The deployed
surface must use the existing global nav, not recreate it.

## Fix plan

1. Add `'/strategic-moves'` to `SHELL_SURFACE_PREFIXES` in
   `MaestroChrome.tsx` so `MaestroChrome` passes through for these
   routes (just like Tower, Source, etc.).

2. Wrap each Strategic Moves page component in `<AppShell>` to get the
   standard `AppTopBar` nav:
   - `StrategicMovesHomeClient.tsx` → `<AppShell surface="programs">`
   - `StrategicMoveDetailView.tsx` → `<AppShell surface="programs-detail">`
   - `StrategicMoveOriginateClient.tsx` → `<AppShell surface="programs">`

3. Verify: navigating between Strategic Moves and Tower/Source/Programs
   should show no visible nav change.
>>>>>>> main
