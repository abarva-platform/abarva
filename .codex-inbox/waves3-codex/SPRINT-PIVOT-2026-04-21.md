# Codex · sprint pivot · Prat demo readiness 72h

**Read this first — it overrides the earlier README-CODEX-ASSIGNMENT.md.**

Full brief: `prat-demo-readiness-sprint.md` in this folder.

## What changes for your lane

**ONE composite — Apex only.** Meridian / Keystone / First Capital deep enrichment defers. Ship Apex at depth.

## Your sprint tasks (priority order)

### Day 1 (T-72 to T-48) — highest leverage

| # | Task | Source pack | Est |
|---|---|---|---|
| 1 | **C12 Marcus Whitfield (Apex CCO) composite profile · demo-ready** · all sections populated (remit, communication style, decision patterns, public commitments, interactions, programs, governance section). Other 7 profiles defer to Day 2. | `c12-executive-profile-pages.md` | 3-4h |
| 2 | **Apex intelligence depth backfill** — seed 35+ KPIs, 4+ programs, 3+ contradictions with evidence + eliminable $, 5-7 patterns with current-state match data, evidence chains on at least 5 briefing candidates. Idempotent. Per sprint §Intelligence layer richness. | new seed script | 4-6h |
| 3 | **Apex Stream-view activity** for at least 1 program (Owned Brand Margin or Digital Commerce Modernization) — decisions, commitments, interventions with realistic timestamps | new seed script | 2-3h |

### Day 2 (T-48 to T-24) — surface completion

| # | Task | Source pack | Est |
|---|---|---|---|
| 4 | **C15 Pattern Detail** for Shadow AI Governance + Owned Brand Margin patterns — each with overview, current match status, 3+ anonymized historical instances, intervention menu with effectiveness, evidence chain | `c14-c15-kpi-and-pattern-detail.md` | 4-6h |
| 5 | **C14 KPI Detail** — shared template with C15. Render one demo-critical KPI at depth (say the digital commerce conversion KPI or Owned Brand gross margin) | same pack | 2-3h |
| 6 | C12 remaining Apex executives (2-3 more beyond Marcus Whitfield) — enough that the Stakeholder Lens on C11 has demo-ready click-throughs | `c12-executive-profile-pages.md` | 3-4h |

### Defer

- C2 Intelligence Suite detail pages × 9 — not demo-critical
- Meridian / Keystone / First Capital profiles beyond skeleton
- Real-world profiles (Prat, Shail, Tim, Ranjan) — ethics review still pending per §9.3 of Wave 3 README

## Data bar (non-negotiable, per sprint §Intelligence layer richness)

Apex composite must hit by end of Day 2:
- 35+ KPIs populated
- 4+ programs active with phase state
- 8+ executives with populated profiles (composite side — real-world deferred)
- 3+ contradictions surfaced with evidence + eliminable $
- 7+ patterns with current-state data
- Evidence chains on at least 5 briefing items
- Cross-entity relationships wired: KPI → program → owner → contradiction linked

**Verification:** spot-check 10 random entities in the Apex intelligence layer. Every one should have an owner, evidence, and at least one cross-entity relationship. If gaps, backfill before demo.

## Performance bar

Per sprint §Agent performance:
- Briefing generation <30s for a pre-cached Apex tenant state
- Entity link resolution <500ms
- Page-to-page navigation <2s perceived
- Conversational follow-up <10s

If any surface lands slow, fix before Prat.

## Coordination

Claude Code (me) is on:
- C1 Homepage rewrite with Own/Build/Keep + Control Tower sections (Day 1)
- C11 Apex-depth enrichment (inline briefing + portfolio + stakeholder lens) (Day 1)
- C17 Program Detail 5-phase viz (Day 2)
- Polish + demo dry-runs (Day 3)

No file conflicts expected between our lanes. If one appears, commit what you have and surface.

## Shared components already shipped

Use these from `@/components/shared` on every new page (PR #36 + #36's C11 follow-on):
- Typography: `PageTitle`, `SectionHeading`, `EyebrowLabel`, `Body`, `MetaLabel`
- Layout: `PageShell`, `PageFooter`
- Entities: `EntityLink`, `ExecutiveCard`, `ProgramCard`

Motion / focus / reduced-motion utilities in `src/lib/design-system.ts` + `src/hooks/useReducedMotion.ts`.

**Don't re-implement these. Compose them.**

## Non-goals for the sprint

Per sprint §What defers:
- Enterprise readiness (SOC 2, pen test)
- Additional composites beyond Apex
- Marketing pages beyond C1
- C9 / C10 / C13 / C16 / C18-C26 logged-in pages
- Wave 4+ items

## Stop point

One PR per major task. Do NOT auto-merge. Ping @anandsundaram-hash. The demo is the deadline, not the merge.
