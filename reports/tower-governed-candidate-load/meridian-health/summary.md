# Tower Governed Candidate Load Path - Meridian

Status: Pass

This proof builds a governed candidate-load plan for Meridian Tower. It does **not**
submit an ACA Job, write production tenant data, update Active Tenant Access, promote
a candidate, or change Tower runtime reads.

## Result

- Candidate version: `candidate:meridian-health:tower-v3:de0da3b1f4218eb1`
- Dataset manifest: `meridian-health-tower-v3-candidate-preview-20260717`
- Input root: `datasets/tenant-inputs/active/meridian-health/current`
- Input fingerprint: `de0da3b1f4218eb16f365c414ad7d6f4f52d62ab36b6c3775d4bfc7673d3035e`
- Metrics: 140
- Value records: 79
- Value claims: 79
- Quality gate: `pass`

## Candidate Preview Boundary

Candidate Preview Mode - inactive candidate Tower context. Not active tenant truth.

Tower may preview measurement readiness, budget/value posture, source dimensions, and
executive blocker themes. Tower must not claim realized value, ROI, savings, achieved
outcomes, or active runtime truth from this candidate preview.

## ACA Job Contract

- Job: `job-tower-governed-candidate-load`
- Run id: `tower-candidate-load-meridian-health-de0da3b1f421`
- Idempotency key: `candidate:meridian-health:tower-v3:de0da3b1f4218eb1:de0da3b1f4218eb16f365c414ad7d6f4f52d62ab36b6c3775d4bfc7673d3035e`
- Operator wrapper: `scripts/ops/submit-aca-operator-job.mjs`
- Script: `audit:tower-governed-candidate-load`
- Status: `planned_not_submitted`

## Truth Split

- Active context updated: false
- Candidate preview created: true
- Default Tower runtime changed: false
- `cio_tower`: bridge_only_diagnostic
- Retrieval state: not_loaded_not_indexed_not_retrieval_proven_not_cited
