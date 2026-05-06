# Source Design v0.3 — Reconciliation with Dossier v1.0
## Updates to the Audit Baseline

| | |
|---|---|
| **Doc ID** | `SOURCE_DESIGN_V03_RECONCILIATION_2026-05-05` |
| **Source documents** | `Source_End-to-End.html` (v0.3 design, 14 templates) + `AbarVa_Source_IT_Sourcing_Product_Requirements_Design_Dossier_v1.md` (dossier v1.0) |
| **Companion to** | `SOURCE_DOSSIER_DIGESTION.md` |
| **Purpose** | Reconcile what the v0.3 design changes from dossier v1.0; updates audit baseline |

---

## 1 · Headline finding

The v0.3 design is **a substantial evolution** of the dossier v1.0 vision. It carries the dossier's core vocabulary (4 agents, 11 steps, evidence/readiness states, gate posture) but materially advances the experience model in three ways that the audit prompt must accommodate:

1. **The "Universal Canvas" pattern** — 7 of the 11 steps share one shell. Only 4 steps get bespoke variants. This is a major simplification not present in dossier v1.0.

2. **The chat-lane-left / canvas-right shell** — borrowed directly from the Strategic Moves Workspace v0.2 pattern. The dossier described chat as right-rail; the v0.3 design moves it to left-lane as primary lane.

3. **Wave-based template grouping (1/2/3)** — explicit prioritization scheme (Spine / Tables / Exec) that the dossier didn't specify. Implementation sequencing implication.

The audit must use **v0.3 design as the design baseline** and the **dossier as the doctrine baseline**. They serve different roles. Where they conflict, v0.3 wins on UX/layout; dossier wins on vocabulary/forbidden-claims/agent-roles.

---

## 2 · The 14 templates and their relationship to dossier sections

| # | Template | Route / context | Wave | Maps to dossier section |
|---|---|---|---|---|
| 01 | Source Portfolio | `/source` | 1 Spine | §6.1 Source Dashboard + §6.2 Events Portfolio (consolidated) |
| 02 | Create Sourcing Event | `/source/new` (modal) | 1 Spine | New — not in dossier; advances "empty start" experience |
| 03 | Universal Event Canvas | `/source/events/[id]` (Step 2 demo) | 1 Spine | §6.3 Source Event Canvas + §5 Step Design Sheets (steps 1, 2, 3, 4, 7, 9, 10) |
| 04 | Evaluation Canvas | `/source/events/[id]?step=5` | 2 Tables | §5 Step 05 Evaluation (bespoke variant) |
| 05 | Pricing Canvas | `/source/events/[id]?step=6` | 2 Tables | §5 Step 06 Pricing Normalization (bespoke variant) |
| 06 | Executive Decision | `/source/events/[id]?step=8` | 3 Exec | §5 Step 08 Executive Decision (bespoke variant) |
| 07 | Value Realization | `/source/events/[id]?step=11` | 3 Exec | §5 Step 11 Value Realization (bespoke variant) |
| 08 | Scorecard Governance | `/source/events/[id]/scorecard` | 2 Tables | §6.4 Scorecard Governance |
| 09 | Artifact Detail | `/source/events/[id]/artifacts/[artifactId]` | 2 Tables | §6.5 Artifact Detail / Review |
| 10 | Vendor Detail | `/source/events/[id]/vendors/[vendorId]` | 3 Exec | New — not explicitly in dossier; emerges from vendor response work |
| 11 | Source Value Ledger | `/source/value` | 3 Exec | §6.6 Source Value Ledger |
| 12 | Data Readiness Drawer | overlay | 1 Spine | §9.1 (drawer realization of readiness states) |
| 13 | Evidence Drawer | overlay | 3 Exec | §10 (evidence as workflow object) |
| 14 | Gate Detail Drawer | overlay | 1 Spine | §5 (gate criteria as drawer interaction) |

### Audit implication

The audit can't just walk the 6 dossier-named routes — there are now 11 substantive surfaces (templates) plus 3 drawers. The Mode 3 Chrome crawl has more terrain to cover than the dossier suggested.

---

## 3 · Material changes from dossier v1.0 → v0.3 design

### 3.1 The Universal Canvas pattern (NEW)

**Dossier v1.0:** Implied each step has its own distinct UI behavior. Section 5 Step Design Sheets carry per-step specifications. Section 16 Detailed Interaction Maps carry templated content per step.

**v0.3 design:** Explicitly identifies that 7 of 11 steps share the SAME shell (chat lane left + stage frame + gate panel + artifact shelf + bottom grid). Only 4 steps get bespoke variants:
- Step 5 Evaluation → bespoke matrix variant (Template 04)
- Step 6 Pricing → bespoke pricing matrix variant (Template 05)
- Step 8 Decision → bespoke Atlas brief variant (Template 06)
- Step 11 Value → bespoke ledger variant (Template 07)

