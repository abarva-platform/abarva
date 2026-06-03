# Moves Rate-Card Research Notes — Phase 1 spine

## Purpose

This note captures the research method for the rate-card corpus before the seed/workbook is populated. The rule is simple: the engine may compute derived columns, but every input rate or modifier must carry `source`, `as_of`, and `confidence`. Where public evidence is thin, the row remains low-confidence or flagged rather than being dressed up as a precise market fact.

## Source Ledger

| Source family                          | Use in rate card                                                                                       | Current evidence                                                                                                                                                                                                                                                                                 | Confidence posture                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| BLS OEWS May 2025 occupation tables    | National base wage spine by occupation, mapped to function group and role level using wage percentiles | BLS publishes May 2025 national, state, metro, industry, and all-data tables. Occupation profiles include Software Developers, Data Scientists, Database Architects, Project Management Specialists, Security Analysts, Systems Administrators, and related SOCs.                                | High for occupation/metro wage spine; medium after mapping SOC to AbarVa function groups.                                     |
| BLS ECEC December 2025                 | Benefits/overhead default for internal loaded cost rates                                               | BLS ECEC reports December 2025 private-industry wages/salaries and benefits per hour; benefits are the defensible overhead anchor.                                                                                                                                                               | High for broad benefits ratio; medium for technology-specific loaded-cost assumption.                                         |
| BEA Regional Price Parities            | Geo modifier sanity check for metro/local cost differences                                             | BEA publishes RPPs by state and metro area and states that RPPs express local price levels as a percentage of the national price level.                                                                                                                                                          | Medium: useful for cost-of-living context, but final geo modifier should blend labor wage ratios plus RPP, not RPP alone.     |
| BLS OEWS May 2025 metropolitan tables  | Geo modifier labor component by target metro                                                           | BLS metro table includes New York-Newark-Jersey City, San Francisco-Oakland-Fremont, Chicago, Austin, Dallas-Fort Worth, Houston, Miami, Raleigh, Atlanta, Cleveland, and Columbus-relevant metros.                                                                                              | High when table rows are fetched; pending bulk extraction because direct ZIP/TXT download returned 403 from this environment. |
| GSA CALC / MAS public schedules        | Vendor/SI hourly bill-rate benchmark, especially onshore and named-vendor public ceiling rates         | GSA pricing tools expose fully burdened not-to-exceed labor ceiling rates. Tata America/TCS GSA MAS price list provides 2025-2026 hourly rates for project manager, security engineer, DBA, platform/mobile app developer, DevOps, technical architect, application developer, and tester roles. | High for federal ceiling rates; medium when generalized to commercial enterprise SI rates.                                    |
| Existing AbarVa benchmark card         | Reconciliation against prior researched market bands                                                   | `src/lib/programs/expert-kernel/rate-card/benchmark-rate-card.ts` already carries a researched 3-D SI benchmark with confidence notes and as-of date.                                                                                                                                            | Medium; keep as fallback, but do not let it override newly cited row-level evidence.                                          |
| Databricks Lakebridge/BladeBridge docs | Phase 2 modernization calibration, not rate-card inputs                                                | Lakebridge docs describe pre-migration assessment, analyzer/profiler, conversion, and reconciliation coverage across SQL/ETL/orchestration sources.                                                                                                                                              | High for product capability; automation percentage requires source-specific confirmation.                                     |

## Method

1. Internal LCR rows start with BLS OEWS national wage percentiles by SOC. Role-level mapping is:
   - Junior: P25 to median band.
   - Mid-Level: median to P75 band.
   - Senior: P75 to P90 band.
   - Lead/Architect: P90 plus a management/architect premium where the SOC family supports it.
2. Benefits/overhead uses BLS ECEC as the default. The seed should store the chosen `benefits_overhead_pct` and cite ECEC; tenant uploads can override it.
3. Geo modifiers are national-base multipliers. They should blend:
   - BLS metro wage ratio for the matching SOC or a computer/mathematical occupation basket.
   - BEA regional price parity as a sanity cap/floor.
   - Offshore/India baseline from vendor/SI benchmark sources, not US COL data.
