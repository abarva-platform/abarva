# Claude Code Runbook · Home Refinement Package

This is the prompt to paste into Claude Code to run this package.

---

## Pre-flight

1. Open Claude Code in repo: `cd ~/Projects/nexus && claude`
2. Set model: `/model opus`
3. Confirm clean main: `git status` shows clean working tree
4. Confirm branches behind: `git pull origin main`
5. Confirm GH access: `gh auth status` shows authenticated
6. Confirm browser-chrome MCP loaded (`/mcp` should show it)
7. Paste the prompt below

---

## The prompt

```
You are running the Home Refinement Package for AbarVa.

REQUIRED READING (read these files in order before any action):

1. /docs/home-refinement-package/README.md
2. /docs/home-refinement-package/master-prompt.md
3. /docs/home-refinement-package/NAV_REORGANIZATION.md
4. /docs/home-refinement-package/HOME_PANELS_INVENTORY.md
5. /docs/home-refinement-package/LEARN_PANEL_SHELL.md
6. /docs/home-refinement-package/ROLE_READINESS_DOCTRINE.md
7. /docs/home-refinement-package/ROUTE_MIGRATION.md
8. /docs/home-refinement-package/DOWNSTREAM_PACKAGE_UPDATES.md
9. /docs/home-refinement-package/ACCEPTANCE_CRITERIA.md

After reading, execute the package per master-prompt.md.

---

## Execution structure

Six PRs in order. Each PR includes browser-Chrome QA before merge.

PR-H1 · Top nav reorganization
  - Update top nav component to render: Home · Intelligence · Moves · Source · Tower (left-to-right)
  - Remove other top-level items per NAV_REORGANIZATION.md
  - Browser-Chrome verify per NAV_REORGANIZATION.md verification spec (6 screenshots)
  - Acceptance criteria §1
  - Stop condition: if current top nav has structural assumptions that conflict with 5-item layout, halt

PR-H2 · Route consolidation
  - Add Home landing route at /
  - Migrate /setup → / and /setup/* → /home/* per ROUTE_MIGRATION.md
  - Implement 301 redirects per ROUTE_MIGRATION.md
  - Browser-Chrome verify per ROUTE_MIGRATION.md verification spec (6 verification steps)
  - Acceptance criteria §2
  - Stop condition: if existing root / page conflicts with Home content, halt for decision

PR-H3 · Home page shell + panel inventory
  - Build Home landing page rendering 8 panels
  - Layout per HOME_PANELS_INVENTORY.md (Explore / Configure / Learn groupings)
  - Each panel routes to its sub-page per HOME_PANELS_INVENTORY routes
  - Existing panel designs preserved (no design regressions)
  - Browser-Chrome verify (9 screenshots: landing + 8 panels)
  - Acceptance criteria §3

PR-H4 · Learn panel route + skeleton
  - Add /home/learn route
  - Render shell per LEARN_PANEL_SHELL.md (6 sections)
  - Sub-routes return 200 with placeholder content
  - Search affordance scaffolded (disabled)
  - Footer with feedback affordance
  - Browser-Chrome verify (7+ screenshots)
  - Acceptance criteria §4

PR-H5 · Role-readiness metadata
  - Add visibleToRoles + requiresRole metadata per ROLE_READINESS_DOCTRINE.md
  - Apply to: Home panels (HOME_PANELS array), top nav items, admin-flavored buttons
  - No enforcement; informational only
  - TODO comments in code
  - ROLE_READINESS_DOCTRINE.md committed
  - Acceptance criteria §5
  - Verification: code review audit (no browser screenshots needed)

PR-H6 · Update package references
  - Per DOWNSTREAM_PACKAGE_UPDATES.md, update:
    - Setup Redesign Package → Home Redesign Package (rename only)
    - AI Initiatives Substrate Package SETUP_UI_SPEC.md → HOME_UI_SPEC.md
    - Journey Kit waypoints / persona / baseline / prereqs / runbook
  - Grep audit: no unintentional /setup/ references remaining
  - Acceptance criteria §6
  - Doc-only PR; no code changes

---

## Default behavior

For each PR:
1. Branch off main
2. Implement changes
3. Push branch + open PR
4. Wait for CI green
5. Browser-Chrome QA on Vercel preview
6. Capture screenshots, save to /docs/build/home-refinement-run-2026-05-07/screenshots/
7. Verify acceptance criteria for that PR
8. If pass: merge via gh pr merge --squash --delete-branch
9. Wait for production deploy (or staging for non-prod)
10. Re-verify on deployed URL
11. Update PR_LOG.md
12. Move to next PR

Continue autonomously. No pause for permission unless stop condition triggers.

---

## Stop conditions per master-prompt.md §3

Halt and request human input when:

1. Existing route conflicts (`/` already serves something else)
2. Top nav has more or fewer items than expected
3. Setup contains panels not in HOME_PANELS_INVENTORY.md
4. CI fails after 2 fix attempts on same PR
5. Browser-Chrome QA fails 3 times on a layout / nav verification
6. Doctrine-touching change required (Intelligence and Moves are actually one surface, Source isn't a top-level surface, etc.)

For all stop conditions: capture context, write to /docs/build/home-refinement-run-2026-05-07/stop-conditions.md, halt.

---

## Output format

After EACH PR merge, output to chat (concise):

```
PR-H[N] · [title] · [status]
- Files: [count]
- Browser-Chrome screenshots: [count]
- Acceptance criteria: [pass/fail summary]
- Vercel preview URL: [...]
- Time: [HH:MM]
```

After each STOP CONDITION, output:

```
STOP CONDITION TRIGGERED: [type]
- Detected at: PR-H[N]
- Reason: [one line]
- Stop log: /docs/build/home-refinement-run-2026-05-07/stop-conditions.md

