# 2026-07-23 — Nexus Pricing Engine PR1: Taxonomy Normalization + Reference Pack

## Release ID

`2026-07-23-pricing-engine-pr1-taxonomy`

## Status

`released`

## Plain-English Summary

This PR builds the first real artifact of the new, independent Nexus Pricing
Engine: a normalized workforce/rate-card taxonomy — towers, capabilities,
canonical roles with seniority ranges, role aliases, seniority levels, priced
rate bands, provider classes, and delivery locations — emitted as a
deterministic, checked-in CSV reference pack under
`datasets/reference/pricing-engine-v1/`. It also adds a coverage validator
(`npm run validate:pricing-role-coverage`) that fails the build on structural
defects (duplicate codes, bad references, inverted level ranges, missing
rates, ambiguous aliases, or falling below the brief's numeric floors).

The seed source is a real, rich workbook
(`Workforce_Taxonomy_Master.xlsx`, not part of this repository — see
"Known Gaps") with 21 towers, 139 capabilities, 321 roles, and 896 priced
role×level rows. During conversion we found and fixed the exact anti-pattern
the original execution brief warned about: three canonical roles ("Data
Engineer", "Data Scientist", "Software Engineer") had been split across
multiple role rows by a seniority word in the *name* ("Lead Data Engineer",
"Senior Data Scientist", "Senior Software Engineer") instead of one canonical
role with an allowed-level range. These were collapsed into one role each,
with the seniority-prefixed names demoted to role aliases — this is the
concrete purpose of the alias mechanism, not just a schema field that exists
in theory.

Three brief-required tower topics (ITSM/Service-Delivery, End-User-Computing/
Workplace, and FinOps/TBM/Value-Management) had no clean seed-tower match;
these were folded as documented sub-scopes of the closest existing towers
(Operations, Infrastructure, Program Management respectively) with a small
number of explicitly hand-authored capabilities/roles, honestly tagged
`source_artifact: "hand-authored-pr1"` — never attributed to the seed
workbook. No new Postgres tables, no UI, no API wiring, and no PR4-scope
objects (effort drivers/rules/activity packs/archetypes/agent costs) were
created — this PR is reference-pack-only, per the brief's PR sequencing.

## Layer Impact

- `internal-admin` lane. This is a new internal reference dataset (CSV files
  + a conversion/validation script pair) with no client-facing runtime
  change. Nothing in `src/app`, `src/components`, or any API route was
  touched. The reference pack is not yet wired into any UI, API, or agent
  context path — that begins in PR3 (context-layer templates + governed
  load) at the earliest.

## Client Applicability

- All clients: no change (no runtime code touched)
- Specific clients: none
- Internal only: yes — this is an internal engineering reference dataset and
  its build/validation tooling
- Public/demo only: no
- Feature flag: none introduced

## Changes Included

- `scripts/pricing/convert-workbook-to-reference-pack.ts` (new) — deterministic
  conversion script; reads the seed workbook (path via CLI arg or
  `PRICING_TAXONOMY_SOURCE_XLSX` env var) and emits the reference pack.
  Recomputes priced rates from the workbook's own disclosed
  Internal-Cost-Model/Assumptions formula chain (the source workbook's
  `Roles`/`Role Rate Card` priced columns are live, never-recalculated Excel
  formulas with no cached values) — cross-checked against a manual Python
  walk of the same formulas during authoring.
- `scripts/pricing/validate-pricing-role-coverage.ts` (new) — pure,
  unit-testable validator (`validateCoverage()`) plus a CLI entry point
  wired to `npm run validate:pricing-role-coverage`.
- `scripts/pricing/csv-utils.ts` (new) — deterministic CSV read/write +
  SHA-256 helpers shared by the two scripts above.
- `scripts/pricing/__tests__/validate-pricing-role-coverage.test.ts` (new) —
  12 Jest tests: the validator run against the real committed CSVs (must
  pass, and must clear the brief's numeric floors), plus 10 synthetic-fixture
  tests proving each individual failure mode fires (duplicate role code,
  invalid tower/capability reference, inverted level range, unknown level
  name, missing rate band, no-default-rate override, ambiguous alias, and
  the three numeric floors).
- `datasets/reference/pricing-engine-v1/` (new) — the reference pack itself:
  `manifest.json` (provenance, checksums, row counts, the full tower-topic
  reconciliation table, the three role-normalization merge decisions with
  rationale, and known gaps) plus 9 CSVs: `pricing_towers.csv` (21),
  `pricing_capabilities.csv` (147, incl. 8 hand-authored),
  `pricing_role_families.csv` (146), `pricing_roles.csv` (326, incl. 9
  hand-authored; 321 seed roles minus 4 merged-away plus 9 hand-authored),
  `pricing_role_aliases.csv` (6), `pricing_seniority_levels.csv` (10),
  `pricing_rate_bands.csv` (908), `pricing_provider_classes.csv` (5),
  `pricing_delivery_locations.csv` (17).
- `package.json` — added `pricing:build-reference-pack` and
  `validate:pricing-role-coverage` npm scripts.

## QA / Validation

- `npm run validate:pricing-role-coverage` — **PASSED** against the committed
  reference pack. Summary: 21 towers, 147 capabilities, 326 roles, 6 aliases,
  908 rate-band rows. Clears all three brief §4.3 floors (220 roles / 18
  towers / 65 capabilities) by a wide margin.
- `npx jest scripts/pricing/__tests__/validate-pricing-role-coverage.test.ts`
  — **12/12 passed.**
- Determinism check (manual, not yet wired into CI): ran the conversion
  script twice against the same source workbook; every emitted CSV was
  byte-identical across runs (only `manifest.json`'s informational
  `generated_at` timestamp differed).
- Scoped TypeScript check (a full-repo `tsc --noEmit` crashes on this
  machine — a known, pre-existing environment issue, not caused by this
  change; see project memory `feedback_typecheck_workflow_artifact`): a
  temporary tsconfig scoped to the 4 new files passed with zero errors.
- `npx eslint scripts/pricing/` — **0 errors, 0 warnings.**
- `node scripts/release-check.mjs --base origin/main --head HEAD` — **passed**
  (see Audit Evidence).
- No database migrations, no API routes, no UI — nothing to smoke-test at
  runtime for this PR.

## Rollout Plan

Merge to `main` via squash-merge PR (stacked on PR0). No deploy, no
migration, no flag flip, no Azure Container Apps involvement — this PR adds
files only (scripts + a generated CSV/JSON dataset). The reference pack is
inert until a future PR reads it.

## Deployment Authority

Not applicable — this release does not touch Azure Container Apps, deploy
workflows, runtime images, feature flags, environment variables, worker
jobs, traffic, or DNS.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: n/a
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: no

## Rollback Plan

Revert the PR. No migration or runtime rollback needed — reverting removes
the new scripts and the `datasets/reference/pricing-engine-v1/` directory
with no other side effects, since nothing downstream reads this pack yet.

## Audit Evidence

- `datasets/reference/pricing-engine-v1/manifest.json` — full provenance
  (source file name + SHA-256, generation script path, per-file row counts
  and SHA-256 checksums, the 20-topic tower reconciliation table, the 3
  role-normalization merge decisions with rationale, hand-authored-addition
  list, and known gaps).
- `npm run validate:pricing-role-coverage` console output (coverage summary
  by tower) — captured in this PR's CI run.
- `npx jest scripts/pricing/__tests__/validate-pricing-role-coverage.test.ts`
  output — 12/12 passed — captured in this PR's CI run.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — captured
  in this PR's CI run.
- PR URL: recorded after PR is opened.

## Known Gaps

- **The seed workbook is not part of this repository.** It lives at a
  machine-specific path (`~/Downloads/Workforce_Taxonomy_Master.xlsx`) and is
  provenance input only, per explicit product decision for this PR (the
  brief's originally-guessed seed filename, `AbarVa_Workforce_Model_v3.xlsx`,
  does not exist on disk). Re-running the conversion script requires the
  source file to be supplied again via CLI arg or
  `PRICING_TAXONOMY_SOURCE_XLSX`; the committed CSVs are the durable
  artifact — the script's job is reproducibility of provenance, not
  guaranteed re-runnability without the source file present.
- **No Postgres persistence yet.** This PR is a reference pack (CSV) only.
  PR2 builds `pricing_rate_cards` / `pricing_rate_card_lines` persistence.
- **Not yet a governed context/corpus object.** Per AGENTS.md's Context &
  Corpus Governance policy, no `docs/governance/dataset-manifests/` entry was
  added in this PR, because this reference pack is not consumed by any agent
  yet (no UI/API/context-broker wiring exists until PR3+). PR3 must add a
  dataset manifest before any agent-facing wiring of this data.
- **`pricing_taxonomy_versions`, `pricing_provider_level_aliases`, and
  `pricing_providers`** (all listed in brief §4.4) were not built in PR1 —
  out of this PR's explicit build scope. Version identity is carried in
  `manifest.json` for now; provider/tenant-scoped objects arrive with PR2.
- **PR4-scope objects were deliberately not created or stubbed**:
  `pricing_effort_drivers`, `pricing_effort_rules`, `pricing_activity_packs`,
  `pricing_archetypes`, `pricing_agent_costs`.
- **The role-coverage validator's rate check is PR1-scoped**: it checks only
  for a direct `pricing_rate_bands.csv` row or an explicit
  `status: "no_default_rate"` flag — the full 6-tier fallback rate resolver
  is PR2/PR5 scope, not implemented here. Ambiguous-alias checking is
  global-scope only (no tenant/provider rate cards exist yet to make
  ambiguity tenant-relative).
- Three tower-reconciliation topics (10 — Infrastructure/telecom/backup-DR,
  11 — Database/Middleware operations, 18 — Program Management/Finance-
  Commercial-Sourcing-Vendor-Management) are accepted as adequate/partial
  coverage without hand-authored additions, per this PR's explicit
  reconciliation policy (only topics 15, 16, and 20 were flagged for
  hand-authoring). A future PR could add finer-grained capabilities here if
  the effort model needs that level of detail.
