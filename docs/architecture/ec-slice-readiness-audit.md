# Non-Serving Context Slice: Advisory Readiness Audit

Status: local contract proof, 2026-10-17. The dormant decision-request helper now explicitly requires strict readiness. The generic bundle default and existing product callers are unchanged.

## Boundary

Layer 2 emits source-linked candidates; Layer 3 owns their declared identity and governance. Products remain projections. This audit uses in-memory fictional fixtures and reads repository code only. It does not ingest the private candidate package, query a database, call a model, or access cloud resources.

The new candidate floor is `agent_readiness_status: blocked`, `downstream_context_policy: exclude`, `not_indexed`, and no cite-render proof. Tests exercise each independent refusal as well as their combination. Forging an otherwise complete `agent_ready` record does not override `exclude`; clearing `exclude` does not override `blocked`.

## Direct Caller Inventory

The TypeScript AST test scans runtime JavaScript/TypeScript under `src`, `scripts`, and `tests`, excluding declarations, test/spec files and mock/test directories. It recognizes named import aliases, namespace imports and the local decision helper. Comments, strings and type references are not call sites. The exact inventory is asserted, so added direct callers and changed readiness options require review.

There are 23 direct `buildValidatedAgentContextBundle` calls: 20 in `src`, three in `scripts`. Seven set `requireAgentReady: true`, eleven explicitly set false, four omit it, and one forwards options. There are no runtime calls to `buildDecisionReasoningRequest` in these scanned roots. Its definition calls the bundle builder once and is included below.

All paths below are repository-relative. `Omitted` preserves the existing non-strict bundle default; it is not evidence of a leak.

| File                                                                | Enclosing Function                                                              | Readiness    | Context                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------ |
| `scripts/deliverables/proof/purpose-fresh-source.ts`                | `main`                                                                          | False        | Operator proof script; not executed by this audit                        |
| `scripts/ecl/build_home_ecl_narrative_layer.ts`                     | `buildGovernedSignalPacket` (two calls)                                         | True         | Projection rows and derived signals separately admitted                  |
| `src/lib/ecl/insights/home-admission.ts`                            | `validateHomeInsightAdmission`                                                  | True         | Exact-content and lineage admission                                      |
| `src/lib/governance/agent-context-bundle.ts`                        | `buildDecisionReasoningRequest`                                                 | True         | Dormant reasoning-envelope helper; strict before any future adoption      |
| `src/lib/intelligence/ask/executive-context.ts`                     | `prepareExecutiveContext`                                                       | Omitted      | Provisional sources plus explicit advisory restrictions                  |
| `src/lib/knowledge/agent-context-broker.ts`                         | `withGovernance`                                                                | Omitted      | Adds a verdict; does not filter the original items                       |
| `src/lib/programs/evidence-readiness/exact-source-preparation.ts`   | `prepareExactSourcePlan`                                                        | True         | Asserts that pending evidence is not admitted                            |
| `src/lib/programs/move-agent-admission.ts`                          | `admitMoveSources`                                                              | True         | Requires one admitted candidate per source                               |
| `src/lib/source/archetypes/grounded-answer.ts`                      | `buildGroundedSourceAnswer`                                                     | Omitted      | Postfilters survivors to `agent_ready` for answer evidence and citations |
| `src/lib/source/ava/award-readiness-governed-answer.ts`             | `buildAwardReadinessGovernedAnswer`                                             | False        | Governed answer builder                                                  |
| `src/lib/source/ava/bafo-instructions-governed-answer.ts`           | `buildBafoInstructionsGovernedAnswer`                                           | False        | Governed answer builder                                                  |
| `src/lib/source/ava/event-context-bundle.ts`                        | `buildGovernedEventContextBundle`                                               | Forwarded    | Identity, acceptance and review fences before governance                 |
| `src/lib/source/ava/evidence-readiness-governed-answer.ts`          | `buildEvidenceReadinessGovernedAnswer`                                          | False        | Registered-evidence report render gate                                   |
| `src/lib/source/ava/pricing-comparison-governed-answer.ts`          | `buildPricingComparisonGovernedAnswer`                                          | False        | Governed answer builder                                                  |
| `src/lib/source/ava/rfp-design-governed-answer.ts`                  | `buildRfpDesignGovernedAnswer`                                                  | False        | Governed answer builder                                                  |
| `src/lib/source/ava/selection-decision-governed-answer.ts`          | `buildSelectionDecisionGovernedAnswer`                                          | False        | Governed answer builder                                                  |
| `src/lib/source/ava/value-ledger-governed-answer.ts`                | `buildValueLedgerGovernedAnswer`                                                | False        | Governed answer builder                                                  |
| `src/lib/source/ava/vendor-coverage-governed-answer.ts`             | `buildProfileGroundedVendorCoverageAnswer`, `buildVendorCoverageGovernedAnswer` | False (both) | Proposal-profile and lever-fact paths                                    |
| `src/lib/source/new-workspace/event-intelligence.ts`                | `buildSourceNewEventIntelligence`                                               | True         | Admitted artifact IDs select evidence families                           |
| `src/lib/source/vendor-proposals/governed-vendor-proposal-facts.ts` | `buildGovernedVendorProposalFactBundle`                                         | False        | Proposal facts remain explicitly provisional                             |
| `src/scripts/context-healthcheck/client-context-healthcheck.ts`     | `bundleProbe`                                                                   | Omitted      | Diagnostic probe; not executed by this audit                             |

