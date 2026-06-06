# Meridian / PHS Demo — Screenshot Capture Plan & Index

Screenshot **capture is environment-blocked from Cursor Cloud** (the app needs
real Clerk auth + private Azure data-plane reachability; see `KNOWN_GAPS.md`).
This file defines the exact capture plan and the index to fill in when run from
an onboarded environment.

Recommended output location: `audit-artifacts/meridian-phs-wow-demo/screenshots/`.

## Capture plan (persona: meridian-cdao / meridian-cdio)

| #   | Surface / route                           | What to capture                 | Validation in shot                                            |
| --- | ----------------------------------------- | ------------------------------- | ------------------------------------------------------------- |
| 01  | Admin → Context Layer (`meridian-health`) | Source files + embedding status | `873 embedded, 0 pending, 0 failed`                           |
| 02  | Admin → Data Loads                        | Latest governed ingestion run   | tenant `meridian-health`, governed loader                     |
| 03  | Admin → Agent Readiness                   | Readiness for Meridian          | Intelligence/Programs green                                   |
| 04  | `/intelligence` Brief                     | Sentinel brief for Meridian     | no "unloaded context" banner                                  |
| 05  | `/intelligence` Enterprise Context        | Enterprise context panel        | Meridian loaded, counts                                       |
| 06  | `/intelligence` Ask (CFO Q)               | A hard answer                   | cites evidence; Options/Assumptions sections; no wall of text |
| 07  | `/intelligence` Ask (cross-tenant Q)      | Refusal answer                  | honest refusal; no Apex/SkyHarbor leak                        |
| 08  | `/strategic-moves`                        | Portfolio with hero Move        | Move visible                                                  |
| 09  | `/strategic-moves/[id]`                   | Detail + PhaseRail P0..P5       | six phases then → Tower                                       |
| 10  | Move → Documents tab                      | Per-phase deliverables          | export links present                                          |
| 11  | Artifact download                         | DOCX/PDF/XLSX opening           | file opens, content matches `artifacts/`                      |
| 12  | Tower                                     | Value-measurement contract      | Tower owns post-handoff scoreboard                            |

## How to capture

Option A — existing post-deploy crawl harness (recommended):

```
npm run crawl:post-deploy -- \
  --persona meridian-cdio,meridian-cdao \
  --surface intelligence-ask \
  --question-set phs-meridian \
  --output-dir audit-artifacts/meridian-phs-wow-demo
```

Option B — Playwright E2E (needs `npx playwright install chromium` + running dev
server with real Clerk + Azure credentials), driving the routes in the table.

## Index (fill in after capture)

| #   | File                                     | Status            |
| --- | ---------------------------------------- | ----------------- |
| 01  | `screenshots/01-admin-context-layer.png` | _pending capture_ |
| 02  | `screenshots/02-data-loads.png`          | _pending capture_ |
| …   | …                                        | _pending capture_ |

> Until captured from an onboarded environment, treat screenshots as an open QA
> item — do not fabricate them.
