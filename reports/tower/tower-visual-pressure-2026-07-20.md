# Tower Visual Pressure Test

Generated: 2026-07-20T15:27:46.807Z
Target: https://app.abarva.ai
Storage state: /Users/anand/Projects/nexus/.auth/agent-skyharbor.json

## Summary

- Total prompts: 45
- Pass / watch / fail: 22 / 18 / 5
- Average score: 93/100
- Visual intent accuracy: 78%
- Renderer success rate: 100%
- Data integrity rate: 100%

## Category Rollup

| Category | Total | Pass | Watch | Fail | Avg score |
|---|---:|---:|---:|---:|---:|
| natural-language-variation | 21 | 12 | 5 | 4 | 95 |
| imperfect-evidence | 10 | 6 | 4 | 0 | 95 |
| large-portfolio | 2 | 1 | 1 | 0 | 84 |
| sparse-portfolio | 2 | 0 | 2 | 0 | 89 |
| visual-consistency | 3 | 2 | 1 | 0 | 96 |
| streaming | 2 | 1 | 0 | 1 | 95 |
| scope-boundary | 3 | 0 | 3 | 0 | 89 |
| executive-usefulness | 2 | 0 | 2 | 0 | 89 |

## Prompt Results

| ID | Category | Verdict | Score | Expected visual | Selected visual | Posture | Tables | Latency ms | Findings |
|---|---|---|---:|---|---|---|---:|---:|---|
| q01-prioritize-2x2-direct | natural-language-variation | WATCH | 89 | 2x2 | 2x2 | visual | 1 | 31199 | executiveUseful |
| q02-prioritize-map-portfolio | natural-language-variation | FAIL | 89 | 2x2 | heatmap | visual | 1 | 33750 | intentMatched |
| q03-prioritize-show-visually | natural-language-variation | PASS | 100 | 2x2 | 2x2 | visual | 1 | 24356 | - |
| q04-prioritize-funding-bets | natural-language-variation | FAIL | 89 | 2x2 | heatmap | visual | 1 | 28891 | intentMatched |
| q05-prioritize-board-lens | natural-language-variation | FAIL | 78 | 2x2 | heatmap | visual | 2 | 40495 | intentMatched, executiveUseful |
| q06-value-bridge-direct | natural-language-variation | PASS | 100 | waterfall | waterfall | visual | 1 | 27089 | - |
| q07-value-bridge-plot | natural-language-variation | PASS | 100 | waterfall | waterfall | visual | 1 | 27853 | - |
| q08-value-leakage | natural-language-variation | FAIL | 89 | waterfall | 2x2 | visual | 1 | 32870 | intentMatched |
| q09-value-funnel | natural-language-variation | PASS | 100 | waterfall | waterfall | visual | 1 | 29302 | - |
| q10-value-cfo-safe | imperfect-evidence | PASS | 100 | waterfall | waterfall | caveated | 1 | 31272 | - |
| q11-trend-run-change | natural-language-variation | PASS | 100 | line | line | visual | 2 | 29157 | - |
| q12-trend-period-confidence | imperfect-evidence | PASS | 100 | line | line | caveated | 2 | 23346 | - |
| q13-trend-quarterly | natural-language-variation | PASS | 100 | line | line | visual | 3 | 28170 | - |
| q14-trend-change | natural-language-variation | PASS | 100 | line | line | visual | 2 | 28539 | - |
| q15-trend-units-conflict | imperfect-evidence | WATCH | 89 | line / table | line | caveated | 3 | 34445 | executiveUseful |
| q16-vendor-concentration | natural-language-variation | WATCH | 89 | treemap | treemap | visual | 2 | 29905 | executiveUseful |
| q17-vendor-cost-drivers | natural-language-variation | PASS | 100 | treemap | treemap | visual | 1 | 29024 | - |
| q18-vendor-renewals | imperfect-evidence | PASS | 100 | treemap | treemap | caveated | 1 | 21632 | - |
| q19-vendor-tower-exposure | natural-language-variation | WATCH | 89 | treemap | treemap | visual | 2 | 28889 | executiveUseful |
| q20-vendor-other-bucket | large-portfolio | PASS | 100 | treemap / horizontal_bar | treemap | caveated | 1 | 21343 | - |
| q21-risk-heatmap | natural-language-variation | WATCH | 89 | heatmap | heatmap | visual | 1 | 30272 | executiveUseful |
| q22-risk-control | natural-language-variation | PASS | 100 | heatmap | heatmap | visual | 1 | 30264 | - |
| q23-risk-board-confidence | imperfect-evidence | PASS | 100 | heatmap | heatmap | caveated | 1 | 26500 | - |
| q24-risk-sparse | sparse-portfolio | WATCH | 89 | heatmap / table | heatmap | caveated | 1 | 33584 | executiveUseful |
| q25-risk-projection-mix | imperfect-evidence | PASS | 100 | heatmap / waterfall | heatmap | caveated | 1 | 29101 | - |
| q26-distribution-investments | natural-language-variation | PASS | 100 | stacked_bar | stacked_bar | visual | 2 | 31789 | - |
| q27-distribution-spend-mix | natural-language-variation | PASS | 100 | stacked_bar | stacked_bar | visual | 2 | 24940 | - |
| q28-distribution-non-additive | imperfect-evidence | WATCH | 89 | stacked_bar / table | horizontal_bar | caveated | 1 | 23579 | intentMatched |
| q29-compare-top | natural-language-variation | PASS | 100 | horizontal_bar | horizontal_bar | visual | 1 | 22805 | - |
| q30-compare-outliers | natural-language-variation | WATCH | 89 | horizontal_bar | horizontal_bar | visual | 1 | 29338 | executiveUseful |
| q31-validate-missing-axis | imperfect-evidence | PASS | 100 | table / heatmap / 2x2 | table | validate | 1 | 20325 | - |
| q32-validate-conflicting-units | imperfect-evidence | WATCH | 89 | table / line / horizontal_bar | heatmap | validate | 1 | 20864 | intentMatched |
| q33-validate-no-chart | imperfect-evidence | WATCH | 78 | table / heatmap | table | validate | 1 | 21122 | fallbackPosture, executiveUseful |
| q34-validate-empty-program | sparse-portfolio | WATCH | 89 | table / heatmap / horizontal_bar | table | validate | 1 | 21049 | fallbackPosture |
| q35-validate-large-portfolio | large-portfolio | WATCH | 67 | treemap / horizontal_bar / table | 2x2 | caveated | 1 | 37088 | intentMatched, fallbackPosture, executiveUseful |
| q36-export-consistency | visual-consistency | WATCH | 89 | 2x2 / table / horizontal_bar | 2x2 | visual | 1 | 26209 | executiveUseful |
| q37-answer-table-chart-consistency | visual-consistency | PASS | 100 | waterfall / table | waterfall | caveated | 1 | 26449 | - |
| q38-followup-visual | visual-consistency | PASS | 100 | heatmap / table | heatmap | caveated | 1 | 23960 | - |
| q39-business-readable-stream | streaming | FAIL | 89 | 2x2 / table | heatmap | visual | 1 | 26624 | intentMatched |
| q40-stream-value-proof | streaming | PASS | 100 | waterfall | waterfall | caveated | 2 | 27937 | - |
| q41-scope-out-of-bounds | scope-boundary | WATCH | 89 | table / heatmap / horizontal_bar | treemap | validate | 1 | 22750 | intentMatched |
| q42-source-handoff | scope-boundary | WATCH | 89 | table / treemap / heatmap | treemap | validate | 1 | 27700 | executiveUseful |
| q43-moves-handoff | scope-boundary | WATCH | 89 | table / 2x2 / heatmap | heatmap | caveated | 1 | 29999 | executiveUseful |
| q44-board-story | executive-usefulness | WATCH | 89 | waterfall / heatmap / table | waterfall | caveated | 2 | 29661 | executiveUseful |
| q45-cfo-challenge | executive-usefulness | WATCH | 89 | waterfall / table | heatmap | caveated | 1 | 30720 | intentMatched |

