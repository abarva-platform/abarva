# 2026-08-24-ecl-contract-realism-gates — ECL Contract Realism Gates

## Release ID

`2026-08-24-ecl-contract-realism-gates`

## Status

`candidate`

## Plain-English Summary

This change makes the dense synthetic source-room contract register behave like a realistic commercial portfolio instead of a flat one-contract-per-supplier list. It adds explicit validation for supplier concentration and contract-value concentration before the generated data can be used in ECL layer proofs.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 client-intake simulation changes only. The dense source-room generator now produces concentrated supplier relationships and contract values, and the validator fails if the commercial distribution becomes too flat.

Layer 3 and Layer 4 outputs are affected only when the generated package is rebuilt by the existing ECL loaders. No runtime route, database schema, migration, or product default provider is changed by this PR.

## Client Applicability

- All clients: No direct runtime impact.
- Specific clients: None.
- Internal only: Synthetic dense source-room generation and local/Azure data-build proof inputs.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ecl/generate_dense_source_room_extracts.py`
- `scripts/ecl/validate_dense_source_room_extracts.py`

## QA / Validation

- `npm run ecl:source-room-dense:generate` passed.
- `npm run ecl:source-room-dense:validate` passed.
- `npm run ecl:source-room-source-layer:load` passed.
- `npm run ecl:source-room-context-layer:load` passed with planted FK failures rejected.
- `npm run ecl:source-room-commercial-layer:load` passed with planted FK failures rejected.
- `npm run ecl:source-room-review-layer:load` passed with planted failures rejected.
- `npm run ecl:source-room-source-projection:load` passed with Home, Source, Tower, and Intelligence projection rows produced locally and planted failures rejected.
- `npm run ecl:source-room-cube-layer:load` passed with cube FK drift checks at zero and planted failures rejected.

Observed commercial realism after regeneration:

- 230 contracts
- 101 distinct suppliers
- 2.28 contracts per supplier
- top supplier holds 8 contracts
- top-decile contract value share is 40.51%
- largest single contract is 2.53% of total annualized contract value

## Rollout Plan

Merge to `main`. The next governed ECL ACA data-build job can then rebuild the dense source-room package from the committed generator and reload the ECL lab/preprod slice.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this source-generation-only PR.
- Shared runtime mutators: None.
- Approved image digest: Not applicable in this PR.
- ACA runtime invariant: Not applicable in this PR.
- Worker image invariant: Not applicable in this PR.
- Feature/env flag update path: None.
- Live signed-in proof required: No, because this PR does not repoint product routes or claim browser proof.

## Rollback Plan

Revert this PR to restore the prior synthetic contract generation and validation gates. Any data-build job already run from this change should be superseded by a new governed load from the reverted SHA if rollback is required.

## Audit Evidence

- Local generation and validation command output.
- Local ECL source/context/commercial/review/projection/cube load command output.
- Release record in this file.

## Known Gaps

This does not execute Azure data-plane mutation. It also does not make Home narrative chapters ECL-native; that remains a separate product-bundle issue before browser-proof or default-provider repointing.
