# AbarVa Spec Inventory and Cleanup Plan

**Date:** April 21, 2026
**Purpose:** Full classification of every spec file accessible to me, with authority hierarchy and move plan. Built from reading the session handoff (`abarva-session-handoff-apr20-2026.md`) plus sampling each spec file directly.

**Scope of this inventory:**

- ✅ **Files I can read directly:** 14 spec files in `/mnt/user-data/outputs/` and 7 context files in `/mnt/user-data/uploads/` (total 21 files)
- ⚠️ **Files visible in your Finder screenshot but NOT in my reach:** ~25 older files at repo root from April 13-15 sessions (BUILD_v2.md, CLAUDE_CODE_INSTRUCTION*.md, Abarva_Design_Spec_v1.md, etc.) — I can only classify these based on filename + context from the handoff doc

For files I couldn't read directly, I flag them explicitly and recommend Codex handle triage based on on-disk content.

---

## Part 1 · Classification schema

Every file gets one of these statuses:

- **🟢 CANONICAL** — current authoritative truth. Goes to `docs/specs/[category]/`.
- **🟡 PARTIALLY SUPERSEDED** — still valuable for context but parts are out of date. Goes to `docs/specs/_reference/`. Name it clearly: `[filename].md` but with top-of-file banner marking it reference.
- **🔵 ARCHIVE** — no longer the source of truth but useful history. Goes to `docs/specs/_archive/[year-month]/`.
- **🔴 DELETE** — trash, failed output, redundant noise. Git rm.
- **❓ UNKNOWN** — I can't reach the file; needs Codex or human inspection.

Plus two organizational categories:

- **Category A · Product specs** — describe what the product is/does
- **Category B · Execution artifacts** — instructions for Claude Code, Codex, build packs
- **Category C · Strategic/context docs** — handoffs, narratives, positioning
- **Category D · Orphaned source code** — .tsx, .ts, .mjs files misfiled at repo root

---

## Part 2 · Files I read directly (21 files)

### 🟢 CANONICAL · Category A · Product specs

These are the current source of truth. Codex and Claude Code should reference these.

| File | Size | Status | Move to |
|------|------|--------|---------|
| `abarva-agent-architecture-spec.md` | 145KB | 🟢 CANONICAL | `docs/specs/platform/` |
| `abarva-design-system-spec.md` | 84KB | 🟢 CANONICAL | `docs/specs/platform/` |
| `abarva-data-layer-future-state-spec.md` | 124KB | 🟢 CANONICAL | `docs/specs/platform/` |
| `abarva-intelligence-design-spec.md` | 89KB | 🟢 CANONICAL | `docs/specs/intelligence/` |
| `abarva-programs-design-spec.md` | 83KB | 🟢 CANONICAL | `docs/specs/programs/` |
| `abarva-tower-design-spec.md` | 334KB | 🟢 CANONICAL | `docs/specs/tower/` |
| `abarva-data-ingestion-integration-spec.md` | 129KB | 🟢 CANONICAL | `docs/specs/platform/` |
| `abarva-page-design-backlog.md` | 23KB | 🟢 CANONICAL | `docs/specs/_meta/` |
| `abarva-apex-seed-data-reconciled.md` | 15KB | 🟢 CANONICAL | `docs/specs/_meta/seed-data/` |
| `abarva-programs-test-drive-module-experience-spec.md` | 154KB | 🟢 CANONICAL | `docs/specs/programs/` |
| `abarva-tower-build-sequencing-plan.md` | 45KB | 🟢 CANONICAL | `docs/specs/tower/` |
| `abarva-integrated-intelligence-vip-system.md` | 29KB | 🟢 CANONICAL | `docs/specs/platform/` |
| `abarva-marketing-investor-spec.md` | 27KB | 🟢 CANONICAL | `docs/specs/public-surfaces/` |
| `abarva-product-reframe.md` | 17KB | 🟢 CANONICAL | `docs/specs/_meta/` |

**Notes on canonical set:**

