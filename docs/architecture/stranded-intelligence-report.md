# Stranded Intelligence Report

Status: dry-run proof harness baseline.

The Stranded Intelligence Report identifies canonical intelligence that has been parsed and planned but is not yet active in the product data layer.

## Inputs

- Tenant Packet dry-run proof bundle.
- Target Writer dry-run proof bundle.

## What It Proves

The report proves that the platform can distinguish:

- source-parsed canonical records,
- target write plans,
- candidate-version plans,
- intelligence that is still not persisted,
- intelligence that is not module-ready,
- intelligence that should not be treated as active tenant truth.

## What It Does Not Prove

It does not prove:

- production database writes,
- candidate version persistence,
- active tenant promotion,
- derived intelligence materialization,
- graph materialization,
- module consumption,
- live answer quality.

## Command

```bash
npm run audit:stranded-intelligence-report
```

The command writes a report under `reports/stranded-intelligence/minimal`.