Need human review. Pausing.
```

After PACKAGE COMPLETE, output:

```
HOME REFINEMENT PACKAGE COMPLETE

PRs merged: 6 of 6
Browser-Chrome screenshots: [total count] across 6 PRs
Acceptance criteria: 6 of 6 sections passed

Top nav: Home · Intelligence · Moves · Source · Tower ✓
Routes: /setup/* → /home/* via 301 ✓
Home panels: 8 panels accessible ✓
Learn shell: 6 sections rendered ✓
Role-readiness: metadata present, not enforced ✓
Downstream packages: updated and cross-referenced ✓

Final report: /docs/build/home-refinement-run-2026-05-07/COMPLETION_REPORT.md
```

---

## Hard rules

1. Read all 9 package files before any action
2. Execute PRs in order H1 → H2 → H3 → H4 → H5 → H6
3. Browser-Chrome QA before every merge (CI alone is not enough)
4. Stop conditions are absolute; do not bypass
5. Do not delete /setup routes without 301 redirects in place
6. Every panel and admin button gets visibleToRoles + requiresRole metadata per ROLE_READINESS_DOCTRINE.md
7. Existing panel designs preserved (no design regressions in this package)
8. Final PR (H6) ships only after structural changes (H1-H5) verified
9. Save all screenshots to /docs/build/home-refinement-run-2026-05-07/screenshots/

---

## What NOT to do

- Do not redesign existing panels (Overview, Data Trust, AI Initiatives, etc. keep their layouts)
- Do not add Learn content (shell only · content via separate package)
- Do not enforce role visibility (metadata only)
- Do not modify substrate or migrations
- Do not rename agents (Sentinel · Atlas · Nexus · Steward stay)
- Do not modify Tower / Intelligence / Moves / Source surface internals
- Do not delete /setup routes (they redirect; routes definitions stay)
- Do not auto-merge if QA fails (only on QA pass)

---

## Begin

Start by reading the 9 package files. Then proceed to PR-H1.
```

---

## End of runbook

After Anand pastes this:
- Claude Code reads the package
- Executes PR-H1 through PR-H6 sequentially
- Each PR has browser-Chrome QA gate before merge
- Stop conditions handled explicitly
- Completion report written

Total expected agent run-time: 2-4 days.