- `abarva-data-ingestion-integration-spec.md` — I forgot I completed this earlier. It's a full 6-packet spec on ingestion architecture. Extends Tower Packet 8. Important for the "showcase ingestion as a selling point" direction we discussed. **You should look at this one — you may not have seen it.**
- `abarva-apex-seed-data-reconciled.md` — supersedes `abarva-apex-seed-data-draft.md` (archive the draft).
- `abarva-integrated-intelligence-vip-system.md` — defines the 4-layer intelligence architecture (L1 public / L2 client / L3 program / L4 user) which is foundational to both Intelligence and Programs specs. Should be read by Codex before building.

### 🟡 PARTIALLY SUPERSEDED · Category A · Earlier-generation product specs

These are good reference material but don't use them as the authority. The newer specs reference them.

| File | Size | Status | Why | Move to |
|------|------|--------|-----|---------|
| `abarva-nexus-agent-spec.md` | 27KB | 🟡 SUPERSEDED | Superseded by `abarva-agent-architecture-spec.md` which covers all 3 agents. Good for Nexus voice history. | `docs/specs/_reference/` |
| `abarva-program-lifecycle-spec.md` | 34KB | 🟡 SUPERSEDED | Superseded by `abarva-programs-design-spec.md` + `abarva-programs-test-drive-module-experience-spec.md`. Contains original 6-phase lifecycle and Prat worked example. | `docs/specs/_reference/` |
| `abarva-page-density-plan.md` | 25KB | 🟡 SUPERSEDED | Superseded by `abarva-design-system-spec.md` + `abarva-page-design-backlog.md`. Had good density principles for enterprise B2B. | `docs/specs/_reference/` |

### 🔵 ARCHIVE · Category C · Session handoffs

Value decreases over time but kept for audit trail of decisions.

| File | Size | Status | Move to |
|------|------|--------|---------|
| `abarva-session-handoff-apr20-2026.md` | 20KB | 🔵 ARCHIVE | `docs/specs/_archive/2026-04/handoffs/` |
| `abarva-intelligence-session-handoff-apr20.md` | 7KB | 🔵 ARCHIVE | `docs/specs/_archive/2026-04/handoffs/` |

### 🔵 ARCHIVE · Category A · Superseded drafts

| File | Size | Status | Why | Move to |
|------|------|--------|-----|---------|
| `abarva-apex-seed-data-draft.md` | 36KB | 🔵 ARCHIVE | Reconciled version supersedes. Draft useful as reference. | `docs/specs/_archive/2026-04/` |

### 🟢 CANONICAL · Category B · Execution artifacts (live)

Operational documents used for active execution. Keep accessible.

| File | Size | Status | Move to |
|------|------|--------|---------|
| `abarva-corrections-april-21-test-drive.md` | 20KB | 🟢 CANONICAL (time-limited) | `docs/specs/_corrections/` — delete after fixes shipped |

**Note:** Once corrections are shipped and verified, this file can move to `docs/specs/_archive/2026-04/corrections/`.

---

## Part 3 · Files at repo root I CANNOT read directly

Visible in your Finder screenshot but not accessible to me. I'm classifying based on filename conventions + handoff doc context.

### 🔵 PROBABLE ARCHIVE · Older product specs (pre-April 16)

From April 13 session — pre-rename, pre-agent-architecture-unification. These are ancestors of current canonical specs.