## Failed / Watch Details

### q01-prioritize-2x2-direct — WATCH

Prompt: Which AI bets are high value but not ready yet? Map the portfolio into a 2x2 and tell me what the CIO should fund now versus gate.

Expected: 2x2 · selected: 2x2 · posture: visual

Findings: executiveUseful

Response excerpt:

```text
This is a run-cost pressure question, not a value-realization win yet. In the Airline Demo synthetic Tower planning context, $2.6B of FY26 technology budget is in view, and the mix is the point: $1.4B is run versus $1.1B change. I would use this as a budget-control conversation until finance-attested measurement readiness is complete.

**Tower dashboard values**

| Measure | Value |
| --- | --- |
| Total technology budget | $2.6B |
| Run budget | $1.4B |
| Change budget | $1.1B |
| Funded initiatives | $1.0B |
| Promised value | $3.4B |
```

### q02-prioritize-map-portfolio — FAIL

Prompt: Map the AI portfolio by business value and execution readiness. Which items are first-wave, strategic-but-gated, watch, or stop?

Expected: 2x2 · selected: heatmap · posture: visual

Findings: intentMatched

Response excerpt:

```text
The value story is promising, but it is not outcome-proof yet. In the Airline Demo synthetic Tower planning context, Tower shows $3.4B promised value against $432.0M attestation-pending measurement evidence. I would inspect the largest promise-to-measurement gaps before approving more funding.

**Tower dashboard values**

| Measure | Value |
| --- | --- |
| Total technology budget | $2.6B |
| Run budget | $1.4B |
| Change budget | $1.1B |
| Funded initiatives | $1.0B |
| Promised value | $3.4B |
```

