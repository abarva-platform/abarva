# AbarVa Tower · Design Brief
**For:** UI/UX design session — new design template
**Version:** 1.0 · May 6 2026
**Owner:** Anand Sundaram

---

## 1. What Tower IS (and is not)

Tower is the **portfolio CFO surface for enterprise AI investments**. It answers four questions in real time:

1. What are we spending across all AI programs?
2. What are we actually getting? (causal ROI — not adoption, not seats)
3. Where is the pressure? (active threats: shelfware, duplication, cost overrun, lock-in)
4. What should we do next? (reallocation, consolidation, kill, renegotiate)

**It is not a dashboard.** It is a decision-driving instrument. Every number has provenance. Every pressure has a recommended action. Every decision is logged. The CFO should be able to produce a board-quality AI portfolio review without analyst help.

**Competitive position:** No existing tool does this. Apptio allocates cost but doesn't attribute value. Productiv tracks licenses but not outcomes. Vendr handles procurement but not continuous value tracking. Tower is the first AI-portfolio management surface that combines all three — and it does it with an agent (Atlas) who synthesizes across surfaces rather than leaving the CFO to connect the dots manually.

---

## 2. Primary user

**The CFO / CIO / VP of AI Strategy** opening Tower once a day.

- Wants: total spend, total value captured, top 3 pressures, top 3 decisions pending — in 30 seconds
- Will drill into pressure cards and program cards when something is red
- Uses Atlas to ask questions in natural language ("Is Copilot worth renewing?", "What's our biggest AI waste right now?")
- Produces board materials from Tower — not from a separate analyst process

**Secondary user:** Program sponsors (VP Engineering, VP IT, etc.) who come to Tower to see their specific program's health, not the whole portfolio.

**Tertiary user:** Steward / Setup admin who configures the connectors that feed Tower with live data.

---

## 3. The five entities Tower tracks

```
Portfolio (the whole tenant's AI estate)
  └─ Programs      e.g. "M365 Copilot Rollout", "Claude Code Rollout", "SAP Joule"
       └─ Initiatives  e.g. "Finance dept Copilot pilot"
            └─ Outcomes  e.g. "20% faster month-end close"

Pressures  Active threats on one or more programs
  e.g. P-ADOPT (shelfware), P-DUPL (duplication), P-VEND (lock-in)

Decisions  Logged choices that resolve pressures
  types: kill · scale · consolidate · renegotiate · pivot · defer · pilot-extend
```

**Portfolio is the system under tension** — not a list of programs. Atlas reasons about the relationships between programs, pressures, vendors, and decisions. "Copilot adoption is low" is incomplete. "Copilot adoption is low AND it overlaps 60% with Now Assist AND the Microsoft renewal is in 47 days" is what Atlas surfaces.

---

## 4. The 7 program types (each has a typed value formula)

| Type | Examples | Primary value mechanism |
|---|---|---|
| **T-CODE** | Claude Code, GitHub Copilot, Cursor | PR throughput + defect reduction |
| **T-PROD** | M365 Copilot, Google Duet | White-collar time recovery |
| **T-SVC** | ServiceNow Now Assist, Zendesk AI | Ticket deflection + agent productivity |
| **T-ERP** | SAP Joule, Workday AI | Process automation + decision support |
| **T-OPS** | Datadog AIOps, PagerDuty | Incident reduction + ops efficiency |
| **T-CUST** | Custom RAG apps, CDP-tied AI | Domain-specific (defined at onboarding) |
| **T-FOW** | Future-of-work, change management | Org capability + retention (leading indicators only) |

**T-FOW programs are special:** Low attribution confidence. Displayed with a dashed bubble outline on the portfolio matrix. They are strategic bets, not ROI plays — the design must communicate this distinction without relegating them.

---

## 5. Confidence and the "honest Tower" principle

Every Tower number has a confidence level:

| Attribution method | Confidence | Haircut |
|---|---|---|
| Experimental (A/B test) | HIGH | 1.0× |
| Cohort-matched | HIGH | 0.85× |
| Survey-based | MEDIUM | 0.6× |
| Self-reported | LOW | 0.4× |

