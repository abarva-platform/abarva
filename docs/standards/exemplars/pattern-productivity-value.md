---
artifact_id: "pattern-productivity-value"
rubric_type: "pattern"
title: "Productivity to Value Requires Reallocation"
---

# Productivity to Value Requires Reallocation

## Quantified claim

Quantified claim: AI SDLC tools create measurable value only when at least 50 percent of saved hours are assigned to a named reallocation queue within one planning cycle. Scope: enterprise IT productivity programs. Horizon: 90-180 days.

## Evidence

Evidence chunk 1: DORA deltas improve throughput but not P&L unless capacity is redirected (primary citation: DORA research corpus, source P-IT-06). Evidence chunk 2: AbarVa transformations show 30-50 percent leakage without queue ownership (primary citation: AbarVa benchmark, n=18, source P-IT-03). Evidence chunk 3: license spend often rises before realized value (primary citation: P-IT-20, range $19-$39 per user per month).

## Counterarguments

Counterargument 1 steelman: developer happiness is valuable even without immediate dollar capture. Response: true, but it should be tracked as DevEx, not counted as realized value. Counterargument 2 steelman: teams need slack for resilience. Response: true, so the queue may assign capacity to resilience work, but it must still be named.

## Calibrated confidence

Calibrated confidence: 0.78. Confidence is high for large enterprises with portfolio governance and medium for startups because queue mechanics are lighter.

## Boundary conditions

Boundary conditions: does not apply to emergency remediation periods, teams below five engineers, or regulated release trains where cycle time is externally constrained.

## Failure modes

Failure mode 1: this goes wrong when finance books gross hours saved as dollars. Failure mode 2: this goes wrong when managers fill saved time with untracked local work.

## Maturity model linkage

Maturity model stage 2 tracks adoption only. Stage 3 adds hours saved. Stage 4 adds named reallocation. Stage 5 verifies realized value quarterly.

## Vertical overlay

Healthcare vertical overlay weights safety and compliance work higher. Financial services vertical overlay requires model-risk and audit evidence. Retail vertical overlay can reallocate faster into digital merchandising and store operations.

## Related patterns

Related patterns: reinforces P-IT-10 Reallocation gap; depends_on P-IT-14 Baseline-before-rollout; contradicts P-IT-11 Copilot-55 vendor claim when value is assumed.

## So what / synthesis

So what: do not approve a broad AI SDLC rollout until the sponsor names where saved capacity goes, who owns the queue, and how Tower will verify value.
