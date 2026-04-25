# Next Slice Plan: Source Dashboard Visual Review

Date: 2026-04-24

Status: planning only. Do not implement dashboard refinements until explicitly approved.

## 1. Purpose Of Visual Review

Review the current `/source` dashboard visually before making any UI changes.

The purpose is to decide whether the dashboard already communicates AbarVa Source as a premium, decisive, enterprise-grade sourcing workbench, or whether it still reads as a scaffold/prototype.

This review should identify specific, bounded refinements. It should not trigger broad product expansion.

## 2. Current Dashboard State

Current known state:

- Source route family exists.
- Source appears as first-class operator navigation.
- Dashboard prototype exists.
- Dashboard component refactor has been reviewed.
- Seeded Source events exist:
  - Data & AI Modernization SI Selection
  - AMS Consolidation Assessment
  - Digital App Build Partner Selection
- Context architecture, validation fixtures, validation runner, seeded context depth, and readable validation report are in place.

Known limitation:

- The dashboard has not yet completed a formal visual/product review after the agent-context validation work.
- Browser preview may require auth handling if Clerk redirects.

## 3. What "Premium And Decisive" Means

For AbarVa Source, "premium and decisive" means:

- Executive users can immediately see what matters.
- The page feels like a serious enterprise workbench, not a demo mockup.
- Value at stake is clear without being loud.
- Event state is legible: active, waiting, at risk, blocked, decision needed.
- Next action is obvious.
- Owners, aging, blockers, and value are scannable.
- Nexus feels like an operating intelligence layer, not a generic chatbot.
- Density is calm: enough information to make decisions, not card spam.
- The dashboard avoids decorative visuals that do not improve sourcing judgment.

## 4. Review Criteria

Review the dashboard against these criteria:

- Navigation placement: Source appears in the right place and feels first-class.
- First impression: the viewport communicates Source's purpose within 5 seconds.
- Enterprise feel: premium, restrained, credible, not playful or generic SaaS.
- Information hierarchy: top metrics, alerts, event list, and Nexus guidance have clear priority.
- Event clarity: the three events are easy to distinguish and compare.
- Next action clarity: each event clearly shows what should happen next.
- Value clarity: value at stake is prominent and credible.
- Status clarity: lifecycle status, owner, aging, and blocker are visible and understandable.
- Agent positioning: Nexus guidance feels grounded in Source event context.
- Visual density: page is dense enough for operators but not cluttered.
- No card spam: repeated panels must earn their space.
- No fake AI: avoid implying live generation where only deterministic seed data exists.
- No procurement portal feel: page should not feel like a generic vendor/procurement tracker.
- No overbuilt charts: charts should not appear unless they clarify decisions.

## 5. Screenshot / Manual Review Process

Preferred process:

1. Start local app if needed.
2. Navigate to `/source`.
3. If auth redirects, record the exact redirect behavior and inspect manually after sign-in.
4. Capture desktop screenshot.
5. Capture mobile/narrow screenshot if feasible.
6. Check first viewport and scroll behavior.
7. Inspect whether all important text fits without overlap.
8. Compare dashboard against Build Pack design bar.
9. Record findings as:
   - keep
   - refine
   - remove/defer
   - needs product decision

Manual review route:

- `/source`

If screenshot capture is blocked by auth or environment constraints, produce static render notes from code inspection and exact route instructions for manual review.

## 6. Dashboard-Specific Acceptance Criteria

The dashboard passes review when:

- Source route loads and top nav placement feels correct.
- Dashboard immediately communicates active sourcing portfolio state.
- All three seeded events are visible or easy to access.
- "What needs attention" is clear.
- Value at stake is clear.
- Waiting/at-risk state is clear.
- Next action, owner, aging, and blocker are clear.
- Nexus content is deterministic/contextual and does not imply live AI generation.
- Visual hierarchy feels premium and calm.
- There is no obvious text overlap or cramped button/card content.
- Page does not introduce event canvas, scorecard UI expansion, artifact drawer expansion, value ledger UI expansion, vendor flow, or generation behavior.

## 7. Risks To Look For

Watch for:

- Dashboard feels like a scaffold rather than production product.
- Too many cards compete for attention.
- "Nexus" feels like a chatbot label rather than operating intelligence.
- Value at stake is buried or visually overhyped.
- Status/owner/aging/blocker details are not scannable.
- Three events are hard to compare.
- Page implies AI generation or live decisions that are not wired.
- Enterprise tone is diluted by generic dashboard patterns.
- Mobile/narrow viewport creates text overflow or incoherent stacking.
- Dashboard refinements tempt expansion into event canvas, scorecard, artifact, value ledger, or vendor workflow.

## 8. What Not To Change Yet

Do not change:

- Dashboard UI before review findings are written.
- Chat UI.
- Model calls.
- API routes.
- Upload/parsing.
- Event canvas.
- Scorecard UI.
- Artifact drawer.
- Value ledger UI.
- Vendor workflow.
- AI/RFP generation.
- `/programs` integration.
- `/preview` or `/demo` surfaces.

Do not use the visual review to sneak in new Source product capabilities.

## 9. Recommended Refinement Sequence After Review

If review identifies issues, refine in this order:

1. Information hierarchy only: top summary, attention, events, and Nexus guidance.
2. Event row/card clarity: status, owner, aging, blocker, next action, value.
3. Density and spacing: reduce noise while preserving operator usefulness.
4. Copy tightening: make deterministic state language clearer.
5. Visual polish: typography, borders, contrast, and alignment.
6. Responsive fit: ensure mobile/narrow layout does not break.
7. Only after dashboard passes: consider Nexus Engagement Canvas shell as a separate approved slice.

Every refinement should remain bounded to dashboard review findings.