### q04-prioritize-funding-bets — FAIL

Prompt: If we can only fund three AI moves, which bets have the best value-to-readiness profile and which ones need proof first?

Expected: 2x2 · selected: heatmap · posture: visual

Findings: intentMatched

Response excerpt:

```text
Three AI bets stand out on a value-to-readiness basis, but two of them need a proof gate cleared before you commit full funding.

The strongest fund-now case is the IROPS Agentic Recovery Cockpit. It carries $270M in planned benefit, Teradata is already a confirmed supplier, and the FY25 baseline ($97.2M at medium confidence) gives you a prior-period anchor that most other AI programs lack. Operational disruption cost is the most measurable value driver in aviation, which means the measurement gate here is the most credible of the three. Posture: Scale — but tie the next tranche to a finance-attested baseline against that FY25 figure.

The second fund-now bet is the Mainframe API and Event Bridge. At $310M planned benefit and an internal supply model, this is the highest-value program in the portfolio with no external vendor dependency risk. The FY25 baseline ($111.6M, medium confidence) exists. The risk is that 'internal supplies' means no third-party accountability — execution discipline and architecture ownership need to be named explicitly before you scale. Posture: Scale with a named internal owner and a 90-day delivery milestone gate.

The third slot is contested. The Enterpr
```

### q05-prioritize-board-lens — FAIL

Prompt: Give me the board version of AI portfolio prioritization: high value, low readiness, high readiness, low value, and what to do about each.

Expected: 2x2 · selected: heatmap · posture: visual

Findings: intentMatched, executiveUseful

Response excerpt:

```text
The AI portfolio splits cleanly into four board postures based on forecast value and readiness signals loaded in Tower. Here is the executive read and the action for each quadrant.

**High Value / High Readiness → Scale**
Mainframe API and Event Bridge ($310M forecast) and IROPS Agentic Recovery Cockpit ($270M forecast) are the two programs with both the largest planned benefit and the strongest supply-chain confidence (internal and Teradata respectively). Both carry FY25 baseline figures that confirm continuity of investment. These are the programs to protect in any budget compression scenario and to accelerate toward the finance-attestation gate. The board should demand a measurement readiness date, not another forecast update.

**High Value / Lower Readiness → Fix**
Enterprise CDP Selection and Identity Graph ($210M, SAP + Salesforce supply chain) and Delta-style Digital Concierge ($180M, SAS + Teradata) carry high forecast value but depend on multi-vendor integration that introduces execution risk. SAP Finance Close ($186M) sits in the same band. These programs are strategically sound but the value is outcome-proof pending. The fix action is to assign a single accountable owner
```

### q08-value-leakage — FAIL

Prompt: Where are we losing AI value between the business case, funding, execution, measurement, and finance attestation?

Expected: waterfall · selected: 2x2 · posture: visual

Findings: intentMatched

