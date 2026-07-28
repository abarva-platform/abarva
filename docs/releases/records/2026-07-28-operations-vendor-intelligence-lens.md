# 2026-07-28-operations-vendor-intelligence-lens — Operations & Vendor Intelligence lens

## Release ID

`2026-07-28-operations-vendor-intelligence-lens`

## Status

`candidate`

## Plain-English Summary

Adds an **Operations & Vendor Intelligence** perspective to the Home/Knowledge vNext
experience. It is a navigable *lens* over the governed Knowledge Baseline — not a new
dashboard and not a new source of truth — that connects operational capabilities →
applications → vendors → contracts → incident/SLA summaries → risks → programs → evidence.
It reads only the existing governed consumption provider, so it lights up automatically once
a real baseline is active behind the HTTP provider, and shows a clear "not yet available"
state (never fixture or fabricated data) until then.

It also lands the **dormant analytics presentation package** for the same story: an
"Analyze in Superset" handoff, a Superset dashboard layout, and an Observable narrative —
all authored against the approved semantic contract and disconnected until the foundation
lane activates Cube, datasets and read-only access.

## Layer Impact

- **Products (layer 4) — UI/UX only.** New presentation inside the Knowledge product
  (Explore → Operations & Vendor Intelligence) plus dormant analytics presentation assets.
  No canonical model, source adapter, or intake change. Not `client-data-lane`, not a
  data-plane change, not `public-demo`. The lens composes existing consumption projections;
  it defines no governed measure and connects to no database.

## Client Applicability

- All clients: No.
- Specific clients: No.
- Internal only: Yes — reachable only via the admin-only `/knowledge-preview` route
  (platform-admin gated) using synthetic fixtures.
- Public/demo only: No.
- Feature flag: `home_knowledge_vnext` remains **default-OFF**; this flag governs future
  tenant activation and is not the gate for admin preview. No tenant user reaches this today.

## Changes Included

- `src/lib/knowledge/operations-lens/**` — taxonomy, view-model types, pure compose
  functions (capability grouping, vendor intelligence, dependency chains) + unit tests.
- `src/components/knowledge/vnext/operations/**` — the lens UI, orchestration hook, and the
  dormant "Analyze in Superset" deep-link helper.
- `src/components/knowledge/vnext/modes/ExploreMode.tsx` — Inventory ⇄ Operations & Vendor
  perspective switch (no change to the four-mode contract).
- `src/components/knowledge/vnext/{state.tsx,AvaDock.tsx}` — route suggested decision
  questions into the existing baseline-bound aVa dock (answers still come from aVa).
- `src/components/knowledge/vnext/knowledge-vnext.css` — lens styling.
- `src/lib/knowledge/fixtures/airline-demo-new.ts` — additive synthetic capability/vendor/
  contract/risk data (fixture-only, synthetic namespace).
- `clients/shared/22-operations-vendor-analytics/**` — dormant analytics presentation
  package: `SEMANTIC_BINDING.json` (parity anchor referencing approved Cube measure names),
  `PARITY_CONTRACT.md`, Superset dashboard layout JSON, Observable narrative page, README.

## QA / Validation

- Unit tests: `npx jest src/lib/knowledge/operations-lens src/lib/knowledge/consumption-client
  src/lib/knowledge/consumption-contracts` → **66 passed** (15 new compose tests; existing
  suites unaffected by the additive fixture changes).
- Typecheck: scoped `tsc --noEmit` over the changed files → clean (full-project `tsc` OOMs
  locally; CI authoritative).
- Lint: `eslint` over all changed/new files → **0 problems**.
- Live visual proof (fixtures-only dev harness, since removed): verified the lens renders the
  executive overview with governed availability pills, all seven capabilities (Crew ops
  correctly shows 0 vendors — internal build), vendor intelligence panel (concentration shown
  as indicators with the explicit "not a judgment" disclaimer; risk voiced only by
  graph-linked governed risk objects; transformation exposure honestly "Not loaded"), the
  dependency view with per-link evidence, the evidence drawer (role=dialog, full lineage), and
  the `not_loaded` scenario correctly rendering a "Not yet available" state — never
  fabricated zeros.
- Governance invariants exercised by tests: no null→0 coercion; capability attribution only
  from explicit governed signals; renewal window measured from baseline as-of; JSON assets
  validated.

## Rollout Plan

Merge to `main` via squash PR. **No runtime rollout / no deploy** in this change: the lens is
reachable only through the admin-only preview route, `home_knowledge_vnext` stays OFF, and the
analytics package is dormant (the Superset handoff renders disabled until
`NEXT_PUBLIC_SUPERSET_BASE_URL` is configured by the foundation lane). Live behind the HTTP
provider follows automatically after the foundation lane activates the baseline and
projections — no further UI change required.

## Deployment Authority

Not applicable to this change — it mutates no Azure resource, deploy workflow, runtime image,
worker job, traffic, DNS, feature flag default, or environment. Foundation-lane activation
(Cube, Superset datasets/SQL, read-only grants, live connection, Cube↔PostgreSQL parity proof)
is tracked separately and is not performed here.

## Rollback Plan

Revert the squash commit. There is no schema, migration, data, or runtime state to unwind; the
feature is dormant behind an admin-only route and an OFF flag, so revert is fully sufficient.

## Known Gaps

- **Live signed-in proof is owed after activation.** Visual proof today is fixtures-only
  (synthetic `fixture-airline-demo-new`); the governed HTTP-provider path cannot be proven
  until the foundation lane activates a real baseline and its consumption projections.
- **Analytics package is dormant.** Cube measure definitions/SQL, Superset dataset SQL,
  read-only grants, the live connection, and the Cube↔PostgreSQL parity proof are
  foundation-lane work and are not included here. The Superset handoff is disabled until
  `NEXT_PUBLIC_SUPERSET_BASE_URL` is configured.
- **Incident/SLA/spend measures not charted.** Those measures are not in the approved
  `CUBE_MEASURE_AND_DIMENSION_CATALOG` yet; the Superset layout flags them as pending
  foundation-lane definitions rather than inventing them.
- **metric-definition-version / refresh-run identity show "resolved at activation"** in the
  reconciliation strip until Cube is wired.
- **Full-project local `tsc` OOMs**; typecheck was verified scoped to changed files, with CI
  authoritative.

## Audit Evidence

- PR URL: (to be filled on open)
- CI run: (to be filled on open)
- Test output: `66 passed` (see QA / Validation)
- Parity contract: `clients/shared/22-operations-vendor-analytics/PARITY_CONTRACT.md`
- Lane boundary: `clients/shared/22-operations-vendor-analytics/README.md`
