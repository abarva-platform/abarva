# DEMO8 — Founder Live Route Review Checklist

**Wave:** wave-20
**Lane:** J
**Status:** code_complete
**Type:** docs

---

## Summary

DEMO8 lands a practical, founder-usable route review checklist at `docs/demo/FOUNDER_LIVE_ROUTE_REVIEW_CHECKLIST.md`.

The checklist covers 7 routes across the AbarVa application shell:

1. `/tenant/apex-retail/programs` — Programs portfolio overview
2. `/tenant/apex-retail/programs/[cdp-slug]` — Programme detail (CDP Activation flagship)
3. `/source/events/apex-retail-ams-outsourcing-2026` — Source commercial event (AMS outsourcing)
4. `/platform/admin/architecture` — Admin architecture canvas (9 platform planes)
5. `/platform/admin/production-readiness` — Admin production readiness (honest manifest-backed state)
6. `/tenant/apex-retail/intelligence` — Intelligence / pattern detection surface
7. `/tenant/apex-retail/tower` — Control tower / signal intelligence

Each route entry specifies:
- Exact URL (prod and dev)
- Expected heading
- Expected data level
- Expected shell / nav behavior
- Caveats and what NOT to claim
- What should NOT appear
- Pass / Fail / Deferred field for live review capture
- Screenshot notes placeholder

The checklist also includes a Pre-Flight section, Shell / Nav checklist, "What NOT to Claim" guardrails, Pilot Ask Cues, and screenshot capture prompts.

---

## Scope

- Documentation only — no application code changed
- No TypeScript changes
- No migrations, no seeds, no model calls, no live cloud calls
- `production_deployment` status preserved (still blocked)
- No false `production_ready` promotions

---

## Cross-References

- DEMO7 (Wave 19): `docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md` — 30-minute demo storyline
- DEMO5 (Wave 17): `docs/demo/ABARVA_VISUAL_WORKFLOW_WALKTHROUGH_CHECKLIST.md` — 10-route visual workflow checklist
- SRC28: Source commercial demo scenario seed (apex-retail-ams-outsourcing-2026)
- PROG10: Program flagship view model (CDP Activation)
- LINK1: Source–Program link model
- SRC33: LinkedProgramBadge on Source Commercial Event
