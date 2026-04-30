# Meridian Health System — Synthetic Tenant Dataset

**Tenant key:** `meridian-health`  
**Generated:** 2026-04-30  
**Purpose:** Full-depth synthetic healthcare tenant dataset for AbarVa Setup/Admin, knowledge-layer, graph, evidence, and retrieval testing.

Meridian Health System is a fictional $16.8B integrated delivery network with a provider-sponsored health plan. It is deliberately different from Apex Retail: the moat is provider-payer integration, clinical operations maturity, regulatory weight, and the messy reality of healthcare transformation.

## Tenant personality

Meridian operates 30 hospitals across California, Nevada, Oregon, and Hawaii, with 5,800 staffed beds, 58,000 employees, 7,400 employed physicians, 14.0M annual ambulatory visits, and 1.4M covered lives in Meridian Health Plans. The provider business is deep in Epic, mature clinical analytics, and population health. The plan business is substantial enough to shape strategy, but not integrated enough to avoid politics.

## Realism techniques applied

1. **Imperfection.** Missing owners, stale validations, unresolved BAAs, under-revision KPIs, low-confidence evidence, and an explicit VP Application Services vacancy.
2. **Contradiction.** Cost takeout vs clinical AI investment; board AI governance discipline vs shadow AI use; plan network adequacy vs provider capacity; Hawaii integration as a stated priority while deferred.
3. **History.** DENIALS-2024, EPIC-CONSOL-HAWAII-2024, and PATIENT-DIGITAL-2023 all shape current programs.
4. **Specificity.** Healthcare-specific caveats: HCAHPS response bias, ALOS observation adjustment, gross/net denial rate, STAR measure year, FDA SaMD posture, and HIPAA/BAA constraints.
5. **Asymmetric depth.** Rich clinical and population-health data; thinner RCM and workforce instrumentation by design.

## Dataset families

| # | Family | Files | Notes |
|---|---|---:|---|
| 01 | Enterprise profile | 1 | System identity, legal structure, regulatory posture |
| 02 | Org structure | 4 | Executives, IT leadership, politics, failure history |
| 03 | IT landscape | 3 | 112 systems, 30 integrations, 22 shadow IT tools |
| 04 | IT financials | 2 | $384M IT budget and 55 renewals |
| 05 | KPI dictionary | 1 | 102 KPIs with provider/plan/shared tagging |
| 06 | Program inventory | 1 | Four active programs with graph-ready references |
| 07 | Sourcing artifacts | 4 | Ambient RFP, evaluations, RCM tracker, templates |
| 08 | Program deliverables | 4 | Signed charters/specs/discovery artifacts |
| 09 | Evidence ledger | 1 | 42 evidence items with confidence and caveats |
| 10 | Operating telemetry | 2 | Meeting notes, risks, actions, decisions |
| 11 | Vendor contracts | 2 | 45 vendor scorecards and strategic clause inventory |
| 12 | Compliance | 2 | Healthcare regulatory posture and audit findings |
| 13 | Industry context | 1 | External signals and benchmarks |
| 14 | Cross-program signals | 1 | Atlas-style cross-program graph signals |

## Knowledge-layer integration

The data intentionally carries stable identifiers for graph wiring:

- People: `person:meridian:*`
- Systems: `system:meridian:*`
- Vendors: `vendor:meridian:*`
- KPIs: `kpi:meridian:*`
- Programs: `meridian-*-2026`
- Evidence: `ev:meridian:*`
- Cross-program signals: `xprog:meridian:*`

Provider/plan/shared tagging is included wherever the record crosses operational boundaries.
