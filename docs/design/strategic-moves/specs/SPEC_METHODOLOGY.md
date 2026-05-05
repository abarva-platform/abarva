# Strategic Moves Detail Pages — Spec Methodology

| | |
|---|---|
| **Work Package** | F-01 |
| **Doc path** | `docs/design/strategic-moves/specs/SPEC_METHODOLOGY.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Signed off — binding for all Strategic Moves spec work |
| **Companion** | `SPECS_AND_AGENT_TRAINING_WBS.md` §3 |

---

## Purpose

This document is the standing instruction set for anyone authoring specification layers for the Strategic Moves detail pages. It defines:

- The five spec layers and what each produces
- File naming and directory structure
- Stable ID conventions
- Per-layer acceptance bars
- Sign-off process
- Change request process

Read this before writing any Layer 1–5 doc. All downstream spec work references vocabulary and IDs established here.

---

## 1 · The Two Pages

Every spec document belongs to exactly one of two pages:

| Page | Route | Directory |
|---|---|---|
| **Originate** | `/strategic-moves/new` | `specs/originate/` |
| **Workspace** | `/strategic-moves/[moveId]` | `specs/workspace/` |

The shared design reference is `docs/design/strategic-moves/15-workspace-v0.2.html` for Workspace and the Originate frames in `docs/design/strategic-moves/16-flow-cascade.html` (locked at v0.1).

---

## 2 · The Five Layers

Each page is specified across five layers. Layers are authored **in order**. Later layers reference vocabulary and stable IDs established by earlier layers. Writing Layer 3 before Layer 1 is a protocol violation.

```
Layer 1 (Anatomy)
   │ provides: stable IDs, zone hierarchy
   ▼
Layer 2 (State)  ─── references: IDs from Layer 1
   │ provides: page state combinations
   ▼
Layer 3 (Click)  ─── references: IDs (L1), states (L2)
   │ provides: interactions, URL changes, keyboard
   ▼
Layer 4 (Data)   ─── references: IDs (L1), interactions (L3)
   │ provides: data contracts, mutations, audit log
   ▼
Layer 5 (Knowledge) ─ references: all above + audit binding matrix
   │ provides: agent behavior contracts per phase
   ▼
