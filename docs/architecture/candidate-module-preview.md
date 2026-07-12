# Candidate Module Preview

Status: implementation baseline for read-only candidate inspection.

Candidate module preview is the non-destructive bridge between an inactive
candidate tenant data version and future module-specific preview screens. It
lets operators inspect what Home and Intelligence would see if a candidate were
later promoted, without changing active tenant truth.

## Boundary

The preview reads:

- candidate tenant data version metadata
- canonical ingestion records
- target-writer dry-run operations
- module-readiness proof
- candidate promotion-gate result

The preview does not:

- write production tenant data
- update the Active Tenant Access Layer
- promote a candidate
- change Home or Intelligence runtime routes
- let modules read candidate data by default

## Output Contract

`npm run audit:candidate-module-preview` writes:

- `reports/candidate-module-previews/skyharbor/home-context-preview.json`
- `reports/candidate-module-previews/skyharbor/intelligence-context-preview.json`
- `reports/candidate-module-previews/skyharbor/candidate-module-preview-proof.json`
- `reports/candidate-module-previews/skyharbor/preview-summary.json`
- `reports/candidate-module-previews/skyharbor/preview-summary.md`

The packets are shaped like module context packets but include explicit preview
guardrails:

- `previewMode: true`
- `runtimeEligible: false`
- `readOnlyPreview: true`
- `activeTenantAccessLayerUpdated: false`
- `candidatePromoted: false`
- `moduleRuntimeRoutesChanged: false`
- `noModuleReadsCandidateByDefault: true`

## Home Preview

The Home preview renders the candidate as an enterprise profile packet:

- top candidate entities
- domain and object-type chart inputs
- evidence coverage
- quality mix
- preview warnings and blockers

This is designed to support future operator preview UI. It is not consumed by
the live Home route.

## Intelligence Preview

The Intelligence preview renders the candidate as an advisory-readiness packet:

- answerability score for preview only
- citation candidates
- safe recommended questions
- blocked claims
- preview warnings and blockers

The answerability score is not a runtime answer-quality claim. It reflects only
candidate record count, evidence coverage, and promotion-gate health.

## Promotion Relationship

Candidate module preview can pass while promotion remains disabled. That is the
expected state. Promotion still requires a separate operator-approved gate and a
future Active Tenant Access Layer update.

## Truth Split

This is a proof/reporting capability. It is not live module consumption, not a
database write path, and not active tenant promotion.
