# Candidate Preview Enablement - SkyHarbor

Tenant: `skyharbor-air`
Candidate: `skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run`
Generated: `2026-07-12T00:00:00.000Z`
Quality gate: `pass`

> Candidate Preview Mode - inactive candidate data. Not active tenant truth.

This proof exercises candidate preview mode for an explicit operator/session
request only. It does not promote the candidate, update active tenant truth,
write production tenant data, change module default reads, or claim realized
value.

## Request Result

- Explicit request accepted: true
- Default request rejected: true
- Missing acknowledgement rejected: true
- Selected module: `home`

## Module Inspection

| Module       | Facts | Relationships | Derived | Graph | Evidence | Runtime eligible |
| ------------ | ----- | ------------- | ------- | ----- | -------- | ---------------- |
| home         | 21    | 0             | 1       | false | 47       | false            |
| intelligence | 21    | 0             | 2       | false | 47       | false            |
| moves        | 24    | 48            | 1       | true  | 47       | false            |
| source       | 24    | 48            | 1       | true  | 47       | false            |
| tower        | 24    | 48            | 1       | true  | 47       | false            |

## Guardrails

- Active Tenant Access Layer updated: false
- Candidate promoted: false
- Production tenant data written: false
- Module reads candidate by default: false
- Preview flag required: true
- Preview banner required: true
- Promotion enabled: false
- Realized value claimed: false
