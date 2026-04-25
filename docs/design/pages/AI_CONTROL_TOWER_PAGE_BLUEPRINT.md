# AI Control Tower Page · Blueprint

Slice ID: DES1 / AI Control Tower blueprint
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

This blueprint governs the AI Control Tower surface — a
**boardroom-ready Atlas brief**, not a dashboard. Implements the
ACT1 product contract visually. Reads in `ABARVA_VISUAL_CANON.md`.

The Tower must answer **three questions** in three minutes:

1. *Where does the AI portfolio stand?*
2. *Where is the portfolio at risk?*
3. *What is the next steering decision?*

If the surface fails that three-minute read, it is not the Tower.

---

## 1. Surface scope

| Route | Purpose |
|---|---|
| `/tenant/[tenantSlug]/tower` | AI Control Tower landing — Atlas brief hero, scorecards, pressure cards, lens chip, Ask Atlas drawer affordance. |

Today the Tower partially exists via S9f / S9g. ACT10 lifts it to
the full ACT1 contract. This blueprint is what ACT10 implements.

---

## 2. Atlas Brief hero

The Atlas Tower brief is the **page hero**. Anchors the top of
every Tower visit.

### Visual treatment (dark hero variant)

- **Background**: `INK_DARK` (`#0A0C12`) or `NAVY_DARK`
  (`#10193A`). Atlas is the storytelling-moment dark surface.
- 3px **left** border in the agent's accent (NAVY for ready,
  AMBER for high pressure, RED for critical).
- Eyebrow: `Atlas · AI Control Tower brief · <source label>` mono
  in `MUTED_SOFT`.
- Title: H2 in `surface` (off-white).
- Severity + confidence chips top-right (NAVY_SOFT / AMBER_SOFT /
  RED_SOFT chips with surface-tone foreground).
- Three disabled "Ask Atlas" chips with sub-label
  `deferred · live atlas runtime`.
- Footer caption disclaims live retrieval / Claude / OpenAI /
  Pinecone.

### Required field set (ACT1 §E, restated)

- `title`
- `portfolioStand`
- `whereAtRisk`
- `nextSteeringDecision`
- `topPressures` — exactly three
- `lensReference` — null when no lens active
- `suggestedHandoffs`
- `suggestedFollowUps` — exactly three disabled chips
- `sourceLabel`
- `interpretationBasis`

### Length rules

- ≤ 140 words for the prose portion.
- ≤ 12 lines on screen.
- Hero ≤ one above-the-fold viewport.

---

## 3. Five scorecards max

Below the brief, **at most five scorecards**. Five is the cognitive
ceiling for an executive read.

### Scorecard layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Atlas Brief (hero · dark)                                      │
├─────────────────────────────────────────────────────────────────┤
│  Sc 1 │ Sc 2 │ Sc 3 │ Sc 4 │ Sc 5  (light cards)                │
└─────────────────────────────────────────────────────────────────┘
```

### Each scorecard

- Light `card` surface (`#FFFFFF`), 1px border, 12px radius.
- Eyebrow: dimension name (mono uppercase).
- Headline value: H2 (DM Sans 700, color `INK`). The single number
  that matters.
- Sub-line: 11 – 12px DM Sans `MUTED` caption.
- Status chip top-right (NAVY / AMBER / RED).
- Click → opens scorecard's drillable panel.

### Selection

The five scorecards are **selected** by the Atlas brief composer
based on pressure (Sentinel + PF1) · recency (Steward) · active
lens. If more than five qualify, the surface shows top five and
notes the residual in `interpretationBasis`. Never six.

---

## 4. Three pressure cards max

Above the brief — or in a row immediately under the dark hero on
narrow viewports — sits the **pressure card row**. Exactly three
cards.

### Card content

- Severity accent (3px top border in NAVY / AMBER / RED).
- Eyebrow: `<severity> pressure · <programCode>` mono.
- Title: H3.
- Body: 13px DM Sans summary.
- Recommended-action row.
- "Open program →" affordance.

### Selection

Sentinel + PF1 produce candidates. Atlas selects top three by
canonical severity → confidence → pattern key rank. The
fourth-and-beyond is surfaced inside `interpretationBasis`.

---

## 5. One active lens

The Tower has **lenses** — pre-canned cross-dimension reads. At
most **one active at a time**.

| Lens | Anchored dimensions |
|---|---|
| **Adoption** | Adoption & Usage · Cost & Consumption |
| **Value** | Business Value · AI Portfolio Inventory |
| **Risk** | Risk / Compliance / Governance · Operating Model |
| **Cost** | Cost & Consumption · Adoption & Usage |
| **Ops** | Operating Model · Productivity Impact |
| **Readiness** | Technology & Data Readiness · AI Portfolio Inventory |

Active lens chip uses NAVY fill; inactive lenses use muted-soft
outline. "No lens" affordance returns to canonical default mix.

---

## 6. Ask Atlas drawer

The Tower does **not** host a giant always-on chat panel. Asking
Atlas is a **right-side drawer**.

- Trigger: explicit affordance — "Ask Atlas" chip in the brief
  header or top-right `Ask Atlas →` text button.
- Width: ≤ 480px desktop; full-screen sheet on narrow viewports.
- Pre-populated with three deterministic prompts (S9g shape).
- Closes on `Esc`, click outside, or "Close ✕".
- **Disabled until live runtime** — chips render visible-but-
  disabled with sub-label `deferred · live atlas runtime`.

---

## 7. Seven canonical AI Control Tower dimensions

Every scorecard, pressure card, lens read, or brief sentence maps
onto one of seven dimensions (ACT1 §D):

| # | Dimension |
|---|---|
| 1 | AI Portfolio Inventory |
| 2 | Adoption & Usage |
| 3 | Business Value & Outcomes |
| 4 | Risk / Compliance / Governance |
| 5 | Cost & Consumption |
| 6 | Operating Model / Productivity Impact |
| 7 | Technology & Data Readiness |

Eight is forbidden. New cross-analyses lower into one of the
existing seven.

---

## 8. No-dashboard-clutter rules

- One Atlas brief; no other agent briefs on this page.
- One title.
- One active lens.
- Three pressure cards max.
- Five scorecards max.
- No giant chat panel.
- No banner / promo strip.
- No animated counters.
- No big icons or pictograms.
- No dollar amount that is not internally captured + ledgered.
- No real `E-###` citation until the registry resolves it.
- No "industry average" without naming the external source.

If the Tower mock looks like a SaaS dashboard, it is wrong. If it
looks like a one-page board memo with chips, it is right.

---

## 9. Acceptance criteria

A Tower implementation slice is `verified` when:

1. Atlas Brief hero renders on a dark surface (`INK_DARK` or
   `NAVY_DARK`) anchoring the top of the page with the canonical
   ACT1 §E field set.
2. Brief is ≤ 140 words and ≤ 12 lines on screen.
3. Severity / confidence chips on the brief tooltip the
   `interpretationBasis`.
4. Three "Ask Atlas" follow-up chips render disabled with sub-label
   `deferred · live atlas runtime`.
5. Five light-surface scorecards render below the brief, each tied
   to one of the canonical seven dimensions.
6. Three pressure cards render with severity accent and "Open
   program →" affordance.
7. Lens chip row present; at most one lens active.
8. Ask Atlas affordance opens a right-side drawer ≤ 480px wide.
9. No surface invents a dollar amount or real `E-###` citation.
10. Footer of every panel carries a deterministic-source caption.
