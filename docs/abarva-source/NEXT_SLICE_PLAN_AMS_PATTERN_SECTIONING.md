# Next Slice Plan: AMS Pattern Runtime Sectioning

## 1. Purpose Of Sectioning

The AMS Managed Services Sourcing pattern is now authored as a full markdown pattern pack. The next controlled slice should split that authored IP into stable, machine-addressable sections so Source can later retrieve, cite, validate, and apply the right pattern material without loading the entire document.

Sectioning is a documentation/spec bridge. It prepares the pattern for later runtime use, but does not implement ingestion, manifest generation, retrieval, SourceAgentContextBundle wiring, validation fixtures, or product logic.

The sectioned form should make it clear:

- which AMS pattern section is being used;
- why it applies to the sourcing event or stage;
- whether it supports guidance, artifact generation, pricing, scorecard governance, negotiation, validation, or product logic;
- which agent can use it;
- what inputs are required before it can support decision-grade output;
- how it should be cited later.

## 2. Why Sectioning Comes Before Manifest Or Runtime Ingestion

Sectioning should come before manifest/runtime ingestion because the authored pattern needs a stable contract before code depends on it.

Reasons:

- Manifest entries need stable section ids, titles, types, stage tags, and usage tags.
- Runtime context assembly should retrieve sections, not an entire large markdown pattern.
- Nexus, Sentinel, Atlas, and Steward need different section subsets.
- Artifact generation needs RFP, scorecard, pricing, artifact, and evidence sections separated.
- Workflow validation needs deterministic gate and failure-mode sections separated from advisory guidance.
- Future citations should point to pattern id, version, and section id.
- Product logic promotion decisions require a distinction between guidance-only content and enforceable gates.

Do not create a manifest before section boundaries are stable.

## 3. Proposed Section IDs For The 28 AMS Pattern Sections

Pattern id: `source.ams-managed-services-sourcing.v1`

Recommended section id prefix: `source.ams.v1`

| Parent Section | Proposed Section ID | Title | Primary Section Type |
| --- | --- | --- | --- |
| 1 | `source.ams.v1.identity` | Pattern Identity | structural |
| 2 | `source.ams.v1.executive-thesis` | Executive Thesis | guidance |
| 3 | `source.ams.v1.applicability` | Applicability | guidance |
| 4 | `source.ams.v1.detection-signals` | Detection Signals | guidance |
| 5 | `source.ams.v1.anti-signals` | Anti-Signals | guidance |
| 6 | `source.ams.v1.required-data-baseline` | Required Data Baseline | validation |
| 7 | `source.ams.v1.diagnostic-questions` | Diagnostic Questions | guidance |
| 8 | `source.ams.v1.scope-model` | Scope Model | artifact |
| 9 | `source.ams.v1.retained-vendor-responsibility` | Retained vs Vendor Responsibility Model | artifact |
| 10 | `source.ams.v1.rfp-section-library` | RFP Section Library | artifact |
| 11 | `source.ams.v1.artifact-templates` | Artifact Templates | artifact |
| 12 | `source.ams.v1.scorecard-defaults` | Scorecard Defaults | scorecard |
| 13 | `source.ams.v1.pricing-model-library` | Pricing Model Library | pricing |
| 14 | `source.ams.v1.pricing-normalization-rules` | Pricing Normalization Rules | pricing |
| 15 | `source.ams.v1.commercial-traps` | Commercial Traps | negotiation |
| 16 | `source.ams.v1.negotiation-levers` | Negotiation Levers | negotiation |
| 17 | `source.ams.v1.transition-risks` | Transition Risks | validation |
| 18 | `source.ams.v1.stage-gates-validation-rules` | Stage Gates / Validation Rules | product_logic |
| 19 | `source.ams.v1.failure-modes` | Failure Modes | validation |
| 20 | `source.ams.v1.value-levers` | Value Levers | guidance |
| 21 | `source.ams.v1.benchmark-categories` | Benchmark Categories | benchmark |
| 22 | `source.ams.v1.nexus-guidance-examples` | Nexus Guidance Examples | agent_response |
| 23 | `source.ams.v1.sentinel-validation-examples` | Sentinel Validation Examples | agent_response |
| 24 | `source.ams.v1.atlas-executive-summary-examples` | Atlas Executive Summary Examples | agent_response |
| 25 | `source.ams.v1.steward-enforcement-examples` | Steward Enforcement Examples | agent_response |
| 26 | `source.ams.v1.pattern-learning-loop` | Pattern Learning Loop | learning |
| 27 | `source.ams.v1.related-patterns` | Related Patterns | structural |
| 28 | `source.ams.v1.implementation-notes` | Implementation Notes | structural |

