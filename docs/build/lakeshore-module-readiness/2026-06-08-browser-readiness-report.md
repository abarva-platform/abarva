# Lakeshore Module Readiness Browser Report

Date: 2026-06-08  
Target: https://app.abarva.ai  
Primary tenant: Lakeshore Holdings  
Auth method: Clerk ticket sign-in using the locked Lakeshore maestro persona  
Evidence folders:

- Baseline module crawl: `/Users/anand/Projects/nexus/reports/module-readiness-browser-2026-06-08-final-run/`
- Deep module crawl: `/Users/anand/Projects/nexus/reports/module-readiness-browser-2026-06-08-deep-run/`
- Lakeshore Intelligence tab crawl: `/Users/anand/Projects/nexus/reports/lakeshore-intelligence-tabs-2026-06-08/`

## Executive Status

The live Azure production app is reachable and authenticated for all tested maestro personas. Route health is green: no 4xx/5xx responses, no sign-in redirects, and no obvious cross-tenant leakage in captured route text.

The product-readiness issue is module binding, not auth or deployment. Lakeshore Enterprise Context is partially loaded and visible, but Intelligence Brief, Map, Art of Possible, Vendors, Moves, and Tower are not yet fully bound to the loaded substrate.

## Tested Personas

| Tenant | Email | Auth | Routes tested | 4xx/5xx | Sign-in redirects |
|---|---|---:|---:|---:|---:|
| Apex Retail | anand.sundaram+apex@thesundaram.com | PASS | 32 | 0 | 0 |
| Meridian | anand.sundaram+meridian@thesundaram.com | PASS | 32 | 0 | 0 |
| SkyHarbor | anand.sundaram+skyharbor@thesundaram.com | PASS | 32 | 0 | 0 |
| Lakeshore | anand.sundaram+lakeshore@thesundaram.com | PASS | 32 | 0 | 0 |
| First Capital | anand.sundaram+firstcapital@thesundaram.com | PASS | 32 | 0 | 0 |
| Northstar | anand.sundaram+northstar@thesundaram.com | PASS | 32 | 0 | 0 |

## Lakeshore Readiness Matrix

| Module | Browser route health | Current binding state | Readiness | Evidence |
|---|---:|---|---:|---|
| Home | PASS | Tenant-specific executive shell renders for Lakeshore. Needs deeper check for whether all facts are live-backed. | 70% | `reports/module-readiness-browser-2026-06-08-deep-run/lakeshore/snapshots/home.png` |
| Intelligence - Brief | PASS | Shows `CORPUS NOT YET SEEDED`; does not use the loaded Enterprise Context facts yet. | 20% | `reports/lakeshore-intelligence-tabs-2026-06-08/the-brief.png` |
| Intelligence - Map | PASS | Shows `CORPUS NOT YET SEEDED`; does not render a Lakeshore context map yet. | 20% | `reports/lakeshore-intelligence-tabs-2026-06-08/the-map.png` |
| Intelligence - Art of Possible | PASS | Explicitly says tenant opportunity bands are not loaded. | 10% | `reports/lakeshore-intelligence-tabs-2026-06-08/art-of-possible.png` |
| Intelligence - Enterprise Context | PASS | Visible and partially bound: 179 records, 2,949 facts, 13 sources, 1,542 evidence references shown. Evidence freshness is visible, but confidence/evidence quality still needs validation. | 65% | `reports/lakeshore-intelligence-tabs-2026-06-08/enterprise-context.png` |
| Intelligence - Vendors | PASS | Explicitly says no tenant-specific vendor spend is loaded; shows 0 vendors and $0 annualized spend. | 15% | `reports/lakeshore-intelligence-tabs-2026-06-08/vendors.png` |
| Intelligence - Which bet first | PARTIAL | Tab click did not activate in the automated crawl; page remained on Vendors. Needs selector or UI affordance check. | 10% | `reports/lakeshore-intelligence-tabs-2026-06-08/which-bet-first.png` |
| Sentinel / Ask | PASS route | `/intelligence/ask` renders, but CXO answer QA was not run in this crawl. Needs grounded question suite. | 35% | `reports/module-readiness-browser-2026-06-08-deep-run/lakeshore/snapshots/intelligence-ask.png` |
| Moves | PASS route | Shows `NO MOVES YET`; strategic move substrate is not created/bound. | 15% | `reports/module-readiness-browser-2026-06-08-deep-run/lakeshore/snapshots/strategic-moves.png` |
| Source | PASS route | Queue renders with 1 decision, but sourcing portfolio and event pages still show generic/demo/start content. Vendor/contract binding is not proven. | 35% | `reports/module-readiness-browser-2026-06-08-deep-run/lakeshore/snapshots/source.png` |
| Tower | PASS route | Tower shell renders. Portfolio/value routes need populated Moves/Source substrate before executive sequencing can be trusted. | 35% | `reports/module-readiness-browser-2026-06-08-deep-run/lakeshore/snapshots/tower.png` |
| Admin Context Layer | PASS route | Admin context surfaces render. Current browser proof shows Lakeshore context exists, but the upload/parse/process completion chain still needs a separate ingestion receipt. | 55% | `reports/module-readiness-browser-2026-06-08-deep-run/lakeshore/snapshots/admin-context-layer.png` |
| Industry Corpus | PASS admin route | Admin corpus/pattern ops pages render, but browser proof does not yet show deep use by Sentinel, Moves, Tower, or Source. Needs corpus-to-module binding audit. | 35% | `reports/module-readiness-browser-2026-06-08-deep-run/lakeshore/snapshots/admin-corpus.png` |

