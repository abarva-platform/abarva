# ADMIN8 — Admin Single Source of Truth

**Wave:** wave-admin-redesign-followup
**Status:** code_complete
**Completed:** 2026-04-26
**Type:** consolidation (URL only — no business logic)

## Purpose

ADMIN1–ADMIN7 left two parallel admin trees:

- `/admin/*` — three-zone canonical shell built across ADMIN1–6
- `/platform/admin/*` — the legacy admin portal whose top-level page still rendered the pre-canon
  `AdminCanonShell` (v1) chrome and a hand-coded sidebar, while two thin alias pages mirrored
  the `/admin` canonical implementation

ADMIN8 collapses these into a single canonical path at `/admin/*` and retires the three
in-scope `/platform/admin/*` pages via 308 redirects. Old bookmarks still resolve.

## What changed

### Added

- `src/app/(maestro)/admin/layout.tsx` — Clerk auth gate (admin email allowlist) for ALL
  `/admin/*` routes. Pattern lifted from ADMIN5's page-level auth in
  `/platform/admin/production-readiness/page.tsx`. Same allowlist values, no expansion.
- `docs/build/slices/ADMIN8_SINGLE_SOURCE_OF_TRUTH.md` (this file).

### Modified

- `src/app/(maestro)/admin/architecture/page.tsx` — promoted from "alias" comment to
  canonical implementation; metadata title harmonized. No render-output change.
- `src/app/(maestro)/admin/production-readiness/page.tsx` — promoted from alias to
  canonical; metadata title harmonized; `dynamic = 'force-dynamic'` and
  `revalidate = 0` preserved. Auth gate moved to layout (no inline guard needed).
- `src/components/abarva/AbarVaTopNav.tsx` — Admin link `/platform/admin` → `/admin`.
- `src/components/abarva/AbarVaShellNav.tsx` — Admin surface entry `/platform/admin` → `/admin`.
- `src/lib/design/abarva-shell.ts` — Platform + Admin nav items `/platform/admin` → `/admin`.
- `src/proxy.ts` — production-readiness no-store path list now contains both
  `/admin/production-readiness` (canonical) and `/platform/admin/production-readiness`
  (legacy redirect target).
- `src/lib/qa/wireframe-compliance-audit.ts` — three admin-tree route entries updated to
  `/admin/*` canonical paths; routeFile fields updated to match.
- `src/__tests__/integration/qa/wireframe-compliance-audit.test.ts` — assertions
  updated to expect the canonical `/admin/*` routes; legacy `/platform/admin` getter now
  returns null (asserted explicitly).
- `src/__tests__/integration/admin/admin7-visual-lock.test.ts` — added a regression
  block that asserts each retired `/platform/admin/{,architecture,production-readiness}`
  page is a thin redirect (imports `redirect` from `next/navigation`, calls it with the
  correct `/admin/...` target, and does NOT import `AdminCanonShellV2`).

### Deleted (replaced by redirects)

- Legacy body of `src/app/(maestro)/platform/admin/page.tsx` (the broken legacy admin
  portal index that surfaced the rejected v1 chrome).
- Full implementation at `src/app/(maestro)/platform/admin/architecture/page.tsx`
  (canonical implementation now lives at `/admin/architecture`).
- Full implementation at `src/app/(maestro)/platform/admin/production-readiness/page.tsx`
  (canonical implementation now lives at `/admin/production-readiness`; auth lifted to layout).

## What was preserved

- All other `/platform/admin/*` sub-routes (approvals, audit, brief, build-progress,
  connectors, context, data, data-governance, data-guide, experience-gallery,
  intelligence, new-client, outcomes, playbook, quality, revenue, users) are untouched.
  They render legacy-chrome surfaces with their own internal cross-links and remain
  reachable directly. ADMIN8 scope was the three pages explicitly named in the task.
- Clerk auth — moved from page-level (ADMIN5 only) to layout-level (every `/admin/*`
  page). Same allowlist (`anand+clerk_test@abarva.com`,
  `anand.sundaram@thesundaram.com`).
- All component code — copied/promoted, not rewritten.

## Risk mitigations

- **Backwards compat:** every retired URL still resolves via Next.js App Router
  `redirect()`. No 404s for old bookmarks.
- **Auth posture:** auth gate is layered in `/admin/layout.tsx` so any future `/admin/*`
  page automatically inherits the allowlist check. The allowlist is explicit and
  documented inline; the same values were carried over from ADMIN5 (no broadening).
- **Regression guard:** ADMIN7 visual lock test extended to assert legacy redirect pages
  remain redirects (no canonical-shell import allowed in retired files). New violations
  trip the regression suite.
- **WIRE2B drift:** route paths updated in both the audit module and the test file so
  scores attach to the canonical `/admin/*` URLs. Legacy URL lookup explicitly asserted
  to return null.

## Verification

- TypeScript: clean
- ESLint changed files: clean
- Hygiene gate: 11/11
- Admin regression guard: pass (new ADMIN8 redirect block included)
- WIRE2B audit: pass with route paths now `/admin/*`
- Hex audit shell: pass — admin tree banned-token-free
- Build: pass — all routes including redirect pages compile

## Routes after ADMIN8

| URL | Behavior |
|---|---|
| `/admin` | Canonical Setup Overview (auth-gated by layout) |
| `/admin/architecture` | Canonical Architecture page |
| `/admin/production-readiness` | Canonical Production Readiness page |
| `/admin/{data-trust,connectors,users-access,agent-readiness,build-progress}` | Existing canonical sub-pages |
| `/platform/admin` | 308 → `/admin` |
| `/platform/admin/architecture` | 308 → `/admin/architecture` |
| `/platform/admin/production-readiness` | 308 → `/admin/production-readiness` |
| `/platform/admin/{approvals, audit, brief, ...}` | Untouched legacy sub-routes (out of ADMIN8 scope) |

## Recommended next

Founder review at `/admin` (now canonical). Pick the next wave from `WAVE_ROADMAP.md`.
