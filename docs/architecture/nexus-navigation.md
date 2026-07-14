# NEXUS Navigation Contract

## Purpose

The authenticated product shell uses a single reusable top navigation component:

`src/components/navigation/NexusTopNav.tsx`

AbarVa remains the company brand. NEXUS is the product/platform brand. Tenant,
client, demo, workspace, and environment names do not appear in the global brand
area.

## Canonical Global Navigation

| Label | Route | Notes |
| --- | --- | --- |
| Knowledge | `/home` | Route stays `/home`; label changes from Home to Knowledge. |
| Intelligence | `/intelligence` | Existing module route. |
| Moves | `/strategic-moves` | Existing route retained. |
| Source | `/source` | Existing module route. |
| Tower | `/tower` | Existing module route. |
| Learn | `/home/learn` | Existing Learn route moved into primary navigation. |

The reusable registry is `src/components/shell/topbar-nav-items.ts`.

## Mounted Import Points

| Surface | Import | Status |
| --- | --- | --- |
| Authenticated AppShell | `@/components/navigation/NexusTopNav` | Canonical |
| `/home/learn` explicit shell | `@/components/navigation/NexusTopNav` | Canonical |
| `AppTopBar` | re-export shim | Back-compat only |
| `AppTopBarBlack` | re-export shim | Back-compat only |

Public marketing navigation and investor/demo public pages remain separate from
the authenticated product shell.

## Visual Rules

- Height: 72px.
- Brand lockup: `/brand/nexus/abarva-nexus-navbar-dark-32h.svg`.
- Active nav item: white, bold, blue-to-purple underline.
- Inactive nav item: muted gray with near-white hover.
- Mobile/narrow widths: primary navigation collapses into a keyboard-operable
  menu while keeping the brand lockup protected.

## Guardrails

Run:

`npm run audit:nexus-navigation`

This verifies that the authenticated shell imports `NexusTopNav`, the legacy
shims remain shims, the six canonical labels and routes are present, and legacy
tenant/client/demo strings do not return to the canonical nav component.