Implementation gate — page can be built
```

Each layer has a dedicated file (or set of files). Each must pass its acceptance bar before work begins on the next layer.

---

### 2.1 Layer 1 — Page Anatomy

**What it produces:**

A hierarchical inventory of every zone, panel, and element on the page. Every element that is visible, clickable, or otherwise meaningful gets a **stable ID** (see §3). All subsequent layers reference these IDs.

**Format:** One or more markdown documents in `specs/{page}/01-anatomy*.md`.

**Required content per element:**

- Stable ID
- Element type (zone, panel, list, item, button, field, label, etc.)
- Parent element (ID of the containing zone or panel)
- Visibility rules (always visible / conditional — state condition referenced by Layer 2 state name)
- Brief description of what it displays or does

**Workspace anatomy is split across files:**

| File | Scope |
|---|---|
| `01-anatomy-shell.md` | Elements present in all phase contexts (header, rail, chat lane, sponsor strip) |
| `01-anatomy-canvas-p0.md` through `01-anatomy-canvas-p5.md` | Canvas content specific to each phase |
| `01-anatomy-viewmodes.md` | How anatomy changes in past / future / handed-off view modes |

**Originate anatomy:**

Single file: `01-anatomy.md` covering the full page.

**Hard requirements (do not omit):**

1. Every clickable element from the cascade frame(s) for this page must have a stable ID.
2. **Workspace rail nodes:** phase short-name (used on the rail dot) vs. phase full name (used in the identity card) must both be documented. Note: the constant `PHASE_SHORT_NAMES` does not currently exist in the codebase — flag this as a substrate gap when writing rail anatomy.
3. **Originate scaffold placement:** the scaffold step list lives in the **chat lane** (NOT the canvas). The brief section panels live in the **canvas lane** (NOT chat). This is counterintuitive and must be stated explicitly.

**Acceptance bar:**

- Every clickable from the cascade has an ID
- Every visible field has an ID
- Every container has an ID
- No element is described in design without being in the anatomy
- Annotated screenshot (Layer 1.2) shows every ID overlaid

---

### 2.2 Layer 2 — State Inventory

**What it produces:**

A matrix of every meaningful state combination the page can be in, parameterized by the state dimensions defined for that page. Each state combination maps to visibility/enabled/disabled per element ID from Layer 1.

**Format:** `specs/{page}/02-state.md`

**Workspace state dimensions:**

| Dimension | Values |
|---|---|
| `viewMode` | `current`, `past`, `future`, `handed-off` |
| `gateState` | `not-evaluated`, `failing`, `partial`, `ready`, `promoted` |
| `userRole` | `viewer`, `contributor`, `lead`, `sponsor`, `governance` |
| `moveLifecycle` | `drafting`, `active`, `paused`, `handed-off`, `archived` |

The full cross-product is large (~500 combinations) but most are not meaningfully distinct. Aim for ~30 rows covering the cases that actually differ in behavior.

**Originate state dimensions:**

| Dimension | Values |
|---|---|
| `briefCompleteness` | `empty`, `partial`, `near-complete`, `complete` |
| `sponsorState` | `none`, `proposed`, `signed` |
| `foundationState` | `green` (F1–F4 all pass), `partial`, `red` |

**Required edge cases (both pages):**

These combinations must appear explicitly — they often break happy-path implementations:

- No sponsor assigned or available
- Required gate criterion changed mid-phase
- User opens page with missing or paused Move
- P5 state with all criteria met → Promote to Tower enabled

**Originate-specific required edge cases (per WBS O-2.3):**

- No sponsor available in ACL
- All foundation checks (F1–F4) red
- Archetype classification ambiguous (two archetypes tie)
- User closes tab mid-origination (what URL/state on return — resolves D-11 draft persistence)
- Two users open `/new` simultaneously (collision behavior)

**P5-specific note (W-2.3):**

The `governance.ts` gate definition currently uses 8-phase vocabulary and may not match the 6-phase P5→Tower gate. When writing W-2.3, reconcile the gate count against the audit binding matrix. Do not invent a count — resolve the discrepancy explicitly.

**Acceptance bar:**

- Every meaningful state combination has a row
- Every element from Layer 1 has a column
- All required edge cases are rows
- No "TBD" in any cell

---

### 2.3 Layer 3 — Click & Interaction Inventory

**What it produces:**

A specification of every interactive element: what it does, what state changes, what URL impact, what keyboard equivalent, what focus management.

**Format:** `specs/{page}/03-interactions*.md`

**Required columns per row (one row = one interaction):**

| Column | Content |
|---|---|
| `element-id` | Stable ID from Layer 1 |
| `trigger` | `click`, `keyboard`, `hover`, `focus` |
| `action` | `mutation`, `navigation`, `panel-toggle`, `modal-open`, `url-param-change` |
| `state-change` | Before state → after state (Layer 2 state names) |
| `side-effects` | Agent rescope, cache invalidation, analytics event |
| `url-impact` | `none`, `query-param`, `full-route-change` (must align with D-10) |
| `keyboard` | Key binding or `none` |
| `focus-target` | Which element receives focus after action |
| `loading-treatment` | What user sees during async operation |
| `error-treatment` | What user sees on failure |

**URL behavior rule (D-10 resolved):**

- `?phase=N` is set **only** when arriving from a deep link (attention banner, shared URL, portfolio drill)
- Rail clicks change canvas **without** pushing to URL history
- Page reload **preserves** URL state if `?phase=N` is present

Write W-3.4 (URL state spec) to enforce this exactly. Do not invent alternate URL behavior.

**Originate-specific hard requirement:**

Future phase nodes (P1–P5) on the phase rail are **non-interactive** when page is in Originate context. They must render with `disabled` semantics, no hover affordance, no click handler. The cascade implies but does not show this. State it explicitly.

**Acceptance bar:**

- Every clickable from Layer 1 has a row
- Keyboard navigation order specified for the full page
- URL behavior aligns exactly with D-10
- All loading and error states documented

---

### 2.4 Layer 4 — Data Binding Spec

**What it produces:**

For every visible field → data source, refetch rules, fallback, ownership. For every interaction → mutation API, optimistic update, rollback, audit log entry.

**Format:** `specs/{page}/04-data-bindings*.md` (split into read-bindings and write-bindings sections or files).

**Required columns — read bindings:**

| Column | Content |
|---|---|
| `element-id` | From Layer 1 |
| `db-table-or-view` | Source table/view/computed field |
| `query-api-route` | API route that fetches this data |
| `computed-or-stored` | Whether value is computed at query time or stored |
| `refetch-trigger` | What event causes a refetch |
| `fallback` | What renders when data is null or fetch fails |
| `update-permissions` | Which roles can update this field |

**Required columns — write bindings:**

| Column | Content |
|---|---|
| `interaction-id` | From Layer 3 |
| `mutation-api-route` | API route |
| `optimistic-update` | What UI changes before server response |
| `rollback-on-failure` | How UI reverts on server error |
| `audit-log-shape` | `{ action, by, at, prev, next }` for this mutation |
| `side-effects` | Other tables touched, notifications triggered, agent rescope |

**Substrate gap logging rule:**

Every binding that has no current substrate support must be logged in a substrate gap table in the same document:

| Gap ID | Element | Missing | Backlog item |
|---|---|---|---|
| `gap-ws-001` | `ws-canvas-gate-item-draft` | `engagement_gate_drafts` table | B-031 |

Never write "TBD" — either map the binding to existing substrate or create a numbered backlog item (B-0XX) and link it. The substrate gap log is one of the most important outputs of Layer 4.

**Acceptance bar:**

- Every visible field from Layer 1 has a read binding row
- Every interaction from Layer 3 has a write binding row (if mutating)
- All substrate gaps enumerated with backlog items
- Audit log shape documented for every write
- No "TBD"

---

### 2.5 Layer 5 — Knowledge Layer Surfacing Spec

**Hard dependency:** Layer 5 cannot start until:
1. F-04 audit completion (audit binding matrix merged and reconciled) — **complete as of PR #1526**
2. The training pack for the relevant phase (T-P0 for P0 surfaces, T-P1 for P1, etc.) is merged

**What it produces:**

Per-phase Nexus integration — what patterns load when, what the first message says, what evidence rules apply, what the agent must not do.

**Format:** `specs/{page}/05-knowledge-surfacing*.md` (per-phase splits for Workspace; single file for Originate P0).

**Required sub-sections per phase:**

| Sub-section | Content |
|---|---|
| **Pattern bundle** | Required + optional patterns (IDs from binding matrix); when they load |
| **First-message scaffold** | Exact parameterized prompt Nexus opens with; variants by Move state |
| **Suggested chip ladder** | Action chips shown under first message; state-dependent variation; each chip maps to a Layer 3 interaction ID |
| **Evidence rules** | For each claim type Nexus can make: what evidence chain must be cited |
| **Anti-hallucination rules** | Explicit prohibitions (must-not statements); testable |
| **Hand-off contract** | What Nexus preserves when user navigates away; what it resets |

**Anti-hallucination rule format:**

```
Rule AH-{page}-{phase}-{N}:
  Trigger: [what Nexus might do that is prohibited]
  Prohibition: Nexus MUST NOT [action] unless [evidence condition]
  Test: [describe a prompt that should trigger this rule and what refusal looks like]
