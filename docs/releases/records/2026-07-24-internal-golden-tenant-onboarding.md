# 2026-07-24-internal-golden-tenant-onboarding — Golden Move fixture tenant onboarding (code/config only)

## Release ID

`2026-07-24-internal-golden-tenant-onboarding`

## Status

`candidate`

## Plain-English Summary

This PR registers a brand-new, permanent, internal-only tenant key — `internal-golden` — so that
Moves regression testing, demos, and evidence-phase-scoping proofs never again need to touch MEMBER
AI ASSIST, a real Move under tenant `meridian` that is subject to an active fabrication-incident
remediation, or any other real client tenant. It follows the "Golden Move" proposal in
`docs/architecture/MOVES_OPERATING_MODEL.md`.

The new tenant, "AbarVa Golden Health System," is entirely fictional: a synthetic healthcare
archetype sized to the AbarVa substrate volumetric standard ($54.2B revenue, 200 applications, 40
initiatives — all within the $50B+ / 180-220-app / 35-50-initiative floor used elsewhere in the
codebase). It is built from scratch, not copied from Meridian's real content, and is registered so
that it is excluded from every client-facing surface by construction: it is not added to
`src/lib/client-config.ts`'s `ALL_CLIENTS` (the app's client picker/persona surface), only to the
governance-only `src/config/tenants/CANONICAL_TENANTS.ts` list and the setup-data / tenant-input
registries.

**This PR is code and configuration only.** It does not run `tenant:bootstrap --tenant
internal-golden --apply`, does not write to any Azure/Postgres data plane, and does not create the
actual Golden Move record. See "Known Gaps" below for the required follow-up.

## Layer Impact

**Release lane:** `internal-admin` — this is an AbarVa-only operations capability (a permanent
internal regression/demo/proof fixture tenant), not client-facing and not a shared
global-control-lane behavior change.

- **Layer 1 (Client Intake):** New tenant input registration in
  `datasets/tenant-inputs/tenant-input-registry.json` (`internal-golden`, classification
  `internal-fixture`) plus a mirrored universal-template packet at
  `datasets/tenant-inputs/active/internal-golden/current` (identifier-substituted derivative of the
  Meridian Health packet — same structure, entirely fictional entity/company names and ids).
- **Layer 2 (Source Adapters):** New setup-data loader,
  `src/scripts/setup-data/load-internal-golden-setup-data.ts`, adapted from
  `load-meridian-setup-data.ts`. Reads from new repo-root dataset `internal-golden-data/` (14
  segments, mirroring `meridian-data/`'s shape) and writes to the same `data_inventory_*`,
  `enterprise_graph_*`, and `enterprise_context_chunks` tables other tenant loaders use.
- **Layer 3 (Canonical Model):** New governance-tenant entry in
  `src/config/tenants/CANONICAL_TENANTS.ts` (key `internal-golden`) so the dataset manifest and
  context/corpus governance tooling recognize it as a canonical tenant. New dataset manifest at
  `docs/governance/dataset-manifests/internal-golden.json`.
- **Layer 4 (Products):** No product code changed. `internal-golden` is deliberately **not** added
  to `src/lib/client-config.ts`'s `ALL_CLIENTS`, so no product surface (client picker, persona
  switcher, Tower/Source/Moves/Intelligence client-facing views) can select or display it as a
  client. `scripts/tenant-bootstrap.ts` gained a new `internal-golden` entry in its
  `CANONICAL_TENANTS`/`SETUP_DATA_LOADERS` maps (the tenant onboarding orchestrator), which is an
  operator CLI tool, not a product surface.

## Client Applicability

- All clients: No
- Specific clients: No
- Internal only: **Yes** — `internal-golden` is a permanent internal fixture, never a client
  engagement