## 4. Section Schema

Each section should use a stable markdown schema so it can later become manifest metadata or runtime context without rewriting the authored content.

Recommended schema:

```yaml
sectionId: source.ams.v1.required-data-baseline
parentPatternId: source.ams-managed-services-sourcing.v1
parentPatternVersion: "0.1"
title: Required Data Baseline
sectionType: validation
applicableStages:
  - Strategy
  - Scope
  - RFP
agents:
  - Nexus
  - Sentinel
  - Steward
usage:
  - readiness
  - rfp_tiering
  - evidence_check
requiredInputs:
  - application inventory
  - ticket volumes by severity
  - current support model
outputUsage:
  - minimum data request
  - scope readiness explanation
  - RFP Rich / Outline / Stub decision
validationUsage:
  - block Rich RFP if required inputs are missing
sourceSection: "AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#6-required-data-baseline"
status: draft
```

Required fields:

- `sectionId`
- `parentPatternId`
- `parentPatternVersion`
- `title`
- `sectionType`
- `applicableStages`
- `agents`
- `usage`
- `requiredInputs`
- `outputUsage`
- `validationUsage`
- `sourceSection`
- `status`

Optional fields:

- `confidenceRules`
- `antiSignals`
- `evidenceRequirements`
- `citationRules`
- `productLogicPromotionCandidate`
- `reviewOwner`

## 5. Section Type Mapping

| Section ID | Guidance | Artifact | Validation | Negotiation | Scorecard | Pricing | Product Logic |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `source.ams.v1.identity` | no | no | no | no | no | no | no |
| `source.ams.v1.executive-thesis` | yes | no | no | no | no | no | no |
| `source.ams.v1.applicability` | yes | no | yes | no | no | no | no |
| `source.ams.v1.detection-signals` | yes | no | yes | no | no | no | no |
| `source.ams.v1.anti-signals` | yes | no | yes | no | no | no | no |
| `source.ams.v1.required-data-baseline` | yes | yes | yes | no | no | no | yes |
| `source.ams.v1.diagnostic-questions` | yes | yes | no | no | no | no | no |
| `source.ams.v1.scope-model` | yes | yes | yes | no | no | no | no |
| `source.ams.v1.retained-vendor-responsibility` | yes | yes | yes | no | no | no | no |
| `source.ams.v1.rfp-section-library` | yes | yes | yes | no | no | no | no |
| `source.ams.v1.artifact-templates` | yes | yes | yes | no | no | no | no |
| `source.ams.v1.scorecard-defaults` | yes | no | yes | no | yes | no | yes |
| `source.ams.v1.pricing-model-library` | yes | yes | no | yes | no | yes | no |
| `source.ams.v1.pricing-normalization-rules` | yes | yes | yes | yes | no | yes | yes |
| `source.ams.v1.commercial-traps` | yes | no | yes | yes | no | yes | no |
| `source.ams.v1.negotiation-levers` | yes | no | no | yes | no | yes | no |
| `source.ams.v1.transition-risks` | yes | yes | yes | no | no | no | yes |
| `source.ams.v1.stage-gates-validation-rules` | yes | no | yes | no | no | no | yes |
| `source.ams.v1.failure-modes` | yes | no | yes | no | no | no | yes |
| `source.ams.v1.value-levers` | yes | yes | yes | yes | no | yes | no |
| `source.ams.v1.benchmark-categories` | yes | no | yes | no | no | yes | no |
| `source.ams.v1.nexus-guidance-examples` | yes | no | no | no | no | no | no |
| `source.ams.v1.sentinel-validation-examples` | yes | no | yes | no | no | no | no |
| `source.ams.v1.atlas-executive-summary-examples` | yes | no | no | no | no | no | no |
| `source.ams.v1.steward-enforcement-examples` | yes | no | yes | no | no | no | yes |
| `source.ams.v1.pattern-learning-loop` | yes | no | no | no | no | no | no |
| `source.ams.v1.related-patterns` | yes | no | no | no | no | no | no |
| `source.ams.v1.implementation-notes` | yes | no | no | no | no | no | no |

