# Packet 34 Pre-Act 0 Artifact Framework Inventory

Date: 2026-05-30
Branch: `codex/section9-framework-audit`
Scope: Section 9.1 of `docs/build/CODEX_MASTER_BACKLOG_2026-05-29.md` and Packet 34 Amendment B.

## Executive Verdict

The artifact framework is substantially built, but Packet 34 should pause for Section 9.2 gap-filling before Acts 1-7.

In layman terms: AbarVa already has the factory floor for producing executive artifacts: templates, export paths, board Move decks, Source documents, and a CXO scoring engine. What is missing is the final inspection station for the Packet 34 crawl: runtime quality standards for the specific artifacts Packet 34 wants to score, plus Intelligence-tier briefing templates. Without those, the crawl can generate artifacts, but it cannot honestly prove that each one meets board-circulation quality.

## Inventory Summary

| Area                               | Status                                  | Evidence                                                                                                                                                           |
| ---------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Master CXO scoring engine          | Working foundation                      | `src/lib/artifact-excellence/cxo-artifact-excellence-framework.ts`                                                                                                 |
| Runtime CXO standards declarations | Material gap                            | `createCxoArtifactStandard` is only used in `src/lib/artifact-excellence/__tests__/cxo-artifact-excellence-framework.test.ts`                                      |
| Deliverable templates              | Partial but production-grade            | 7 templates in `src/lib/deliverables/templates/`, all with 9 sections, 6 rubric criteria, worked examples, prompt templates, and `maturity: production`            |
| Source export standards            | Strong coverage                         | 19 Source artifact standards in `src/lib/source/exports/artifact-standards.ts`                                                                                     |
| Source generation prompts          | Partial                                 | 3 generated prompts in `src/lib/source/agent-generation/prompt-registry.ts`: d01, d05, d09                                                                         |
| Move board artifacts               | Strong HTML deck coverage; PPTX partial | 8 board artifacts in `src/lib/programs/board-artifacts/board-artifacts-registry.ts`; only Apex reference Costed Business-Case carries a `pptxHref`                 |
| Program exports                    | Strong multi-format primitives          | `src/lib/programs/exports/format-router.ts` supports docx/html/pdf/xlsx by deliverable kind                                                                        |
| Source exports                     | Strong multi-format primitives          | `src/lib/source/exports/format-router.ts` supports docx/pdf/xlsx/html by Source kind                                                                               |
| Per-tenant generated examples      | Partial                                 | `src/content/deliverables/apex-retail` has 21 files; `src/content/deliverables/meridian` has 17; Northstar, First Capital, and SkyHarbor have none under this path |

## 1. Master Quality Framework Inventory

File: `src/lib/artifact-excellence/cxo-artifact-excellence-framework.ts`

The framework defines the cross-module scoring contract:

| Dimension              | Inventory                                                                                                                                                                                                                                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modules                | `intelligence`, `moves`, `source`, `tower`, `context`                                                                                                                                                                                                                                                                   |
| Circulation levels     | `cxo_preview`, `board_circulation`, `gold_standard_sample`                                                                                                                                                                                                                                                              |
| Quality dimensions     | `decisionSharpness`, `executiveStoryline`, `evidenceGrounding`, `financialDefensibility`, `exhibitQuality`, `expertChallenge`, `actionability`, `governanceAuditability`, `editabilityReadability`                                                                                                                      |
| Exhibit families       | `decision_card`, `value_investment_bridge`, `sensitivity_stack`, `scenario_range`, `evidence_gap_matrix`, `options_comparison`, `risk_control_heatmap`, `roadmap_swimlane`, `commercial_normalization`, `measurement_handoff`                                                                                           |
| Hard-fail codes        | `missing_recommendation`, `ungrounded_financial_claim`, `fabricated_metric`, `missing_sensitivity`, `missing_options`, `missing_architecture_visual`, `missing_risk_owners`, `non_editable_pptx`, `hidden_stale_or_missing_evidence`, `visible_placeholder_language`, `missing_decision_job`, `decorative_visuals_only` |
| Minimum score defaults | `cxo_preview: 80`, `board_circulation: 90`, `gold_standard_sample: 94`                                                                                                                                                                                                                                                  |

