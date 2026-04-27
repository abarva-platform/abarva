# NAV1 — Admin / Platform Nav Alignment Review

**Wave:** NAV1 — Canonical AbarVa Navigation and Active Shell Alignment
**Slice ID:** NAV1C
**Type:** docs
**Status:** code_complete

## Purpose

Audit every admin / platform route under `src/app/(maestro)/platform/**` and
record (a) which canonical shell they use, (b) whether any legacy chrome
remains, and (c) which banned tokens still exist. Per NAV1 charter, no app
code is changed in this slice.

## Inventory — `src/app/(maestro)/platform/admin/**`

| Route | Page shell | Logo treatment | Legacy chrome (TopBar / PrimaryNav / AdminPortalHeader) | Banned token in body |
|---|---|---|---|---|
| `/platform/admin` | `AdminCanonShell` (canonical) | inherited from global nav | none | yes — `TEAL = '#14B8A6'` defined locally for action accents |
| `/platform/admin/approvals` | (none — bare content under `(maestro)` layout) | inherited | none | none |
| `/platform/admin/architecture` | `AdminCanonShell` | inherited | none | none |
| `/platform/admin/audit` | (none — bare content) | inherited | none | none |
| `/platform/admin/brief` | (none — bare content) | inherited | none | none |
| `/platform/admin/build-progress` | `AdminCanonShell` | inherited | none | none |
| `/platform/admin/connectors` | (none — bare content) | inherited | none | none |
| `/platform/admin/context` | (none — bare content) | inherited | none | none |
| `/platform/admin/data` | (none — bare content) | inherited | none | none |
| `/platform/admin/data-governance` | (none — bare content) | inherited | none | none |
| `/platform/admin/data-guide` | (none — bare content) | inherited | none | none |
| `/platform/admin/experience-gallery` | `AdminCanonShell` | inherited | none | none |
| `/platform/admin/intelligence` | (none — bare content) | inherited | none | none |
| `/platform/admin/new-client` | (none — bare content) | inherited | none | yes — local color palette declares `teal: '#14B8A6'` |
| `/platform/admin/outcomes` | (none — bare content) | inherited | none | none |
| `/platform/admin/playbook` | (none — bare content) | inherited | none | yes — local color palette declares `teal: '#14B8A6'` |
| `/platform/admin/production-readiness` | `AdminCanonShell` | inherited | none | none |
| `/platform/admin/quality` | (none — bare content) | inherited | none | yes — `'#14B8A6'` used as Intelligence pillar accent |
| `/platform/admin/revenue` | (none — bare content) | inherited | none | none |
| `/platform/admin/users` | (none — bare content) | inherited | none | none |

## Inventory — `src/app/(maestro)/platform/**` (non-admin)

| Route | Page shell | Logo treatment | Legacy chrome | Banned token |
|---|---|---|---|---|
| `/platform` | (none — bare content) | inherited | none | yes — `accent: '#14B8A6'` and `const TEAL = '#14B8A6'` for legacy admin grid |
| `/platform/data` | (none — bare content) | inherited | none | none |
| `/platform/data/new` | (none — bare content) | inherited | none | none |
| `/platform/style-preview` | (none — bare content) | inherited | none | yes — `const TEAL = '#0E9F8C'` (style-preview surface only) |
| `/platform/users/new` | (none — bare content) | inherited | none | none |

## Findings

### Canonical shell adoption

- `AdminCanonShell` (`src/components/admin/AdminCanonShell.tsx`) is the
  canonical admin page shell. It is canonical (no banned tokens, no
  hand-coded wordmark, navy `#1B2B5C` is the single accent).
- Five admin routes use it today: `/platform/admin`, `/platform/admin/architecture`,
  `/platform/admin/build-progress`, `/platform/admin/experience-gallery`,
  `/platform/admin/production-readiness`.
- The remaining 15 admin routes do not use any page shell — they render
  content directly under the `(maestro)` group layout. This is the existing
  pattern; NAV1 does not migrate them (would be a content-shape change).

### Legacy chrome

- No `<TopBar>`, `<PrimaryNav>`, or `<AdminPortalHeader>` imports remain in
  the admin/platform tree (verified by string scan).
- The global nav for these routes is `AppChrome → MaestroChrome → AbarvaNav`
  (mounted by `src/app/(maestro)/layout.tsx`). That is the legacy global nav
  carried forward from before NAV1.

### Logo / wordmark

- No admin/platform page hand-codes the wordmark. The only wordmark on these
  pages comes from the global nav, which renders through the canonical
  `AbarVaLogo` (via `AbarvaWordmark` shim).

### Banned tokens still present

The teal accent `#14B8A6` remains in seven admin/platform pages. These are
all visual style declarations (color palettes, accent for a specific KPI,
pillar accent in Quality), not chrome:

- `src/app/(maestro)/platform/page.tsx`
- `src/app/(maestro)/platform/style-preview/page.tsx` (uses the teal-adjacent `#0E9F8C`)
- `src/app/(maestro)/platform/admin/page.tsx`
- `src/app/(maestro)/platform/admin/new-client/page.tsx`
- `src/app/(maestro)/platform/admin/playbook/page.tsx`
- `src/app/(maestro)/platform/admin/quality/page.tsx`

These are deferred to NAV2 (or to a dedicated banned-token sweep) because
each one represents a distinct visual decision in the page body, not nav
chrome. Per NAV1 guardrails ("WITHOUT changing page content"), they are
out of scope for this wave. They are recorded in NAV1F's allow-list so the
regression guard does not fire on them.

## Files Modified

None.

## Files Added

- `docs/platform-design/experience-system/implementation-reviews/NAV1_ADMIN_PLATFORM_NAV_ALIGNMENT_REVIEW.md` — this file.
- `docs/build/slices/NAV1C_ADMIN_PLATFORM_NAV_ALIGNMENT.md` — slice doc.

## Files Updated

- `docs/build/build-slices.json` — adds NAV1C entry.

## Validation

- `git diff --check` — clean (docs only).
- `npx tsc --noEmit` — no new errors.
- `npm run build` — passes.
- `bash scripts/integration/hygiene_gate.sh --skip-build` — passes (modulo the
  expected uncommitted-changes warning during local prep).

## Risks

- None. No source files modified.

## Next

NAV1D — Source routes nav alignment.
