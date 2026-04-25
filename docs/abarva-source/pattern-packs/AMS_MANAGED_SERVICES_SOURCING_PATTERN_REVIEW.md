# AMS Managed Services Sourcing Pattern Review

## Review Context

Reviewed file:

- `docs/abarva-source/pattern-packs/AMS_MANAGED_SERVICES_SOURCING_PATTERN.md`

Source standards used:

- `docs/platform-design/pattern-operating-model/00_PATTERN_OPERATING_MODEL_ANCHOR.md`
- `docs/platform-design/pattern-operating-model/02_PATTERN_AUTHORING_STANDARD.md`
- `docs/platform-design/pattern-operating-model/10_SOURCE_OUTSOURCING_PATTERN_PACK_STANDARD.md`

Scope:

- Documentation/spec authoring only.
- No runtime code.
- No UI.
- No API routes.
- No model calls.
- No pattern ingestion.
- No generated manifest or JSON.

## Completeness Assessment

| Area | Status | Notes |
| --- | --- | --- |
| Pattern identity | Complete | Includes stable id, name, type, domain, archetype, rigor, stages, owner, version, and status. |
| Executive thesis | Complete | Explains why AMS sourcing is complex and why generic RFPs fail. |
| Applicability and anti-signals | Complete | Separates AMS from IMS, digital build, staff augmentation, ERP implementation, and baseline discovery. |
| Detection signals | Complete | Provides 12 signals with confidence, implication, and Nexus follow-up question. |
| Required data baseline | Complete | Defines required, recommended, and optional data with owner, risk if missing, and Rich/Outline/Stub effect. |
| Diagnostic questions | Complete | Provides 15 intake/scope questions with red flags and follow-up actions. |
| Scope model | Complete | Covers major AMS scope dimensions and pricing ambiguity risks. |
| Retained/vendor responsibility model | Complete | Defines what usually remains retained and what can move to the vendor. |
| RFP section library | Complete | Provides AMS-specific sections, inputs, tier behavior, and pitfalls. |
| Artifact templates | Complete | Maps artifacts to stages, inputs, reviewers, evidence, and tier behavior. |
| Scorecard defaults | Complete | Includes the requested default weights and material override guidance. |
| Pricing model library | Complete | Covers fixed fee, T&M, per-app, per-ticket, per-severity, capacity, tower, hybrid, and outcome/gainshare models. |
| Pricing normalization rules | Complete | Defines the dimensions needed to normalize vendor proposals. |
| Commercial traps | Complete | Includes 15 traps with detection signals, impact, questions, and mitigations. |
| Negotiation levers | Complete | Defines 12 levers with evidence needs, value impact, and risks. |
| Transition risks | Complete | Covers common transition risks and where they should be governed. |
| Stage gates and validation rules | Complete | Defines seven gates with block/defer/waiver behavior, Nexus explanation, and Steward enforcement. |
| Failure modes | Complete | Includes 16 AMS-specific failure modes with validation and agent behavior. |
| Value levers | Complete | Defines value mechanism, evidence, confidence, measurement, and value ledger field. |
| Benchmark categories | Complete | Avoids invented market numbers and distinguishes client baseline from external benchmark data. |
| Agent examples | Complete | Includes Nexus, Sentinel, Atlas, and Steward examples. |
| Pattern learning loop | Complete | Defines observations to capture after AMS events. |
| Related patterns | Complete | Connects AMS to adjacent outsourcing, pricing, artifact, and value patterns. |
| Implementation notes | Complete | Explains how the pattern can later become structured sections, context, artifacts, scorecards, validation, and workflow gates. |

## Key Strengths

- The pattern is authored as real sourcing IP rather than thin configuration.
- It makes AMS sourcing distinct from digital build, infrastructure managed services, staff augmentation, and ERP implementation.
- It gives Nexus concrete guidance for intake, scope readiness, RFP tiering, scorecard overrides, pricing trap detection, BAFO, transition readiness, and value confidence.
- It gives Sentinel concrete evidence and citation checks, especially around baseline data, vendor claims, scorecard rationale, and unparsed uploads.
- It gives Steward enforceable gate language for RFP release, evaluation, selection, transition, and value realization.
- It gives Atlas executive-ready language for CIO, CFO, and steering committee use cases.
- It preserves the Rich / Outline / Stub model and makes missing baseline data operationally meaningful.
- It ties pricing, scorecard, transition, validation, and value ledger concepts together instead of treating them as separate documents.

## Gaps

- The pattern is not yet sectioned into machine-addressable chunks with section ids.
- There is no manifest entry, generated JSON, or runtime pattern registry yet by design.
- The pattern does not include actual market benchmark numbers, which is correct for this slice but means benchmark guidance remains category-level.
- Agent examples are representative but not yet mapped to exact UI response modes or the 3 choices plus custom interaction pattern.
- Artifact templates are conceptual and still need later conversion into structured artifact schemas.
- Validation rules are authored but not yet connected to deterministic validation fixtures.
- Pattern learning observations are defined but no capture mechanism exists yet.

## Runtime Sectioning Readiness

Decision: ready for runtime sectioning later.

The file has clean candidate sections for future conversion:

- identity
- thesis
- applicability
- signals
- anti-signals
- required baseline
- diagnostic questions
- scope dimensions
- retained/vendor responsibility
- RFP sections
- artifacts
- scorecard defaults
- pricing models
- normalization rules
- commercial traps
- negotiation levers
- transition risks
- stage gates
- failure modes
- value levers
- benchmark categories
- agent guidance examples
- validation examples
- executive summary examples
- enforcement examples
- learning loop

Recommended future section id pattern:

- `source.ams.v1.identity`
- `source.ams.v1.required-data-baseline`
- `source.ams.v1.rfp-section-library`
- `source.ams.v1.scorecard-defaults`
- `source.ams.v1.pricing-normalization`
- `source.ams.v1.stage-gates`
- `source.ams.v1.nexus-guidance`
- `source.ams.v1.sentinel-validation`
- `source.ams.v1.steward-enforcement`

## What Should Be Authored Next

Recommended next authored pattern pack:

1. IMS Managed Services Sourcing Pattern Pack.

Reason:

- IMS is adjacent to AMS but materially different in assets, SLAs, tooling, cloud/data center scope, security operations, transition risk, and unit pricing.
- Writing IMS next will prove that the Pattern Operating Model can distinguish similar outsourcing archetypes without collapsing them into generic managed services guidance.

Other high-value follow-on patterns:

- Data Platform Managed Services Pattern Pack.
- Cloud Operations Pattern Pack.
- Vendor Evaluation Pattern.
- Pricing Negotiation Pattern.
- Artifact Review and Approval Pattern.
- Value Ledger Pattern.

## Review Decision

Recommended decision: ready for review as a docs-only authored pattern pack.

Recommended next action after review:

- Commit this docs-only pattern pack and review packet in a clean PR.

Do not implement runtime pattern ingestion, generated manifests, vector retrieval, Source context wiring, validation fixture changes, UI, API routes, or model calls until this authored pattern pack is reviewed.

## Out-of-Scope Confirmation

No runtime code, UI, API route, model call, upload/parsing, generated JSON, pattern manifest, vector/graph retrieval, `/programs`, `/preview`, `/demo`, `ProgramSurface`, or `src/lib/programs/mock.ts` work was done for this review packet.