Response excerpt:

```text
The value story is promising, but it is not outcome-proof yet. In the Airline Demo synthetic Tower planning context, Tower shows $3.4B promised value against $432.0M attestation-pending measurement evidence. I would inspect the largest promise-to-measurement gaps before approving more funding.

**Tower dashboard values**

| Measure | Value |
| --- | --- |
| Total technology budget | $2.6B |
| Run budget | $1.4B |
| Change budget | $1.1B |
| Funded initiatives | $1.0B |
| Promised value | $3.4B |
```

### q15-trend-units-conflict — WATCH

Prompt: Compare trend lines for budget dollars, adoption percentage, and evidence confidence. If the units conflict, explain the boundary.

Expected: line / table · selected: line · posture: caveated

Findings: executiveUseful

Response excerpt:

```text
Three metrics are in scope — total IT budget dollars, adoption percentage, and evidence confidence — but only budget dollars have governed period values loaded in Tower. The other two cannot be trended without introducing data that does not exist in the governed record.

Budget trend (what Tower can show): Total IT spend moves from $2.4B in FY25 (finance-attestation pending) to $2.6B in FY26 (committed), an $200M increase. YTD actual spend stands at $539.3M, also finance-attestation pending. The FY26 envelope breaks into three committed buckets: $1.4B run, $1.1B change, and $1.0B initiative. At the domain level, every major platform grew year-over-year — Crew/Flight/Airport/MRO from a mid-$200M range to $422M, IBM Z/Mainframe from $353M to $386M, AWS from $254M to $278M, and AI/Agentic from $227M to $248M. The direction is consistent: spend is expanding, not contracting.

Unit boundary — adoption percentage: Tower does not carry a governed adoption percentage metric for any period. No FY25 or FY26 adoption rate is loaded. Trending this line would require a governed utilization or active-user measure by period, which is not present in the current context package.

Unit boundary — ev
```

### q16-vendor-concentration — WATCH

Prompt: Where is spend concentration highest across vendors, platforms, or towers? Show the concentration visually.

Expected: treemap · selected: treemap · posture: visual

Findings: executiveUseful

Response excerpt:

```text
Spend concentration is highest in the top five initiative value pools, which together account for the majority of the $1.0B FY26 initiative budget and $3.4B in forecast value commitment. The clearest concentration risk sits in three areas: Mainframe API and Event Bridge ($310M forecast value, internally supplied), IROPS Agentic Recovery Cockpit ($270M, Teradata-dependent), and Enterprise CDP ($210M, split across SAP and Salesforce). These three programs alone represent roughly $790M in planned benefit against a single fiscal year, with no finance-attested baseline yet reconciled — meaning the concentration is real but the value evidence is still at the planning gate.

From a vendor dependency standpoint, Teradata carries the heaviest cross-program exposure: it supplies both the IROPS Agentic Recovery Cockpit and the Delta-style Digital Concierge, and separately supports the Irregular Operations hub. That makes Teradata a single point of commercial and execution risk across at least $450M in combined forecast value. SAP and Salesforce each appear in multiple program relationships (SAP in CDP and HR; Salesforce in CDP and Parts), creating a second tier of concentration that warrants 
```

### q19-vendor-tower-exposure — WATCH

Prompt: Show me which towers or suppliers dominate AI spend exposure and value risk.

Expected: treemap · selected: treemap · posture: visual

Findings: executiveUseful

Response excerpt:

```text
The highest AI spend exposure and value risk sits in a small cluster of programs and suppliers — and the concentration is significant enough to warrant immediate commercial and governance attention.

By forecast value at stake, the top five programs account for over $1.1B of the $3.4B FY26 forecast commitment: Mainframe API and Event Bridge ($310M), IROPS Agentic Recovery Cockpit ($270M), Enterprise CDP Selection and Identity Graph ($210M), SAP Finance Close and Procurement Modernization ($186M), and Delta-style Digital Concierge ($180M). These are not small bets — each one individually exceeds what most airlines spend on a full platform modernization cycle.

On the supplier side, Teradata carries the heaviest cross-program exposure: it supplies both the IROPS Agentic Recovery Cockpit ($270M forecast) and the Delta-style Digital Concierge ($180M forecast), and separately supports the Irregular Operations hub. That is a single vendor sitting across $450M+ in planned benefit — with no finance-attested baseline to validate whether that value is achievable. Salesforce and SAP each anchor the Enterprise CDP program ($210M), creating a dual-supplier dependency at a critical data and iden
```

