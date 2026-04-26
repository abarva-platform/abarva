# Slice Contract: DEMO3 — 20-Minute Boardroom Demo Pack

| Field              | Value |
|--------------------|-------|
| **Slice ID**       | DEMO3 |
| **Name**           | 20-Minute Boardroom Demo Pack |
| **Category**       | demo |
| **Validation Status** | code_complete |
| **Risk**           | low |
| **Date**           | 2026-04-26 |
| **Wave**           | wave-13 (20-Minute Boardroom Demo Pack) |

---

## Goal

Produce a polished, founder-facing 20-minute boardroom demo script for
AbarVa at `docs/demo/ABARVA_20_MINUTE_BOARDROOM_DEMO.md`.

The script is structured for a Fortune 500 CTO / CISO / VP Engineering
audience. It documents: a pre-demo checklist, an opening narrative, a
7-stop route sequence with talk tracks, a Fortune 500 data trust story,
a pilot ask close, known deterministic caveats, a fallback playbook, and
post-demo handling notes.

DEMO3 is a documentation-only slice. It creates no source files, no
migration, and no test files. It does not deploy, does not call any
provider, does not poll Vercel or GitHub, and does not promote any
production-readiness component above its current honest status.

---

## Files Created

### Documentation

- `docs/demo/ABARVA_20_MINUTE_BOARDROOM_DEMO.md`
  Primary deliverable. Full polished boardroom demo script with 7 route
  stops, talk tracks, click guidance, expected signals, fallback strategies,
  and explicit caveats for all seed-data and deferred capabilities.

- `docs/build/slices/DEMO3_20_MINUTE_BOARDROOM_DEMO_PACK.md`
  This file. Slice contract doc.

---

## Files Modified (JSON updates only)

| File | Change |
|------|--------|
| `docs/build/build-slices.json` | DEMO3 entry appended |
| `docs/build/production-readiness.json` | Note appended to `validation_qa` component |
| `docs/build/build-waves.json` | `wave-13` entry appended |

---

## Demo Script Coverage

| Stop | Route | Duration |
|------|-------|----------|
| 1 | /home — Executive Command Center | 2 min |
| 2 | /tenant/apex-retail/programs — Portfolio | 3 min |
| 3 | /tenant/apex-retail/programs/contact-center-ai — Deep Dive | 3 min |
| 4 | /tenant/apex-retail/tower — AI Control Tower | 3 min |
| 5 | /tenant/apex-retail/intelligence — Intelligence Library | 2 min |
| 6 | /source/events — Source / Procurement Intelligence | 2 min |
| 7 | Architecture doc (tab 2) — Azure Private Data Plane | 3 min |
| Pilot Ask | — | 1 min |
| **Total** | | **~20 min** |

---

## Acceptance Criteria

- `docs/demo/ABARVA_20_MINUTE_BOARDROOM_DEMO.md` is non-empty and
  contains all 7 stops with route, talk track, what-to-click, expected
  signal, fallback, and what-not-to-claim fields.
- Pre-demo checklist is present.
- Opening narrative is present.
- Fortune 500 data trust story is present (embedded in Stop 7).
- Pilot ask close is present.
- Known deterministic caveats section is present.
- Fallback playbook table is present.
- Post-demo notes are present.
- No false product claims — all deferred capabilities are explicitly
  labelled as seed data, lab targets, or deferred.
- No TS files, no migrations, no test files created or modified.
- `npx tsc --noEmit --pretty false` passes with no regressions.

---

## Validation Commands

```
npx tsc --noEmit --pretty false
```

No new TypeScript files — TSC verifies no regressions from JSON edits.

---

## Notes

- DEMO3 is the third demo-lane slice, following DEMO1 (boardroom script
  20/45/90-min) and DEMO2 (founder route checklist). DEMO3 is a focused
  20-minute boardroom script optimised for Fortune 500 C-suite audiences
  with explicit Azure private data plane talk track and pilot ask close.
- All seven stops use the Apex Retail seed tenant and the four Apex programs
  (Contact Center AI, CDP, Store Associate Productivity, Demand Forecasting).
- The Azure private data plane story references AZLAB1 (two-plane architecture)
  and AZLAB4 (evidence manifest types) from wave-12. May 4 lab target is
  stated explicitly as a planned milestone, not a production claim.
- Pricing is explicitly deferred to a follow-up — do not answer in the
  boardroom.
