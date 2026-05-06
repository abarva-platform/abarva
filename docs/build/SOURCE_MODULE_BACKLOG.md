# Source Module Backlog
**Design reference:** `~/Downloads/SETUP UPDATED/Source End-to-End.html` (14 templates, 3 waves)  
**Codebase snapshot:** `src/app/(maestro)/source/` (13 routes) · `src/components/source/` (77 components) · `src/lib/source/` (119 files)  
**Date:** 2026-05-06

---

## Summary verdict

The Source module has substantial code — 77 components, 13 routes, 119 lib files — but the architecture does not match the design. The design specifies a **two-column universal canvas** (left chat lane + right stage canvas) that governs 7 of 11 steps. The codebase uses a **tab-based multi-panel layout** (10 tabs inside WorkingPane). These are not the same shape and cannot be reconciled with styling — they require a structural rebuild of `SourceEventDetailPage.tsx`.

Beyond that there are five distinct gap categories:

| Category | Count |
|---|---|
| Route missing entirely | 1 (vendor detail) |
| Component missing entirely | 4 (context-bundle strip, 3-choices input, mini-rail, waiver flow) |
| Existing component wrong shape | 8 |
| Stage model divergence | 1 (legacy 10-stage vs canonical 11-stage names) |
| Filter/portfolio gap | 1 (4 stage pills vs 11) |
| Design system token mismatch | 1 (Fraunces/Inter vs Georgia/DM Sans) |

---

## T01 · Portfolio `/source`

### Design spec
- Header eyebrow: "Source · operating room" + h1 + sub text + **"Import RFP"** button + **"+ New sourcing event"** button
- Filter row: "All Source (N)" · divider · **"Stage" label** then 11 stage pills (Strategy, Scope, RFP, Responses, Evaluation, Pricing, BAFO, Decision, Selection, Transition, Value) · divider · **"Status" label** then 3 status pills
- Portfolio table: 5 columns — **Event** (name + category/owner line) · **Stage · 11-step rail** (11 mini-step dots, done/current/future states) · **Top blocker · agent recommendation** (agent tag + blocker text) · **Value at stake** (range + "PROJECTED · v2 PENDING" label) · **Gate** (status chip)

### Current code
- 4 stage filters only: BAFO, Pricing, Evaluation, Responses
- No "Stage:" or "Status:" section dividers/labels in the filter strip
- No 11-step mini-rail in table rows (no progress dot visualization)
- No "Top blocker · agent recommendation" column
- No "Value at stake" column with range display
- No "Gate" column
- Uses `SourcingEventTable` — unknown column layout, but `SourceCommandHeader` + `SourcePortfolioAgentCanvas` + `SourceMissionPreview` are above it — none of these are in the design

### Gaps
| Gap | Severity |
|---|---|
| 7 missing stage filter pills (Strategy, Scope, RFP, Decision, Selection, Transition, Value) | High |
| No "Stage:" / "Status:" eyebrow labels separating pill groups | Medium |
| No 11-step mini-rail in each portfolio row | High |
| No "Top blocker · agent recommendation" column | High |
| No "Value at stake" column | High |
| No "Gate" status chip column | Medium |
| Extra components above table (SourceCommandHeader, AgentCanvas, MissionPreview) not in design | Low |

---

## T02 · Create Event `/source/new`

### Design spec
- **Modal overlay** (not a full page) — centered, white card on cream backdrop
- 5 category cards in a grid: **Application Managed Services** (Lead: Nexus) · **Cloud & Infrastructure** (Lead: Sentinel & Atlas) · **Data & Analytics** (Lead: Steward & Sentinel) · **Enterprise Software** (Lead: Atlas) · **Something else** (dashed border, free-text path)
- Each card: icon + name + description + agent lead
- Amber banner at bottom: "Deterministic caveat — picking a path scaffolds the event but does not commit you"
- Selecting a category scaffolds an event with the right artifact pack, agent line-up, and gate criteria

### Current code
- Full page (`SourceOriginatePage`) — not a modal
- **5 structured intake form fields**: trigger, decisionOwner, scopeBoundary, valueTarget, baselineOwner
- Each field has an agent label (Sentinel / Steward / Atlas) but as form metadata, not category cards
- Paradigm is: fill-in-the-blank fields → submit; design paradigm is: pick-a-category → scaffold

