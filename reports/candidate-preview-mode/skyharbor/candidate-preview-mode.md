# Candidate Preview Mode - SkyHarbor

Tenant: `skyharbor-air`
Candidate: `skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run`
Generated: `2026-07-10T00:00:00.000Z`
Quality gate: `pass`
Preview mode state: `defined_disabled_by_default`

This report defines an explicit candidate preview mode contract. It is disabled
by default and does not change module runtime behavior.

## Request Contract

- Flag: `ABARVA_CANDIDATE_PREVIEW_MODE`
- Default: `disabled`
- Required inputs: operatorId, tenantKey, candidateVersionId, module, previewReason, acknowledgedNotActiveRuntimeTruth

## Module Selection Matrix

| Module       | Selectable | Default source             | Preview source           | Runtime-ready |
| ------------ | ---------- | -------------------------- | ------------------------ | ------------- |
| home         | true       | active_tenant_access_layer | candidate_context_packet | false         |
| intelligence | true       | active_tenant_access_layer | candidate_context_packet | false         |
| moves        | true       | active_tenant_access_layer | candidate_context_packet | false         |
| source       | true       | active_tenant_access_layer | candidate_context_packet | false         |
| tower        | true       | active_tenant_access_layer | candidate_context_packet | false         |

## Blocked Actions

- Default module reads from candidate context.
- Active Tenant Access Layer pointer update.
- Candidate promotion.
- Runtime Module Memory writes.
- Runtime Outcome Ledger writes.
- Realized value or ROI claims.

## Guardrails

- Default enabled: false
- Explicit flag required: true
- Active Tenant Access Layer updated: false
- Candidate promoted: false
- Module default reads candidate data: false
- Runtime routes changed: false
- Promotion enabled: false
- Realized value claimed: false
