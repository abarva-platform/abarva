# Home Refinement Package

**Version:** 1.0.0 · locked 2026-05-07
**Outcome:** Home remains the everyday product workspace for insights, decisions, actions, outcomes, and learning. Setup, users, connectors, templates, tenant policy, and data-load operations move to the admin-only workspace at `/admin`. Top nav stays focused on Home · Intelligence · Moves · Source · Tower. Learn remains inside Home for product info / training / doctrine reference.

---

## What this package does

Three structural changes:

1. **Separate Home from Admin.** Home keeps only product-work surfaces: Overview, AI Initiatives, Decision, Queue, Source, and Learn. Admin owns setup operations: Data Trust, Users & Access, Agent Readiness, Connectors, Tenant Profile, Configuration, Templates, data loads, policies, and deliverables.

2. **Reorganize top nav.** Five top-level surfaces in this order, left-to-right: **Home · Intelligence · Moves · Source · Tower**. Replaces whatever the current top nav is. No other top-level items.

3. **Add Learn panel shell inside Home.** New panel at `/home/learn` for product info, training, doctrine reference, glossary, agent-explanation, quickstart. Shell only — content is a follow-up package once we know what people get stuck on.

Plus two soft additions:

4. **Lock role-readiness doctrine.** Every panel, card, and CTA gets `visibleToRoles` metadata even though we don't enforce role logic yet. Cheap today, expensive to retrofit later.

5. **Update downstream package references.** Any old "Setup becomes Home" language is retired. Home docs describe product work; Admin docs describe tenant setup and operational controls.

---

## What this is NOT

- **NOT** a redesign of the admin setup panels. Data Trust, Users & Access, Agent Readiness, Connectors, Tenant Profile, Configuration, Templates, and data-load workflows remain admin-only.

- **NOT** a replacement for the Setup Fix or Setup Redesign Packages. Those still ship as planned. This package layers on top: the rename happens after those land, OR coordinated with their merge.

- **NOT** a content fill for the Learn panel. The Learn panel ships as an empty shell with the right structure. Content comes in a Learn Content Package later, scoped after we run the Journey Kit and learn what users actually struggle with.

- **NOT** role-based access control. We add metadata; we don't enforce role logic. RBAC ships as a separate kit later.

---

## Files in this package

```
home-refinement-package/
├── README.md                                  (this file)
├── master-prompt.md                           orchestration · execution order · stop conditions
├── NAV_REORGANIZATION.md                      the top-nav change · before/after · acceptance criteria
├── HOME_PANELS_INVENTORY.md                   the 6 panels under Home (incl. Learn) · routes · audiences
├── LEARN_PANEL_SHELL.md                       structure of the Learn panel · sections · content types
├── ROLE_READINESS_DOCTRINE.md                 metadata discipline for future role segmentation
├── ROUTE_MIGRATION.md                         old URL → new URL mapping · redirects · deprecations
├── DOWNSTREAM_PACKAGE_UPDATES.md              what changes in Setup Redesign Package, AI Initiatives Package, Journey Kit
├── ACCEPTANCE_CRITERIA.md                     binary pass/fail per change
└── claude-code-runbook.md                     the executable prompt
```

---

## How to execute

1. Read this README
2. Read master-prompt.md for orchestration
3. Read NAV_REORGANIZATION.md to understand the nav change
4. Read HOME_PANELS_INVENTORY.md for panel structure
5. Read LEARN_PANEL_SHELL.md for the new panel
6. Read ROLE_READINESS_DOCTRINE.md for metadata discipline
7. Read ROUTE_MIGRATION.md for URL changes
8. Read DOWNSTREAM_PACKAGE_UPDATES.md to understand cross-package coordination
9. Read ACCEPTANCE_CRITERIA.md for verification standard
10. Hand claude-code-runbook.md to Claude Code as executable prompt

Total expected execution: 2-4 days of agent run-time + browser-Chrome verification.

---

## Recommended sequence vs other packages

This package can ship after the Admin workspace exists. It coordinates with the AI Initiatives substrate package because AI Initiatives is a Home insight surface, while tenant setup remains Admin.

**Order option 1 — sequential, low risk:**

1. Setup Fix Package (already shipped 5 of 9; complete remaining)
2. Setup Redesign Package (Overview / Data Trust / Agent Readiness redesigns)
3. AI Initiatives Substrate Package v1.1 (loads registry + AI Initiatives panel)
4. **Home Refinement Package (this one) — separates Home product work from Admin setup operations + keeps Learn shell**
5. Journey Kit runs against Home

**Order option 2 — coordinated, faster:**

1. Setup Fix Package complete
2. Admin workspace + AI Initiatives Substrate Package + Home Refinement Package ship in coordinated batch
3. Journey Kit runs against Home

Option 1 is safer (each package verifiable independently). Option 2 is faster (avoids two rename touchups). My pick: option 1 unless calendar pressure.

---

## Done state

After this package executes:

- ✅ Top nav shows: Home · Intelligence · Moves · Source · Tower (in that order, left to right)
- ✅ Old `/setup` route 301-redirects to `/admin`
- ✅ Home landing page exists at `/home`
- ✅ All 6 Home panels accessible (Overview · AI Initiatives · Decision · Queue · Source · Learn)
- ✅ Admin-only setup panels stay out of Home panel inventory
- ✅ Learn panel renders the shell with empty/placeholder sections
- ✅ Every panel has `visibleToRoles` metadata (informational only, not enforced)
- ✅ Browser-Chrome screenshots verify nav + Home + each panel
- ✅ Downstream package docs updated to reference Home not Setup
- ✅ Journey Kit's WAYPOINTS.md updated to reference Home
- ✅ No regressions: existing Admin setup panels still render with their current contents

Total: ~2-4 days for full execution.

---

## Why this package matters

The old package over-corrected by trying to make Setup into Home. Current product direction is sharper: Home is where every user sees what matters and acts on it; Admin is where authorized operators configure tenant substrate, users, connectors, templates, data loads, and governance.

The 5-item top nav (Home · Intelligence · Moves · Source · Tower) is the binding product structure. Each item has one clear job:

- **Home** — orient, inspect insights, decide, act, and learn the product
- **Intelligence** — synthesize signals, find Move candidates
- **Moves** — execute Strategic Moves through 6 phases
- **Source** — vendor / sourcing / commercial intelligence
- **Tower** — portfolio-level monitoring across all AI bets

The Learn panel inside Home is what makes the product self-explanatory over time. Every doctrine question ("what's a Three Tests gate," "what's an archetype," "what's the difference between a Move and an initiative") has a destination once Learn is fleshed out.

The role-readiness metadata is small today but compounds. Every panel ships with the metadata field; future RBAC is a one-line filter, not a refactor.

This package finishes the structural foundation. After it lands, content packages (Learn content, Tower CIO View, Intelligence redesign content) can ship without renaming or restructuring.
