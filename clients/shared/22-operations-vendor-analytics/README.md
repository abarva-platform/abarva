# Operations & Vendor Exposure — analytics presentation package (DORMANT)

This package is the **presentation layer** for the Operations & Vendor Intelligence
story across three surfaces, authored **against the approved semantic contract** and
kept dormant until the foundation lane activates the governed baseline, Cube, and
read-only analytics access.

```
Client extracts & interviews
      ↓
Governed Knowledge Baseline (PostgreSQL)        ← foundation lane
      ↓
Consumption projections                         ← foundation lane
      ↓
Cube semantic layer (measures/dimensions/SQL)   ← foundation lane
      ├── AbarVa-native lens  (src/components/knowledge/vnext/operations)  ← this repo, live-dormant
      ├── Apache Superset dashboard  (./superset)                          ← this package (layout only)
      └── Observable narrative       (./observable)                       ← this package (presentation only)
```

## Lane boundary (do not cross)

**Claude / UI-UX (this package authors):**
- the AbarVa-native analytics experience (the lens);
- the "Analyze in Superset" handoff (baseline-bound deep link);
- Superset dashboard **layout and presentation configuration** — chart types, positions,
  filters, drill paths — referencing measure/dimension **names** from the approved
  `CUBE_MEASURE_AND_DIMENSION_CATALOG`;
- the Observable **narrative** presentation;
- the reconciliation **presentation** (which identity fields every surface must show).

**Codex / foundation (owns — NOT authored here):**
- Cube semantic models and governed metric definitions (SQL, numerator/denominator,
  null behavior, authority minimum);
- Superset **dataset definitions where they include SQL or governed metrics**;
- tenant/baseline enforcement and Cube↔PostgreSQL parity;
- read-only identities and database grants;
- Cube/Superset/Observable infrastructure, deployment and live connection to the
  governed Airline baseline;
- reconciliation **proof** that AbarVa, Cube, Superset and Observable resolve the same
  tenant key, baseline ID, baseline content hash, projection version, metric-definition
  version and refresh run.

Nothing here defines a governed business measure or connects an analytics tool to
PostgreSQL. Every measure is referenced by its approved **name** only; the SQL and the
connection live in the foundation lane.

## Files

| File | What it is | Owner |
| --- | --- | --- |
| `SEMANTIC_BINDING.json` | Maps each lens/dashboard tile to an **approved Cube measure name** + dimensions. No SQL. The single parity anchor. | Claude (names) → Codex (SQL) |
| `PARITY_CONTRACT.md` | The identity fields every analytical surface must expose so a human/Codex can reconcile them. | Claude (presentation) → Codex (proof) |
| `superset/vendor-operational-exposure.dashboard.json` | Superset dashboard **layout** (charts, positions, filters) referencing dataset + measure names. | Claude (layout) → Codex (datasets/SQL) |
| `observable/vendor-operational-exposure.md` | Observable Framework **narrative** page; reads a governed data loader placeholder. | Claude (narrative) → Codex (loader) |

## Activation (foundation lane, after baseline is live)

1. Activate Cube against the governed `consumption.*` projections.
2. Prove Cube↔PostgreSQL parity for every measure in `SEMANTIC_BINDING.json`.
3. Define the Superset datasets named in the dashboard JSON over the governed
   semantic/read-only layer (SQL + governed metrics — foundation lane).
4. Import `superset/vendor-operational-exposure.dashboard.json` and bind it to those datasets.
5. Point the Observable page's data loader at the governed layer.
6. Configure the "Analyze in Superset" base URL (env `NEXT_PUBLIC_SUPERSET_BASE_URL`) so the
   handoff link goes live.
7. Verify every surface exposes the identical identity set in `PARITY_CONTRACT.md`, then
   capture signed-in proof.

Until step 6, the handoff button renders disabled ("configure Superset") and no analytics
tool is connected to any data.