| File | Size | Probable status | Move to |
|------|------|----------------|---------|
| `Abarva_AI_Control_Tower_Spec.md` | 25KB | 🔵 ARCHIVE (superseded by 334KB `abarva-tower-design-spec.md`) | `docs/specs/_archive/2026-04/tower/` |
| `Abarva_Design_Spec_v1.md` | 27KB | 🔵 ARCHIVE (superseded by design system spec) | `docs/specs/_archive/2026-04/design/` |
| `Abarva_Design_Spec_v2_Supplementary.md` | 49KB | 🔵 ARCHIVE (superseded) | `docs/specs/_archive/2026-04/design/` |
| `AbarVa_Design_System.html` | 53KB | 🔵 ARCHIVE (html design artifact, superseded) | `docs/specs/_archive/2026-04/design/` |
| `AbarVa_Demo_Narrative_Spec.md` | 17KB | 🟡 REVIEW — may still be useful | Codex to read and decide |
| `AbarVa_Market_Noise_Strategy.md` | 27KB | 🟡 REVIEW — strategic positioning, may still be current | Codex to read and decide |
| `Abarva_Output_Standards.md` | 24KB | 🟡 REVIEW — may be superseded by design system | Codex to read and decide |
| `Abarva_Preconfigured_Products_Spec.md` | 39KB | 🟡 REVIEW — preconfigured products concept is live; may still be relevant | Codex to read and decide |
| `AbarVa_Workflow_Narrative_Spec.md` | 23KB | 🟡 REVIEW | Codex to read and decide |
| `TECH_MODERNIZATION_SPEC.md` | 36KB | 🟡 REVIEW — may be a Tower section | Codex to read and decide |
| `ENGAGEMENT_ENGINE_ADDITION.md` | 21KB | 🔵 ARCHIVE (pre-rename "Engagement" language) | `docs/specs/_archive/2026-04/` |
| `INVESTOR_PAGE_SPEC.md` | 20KB | 🟡 REVIEW — may be superseded by marketing-investor-spec | Codex to read and decide |

### 🔵 PROBABLE ARCHIVE · Old Claude Code instructions

These are execution artifacts from earlier sessions. Multiple generations. Most are superseded by current Codex + Claude Code workflows. 

| File | Size | Probable status |
|------|------|----------------|
| `CLAUDE_CODE_SOP.md` | 5KB | 🟡 REVIEW — might be current SOP |
| `CLAUDE_CODE_INSTRUCTION.md` | 17KB | 🔵 ARCHIVE (older version) |
| `CLAUDE_CODE_INSTRUCTION_FINAL.md` | 64KB | 🔵 ARCHIVE (likely superseded by build packs in canonical specs) |
| `CLAUDE_CODE_FIXES.md` | 11KB | 🔵 ARCHIVE (session-specific) |
| `CLAUDE_CODE_ENGAGEMENT_ENGINE.md` | 87KB | 🔵 ARCHIVE (pre-rename) |
| `FINAL_INSTRUCTION.md` | 23KB | 🔵 ARCHIVE (ambiguous "final") |
| `FINAL_BUILD.md` | 31KB | 🔵 ARCHIVE (ambiguous "final") |
| `QA_CHECKLIST.md` | 4KB | 🟡 REVIEW — might be current |
| `BACKLOG.md` | 12KB | 🟡 REVIEW — might be current |

**Recommendation:** Move ALL `CLAUDE_CODE_*.md` and `FINAL_*.md` files to `docs/specs/_archive/2026-04/execution/` — if any are still current, they'll be discovered when searched. Better to archive-then-retrieve than to leave 5+ ambiguous "CLAUDE_CODE_" files at root.

### ⚠️ CRITICAL · The 528 KB mega-doc

| File | Size | Status |
|------|------|--------|
| `BUILD_v2.md` | 528KB | ❓ UNKNOWN — needs inspection |

At 528KB, this is **three times larger than the Tower spec**. Could be:
- A mega-spec combining everything (should be archived if canonical specs supersede it)
- An old build log or compiled instructions (archive)
- Something currently in use that I'm unaware of

**Recommendation:** Codex opens, scans first/last 200 lines, determines if it's supplanted by the 14 canonical specs. Almost certainly archive-worthy given the canonical specs cover the full product. But must not be deleted without inspection.

### 🔴 DELETE · Obvious trash

| File | Size | Status |
|------|------|--------|
| `main` | 0 bytes | 🔴 DELETE — failed shell redirect |

### 🔴 DELETE or MOVE · Source code at repo root (Category D)

These are source files misplaced at repo root — should be in `src/` or similar.

| File | Size | Action |
|------|------|--------|
| `homepage.tsx` | 13KB | MOVE to `src/app/...` or archive if superseded |
| `investor-page.tsx` | 37KB | MOVE to `src/app/investors/` or archive |
| `AbarvaNav.tsx` | 13KB | MOVE to `src/components/` or archive |
| `PageShell.tsx` | 4KB | MOVE to `src/components/` or archive |
| `design-system.ts` | 8KB | MOVE to `src/lib/` or archive |
| `create-demo-users.mjs` | 5KB | MOVE to `scripts/` |
| `avr_navigator_seed.js` | 30KB | MOVE to `scripts/` or `db/seeds/` |
| `abarva-solutions-final.html` | 58KB | MOVE to `docs/specs/_archive/2026-04/html/` |

