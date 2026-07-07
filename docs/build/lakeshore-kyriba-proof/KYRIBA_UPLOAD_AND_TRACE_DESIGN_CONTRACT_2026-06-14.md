# Kyriba Upload And Trace Design Contract

Date: 2026-06-14

## Decision

Before loading the new Kyriba proof pack, the product must make the upload destination and trace semantics explicit.

The rule:

| Destination | Used for | Behavior |
|---|---|---|
| Enterprise context | CMDB, ERP landscape, org roles, financial baselines, integration topology, rate cards, vendor contracts | Structured rows update current-state context. Matching active facts are superseded by key; prior values remain auditable. |
| Source event evidence | Vendor responses, architecture exhibits, RFP attachments, BAFO letters, roadmap evidence | Immutable event artifact versions. New versions can supersede prior event artifacts, but they do not rewrite tenant current-state facts. |
| Corpus pattern layer | Decision patterns, anti-patterns, sourcing rules, scoring/cost implications | Human-reviewed pattern records. These explain why outputs change when evidence changes. |

## Product Fix Included

The Admin context upload connector now:

- shows `Update enterprise context` as the selected lane,
- explains that Source event evidence is a separate lane,
- returns and displays how many active enterprise facts were superseded during structured promotion,
- shows a plain-English load receipt,
- states that generated artifacts should show `evidence -> activated pattern -> output change`.

The generated evidence pack also carries the guidance in the files themselves:

- each `.xlsx` workbook opens with an `Instructions + Masking` tab,
- CSV/Markdown inputs are accompanied by `00_upload_instructions_and_sensitivity.md`,
- the manifest marks the guidance file separately from enterprise context and event evidence.
- the rows include masked-value examples where the shape matters for analysis:
  account references, routing references, API/file-transfer paths, CMDB host/IP
  fields, credential references, certificate references, and contract references.

Masking is preferred for this proof because AbarVa still needs safe evidence
shape to reason about complexity. Scrambling is reserved for cases where the
original value shape is not needed or policy requires stronger
de-identification.

## Why This Matters

Surekha's proof depends on demonstrating more than document drafting. The product needs to show:

1. what files were loaded,
2. what facts were extracted,
3. what existing current-state facts changed,
4. what decision patterns activated, and
5. how the RFP, scoring weights, cost model, risk register, and recommendation changed.

That is the difference between "the AI wrote an RFP" and "AbarVa reasoned from evidence."

## Synthetic Pack

The generated pack lives at:

`datasets/lakeshore-kyriba-synthetic-v1/source_uploads/`

It contains 16 files:

- six `.xlsx` workbooks,
- four `.csv` files, including the evidence-to-output trace,
- four markdown files, including buyer-facing upload and sensitivity guidance,
- one decision-pattern `.jsonl`,
- one `manifest.json`.

## Demo Acceptance

The Kyriba demo should not be called ready until it can show this trace:

`01_treasury_volume_baseline.xlsx`
-> `KYR-PAT-001 bank/entity volume complexity`
-> RFP adds bank connectivity matrix
-> scoring increases integration/testing weight
-> cost model increases SIT/UAT/cutover/hypercare effort
-> risk register adds bank onboarding and reconciliation failure risk.

At least three activated patterns should visibly change downstream outputs.

## Honest Boundary

This is synthetic data. It is intended to model the kind of files a real client could provide. It is not a claim that Lakeshore has a live Kyriba rollout, realized savings, or private client data loaded.
