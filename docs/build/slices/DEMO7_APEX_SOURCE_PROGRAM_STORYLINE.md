# DEMO7 — Apex Retail Source + Programme 30-Minute Demo Storyline

Wave 19 · Lane H | 2026-04-26

---

## Slice Summary

DEMO7 lands the Apex Retail 30-minute demo guide at `docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md`. The guide covers 10-minute, 30-minute, and 45-minute demo formats and documents the cross-surface Source → Programme narrative that is the primary AbarVa commercial story.

---

## What This Slice Delivers

- **`docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md`** — complete demo guide with:
  - Opening narrative (AbarVa platform positioning)
  - 10-minute version (route sequence + step narration)
  - 30-minute version (4 sections: portfolio, flagship, source event, close)
  - 45-minute deep dive (5 extension sections)
  - What to show in Programme Flagship (phase rail, gate status, workshops, deliverables, chips)
  - What to show in Source Commercial Event (linked badge, vendor comparison, risks, signals, missions)
  - How Source Event links to Programme (dependency chain narrative)
  - Workshop 5 outcomes narrative
  - Deliverables roadmap narrative
  - Commercial readiness narrative
  - What NOT to claim section
  - Pilot ask with activation items and readiness caveats
  - Routes reference table with status
  - Demo preparation checklist

---

## Source References

This slice is grounded in:

- `src/lib/source/source-commercial-demo-scenario.ts` (SRC28) — AMS outsourcing demo scenario with 4 vendors, 5 risks, 4 signals, 5 missions, 3 BAFO opportunities
- `src/lib/programs/program-flagship-view.ts` (PROG10) — CDP Activation programme flagship view model with phase rail, gate status, what-the-page-knows, and recommended next action

---

## Routes Referenced

| Route | Status |
|-------|--------|
| `/tenant/apex-retail/programs` | Ready |
| `/tenant/apex-retail/programs/[cdp-slug]` | Ready |
| `/source/events/apex-retail-ams-outsourcing-2026` | Ready |
| `/platform/admin/architecture` | Ready |
| `/platform/admin/production-readiness` | Ready |
| `/intelligence` | Ready (thin) |
| `/control-tower` | Ready (thin) |

---

## Constraints

- Documentation only. No application code, no TypeScript changes, no database migrations, no model calls, no live cloud calls.
- All values cited in the demo guide are deterministic seed data sourced from SRC28 and PROG10. No fabricated data.
- Production deployment status preserved as blocked. No production readiness promotion.
- The prod-deploy-verification blocker is preserved verbatim.

---

## Status

| Field | Value |
|-------|-------|
| Slice ID | DEMO7 |
| Wave | wave-19 |
| Lane | H |
| Status | code_complete |
| Type | docs |
| Validation | tsc_clean (docs only — no TypeScript changes) |

---

*Wave 19 · Lane H · DEMO7 · 2026-04-26*
