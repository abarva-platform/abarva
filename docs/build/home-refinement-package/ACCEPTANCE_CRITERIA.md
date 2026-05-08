# Acceptance Criteria · Home Refinement Package

Binary pass/fail per change. Browser-Chrome verification required for visual / interaction items.

---

## §1 · PR-H1 · Top nav reorganization

```
✓ Top nav renders exactly 5 items
✓ Items in this order: Home · Intelligence · Moves · Source · Tower
✓ Home is leftmost; Tower is rightmost
✓ Items removed from top nav: Setup, Maestro, Dashboard, Programs, any other previously-shown top-level items
✓ Active state highlights correctly per current page
✓ User menu / avatar still accessible (typically right of nav)
✓ Mobile / responsive: nav collapses correctly without losing 5-item structure
✓ Keyboard navigation: tab order is Home → Intelligence → Moves → Source → Tower
✓ Visual treatment consistent with existing design system (typography, spacing, hover state)
```

**Browser-Chrome verification:** 6 screenshots minimum (per NAV_REORGANIZATION.md verification spec)

---

## §2 · PR-H2 · Route consolidation

```
✓ /setup → 301 → /
✓ /setup/* → 301 → /home/* per ROUTE_MIGRATION.md mapping
✓ Direct browser navigation: typing /setup in address bar lands on /
✓ Bookmarks to /setup/* URLs redirect correctly
✓ Internal links throughout codebase use /home/* not /setup/*
✓ All redirects are HTTP 301 (permanent), not 302 (temporary)
✓ No broken links from any internal navigation
```

**Browser-Chrome verification:** 6 verification steps minimum (per ROUTE_MIGRATION.md verification spec)

---

## §3 · PR-H3 · Home page shell + panel inventory

```
✓ Home landing page exists at /
✓ All 8 Home panels accessible: Overview · Data Trust · AI Initiatives · Agent Readiness · Connectors · Tenant Profile · Configuration · Learn
✓ Panels grouped visually as Explore (operational) / Configure (admin) / Learn (everyone)
✓ Overview content prominent at top of landing page
✓ Each panel card shows: label · description · count or status indicator
✓ Click panel card navigates to correct sub-route per HOME_PANELS_INVENTORY.md
✓ All panels render existing designs unchanged (no design regressions)
```

**Browser-Chrome verification:** Screenshot Home landing + screenshot each of 8 panels (9 total)

---

## §4 · PR-H4 · Learn panel route + skeleton

```
✓ /home/learn route exists and renders
✓ All 6 sections visible: Quickstart · Glossary · Doctrine · Agents · Workflows · About AbarVa
✓ Search affordance present (disabled is OK)
✓ Each section has at least placeholder content (no blank cards)
✓ Sub-routes return 200:
  - /home/learn/quickstart
  - /home/learn/glossary
  - /home/learn/glossary/strategic-move (sample term)
  - /home/learn/doctrine
  - /home/learn/doctrine/three-tests-gate (sample topic)
  - /home/learn/agents
  - /home/learn/agents/sentinel (sample agent)
  - /home/learn/workflows
  - /home/learn/workflows/originate-a-move (sample workflow)
  - /home/learn/about
✓ Footer with feedback affordance present
✓ Cross-linkable (route is stable for other surfaces to link to)
✓ No broken images, no [object Object], no console errors
```

**Browser-Chrome verification:** 7+ screenshots (Learn index + each section + sample sub-page)

---

## §5 · PR-H5 · Role-readiness metadata

```
✓ HOME_PANELS array carries visibleToRoles for each panel
✓ Top nav items array carries visibleToRoles
✓ Every admin-flavored button (edit/delete/reset/re-run) has visibleToRoles + requiresRole
✓ Component types extended with RoleVisibilityMetadata interface
✓ Role enum defined with values: 'admin' | 'cxo' | 'analyst' | 'end_user'
✓ Doctrine doc (ROLE_READINESS_DOCTRINE.md) committed to repo
✓ TODO comment in code: "TODO: enforce role-based filtering when role kit ships"
✓ No code currently READS the metadata (informational only)
```

**Verification:** Code review audit. Confirm metadata fields populated. No browser screenshots needed.

---

## §6 · PR-H6 · Update package references

```
✓ Setup Redesign Package files moved to home-redesign-package/ directory
✓ AI Initiatives Substrate Package SETUP_UI_SPEC.md renamed to HOME_UI_SPEC.md
✓ Journey Kit WAYPOINTS, PERSONA_SCENARIO, BASELINE_DIAGNOSTIC, PREREQUISITES, claude-code-runbook updated
✓ All URL references updated from /setup/* to /home/*
✓ All "Setup" references in user-facing copy updated to "Home" (historical references in completion reports OK)
✓ Grep audit per DOWNSTREAM_PACKAGE_UPDATES.md verification step
✓ Cross-references between packages still resolve
```

**Verification:** Grep audit + manual review of changed files. No browser screenshots.

---

## Cross-cutting acceptance criteria

These apply across all PRs in this package:

```
✓ No console errors on any page
✓ No broken images, [object Object], or unrendered placeholders
✓ Page load performance: no significant regressions vs current Setup state
✓ Existing tests pass (if any cover routing or nav)
✓ New tests added for: nav rendering, redirect behavior, Home panel routing
✓ Browser-Chrome MCP verification on Vercel preview before merge per master prompt §3
✓ Three screenshots per PR minimum (more for §1, §3, §4)
✓ All screenshots saved to /docs/build/home-refinement-run-2026-05-07/screenshots/
```

---

## What does NOT need to pass

These are intentionally NOT enforced in this package:

- Role-based filtering of panels (metadata only · enforcement is future kit)
- Search functionality in Learn (scaffolded but disabled)
- Learn panel content (shell only)
- Per-tenant role customization
- API-level role enforcement
- Hierarchy / inheritance of roles

---

## Stop conditions tied to acceptance criteria

If any of these fail, halt and request human input:

- Existing Tower / Intelligence / Moves / Source pages don't render after rename (regression)
- Old `/setup/*` URLs return 404 instead of 301 (broken redirect)
- Two top-nav items try to share same active state (route ambiguity)
- Home landing page doesn't render (broken root)
- Existing panel designs visibly regress (e.g., Overview now blank)
- Browser-Chrome QA fails 3 times on same item

---

## Final verification before package marked complete

```
1. All 6 PRs merged
2. Browser-Chrome screenshots cover: nav (6+) · routes (6+) · Home (9+) · Learn (7+) — minimum 28 screenshots
3. Grep audit shows no unintentional /setup/ references remaining
4. Top nav renders Home · Intelligence · Moves · Source · Tower in correct order
5. Old /setup links redirect cleanly
6. Home landing renders all 8 panels
7. Learn shell renders all 6 sections
8. Role-readiness metadata present in code
9. Downstream packages updated and cross-references resolve
10. Completion report at /docs/build/home-refinement-run-2026-05-07/COMPLETION_REPORT.md
```

If all 10 pass: package complete. Tag substrate version `home_refinement_v1.0.0`. Notify downstream packages they can proceed with updated structure.