### q21-risk-heatmap — WATCH

Prompt: Create a risk and evidence heatmap. Which AI investments are unhealthy, blocked, or missing proof?

Expected: heatmap · selected: heatmap · posture: visual

Findings: executiveUseful

Response excerpt:

```text
The AI and modernization portfolio carries a systemic proof gap that affects every program on the board. All forecast values — including the top-ranked programs — are planning-grade only, finance-attestation is pending across the portfolio, and outcome-proof language is blocked until a finance-attested baseline and actuals reconciliation is completed. That is not a program-level failure; it is a portfolio-level measurement control gap that leadership must close before any of these programs can be defended at a board or investment committee.

The heatmap below scores each program on two dimensions loaded from Tower: evidence readiness (how close the program is to clearing the finance-attestation gate) and forecast value at risk (the dollar exposure if the gate stays blocked). No program currently holds a green evidence status — every entry sits at finance-attestation pending or forecast/planning. The practical risk tiers are:

**Red — Freeze or Fix immediately.** IROPS Agentic Recovery Cockpit ($270M forecast) and Delta-style Digital Concierge ($180M forecast) carry the highest combination of AI execution complexity and zero outcome proof. Both depend on Teradata as a supply relatio
```

### q24-risk-sparse — WATCH

Prompt: If this portfolio is sparse, what can Tower safely show about unhealthy areas, and what should remain a validate-next item?

Expected: heatmap / table · selected: heatmap · posture: caveated

Findings: executiveUseful

Response excerpt:

```text
The portfolio is sparse in one specific way: every program value figure is forecast/planning grade, and the $432M YTD value figure is finance-attestation pending. That means Tower can safely surface structural risk signals — confidence levels, attestation gates, and vendor dependency patterns — but cannot rank programs by realized performance or confirm that any forecast benefit has been earned.

What Tower can safely show:

- Forecast value concentration is a governed fact. Three programs — Mainframe API and Event Bridge ($310M), IROPS Agentic Recovery Cockpit ($270M), and Enterprise CDP Selection and Identity Graph ($210M) — account for roughly $790M of the $3.4B forecast. If any of these stalls, portfolio-level forecast integrity is immediately at risk.
- Vendor dependency is a governed relationship. Teradata is a supply-side dependency for both IROPS Agentic Recovery Cockpit and Delta-style Digital Concierge. SAP and Salesforce jointly underpin Enterprise CDP. These are concentration risks Tower can name with confidence.
- Attestation gap is a governed measure. The $432M YTD value figure is finance-attestation pending. Until that gate clears, no program-level benefit claim can 
```

### q28-distribution-non-additive — WATCH

Prompt: Compare AI-tagged spend, program budget, and total IT budget, but make clear if the AI lens is non-additive.

Expected: stacked_bar / table · selected: horizontal_bar · posture: caveated

Findings: intentMatched

Response excerpt:

```text
The AI lens is non-additive. The AI and agentic portfolio ($248M FY26, committed) is a named program within the $2.6B total IT budget — it is not a separate or additive figure. Treating it as incremental would double-count spend that is already inside the total.

Here is how the three layers stack:

- Total IT budget FY26: $2.6B (committed), up from a $2.4B FY25 baseline (finance-attestation pending).
- Program budget — change + initiative combined: $1.1B change + $1.0B initiative = $2.1B in forward-investment budget, sitting inside the $2.6B envelope alongside the $1.4B run budget. Note that run + change + initiative arithmetic exceeds $2.6B, which signals these buckets overlap or are categorized differently in the source model; leadership should not sum them independently without a reconciliation view.
- AI and agentic portfolio: $248M FY26 (committed), up from $226.9M FY25 (finance-attestation pending). This is roughly 9.5 cents of every FY26 IT dollar — a meaningful but not dominant share.

The management implication is straightforward: AI spend is real and growing, but it is embedded in the broader portfolio, not ring-fenced. That means AI value accountability is diffuse. If t
```

