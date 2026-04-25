# Context Depth For Fixture Defers Review

Date: 2026-04-24

Status: implementation review packet for deterministic context-depth slice.

## 1. Files Changed

Created:

- `docs/abarva-source/build-pack/implementation-reviews/07_CONTEXT_DEPTH_FOR_DEFERS_REVIEW.md`

Updated:

- `src/lib/source/mock-seed.ts`
- `src/lib/source/context-builder.ts`
- `src/lib/source/agent-validation-fixtures.ts`
- `src/lib/source/agent-validation-runner.ts`
- `CYCLE_STATE.md`

No Source UI files, API routes, model runtimes, upload/parsing handlers, event canvas, scorecard UI, artifact drawer, value ledger UI, vendor workflow, `/programs`, `/preview`, or `/demo` files were modified.

## 2. Seeded Context Added

### Data & AI Modernization Pattern Sections

Added deterministic pattern-section seed context for Data & AI Modernization Sourcing:

- applicability
- detection signals
- required inputs
- scorecard rationale
- common risks
- stage gate guidance
- value levers
- evidence requirements

These are seed/pattern guidance records only. They are not model-generated and are not client-uploaded evidence.

### Scorecard Default Context

Added deterministic default scorecard weights for Data & AI Modernization:

- Data platform modernization capability: 20%
- Migration factory / delivery approach: 15%
- Domain/data model expertise: 15%
- Cloud platform expertise: 15%
- Governance/security/quality: 10%
- Commercial model: 10%
- AI/GenAI enablement roadmap: 10%
- Change/adoption and operating model: 5%

Each default includes rationale. No override history was invented.

### Evidence/Citation Placeholder Scaffolding

Added seed evidence records for:

- Data & AI scorecard rationale
- Data & AI required inputs
- Data & AI sourcing risks
- Data & AI value levers
- Source portfolio value and attention context

These records explicitly represent seed/pattern or seed event-state evidence. They do not claim to be client evidence and do not invent uploaded-file citations.

### Attachment Placeholder Behavior

Added deterministic placeholder attachment behavior for the vendor response prompt:

- placeholder attachment id: `attachment-source-003-vendor-response-placeholder`
- purpose: `vendorResponse`
- parse status: `lowConfidence`
- summary explicitly states no actual uploaded vendor response exists
- key fields mark `placeholder: true` and `clientEvidence: false`
- citations remain empty

This lets the validation layer distinguish "there is a placeholder boundary" from "there is a parsed client file." The fixture remains deferred until a real response is uploaded, parsed, and cited.

## 3. Fixture Outcomes

Before this slice:

- total fixtures: 10
- pass: 4
- defer: 6
- reject: 0
- suite verdict: `defer`

After this slice:

- total fixtures: 10
- pass: 8
- defer: 2
- reject: 0
- suite verdict: `defer`

Changed from DEFER to PASS:

- `source-golden-dashboard-attention`
- `source-golden-dashboard-most-at-risk`
- `source-golden-scorecard-commercial-weight`
- `source-golden-pattern-data-ai-rationale`

Still PASS:

- `source-golden-scope-move-to-rfp`
- `source-golden-scope-missing-data`
- `source-golden-value-projected-realized`
- `source-golden-wait-state-owner`

Still DEFER by design:

- `source-golden-artifact-generate-rfp`
- `source-golden-attachment-vendor-response-summary`

No fixture moved to REJECT.

## 4. Remaining DEFER Rationale

### Generate the RFP

This should remain DEFER because the Scope stage is still blocked by missing client inputs:

- application inventory
- analytics workload baseline
- Scope gate blocker

The runner should not allow final RFP generation while required inputs and gate readiness are incomplete.

### Summarize This Vendor Response

This should remain DEFER because the seeded attachment is intentionally a placeholder, not a parsed uploaded vendor response.

The placeholder makes the boundary explicit:

- no actual vendor response file exists
- no attachment citations exist
- no vendor facts should be summarized
- no vendor comparison should be produced

## 5. Types Added

No new exported TypeScript types were added.

The slice reuses existing Source-owned contracts:

- `SourcePatternSectionContext`
- `SourceEvidenceContext`
- `SourceScorecardSnapshot`
- `SourceAttachment`
- `SourceAttachmentSummary`

The existing contracts were sufficient for deterministic seed depth.

## 6. Runner Behavior

The runner continues to make gaps visible. It does not force all fixtures to pass.

Current remaining gap categories include:

- client-specific citation coverage is incomplete for seed event claims
- Scope client inputs remain missing
- artifact generation remains blocked by missing inputs
- attachment citation is missing for the vendor response placeholder
- attachment summary is placeholder-only, not client evidence
- Digital App Build vendor response still lacks real parsed vendor-response evidence

The recommended remediation now focuses on:

- keeping vendor-response summary deferred until a real uploaded response is parsed and cited
- keeping artifact generation blocked until Scope missing inputs and gate checks are satisfied

## 7. Validation Results

Validation commands run:

```bash
npx eslint src/lib/source/mock-seed.ts src/lib/source/context-builder.ts src/lib/source/agent-validation-fixtures.ts src/lib/source/agent-validation-runner.ts src/lib/source/types.ts
npx tsc --noEmit --pretty false
npx tsx -e "import { getSourceContextValidationReport } from './src/lib/source/agent-validation-runner.ts'; console.log(JSON.stringify(getSourceContextValidationReport(), null, 2));"
```

Results:

- ESLint: passed.
- TypeScript: passed.
- Deterministic runner smoke check: passed.
- Runner summary: 10 total, 8 pass, 2 defer, 0 reject, suite verdict `defer`.

Note: this clean temp worktree required a local `npm ci` before validation because it did not have `node_modules`. `npm ci` completed with existing dependency deprecation/audit warnings, and no source files were changed by dependency installation.

## 8. Boundary Confirmation

Confirmed scope:

- deterministic seed/context validation only
- seeded Source context only
- no UI
- no chat UI
- no API routes
- no model calls
- no real upload/parsing
- no event canvas expansion
- no scorecard UI
- no artifact drawer
- no value ledger UI
- no vendor response flow
- no AI/RFP generation
- no `/programs`, `/preview`, or `/demo` implementation