- Public/demo only: No
- Feature flag: None (identity is declared via tenant-key registration, not a flag, per
  `docs/architecture/MOVES_OPERATING_MODEL.md`'s Golden Move proposal — "so it can't be un-excluded
  by accident")

## Changes Included

- `scripts/tenant-bootstrap.ts` — add `'internal-golden'` to `CANONICAL_TENANTS` and
  `SETUP_DATA_LOADERS`.
- `src/scripts/setup-data/load-internal-golden-setup-data.ts` — new setup-data loader (adapted from
  `load-meridian-setup-data.ts`).
- `internal-golden-data/` — new repo-root synthetic dataset (14 segments: enterprise profile, org
  structure, IT landscape [200 systems], IT financials, KPI dictionary [150 KPIs], program inventory
  [40 initiatives, incl. `golden-member-ai-assist-*`], sourcing artifacts, program deliverables,
  evidence ledger [40 items], operating telemetry, vendor contracts [55 vendors], compliance,
  industry context, cross-program signals).
- `datasets/tenant-inputs/tenant-input-registry.json` — new `internal-golden` entry under
  `activeTenants`, classification `internal-fixture`.
- `datasets/tenant-inputs/active/internal-golden/current/` — universal-template packet, derived from
  `meridian-health/current` via full identifier/company-name substitution (no residual "meridian"
  or "MER-" tokens; verified by grep).
- `src/config/tenants/CANONICAL_TENANTS.ts` — new `internal-golden` governance-tenant entry
  (industry `healthcare_provider`, pattern overlays `["core", "internal-fixture"]`, no `compliance`
  override, so it inherits `DEFAULT_TENANT_COMPLIANCE_METADATA` — correct, since this fixture
  contains no real PHI).
- `docs/governance/dataset-manifests/internal-golden.json` — new dataset manifest, validated by
  `npm run validate:context-corpus:manifests`.
- `docs/releases/records/2026-07-24-internal-golden-tenant-onboarding.md` — this record.

## QA / Validation

- `npx eslint <every touched/added file>` — clean.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — clean.
- `npx tsx src/scripts/setup-data/load-internal-golden-setup-data.ts --dry-run` — parses cleanly
  end-to-end: 981 records across all 14 segments (exact match to each segment's
  `expectedRecordCount`), 570 graph nodes, 1,125 graph edges. No Supabase/Azure credentials were
  used; `--dry-run` never mutates.
- `npm run validate:context-corpus:manifests` — passes (`✓ [manifests] passed`).
- `node scripts/audit/check-no-legacy-tenant-inputs.mjs` — passes (0 blocked paths, 0 blocked
  content; internal-golden introduces no legacy-pattern files).
- `npx jest src/config/tenants/__tests__/tenant-compliance.test.ts
  src/lib/governance/__tests__/tenant-coverage.test.ts
  src/lib/governance/__tests__/inventory.test.ts` — all pass; these iterate
  `CANONICAL_TENANT_KEYS` and confirm the new entry is represented without requiring seeded data.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passes.
- **Known, pre-existing, unaffected by this PR:** `npx tsx scripts/audit/canonical-tenant-inputs.ts`
  (not part of `release-check.mjs`) reports `internal-golden` missing/extra universal-template files
  in exactly the same pattern Meridian Health already fails today (`08_it_budget_spend_value.csv`
  vs. required `08_spend_value.csv`, plus the `SA0x` extract files) — this is a pre-existing gap in
  the universal-template migration that this PR neither introduces nor worsens.
- No mutating command was run against any real database. No `--apply` flag was passed to any
  loader or to `tenant-bootstrap.ts`. No Move record was created via any API call.
- **Loader-backed ingestion, no side-load:** `load-internal-golden-setup-data.ts` follows the same
  Admin Data Loader pattern as every other tenant setup-data loader (`load-meridian-setup-data.ts`,
  `load-apex-setup-data.ts`) — it is not a seed side-load. On `--apply` it records an audit trail
  row in `data_ingestion_runs` (status `started` → `completed`/`failed`) exactly like the existing
  loaders, so the ingestion is auditable through the same ledger used for every other tenant.

## Rollout Plan

Standard PR merge to `main` via squash merge. No Azure Container Apps image build/deploy is
required — this PR contains no runtime product-code change, only new tenant configuration, a new
offline setup-data loader script, and new synthetic dataset files. The new tenant becomes
*addressable* (recognized by `tenant-bootstrap.ts`, the governance manifest system, and the tenant
input registry) upon merge, but remains *inert* — no data is loaded into any environment — until a
human explicitly runs the follow-up described in Known Gaps.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable (no ACA/runtime change in this PR)
- Shared runtime mutators: None
- Approved image digest: Not applicable
- ACA runtime invariant: Not applicable
- Worker image invariant: Not applicable
- Feature/env flag update path: Not applicable (no flag; identity via tenant-key registration)
- Live signed-in proof required: No (no product surface changed; nothing to prove live)

## Rollback Plan

Revert this PR. Because no `--apply` run has occurred, there is no data-plane state to unwind —
reverting removes the tenant-key registration, loader, manifest, and dataset files with no
downstream cleanup required.

## Audit Evidence

- This PR's diff (file list above).
- `--dry-run` output of `load-internal-golden-setup-data.ts` (981 records / 570 nodes / 1,125 edges,
  captured during PR preparation).
- `validate:context-corpus:manifests` pass output.
- `check-no-legacy-tenant-inputs.mjs` pass output.
- `release-check.mjs` pass output.

## Known Gaps

- **The real `tenant:bootstrap --tenant internal-golden --apply` run has not been performed.** This
  PR is code/config only; it was prepared in a sandboxed environment with no live Azure/Postgres
  credentials and per policy must not run mutating commands against a real database. A human with
  real data-plane credentials must run this themselves, or dispatch it as a governed ACA data-build
  job per `docs/ops/aca-data-build-job-rule.md` (job name, run id, tenant scope `internal-golden`,
  build version, input source version, idempotency key, Blob proof bundle, validation output,
  quality-gate output, and a follow-up release record are all required by that runbook).
- **The actual Golden Move record does not exist yet.** Once the tenant is bootstrapped, a human (or
  a dispatched job) still needs to create the Golden Move itself and walk it through P0 → P2 with
  real synthetic evidence uploaded and approved across at least two phases, so that cross-phase
  evidence-scoping regression tests have real data to run against — per
  `docs/architecture/MOVES_OPERATING_MODEL.md`'s Golden Move proposal. This PR does not and cannot
  do that from this sandboxed environment.
- The pre-existing `audit:canonical-tenant-inputs` universal-template file-naming mismatch
  (`08_spend_value.csv` / `17_service_scope_managed_services.csv` vs. the actual
  `08_it_budget_spend_value.csv` / `17_managed_services_scope.csv` + `SA0x` extract files) is
  inherited from the Meridian Health pattern this PR mirrors, and is not fixed here — it is a
  pre-existing, non-blocking gap (not part of `release-check.mjs`) affecting every tenant that uses
  this file-naming convention, not something newly introduced by `internal-golden`.
