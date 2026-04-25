# AI Control Tower Page · Blueprint

Slice ID: DES1 / AI Control Tower blueprint
Document type: page-level design contract.
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

This blueprint governs the AI Control Tower surface — a
**boardroom-ready Atlas brief**, not a dashboard. It implements the
ACT1 product contract visually. Reads in the
`ABARVA_VISUAL_CANON.md` direction; implementations must conform to
both.

The Tower must answer **three questions** in three minutes:

1. *Where does the AI portfolio stand?*
2. *Where is the portfolio at risk?*
3. *What is the next steering decision?*

If the surface fails that three-minute read, it is not the Tower.

---

## 1. Surface scope

| Route | Purpose |
|---|---|
| `/tenant/[tenantSlug]/tower` (or `/tower` for cross-tenant) | AI Control Tower landing — Atlas brief hero, scorecards, pressure cards, lens chip, Ask Atlas drawer affordance. |

The Tower already partially exists today via S9f / S9g (Programs
pressure cards + Atlas Executive Brief). ACT10 lifts the surface to
the full ACT1 contract. This blueprint is what ACT10 implements.

---

## 2. Atlas Brief hero

The Atlas Tower brief is the **page hero**. It anchors the top of
every Tower visit.

### Visual treatment

- Same panel shell as Sentinel / Steward briefs (canon §H).
- 3px left border in **teal** `#0E9F8C` for ready / on-track posture;
  shifts to amber when top severity is high; red when critical.
- Header eyebrow: `Atlas · AI Control Tower brief · <source label>`.
- Title: `<tenant> · AI Control Tower brief` in serif H2 (18 – 22px).
- Severity + confidence chips at top-right; tooltip = interpretation
  basis.
- Three disabled "Ask Atlas" follow-up chips with sub-label
  `deferred · live atlas runtime`.
- Footer caption disclaims live retrieval / Claude / OpenAI / Pinecone
  invocation.

### Required field set (ACT1 §E, restated)

- `title`
- `portfolioStand` — one sentence: where the portfolio stands today.
- `whereAtRisk` — one sentence naming the top portfolio risk.
- `nextSteeringDecision` — one sentence; routes to a real
  destination.
- `topPressures` — exactly three pressure cards (see §4).
- `lensReference` — names the active lens (see §5); `null` when no
  lens is active.
- `suggestedHandoffs` — subset of {nexus, sentinel, steward}.
- `suggestedFollowUps` — exactly three deterministic disabled chips.
- `sourceLabel` — `deterministic_seed` or a `*_read_model` marker.
- `interpretationBasis` — single line.

### Length rules

- ≤ 140 words for the prose portion.
- ≤ 12 lines on screen (including chips and follow-ups).
- Brief never exceeds the height of one above-the-fold viewport.

---

## 3. Five scorecards max

Below the brief, **at most five scorecards**. Five is the cognitive
ceiling for an executive read.

### Scorecard layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Atlas Brief (hero)                                             │
├─────────────────────────────────────────────────────────────────┤
│  Scorecard 1 │ Scorecard 2 │ Scorecard 3 │ Scorecard 4 │ Scorecard 5 │
└─────────────────────────────────────────────────────────────────┘
```

### Each scorecard

- Card surface (`#FFFFFF`, 1px border, 12px radius).
- Eyebrow: dimension name (mono uppercase) — one of the seven from
  ACT1 §D.
- Headline value: serif H2 (18 – 22px). The single number that
  matters.
- Sub-line: 11 – 12px DM Sans `muted` caption (e.g., baseline ratio,
  trend marker, attribution).
- Status chip (top-right): ready / partial / blocked accent.
- Click → opens the scorecard's drillable panel (see §6).

### Selection rules

The five scorecards are **selected**, not enumerated. The Atlas
brief composer chooses based on:

- Pressure (Sentinel + PF1 detections).
- Recency (Steward last-edit timestamps).
- Active lens (§5).

If more than five qualify, the surface shows the top five and notes
the residual in the brief's `interpretationBasis`. Never show six.

### Forbidden

- Six or more scorecards.
- Scorecards without a status chip.
- Scorecards with two values competing for the headline.
- Scorecards that read as "metrics for the sake of metrics" without
  a tied dimension.

---

## 4. Three pressure cards max

Above the brief — or in a row immediately under the hero on narrow
viewports — sits the **pressure card row**. Exactly three cards.
Never four.

### Card content

- Severity accent (3px top border).
- Eyebrow: `<severity> pressure · <program code>` mono uppercase.
- Title: serif H3.
- Body: 13px DM Sans summary sentence.
- Recommended-action row (one sentence).
- "Open program →" affordance.

### Selection

- Sentinel + PF1 detections produce candidates.
- Atlas selects top three by canonical severity → confidence →
  pattern key rank.
- The fourth-and-beyond pressures are surfaced inside the brief's
  `interpretationBasis`, never on the page.

### Forbidden

- Four+ pressure cards.
- Pressure cards without a "open program" route.
- Pressure cards inventing dollar amounts.

---

## 5. One active lens

The Tower has **lenses** — pre-canned cross-dimension reads. At most
**one lens active at a time**.

### Canonical lenses