```

**Acceptance bar:**

- First-message scaffold passes against 5 fixture inputs
- Every anti-hallucination rule has 3 test cases (prohibited prompt → expected refusal)
- Chip ladder maps to Layer 3 interaction IDs (no orphan chips)
- Pattern bundle references only IDs in audit binding matrix (no fabricated IDs)
- Hand-off contract covers all navigation scenarios from Layer 3

---

## 3 · Stable ID Convention

Every element has a stable ID of the form:

```
{page}-{zone}-{component}[-{qualifier}]
```

| Segment | Values | Notes |
|---|---|---|
| `page` | `ws` (workspace), `orig` (originate) | Always first |
| `zone` | `shell`, `rail`, `chat`, `canvas`, `header`, `identity` | Top-level zone |
| `component` | Noun-phrase of what the element is | e.g., `phase-node`, `gate-item`, `brief-section`, `sponsor-card` |
| `qualifier` | Phase shortcode or index when multiple instances exist | e.g., `p2`, `item-3`, `draft` |

**Examples:**

| ID | Description |
|---|---|
| `ws-rail-phase-node-p2` | Workspace rail — the P2 phase node dot |
| `ws-canvas-gate-item-3` | Workspace canvas — gate criterion item #3 |
| `ws-shell-sponsor-strip` | Workspace shell — the sponsor strip panel |
| `ws-chat-input` | Workspace chat — the text input field |
| `ws-identity-phase-label` | Workspace identity card — the phase label text |
| `orig-canvas-brief-section-1` | Originate canvas — first brief section panel |
| `orig-chat-scaffold-step-3` | Originate chat — scaffold step item #3 |
| `orig-rail-phase-node-p0` | Originate rail — the P0 (active) phase node |
| `orig-shell-promote-button` | Originate shell — the promote to P1 button |

**Anti-patterns (do not use):**

- Generic IDs like `button-1`, `panel-left`, `section-top`
- Positional IDs that become wrong after reorder (`first-button`, `third-item`)
- Implementation-detail IDs (`react-component-xyz`, `div-wrapper`)
- IDs that encode state (`enabled-gate-item`, `selected-phase`)

**Phase shortcodes:**

| Shortcode | Phase |
|---|---|
| `p0` | Originate |
| `p1` | Charter |
| `p2` | Diagnose |
| `p3` | Design |
| `p4` | Roadmap |
| `p5` | Mobilize |

---

## 4 · File Structure

```
docs/design/strategic-moves/
  specs/
    SPEC_METHODOLOGY.md           ← this file (F-01)
    STABLE_ID_CONVENTION.md       ← F-03 (more detailed examples)
    originate/
      01-anatomy.md               ← O-1.1
      01-anatomy-screenshot.png   ← O-1.2
      02-state.md                 ← O-2.1, O-2.2, O-2.3
      03-interactions.md          ← O-3.1, O-3.2, O-3.3, O-3.4
      04-data-bindings.md         ← O-4.1, O-4.2, O-4.3, O-4.4
      05-knowledge-surfacing.md   ← O-5.1 through O-5.6
    workspace/
      01-anatomy-shell.md         ← W-1.1
      01-anatomy-canvas-p0.md     ← W-1.2 (P0)
      01-anatomy-canvas-p1.md     ← W-1.2 (P1)
      01-anatomy-canvas-p2.md     ← W-1.2 (P2)
      01-anatomy-canvas-p3.md     ← W-1.2 (P3)
      01-anatomy-canvas-p4.md     ← W-1.2 (P4)
      01-anatomy-canvas-p5.md     ← W-1.2 (P5)
      01-anatomy-viewmodes.md     ← W-1.3
      02-state.md                 ← W-2.1, W-2.2, W-2.3, W-2.4
      03-interactions-shell.md    ← W-3.1
      03-interactions-canvas-p0.md through -p5.md   ← W-3.2
      03-interactions-viewmodes.md  ← W-3.3
      03-interactions-url.md        ← W-3.4
      03-interactions-keyboard.md   ← W-3.5
      03-interactions-loading.md    ← W-3.6
      04-data-shell.md              ← W-4.1
      04-data-canvas-p0.md through -p5.md  ← W-4.2
      04-data-writes-promote.md     ← W-4.3
      04-data-writes-gate.md        ← W-4.4
      04-data-writes-artifacts.md   ← W-4.5
      04-data-gaps.md               ← W-4.6
      04-data-audit-log.md          ← W-4.7
      05-knowledge-surfacing-overview.md  ← W-5.1
      05-first-messages-p0.md through -p5.md  ← W-5.2
      05-chips-all-phases.md        ← W-5.3
      05-viewmode-replay.md         ← W-5.4
      05-viewmode-preview.md        ← W-5.5
      05-cross-phase-nav.md         ← W-5.6
      05-evidence-rules.md          ← W-5.7
      05-fixtures.md                ← W-5.8
  agent-training/
    00-cross-phase-capabilities.md  ← T-X.1
    00-global-behavioral-rules.md   ← T-X.2
    p0-originate.md                 ← T-P0
    p1-charter.md                   ← T-P1
    p2-diagnose.md                  ← T-P2
    p3-design.md                    ← T-P3
    p4-roadmap.md                   ← T-P4
    p5-mobilize.md                  ← T-P5
