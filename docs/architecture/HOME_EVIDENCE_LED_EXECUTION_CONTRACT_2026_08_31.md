# Home Evidence-Led Execution Contract

## Status

Candidate contract for the Home ECL V2 page-generation lane.

This document records the design decision from the late-August Home quality review: Home must stop
generating executive prose into fixed empty slots. A Home page is valid only when deterministic
evidence produces a finding, a refusal, or a deferred evidence request.

The machine-readable contract lives at
`config/home/evidence-led-pages.json` and is attached to each generated Home page packet by
`scripts/ecl/build_source_intelligence_home_packets.mjs`.

## Operating Rule

Home generation is ordered this way:

```text
source files and ECL facts
  -> source intelligence summaries and evidence tables
  -> declared segment spine and source-specific deterministic tables
  -> evidence-led page contract
  -> Claude caption / interpretation
  -> verifier, repair, or terminal state
  -> published Home page
```

Claude is not the analytics engine. Claude may interpret a deterministic block; it may not create
the block, calculate the number, choose the denominator, invent the finding, or fill a missing
section.

## What We Keep From The Review

The useful findings are adopted:

- Pages are evidence-led, not slot-led.
- Executive pages open on business model, segment economics, accountability, value, and exposure
  before naming individual vendors or technologies.
- Technical pages use an expert technologist lens: conceptual blocks before logical systems,
  then physical deployment/platform facts.
- Every page has a question, lead number, governing table, findings with owner and because-clause,
  and drill links.
- The record browser is a primary proof surface: family picker, column panel, row table,
  constant-column flags, and cell-to-row provenance.
- Every displayed count names its denominator and is computed through a typed view or declared
  source table.
- Architecture and data-flow pages preserve admission gates and render refusals when the record
  cannot answer.

The literal ten-page replacement is not adopted. Home still has the committed sixteen-surface
contract. The ten evidence-led contracts map onto those sixteen surfaces as the executive story and
drilldown layer.

## Terminal States

Every generated Home section must render one of three terminal states:

| State | Meaning |
|---|---|
| `published` | Evidence supports a page claim and the verifier accepts it. |
| `refused` | The declared question cannot be answered because a gate failed. The failed rule, measurement, evidence needed, and supported alternative render. |
| `deferred` | The page has relevant source evidence, but not enough verified evidence for a claim. The evidence needed renders. |

A missing section is a failure. "Intentionally withheld" without a rendered terminal state is not a
valid outcome.

## Prompt Contract

Each Home prompt packet now includes:

- `source_intelligence`: accepted source-level summaries with facts, observations, gaps, do-not-claim
  rules, citations, row count, column count, fill rate, and hash.
- `source_content_context`: selected full source-file content.
- `source_evidence_tables`: deterministic tables extracted from the source-file content, including
  row count, column count, key dimension summaries, numeric summaries, and row samples.
- `segment_spine_context`: the declared business-segment spine from `01b_business_segments.csv` plus
  cross-domain attribution from `scripts/data-build/report-segment-spine.ts`.
- `evidence_led_contract`: the page-level question, lead fact, source files, source layers,
  governing table, required findings, chart rules, terminal-state rules, and drill links.

The prompt explicitly tells Claude:

- use the evidence-led contract as the page ordering contract;
- use deterministic tables as fixed exhibits;
- do not recompute or rename segments;
- do not open an executive page on a vendor, system, or tool unless the page contract asks for it;
- render `published`, `refused`, or `deferred`;
- attach evidence, owner role, because-clause, and evidence-needed fields to findings.

## Page Contracts

The machine-readable file currently defines these ten evidence-led contracts:

| Contract | Home surface(s) | Lead evidence |
|---|---|---|
| `what_this_enterprise_is` | Executive Brief, Our Business | `01b_business_segments.csv`, `04_applications_systems.csv` |
| `what_it_runs_on` | Technology & Data, Applications & Systems | `04_applications_systems.csv` |
| `where_it_is_hosted` | Infrastructure & Platforms | `06_infrastructure_platforms.csv` |
| `how_data_moves` | Current-State Data Flow, Data Assets & Integrations | `05_data_assets_integrations.csv` |
| `what_it_buys` | Vendor Contracts | `07_vendors_contracts.csv`, `17_service_scope_managed_services.csv` |
| `what_it_costs_and_returns` | Performance & Value | `08_spend_value.csv`, `14_metrics_outcomes.csv` |
| `what_it_is_betting_on` | Strategy & Value Creation | `09_programs_initiatives.csv`, `08_spend_value.csv`, `14_metrics_outcomes.csv` |
| `what_is_exposed` | What Needs Attention | `11_risks_controls.csv`, `13_evidence_sources.csv`, `14_metrics_outcomes.csv` |
| `who_owns_what` | How We Operate, Leadership Perspective | `02_org_ownership.csv`, `03_workforce_roles.csv`, interview extract |
| `the_record` | What Has Been Loaded, Browse The Record | Registry, sheet index, source intelligence manifest |

## Design Rule For The Browser

The record browser is not a file dump. It is the provenance control for Home.

Required behavior:

- family picker with rows, columns, fill rate, source hash, citable state, and grain;
- column panel with meaning, fill rate, distinct count, sample values, and constant-column flags;
- virtualized row table with sorting, per-column filtering, and CSV export of the visible slice;
- a cell provenance control from each page figure to the filtered source rows behind it.

## Verification

The minimum local proof for this contract is:

```bash
npm run test:ecl-source-intelligence-home-packets
```

That test now checks that Home packets include:

- full selected source content;
- source evidence tables;
- declared segment-spine context;
- evidence-led page contract;
- prompt instructions that make terminal state and deterministic-table usage explicit.

This is not live proof and does not publish new Home prose by itself. It is the prompt/context
contract that the next generation and rendered-page proof must consume.