### q30-compare-outliers — WATCH

Prompt: Which measures are the biggest outliers, and what should the CIO inspect first?

Expected: horizontal_bar · selected: horizontal_bar · posture: visual

Findings: executiveUseful

Response excerpt:

```text
This is a run-cost pressure question, not a value-realization win yet. In the Airline Demo synthetic Tower planning context, $2.6B of FY26 technology budget is in view, and the mix is the point: $1.4B is run versus $1.1B change. I would use this as a budget-control conversation until finance-attested measurement readiness is complete.

**Tower dashboard values**

| Measure | Value |
| --- | --- |
| Total technology budget | $2.6B |
| Run budget | $1.4B |
| Change budget | $1.1B |
| Funded initiatives | $1.0B |
| Promised value | $3.4B |
```

### q32-validate-conflicting-units — WATCH

Prompt: Overlay dollars, percentage adoption, and evidence confidence in one chart. If that would mislead, tell me the safer visual approach.

Expected: table / line / horizontal_bar · selected: heatmap · posture: validate

Findings: intentMatched

Response excerpt:

```text
Overlaying dollars, percentage adoption, and evidence confidence in a single chart would mislead. Here is why, and what the safer approach is.

The three dimensions do not share a common denominator. Forecast value figures are planning-grade commitments, not finance-attested outcomes. Percentage adoption is not loaded in the Tower context for any of these programs — there is no governed adoption metric to plot. Confidence ratings are categorical (high, medium), not continuous scores. Forcing all three onto one axis would imply a precision and comparability that the data does not support and that the Tower value-claim policy explicitly blocks.

The safer approach is a heatmap that separates what is known from what is still gated. The x-axis carries the program domain (Operations, Commercial, Finance, Infrastructure). The y-axis carries the evidence readiness state: finance-attestation pending, forecast/planning, or baseline. Each cell shows the forecast value figure and the confidence rating. This makes the executive question visible and honest: which programs carry the largest planned benefit, and which still need a finance-attestation gate cleared before any outcome language is wa
```

### q33-validate-no-chart — WATCH

Prompt: I want a chart proving ROI is achieved. If Tower cannot prove achieved ROI, do not force a chart.

Expected: table / heatmap · selected: table · posture: validate

Findings: fallbackPosture, executiveUseful

Response excerpt:

```text
This is a run-cost pressure question, not a value-realization win yet. In the Airline Demo synthetic Tower planning context, $2.6B of FY26 technology budget is in view, and the mix is the point: $1.4B is run versus $1.1B change. I would use this as a budget-control conversation until finance-attested measurement readiness is complete.

**Tower dashboard values**

| Measure | Value |
| --- | --- |
| Total technology budget | $2.6B |
| Run budget | $1.4B |
| Change budget | $1.1B |
| Funded initiatives | $1.0B |
| Promised value | $3.4B |
```

### q34-validate-empty-program — WATCH

Prompt: Assume a program has no owner, no baseline, and no measured outcome loaded. What should Tower show instead of a polished success visual?

Expected: table / heatmap / horizontal_bar · selected: table · posture: validate

Findings: fallbackPosture

Response excerpt:

```text
This is the right drill-down, but the current Tower packet proves the enterprise $1.4B run base and $1.1B change pool; it does not yet prove the service-by-service or vendor-by-vendor drivers. I would not rank vendors from this view until the run allocation, contract owner, renewal date, and application dependency fields are loaded.

**Tower dashboard values**

| Measure | Value |
| --- | --- |
| Total technology budget | $2.6B |
| Run budget | $1.4B |
| Change budget | $1.1B |
| Funded initiatives | $1.0B |
| Promised value | $3.4B |
```

### q35-validate-large-portfolio — WATCH

Prompt: For a large portfolio, show top-N plus other and explain what the other bucket hides.

Expected: treemap / horizontal_bar / table · selected: 2x2 · posture: caveated

Findings: intentMatched, fallbackPosture, executiveUseful

Response excerpt:

