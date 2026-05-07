# PR 1 · Remove 4 panels from Setup nav

| | |
|---|---|
| **PR number** | 1 of 9 |
| **Type** | Surgical removal — 4 panels in one PR |
| **Branch** | `setup-fix/01-remove-4-panels` |
| **Depends on** | Nothing |
| **Blocks** | PR 2, PR 3, PR 6, PR 7, PR 8, PR 9 |
| **Estimated effort** | 2-3 hours |
| **Gate?** | No — proceed directly |

---

## §1 · What this PR does

Removes four panels from the Setup section that have no tenant admin use case:

1. **AI Initiatives** (`/admin/ai-initiatives`)
2. **Build Progress** (`/admin/build-progress`)
3. **Architecture** (`/admin/architecture`)
4. **Reasoning** (`/admin/reasoning`)

After this PR, Setup left-nav contains 6 panels:
1. Overview
2. Data Trust
3. Connectors
4. Users & Access
5. Agent Readiness
6. Production Readiness

## §2 · Why each panel is being removed

**AI Initiatives:** Substrate is rich (5 real initiatives, named stakeholders, risk conditions) but doesn't justify dedicated Setup left-nav real estate. Setup is for data trust and access setup; portfolio views belong adjacent to Strategic Moves or as a Tower input. Anand decision 2026-05-07.

**Build Progress:** Internal AbarVa engineering dashboard. Wave names, slice counts, script paths exposed to tenant admins. Per inventory §2.8 — "no tenant-admin use case." Anand confirmed Remove.

**Architecture:** Documentation panel describing AbarVa platform internals. A tenant admin configuring data and users does not need internal architecture documentation. Anand decision 2026-05-07: remove from Setup nav (not relocated; just removed).

**Reasoning:** Internal operator console. 157 sub-tools, demo scenario loaders, "Reset demo state" button. Per inventory §2.10 — "platform operator and engineering debugging console." Anand confirmed Remove.

## §3 · What gets removed

For each of the four panels:

### 3.1 Navigation entry
Remove from the Setup left-nav component (likely `src/components/admin/Sidebar.tsx`, `src/components/admin/AdminNav.tsx`, or similar — search for the nav definition).

### 3.2 Route
Remove the page route. For App Router: delete `src/app/admin/[panel-slug]/page.tsx` and any `loading.tsx`, `error.tsx` adjacent files. For Pages Router: delete `src/pages/admin/[panel-slug].tsx`.

After removal, navigation to these URLs should return Next.js default 404. Do NOT add explicit redirects.

### 3.3 Page components
Delete the page component file(s) and any sub-components used ONLY by these panels (verify no other consumers via grep before deleting).

### 3.4 Data fetchers / hooks / queries used ONLY by these panels
- For AI Initiatives: routes like `/api/setup/initiatives`, hooks like `useInitiatives`, types like `Initiative`. **Preserve the data layer** if it's referenced anywhere outside Setup (e.g., Tower may consume `/api/setup/initiatives?tenantKey=...`). Verify before deleting.
- For Build Progress: routes like `/api/build-progress`, build manifest readers, wave-related types. Likely Setup-only — verify and delete.
- For Architecture: static documentation reads, plane definitions. Likely Setup-only — verify and delete.
- For Reasoning: 157 sub-tool routes are nested under `/admin/reasoning/*`. **All sub-routes also removed** (this is non-negotiable — leaving sub-tools accessible without a parent panel creates orphan pages). Reasoning telemetry endpoints may have other consumers (test infrastructure?) — verify before deleting API routes; preserve API routes if uncertain.

### 3.5 Substrate (NOT deleted)
Database tables, columns, fixture data, seed scripts that supported these panels are NOT touched. Removal is presentation-layer only. If substrate cleanup becomes warranted later, that's a separate decision.

## §4 · Special handling for Reasoning panel sub-routes

The Reasoning panel has 157 sub-tool routes under `/admin/reasoning/*`. All must be removed, but two cautions:

1. **Some sub-routes may be linked from other surfaces.** Before deleting, grep the codebase for references to `/admin/reasoning/[anything]`. If references exist outside the Reasoning page itself, log them in spec drift register and either remove the references too (if they're cross-reference comments / docs / dead links) or preserve the sub-route (if it's actually used).

2. **The reasoning telemetry API endpoint** (`/api/reasoning/telemetry/export`) may be used by automation or ops tooling. Do NOT delete API endpoints in this PR unless you verify they have no consumers. If uncertain, preserve API endpoints, delete only the page routes.

## §5 · What stays untouched

- All other Setup panels (Overview, Data Trust, Connectors, Users & Access, Agent Readiness, Production Readiness)
- Global AbarVa nav (Home, Setup, Strategic Moves, Source, Intelligence, Tower, Learn, Product)
- Routing for any non-removed surface
- Authentication / authorization
- Tenant context resolution (that's PR 2's scope)
- Substrate / database / fixture data
- Tests for non-removed surfaces

## §6 · Hard scope rules

You MUST NOT:
- Modify any other Setup panel's code (only the 4 being removed)
- Modify the global nav
- Modify substrate or migrations
- Add anything new to fill the gap left by removed panels (no placeholders, no "coming soon" pages, no replacement nav entries)
- Refactor adjacent code while you're in there
- Remove API endpoints whose consumers you haven't verified
- Remove tests for non-removed surfaces

