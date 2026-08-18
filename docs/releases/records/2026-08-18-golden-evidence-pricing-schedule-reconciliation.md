# 2026-08-18-golden-evidence-pricing-schedule-reconciliation — CTR-061 Pricing Schedule Reconciled to Stated Annual Value

## Release ID

`2026-08-18-golden-evidence-pricing-schedule-reconciliation`

## Status

`candidate`

## Plain-English Summary

Once CTR-061 became selectable in the live Optimize Contract workflow (see
`2026-08-18-skyharbor-layer-cube-configurable-load-run-id`), the product's own baseline-conflict check
correctly refused to let the case proceed: `source.golden_contract_pricing_schedule`'s five line items
for CTR-061 summed to $45,800,000, while the contract's own stated annual value (`contract_overview.csv`,
carried into `source.contract`) is $35,800,000 — a $10,000,000 gap.

Comparing against the sibling contract (CTR-090's five pricing lines already sum exactly to its stated
$43,500,000 — no gap) and against the golden packet's own narrative math (`story/contract_fact_based_talk_track.csv`
states a "$7.51M" contract-to-actual variance for CTR-061, which only equals $35,800,000 −
$28,289,093; it does not reconcile against $45,800,000) isolates the error to a single line: the
`MS-AZ-COMMIT` ("Northgate Cloud committed consumption") line was $17,200,000. Reducing it to
$7,200,000 makes the five lines sum to exactly $35,800,000, with no other change. This is a correction
of an existing line item to match the figure the rest of the package was already built around, not the
introduction of a new number.

The corresponding line in `documents/CTR-061_Northgate_Executed_Agreement_SYNTHETIC.pdf`'s Exhibit A
(added in `2026-08-18-golden-evidence-story-contract-document-depth`) is updated to match.

## Layer Impact

- Release lane: `client-data-lane`
- Products: Source (Optimize Contract baseline-lock gate) for the synthetic demo airline tenant only.
- Canonical model: No schema/migration change. One CSV cell and its downstream PDF regeneration.

## Client Applicability

- All clients: No.
- Specific clients: The synthetic demo airline tenant's Source contract-evidence data plane.
- Internal only: Yes — operator-run ACA Job re-load.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `datasets/source/contract-intelligence/skyharbor-golden-20260808/synthetic/contract_pricing_schedule.csv`
  — `CTR-061-LINE-01` (`MS-AZ-COMMIT`) `unit_price_usd`/`annual_value_usd` corrected from `17200000` to
  `7200000`.
- `datasets/source/contract-intelligence/skyharbor-golden-20260808/synthetic/contract_pdf_page_text.csv`
  — CTR-061's Exhibit A page updated to match.
- `datasets/source/contract-intelligence/skyharbor-golden-20260808/synthetic/contract_pdf_document_inventory.csv`
  — `source_file_sha256` re-synced for both CTR-061 and CTR-090 PDFs (regeneration re-stamps a creation
  timestamp even for unchanged content, changing CTR-090's file hash too).
- `datasets/source/contract-intelligence/skyharbor-golden-20260808/documents/CTR-061_Northgate_Executed_Agreement_SYNTHETIC.pdf`
  and `.../CTR-090_Vantage_Executed_Agreement_SYNTHETIC.pdf` — regenerated.

## QA / Validation

- Arithmetic check: `7,200,000 + 19,577,880 + 2,444,400 + 843,600 + 5,734,120 = 35,800,000` — exact
  match to the stated annual value.
- Cross-check: CTR-090's five pricing lines already summed correctly to its stated $43,500,000 with no
  change needed, confirming this was an isolated single-line error, not a systemic packet issue.
- Cross-check: the packet's own talk track states a "$7.51M" contract-to-actual variance for CTR-061,
  which equals $35,800,000 − $28,289,093 exactly and only reconciles against the corrected figure.
- Full-packet parse check (all 18 CSVs): 0 errors, 1,792 rows (unchanged from the prior document-depth
  record — this change edits cell values, not row counts).
- `pdftotext` on the regenerated Exhibit A page confirms `$7,200,000` renders correctly.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new
image. Re-run the golden-evidence loader (`source:contract-evidence:golden:apply`) as an ACA Job to pick
up the corrected pricing-schedule row; its existing delete-before-insert step (already fixed in
`2026-08-18-golden-evidence-loader-alias-scoped-retag`) replaces the prior row cleanly.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Verify template image, 100% traffic revision image match the deployed digest
  before re-running the operator job.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — confirm the baseline-conflict gate clears for CTR-061 in the
  live Optimize Contract workflow.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest. Re-running the loader
against the reverted packet restores the prior (conflicting) pricing-schedule row.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- ACA operator job execution log showing the reload.
- Live read of the Optimize Contract workflow showing the baseline-conflict gate cleared for CTR-061.

## Known Gaps

- `synthetic/invoice_lines.csv` has a separate, unrelated reference field (`matched_contract_rate_usd`,
  `billed_rate_usd`) that also carries the old `$17,200,000` figure on 20 monthly rows for the same SKU.
  This field is not summed into any reconciliation total this record depends on, and none of the
  existing `exception_amount_usd` values are derived from it by a simple subtraction against it — so it
  is left unchanged rather than risk perturbing the already-published, already-cited recoverable-leakage
  figures. If this field is ever surfaced directly in a product view, it will still read $17,200,000 and
  should be revisited then.
