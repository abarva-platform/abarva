# Meridian Databricks Enterprise Agreement — renegotiation evidence pack

**Tenant:** `meridian-health` · **Contract ID:** `MER-TECH-DBX-001` · **Dataset version:** `meridian-databricks-enterprise-agreement-v1-20260908`
**Classification:** `synthetic_demo_only_not_client_truth` — every dollar figure, date, and name in this package is illustrative. Nothing here is a real Databricks transaction, invoice, or usage extract. See the governance manifest at `docs/governance/dataset-manifests/meridian-databricks-enterprise-agreement-v1-20260908.json`.

## 1. What this is

A synthetic vendor-contract case file for a Databricks consumption-commit agreement Meridian Health's prior administration signed (Oct 15, 2025, 5-year, $7,750,000 committed), built to mirror the same structural pattern used for the Cognizant LAAMS managed-services case (`MER-TECH-LAAMS-001`) but for a *consumption-commit* archetype instead of a *staffing/managed-services* archetype. The story: the deal is mediocre, actual consumption is running at ~4.3% of the committed rate (a single non-production pilot is the only live workload), and a second, identical $1,891,000 payment auto-renews October 14, 2026 unless the terms are renegotiated first. This is a `negotiable_improvement` case for Source/Optimize, not a `recoverable_leakage` or `avoided_cost` case — there is no vendor underperformance here (SLA is met throughout); the problem is purely that the commercial terms are mis-sized to the program's actual delivery pace.

Six governed page-text rows are included in `contract_page_text.csv`, one for each evidence manifest entry. They are synthetic, reviewed summaries for demo rendering and citation wiring; they are not the original PDF binaries and must never be represented as client documents. The manifest keeps the source-file identities and evidence boundaries explicit.

## 2. Source files (`source-files/`)

20 CSVs, all keyed to `tenant_key=meridian-health`, `dataset_version=meridian-databricks-enterprise-agreement-v1-20260908`, `contract_id=MER-TECH-DBX-001`:

`contracts.csv` · `contract_clauses.csv` · `contract_page_text.csv` · `cmdb_applications.csv` · `cmdb_application_scope.csv` · `monthly_spend.csv` (12 months) · `saas_usage.csv` · `sla_performance.csv` · `ticket_volumetrics.csv` · `evidence_manifest.csv` · `optimization_opportunities.csv` · `resource_model.csv` (deliberately empty — this is not a staffing engagement) · `pricing_bridge.csv` · `invoice_line_detail.csv` (12 months, mirrors monthly_spend as prepaid-pool drawdown) · `batch_job_volumetrics.csv` · `change_orders.csv` · `qbr_scorecards.csv`

Plus two files beyond the current adapter's schema — see Section 4 below:

`negotiation_findings.csv` · `negotiation_levers.csv`

## 3. Loading it — verified locally, real job still required

**Step already done, verified live (not just claimed):** the Layer-2-adapter and Layer-3-ish projection preview was run against this exact package and passed both quality gates on 2026-09-08:

```bash
npx tsx scripts/source/project-contract-depth-package.ts \
  --package-dir=datasets/source/contract-depth/meridian-databricks-enterprise-agreement-v1-20260908 \
  --out-dir=datasets/source/contract-depth/meridian-databricks-enterprise-agreement-v1-20260908/qa/layer-projection-preview \
  --adapter-out-dir=datasets/source/contract-depth/meridian-databricks-enterprise-agreement-v1-20260908/qa/layer-2-adapter-preview
```

Both `adapterQualityGate.status` and `qualityGate.status` came back `PASS` with zero failures. The captured output is checked in under `qa/` in this same directory as proof. **This script is a local preview only** — it writes JSON projections to disk for inspection, it does not write to Postgres, does not touch Layer 3/4, and does not go through Tower. Re-run it after any edit to the source CSVs before trusting the next step.

**Real load, per `docs/ops/aca-data-build-job-rule.md`:** this package must go through an Azure Container Apps Job, the same way `meridian-legacy-analytics-managed-services-v1-20260907` (the Cognizant LAAMS package) did — Layer 2 apply → Layer 2/3 verify precheck → Layer 3 apply → Layer 2/3 verify → Layer 4 apply → Layer 4 verify → Tower bridge verify. Do not wire this package into Source, Optimize, or Tower via a direct product-code read of these CSVs or the `qa/` preview JSON — those are for local sanity-checking only. Do not use `az containerapp exec` for the actual mutating load; it needs to be the Job path.

