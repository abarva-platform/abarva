# Vendor 360 CPO Mapping Story

SYNTHETIC DEMO DATA - NOT CLIENT DATA - PHI-FREE - OFFLINE VENDOR 360 PREVIEW ONLY

Scenario as-of date: 2027-06-30

## The One-Sentence Story

Vendor 360 should not say "we loaded contract data." It should say: **we preserved every source system at its native grain, mapped it through governed canonical objects, and only then showed Procurement which vendor actions are allowed, blocked, or diagnosis-only.**

## What The CPO Needs To See

1. Source system extract: CLM, documents, clauses, AP/PO, SLA/KPI, operations baseline, transition tracker, GRC/IAM, sourcing workspace, and FP&A value ledger.
2. Native grain: one row per contract, document, page/span clause, pricing line, invoice line, SLA event, process-period-location, transition milestone, control exception, sourcing artifact, and finance period.
3. Layer mapping: Layer 1 source extract -> Layer 2 adapter -> Layer 3 canonical object -> Layer 4 Vendor 360 panel.
4. Decision gates: evidence available and diagnosis ready are not the same as action ready, vendor outreach approved, or value proven.

## Why It Matters

Procurement can trust the page because the page does not flatten a contract family into a single row. It shows the source evidence, the row grain, the mapped object, the conflict state, and the reason an action is allowed or blocked.

## Preview Artifacts

- `vendor360_extract_mapping.csv`: source system to native grain to Vendor 360 use.
- `vendor360_layer_mapping.csv`: the four-layer mapping story.
- `vendor360_read_model.csv`: one offline Vendor 360 card per contract.
- `vendor360_mapping_story.html`: simple visual explanation for CPO review.