## Gaps To Close

| Gap | Severity | What live proof showed | Required fix lane |
|---|---|---|---|
| Intelligence corpus not seeded for Lakeshore Brief/Map | High | Brief and Map show `CORPUS NOT YET SEEDED`. | Retrieval/index binding or corpus registry mapping |
| Art of Possible not loaded | High | Art of Possible says tenant opportunity bands have not been loaded. | Data-load plus module binding |
| Vendor panel not bound | High | Vendors tab shows `$0.0M`, `0 vendors`, and no tenant-specific vendor spend. | Vendor/contract extraction plus Intelligence vendor binding |
| Moves empty | High | `/strategic-moves` and `/moves` show `NO MOVES YET`. | Move creation/substrate from qualified Intelligence/Source signals |
| Tower lacks program substrate | High | Tower shell renders, but value/portfolio depends on Moves/Source substrate that is not populated. | Tower portfolio binding after Moves/Source creation |
| Sentinel/Nexus answer QA not run | High | Route renders, but no answer-quality suite executed. | CXO Q&A audit using Azure Postgres/Search and Anthropic |
| Industry corpus visibility not proven | Medium | Corpus admin route renders; no proof that every module uses corpus/patterns deeply. | Corpus-to-module audit |
| Enterprise Context evidence quality unverified | Medium | 179 records and 2,949 facts visible; evidence count and confidence need source/citation validation. | Context QA and provenance validation |

## Interpretation

The current state is not a production outage. The Azure app, Clerk personas, tenant routing, and core routes are healthy. The remaining work is product/data readiness: the loaded Lakeshore context is visible in Enterprise Context, but the decision modules have not all promoted that substrate into their own surfaces.

Do not mark Lakeshore as fully demo-ready until the following are green:

1. Intelligence Brief/Map use the Lakeshore corpus/context instead of `CORPUS NOT YET SEEDED`.
2. Art of Possible has tenant-specific opportunity bands.
3. Vendors shows real Lakeshore vendors/contracts/spend/risk from loaded evidence.
4. Moves contains at least one evidence-backed strategic move.
5. Tower reflects the active Moves/Source portfolio.
6. Sentinel/Nexus answer QA proves CXO questions are answered with citations and no generic filler.
7. Industry corpus/pattern IDs are used by relevant modules and validated against the active registry.

