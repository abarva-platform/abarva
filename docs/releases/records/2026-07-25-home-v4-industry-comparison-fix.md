# 2026-07-25-home-v4-industry-comparison-fix — Calibrated, evidence-grounded industry comparison

## Release ID

`2026-07-25-home-v4-industry-comparison-fix`

## Status

`live-proven` — merged, deployed, and live-verified: skyharbor-air and meridian-health both
render correctly post-deploy with no regression (legacy-shape fallback confirmed working).
Regenerating a tenant against the new calibrated contract remains a separate, scoped follow-up
action, not part of this release.

## Plain-English Summary

Live review of the book-mode `industry_comparison` section (all three canary tenants) surfaced a
real content-quality defect, not a rendering bug: every pattern for meridian-health, and nearly
every pattern for the other two tenants, was scored a flat `BEHIND` in near-identical templated
language ("the industry pattern assumes X... the tenant has Y but not Z"), with no cited benchmark
source. Worse, the same fact was scored two different ways in the same document: meridian-health's
`material_advantages` states *"a working payment-integrity detection capability already exists on
the SAS estate"*, while the matching `industry_comparison` row for that exact capability still read
flatly `BEHIND`, with no acknowledgment of the advantage.

Root-causing this against the actual data (not just the output) found two compounding causes:

1. **The prompt only asked Claude to pick one of ahead/behind/at_parity per pattern** with no
   dimensional breakdown, so a tenant that was genuinely strong in one respect (operational
   capability) and weak in another (governance) had no way to express that as anything but one
   flattened label.
2. **The fact-base payloads Claude actually received were broken.** The `industry_patterns` and
   `metrics_outcomes` fields picked column names (`pattern_name`, `benchmark_range`,
   `baseline_metric`, `target_range`, etc.) that do not exist on either tenant CSV schema in the
   repo (tenants split across two different real schemas: meridian-health's newer
   `record_id`/`context_item` shape and every other tenant's `pattern_name`/`original_row_id`
   shape -- neither matches what was being picked). Claude was receiving fact-base rows with no
   identifiable pattern name and no citable ID, which explains both the generic paraphrased
   pattern titles in the real output and the complete absence of any benchmark citation.

## What changed

1. **Fact-base construction fixed** (`build-home-knowledge-v4-review-pack.mjs`): new
   `buildIndustryFactBase()`/`buildMetricsFactBase()` replace the broken `compactRows()` calls,
   `pick()`-ing across both real tenant CSV schemas and emitting a stable `pattern_id`/`metric_id`
   per row so Claude has something real to cite.
2. **Calibrated, dimensional comparison schema.** `industry_comparison` items now carry
   `overall_position` (`ahead|at_parity|mixed|behind|not_applicable`) derived from an explicit
   `dimensions[]` breakdown (`strategic_intent`, `operational_capability`, `data_foundation`,
   `technology_readiness`, `governance_and_controls`, `measurement_and_value`, `scale_readiness`),
   each independently judged and evidence-backed. `advantage_to_preserve`/`gap_to_close` let one
   pattern hold both a real strength and a real gap at once (the exact shape the payment-integrity
   case needed). `benchmark_refs` must cite a real `pattern_id`.
3. **A real metrics layer, honest about what's not loaded.** `metrics[]` on a pattern reports only
   `baseline_value`/`actual_value`/`target_value` copied verbatim from a real `metrics_fact_base`
   row, with `evidence_status: available|partial|missing` and a required `required_next_step` when
   not available. No prior-period, trend, or confidence field exists in this release -- checked, the
   underlying tenant data model does not capture historical or external-benchmark figures for any
   tenant today (meridian-health has real values on 7 of 257 metric rows; skyharbor-air has 0 of
   124; first-capital has no metrics file at all), so a trend column would render empty everywhere.
   That gap is tracked separately (see Known Gaps), not simulated here.
