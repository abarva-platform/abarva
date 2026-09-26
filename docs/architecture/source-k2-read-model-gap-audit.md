# Source K2 Read-Model Contract Gap Audit

Measured against `src/lib/source/data-model/read-model-inventory.ts` on main `92f5836b33f98c17bb59a83e34f9f722e0ebcb4a` (2026-09-26). This is a declaration audit, not a running-query, database, freshness, or signed-in acceptance test. All thirteen inventory entries are `proposed`.

## Property Coverage

| K2 requirement | Contract field | Can the type express it? |
|---|---|---|
| Reconciliation | `reconciliationEquation` | Yes |
| Denominator | `denominator` | Yes |
| Opposite-tenant query | `oppositeTenantQuery` | Yes |
| Per-field authority (operational-current vs canonically accepted) | `fieldAuthority` | Yes |
| Projection trigger | `projectionTrigger` | Yes |
| Acceptable delay | `freshnessSla` | Yes |
| As-of date | `asOf` | Yes |
| Stale behavior | `staleBehavior` | Yes |
| Whether aVa may answer while stale | None | **No** |

The final property needs its own explicit contract field and a separate approved implementation item. `staleBehavior: "label_stale"` does not state whether aVa may answer; it cannot substitute for a model-consumption rule. This audit does not add that field, flip a model state, authorize a build, or apply a migration.

## Current Declarations

`absent` means the model object has no named declaration for the expressible field. `unexpressible` means the union and interface do not both provide a field for that property. A property name embedded in another field's prose is still absent.

| Read model | reconciliation | denominator | oppositeTenantQuery | fieldAuthority | projectionTrigger | acceptableDelay | asOfDate | staleBehavior | avaMayAnswerWhileStale |
|---|---|---|---|---|---|---|---|---|---|
| event_queue_v1 | absent | absent | absent | absent | absent | absent | absent | absent | unexpressible |
| event_gate_v1 | absent | absent | absent | absent | absent | absent | absent | absent | unexpressible |
| event_artifact_index_v1 | absent | absent | absent | absent | absent | absent | absent | absent | unexpressible |
| supplier_readiness_v1 | absent | absent | absent | absent | absent | absent | absent | absent | unexpressible |
| response_coverage_v1 | absent | absent | absent | absent | absent | absent | absent | absent | unexpressible |
| evaluation_compare_v1 | absent | absent | absent | absent | absent | absent | absent | absent | unexpressible |
| pricing_compare_v1 | absent | absent | absent | absent | absent | absent | absent | absent | unexpressible |
| bafo_movement_v1 | absent | absent | absent | absent | absent | absent | absent | absent | unexpressible |
| decision_packet_v1 | absent | absent | absent | absent | absent | absent | absent | absent | unexpressible |
| transition_readiness_v1 | absent | absent | absent | absent | absent | absent | absent | absent | unexpressible |
| event_value_v1 | absent | absent | absent | absent | absent | absent | absent | absent | unexpressible |
| industry_context_v1 | absent | absent | absent | absent | absent | absent | absent | absent | unexpressible |
| ava_event_context_v1 | absent | absent | absent | absent | absent | absent | absent | absent | unexpressible |

## Reproduce

```bash
node scripts/source/read-model-k2-audit.mjs
node --test scripts/source/read-model-k2-audit.test.mjs
```

The audit parses TypeScript declarations and object literals, not text substrings. Tests demonstrate that a prose mention is not a declaration, a named field is, re-spelling the union or interface removes expressibility, and adding the missing aVa field in an in-memory fixture makes the negative detector fire positively. Deliberately re-spelling the audit's `fieldAuthority` and `avaMayAnswerWhileStale` mappings caused the baseline and positive-control tests to fail, respectively; both were restored.

## Next Decision

Define the aVa-staleness policy as a distinct contract field with a closed vocabulary and decide which consumers must fail closed. Then complete each proposed model's fields from its owning canonical authority. None should move out of `proposed` until an actual tenant-scoped read, reconciliation, opposite-tenant query, and stale-read behavior are tested against a running projection.
