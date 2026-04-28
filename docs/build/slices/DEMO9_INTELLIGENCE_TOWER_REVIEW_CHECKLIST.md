# DEMO9 — Intelligence Tower Founder Review Checklist

**Wave:** wave-21
**Lane:** L
**Status:** code_complete
**Type:** docs

---

## Summary

DEMO9 lands a focused, founder-usable Intelligence and Control Tower review checklist at `docs/demo/INTELLIGENCE_TOWER_FOUNDER_REVIEW_CHECKLIST.md`.

The checklist provides deep, surface-specific verification for:

1. `/tenant/apex-retail/intelligence` — Sentinel pattern detection surface (12 items)
2. `/tenant/apex-retail/tower` — Atlas executive briefing + Control Tower (11 items)

Each surface covers:
- Agent label and identity verification (Sentinel / Atlas)
- Deterministic caveat presence
- Pattern/scorecard data quality checks (confidence level, evidence basis, status labels)
- Missing data disclosure (not hidden)
- Agent-centric enforcement spot checks (no chat-first, no generic AI badges)
- Shell/nav canon compliance (no teal, active route highlighting)
- Demo narrative cues for live walkthroughs
- What NOT to claim guardrails
- Pilot ask cues for both surfaces
- Screenshot capture placeholders

---

## Scope

- Documentation only — no application code changed
- No TypeScript changes
- No migrations, no seeds, no model calls, no live cloud calls
- `production_deployment` status preserved (still blocked)
- No false `production_ready` promotions

---

## Cross-References

- DEMO8 (Wave 20): `docs/demo/FOUNDER_LIVE_ROUTE_REVIEW_CHECKLIST.md` — 7-route full-surface founder checklist
- SHELL7 (Wave 20): IntelligenceRouteShell and TowerRouteShell components
- INTEL1 (Wave 21): Intelligence route shell
- INTEL2 (Wave 21): Intelligence workflow canvas
- INTEL3 (Wave 21): Sentinel evidence brief
- TOWER1 (Wave 21): Control Tower route shell
- TOWER2 (Wave 21): Atlas executive brief
- TOWER3 (Wave 21): Active lens refresh
- AGENTX (Wave 20): Agent-Centric Enforcement Review Standard
- PX1 (Wave 20): Page Experience Blueprint Authority
- INTELLIGENCE_PAGE_BLUEPRINT.md — canonical intelligence surface specification
- CONTROL_TOWER_PAGE_BLUEPRINT.md — canonical control tower surface specification
