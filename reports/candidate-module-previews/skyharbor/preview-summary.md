# Candidate Module Preview

Tenant: `skyharbor-air`
Candidate: `skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run`
Generated: `2026-07-10T00:00:00.000Z`

This proof bundle previews how Home and Intelligence could inspect an inactive
candidate tenant data version. It does not write production tenant data, update
the Active Tenant Access Layer, promote a candidate, or change module runtime
consumption.

## Quality Gate

- Preview quality gate: pass
- Canonical records read: 53
- Target operations read: 106
- Evidence keys: 47
- Home preview facts: 21
- Intelligence preview facts: 21
- Promotion decision: ready-for-operator-approval
- Promotion enabled: false

## Guardrails

- Read-only preview: true
- Production tenant data written: false
- Active Tenant Access Layer updated: false
- Candidate promoted: false
- Module runtime routes changed: false
- No module reads candidate by default: true

## Blockers

- None for read-only preview.

## Output

- Home preview: `reports/candidate-module-previews/skyharbor/home-context-preview.json`
- Intelligence preview: `reports/candidate-module-previews/skyharbor/intelligence-context-preview.json`
- Proof: `reports/candidate-module-previews/skyharbor/candidate-module-preview-proof.json`
