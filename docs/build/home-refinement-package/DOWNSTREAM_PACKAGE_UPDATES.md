# Downstream Package Updates

**Outcome:** Other packages (Setup Redesign, AI Initiatives Substrate, Journey Kit) updated to reference Home, not Setup. Doc-only changes; no code logic changes.

---

## What changes per package

### Setup Redesign Package → Home Redesign Package

**Rename only.** Content unchanged.

**File-level changes:**
- Repo location: `docs/setup-redesign-package/` → `docs/home-redesign-package/`
- File renames:
  - `SETUP_REDESIGN_PACKAGE_2026-05-07.md` → `HOME_REDESIGN_PACKAGE_2026-05-07.md`
  - All other files keep their names
- Internal references:
  - "Setup Redesign Package" → "Home Redesign Package" throughout
  - "Setup → Overview" → "Home → Overview"
  - "Setup → Data Trust" → "Home → Data Trust"
  - "Setup → Agent Readiness" → "Home → Agent Readiness"
  - "Setup nav" → "Home nav"
  - URL references: `/setup/*` → `/home/*` (per ROUTE_MIGRATION.md)

**PR titles in the package:**
- PR-A · Compress Overview → Compress Home Overview (or just keep as PR-A · Compress Overview · Home)
- PR-B · Data Trust Redesign → no rename needed
- PR-C · Agent Readiness Redesign → no rename needed

**Wireframe Reference:**
- `WIREFRAME_REFERENCE.html` updated: nav shows "Home" instead of "Setup" at the top; panel labels stay the same (Overview, Data Trust, Agent Readiness)

---

### AI Initiatives Substrate Package v1.1

**Rename and route update.** Content largely unchanged.

**File-level changes:**
- `SETUP_UI_SPEC.md` → `HOME_UI_SPEC.md`
- Internal references:
  - "Setup → AI Initiatives" → "Home → AI Initiatives"
  - "Setup nav" → "Home nav"
  - Routes: `/setup/ai-initiatives` → `/home/ai-initiatives`
  - Routes: `/setup/ai-initiatives/[id]` → `/home/ai-initiatives/[id]`

**Doctrine carried over unchanged:**
- The 21 initiatives, 12 business goals, 8 categories, Three Tests gate, Load Path Manifest, Wireframe Addendum content all unchanged
- Schema unchanged
- Templates unchanged

