# DEMO10 (Wave 26) — Enterprise Pilot Demo Script

**Slice ID:** DEMO10 (Wave 26 instance — distinct from Wave 23 DEMO10 which was the 30-min AMS storyline)  
**Wave:** wave-26  
**Track:** 10 — Demo Storyline  
**Status:** code_complete  
**Completed:** 2026-04-26  
**Author:** AbarVa Autonomous Orchestration  
**Type:** Documentation — docs only, no runtime code, no migrations, no model calls.

---

## What was built

**`docs/demo/DEMO10_ENTERPRISE_PILOT_DEEP_DIVE.md`** — 45-minute deep-dive demo script for the pilot client's full leadership team.

### Script structure

| Section | Minutes | Routes covered |
|---|---|---|
| Opening and positioning | 0–5 | (verbal) |
| Home: executive command center | 0–5 | `/home` |
| Programs: portfolio and flagship | 5–15 | `/tenant/apex-retail/programs`, programme detail |
| Source: commercial event intelligence | 15–25 | `/source/events/apex-retail-ams-outsourcing-2026` |
| Intelligence: Sentinel patterns | 25–30 | `/tenant/apex-retail/intelligence` |
| Tower: Atlas executive brief | 30–35 | `/tenant/apex-retail/tower` |
| Admin: data trust + readiness | 35–40 | `/admin` |
| Azure private data plane | 40–45 | Architecture doc (AZLAB7) |
| Close and objection handling | 43–45 | (verbal) |

### Key features

- Pre-demo checklist (7 tabs + fallback screenshots)
- Talk track for each section with "what to click" and "what NOT to claim" callouts
- Objection handling table (5 common objections with responses)
- Explicit fabrication policy header
- References real seed data: Apex Retail, 4 programmes, AMS event, 4 vendors (Northstar, BlueMaster, DataPeak, ArcVault)

---

## Files created

- `docs/demo/DEMO10_ENTERPRISE_PILOT_DEEP_DIVE.md`
- `docs/build/slices/DEMO10_ENTERPRISE_PILOT_DEMO.md` (this file)

---

## Honesty compliance

- No ROI figures, market share claims, or savings percentages
- Every reference to AI output is qualified as seed data
- Real-time data explicitly disclaimed
- Azure private data plane status correctly described as "designed, not yet in production for any client"

---

## Excluded

- No runtime code changes
- No database changes
- No API routes