**Before you build the job invocation**, check whether `origin/main` (this branch is currently 1,818 commits behind it) already carries a more current loader — the LAAMS package on `origin/main` was loaded via `scripts/source/load-contract-depth-package.ts` and `scripts/source/project-contract-depth-package-layer4.ts`, which do not exist on this branch; this branch instead has `scripts/source/project-contract-depth-package.ts` (preview-only, used above) and the adapter/projection modules in `src/lib/source/contract-depth-package/`. Reconcile which loader actually applies before invoking a job — don't assume the LAAMS job's exact env-var contract carries over unchanged.

## 4. `negotiation_findings.csv` / `negotiation_levers.csv` — governed Optimize inputs

These files are loaded into Layer 2 and linked to the corresponding optimization opportunity payload at Layer 3. This makes the negotiation levers rich, structured data rather than prose that only exists in a document. They are modeled on two real types already in the codebase:

- `negotiation_findings.csv` mirrors `ContractOptimizationFinding` (`src/lib/source/contract-optimization/types.ts`): `finding_id`, `category`, `severity`, `current_state`, `sourcing_implication`, `recommended_action`, `estimated_annual_impact_usd`, `confidence`.
- `negotiation_levers.csv` mirrors `ContractOptimizationLever` (same file): `lever_id`, `lever_type`, `finding_id`, `buyer_ask`, `negotiation_language`, `value_basis`, `annual_impact_low_usd`/`annual_impact_high_usd`, `owner_role`, `priority` — plus `current_term`/`target_term`/`timing_dependency`/`risk_if_ignored`, which the existing type doesn't have yet but the data clearly wants.

**`lever_type` needs new enum values.** The existing `ContractOptimizationLever.leverType` union (`recover_invoice_leakage`, `tighten_service_credit_economics`, `reprice_staffing_coverage`, `convert_change_orders_to_catalog`, `force_productivity_commitment`, `use_renewal_window`) was built for the managed-services/staffing archetype and doesn't fit a consumption-commit contract. This package's four levers use new type strings — `retime_commitment_to_delivery_pace`, `reprice_support_to_consumption`, `add_carry_forward_provision`, `route_via_aws_marketplace_private_offer` — that should be added to the union (or the union should be widened to a less contract-archetype-specific set) before this data is surfaced through the same UI panel as the LAAMS case (`ContractOptimizationProfilePanel.tsx`).

**Separately**, `src/lib/intelligence/seed-types.ts` has a static `NegotiationLever` shape (`lever`, `whenToUse`, `buyerAsk`, `vendorGive`, `tradeoffs`, `evidenceBasis`) used for category-level sourcing playbooks in `src/lib/intelligence/seed-patterns-sourcing-categories.ts`. That file already has Databricks-adjacent lakehouse/MLOps patterns but no Databricks Enterprise Agreement / DBU-commit pattern. The four levers here would also make a good seed pattern entry there, generalized away from this specific contract instance — worth doing once this case is proven out, not before.

## 5. The negotiation itself — sequencing guidance

Four levers, ranked and sequenced (not all four at once):

1. **Lead with the carry-forward ask (L-03, P0).** It's a scheduling fix, not a price cut — costs Databricks nothing, and it's the largest single dollar exposure ($150K–$400K) because it's about to become irreversible on Oct 14. Open here; it's the easiest yes.
2. **Then the commitment ramp (L-01, P0).** This is the real structural fix — tie the Annual Commitment to the program's actual milestones (per the QBR-documented delay) instead of a flat number. Largest total impact ($350K–$620K).
3. **Then support re-pricing (L-02, P0).** Base it on ticket volume and consumed spend, evidenced by `ticket_volumetrics.csv` (4 tickets/quarter) against a $341K/yr fee. Land this alongside the commitment ramp, not before it — the ramp changes the base the support percentage applies to.
4. **Close on AWS Marketplace routing (L-04, P2).** No deadline, structural only, easy to agree to last — good note to end the conversation on.

**Do not reopen:** the 9% Platform Services discount rate or the 5-year term length. Neither is the actual problem (the discount is roughly market for this deal size; the term isn't what's causing the overpayment), and reopening them risks trading away the two things Databricks would extract concessions for in return. The problem is entirely in *how the commitment is timed and priced against real consumption*, not in the headline rate — keep the ask there.

**Anchor everything to October 14, 2026.** That's the forcing function: it's when the current Year 1 headroom forfeits and Year 2's identical payment locks in. Every lever above should reference that date explicitly in the room.

## 6. Reconciliation — do not skip

Per `AGENTS.md`: run `node scripts/tower/fact-lineage-report.mjs` for the `meridian-health` tenant after any real Layer 3/4 load, before quoting any number from this package in a Tower-facing surface. Confirm the loaded figures agree across Source and Tower before either is used in a client-facing view — if the report shows `CONFLICT` for any metric this package touches (committed spend, actual spend, opportunity amounts), do not surface that number until resolved.