**Reference updates inside the package:**
- README.md notes "ships at /home/ai-initiatives" instead of "/setup/ai-initiatives"
- LOAD_INSTRUCTIONS.md Step 4 references Home panel build, not Setup panel build
- WIREFRAME_ADDENDUM.md references Home (Castillo's example renders against Home not Setup)

---

### Journey Kit

**Rename and waypoint updates.** No structural changes.

**File-level changes:**

In `WAYPOINTS.md`:
- Waypoint 01 "Setup arrival" → "Home arrival"
- Waypoint 02 "Setup → Tenant Profile" → "Home → Tenant Profile"
- Waypoint 03 "Setup → AI Initiatives" → "Home → AI Initiatives"
- Waypoint 04 "Setup → MH-04 detail" → "Home → MH-04 detail"
- Waypoint 05 "Setup nav return" → "Home nav return"
- All URL references `/setup/*` → `/home/*`
- Cross-cutting acceptance criteria gain one item: "Each panel has visibleToRoles metadata even if not enforced" (per ROLE_READINESS_DOCTRINE.md)

In `PERSONA_SCENARIO.md`:
- Time-blocked path table: "0-5 min Setup arrival" → "0-5 min Home arrival" etc.
- Sequential narrative: "Setup → Intelligence → Strategic Moves" → "Home → Intelligence → Strategic Moves"

In `BASELINE_DIAGNOSTIC.md`:
- Phase 0 inspection #1 now inspects Home (not Setup)
- Adds inspection: "Top nav shows Home · Intelligence · Moves · Source · Tower in left-to-right order"
- Adds inspection: "Old /setup URLs redirect to /home equivalents"
- Adds inspection: "/home/learn route exists with shell content"

In `PREREQUISITES.md`:
- Soft prereq #6 "AI Initiatives Substrate Package loaded" — no change beyond URL ref
- Soft prereq #7 "Setup → AI Initiatives view built" → "Home → AI Initiatives view built"
- New prereq: "Home Refinement Package shipped (or coordinated with Journey Kit run)"

In `claude-code-runbook.md`:
- All path references updated
- Phase 0 includes new checks per BASELINE_DIAGNOSTIC.md changes

---

### Tower Fix Package

**No change.** Tower stays its own surface. Top nav placement (rightmost) is the only relevant change but doesn't affect Tower's own pages.

---

### Intelligence Augmentation Package

**Minimal change.** Intelligence stays its own surface. Top nav placement (second-from-left) is the only nav change.

If the package references the Setup → Data Trust panel (e.g., for substrate provenance verification), update to "Home → Data Trust."

---

### Source Audit Kit / Source Portfolio Package

**Minimal change.** Source stays its own surface. Top nav placement (fourth from left) is the only relevant change. No internal updates needed.

---

## What stays the same (no rename)

- Strategic Moves URL stays `/strategic-moves` (label is "Moves" but URL preserved for SEO/external links)
- Intelligence URL stays `/intelligence`
- Source URL stays `/source`
- Tower URL stays `/tower`
- All agent names stay (Sentinel · Atlas · Nexus · Steward)
- All substrate / table names stay (engagements, ai_initiatives, etc.)
- All package internal doctrine (Three Tests gate, archetypes, phase model, etc.) stays
- All API endpoints stay (no `/api/v1/setup/*` to rename · APIs were already independent of UI routes)

---

## Coordination with Setup Fix Package

Setup Fix Package shipped 5 of 9 PRs autonomously, 3 superseded by Setup Redesign, 1 (PR-9) shipped. So Setup Fix Package is essentially complete.

**No rename impact for Setup Fix Package** because its work is already merged. The renames apply to the docs / repo location, but the code work is done.

---

## Coordination with autonomous Setup Redesign run

If Setup Redesign Package is currently running autonomously when Home Refinement Package is queued:

- Wait for Setup Redesign to complete
- THEN run Home Refinement Package
- Avoid race conditions on file moves / renames

If Setup Redesign hasn't started yet:

- Option A: Run Home Refinement first, then Setup Redesign Package against renamed (Home Redesign Package) docs — cleaner end state
- Option B: Run Setup Redesign first, then Home Refinement updates references — slightly messier but parallelizable

My pick for Claude Code: **Option B** unless you instruct otherwise. Setup Redesign Package is already specified with Setup names; doing Setup Redesign first is straightforward, and Home Refinement's PR-H6 (downstream updates) handles the rename cleanly afterward.

---

## Acceptance criteria · all packages updated

```
✓ Setup Redesign Package files moved to home-redesign-package/ directory
✓ AI Initiatives Substrate Package SETUP_UI_SPEC.md renamed and references updated
✓ Journey Kit WAYPOINTS, PERSONA_SCENARIO, BASELINE_DIAGNOSTIC, PREREQUISITES, claude-code-runbook updated
✓ All URL references in all packages updated from /setup/* to /home/*
✓ All "Setup" references in user-facing copy updated to "Home"
✓ All package READMEs updated to reflect new naming
✓ Cross-references between packages still resolve correctly
✓ A grep for "Setup" in updated docs returns only intentional references (e.g., "the previous Setup Fix Package shipped 5 of 9 PRs..." historical notes)
```

---

## Verification

A grep audit at the end of PR-H6:

```bash
# Find any remaining /setup/ references that should have been updated
grep -r "/setup/" docs/ --exclude-dir=node_modules
# Should return only intentional historical references in completion reports

# Find any remaining "Setup →" references in user-facing copy
grep -r "Setup →" docs/ --exclude-dir=node_modules
# Should return only intentional historical references

# Find any remaining "Setup nav" references
grep -r "Setup nav" docs/ --exclude-dir=node_modules
# Should return zero
```

These greps form the verification step at end of PR-H6.

---

## What this DOES NOT do

- Does NOT change AbarVa code beyond the routing / nav (those are separate PRs in this package)
- Does NOT modify substrate or templates (renames are doc-level only)
- Does NOT touch packages beyond the four named (Setup Redesign, AI Initiatives Substrate, Journey Kit, Setup Fix)
- Does NOT update external customer docs (separate communications task)
- Does NOT replace any existing package content; only renames and updates references

This is a coordinating doc-only PR. Small but important — it keeps every other package consistent with the new structure.
