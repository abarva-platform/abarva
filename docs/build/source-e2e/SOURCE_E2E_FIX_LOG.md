# Source E2E Fix Log

Date: 2026-05-02

## Fix 1 — Normalize Source To Eleven-Stage Lifecycle

PR: #1434  
Merge SHA: `d314c42dc5b217359a658649d8c45bcd9664fa5e`  
Production deployment: `dpl_Fo4vbVZzhdXm44AC7k4aD5o7X1w2`

Root cause:

- Source still used a legacy 10-stage workflow in several runtime paths.
- The founder-locked lifecycle is 11 stages: Strategy, Scope, RFP, Responses, Evaluation, Pricing, BAFO, Executive Decision, Selection, Transition, Value.

Fix:

- Added canonical stage normalization and legacy alias support.
- Updated Source API, artifact routes, stage gates, active workspace, portfolio filters, and tests.
- Added migration `20260502143000_source_11_stage_lifecycle.sql`.

Validation:

- 70 Source integration suites / 751 tests passed.
- Focused Source lifecycle/tooling/artifact registry tests passed.
- TypeScript, ESLint, and build passed.
- Live production event canvas showed all 11 stages.

## Fix 2 — Tower Handoff Did Not Include Canonical Source Stages

PR: #1437  
Merge SHA: `f76dac4381d70d6d6fd11ff71a2c1eb023924061`  
Production deployment: `dpl_3qMV6vThtzi1hRNTGjxttCzfF1qN`

Root cause:

- Tower queried Source handoffs only for legacy `contract_mobilization` and `value_realization` stages.
- New E2E Source events correctly persisted as canonical `value`, so Tower filtered them out.

Fix:

- Tower Source handoff query now includes `transition`, `value`, `contract_mobilization`, and `value_realization`.
- Stage display formatter handles canonical and legacy keys.
- Regression test updated.

Validation:

- Focused Tower handoff Jest passed.
- Targeted ESLint and TypeScript passed.
- PR checks passed.
- Post-deploy Tower rerun showed Apex, Meridian, and First Capital completed E2E Source events.

## Fix 3 — Pricing Upload Parser Extracted Year/Heading Numbers As Amounts

PR: #1439  
Merge SHA: `a3902e9d208968df7121bbdd6f7da7c54a925420`  
Production deployment: `dpl_A9NZ7FJmdSU31j9yXp4Dc7uRgPKf`

Root cause:

- The pricing parser's amount regex allowed bare numbers in pricing-related lines.
- It extracted `year 3`, `year 1`, and heading text like `E2E` as pricing components.

Fix:

- Parser now requires an explicit currency marker (`$`, `USD`) or a magnitude suffix (`m`, `million`, `k`, `thousand`) for amount extraction.
- Regression test asserts the pricing workbook extracts only the six intended commercial components.

Validation:

- Focused Source text-parser Jest passed.
- Targeted ESLint and TypeScript passed.
- PR checks passed.
- Post-deploy pricing upload rerun persisted exactly six pricing components and no heading/year false positives.

## Remaining Known Issues

- Generated artifacts persist but stay parser/vector/graph pending.
- Evidence gates are not yet proven as hard enforcement for every stage transition.
- Binary document parsing for PDF/DOCX vendor responses was not proven in this crawl.
- First Capital still maps to legacy `arcturus` in Source event persistence.
- Demo sign-in occasionally stalls before succeeding on retry.