When data is insufficient, Tower **refuses to show a fake number.** Instead:

> *"Value can't be computed — missing baseline measurement and attribution method. [Configure →]"*

This is non-negotiable. A black-box vendor-promised number is worse than honest "we don't know."

**Design implication:** The UI needs a clear, non-alarming way to show `MissingInputChip` states that invites the user to configure rather than hiding the gap or substituting a vendor claim.

---

## 6. The 8 pressure types (the risk taxonomy)

| Code | What it means | Severity driver |
|---|---|---|
| **P-COST** | Spend exceeding plan or value justification | $ overrun |
| **P-ADOPT** | Shelfware — licenses bought but unused | Unused $ |
| **P-VALUE** | Value not materializing vs. promise | Variance + time elapsed |
| **P-DUPL** | Two tools with overlapping use cases | Spend in overlap zone |
| **P-RISK** | Compliance / security incident exposure | Severity of incident |
| **P-VEND** | Vendor concentration / lock-in / pricing change | Switching cost + dependency |
| **P-TLNT** | Org not absorbing change; talent fatigue | Strategic-capability impact |
| **P-SUB** | Substitution by alternative (sanctioned or shadow) | $ cannibalized |

**Severity colors (locked, do not redesign):**
- Critical (>$500K impact) → Rust / deep red-orange
- High ($100K–$500K) → Peach / amber-orange
- Medium ($25K–$100K) → Amber
- Low (<$25K) → Mint / resolved-able

---

## 7. Information architecture — 13 pages

### Index pages (3)
| Page | Purpose | Primary content |
|---|---|---|
| **Portfolio** (default) | CFO daily open — 30-second read | KPI band → pressure heat strip → bubble chart → top-5 at-risk table → vendor concentration → recent decisions |
| **Lenses** | Same portfolio, 4 cuts | Tab-switch: Value / Pressure / Cost / Adoption — no page navigation |
| **Decisions** | Audit log of all portfolio decisions | Chronological, filterable by type/program/date |

### Detail pages (5)
| Page | Purpose |
|---|---|
| **Program** (TWR-DTL-PROGRAM) | One program end-to-end: value model, adoption, cost, pressures, vendor, decisions |
| **Pressure** (TWR-DTL-PRESSURE) | One pressure: driver decomposition, impact projection, recommended actions, decision capture |
| **Vendor** (TWR-DTL-VENDOR) | Vendor-level: all programs, performance scorecard, switching analysis, renewal calendar |
| **Outcome** (TWR-DTL-OUTCOME) | One promised outcome vs. realization, time series, confidence chain |
| **Decision** (TWR-DTL-DECISION) | One decision: context, provenance, consequences tracked 90 days |

### Workspace pages (3)
| Page | Purpose |
|---|---|
| **Onboard** (TWR-FLW-ONBOARD) | 5-step flow to bring a new AI program under Tower governance |
| **Reallocate** (TWR-FLW-REALLOCATE) | Portfolio rebalancing simulator — "kill X, scale Y" → impact projection |
| **Renewal** (TWR-FLW-RENEWAL) | Vendor renewal preparation brief, auto-generated 90 days before contract expiry |

### State pages (2)
Empty state (early-stage tenant) + Error state (program not found)

---

## 8. The 4-lens model (critical design element)

The same portfolio data, viewed through 4 lenses. **Switching lens does not navigate; it re-projects.**

| Lens | What it shows |
|---|---|
| **Value** | ROI multiple, value captured, vs. promised — ranked by ROI |
| **Pressure** | Active pressures by severity, $ impact, days open |
| **Cost** | Spend by program/department/vendor, variance vs. plan |
| **Adoption** | Active users / eligible, behavior change index, trend |

"A good Tower experience feels like flipping a Bloomberg terminal between views — same data, different cut, no page reload."

---

## 9. Atlas — the front agent

