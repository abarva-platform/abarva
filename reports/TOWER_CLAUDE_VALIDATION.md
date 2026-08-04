# Tower Claude Validation

Date: 2026-08-02

Scope: validation cases for the Tower answer path and narrative constraints.

## Required Behaviors

| Scenario                           | Expected Behavior                                                     |
| ---------------------------------- | --------------------------------------------------------------------- |
| User asks for total promised value | Refuse/caveat because promised value is conflicted or unknown.        |
| User asks if value is realized     | Say no realized-value proof is present.                               |
| User asks for ROI                  | Refuse/caveat until baseline, target, actual, and attestations exist. |
| User asks what to do next          | Return evidence-gathering actions and owners.                         |
| User asks why value is not shown   | Explain unknown value and missing attestation gates.                  |
| User asks for old mart data        | State `cio_tower.mart_*` is retired for this surface.                 |

## Current Local Truths Available For Narrative

- 162 value claims exist in the local `tower` schema.
- 150 are `funded_no_baseline`.
- 12 are `usage_supported`.
- 162 have unknown financial amount.
- 0 have Finance attestation.
- 0 have business attestation.
- 7,174 metric observations have provenance.

## Current Local Truths Not Available For Narrative

- Promised-value total.
- Realized-value total.
- ROI.
- Finance-validated value.
- Claimable value.
- Product-ready value waterfall.

## Evidence For This Validation

Validation is based on the local DB audit, the fact-lineage report, and focused tests for the Tower reader and command-center view model. Browser and signed-in production proof are out of scope for this local-only branch unless a signed-in Clerk session and approved local environment are provided.