Runtime standard declarations found: none.

Observed use of `createCxoArtifactStandard`:

| File                                                                              | Purpose                                                                   |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/lib/artifact-excellence/__tests__/cxo-artifact-excellence-framework.test.ts` | Test-only `business_case_pack` and `solution_architecture_pack` standards |

Gap: Packet 34 requires standards for generated Intelligence, Moves, Source, and Tower artifacts. The scoring engine can score them, but no canonical runtime standards define their required sections, exhibits, evidence, flags, and minimums.

## 2. Per-Artifact Template Inventory

All files are in `src/lib/deliverables/templates/`.

| Template file                   | Sections | Rubric criteria | Worked examples | Prompt template | Maturity   |
| ------------------------------- | -------: | --------------: | --------------- | --------------- | ---------- |
| `charter.ts`                    |        9 |               6 | yes             | yes             | production |
| `design_brief.ts`               |        9 |               6 | yes             | yes             | production |
| `diagnostic_charter.ts`         |        9 |               6 | yes             | yes             | production |
| `execution_plan.ts`             |        9 |               6 | yes             | yes             | production |
| `execution_roadmap_tracker.ts`  |        9 |               6 | yes             | yes             | production |
| `outcome_report.ts`             |        9 |               6 | yes             | yes             | production |
| `timeline_resource_estimate.ts` |        9 |               6 | yes             | yes             | production |

Missing for Packet 34 Act 2B and likely Section 9.2:

| Needed template                                                   | Why it matters                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `executive_briefing_memo.ts`                                      | Act 2B requires a board-circulatable memo from 30 Intelligence Q&A turns |
| `strategic_decision_paper.ts`                                     | Packet 34/33 coverage expects a decision artifact beyond Q&A             |
| `quarterly_executive_memo.ts`                                     | Tower/portfolio review needs an executive cadence artifact               |
| `mobilization_plan.ts` or explicit mapping to `execution_plan.ts` | Act 4 says mobilization should map to an existing template or be flagged |

## 3. Generator Inventory

### Deliverables

Files in `src/lib/deliverables/`:

| File                                                 | Role                             |
| ---------------------------------------------------- | -------------------------------- |
| `generate.ts`                                        | Deliverable generation surface   |
| `v2-generator.ts`                                    | v2 generation path               |
| `structured.ts`                                      | Structured deliverable support   |
| `render-contract.ts`                                 | Render contract                  |
| `evidence-registry.ts`                               | Evidence registry                |
| `live-sync.ts`                                       | Sync surface                     |
| `execution-roadmap-tracker.ts`                       | Roadmap tracker implementation   |
| `timeline-resource-estimate.ts`                      | Timeline/resource implementation |
| `legacy-route-resolver.ts`, `seed-route-resolver.ts` | Route resolution helpers         |

### Source Agent Generation Prompts

File: `src/lib/source/agent-generation/prompt-registry.ts`

| Prompt code         | Status  |
| ------------------- | ------- |
| `d01_strategy_memo` | Present |
| `d05_scope_memo`    | Present |
| `d09_rfp_pack`      | Present |

Gap: Source export coverage is much broader than Source agent-generation prompt coverage. Packet 34 Acts 5-6 can validate export/rendering surfaces, but autonomous generation beyond d01/d05/d09 remains partial.

### Board Artifact Registry

File: `src/lib/programs/board-artifacts/board-artifacts-registry.ts`

Eight board artifact entries are available for the Apex reference Move and key-driven generic Moves:

| Artifact id             | Label                          | HTML | PPTX                |
| ----------------------- | ------------------------------ | ---- | ------------------- |
| `discover-brief`        | Discover Brief                 | yes  | no                  |
| `charter-skeleton`      | Charter Business-Case Skeleton | yes  | no                  |
| `costed-business-case`  | Costed Business-Case Pack      | yes  | Apex reference only |
| `solution-architecture` | Solution Architecture Pack     | yes  | no                  |
| `estimate-model`        | Estimate & Financial Model     | yes  | no                  |
| `mobilize-packet`       | Mobilize & Go-Decision Packet  | yes  | no                  |
| `cfo-pack`              | CFO Pack                       | yes  | no                  |
| `master-dossier`        | Master Move Dossier            | yes  | no                  |

Gap: Packet 34's `non_editable_pptx` hard fail means any requested board-deck PowerPoint export must be explicit. Current Move board artifacts are primarily HTML; PPTX is partial.

## 4. Multi-Format Support Matrix

### Program exports

File: `src/lib/programs/exports/format-router.ts`

| Kind                         | Formats         |
| ---------------------------- | --------------- |
| `program-charter`            | docx, html, pdf |
| `discovery-report`           | docx            |
| `okr-baseline`               | xlsx            |
| `stakeholder-map`            | xlsx, html      |
| `synthesis-options-table`    | xlsx, html      |
| `architecture-sketch`        | html            |
| `execution-plan`             | xlsx            |
| `pilot-result-report`        | docx            |
| `outcome-report`             | docx, html, pdf |
| `bafo-scoreboard`            | xlsx            |
| `meeting-notes`              | docx            |
| `decision-log`               | docx, xlsx      |
| `roadmap`                    | html, xlsx, pdf |
| `financial-baseline`         | xlsx            |
| `archetype-primer`           | html            |
| `workshop-facilitator-guide` | docx            |

### Source exports

File: `src/lib/source/exports/format-router.ts`

| Kind                                                                                                                                                                             | Formats               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `scope-memo`, `rfp-package`, `decision-brief`, `selection-memo`                                                                                                                  | docx, html, pdf       |
| `app-inventory`, `response-checklist`, `scorecard`, `pricing-template`, `pricing-comparison`, `trap-log`, `bafo-question-pack`, `market-scan`, `tco-iceberg`, `renewal-decision` | xlsx, docx, pdf       |
| `ai-clause-gap`                                                                                                                                                                  | xlsx, docx, pdf, html |
| `demand-challenge`, `sourcing-approach`, `vendor-risk-pack`                                                                                                                      | docx, pdf             |

Coverage verdict: K05 multi-format export is strong for Source and Program export primitives. It is partial for Move board artifacts and not yet established for Intelligence-tier deliverables.

## 5. Coverage Matrix

| Artifact family                 | CXO preview      | Board circulation                                         | Gold standard sample               | Evidence                                                           |
| ------------------------------- | ---------------- | --------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| Generic CXO scoring             | working          | working if runtime standard exists                        | working if runtime standard exists | `src/lib/artifact-excellence/cxo-artifact-excellence-framework.ts` |
| Program deliverable templates   | working          | partial: no CXO standards mapped                          | partial: no CXO standards mapped   | 7 production templates                                             |
| Source artifacts                | working          | partial: Source standards exist, CXO standards not mapped | partial                            | 19 Source standards + multi-format router                          |
| Move board artifacts            | working for HTML | partial: quality standard mapping missing; PPTX partial   | partial                            | 8 board artifacts in registry                                      |
| Intelligence executive briefing | missing          | missing                                                   | missing                            | no `executive_briefing_memo` template found                        |
| Tower quarterly review          | partial          | missing as CXO standard/template                          | missing                            | no `quarterly_executive_memo` template found                       |

## 6. Gap Analysis vs Packet 33 + Packet 34

| Requirement                                                                                                 | Current status                                                                                              | Gap-filler needed before Act 1?                                        |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Intelligence-tier deliverables: executive briefing memo, strategic decision paper, quarterly executive memo | Missing explicit templates and runtime CXO standards                                                        | yes                                                                    |
| K05 multi-format export                                                                                     | Strong for Source/Program; partial for Moves; not proven for Intelligence                                   | yes for Act 2B deck/export path, otherwise can validate existing paths |
| K10 audit-grade evidence chains                                                                             | Evidence concepts exist, but Packet 34 quality cards need standards to check required evidence per artifact | yes                                                                    |
| K23 board-ready output formats                                                                              | Move board artifact registry exists; only partial PPTX support                                              | yes if Packet 34 requires PPTX for every deck                          |
| Sentinel self-enhancement loop                                                                              | Not proven by framework audit                                                                               | no code gap proven yet; verify during Act 3/4                          |
| Per-industry TOC variations                                                                                 | Retail corpus exists; template variation by industry not obvious in deliverable templates                   | not blocking Apex Act 1, but should be captured during Acts 3-7        |

## 7. Per-Tenant Pre-Generated Examples

### `src/content/deliverables/<tenant>/`

| Tenant             | File count | Coverage                                     |
| ------------------ | ---------: | -------------------------------------------- |
| Apex Retail        |         21 | Strongest pre-generated deliverable baseline |
| Meridian           |         17 | Strong healthcare-provider baseline          |
| Northstar Clinical |          0 | none in this path                            |
| First Capital      |          0 | none in this path                            |
| SkyHarbor Air      |          0 | none in this path                            |

### `src/scripts/setup-data/<tenant>/07_sourcing_artifacts/` and `08_program_deliverables/`

| Tenant substrate folder   |                Sourcing artifacts |              Program deliverables | Notes                                                                      |
| ------------------------- | --------------------------------: | --------------------------------: | -------------------------------------------------------------------------- |
| `apex-data`               |                                 4 |                                 4 | Complete enough for Packet 34 Apex run                                     |
| `firstcapital-data`       |                           present |                           present | Folder exists with 14 setup families                                       |
| `northstar-clinical-data` |                                 2 |                                 2 | Medtech substrate present                                                  |
| Meridian                  | not found under setup-data folder | not found under setup-data folder | Loader exists, source appears elsewhere                                    |
| SkyHarbor                 | not found under setup-data folder | not found under setup-data folder | Airline overlay exists through prior corpus path, not this setup-data path |

## 8. Required Section 9.2 Work

Proceed with Section 9.2 before Acts 1-7. Recommended narrow PR scope:

1. Add runtime artifact standards registry for Packet 34 quality cards, backed by `createCxoArtifactStandard`.
2. Add standards for at least:
   - `executive_briefing_memo`
   - `strategic_decision_paper`
   - `quarterly_executive_memo`
   - `business_case_pack`
   - `solution_architecture_pack`
   - `estimate_financial_model`
   - `mobilization_plan`
   - `source_rfp_package`
   - `source_bafo_recommendation`
   - `tower_quarterly_review`
3. Add the three missing Intelligence/Tower templates:
   - `src/lib/deliverables/templates/executive_briefing_memo.ts`
   - `src/lib/deliverables/templates/strategic_decision_paper.ts`
   - `src/lib/deliverables/templates/quarterly_executive_memo.ts`
4. Add tests proving:
   - every Packet 34 required artifact kind resolves to a standard
   - every new template has sections, worked examples, rubric criteria, prompt template, and production maturity
   - board-circulation thresholds are enforced

After that PR lands, Acts 1-7 can run with honest quality cards instead of subjective scoring.

## 9. Acceptance Checklist

- [x] Framework inventory document produced.
- [x] Gap analysis identifies specific files needed.
- [x] Pre-Act 0 recommends pause for Section 9.2 gap-fill before Act 1.
- [ ] Section 9.2 gap-filler templates and standards shipped.
- [ ] Founder review complete before Act 1 begins.
