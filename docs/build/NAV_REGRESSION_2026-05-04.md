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
