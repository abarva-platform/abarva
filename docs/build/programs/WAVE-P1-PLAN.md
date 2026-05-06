# Programs Wave P1 Plan

**Status:** ✅ Shipped 2026-05-06  
**Model class:** Sonnet (routine)

## Scope

- Catalog entries: canonical Programs route family plus legacy wrapper/deprecation layer
- Fix: `/programs/patterns` — convert from unstyled client component to server component with AppShell
- Fix: preview routes double-hop (`/preview/programs/**` → legacy → canonical → now direct)
- Out of scope: portfolio redesign, detail content changes, new governance UI, deliverables/evidence routes

## File-level diffs

| File | Action | Lines |
|---|---|---|
| `src/app/programs/patterns/page.tsx` | Rewrite: client→server component, AppShell + SHELL tokens + metadata | ~140 |
| `src/app/(maestro)/preview/programs/page.tsx` | Fix: double-hop → single redirect to `/programs` | ~10 |
| `src/app/(maestro)/preview/programs/[programSlug]/page.tsx` | Fix: double-hop → direct redirect via `resolveSeedProgramContext` | ~25 |

## Route family audit (complete)

### Canonical `/programs/**`

| Route | Status | Notes |
|---|---|---|
| `/programs` | ✅ | AppShell via ProgramsIndexPage |
| `/programs/[id]` | ✅ | AppShell via ProgramDetailPage |
| `/programs/new` | ✅ | ProgramOriginationWorkspace |
| `/programs/patterns` | ✅ Fixed P1 | Was unstyled client component |
| `/programs/compare` | Standalone | AppShell wrap deferred P3 |
| `/programs/[id]/report` | Standalone (print) | Intentional |

### Legacy `/tenant/[tenantSlug]/programs/**`

| Route | Status |
|---|---|
| `/tenant/[slug]/programs` | ✅ Redirects to `/programs` |
| `/tenant/[slug]/programs/[slug]` | ✅ Redirects to `/programs/[slug]` |
| `/tenant/[slug]/programs/[slug]/phase/[N]` | ✅ Redirects to `/programs/[slug]?phase=N` |
| `/tenant/[slug]/programs/[slug]/deliverables/[code]` | 🔒 PROG-P1 FREEZE (→ P7) |
| `/tenant/[slug]/programs/[slug]/evidence/[id]` | 🔒 PROG-P1 FREEZE (→ P7) |

### Preview `/(maestro)/preview/programs/**`

| Route | Pre-P1 | Post-P1 |
|---|---|---|
| `/preview/programs` | Double-hop via legacy | Direct → `/programs` |
| `/preview/programs/[slug]` | Double-hop via legacy | Direct → `/programs/[slug]` |

## Knowledge fabric contract changes

None. No data layer, query, or mutation changes.

## Test plan

- `P-SMOKE-CDP` must run on canonical `/programs/**` only — unchanged
- Legacy routes wrap or redirect — all confirmed

## Risk & mitigation

- Patterns page conversion: low risk (in-memory mock, no IO)
- Preview redirect simplification: very low risk (same destination, fewer hops)
- Deliverables/evidence routes preserved as-is (frozen)

## Auto-approval claim

Eligible: no route family expansion, no data layer changes, typecheck clean, no legacy escalation triggers fired.