You MAY:
- Delete page components, navigation entries, types, hooks, and data fetchers used only by the 4 removed panels
- Update existing tests that referenced these panels (likely just removing test cases)
- Add tests verifying the navigation no longer includes these 4 entries
- Update any documentation in `docs/` that references these panels (mark as removed; don't delete docs themselves)

## §7 · Test additions

Add tests verifying:

1. Setup left-nav contains exactly 6 entries: Overview, Data Trust, Connectors, Users & Access, Agent Readiness, Production Readiness — in that order
2. Setup left-nav does NOT contain entries for AI Initiatives, Build Progress, Architecture, Reasoning
3. Navigating to `/admin/ai-initiatives`, `/admin/build-progress`, `/admin/architecture`, `/admin/reasoning` returns 404 (or the app's default not-found behavior)

Tests live in whatever test framework Setup uses (Jest, Vitest, Playwright per project convention). One test file is fine.

## §8 · Verification commands

Before opening PR, run:

```bash
# Lint
npm run lint
# OR pnpm lint, yarn lint — use whatever the project uses

# Type-check
npm run typecheck
# OR equivalent

# Tests
npm test
# OR equivalent

# Build to verify no broken imports
npm run build
```

All four must pass. If any fail due to your changes, fix and rerun. If any fail due to pre-existing issues unrelated to your changes, log to spec drift register and proceed.

## §9 · Vercel preview verification

After CI green and merge:

1. Wait for Vercel deploy on main (typically 2-5 min)
2. Navigate to deployed Setup page
3. Verify left-nav shows exactly 6 entries
4. Verify clicking each of the 6 entries loads the correct panel
5. Verify navigating directly to `/admin/ai-initiatives`, `/admin/build-progress`, `/admin/architecture`, `/admin/reasoning` returns 404
6. Capture screenshot of the new 6-entry left-nav
7. Save screenshot to `docs/setup-fix-package/screenshots/pr-01-after.png`

## §10 · Branch + commit + PR mechanics

```bash
git checkout main
git pull origin main
git checkout -b setup-fix/01-remove-4-panels

# ... do the work ...

git add -A
git commit -m "[FIX] Setup — remove 4 panels (AI Initiatives, Build Progress, Architecture, Reasoning)

Per docs/setup-fix-package/SETUP_FIX_PACKAGE_2026-05-07.md PR 1 of 9.
Removes panels with no tenant admin use case from Setup left-nav.
Substrate preserved; presentation-layer removal only.
"

git push origin setup-fix/01-remove-4-panels

# Open PR via gh CLI or web
gh pr create --base main --head setup-fix/01-remove-4-panels --title "[FIX] Setup — remove 4 panels (PR 1 of 9)" --body-file /tmp/pr-1-body.md
```

## §11 · Acceptance criteria

PR 1 is complete when ALL true:

- [ ] AI Initiatives panel inaccessible from Setup left-nav and via direct URL
- [ ] Build Progress panel inaccessible from Setup left-nav and via direct URL
- [ ] Architecture panel inaccessible from Setup left-nav and via direct URL
- [ ] Reasoning panel inaccessible from Setup left-nav and via direct URL (including all 157 sub-routes)
- [ ] Setup left-nav shows exactly 6 panels: Overview, Data Trust, Connectors, Users & Access, Agent Readiness, Production Readiness
- [ ] Page components for the 4 removed panels deleted from `src/`
- [ ] Orphaned imports / hooks / types cleaned up
- [ ] Substrate not touched (no migrations, no schema changes, no fixture changes)
- [ ] Lint passes
- [ ] Type-check passes
- [ ] Existing tests pass (or pre-existing failures logged to spec drift register)
- [ ] New tests added verifying nav state and 404 behavior
- [ ] New tests pass
- [ ] Vercel preview verified — screenshot saved to `docs/setup-fix-package/screenshots/pr-01-after.png`
- [ ] PR description references this spec
- [ ] Substrate gap register updated (likely no entries for this PR)
- [ ] Spec drift register updated (note any pre-existing issues encountered)

## §12 · Failure modes specific to PR 1

### 12.1 The "preserve some functionality" trap
You may notice that AI Initiatives has rich substrate or that Reasoning has a useful contradiction-detection feature. **Don't preserve them in Setup.** The substrate stays in the database. The Setup-facing presentation goes. If contradiction-detection or initiative-tracking belongs somewhere, that's a future surface decision, not this PR.

### 12.2 The "remove API endpoints aggressively" trap
API endpoints (`/api/setup/initiatives`, `/api/reasoning/telemetry/export`, etc.) may have non-Setup consumers. Verify before deleting. When uncertain, preserve API endpoints and delete only the page routes / components. Better to leave a few orphan API endpoints than to break Tower or test infrastructure.

### 12.3 The "find every reference" trap
There may be cross-references in docs, comments, README files. Update them where straightforward (e.g., a docs file listing "Setup has 10 panels" gets updated to "Setup has 6 panels"). Do NOT chase every reference — focus on functional code paths. Stale doc references are acceptable spec drift.

### 12.4 The "make it pretty" trap
After removing 4 nav entries, the nav looks shorter. Don't add visual filler. Don't change spacing. Don't add a divider where the removed entries were. The nav just gets shorter — that's the point.

## §13 · After PR 1 merges and deploys

Per master prompt §1.9, post completion comment, then:
- Begin **Wave B**: PR 2 (tenant binding fix) and PR 5 (Users & Access SSO) in parallel, since both depend only on PR 1.
- Pause for **Gate 1** before PR 3 — request Anand decision on Overview Client Data Landscape reconciliation direction (see PR 3 spec for the question).

End of PR 1 spec.