**Codex check before moving:** Some of these may have been imported from elsewhere or may be dead. Codex should search the codebase for imports/references. If nothing references them, they're dead and go to `_archive/`. If something references them, they move to canonical source locations.

### 🟡 PROBABLE CONTEXT · Older briefs

From early April — strategic briefs. Probably historical.

| File | Size | Probable status |
|------|------|----------------|
| `ABARVA_REFERENCE.md` | 40KB | 🟡 REVIEW — named "reference" so may be in active use |
| `client_portal_brief.md` | 15KB | 🔵 ARCHIVE (strategic brief) |
| `track2_design_brief.md` | 22KB | 🔵 ARCHIVE |
| `abarva_overnight_brief.md` | 28KB | 🔵 ARCHIVE |

### 🟡 UNKNOWN · Pack documents referenced in handoff

The handoff doc lists ~12 pack documents (Pack A through Pack L + extras). These don't appear in your current Finder screenshot but were referenced as live. They may have been cleaned up already, or they may be in a subdirectory I can't see.

Mentioned packs:
- `abarva-pack-nexus-depth.md` (Pack A)
- `abarva-pack-industry-knowledge-layer.md` (Pack B)
- `abarva-pack-intelligence-graph.md` (Pack C)
- `abarva-pack-agent-interface.md` (Pack D)
- `abarva-pack-intelligence-revamp.md` (Pack E)
- `abarva-pack-cleanup-menu-rename.md` (Pack F)
- `abarva-pack-tower-onboarding.md` (Pack G)
- `abarva-pack-enterprise-depth.md` (Pack H)
- `abarva-pack-comprehensive-data-model.md` (Pack I)
- `abarva-pack-realistic-portfolio.md` (Pack J)
- `abarva-pack-pharma-augmentation.md` (Pack K)
- `abarva-pack-topics-deliverables.md` (Pack L)

**Action:** If they exist on disk (check `updates/` folder visible in screenshot), move to `docs/specs/_reference/packs/`. If they don't exist, note that several were shipped and spec is folded into canonical specs.

---

## Part 4 · Proposed directory structure

```
abarva/
├── docs/
│   └── specs/
│       ├── README.md                        ← index + authority hierarchy
│       │
│       ├── platform/                         ← cross-product foundation
│       │   ├── agent-architecture.md        (abarva-agent-architecture-spec.md)
│       │   ├── design-system.md             (abarva-design-system-spec.md)
│       │   ├── data-layer-future-state.md   (abarva-data-layer-future-state-spec.md)
│       │   ├── data-ingestion-integration.md (abarva-data-ingestion-integration-spec.md)
│       │   └── intelligence-vip-system.md   (abarva-integrated-intelligence-vip-system.md)
│       │
│       ├── intelligence/                     ← Sentinel surface
│       │   └── design-spec.md               (abarva-intelligence-design-spec.md)
│       │
│       ├── programs/                         ← Nexus surface
│       │   ├── design-spec.md               (abarva-programs-design-spec.md)
│       │   └── test-drive-module-experience.md (abarva-programs-test-drive-module-experience-spec.md)
│       │
│       ├── tower/                            ← Atlas surface
│       │   ├── design-spec.md               (abarva-tower-design-spec.md)
│       │   └── build-sequencing-plan.md     (abarva-tower-build-sequencing-plan.md)
│       │
│       ├── public-surfaces/                  ← marketing + investor
│       │   └── marketing-investor-spec.md   (abarva-marketing-investor-spec.md)
│       │
│       ├── _meta/                            ← cross-cutting operational
│       │   ├── page-design-backlog.md       (abarva-page-design-backlog.md)
│       │   ├── product-reframe.md           (abarva-product-reframe.md)
│       │   └── seed-data/
│       │       └── apex-reconciled.md       (abarva-apex-seed-data-reconciled.md)
│       │
│       ├── _corrections/                     ← active corrections
│       │   └── april-21-test-drive.md       (abarva-corrections-april-21-test-drive.md)
│       │
│       ├── _reference/                       ← partially superseded, kept for context
│       │   ├── nexus-agent-spec-v1.md       (abarva-nexus-agent-spec.md)
│       │   ├── program-lifecycle-v1.md      (abarva-program-lifecycle-spec.md)
│       │   ├── page-density-plan.md         (abarva-page-density-plan.md)
│       │   └── packs/                       (if any pack docs exist on disk)
│       │
│       └── _archive/
│           ├── 2026-04/
│           │   ├── handoffs/
│           │   │   ├── session-handoff.md
│           │   │   └── intelligence-handoff.md
│           │   ├── design/
│           │   │   ├── spec-v1.md
│           │   │   ├── spec-v2-supplementary.md
│           │   │   └── design-system.html
│           │   ├── tower/
│           │   │   └── control-tower-spec-v1.md
│           │   ├── execution/
│           │   │   ├── claude-code-instruction-final.md
│           │   │   ├── claude-code-engagement-engine.md
│           │   │   └── [other claude_code and final files]
│           │   ├── apex-seed-data-draft.md
│           │   ├── engagement-engine-addition.md
│           │   └── html/
│           │       └── abarva-solutions-final.html
│           └── strategic-briefs/
│               ├── client-portal-brief.md
│               ├── track2-design-brief.md
│               └── overnight-brief.md
```

