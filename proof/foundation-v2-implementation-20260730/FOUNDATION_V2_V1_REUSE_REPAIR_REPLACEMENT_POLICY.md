# Foundation V2 V1 Reuse, Repair And Replacement Policy

Foundation V2 may replace V1 where V1 is wrong, but only through the right mechanism.

## Direct Repair Is Allowed For Mutable Technical Defects

Repair in place when the defect is code or mutable operational implementation state:

- parser code
- source-to-target mappings
- lineage logic
- projection builders
- Cube definitions
- API/provider code
- indexes and constraints
- permissions
- validation gates
- incorrect mutable authority metadata
- UI bindings

These repairs must preserve governed history and pass regression tests.

## Immutable History Must Not Be Silently Overwritten

Do not rewrite in place:

- source releases and hashes
- review decisions
- accepted/deferred/rejected ledgers
- canonical assertions tied to decisions
- immutable publications
- activated baseline membership
- historical deterministic insight observations
- prior proof artifacts

Where governed content is wrong, create a traceable correction, review it, publish a superseding version, activate a replacement baseline only after approval, and retain rollback.

## Replacement Strategy

1. Repair shared technical defects.
2. Build genuinely new V2 structures separately where V1 lacks the business model.
3. Certify the isolated golden slice.
4. After separate human approval, perform controlled replacement: freeze V1, load complete V2 release, reconcile, create V2 publications, activate V2 baseline, switch provider, run product proof, and retain V1 rollback window.
