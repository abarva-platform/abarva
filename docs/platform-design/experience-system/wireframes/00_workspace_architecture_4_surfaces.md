---
name: Workspace Architecture · 4 surfaces · canonical chassis
description: One template, four jobs. Setup / Programs / Intelligence / Control Tower share a single chrome — left rail, top bar, slim middle strip, dark agent column on the left, working pane on the right. The agent never moves; the work changes.
type: canon
status: AUTHORED-DRAFT
version: 1.0
date: 2026-04-27
supersedes:
  - 00_EXPERIENCE_SYSTEM_MASTER_ANCHOR.md (chassis section only)
  - 03b_program_detail_authored_spec.md (Programs surface fills this chassis)
  - 08b_intelligence_authored_spec.md (Intelligence surface fills this chassis)
  - 09b_control_tower_authored_spec.md (Control Tower surface fills this chassis)
---

# Workspace Architecture · 4 surfaces

This is the **canonical app chassis** for AbarVa product surfaces. The four maestro-facing surfaces — **Setup**, **Programs**, **Intelligence**, **Control Tower** — share a single template. The agent column never moves; the work changes.

The full HTML reference lives at `00_workspace_architecture_4_surfaces.html` in this folder.

## What stays identical on every surface

| Region | Spec |
| --- | --- |
| **Left icon rail** | 76px wide. Setup / Programs / Intel / Tower as vertical icon-mono items. Active item gets ink fill. AbarVa monogram at top, user avatar at bottom. |
| **Top bar** | 48px tall. Tenant account chip · `Locked` mono pill · surface context ("`APX-01` Morrison Owned Brand Margin Recovery"). Right side: time + user avatar. |
| **Middle strip** | 44px tall, slim band. Always horizontal. Contents vary per surface — see below. |
| **Body** | Two-pane grid: **agent column 480px** (left) + **working pane** (fills remaining, scrolls independently). |
| **Agent column** | Dark navy (`var(--ink)`), full body height. Agent ID header (monogram circle + name + role + state pill) → serif italic agent quote → mono context line ("Reading X · Y · Z") → "Suggested · {Agent} has prepared" mono divider → 3 lettered actions (A / B / C) → bottom: rounded `Type to {agent}...` input box with mono `↵ Send` glyph. |
| **Working pane** | ERP-density. `work-section` blocks: mono eyebrow → serif h3 → mono meta → compact rows (mono ID + sans label + status pill + mono time + ghost button). |
| **Aesthetic** | AbarVa locked palette. Fraunces serif (→ Georgia in our stack) for agent voice + section headlines. Inter sans (→ DM Sans) for working content. JetBrains Mono for IDs, eyebrows, status states. |

## What varies per surface

| Surface | Lead agent | Middle strip | Working pane content |
| --- | --- | --- | --- |
| **Setup** | Steward | Sub-nav (Connectors · Users · Audit · Policies · Tenant) | Connector grid + audit log |
| **Programs** | Nexus | Six-phase journey (Discovery / Synthesis / Design / Build / Activate / Operate) | Active deliverable · evidence stack · gate checks |
| **Intelligence** | Sentinel | Tier filter (All · M·Meta · T1·Craft · T3·Use-case · In review · Candidates) | Pattern catalogue rows |
| **Control Tower** | Atlas | Severity filter (High / Medium / Low + Time-window) | Pressure mini-cards + cross-program activity |

## Agent voice contract

- **Steward** governs · narrates governance state.
- **Nexus** orchestrates · narrates the gate decision.
- **Sentinel** validates · narrates evidence basis.
- **Atlas** synthesises · narrates the executive read.

## What this supersedes

- The piecemeal "alignment" work on each surface (e.g. workbench restructures inside `ProgramCanonicalDetail`) is replaced by porting that surface to fill this chassis.
- The viewport-fixed `AskAnythingBar` (#477) **is replaced** by the input box that sits at the bottom of the dark agent column inside the body. The bar is no longer viewport-fixed; it lives inside the agent column.
- The previous top-bar `AbarvaNav` is replaced by the left icon rail + 48px slim top bar.

## Implementation order

1. **PR 1 — `AppFrame` chassis primitive.** Build the shared shell: rail, topbar, middle strip slot, body grid, agent column, working pane. No surface wired yet.
2. **PR 2 — Programs detail port.** Move the existing Nexus workbench content into the chassis: phase-journey strip → middle strip; Nexus brief + lettered actions + Ask box → agent column; tab panels (Overview / Workshop / Deliverables / Evidence / Actions / Gate) → working pane (ERP-densified rows, not nested cards).
3. **PR 3 — Intelligence port.** Sentinel leads. Tier filter strip. Pattern catalogue rows.
4. **PR 4 — Setup port.** Steward leads. Sub-nav strip. Connector grid + audit.
5. **PR 5 — Control Tower port.** Atlas leads. Severity filter strip. Pressure cards + cross-program activity.
6. **(Eventual)** Replace the legacy `AbarvaNav` across remaining routes; retire viewport-fixed `AskAnythingBar`.

## Constraints (locked)

- AbarVa palette only: warm off-white surface (`#F8F7F4`), near-black ink, dark navy `#132B4F`, blue `#0B4A91`.
- No teal `#14B8A6` / `#0E9F8C`. No cyber/neon styling.
- No model / runtime / chat / upload / persistence imports until the agent runtime wave lands. Deterministic shells only.
- The agent column's input box is the **only** "Ask anything" surface. No chatbot drift, no avatars, no decorative AI sparkle.