### Gaps
| Gap | Severity |
|---|---|
| Form paradigm vs. modal-with-5-cards paradigm — structural difference | Critical |
| No category cards with agent lead lines | High |
| No scaffolding-on-category-select behavior | High |
| No "deterministic caveat" amber banner | Low |

---

## T03 · Universal Canvas `/source/events/[eventId]`

This is the most critical gap. The design's "Universal Canvas" is the primary surface for 7 of 11 steps (Strategy, Scope, RFP, Responses, BAFO, Selection, Transition). The codebase's event detail is architecturally different.

### Design spec (T03 shell — governs steps 1, 2, 3, 4, 7, 9, 10)
```
[id-strip: breadcrumb + event title + meta + status chip]
[11-step rail: clickable step nodes — done/current/future states + progress line]
[canvas-shell: two columns]
  LEFT — chat-lane (~40% width):
    · agent header (avatar + name + status "SCOPED · AMS-OUT-2026 · STEP 2")
    · chat-subhead ("Lead agent for Step 2 Scope. I keep the boundary tight.")
    · context-bundle strip: "EVENT · STEP 2 · DATA READINESS 3/6 · ARTIFACTS 2 · 0 VENDORS · 0 EVIDENCE"
    · chat thread (agent + user bubbles)
    · chat-input area:
        - "↳ Three choices for Step 2" label
        - 3 contextual choice buttons (stage-specific)
        - free-text input + send button
  RIGHT — canvas (~60% width):
    · stage-frame: eyebrow + step name + intent text + "Continue this step →" button + stage-state-banner (entered N days ago · gate status)
    · gate panel: gate heading (Step N → Step N+1) + criteria list (✓/!/○) + promote button
    · artifact shelf: "Required" group + "Optional" group, each with artifact rows (code · name · status · arrow)
    · bottom-grid: sponsor/team KVs · value-at-stake with range · recent activity feed
```

### Current code architecture
- Tab-based layout: 10 tabs (Summary, Pricing, BAFO, Risk, Readiness, Missions, Signals, Linked Program, Transition, Award)
- `StageTrackerStrip` uses legacy stage names: Plan, RFI, Shortlist, RFP, Q&A, Initial Bid, BAFO, Selection, Award, Onboard — **not the 11-step canonical model**
- `SentinelAgentColumn` is a sidebar column, not a chat lane with thread + 3 choices
- No "context-bundle strip" anywhere
- No "3 choices" UX pattern (contextual dossier-mandated choice chips per step)
- No stage-specific artifact shelf (Required + Optional per current step)
- No "Continue this step →" CTA button in stage-frame
- No stage-state-banner ("entered N days ago · gate at X/Y")
- Gate panel (`GateCriteriaPanel`) exists but is embedded in "Readiness" tab, not in the right canvas rail
- Bottom-grid (sponsor/team KVs + value range + activity feed) does not exist

### Gaps
| Gap | Severity |
|---|---|
| Tab architecture must become two-column canvas-shell | Critical |
| 11-step rail uses wrong stage names (legacy 10 vs canonical 11) | Critical |
| No chat lane with persistent agent header + thread + input | Critical |
| No "context-bundle strip" (data readiness / artifact count / vendor count / evidence count) | High |
| No "3 choices" contextual input pattern | High |
| No per-step artifact shelf (required + optional) | High |
| No stage-frame with intent text + "Continue this step" CTA | High |
| No stage-state-banner (time-in-step + gate progress) | High |
| Gate panel exists but in wrong location (tab vs. right canvas) | High |
| No bottom-grid (sponsor KVs + value range + recent activity) | Medium |

---

## T04 · Evaluation Canvas `/source/events/[id]?step=5`

### Design spec
- Same T03 shell (id-strip + 11-step rail + chat-lane + canvas)
- Canvas payload differs: **vendor × criteria matrix table** (4 vendors × 8 criteria, score bars + weighted totals + rank)
- View toggle: Score | Rationale | Evidence
- Steward leads chat lane (not Nexus)
- Evidence banner: Steward note on weight sensitivity
- Gate panel: 5 criteria (weight set signed, two-rater minimum, evidence cited, etc.)