```

---

## 5 · Sign-Off Process

Each layer has a two-step sign-off:

**Step 1 — PR opened by Claude Code:**
- Branch per §2.1 of `EXECUTION_PLAYBOOK.md`
- PR title per §2.2
- Self-QA per §2.3 + layer-specific QA (§2.4 or §2.5)
- PR description cites the WBS work package ID(s)

**Step 2 — Anand reviews and approves:**
- Anand uses the acceptance bar for this layer (§2.1–§2.5 above) as the review checklist
- Comments specify which acceptance bar item is not met
- Approval = layer is frozen for downstream work

**Frozen layer rule:**

Once a layer is signed off and the PR is merged, the layer is **frozen**. Downstream work may begin. Changes to a frozen layer require an amendment PR. An amendment PR must be reviewed before any downstream work that references the changed element proceeds.

**Amendment PR format:**

```
[SPEC-AMEND] Originate Layer 1: add orig-chat-scaffold-step-7 (O-1.1-amend-1)
```

The amendment must update any downstream layers that referenced the changed or added element.

---

## 6 · Change Request Process

Any change to an already-signed-off spec follows this process:

1. Identify the layer and element(s) affected
2. Determine which downstream layers reference those elements
3. Open an amendment PR for the originating layer
4. Open follow-on amendment PRs for each affected downstream layer
5. All amendment PRs must merge before implementation proceeds

Changes requested during the acceptance demo (A-4) are treated as defects, not scope changes, if they are required for the cascade flows to work. Changes that are "nice to have" go to the v0.2 backlog.

Changes to the Workspace v0.2 design or the cascade (locked at v0.1) require Anand's explicit authorization. Do not accept "let's also add X" during spec drafting without a decision log entry.

---

## 7 · References

| Document | Path | Purpose |
|---|---|---|
| Phase doctrine v0.2 | `docs/design/strategic-moves/PHASE_MODEL_V2_DOCTRINE.md` | Canonical phase definitions, rail labels, gate logic |
| Workspace v0.2 design | `docs/design/strategic-moves/15-workspace-v0.2.html` | Visual reference for anatomy, all 4 view modes |
| Flow cascade v0.1 (locked) | `docs/design/strategic-moves/16-flow-cascade.html` | Two user flows: Flow 1 (P2→P3 promote), Flow 2 (new originate) |
| Audit binding matrix | `docs/design/strategic-moves/PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` | Pattern catalog, phase→pattern bindings, §11/§12 reconciliation |
| WBS + Execution Playbook | `docs/design/strategic-moves/SPECS_AND_AGENT_TRAINING_WBS.md`, `EXECUTION_PLAYBOOK.md` | Work packages, QA gates, merge conventions |
| Stable ID convention | `docs/design/strategic-moves/specs/STABLE_ID_CONVENTION.md` | Extended examples, F-03 |
| Agent coordination protocol | `docs/audit/AGENT_COORDINATION_KNOWLEDGE_TRANSFER_PROTOCOL_2026-05-05.md` | Agent territory rules, stop conditions |

---

## 8 · Quick-start checklist for spec authors

Before writing any layer:

```
[ ] Read this doc (SPEC_METHODOLOGY.md)
[ ] Read STABLE_ID_CONVENTION.md (F-03)
[ ] Read the WBS work package for this layer (WBS §5.x)
[ ] Open the cascade HTML and the design reference HTML side by side
[ ] Confirm the preceding layer is signed off (frozen)
[ ] Confirm you have the correct file path for this deliverable (§4 above)
[ ] Check audit binding matrix if this is a Layer 4 or Layer 5 doc

During writing:
[ ] Every element ID uses the {page}-{zone}-{component}[-{qualifier}] pattern
[ ] No element from design is undocumented
[ ] All substrate gaps are logged with backlog item numbers
[ ] No "TBD" in any binding row

Before opening PR:
[ ] Universal self-QA (EXECUTION_PLAYBOOK.md §2.3) — all 7 checks
[ ] Layer-specific QA (EXECUTION_PLAYBOOK.md §2.4 or §2.5) — all checks
```