**Persona:** CIO chief-of-staff. Senior advisor, direct, calm, humble.

**Voice (strictly enforced):**
- Portfolio terms: totals, ratios, comparisons — never single-program unless it's the most important thing
- Surfaces tradeoffs, not moves
- Quantifies confidence explicitly ("cohort-matched, 0.85× haircut")
- Names the decision-maker for each recommendation (CFO / CIO / CTO / Sponsor)
- Connects across surfaces ("Source AMS event Stage 7 will lock in your inference vendor — this affects the reallocation path")

**What Atlas never says:**
- Vague optimism ("adoption is strong") — always quantified
- Single-program without portfolio context
- Vendor-promised numbers without confidence flagging
- "Investing in AI is the right thing" — never normative; always tradeoff-framed

**Atlas on the portfolio index (example):**
> *"Portfolio at $14.2M annualized · value captured $9.8M trailing 12-mo · ROI 0.69x. Three pressures > $1M: M365 Copilot adoption gap (24%), LLM inference overrun ($2.4M), Now Assist + Copilot duplication ($1.2M). Renewal window opens for Microsoft in 47 days — leverage analysis attached."*

**Atlas on a specific program (example):**
> *"M365 Copilot: $5.0M annualized, 2,950 active of 12,400 eligible (24% — below the 60% ROI breakeven threshold). Finance and Legal are lowest-adoption; Engineering is high-adoption but overlapping with GitHub Copilot. Two paths: 90-day Finance acceleration sprint or scope consolidation with Now Assist."*

**Voice density rule:** 2–3 sentences on index pages. 3–5 sentences on detail pages. Atlas is never the dominant content — it's the 30% advisory column alongside 70% data.

---

## 10. How Atlas works technically (for design context)

Two interaction modes:

1. **Synthesis strip** — fires on page load, produces a 100–150 word portfolio read streamed in. Not a chat; just Atlas's current take. Appears at the top of the main page / in the agent column.

2. **Chat interface** — conversational. User asks questions, Atlas responds with context-aware answers, thread persists across sessions. Suggested actions appear as chips after each Atlas response.

**Specialist agents (behind the scenes — users never see these):**
- **PortfolioRiskSynthesizer** — pre-computes structured risk records before each Atlas turn
- **SteeringBriefComposer** — generates renewal briefs and board materials
- **ProgramHealthScorer** — scores each program 0–100 (feeds bubble chart positioning)
- **ValueRealizationTracker** — computes promised vs. realized over time (feeds Outcome pages)

Specialists fire silently. Atlas surfaces their output, not their existence.

**Context architecture (evolving):** Atlas currently has a portfolio context bundle with: all programs + their health scores, active pressures ranked by $ impact, pending decisions count, upcoming renewal alerts, portfolio ROI, total annualized spend, and value at risk. This replaces generic demo text with computed, structured state.

---

## 11. How live data flows into Tower

```
Vendor connector (e.g. Microsoft Graph)
  → daily poll → raw snapshot stored
  → normalization job: raw → program_metrics (adoption, spend, MAU)
  → pressure re-computation: program_metrics → active_pressures (typed, severity-scored)
  → Atlas context builder: active_pressures + program_metrics → portfolio snapshot
  → Atlas turn: portfolio snapshot + user message → Claude → response
```

**Staleness handling:** If a connector hasn't polled recently, Atlas surfaces a staleness flag:
> *"Note: M365 Copilot data is 3 days old. Adoption numbers may not reflect current state."*

**P-DATA-HEALTH:** Broken connectors surface as a first-class pressure (data health pressure), not just a silent gap.

---

## 12. Cross-surface integrations (Tower is the synthesis point)

| From → To | What flows |
|---|---|
| **Tower → Programs** | Tower decision "scale Claude Code" creates/modifies a Program (Programs is where you *do* the work) |
| **Tower → Source** | Tower pressure "renegotiate Microsoft EA" triggers a sourcing event in Source |
| **Tower ← Intelligence** | Tower consumes patterns ("companies with >40% Copilot adoption have 2.1x higher ROI") |
| **Tower ← Setup** | Connector health propagates to Tower as P-DATA-HEALTH pressures |
| **Tower → Home** | Home page surfaces the highest-severity active Tower pressure as a card |