```text
This is a run-cost pressure question, not a value-realization win yet. In the Airline Demo synthetic Tower planning context, $2.6B of FY26 technology budget is in view, and the mix is the point: $1.4B is run versus $1.1B change. I would use this as a budget-control conversation until finance-attested measurement readiness is complete.

**Tower dashboard values**

| Measure | Value |
| --- | --- |
| Total technology budget | $2.6B |
| Run budget | $1.4B |
| Change budget | $1.1B |
| Funded initiatives | $1.0B |
| Promised value | $3.4B |
```

### q36-export-consistency — WATCH

Prompt: Give me an executive artifact I could export: answer, table, and visual should tell the same story about which AI bets to fund.

Expected: 2x2 / table / horizontal_bar · selected: 2x2 · posture: visual

Findings: executiveUseful

Response excerpt:

```text
This is a run-cost pressure question, not a value-realization win yet. In the Airline Demo synthetic Tower planning context, $2.6B of FY26 technology budget is in view, and the mix is the point: $1.4B is run versus $1.1B change. I would use this as a budget-control conversation until finance-attested measurement readiness is complete.

**Tower dashboard values**

| Measure | Value |
| --- | --- |
| Total technology budget | $2.6B |
| Run budget | $1.4B |
| Change budget | $1.1B |
| Funded initiatives | $1.0B |
| Promised value | $3.4B |
```

### q39-business-readable-stream — FAIL

Prompt: Build the AI prioritization view and make the work feel like Tower is checking business evidence, not technical packets.

Expected: 2x2 / table · selected: heatmap · posture: visual

Findings: intentMatched

Response excerpt:

```text
The AI prioritization view below ranks the top initiatives by FY26 forecast value and surfaces the business evidence gaps that matter for executive confidence — not technical readiness scores. Every value figure is forecast/planning grade; none has cleared the finance-attestation gate, so these are planned benefits, not confirmed outcomes.

The two programs that should anchor the portfolio conversation are Mainframe API and Event Bridge ($310M planned benefit) and IROPS Agentic Recovery Cockpit ($270M). Both carry high confidence ratings in Tower and have FY25 baselines to compare against — Mainframe at $111.6M and IROPS at $97.2M — which means the FY26 step-up is aggressive and the finance-attestation gap is the single most important thing to close before the next funding cycle. Teradata is a named supplier for IROPS, and the internal team owns Mainframe; those are the two accountability anchors leadership should pressure-test first.

Enterprise CDP ($210M) sits third but has a more complex supplier picture — SAP and Salesforce both feed it — which creates a governance question about which system of record owns the identity graph outcome. That ambiguity is a measurement gate risk,
```

### q41-scope-out-of-bounds — WATCH

Prompt: Use Tower to certify every AI vendor contract clause is compliant and produce a risk chart.

Expected: table / heatmap / horizontal_bar · selected: treemap · posture: validate

Findings: intentMatched

Response excerpt:

```text
Tower cannot certify AI vendor contract clause compliance. That is a legal and procurement governance function requiring clause-level contract text, compliance attestation records, and regulatory mapping — none of which are loaded in the Tower context package. Producing a compliance certification or risk chart from contract clauses is outside Tower's governed evidence boundary for this question.

What Tower does hold is the FY26 initiative budget portfolio ranked by forecast value, vendor supply relationships, and spend posture. That is the governed lens available here. If your underlying concern is vendor concentration risk or commercial exposure across AI-adjacent programs, Tower can speak to that directly.

The top five programs by FY26 forecast value — Mainframe API and Event Bridge ($310M), IROPS Agentic Recovery Cockpit ($270M), Enterprise CDP ($210M), SAP Finance Modernization ($186M), and Delta-style Digital Concierge ($180M) — represent over $1.15B in planned benefit. All five are forecast/planning grade; none have cleared the finance-attestation gate. The vendor supply relationships loaded show Teradata, SAP, Salesforce, and SAS as key suppliers across these programs, but
```

### q42-source-handoff — WATCH

Prompt: Which contract terms should Source validate before Tower turns vendor exposure into an executive decision?

Expected: table / treemap / heatmap · selected: treemap · posture: validate

Findings: executiveUseful

Response excerpt:

```text
Before Tower converts vendor exposure into an executive decision, Source needs to validate five contract-term categories across the suppliers with the highest forecast value concentration.

The four vendors with confirmed supply relationships to top-value programs are Teradata, SAP, Salesforce, and SAS. Together they underpin programs carrying over $900M in forecast planned benefit. Until Source validates the commercial terms behind those relationships, any executive decision on leverage, renewal, or consolidation is premature.

The five contract-term categories Source must clear:

1. Renewal windows and auto-renewal clauses — Teradata appears in three high-value program relationships (Delta-style Digital Concierge, IROPS Agentic Recovery Cockpit, Teradata Vantage Workload Rationalization). If any contract auto-renews before the rationalization decision is made, negotiating leverage disappears. Source must confirm exact renewal dates and notice periods.

2. Exit and termination-for-convenience rights — The Teradata Vantage Workload Rationalization program carries $122M in forecast planned benefit specifically tied to workload migration away from Teradata. Source must confirm whethe
```

### q43-moves-handoff — WATCH

Prompt: Which high-value but low-readiness items should move into Moves, and what Tower evidence gate should follow them?

Expected: table / 2x2 / heatmap · selected: heatmap · posture: caveated

Findings: executiveUseful

Response excerpt:

```text
Three initiatives carry the highest forecast value in the portfolio but show structural readiness gaps that should gate their move into active execution: Enterprise CDP Selection and Identity Graph ($210M), Delta-style Digital Concierge ($180M), and IROPS Agentic Recovery Cockpit ($270M).

Enterprise CDP Selection and Identity Graph is the most urgent case. At $210M forecast value, it sits at the intersection of two vendor dependencies — SAP and Salesforce — with no finance-attested baseline and no reconciled actuals. Before it moves into Moves, the evidence gate is a vendor selection decision record and a finance-attested cost-benefit baseline that separates SAP-sourced value from Salesforce-sourced value. Without that split, the $210M is a single undifferentiated planning figure that cannot be tracked or defended.

Delta-style Digital Concierge ($180M) carries dual vendor exposure through SAS and Teradata. Teradata also supplies the IROPS Agentic Recovery Cockpit, creating a shared-dependency risk across two high-value programs. The evidence gate for Digital Concierge is a data platform readiness confirmation — specifically whether the Teradata Vantage Workload Rationalization ($
```

### q44-board-story — WATCH

Prompt: Tell the board the Tower story in one page: where value is promised, where proof is missing, and what action is next.

Expected: waterfall / heatmap / table · selected: waterfall · posture: caveated

Findings: executiveUseful

Response excerpt:

```text
The portfolio carries $3.4B in forecast value commitment against a $2.6B FY26 IT budget — a compelling ratio on paper, but the board should understand that not one dollar of that $3.4B has cleared a finance attestation gate. Every value figure in the Tower is forecast/planning grade. That is the central governance fact this page must establish.

Where value is promised: Eighteen initiatives account for the bulk of the $3.4B forecast. The five largest — Mainframe API and Event Bridge ($310M), IROPS Agentic Recovery Cockpit ($270M), Enterprise CDP ($210M), SAP Finance Modernization ($186M), and Delta-style Digital Concierge ($180M) — together represent roughly $1.16B in planned benefit. All five are high-confidence forecasts. High confidence means the planning logic is sound; it does not mean finance has attested to a baseline or measured an outcome.

Where proof is missing: $432M in value is currently awaiting finance attestation YTD. That figure sits in a measurement gate — it is the most advanced value claim in the portfolio, yet it remains unreconciled. Until a v3-reconciled baseline and actuals package is submitted and attested, the board cannot treat any portion of the $3.4B as
```

### q45-cfo-challenge — WATCH

Prompt: As CFO, challenge the AI portfolio value claim. What visual should I trust, and what should I reject until evidence improves?

Expected: waterfall / table · selected: heatmap · posture: caveated

Findings: intentMatched

Response excerpt:

```text
The value story is promising, but it is not outcome-proof yet. In the Airline Demo synthetic Tower planning context, Tower shows $3.4B promised value against $432.0M attestation-pending measurement evidence. I would inspect the largest promise-to-measurement gaps before approving more funding.

**Tower dashboard values**

| Measure | Value |
| --- | --- |
| Total technology budget | $2.6B |
| Run budget | $1.4B |
| Change budget | $1.1B |
| Funded initiatives | $1.0B |
| Promised value | $3.4B |
```