**Audit implication:** This is a real architecture decision. The audit must verify:
- Universal Canvas shell renders consistently across steps 1, 2, 3, 4, 7, 9, 10
- Bespoke variants are correctly invoked for steps 5, 6, 8, 11
- The shell handles step-specific content (gate criteria, artifacts, intent) without breaking layout
- Substrate supports both modes — universal step content + bespoke step content

### 3.2 Chat lane moved from right rail to left lane (CHANGED)

**Dossier v1.0:** Section 5 specifies "Right rail behavior: Agent guidance remains compact." Agent presence is supportive, sits in the rail.

**v0.3 design:** Chat lane is the LEFT lane (~360px wide). Canvas is the right region. The agent is co-equal with content, not auxiliary. This matches Strategic Moves Workspace v0.2 — same chat-left/canvas-right pattern.

**Audit implication:** The v0.3 design supersedes dossier on this point. The audit should:
- NOT flag "chat is in left lane" as deviation from dossier — it's the new spec
- Verify chat lane is consistently positioned across all 7 universal-canvas screens
- Verify the "context strip" appears in the chat lane (CONTEXT BUNDLE row)
- Verify three-choices-plus-custom appears in chat lane (per dossier §13.1 #4)

### 3.3 Step rail with mini-rail variant (NEW)

**Dossier v1.0:** Mentions journey/stage state but doesn't specify rail UI.

**v0.3 design:** 
- Full step rail in canvas header (11 numbered nodes with names, click-to-navigate)
- Mini-rail in portfolio rows (11 dots, no names, status indicator)

**Audit implication:** New element for the audit to verify:
- 11 nodes visible always
- Current step highlighted distinctly
- Past steps marked done; future steps marked future
- Click-to-navigate behavior (or explicitly disabled for future steps)
- Mini-rail in portfolio matches main rail in canvas

### 3.4 Promote action with disabled state (NEW)

**Dossier v1.0:** Mentions gate state and exit criteria but doesn't specify promote affordance.

**v0.3 design:** Each step canvas has a "Promote to Step N+1 [Name]" button. Disabled when gate criteria not met. "Continue this step" button is separate.

**Audit implication:** Three explicit interactions to verify:
- "Continue this step" — always active
- "Promote to Step N+1" — disabled when gate not met
- "Open gate detail ↗" — opens drawer (Template 14)

### 3.5 Artifact codes formalized (NEW)

**Dossier v1.0:** Mentions artifacts by name. No formal coding scheme.

**v0.3 design:** Artifact codes use `dNN_short_name` convention (e.g., `d04_app_inv`, `d05_scope_memo`, `d07_ticket_synth`). Footnote acknowledges "final canonical names will come from your catalog table; rename is mechanical."

**Audit implication:** This convention exists in current Strategic Moves codebase. The audit must verify:
- Source artifact catalog uses (or can use) `dNN_short_name` codes
- Codes are consistent across artifact shelf, drawers, and (eventually) substrate
- Cross-reference to the deliverable catalog already established for Strategic Moves

### 3.6 Pricing trap log (NEW formal pattern)

**Dossier v1.0:** Section 5 Step 06 mentions "commercial traps" and "pricing trap detection."

**v0.3 design:** Template 05 shows a "Pricing trap log · 6 items" panel with P0/P1/P2 severity, agent attribution, and resolution path. This is a more concrete pattern than the dossier specified.

**Audit implication:** The audit must verify:
- Substrate supports pricing trap entries with severity, agent attribution, vendor association
- UI renders trap log distinctly from gate criteria (different panel)
- Trap resolution affects gate state ("P0 traps resolved or queued for BAFO")

### 3.7 The footnote — explicit v0.3 binding gaps

The HTML's own footnote enumerates five binding gaps the design knows about:

1. **Confidence bands** stamped `v2 PENDING SUBSTRATE` on templates 03, 07, 11 — point estimates today, bands later
2. **Tower references** pulled — Sentinel and Steward observe; "cross-event Tower surface is not designed yet"
3. **Templated role assignments** (the "Verify owner" pattern from Moves) not surfaced; Source roles are explicit per event
4. **Artifact codes** use placeholder convention; final names from catalog
5. **Drawers** rendered with faux backdrop; production slides in from right rail

**Audit implication:** These five gaps are pre-disclosed by the design. The audit should verify they are honored — i.e., the implementation should NOT pretend confidence bands exist, NOT reference Tower, NOT use Strategic Moves role-template pattern, and SHOULD use placeholder artifact codes consistently.

### 3.8 Atlas re-scoped (RECONCILES Q1 from digestion §16)

**Dossier v1.0:** Atlas is the executive synthesis agent inside Source.

**v0.3 design:** Atlas is still inside Source (Templates 06 Executive Decision and 07 Value Realization both have "ATLAS · DECISION BRIEF" or Atlas-led ledger). Footnote explicitly says "Tower references have been pulled."

**Resolution:** Atlas is Source-internal for Source's executive views. There is NO Tower agent inside Source. (This contradicts what I said earlier about Atlas being Tower's agent — the v0.3 design corrects this.) **Q1 from §16 of the digestion is now answered: Atlas stays in Source.**

