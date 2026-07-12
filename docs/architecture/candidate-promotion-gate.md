# Candidate Promotion Gate

Status: non-destructive promotion readiness boundary.

The Candidate Promotion Gate evaluates whether a persisted candidate tenant data version is ready for a future operator-controlled promotion. It does not promote the candidate, does not write production tenant data, does not update the Active Tenant Access Layer, and does not change module runtime consumption.

## Purpose

PR9 creates the explicit gate between candidate proof metadata and any later active tenant data version promotion.

The gate answers:

- which candidate was evaluated,
- which prior active version would be preserved for rollback,
- which proof checks passed or failed,
- which blockers remain before active promotion,
- whether operator approval is required,
- whether rollback planning exists,
- whether any unsafe runtime mutation occurred.

## Inputs

The gate reads a Candidate Tenant Data Version record from:

```bash
reports/candidate-tenant-data-versions/<fixture>/candidate-version-record.json
```

That record already links the candidate to:

- Tenant Packet ID and contract version,
- source adapter versions,
- mapping versions,
- target-writer version,
- proof bundle paths and fingerprints,
- planned write footprint,
- module readiness proof,
- promotion controls.

## Output

The gate writes:

```bash
reports/candidate-promotion-gates/<fixture>/promotion-gate-result.json
reports/candidate-promotion-gates/<fixture>/promotion-gate-summary.md
```

The result includes a promotion decision record with:

- candidate ID,
- prior active version ID, if supplied,
- required proof checks,
- passed and failed checks,
- blockers before active promotion,
- rollback plan,
- operator approval requirement,
- non-destructive guardrail flags.

## Decision Model

Allowed decisions:

- `blocked`: one or more proof checks failed.
- `eligible`: reserved for a future mode where promotion execution is enabled and all prerequisites are already approved.
- `ready-for-operator-approval`: proof checks passed, but active promotion is still disabled until operator approval and a future promotion execution path exist.

PR9 should normally produce `ready-for-operator-approval` for a clean candidate. That is not the same as active promotion.

## Hard Guardrails

Every PR9 gate result must preserve:

- `promotionEnabled: false`
- `activeTenantAccessLayerUpdated: false`
- `writesPhysicalTables: false`
- `moduleRuntimeConsumptionChanged: false`
- `operatorApprovalRequired: true`
- `rollbackPlanRequired: true`

The gate may evaluate readiness. It must not make candidate data active.

## Command

```bash
npm run audit:candidate-promotion-gate
```

Optional arguments:

```bash
npm run audit:candidate-promotion-gate -- \
  --candidate-record reports/candidate-tenant-data-versions/minimal/candidate-version-record.json \
  --out-dir reports/candidate-promotion-gates/minimal \
  --prior-active-version active:minimal-demo:current
```

## Runtime Boundary

Modules do not read candidate data by default. Home, Intelligence, Moves, Source, Tower, and Export continue to use the current active tenant access path until a later promotion gate execution path explicitly changes that state.

## Next Step

PR10 should use the SkyHarbor compatibility snapshot to create a persisted candidate version and run this promotion gate against it. That should still keep the candidate inactive.