## 6. Mapping To SourceAgentContextBundle

Future SourceAgentContextBundle pattern context should include only relevant AMS sections for the current event, stage, user intent, and evidence state.

Recommended bundle shape later:

```ts
patternContext: {
  patternId: "source.ams-managed-services-sourcing.v1",
  patternVersion: "0.1",
  matchedSignals: string[],
  antiSignals: string[],
  selectedSections: Array<{
    sectionId: string,
    title: string,
    sectionType: string,
    usage: string[],
    evidenceState: "pattern_guidance" | "client_specific" | "blocked",
    citations: string[]
  }>
}
```

Stage mapping:

| Source Stage | Recommended AMS Sections |
| --- | --- |
| Strategy | identity, executive thesis, applicability, detection signals, anti-signals, value levers, benchmark categories |
| Scope | required data baseline, diagnostic questions, scope model, retained/vendor responsibility, failure modes |
| RFP | RFP section library, artifact templates, pricing model library, scorecard defaults, stage gates |
| Vendor Responses | pricing normalization rules, commercial traps, vendor response validation portions of stage gates, Sentinel examples |
| Evaluation | scorecard defaults, pricing normalization, failure modes, stage gates, transition risks |
| Negotiation | commercial traps, negotiation levers, BAFO guidance, value levers |
| Transition | transition risks, retained/vendor responsibility, transition gate, Steward enforcement |
| Verify / Value Realization | value levers, benchmark categories, pattern learning loop, value measurement gate |

## 7. Mapping To Nexus, Sentinel, Atlas, And Steward

### Nexus

Nexus should use AMS sections for:

- event classification;
- scope readiness guidance;
- missing input questions;
- RFP tiering;
- RFP section selection;
- scorecard default explanation;
- pricing trap detection;
- BAFO question generation;
- transition readiness guidance.

Priority sections:

- `source.ams.v1.detection-signals`
- `source.ams.v1.required-data-baseline`
- `source.ams.v1.diagnostic-questions`
- `source.ams.v1.scope-model`
- `source.ams.v1.rfp-section-library`
- `source.ams.v1.scorecard-defaults`
- `source.ams.v1.commercial-traps`
- `source.ams.v1.negotiation-levers`

### Sentinel

Sentinel should use AMS sections for:

- evidence completeness;
- vendor claim support;
- citation readiness;
- scorecard rationale checks;
- uploaded document citation checks;
- pricing normalization completeness.

Priority sections:

- `source.ams.v1.required-data-baseline`
- `source.ams.v1.pricing-normalization-rules`
- `source.ams.v1.stage-gates-validation-rules`
- `source.ams.v1.failure-modes`
- `source.ams.v1.sentinel-validation-examples`

### Atlas

Atlas should use AMS sections for:

- CIO sourcing brief;
- CFO value/risk brief;
- steering committee decision memo language;
- value confidence caveats;
- portfolio risk implications.

Priority sections:

- `source.ams.v1.executive-thesis`
- `source.ams.v1.value-levers`
- `source.ams.v1.benchmark-categories`
- `source.ams.v1.transition-risks`
- `source.ams.v1.atlas-executive-summary-examples`

### Steward

Steward should use AMS sections for:

- gate enforcement;
- waiver requirement explanations;
- approval owner checks;
- artifact readiness;
- transition readiness;
- value realization readiness.

Priority sections:

- `source.ams.v1.required-data-baseline`
- `source.ams.v1.stage-gates-validation-rules`
- `source.ams.v1.scorecard-defaults`
- `source.ams.v1.transition-risks`
- `source.ams.v1.steward-enforcement-examples`

## 8. Mapping To RFP Generation

The sectioned AMS pattern should later drive RFP generation through specific sections instead of a single broad prompt.

RFP generation section usage:

- Intake and scope narrative: `executive-thesis`, `applicability`, `scope-model`.
- Minimum data request: `required-data-baseline`, `diagnostic-questions`.
- RFP package sections: `rfp-section-library`.
- Responsibility matrix: `retained-vendor-responsibility`.
- Pricing template: `pricing-model-library`, `pricing-normalization-rules`.
- Scorecard: `scorecard-defaults`.
- Vendor Q&A and BAFO: `commercial-traps`, `negotiation-levers`.
- Transition plan: `transition-risks`, `stage-gates-validation-rules`.

Rich / Outline / Stub behavior:

- Rich output requires client-specific baseline evidence for app inventory, criticality, support model, ticket volumes, support hours, SLA expectations, retained roles, and cost baseline.
- Outline output can use AMS pattern structure with explicit missing inputs and assumptions.
- Stub output should produce a minimum data request and diagnostic questions, not a pretend complete RFP.

## 9. Mapping To Scorecard Defaults

The scorecard section should remain isolated because it can influence evaluation behavior and product gates later.

Scorecard section requirements:

- preserve criteria and weights;
- preserve rationale and evidence required;
- preserve increase/decrease guidance;
- preserve scoring red flags;
- preserve material override rule for Commercial competitiveness and Transition capability;
- preserve section citation so scorecard overrides can reference the AMS pattern.

Future scorecard usage:

- Nexus explains default weights and override tradeoffs.
- Sentinel checks whether scorecard rationale and evidence exist.
- Steward blocks evaluation if the scorecard is not locked.
- Atlas summarizes scorecard implications in decision packages.

## 10. Mapping To Workflow Validation

The sectioned pattern should map to deterministic workflow validation without implementing new validation code in the sectioning slice.

Potential future validation mappings:

| Validation Need | AMS Section |
| --- | --- |
| Cannot release RFP without app inventory and pricing template | required data baseline, stage gates |
| Cannot treat vendor pricing as comparable without normalization | pricing normalization rules |
| Cannot evaluate before scorecard lock | scorecard defaults, stage gates |
| Cannot approve vendor selection without selection memo evidence | artifact templates, stage gates |
| Cannot mobilize transition without KT/access/readiness plan | transition risks, stage gates |
| Cannot claim realized value without baseline and owner | value levers, stage gates |
| Cannot cite unparsed uploaded vendor response | Sentinel examples, stage gates |

Workflow validation should distinguish:

- pattern guidance;
- section-derived validation rule;
- product gate;
- waiver-required state;
- intentional defer because evidence or parsing is not ready.

## 11. What Not To Implement

Do not implement in the sectioning slice:

- runtime code;
- SourceAgentContextBundle changes;
- generated JSON;
- manifest changes;
- pattern ingestion;
- vector retrieval;
- graph retrieval;
- database migrations;
- API routes;
- model calls;
- upload/parsing;
- RFP generation;
- scorecard UI;
- workflow engine;
- approval engine;
- artifact versioning;
- document export/import;
- event canvas;
- chat UI;
- vendor flow;
- `/programs`, `/preview`, or `/demo` work.

## 12. Acceptance Criteria

The sectioning implementation slice is acceptable when:

- each AMS parent section has a stable section id;
- every section records parent pattern id and version;
- every section records title, type, stages, agent usage, output usage, and source link;
- validation-oriented sections identify validation usage;
- artifact-oriented sections identify artifact output usage;
- scorecard-oriented sections preserve criteria, weights, and override guidance;
- pricing and negotiation sections preserve normalization, traps, and levers;
- section files remain docs-only markdown;
- no generated JSON or runtime manifest is created;
- no Source runtime code is changed;
- review packet confirms inventory, section id coverage, and runtime-readiness gaps.