The "Tower" surface that aggregates across events does not yet exist. The audit must NOT verify Tower integration because there is no Tower yet.

---

## 4 · Real demo data narratives in v0.3 (extends dossier section 23)

The v0.3 design gives 4 concrete sourcing events:

| Event | Tenant | Category | Stage | Value at stake | Status |
|---|---|---|---|---|---|
| AMS Outsourcing 2026 | Apex Retail | AMS · 3-yr | Step 2 Scope | $8.4M – $14.2M | Drafting |
| Cloud Platform Consolidation | Meridian Health | Infra · 5-yr | Step 5 Evaluate | $22.0M – $38.5M | On track |
| Data Platform Renewal | Meridian Health | Data · 3-yr | Step 6 Pricing | $11.6M – $18.4M | At risk |
| Endpoint Management Migration | Apex Retail | Endpoint · 2-yr | Step 10 Transition | $3.2M – $5.1M | On track |

**Audit implication:** The audit needs to verify:
- Substrate seeds these 4 events for the demo
- Each event has appropriate stage data, gate state, blocker, agent attribution
- Cross-tenant scoping is correct (Apex events visible only to Apex users; Meridian to Meridian)
- The "blocker · agent recommendation" text appears in portfolio rows correctly

The dossier's seed data section (23) is generic; v0.3 makes it concrete.

---

## 5 · Universal Canvas anatomy (the spine)

This is the most important addition to the audit baseline. The Universal Canvas (Template 03) defines the shell that 7 of 11 steps inherit. Audit Mode 1 (Substrate) and Mode 3 (Chrome crawl) both need this anatomy explicit.

### Top-level zones (in document order)

1. **ID strip** — breadcrumb (SOURCE › TENANT › EVENT-CODE), event title, event meta (category, term, sponsor, lead, steward), status chip
2. **Step rail** — 11 nodes, head text, line-done progress, click-to-navigate
3. **Canvas shell** (CSS grid: chat-lane | canvas)
   - **Chat lane (left, ~360px)**
     - Head: agent avatar + name + scope status
     - Sub-head: one-line agent role for this step
     - Context strip: CONTEXT BUNDLE one-liner with EVENT · STEP · DATA READINESS · ARTIFACTS · VENDORS · EVIDENCE counts
     - Chat thread: agent and user bubbles
     - Chat input: 3 suggested choices + custom input field + send button
   - **Canvas (right)**
     - Stage frame: eyebrow ("Step N · Stage intent"), title (step name), intent paragraph, "Continue this step" button, stage state banner
     - Gate panel: header (criteria · transition), counter (X/Y met), criteria list, promote row (button + helper + drawer link)
     - Artifact shelf: header, required artifacts, optional artifacts, each row clickable to artifact detail
     - Bottom grid (3 columns):
       - Sponsor & team (kv pairs)
       - Value at stake (large number, projected, breakdown)
       - Recent activity (timeline rows)

### Audit can verify

For each step using the Universal Canvas (1, 2, 3, 4, 7, 9, 10):
- All zones present in correct order
- Zones populated with step-appropriate content
- Step rail current node correctly highlighted
- Gate criteria count matches step's actual gate
- Artifact codes match the step's required artifacts
- Bottom grid renders with all 3 sections

For bespoke variant steps (5, 6, 8, 11):
- Header + step rail still present (consistency)
- Canvas region uses the variant pattern (matrix for 5/6, brief for 8, ledger for 11)
- Chat lane retained or omitted per variant
- Gate panel still present at bottom

---

## 6 · Updated audit anchor points (revisions to digestion §13)

The original digestion enumerated ~300 testable assertions based on dossier alone. The v0.3 design adds the following:

### A1. Universal Canvas shell consistency (NEW)
- 7 universal-canvas screens × ~15 zone elements = 105 assertions

### A2. Bespoke variant fidelity (NEW)
- 4 bespoke variants × variant-specific elements = ~40 assertions

### A3. Step rail consistency (NEW)
- 11 nodes rendered correctly across all 11 step contexts × done/current/future states = ~33 assertions