---

## Part 5 · Execution plan for Codex

### Phase 1 · Create directory structure (2 min)

```bash
mkdir -p docs/specs/{platform,intelligence,programs,tower,public-surfaces,_meta/seed-data,_corrections,_reference/packs,_archive/2026-04/{handoffs,design,tower,execution,html},_archive/strategic-briefs}
```

### Phase 2 · Move the 14 canonical specs (5 min)

For each file in the CANONICAL table above, `git mv [old-path] docs/specs/[new-path]`. Rename as specified (drop `abarva-` prefix where cleaner, keep descriptive part).

### Phase 3 · Handle the files I cannot read (15-20 min, requires reading)

For each UNKNOWN / REVIEW file:

1. Open the file
2. Check first 50 lines for title, date, purpose
3. Check if it's superseded (the handoff doc section 3 lists which prior specs are superseded)
4. Assign classification: CANONICAL, ARCHIVE, or DELETE
5. Move accordingly

Specific decisions Codex needs to make:

- `BUILD_v2.md` (528KB) — almost certainly archive, but confirm by scanning TOC
- `ABARVA_REFERENCE.md` — if current index/reference doc, make it `docs/specs/README.md`. If old, archive.
- `QA_CHECKLIST.md` — if current, move to `docs/specs/_meta/`. If session-specific, archive.
- `BACKLOG.md` — if current, move to `docs/specs/_meta/`. If old, archive.

### Phase 4 · Handle source code files (10 min)

For each .tsx, .ts, .mjs at repo root:

1. `grep -r "import.*[filename]" src/` to find references
2. If referenced: move to proper location in src/, update imports
3. If not referenced: move to `docs/specs/_archive/2026-04/orphaned-code/`

### Phase 5 · Delete obvious trash (1 min)

```bash
rm main  # 0-byte failed redirect
```

### Phase 6 · Create `docs/specs/README.md` (5 min)

An index document that lists the canonical specs in authority order, with one-line descriptions, so Codex/Claude Code/humans know what to read first.

Template content:

```markdown
# AbarVa Specifications · Index

This directory contains canonical specifications for AbarVa. When building, reference these.

## Platform foundation (read first)
- `platform/agent-architecture.md` — Nexus, Sentinel, Atlas unified spec
- `platform/design-system.md` — canonical tokens, components, patterns
- `platform/data-layer-future-state.md` — knowledge graph, provenance, Genome
- `platform/data-ingestion-integration.md` — how data enters AbarVa
- `platform/intelligence-vip-system.md` — 4-layer intelligence + VIP profiles

## Product surfaces
- `intelligence/design-spec.md` — Intelligence (Sentinel) surface
- `programs/design-spec.md` — Programs (Nexus) surface
- `programs/test-drive-module-experience.md` — per-phase module depth
- `tower/design-spec.md` — Tower (Atlas) surface
- `tower/build-sequencing-plan.md` — dependency-chained build order

## Public surfaces
- `public-surfaces/marketing-investor-spec.md` — abarva.ai + /investors

## Meta
- `_meta/page-design-backlog.md` — sequenced page work queue
- `_meta/product-reframe.md` — positioning + naming decisions
- `_meta/seed-data/` — composite client data

## Active corrections
- `_corrections/` — live fix lists; empty when nothing in flight

## Reference (partially superseded)
- `_reference/` — earlier-generation specs, still useful for context

## Archive
- `_archive/` — historical material, organized by date
```