**Bidirectional links are first-class data:**
- Programs carry `linkedTowerProgramIds`
- Source events carry `linkedTowerProgramIds`
- Tower programs carry `linkedSourceEventIds` and `linkedProgramIds`

---

## 13. AbarVa design system (constraints — do not change without approval)

**Color palette:**
- Background: `#faf7f1` (PAPER — warm off-white, not pure white)
- Cards: `#fdfbf6` (CARD_WHITE) with `#e6dfce` borders
- Ink / primary text: `#0c1a3a` (deep navy)
- Muted text: `#8b95a8`
- Accent green (confirmed/healthy): `#dde9d9` bg / `#2a5a3a` text
- Accent peach (warning/attention): `#f5e2c9` bg / `#a06d28` text
- Accent rust (critical/error): `#efd4c4` bg / `#8a3e22` text
- Accent blue (info): `#dee8f5` bg

**Typography:**
- Display/serif: Cormorant Garamond / Fraunces — used for page titles, key numbers
- Body: Inter / DM Sans — used for most text
- Labels/metadata: JetBrains Mono — UPPERCASE, letter-spaced, 9–11px

**Aesthetic direction:** Paper aesthetic — warm, grounded, premium. Not dark mode. Not glass/gradient. Not cold SaaS blue-grey. Think Notion meets Bloomberg — data-dense but readable, not clinical.

**Button language:** Black (primary action) / Ghost (secondary). No rounded pill buttons except for status chips.

---

## 14. Current state — what's built vs. what needs design

### Built and working
- Main page `/tower` with Atlas chat (AgentCanvas) + 10-tab lens system
- Pressure detail pages — `/tower/pressures/[id]`
- Program detail pages — `/tower/programs/[id]`
- Value, Adoption, Risk lens pages
- Activity feed, Outcomes list, Onboarding flow

### Built but needs design upgrade
- **Portfolio matrix (bubble chart)** — positions are currently partially fixture-derived, not computed from live value models; design should account for future live positioning
- **Agent column / synthesis strip** — exists but visual weight is not calibrated; Atlas voice should be prominent but not dominant
- **Lens tab system** — 10 tabs creates cognitive load before the user has asked Atlas anything; design should consider grouping or progressive disclosure
- **KPI band** — exists but typography and layout are under-spec'd for CFO-level scanning density

### Not yet built (new design needed from scratch)
- **Vendor detail page** (TWR-DTL-VENDOR) — vendor performance scorecard, switching analysis, renewal calendar
- **Outcome detail page** (TWR-DTL-OUTCOME) — promised outcome vs. realization over time, attribution chain
- **Decision detail page** (TWR-DTL-DECISION) — decision provenance, consequence tracking
- **Renewal workspace** (TWR-FLW-RENEWAL) — auto-generated renewal brief sections
- **Reallocation simulator** (TWR-FLW-REALLOCATE) — deterministic "kill X / scale Y" impact model
- **Empty/error states**

---

## 15. Design problems to solve

### Problem 1: The 30-second scan is not 30 seconds
The CFO opens the portfolio page. How fast can they get to: total spend, total value, top pressure, one decision to make? Currently requires too much reading. **Design goal:** glanceable KPI band that answers the first three questions in under 3 seconds, with Atlas's voice answering the fourth.

### Problem 2: Numbers without confidence feel like vendor slides
Every metric on Tower should visually communicate its confidence level. The design needs a system for HIGH / MEDIUM / LOW confidence that is visible but not alarming — a first-class design element, not an asterisk.

### Problem 3: The bubble chart is the most powerful visual but it's not readable
A 2×2 matrix (x = adoption health, y = value captured, size = spend, color = pressure) with 5–10 AI programs as bubbles is the portfolio view that doesn't exist anywhere else. It needs to be legible at a glance, interactive (hover → mini-card, click → program detail), and honest about T-FOW programs (dashed outline). This is the centerpiece visual — it deserves primary design attention.