### A4. Drawer behavior (NEW)
- 3 drawer types (data readiness, evidence, gate detail) × invocation contexts = ~9 assertions

### A5. Mini-rail in portfolio (NEW)
- 4+ portfolio rows × 11 mini-step dots × 3 states = ~132 assertions

### A6. v0.3 binding gaps honored (NEW)
- 5 explicit gaps × verification = 5 assertions

**Updated total: roughly 600 testable assertions** (vs. 300 from dossier alone). The audit Mode 3 Chrome crawl scope grows accordingly.

---

## 7 · Conflicts the audit must resolve

| # | Conflict | Source A | Source B | Resolution |
|---|---|---|---|---|
| C1 | Chat position | Dossier: right rail | v0.3: left lane | v0.3 wins (newer design) |
| C2 | Page count | Dossier: 6 routes | v0.3: 11 substantive surfaces + 3 drawers | v0.3 wins (richer reality) |
| C3 | Per-step uniqueness | Dossier: implies each step distinct | v0.3: 7 share Universal Canvas | v0.3 wins (architecture decision) |
| C4 | Atlas scope | Dossier: Source-internal | Earlier digestion Q1: maybe Tower | v0.3 confirms Source-internal |
| C5 | Tower references | Dossier §11: Source rolls into Tower | v0.3 footnote: "Tower references pulled" | v0.3 wins (Tower not yet designed) |
| C6 | Artifact codes | Dossier: artifact names | v0.3: `dNN_short_name` codes | v0.3 wins (concrete convention) |

---

## 8 · Implications for the audit prompt

The audit prompt I draft for Claude Code must:

1. **Embed BOTH baselines** — dossier digestion AND v0.3 design reconciliation
2. **Specify resolution rules** — when dossier and v0.3 conflict, which wins (per §7 above)
3. **Expand Mode 3 (Chrome crawl) scope** — 14 templates not 6 routes
4. **Specify the 14 templates as anchors** — each gets verified against v0.3 design + dossier doctrine
5. **Honor pre-disclosed gaps** — verify the 5 footnoted gaps are NOT pretended to be filled
6. **Verify Universal Canvas shell consistency** — this is the single most important architectural test
7. **Drop Tower verification entirely** — Tower not yet designed; auditing it is out of scope

---

## 9 · Updated audit effort estimate

Original digestion estimated 58-71 hours across 6 modes. Adding v0.3 baseline:

| Mode | Original | Revised | Notes |
|---|---|---|---|
| M1 Substrate | 12-15 hrs | 15-18 hrs | +3 for new event/vendor/trap-log substrate verification |
| M2 Code-path | 14-16 hrs | 18-22 hrs | +4 for Universal Canvas shell + bespoke variants + drawer infrastructure |
| M3 UI deployed (Chrome) | 8-10 hrs | 14-18 hrs | +6 for 14 templates vs. 6 routes |
| M4 Agent behavior | 10-12 hrs | 12-14 hrs | +2 for context strip and chat-lane verification |
| M5 Documentation drift | 8-10 hrs | 10-12 hrs | +2 for dossier vs v0.3 reconciliation |
| M6 Cross-reference matrix | 6-8 hrs | 8-10 hrs | +2 for additional anchor points |
| **Total** | **58-71 hrs** | **77-94 hrs** | +19-23 hrs |

Calendar: ~2.5 weeks with one Claude Code throughput, ~10 days with parallelism on Mode 3 Chrome crawl.

---

## 10 · The two questions still open from digestion §16

After v0.3 reconciliation:

- **Q1 Atlas scoping** — RESOLVED by v0.3 (stays in Source)
- **Q2 Audit baseline tenant** — STILL OPEN (recommend Apex Retail canonical, others informational)
- **Q3 Audit reporting cadence** — STILL OPEN (recommend incremental per mode, no decisions until cross-reference matrix complete)

Need Anand to answer Q2 and Q3 before audit prompt finalizes.

---

## 11 · Recommended next move

I'm ready to draft the audit prompt. It will:

1. Embed both `SOURCE_DOSSIER_DIGESTION.md` and this v0.3 reconciliation as baselines
2. Encode the 6 audit modes with the revised scope
3. Lock the read-only ground rules (no code changes, no migrations, no fixes-while-auditing)
4. Specify the conflict resolution table from §7 above
5. Define the 7 output deliverables + gap register + cross-reference matrix
6. Explicitly call out: do NOT audit Tower; Tower is not yet designed

Estimated drafting effort: ~3 hours in this chat.

**Need from Anand to proceed:**
- Answer Q2 (Apex canonical vs. all-tenants)
- Answer Q3 (incremental vs. final reporting)
- Confirmation: v0.3 design is the design baseline; dossier is the doctrine baseline

End of reconciliation.