### Phase 7 · Commit and push (2 min)

```bash
git add docs/
git commit -m "docs: organize spec files into docs/specs/ hierarchy · 14 canonical + archive"
git push
```

**Total time:** ~45 minutes of Codex work.

---

## Part 6 · Authority hierarchy enforcement

After cleanup, these rules apply to prevent regression:

1. **All new specs go to `docs/specs/[category]/`.** Nothing at repo root.
2. **Superseded specs move to `_reference/` with top-of-file banner.** Don't delete — preserve decision history.
3. **`docs/specs/README.md` is the index.** Update when specs are added/superseded.
4. **Session handoffs go to `_archive/[date]/handoffs/` at session end.** Not at repo root.
5. **When asking Codex/Claude Code to read a spec, give full path `docs/specs/...`.** Removes ambiguity.

---

## Part 7 · Things I noticed worth flagging

**1. The data ingestion spec exists and is complete.** 128KB, 6 packets. I wrote this earlier and forgot. You may not have seen it. Worth reviewing — it covers automated pipelines, segment catalog, template library, authoring workbench, and lineage/provenance. Directly addresses the "showcase data sets loaded by segments" question you raised this morning.

**2. Several Pack docs referenced in handoff don't appear in Finder screenshot.** Either they were cleaned up already or they're in a subdirectory. If Codex finds them, they go to `_reference/packs/`.

**3. `ABARVA_REFERENCE.md` might be your README.** It's 40KB and named generically. If it's a current project reference doc, it could be the seed for the new `docs/specs/README.md`. Codex should open it.

**4. You have at least three files named with "FINAL" in the title.** `FINAL_BUILD.md`, `FINAL_INSTRUCTION.md`, `CLAUDE_CODE_INSTRUCTION_FINAL.md`. Classic archaeology smell. All should go to archive; what's "final" in April 14 is almost certainly not final now.

**5. There's no git history for most of these files yet.** Moving them into `docs/specs/` + committing is the first time most of this spec work enters version control. Critical leverage moment.

**6. Once this cleanup lands, you'll want a convention for future specs.** Recommendation: all new specs get filenames without redundant `abarva-` prefix (since they're in the abarva repo). So next spec is `docs/specs/programs/new-feature.md`, not `docs/specs/programs/abarva-new-feature.md`. Post-cleanup discipline.

---

## Summary

**Files I read directly:** 21 files. Classified:
- 14 CANONICAL (to `docs/specs/[category]/`)
- 3 PARTIALLY SUPERSEDED (to `docs/specs/_reference/`)
- 2 ARCHIVE session handoffs (to `docs/specs/_archive/`)
- 1 ARCHIVE draft (to `docs/specs/_archive/`)
- 1 CANONICAL time-limited (corrections doc)

**Files at repo root I couldn't read:** ~25+ files. Recommendations:
- Most `CLAUDE_CODE_*.md`, `FINAL_*.md` → archive
- `BUILD_v2.md` (528KB) → likely archive, confirm first
- Old `Abarva_*.md` from April 13-15 → likely archive (ancestors of current canonical)
- `homepage.tsx` etc → move to src/ or archive based on imports
- `main` (0 bytes) → delete

**Codex execution time:** ~45 minutes

**Risk if skipped:** Spec confusion, duplicate work, investor-diligence embarrassment, Mac-crash data loss.

**Recommendation:** Interrupt Codex Tower work for 45 min. Execute this cleanup. Resume Tower against clean repo.
