# Analytical parity contract — Operations & Vendor Exposure

Four surfaces present the same governed story. They are only trustworthy if they read
the **same governed truth**. This contract fixes the identity every surface must expose
so parity can be **proven** (by the foundation lane) and **seen** (in each UI).

## Surfaces

| Surface | Owner | Reads |
| --- | --- | --- |
| AbarVa-native lens | Claude / UI | governed consumption provider (this repo) |
| Cube semantic layer | Codex / foundation | `consumption.*` views + published metric defs |
| Apache Superset dashboard | Codex datasets / Claude layout | Cube measures or read-only baseline-versioned consumption views |
| Observable narrative | Claude presentation / Codex loader | governed semantic/consumption layer |
| aVa answer packet | Claude UI / audited egress | the same baseline-bound packet |

## Required identity (every surface must expose all six)

1. `tenant_key`
2. `knowledge_baseline_ref` — the active baseline ID
3. `baseline_content_hash` — pins the exact baseline content
4. `projection_contract_version` — the consumption contract version
5. `metric_definition_version` — the Cube semantic model version
6. `refresh_run_ref` — the materialization/refresh run that produced the numbers

The AbarVa lens surfaces (1), (2), (4) and the baseline content hash at Proof depth today;
(5) and (6) are shown as "resolved at activation" until Codex wires the semantic layer.

## Parity assertions (foundation lane proves before any surface goes live)

For a fixed `(tenant_key, knowledge_baseline_ref)`:

- **Same measure, same number.** For every measure in `SEMANTIC_BINDING.json`, the value
  returned by Cube equals the value computed directly from the governed PostgreSQL
  consumption view (Cube↔PostgreSQL parity), and the Superset dashboard and Observable
  page render that same value.
- **Same null.** A measure that is `withheld` / `not_measured` / `not_loaded` renders as an
  explicit unavailable state on **every** surface — never as 0 on one and blank on another.
- **Same lineage.** "Critical applications supported by vendor X" resolves to the same set
  of application IDs in the lens, the Cube query, the Superset drill-down and the aVa
  evidence packet.
- **Same identity.** All six identity fields above match across surfaces for the render.

## What this contract does NOT do

It does not define measures (SQL), connect any tool to a database, or grant access. Those
are foundation-lane responsibilities. This file is the checklist the parity **proof** runs
against, and the set of fields each **presentation** must show.
