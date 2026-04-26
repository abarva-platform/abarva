Date: 2026-04-26
Slice: BAFO Negotiation Deterministic Read Model
Status: done

## Scope

- Add deterministic BAFO/negotiation read model for Source after vendor response completeness and pricing normalization.
- Do not perform model calls, uploads, parsing, or live workflow mutations.
- Provide reusable outputs for downstream panels and dashboard surfaces.

## Files

- `src/lib/source/bafo-negotiation.ts`
- `src/lib/source/bafo-negotiation-types.ts`
- `src/lib/source/index.ts`
- `src/__tests__/integration/source/source-bafo-negotiation.test.ts`

## Inputs

- `SourceVendorResponseSeedInput` rows from seeded event (`getSourceVendorResponseSeed`).
- Pricing snapshots (`buildSourcePricingNormalization`) or seeded pricing rows.
- Optional event-level data readiness rows.

## Outputs

- `SourceBafoNegotiationPlan` containing:
  - deterministic per-vendor negotiation plans,
  - overall readiness, assumptions, exclusion scope, trap summaries,
  - prioritized BAFO actions,
  - sentinel/steward/atlas notes,
  - blockers and next action.

## Validation behavior

- Deterministic outputs for seeded event.
- Vendor-specific questions and asks are deterministic by vendor profile.
- Vendor B remains non-comparable due missing pricing template and transition details.
- Vendor A receives explicit exclusion-related BAFO follow-up prompts.
- Vendor C receives automation/evidence follow-up prompt when weak evidence signals exist.

## Design compliance / guardrails

- No model/chat API calls.
- No parsing/upload path.
- No scorecard write state, no workflow engine calls, no selection automation.
- No `/api` changes.
- No auth changes.

## Test coverage

- `npx jest src/__tests__/integration/source/source-bafo-negotiation.test.ts`

## Risks / follow-up

- Exclusion list normalization still relies on seeded vocabulary and deterministic normalization behavior.
- BAFO panel surface remains a separate downstream slice.