4. Vendor/SI rows should prefer public contract ceiling schedules first, then broader market research second. Rows from federal schedules are labelled as public-sector ceiling proxies, not commercial quotes.
5. Every derived value is recomputed server-side. Workbook formula cells are previews only.

## Initial Role/SOC Mapping

| AbarVa function group | Primary SOC spine                                                                        | Secondary evidence                                                    |
| --------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Digital               | 15-1255 Web and Digital Interface Designers; 15-1254 Web Developers                      | 15-1252 Software Developers for senior engineering overlap            |
| Full-Stack Dev        | 15-1252 Software Developers                                                              | 15-1251 Computer Programmers, 15-1253 QA Analysts/Testers             |
| Data/Analytics        | 15-2051 Data Scientists; 15-1243 Database Architects                                     | 15-1242 Database Administrators, 15-2031 Operations Research Analysts |
| Legacy/Mainframe      | 15-1251 Computer Programmers; 15-1299 Computer Occupations, All Other                    | GSA legacy/app developer categories                                   |
| EPIC/Clarity          | 15-1243 Database Architects; 15-1211 Computer Systems Analysts                           | Healthcare-specific source still needed                               |
| ERP                   | 15-1211 Computer Systems Analysts; 13-1111 Management Analysts                           | GSA technical/business consultant categories                          |
| Infra/Cloud           | 15-1241 Computer Network Architects; 15-1244 Network and Computer Systems Administrators | GSA cloud architect/devops categories                                 |
| PMO                   | 13-1082 Project Management Specialists                                                   | GSA IT Project Manager rates                                          |
| Security              | 15-1212 Information Security Analysts                                                    | GSA Security Engineer rates                                           |
| Integration           | 15-1252 Software Developers; 15-1299 Computer Occupations, All Other                     | GSA technical architect/application developer/tester rates            |

## Confirmed Public Rate Anchors

| Anchor                                                 | Evidence                                                                                                                                                                                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TCS/Tata America GSA MAS contract window               | Contract 47QTCA24D00B2 runs June 13, 2024 through June 12, 2029, with Year 2 covering June 13, 2025 through June 12, 2026.                                                                                                     |
| TCS/Tata America GSA PM rates                          | IT Project Manager Level III customer facility: $252.78/hour in Year 2; contractor facility: $265.42/hour in Year 2.                                                                                                           |
| TCS/Tata America GSA security rates                    | Security Engineer Level III customer facility: $258.15/hour in Year 2; contractor facility: $271.06/hour in Year 2.                                                                                                            |
| TCS/Tata America GSA data/platform rates               | Database Administrator Level III customer facility: $247.40/hour in Year 2; Platform and Mobile App Developer Level III customer facility: $247.40/hour in Year 2.                                                             |
| TCS/Tata America GSA DevOps/architecture/app dev rates | DevOps Engineer Level III contractor facility: $213.46/hour in Year 2; Technical Architect Level III contractor facility: $237.18/hour in Year 2; Application Developer Level III contractor facility: $201.04/hour in Year 2. |

## Current Access Gaps

- Direct `curl` downloads from `bls.gov/oes/special-requests/*` and `download.bls.gov/pub/time.series/oe/*` returned HTTP 403 from this environment. The BLS HTML/profile pages are reachable, so the source is valid, but bulk extraction needs either browser download, a different network path, or manual handoff of the XLSX/TXT.
- The non-repo workbook `~/Downloads/Moves_Sourcing_Pricing_RateCards_v2.xlsx` was not copied into this worktree. The code slice does not need it; seed/workbook population will.
- Offshore SI rates need a second-source pass. Public GSA rates are strong for onshore/federal ceiling proxies; offshore commercial delivery rates are less transparent and should be low/medium confidence unless backed by named public schedules.

## Implementation Implications

- The first build slice adds deterministic validation and compute only. It does not populate `seed.json` yet because doing so without the BLS bulk table extraction would create a false sense of completeness.
- The next research slice should produce a machine-readable source ledger with one row per seeded input, including URL, retrieved date, source vintage, source class, and confidence rationale.
- The next build slice should add template registration and ingestion parsing, then use this kernel as the only server-side compute path.