4. **Deterministic validator, not just a prompt ask** (`validate-integrated-manifest.mjs`,
   `checkIndustryComparison()`): fails a candidate whose `overall_position` doesn't match what its
   own `dimensions[]` imply (this is the mechanical check that catches the real Meridian defect --
   `behind` while a dimension is `ahead`/`at_parity` is invalid, must be `mixed`), whose
   `advantage_to_preserve` coexists with `overall_position: behind` (the exact contradiction
   found), whose `benchmark_refs`/metric `evidence_refs` don't resolve to real fact-base IDs, whose
   dimensional judgment cites no evidence, or whose metric claims `available` while the underlying
   fact-base row has no real value. A stylistic (warn-only) check flags 3+ dimension explanations
   opening with the same six words, catching the templated-narrative pattern in the real output.
   Deliberately does **not** require a spread across positions -- a tenant genuinely behind on every
   evaluated dimension of a pattern still validates as `behind`; the rule only catches a label that
   contradicts what the item's own dimensions/advantage assert.
5. **Renderer**: table-first executive view (pattern / position / existing strength / material gap
   / executive implication), with per-dimension and per-metric detail below, plus a fixed,
   code-owned disclosure paragraph (not Claude-authored, so it can't be paraphrased away) stating
   that quantitative benchmarking is currently limited by incomplete baseline/actual/historical/
   external-benchmark data. Renders the old flat shape for any item without a `dimensions[]` array,
   so the two candidates already approved and live today (skyharbor-air, meridian-health) keep
   rendering correctly, unregressed, until they are regenerated under this contract.

## Layer Impact

- `internal-admin` lane: generator script, validator, and type/renderer changes for a
  human-review-gated candidate surface. No client-data-lane change -- nothing is approved or made
  live by this PR; the renderer change is additive (old shape still renders) and only visibly
  changes anything for a NEW candidate generated after this merges.

## Client Applicability

- Internal only. No tenant's approved content changes as a result of this PR. skyharbor-air and
  meridian-health's currently-live V4 book content is unaffected (same JSON, same legacy-shape
  render path).

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: `buildIndustryFactBase()`,
  `buildMetricsFactBase()` (replacing broken `compactRows()` calls for both fields); rewritten JOB 2
  instruction (calibrated dimensional comparison, reconciliation against material_advantages/gaps,
  real-metric-only rule, anti-templating instruction); rewritten `industry_comparison_shape` and
  `hard_limits` documentation; `metrics_fact_base` added as a new prompt input alongside
  `industry_fact_base`.
- `scripts/knowledge/validate-integrated-manifest.mjs`: new `checkIndustryComparison()` plus the
  `INDUSTRY_COMPARISON_DIMENSIONS`/`METRIC_ALLOWED_KEYS` allow-lists; wired into
  `validateIntegratedManifest()` when `candidate.enterprise_book` is present; call site (the real
  book-mode validation call) now passes `enterprise_book` and the real `industryFactBase`/
  `metricsFactBase` through as options.
- `scripts/knowledge/__fixtures__/integrated-manifest/industry-factbase.json` (new) and 8 new
  candidate fixtures reproducing the real defect shape and the fix's boundaries (flat-behind-
  despite-mixed, advantage-contradiction, missing-benchmark-ref, judgment-without-evidence,
  forbidden-metric-field, metric-fabricated-availability, a clean valid-mixed pass case, and a
  repetitive-phrasing warning case).
- `scripts/knowledge/__tests__/run-integrated-manifest-tests.mjs`: registers the 8 new cases; loads
  and threads `industryFactBase`/`metricsFactBase` through every case (a no-op for fixtures with no
  `enterprise_book`).
- `src/components/home/v4/homeV4Visual.ts`: `HomeV4IndustryComparisonItem` extended with the
  calibrated shape (`overall_position`, `dimensions`, `metrics`, `advantage_to_preserve`,
  `gap_to_close`, `executive_implication`, `benchmark_refs`), legacy fields kept optional.
- `src/components/home/v4/HomeV4BookOverview.tsx`: new `HomeV4IndustryComparisonSection` --
  table-first view + per-pattern detail (dimensions, metrics table) for calibrated items, legacy
  flat-card fallback for items without a `dimensions[]` array, fixed disclosure paragraph.

## QA / Validation

- `pass` — `node --check` and `npx eslint` on all changed `.mjs`/`.ts`/`.tsx` files, exit 0.
- `pass` — `npm run home:knowledge-v4:test-manifest-validator`: 24/24 fixture cases (16 existing +
  8 new), each new fail-case isolated to exactly the one rule it targets, both new pass-cases
  (valid-mixed, repetitive-phrasing-as-warning-only) genuinely clean.