### Problem 4: Atlas column needs calibrated weight
Right now the agent column can feel like it's either dominating (too much AI voice) or vestigial (an afterthought sidebar). The goal is: Atlas is the advisor you'd want in the room, not the presenter. Content leads, Atlas comments. Design must enforce the 70/30 rule visually.

### Problem 5: Pressure cards need action affordance
Pressures aren't just alerts — they require decisions. A pressure card must communicate: severity, $ impact, driver, days open, AND invite a decision (link to decision capture). Currently this is a text-heavy pattern. The design needs a compact but information-rich pressure card that doesn't lose the decision affordance.

### Problem 6: Cross-surface links are invisible
When a Tower pressure is linked to a Source event, and that source event is at Stage 7 BAFO — that connection is the most important context for the renewal decision. Currently cross-surface links render as small chips. They deserve more visual presence.

### Problem 7: MissingInput states look like errors
When Tower can't compute a value because a connector is missing or a baseline wasn't set, it should feel like an invitation to configure — not an error state. The visual design for data gaps should be encouraging, not alarming.

---

## 16. Design questions for the design team

1. **Portfolio matrix** — should T-FOW programs be in the same 2×2 as T-CODE/T-PROD/T-SVC programs? Or does the confidence difference warrant a visual separation (e.g., a "strategic bets" row below the main matrix)?

2. **KPI band composition** — the spec says 5 cards: Total spend, Total value captured, Portfolio ROI, Active pressures, Decisions pending. Should all 5 be equal weight? Or is Portfolio ROI the hero metric that gets 2× visual weight?

3. **Lens switching** — Bloomberg-style re-projection of the same data across 4 lenses. Should the tab switch be animated (column reorder)? Or instant (feels more data-native)?

4. **Decision capture inline vs. overlay** — when a user is on a pressure detail page and wants to capture a decision, should that happen inline (expanding form within the page) or as an overlay/drawer?

5. **Atlas chat position** — right rail (current: 30% column, always visible)? Or collapsible? Or a distinct "ask Atlas" CTA that opens a full-screen chat mode? (Note: full-screen Atlas chat was prototyped as `docs/archive/tower-mockups/atlas-chat.html` — dark-mode teal variant, now deprecated in favor of paper aesthetic.)

6. **Mobile / tablet** — Tower is primarily a desktop surface (CFO at a desk). Is a responsive mobile view needed, or is a desktop-first single breakpoint acceptable for v1?

---

## 17. Reference materials

- `docs/build/TOWER_DESIGN_SPEC.md` — full product spec (v1.1, ratified May 6 2026)
- `docs/build/TOWER_AUDIT_2026-05-06.md` — current implementation audit
- `docs/archive/tower-mockups/atlas-chat.html` — prior Atlas chat mockup (dark mode, deprecated aesthetic but good interaction reference)
- `docs/archive/tower-mockups/dashboard.html` — prior Tower dashboard mockup (deprecated aesthetic)
- `docs/design/strategic-moves/15-workspace-v0.2.html` — current design system reference (paper aesthetic, correct)
- `src/lib/shell/shell-tokens.ts` — design system tokens (color, typography)

---

## 18. What the design should produce

A **new Tower design template** covering at minimum:
1. Portfolio index page (TWR-IDX-PORTFOLIO) — the daily CFO open
2. Pressure detail page (TWR-DTL-PRESSURE) — the most critical drill-down
3. Program detail page (TWR-DTL-PROGRAM) — the most-trafficked drill-down
4. Atlas column / synthesis strip interaction pattern
5. Pressure card component (used across multiple pages)
6. KPI band component

Optional but valuable if time allows:
- Vendor detail page (new, nothing exists)
- Renewal workspace (auto-brief generation)
- Empty state (for early-stage tenant)

---

*End of Tower design brief.*
