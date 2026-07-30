# Foundation V2 Proof Index

## Authoritative Inputs

- Approved architecture ZIP: `/Users/anand/Projects/nexus-foundation-v2-b1-reapproval/proof/foundation-v2-b1-reapproval-20260730/knowledge-foundation-data-architecture-book-20260730-b1-reapproval.zip`
- Approved architecture ZIP SHA-256: `ee47e89aa3a46ccd46fca9816ca0a83db12c80b1cac81a81c51f37521568d3ff`
- Frozen V1 checkpoint ZIP: `/Users/anand/Downloads/airline-v1-data-layer-checkpoint-2026-07-30.zip`
- Frozen V1 checkpoint ZIP SHA-256: `e58f0c77c939a41a8c519da92cf337bf9adb692298540d0de8c064bee057c397`

## Local Proof Outputs

- `FOUNDATION_V2_IMPLEMENTATION_LEDGER.md`
- `FOUNDATION_V2_TASK_REGISTER.csv`
- `FOUNDATION_V2_DEFECT_REGISTER.csv`
- `FOUNDATION_V2_GPT_REVIEW_REGISTER.csv`
- `FOUNDATION_V2_DEPLOYMENT_REGISTER.csv`
- `FOUNDATION_V2_WRITE_OWNERSHIP_MATRIX.csv`
- `FOUNDATION_V2_V1_REUSE_REPAIR_REPLACEMENT_POLICY.md`
- `FOUNDATION_V2_V1_COMPONENT_CLASSIFICATION.csv`
- `FOUNDATION_V2_V1_OBJECT_INVENTORY.csv`
- `foundation-v2-approved-package-validation.json`
- `golden-slice-migration-apply-proof.json`
- `golden-slice-gate-proof.json`

## Completed Local Checks

- `npm run test:foundation-v2-package` - PASS.
- Approved package validation with explicit architecture/checkpoint SHA-256 inputs - PASS.
- `npm run test:foundation-v2-migration` - PASS for `20260730120000_foundation_v2_golden_slice_core.sql`.
- `npm run test:foundation-v2-migration:apply` - PASS against a temporary local PostgreSQL cluster; see `golden-slice-migration-apply-proof.json`.
- `npm run test:foundation-v2-golden-slice` - PASS.
- Golden-slice executable fixture/failure-injection proof emission - PASS.
- `npm run release:check` - PASS.

## Pending Proof

- Golden-slice layer proof.
- PR, CI, merge and governed lab execution references.
