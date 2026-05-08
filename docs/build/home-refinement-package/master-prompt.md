# Master Prompt · Home Refinement Package

**Operational frame for Claude Code executing this package.**

---

## What you are doing

Three structural changes to AbarVa's tenant-side surface:

1. Rename Setup → Home, change route from `/setup` to `/`
2. Reorganize top nav to Home · Intelligence · Moves · Source · Tower
3. Add a Learn panel shell inside Home for product info / training

Plus metadata discipline (role-readiness) and downstream package coordination.

---

## Execution order

### Phase 1 — Structural changes

**PR-H1 · Top nav reorganization**
Update top nav component to render exactly 5 items in this order: Home · Intelligence · Moves · Source · Tower. Replace whatever is there. No other top-level items.

Acceptance criteria per ACCEPTANCE_CRITERIA.md §1.

**PR-H2 · Route consolidation**
- Add Home landing route at `/`
- Migrate `/setup` to `/` with 301 redirect
- Migrate `/setup/*` panel routes to `/{panel}` per ROUTE_MIGRATION.md
- Verify all old links / bookmarks redirect correctly

Acceptance criteria per ACCEPTANCE_CRITERIA.md §2.

**PR-H3 · Home page shell + panel inventory**
The Home landing page renders a 6-panel grid (or matches the existing Setup landing layout, just rebranded). Panel inventory per HOME_PANELS_INVENTORY.md.

Acceptance criteria per ACCEPTANCE_CRITERIA.md §3.

### Phase 2 — Learn panel shell

**PR-H4 · Learn panel route + skeleton**
Add `/home/learn` (or `/learn` per route plan). Render the shell per LEARN_PANEL_SHELL.md. Sections present, content empty (placeholder text).

Acceptance criteria per ACCEPTANCE_CRITERIA.md §4.

### Phase 3 — Metadata discipline

**PR-H5 · Role-readiness metadata**
Every panel, card, and CTA gets `visibleToRoles` metadata field per ROLE_READINESS_DOCTRINE.md. Field is informational only. Not enforced today.

Acceptance criteria per ACCEPTANCE_CRITERIA.md §5.

### Phase 4 — Downstream coordination

**PR-H6 · Update package references**
Per DOWNSTREAM_PACKAGE_UPDATES.md, update doc references in:
- AI Initiatives Substrate Package (SETUP_UI_SPEC.md → HOME_UI_SPEC.md, route paths updated)
- Journey Kit (WAYPOINTS.md, PERSONA_SCENARIO.md updated)
- Setup Redesign Package becomes Home Redesign Package (rename, no content change)

Doc-only PR. No code change.

Acceptance criteria per ACCEPTANCE_CRITERIA.md §6.

---

## Stop conditions

Halt and request human input when:

1. **Existing route conflicts** — `/` already serves something else; need decision on what to do with current root content
2. **Top nav has more or fewer items than expected** — current state has 7 items including Tower, or only 3, etc. Need decision on which to remove or whether the 5-item plan still holds
3. **Setup contains panels not in the inventory** — there's a panel currently shipping at `/setup/X` that's not in HOME_PANELS_INVENTORY.md; need decision on whether to add or deprecate
4. **CI fails after 2 fix attempts on same PR**
5. **Browser-Chrome QA fails 3 times** on a layout / nav verification
6. **Doctrine-touching change required** — e.g., turns out Intelligence and Moves are actually one surface in current code, or Source isn't a top-level surface yet

For all stop conditions: capture context, write to stop-conditions log, halt and wait.

---

## What this package does NOT do

- Does NOT change existing panel designs (Overview / Data Trust / etc. keep their layouts)
- Does NOT add Learn panel content (only the shell)
- Does NOT enforce role-based visibility (only adds metadata)
- Does NOT change Tower / Intelligence / Moves / Source surface internals
- Does NOT modify substrate or migrations (purely surface / routing change)
- Does NOT rename any agent (Sentinel · Atlas · Nexus · Steward stay)

---

## Coordination with other packages

If running concurrently with other packages, coordinate merges:

- **Setup Fix Package PR-9** must land before this package starts (otherwise rename creates conflicts with shipping panels)
- **Setup Redesign Package** can land before OR after this package; if before, panels are already in shape; if after, the Setup Redesign PRs need their references updated to Home (this is a small fix-up)
- **AI Initiatives Substrate Package** can land before OR after; if before, AI Initiatives panel already exists at `/setup/ai-initiatives` and this package re-routes to `/home/ai-initiatives` (or `/ai-initiatives` flat) per route plan
- **Journey Kit** depends on this package landing before kit runs (kit's waypoints reference Home, not Setup)

If unsure about order: follow option 1 from README.md (sequential, low risk).

---

## Browser-Chrome QA discipline

Per the pattern locked in Setup Redesign Package, every PR in this package must pass:

1. CI checks (compile, lint, tests)
2. Browser-Chrome MCP verification on Vercel preview:
   - Top nav renders with exactly 5 items in correct order
   - Home page loads at `/` (not `/setup`)
   - Each Home panel accessible at expected route
   - No layout regressions on existing panels
   - No broken links from old `/setup/*` URLs (verify 301 redirects)

Three screenshots per PR minimum (top nav · Home landing · panel detail).

---

## Hard rules

1. Read all kit files before starting any PR
2. Execute PRs in phase order (Phase 1 → 2 → 3 → 4)
3. Each PR includes browser-Chrome QA before merge
4. Stop conditions are absolute; do not bypass
5. Do not delete old `/setup` routes without 301 redirects in place
6. Every panel and CTA gets `visibleToRoles` metadata per ROLE_READINESS_DOCTRINE.md
7. Cross-package doc updates ship as the final PR (PR-H6) so structural changes can verify first

---

## Output format

After each PR merge, write to `/docs/build/home-refinement-run-2026-05-07/PR_LOG.md`:

- PR number
- Title
- Files changed
- Browser-Chrome screenshots (paths)
- QA verdict (pass/fail per criterion)
- Time to merge

After all PRs complete, write completion report at `/docs/build/home-refinement-run-2026-05-07/COMPLETION_REPORT.md` with:

- All 6 PRs status
- Any stop conditions triggered
- Cross-package updates verified
- Final state of nav (5 items) + Home (8 panels) + Learn shell
- Recommendation for next package to ship

---

## Begin

Read all 9 package files. Then start with PR-H1 (top nav reorganization). Browser-Chrome verify before merge. Continue through PR-H6 unless stop condition triggers.