### Current code
- `EvaluationCriteriaEditor.tsx` exists but renders as a form/editor, not a scored matrix
- No score bar visualization (numerical score + horizontal fill bar)
- No weighted-total column
- No rank (#1, #2, #3) column
- No Score/Rationale/Evidence view toggle

### Gaps
| Gap | Severity |
|---|---|
| No vendor-by-criteria score matrix with score bars | High |
| No weighted-score + rank display | High |
| No view toggle (Score / Rationale / Evidence) | Medium |
| Steward as lead agent for Step 5 (vs. Sentinel default) | Medium |

---

## T05 · Pricing Canvas `/source/events/[id]?step=6`

### Design spec
- Same T03 shell
- Canvas payload: **TCO normalization table** (vendor · list TCO · transition cost normalized · egress over-base · migration risk reserve · normalized TCO · Δ vs. list) with TRAP callouts
- **Pricing trap log** panel: categorized P0/P1/P2 traps with agent attribution
- Gate panel: 5 criteria (P0 traps resolved, BAFO question pack signed, etc.)

### Current code
- `SourcePricingComparisonPanel.tsx` exists — likely has pricing comparison but not TCO normalization with trap detection
- `AmsBafoPanel.tsx` exists but is BAFO-specific
- No trap log panel (P0/P1/P2 categorization)

### Gaps
| Gap | Severity |
|---|---|
| No TCO normalization table with TRAP callouts inline | High |
| No pricing trap log (P0/P1/P2 with agent attribution) | High |
| Normalization columns (transition cost, egress, risk reserve, Δ vs. list) missing | High |

---

## T06 · Executive Decision Canvas `/source/events/[id]?step=8`

### Design spec
- **No chat lane** — this step breaks the T03 shell into a summary-brief format
- Atlas decision brief card: recommendation headline + 3-column tradeoff grid (value posture / risk posture / transition posture)
- Finalist comparison KV table + decision posture KV table
- Action buttons: "Approve Atlas recommendation →" · "Approve with conditions" · "Send back for re-work" · "Review evidence trail ↗"

### Current code
- `SourceExecutiveDecisionSummaryPanel.tsx` exists — likely partial
- `SourceCommercialExecutiveBrief.tsx` exists — likely overlaps
- Neither known to have the 3-column tradeoff grid or approve/reject action buttons tied to gate promotion

### Gaps
| Gap | Severity |
|---|---|
| No 3-column tradeoff grid (value / risk / transition posture) | High |
| No approve/reject/rework action buttons tied to promotion | High |
| Atlas as lead agent for this step may not be wired | Medium |

---

## T07 · Value Realization Canvas `/source/events/[id]?step=11`

### Design spec
- Atlas value posture card: realized / committed amounts + narrative
- 4 value lines ledger: Line code · Commitment description · Projected · Committed · Measured · State (Projected/Committed/Measuring/Realized)
- Atlas note amber banner on underperforming lines
- "v2 PENDING SUBSTRATE" stamp on all value fields (must not claim live data)

### Current code
- `SourceValueLedger.tsx` exists — likely has value lines but unknown if it matches the 4-state model (projected/committed/measuring/realized)
- No "v2 PENDING SUBSTRATE" stamp visible

### Gaps
| Gap | Severity |
|---|---|
| 4-state value model (projected/committed/measuring/realized) may not be complete | High |
| No "v2 PENDING SUBSTRATE" flag on value fields | Medium |
| Atlas value posture card format unknown | Medium |

---

## T08 · Scorecard Governance `/source/events/[eventId]/scorecard`

### Design spec
- Route exists: `/scorecard`
- Weight set table with version history per criterion (v1 → v2 change + EA council / sponsor / Steward sign-off state per row)
- Audit trail: timestamped log of who changed weights and why
- Action buttons: Lock weights · Escalate to sponsor · Run sensitivity report

### Current code
- `ScorecardGovernancePanel.tsx` exists — likely has the score table
- Route `/scorecard` exists
- Unknown if weight versioning, audit trail, or action buttons are implemented

### Gaps
| Gap | Severity |
|---|---|
| Weight versioning per criterion (v1 → v2 with dispute state) likely missing | High |
| Audit trail (who changed what, when, why) likely missing | High |
| Sensitivity report CTA not known to exist | Medium |

---

## T09 · Artifact Detail `/source/events/[eventId]/artifacts/[artifactId]`

### Design spec
- Full page (not drawer) — two-column: left = document body + version history, right = metadata rail
- Document body: sections with green/amber/gray left-border tiers (full-text / outline / not-started)
- Version history: vN.N · description · timestamp · author
- Right rail metadata: artifact code · step · tier (OUTLINE/FULL) · owner · required · gate-defining
- Evidence cited list with readiness badges
- Sign-offs needed (lead / sponsor / EA council)
- "Submit for review" CTA

### Current code
- Route `/artifacts/[artifactId]` exists
- `SourceArtifactDrawer.tsx` — a **drawer** component, not a full-page layout
- The full-page artifact detail surface with document body + version history is likely missing

### Gaps
| Gap | Severity |
|---|---|
| Artifact detail is a drawer, not a full-page layout | High |
| No document body with section-level tier indicators | High |
| No version history log per artifact | High |
| No sign-offs panel | Medium |
| No evidence-cited list with readiness badges | Medium |

---

## T10 · Vendor Detail `/source/events/[eventId]/vendors/[vendorId]`

### Design spec
- Dedicated vendor route — vendor head (name + company meta + status chip + "Continue this vendor →" CTA)
- 3-column summary: response completeness · pricing normalized · risk posture (Sentinel)
- Scorecard rows table: criterion · score · weight · weighted · rater 1 · rater 2 · deviation
- BAFO history: rounds with descriptions, dates, signed status

### Current code
- **Route does not exist** — no `/vendors/` segment in `src/app/(maestro)/source/`
- No vendor detail page of any kind
- Vendor data is referenced inside event detail tabs but there's no dedicated vendor surface

### Gaps
| Gap | Severity |
|---|---|
| Vendor detail route entirely missing | Critical |
| No vendor head layout | Critical |
| No per-vendor scorecard row drill-down | Critical |
| No BAFO round history per vendor | Critical |

---

## T11 · Source Value Ledger `/source/value`

### Design spec
- Header: "Source · value posture" eyebrow + aggregate h1 ("$44.2M projected · $5.6M committed · $2.07M realized across 4 events.")
- 4-stat bar: Projected · Committed · Measuring · Realized (each with Fraunces serif large number)
- Cross-event ledger table: Event · Value line · Projected · Committed · Measured · State (with links to T07 per event)
- Atlas note amber banner on underperforming lines

### Current code
- `/source/value` route exists
- `SourceValueLedger.tsx` exists
- Hard-coded value "$2.1M sourcing-attributed value" suggests partial fixture data
- Unknown if the 4-stat bar exists or the cross-event ledger table format matches

### Gaps
| Gap | Severity |
|---|---|
| 4-stat bar (projected/committed/measuring/realized) may be absent or differently structured | High |
| Cross-event ledger table column structure may not match design | Medium |
| Atlas note pattern may be absent | Low |

---

## T12 · Data Readiness Drawer (overlay)

### Design spec
- Overlay drawer (slides from right rail)
- Sources list: each source with color-coded 7-state badge (usable evidence / available / parsed / loaded / not-requested / stale / low-confidence)
- 7-state ramp legend explaining each state
- Sentinel note amber banner citing the blocking source

### Current code
- `SourceDataReadinessPanel.tsx` exists
- Unknown if it renders as a drawer overlay vs. inline panel
- Unknown if it has the 7-state model with color-coded badges
- Unknown if it has the state legend

### Gaps
| Gap | Severity |
|---|---|
| 7-state model may not be fully implemented | High |
| Drawer overlay treatment may be missing (may be inline panel) | Medium |
| State legend may be missing | Low |

---

## T13 · Evidence Drawer (overlay)

### Design spec
- Overlay drawer — invoked from artifact, scorecard, pricing, BAFO
- Evidence items: each with name, readiness badge, source/parse metadata, citation note
- Sentinel attestation green banner at bottom

### Current code
- `AddEvidenceForm.tsx` — this is for **adding** evidence, not viewing cited evidence
- `BulkEvidenceImportButton.tsx` — bulk add
- No dedicated "view evidence citations" drawer component visible
- `EvidenceCoverageHeatmap.tsx`, `EvidenceNetworkGraph.tsx` exist in reasoning folder — these are analysis tools, not the citation drawer

### Gaps
| Gap | Severity |
|---|---|
| No "evidence citations per artifact" view drawer | High |
| Evidence tools are add/analysis only — no view-with-readiness-badge pattern | High |
| Sentinel attestation footer banner missing | Low |

---

## T14 · Gate Detail Drawer (overlay)

### Design spec
- Overlay drawer — invoked from gate panel's "Open gate detail ↗" link
- Criteria list with met/blocked/not-started states + evidence citations per met criterion
- **Waiver path** amber banner: sponsor can sign waiver to advance at outline-tier (Sentinel appends low-confidence flag)
- Action buttons: "Promote to Step N →" (disabled if gate not met) · "Request waiver…" · "Notify sponsor"

### Current code
- `GateCriteriaPanel.tsx` — inline panel component
- Route `/source/events/[eventId]/scorecard` is the closest dedicated gate view
- No waiver mechanism anywhere in codebase
- No "Notify sponsor" action button
- No "Request waiver" flow

### Gaps
| Gap | Severity |
|---|---|
| Gate detail is inline panel, not an overlay drawer | Medium |
| No waiver request flow | High |
| No "Notify sponsor" action | Medium |
| No evidence citation per met criterion | Medium |

---

## Architecture mismatches (cross-cutting)

### 1. Stage model — names diverge

| Layer | Stage model |
|---|---|
| Design HTML | 11 steps: Strategy · Scope · RFP · Responses · Evaluate · Pricing · BAFO · Decision · Select · Transition · Value |
| `constants.ts` | 11 keys: strategy · scope · rfp · responses · evaluation · pricing · bafo · executive_decision · selection · transition · value ✓ |
| `SourceEventDetailPage.tsx` STAGES array | 10 legacy names: Plan · RFI · Shortlist · RFP · Q&A · Initial Bid · BAFO · Selection · Award · Onboard ✗ |
| `StageTrackerStrip` | Driven by legacy STAGES array |

The canonical keys in `constants.ts` are correct. The hardcoded `STAGES` array in `SourceEventDetailPage.tsx` must be replaced with the canonical 11 stages from constants.

### 2. Agent lead per step — design is dynamic

Design specifies different lead agents per step:
- Steps 1, 2, 3, 4, 6: **Nexus** leads
- Step 5 (Evaluate): **Steward** leads  
- Step 8 (Decision): **Atlas** leads
- Step 11 (Value): **Atlas** leads

Current code hardcodes Sentinel as the portfolio agent and uses `SentinelAgentColumn` throughout. The chat lane agent must be dynamically resolved from the current step.

### 3. "Three choices" pattern — absent

Every step in the design has 3 contextual action chips above the free-text input. This is described in the Source Dossier as the "dossier-mandated three choices" pattern. It does not exist anywhere in the current codebase. This needs a `StepChoices` component that resolves to step-specific options.

### 4. Promote gate / advance step — no flow

The design's gate panel has a "Promote to Step N →" button that is disabled until all criteria are met, with a waiver path for edge cases. No such promotion flow exists in the current codebase.

---

## Design system token divergence

| Property | Design HTML (`source-tokens.css`) | Codebase (`SHELL` tokens / AbarVa v2) | Action |
|---|---|---|---|
| Primary serif | Fraunces (opsz variable, 400–900) | Georgia (AbarVa v2, locked) | Founder ruling needed |
| Body sans | Inter (400–700) | DM Sans | Founder ruling needed |
| Code mono | JetBrains Mono | JetBrains Mono ✓ | No action |
| Background | `#f5f1eb` (var --cream) | `#F8F7F4` (COLORS.cream) | Near-match, use existing |
| Value display numbers | Fraunces 28px 800 weight | Georgia equiv | Blocked on serif ruling |

The CSS variables in the design HTML reference `Fraunces` throughout for h1, h2, serif display numbers, and portfolio event names. The locked AbarVa v2 design system uses Georgia. These are incompatible — **do not start implementing typography until the founder rules on whether Source gets Fraunces or stays on Georgia**.

---

## What is already built and serviceable

These components have real substance and should be adapted, not rebuilt:

| Component | What it has | How it maps to design |
|---|---|---|
| `GateCriteriaPanel.tsx` | Criteria list with met/blocked states | Becomes the gate panel in the T03 right canvas rail |
| `ScorecardGovernancePanel.tsx` | Score table structure | Becomes T08 with weight versioning added |
| `SourceDataReadinessPanel.tsx` | Readiness state tracking | Becomes T12 drawer content |
| `SourcePricingComparisonPanel.tsx` | Pricing comparison structure | Becomes T05 pricing table (needs trap detection) |
| `SourceArtifactDrawer.tsx` | Artifact metadata | Promotes to full-page T09 artifact detail |
| `EvaluationCriteriaEditor.tsx` | Criteria editor | Needs to become scored matrix viewer |
| `SourceValueLedger.tsx` | Value lines data | Becomes T07 + T11 ledger views |

---

## Delivery waves (mirrors design doc)

### Wave 1 · Spine (foundation — unblocks everything)
These must land first. Nothing else renders correctly without them.

1. **Fix 11-step rail** — replace legacy STAGES array in `SourceEventDetailPage.tsx` with canonical 11 steps from `constants.ts`; update `StageTrackerStrip` data
2. **T01 Portfolio** — add 7 missing stage filter pills; add mini-rail column; add blocker column; add value-at-stake column; add gate chip column
3. **T02 Create Event** — replace form-based `SourceOriginatePage` with 5-category modal pattern
4. **T03 Universal Canvas** — rebuild `SourceEventDetailPage.tsx` from tab layout to two-column canvas-shell; add chat lane with context-bundle strip + 3-choices input; add stage-frame with intent + CTA; relocate gate panel to right canvas; add artifact shelf; add bottom-grid
5. **T12 Data Readiness Drawer** — ensure 7-state model; convert to overlay drawer
6. **T14 Gate Detail Drawer** — convert `GateCriteriaPanel` to drawer; add waiver flow; add promote button logic

### Wave 2 · Tables (step-specific canvas variants)
4. **T04 Evaluation** — vendor × criteria score matrix with score bars + weighted totals + view toggle
5. **T05 Pricing** — TCO normalization table + trap log (P0/P1/P2) with TRAP callouts inline
6. **T08 Scorecard Governance** — weight versioning table + audit trail + sensitivity CTA
7. **T09 Artifact Detail** — promote from drawer to full-page; add doc body with section tiers + version history + sign-offs

### Wave 3 · Exec + Ledger
8. **T06 Executive Decision** — Atlas decision brief card + tradeoff grid + approve/rework actions
9. **T07 Value Realization** — Atlas value posture card + 4-state ledger
10. **T10 Vendor Detail** — new route `/vendors/[vendorId]` + vendor head + scorecard rows + BAFO history
11. **T11 Value Ledger** — 4-stat bar + cross-event ledger; align with T07 data
12. **T13 Evidence Drawer** — new component for viewing evidence citations with readiness badges

---

## Pre-implementation blockers

Before writing any code on Wave 1:

1. **Typography ruling required** — Fraunces (design) vs. Georgia (AbarVa v2 locked). If Source stays on Georgia, portfolio event names and value numbers need a Georgia-weight treatment to match the design's visual dominance. Flag to founder.

2. **"v2 PENDING SUBSTRATE" policy** — Design explicitly stamps all value fields as placeholder. Implementation must render these numbers with a visual flag (amber "v2" badge or strikethrough) rather than presenting them as live data. Confirm the intended treatment before implementing T07 and T11.

3. **Step-to-agent mapping** — A canonical `STEP_AGENT_MAP` object needs to be defined in `constants.ts` before the chat lane can dynamically resolve agent identity. Suggested:
   ```ts
   export const STEP_AGENT_MAP: Record<SourceStageKey, string> = {
     strategy: 'Nexus', scope: 'Nexus', rfp: 'Nexus', responses: 'Nexus',
     evaluation: 'Steward', pricing: 'Nexus', bafo: 'Nexus',
     executive_decision: 'Atlas', selection: 'Nexus',
     transition: 'Nexus', value: 'Atlas',
   };
   ```

4. **Codex collision check** — Before touching anything in `src/lib/source/context-builder.ts`, `broker`, `vector`, or `evidence` layers, run: `gh pr list --search "source OR retrieval OR evidence OR context-broker"` to check for active Codex work.