The forwarded event wrapper has three direct runtime consumers. Artifact-quality and evidence-readiness answer builders pass false; the Source ask route uses default options in a shadow comparison. A shadow comparison is not an enforced serving filter. The tests execute the pure event wrapper with both readiness modes and clearance options, asserting that refused content is redacted.

## Proven Locally

- Every inventoried readiness option pattern excludes blocked, quarantined, retired and downstream-excluded fixtures from `usable`, citations and ready counts, across every tenant supplied by `CANONICAL_TENANT_KEYS`. Both mixed bundles and candidate-only bundles are tested. Sensitive/restricted clearance cannot override those hard refusals.
- Strict advisory mode rejects unreviewed, committed or restricted-readiness candidates, missing tenant binding, missing source/confidence/cite-render fields, and unindexed states. Fully ready controls pass with either supported Azure-native index state.
- The actual decision helper excludes blocked/excluded candidates and now explicitly requires `agent_ready`. A regression first reproduced provisional admission in the old implementation. The corrected helper refuses provisional-only requests and removes unready context and citations from mixed requests across every canonical tenant. Fully ready controls pass with both supported Azure-native index states. The generic diagnostic default still retains otherwise-valid provisional candidates. No runtime helper caller was found; no serving leak or product activation is claimed.
- The actual enterprise-item adapter preserves camel-case `downstreamContextPolicy: exclude` into the governed candidate and the bundle refuses it.
- The actual grounded-answer builder refuses to answer from provisional or blocked/excluded evidence and produces no answer citations from it, despite the bundle's non-strict default.
- The actual executive adapter keeps sources provisional and emits its advisory restrictions. This is a compatibility contract, not strict admission or proof that a model obeys the restrictions.
- The actual event wrapper excludes the same refused fixtures from `admitted` and citations, and strips their content from refusals.
- An additional AST guard finds no runtime `src` import, re-export, literal dynamic import or literal `require` connecting the new candidate adapter, candidate types, rules or V6 shadow planner to a runtime consumer. This proves the current static module boundary, not database selection or arbitrary dynamic loading.

## Gaps And Limits

The generic bundle's `requireAgentReady` option remains opt-in. Changing that default affects existing diagnostic/provisional contracts and is outside this follow-up. Only the dormant decision helper independently sets true; existing product callers and diagnostic options are unchanged.

Governance results still carry blocked candidates in diagnostic fields. Consumers must use the admitted list and its citations, not serialize the entire result. The broker explicitly attaches a verdict without filtering its original `items`; this test does not certify all broker consumers or every answer table/prompt serializer. Several existing converters construct provisional candidates from their own domain records. Their retention of future candidate-specific holds must be reviewed before any new reader is connected.

`requireAgentReady: true` enforces the current policy evaluator, not independent proof authenticity. The bundle derives provenance from `source_basis`; it does not independently read a manifest, confirm an index, verify a source hash, or reproduce a citation render. Fixture readiness is a positive control only. No proof timestamp or provenance is certified by this audit.

The scanner inventories direct calls and supported imports, not arbitrary higher-order aliases, reflection or a whole-program dataflow proof. AST option checks plus executable fixtures prove the shared admission contract used by these callers; they do not execute database-backed builders, scripts, product routes or model calls. A future barrel export or dynamic invocation needs explicit inventory work.

The new adapter's raw-byte mapping, physical row holds and absence of serving selection belong to the adapter and integration proof. This audit's generic fixtures do not substitute for that evidence. A claim that the actual private package cannot reach any model additionally needs exact-version adapter output, complete reader wiring review and downstream serialization proof. Indexing, retrieval, cited render, promotion, production deployment and signed-in proof remain owed and are not implied by passing unit tests.

## Validation

Run on Node 24:

```sh
node node_modules/jest/bin/jest.js --runInBand --runTestsByPath \
  src/lib/governance/__tests__/ec-slice-advisory-readiness.test.ts \
  src/lib/governance/__tests__/agent-context-bundle.test.ts
```

Original audit: two suites, 101 tests passed. Follow-up validation is recorded in `docs/releases/records/2026-10-17-decision-request-strict-readiness.md`. This audit claims no data load, product adoption, index or signed-in proof.