- `pass` — `npm run home:knowledge-v4:test-prompt-preflight`: 6/6, including `real-current-prompt`
  (proves the rewritten prompt text still carries no forbidden fields and all required fields).
- `pass` — Full production `npm run build` (`NODE_OPTIONS=--max-old-space-size=8192`, the default
  heap OOM'd on the unrelated full-project size in this environment -- CI runners are unaffected),
  zero errors; confirmed `/home/v4-preview` is in the route output.
- `pass` — Full-project `tsc --noEmit` with the same expanded heap, zero errors.
- `pass` — Local browser check: confirmed the route compiles and the server returns a real `200`
  for `/home/v4-preview?tenant=meridian-health` (not a 404/500) against a temporary, uncommitted
  local-only fixture patch carrying the new calibrated shape (reverted via `git checkout` before
  finishing, never staged or pushed).
- `pass` — **Live signed-in verification, post-deploy**: PR merged (`71e3088d`), `aca-main-deploy.yml`
  run `30168592967` completed successfully (image build, revision health, traffic shift, ACA
  runtime invariant, and production health endpoint all verified by the workflow itself). Signed-in
  platform-admin confirmed `/home/v4-preview` renders correctly for both skyharbor-air and
  meridian-health with no regression -- the legacy-shape fallback (old flat card, `this_tenant_
  position`/`specifics`) is rendering exactly as it did before this change, for the two candidates
  approved before this fix shipped.

## Rollout Plan

1. `done` — Merge → `aca-main-deploy.yml` built and deployed automatically. No data changes shipped
   with this merge -- the fix only takes effect on the next candidate a tenant generates.
2. `done` — Live signed-in check: confirmed `/home/v4-preview` still renders skyharbor-air and
   meridian-health correctly (legacy-shape fallback, unregressed).
3. `not yet started` — Separate, explicit, scoped action per tenant (not part of this merge):
   regenerate a tenant's candidate against the fixed prompt, retrieve its fresh `industry_comparison`
   via `home:knowledge-v4:inspect-candidate`, and confirm by inspection that positions are genuinely
   differentiated, benchmark_refs resolve, and the payment-integrity-style advantage/gap split
   renders correctly before treating that tenant's candidate as review-ready.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none in this PR. No tenant is regenerated or approved as part of this
  merge.
- Live signed-in proof required: yes — renderer change on an existing admin route. Confirmed (see
  QA / Validation and Rollout Plan step 2).

## Rollback Plan

Revert the PR. The prompt/validator/schema revert to the prior (looser) contract; the renderer
reverts to the old flat card only. No persisted data is affected -- no candidate was generated or
approved under the new contract as part of this change.

## Audit Evidence

- `docs/releases/records/2026-07-25-home-v4-evidence-contract-fix.md` and
  `2026-07-25-home-v4-quality-governance.md` — the prior fixes in this same review chain.
- The real defect (flat `BEHIND` across all seven meridian-health patterns, the payment-integrity
  advantage/comparison contradiction, and the identical templated sentence structure across rows)
  is recorded in the session transcript from direct review of the live `/home/v4-preview` output for
  all three tenants.
- Real data verification: `datasets/tenant-inputs/active/{tenant}/current/14_metrics_outcomes.csv`
  and `15_industry_context_patterns.csv` column inspection across all five active tenants, proving
  the fact-base construction was picking non-existent column names and that no tenant's metrics
  file carries a prior-period/trend column today.

## Known Gaps

- **A real KPI/benchmark data product is not part of this fix and was explicitly descoped.** The
  metrics layer here only surfaces `baseline_value`/`actual_value`/`target_value` where a real
  value already exists in `14_metrics_outcomes.csv` -- it does not add prior-period values, trend
  direction, external benchmark ranges, or confidence ratings, because none of that is loaded for
  any tenant today. A proper KPI catalog (metric definition, business group, current + prior-period
  value with date, target, unit, source, owner, calculation method, confidence, external benchmark
  range + source + date, trend derived from dated observations) is tracked as a separate workstream
  and requires its own dataset manifest under `docs/governance/dataset-manifests/` per the New
  Dataset Onboarding Policy before any loading begins.
- The new calibrated table itself has not yet been seen live -- only the legacy-shape fallback has
  been proven in production, since no tenant has been regenerated under the new contract yet. That
  is Rollout Plan step 3, a separate scoped action.