| Lens | Anchored dimensions |
|---|---|
| **Adoption** | Adoption & Usage · Cost & Consumption |
| **Value** | Business Value & Outcomes · AI Portfolio Inventory |
| **Risk** | Risk / Compliance / Governance · Operating Model |
| **Cost** | Cost & Consumption · Adoption & Usage |
| **Ops** | Operating Model · Productivity Impact |
| **Readiness** | Technology & Data Readiness · AI Portfolio Inventory |

### Layout

- Lens chip row directly under the Atlas brief.
- Active lens: teal-accent fill chip; inactive lenses: muted-soft
  outline.
- A "no lens" affordance returns to the canonical default mix.

### Effect when active

- Brief composes from the lens-anchored dimensions.
- Five scorecards bias toward the lens.
- Three pressure cards bias toward the lens.

### Forbidden

- Two active lenses simultaneously.
- Lenses adding new dimensions outside the canonical seven.
- Lens chips that disappear on scroll (must persist).

---

## 6. Ask Atlas drawer

The Tower does **not** host a giant always-on chat panel. Asking
Atlas is a **right-side drawer**.

### Behavior

- Trigger: an explicit affordance — "Ask Atlas" chip in the brief
  header or a top-right icon-free button labeled `Ask Atlas →`.
- Width: ≤ 480px on desktop; full-screen sheet on narrow viewports.
- Pre-populated with three deterministic suggested prompts (matches
  the existing S9g brief follow-up shape).
- Closes with `Esc` or "Close ✕" plain-text affordance.
- Closes when the operator clicks outside the drawer.

### State today

- Disabled until a live Atlas runtime subscriber lands.
- Chips render visible-but-disabled with sub-label `deferred · live
  atlas runtime`.
- Hover tooltip names the deferral reason.

### Forbidden

- Always-on chat panel taking primary surface real estate.
- A drawer that is also a separate page (must be in-page overlay).
- Drawer-only critical content; the brief + scorecards must still
  read on their own.

---

## 7. Seven AI Control Tower dimensions

The Tower's content lives across **seven canonical dimensions** —
no more, no less. Every scorecard, pressure card, lens read, or
brief sentence maps onto one of these seven. (Mirrors ACT1 §D.)

| # | Dimension | Atlas role | Steward / Sentinel / Nexus role |
|---|---|---|---|
| 1 | **AI Portfolio Inventory** | composes the portfolio shape editorial | inventory completeness · sparsity detection · Context Bundle |
| 2 | **Adoption & Usage** | flags under- / over-adoption | telemetry capture · sprawl-without-value detection · usage in value defense |
| 3 | **Business Value & Outcomes** | composes value editorial at G3 / G4 | value capture · ledger incompleteness detection · value chain in retrieval |
| 4 | **Risk / Compliance / Governance** | composes governance editorial | governance posture · governance gap detection · refusal logic |
| 5 | **Cost & Consumption** | composes cost editorial | cost capture · cost-leakage detection · ROI bundle |
| 6 | **Operating Model / Productivity** | composes productivity editorial | DORA capture · operating-model gap detection · ops state in bundle |
| 7 | **Technology & Data Readiness** | composes readiness editorial | data readiness · context sparsity detection · Context Bundle scoping |

The Tower never presents an eighth dimension. New cross-dimensional
analyses lower into one of the existing seven (or land as a future
canon revision).

---

## 8. No-dashboard-clutter rules

The Tower is the most likely surface to fail the canon's no-clutter
test. The rules below are **non-negotiable**.

- **One brief.** Atlas only. No Nexus / Sentinel / Steward briefs
  on this page.
- **One title.** No competing H1s.
- **One lens active at a time.** No multi-lens overlays.
- **Three pressure cards max.** No exceptions.
- **Five scorecards max.** No exceptions.
- **No giant chat.** Drawer-only.
- **No banner / promo / announcement strip.** Ever.
- **No animated counters.** Numbers settle without spring.
- **No dollar amount may appear** that is not internally captured
  with a baseline + target + realized ledger.
- **No real `E-###` citation may appear** until the registry
  resolves it.
- **No "industry average" claim** without naming the external
  source (canon §J internal-vs-external rule).
- **No deep filter sidebar.** Filtering belongs inside a scorecard
  drawer, not on the page chrome.
- **No refresh button.** The Tower is read-only on the brief; the
  underlying read models update automatically.

If a Tower mock looks like a SaaS dashboard, it is wrong. If it
looks like a one-page board memo with chips, it is right.

---

## 9. Acceptance criteria

A Tower implementation slice is `verified` when:

1. Atlas Brief hero anchors the top of the page with the canonical
   ACT1 §E field set.
2. Brief is ≤ 140 words and ≤ 12 lines on screen.
3. Severity / confidence chips on the brief tooltip the
   `interpretationBasis`.
4. Three "Ask Atlas" follow-up chips render disabled with sub-label
   `deferred · live atlas runtime`.
5. Five scorecards render below the brief, each tied to one of the
   canonical seven dimensions, each with a status chip.
6. Three pressure cards render with severity accent, "Open program
   →" affordance, and one-sentence recommended action.
7. Lens chip row is present; at most one lens is active; "no lens"
   default is selectable.
8. Ask Atlas affordance opens a right-side drawer ≤ 480px wide;
   never a full-page chat.
9. No surface invents a dollar amount or claims a real `E-###`
   citation.
10. Footer of every panel carries a deterministic-source caption
    disclaiming live retrieval / Atlas / Claude / OpenAI invocation.
