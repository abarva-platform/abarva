# AbarVa Golden Health System — Synthetic Golden Move Fixture Dataset

**Tenant key:** `internal-golden`
**Generated:** 2026-07-24
**Purpose:** Permanent, internal-only regression/demo/proof fixture for the Moves product, per the
"Golden Move" proposal in `docs/architecture/MOVES_OPERATING_MODEL.md`. This tenant exists so that
regression testing, demos, and evidence phase-scoping proofs never need to touch a real client
tenant or MEMBER AI ASSIST (a real, disputed Move under active fabrication-incident remediation).

AbarVa Golden Health System is a **fictional** $54.2B integrated delivery network with a
provider-sponsored health plan (2.1M covered lives), built at the same Healthcare archetype as the
Meridian Health System fixture and at the AbarVa synthetic substrate volumetric standard:

- Revenue: $54.2B (>= $50B floor)
- Applications: 200 systems (within the 180-220 floor)
- Initiatives: 40 active programs (within the 35-50 floor)

It is **not** a client and must never appear in a client-facing portfolio view, billing record, or
pilot report — `internal-golden` fails every "real tenant" check by construction (tenant key, not a
status flag).

## Dataset families

| # | Family | Notes |
|---|---|---|
| 01 | Enterprise profile | Entity identity and Golden Move purpose statement |
| 02 | Org structure | 14 executives, 10 IT leaders, function capacity, political map |
| 03 | IT landscape | 200 systems, 60 integrations, 25 shadow IT tools |
| 04 | IT financials | Spend breakdown, capital plan, funding authority, renewals |
| 05 | KPI dictionary | 150 KPIs |
| 06 | Program inventory | 40 active initiatives, incl. `golden-member-ai-assist-*` (analog to MEMBER AI ASSIST) |
| 07 | Sourcing artifacts | RFP, vendor evaluation, template registry |
| 08 | Program deliverables | Illustrative P0-P3 deliverable drafts |
| 09 | Evidence ledger | 40 evidence items across P0-P2 |
| 10 | Operating telemetry | Meeting notes, risk/action/decision log |
| 11 | Vendor contracts | 55 vendor scorecards, 25 contract clauses |
| 12 | Compliance | Compliance posture, 20 audit findings |
| 13 | Industry context | 28 healthcare industry benchmark signals |
| 14 | Cross-program signals | 22 cross-program dependency signals |

## Explicitly not done by this dataset alone

Adding this dataset (and the corresponding `internal-golden` tenant registration) is code/config
only. It does **not** run `tenant:bootstrap --tenant internal-golden --apply`, and it does not
create the actual Golden Move record or walk it through P0-P2 with real uploaded/approved evidence.
See the release record for this change under `docs/releases/records/` for the required follow-up.
