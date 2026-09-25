# Source read-model inventory (D-030)

This is a build-contract inventory, not a claim that any of these proposed L4 models exists, is populated, or is safe for product claims. Layer 3 owns facts; Source consumes projections. The executable catalogue is `src/lib/source/data-model/read-model-inventory.ts`. Its check measures metadata completeness only, not validity or build approval. A build cannot be called ready until its contract has verified canonical inputs, grain, keys, as-of basis, reconciliation equation and denominator, tenant fence and opposite-tenant query, freshness SLA, owner, trigger, stale behavior, field authority, and a governed job.

| Proposed model | Grain | Intended consumer | Reconciled build contract |
|---|---|---|---|
| `event_queue_v1` | Tenant + event | Requests and active Events | Unverified |
| `event_gate_v1` | Event + applicable stage | Progress and next action | Unverified |
| `event_artifact_index_v1` | Event + artifact version | Files explorer | Unverified |
| `supplier_readiness_v1` | Event + supplier legal entity | Supplier readiness | Unverified |
| `response_coverage_v1` | Event + package version + supplier + question family | Response coverage | Unverified |
| `evaluation_compare_v1` | Event + supplier + frozen criterion | Evaluation comparison | Unverified |
| `pricing_compare_v1` | Event + supplier + scenario/period | Pricing comparison | Unverified |
| `bafo_movement_v1` | Event + supplier + round + comparison basis | BAFO movement | Unverified |
| `decision_packet_v1` | Event + frozen packet version | Executive decision | Unverified |
| `transition_readiness_v1` | Event + milestone | Transition readiness | Unverified |
| `event_value_v1` | Event + opportunity + reporting period | Value lifecycle | Unverified |
| `industry_context_v1` | Archetype + metric + observation/version | Industry context | Unverified |
| `ava_event_context_v1` | Tenant + event + accepted snapshot | aVa event context | Unverified |

## First build candidate: event queue

Existing `source_events` and `source.sourcing_event` are candidate operational inputs, not an approved canonical join. The current source schema includes lifecycle and activation concepts, but the relationship between pre-active requests and accepted events must be reconciled by stable ID before a denominator is set. Count active events separately from pre-active requests; never promote a request merely because a UI route renders it. The canonical input/identity join, exclusion equation, as-of version, named owner, freshness SLA, tenant-negative query, and governed ACA job are still unverified. The catalogue therefore keeps `event_queue_v1` proposed and the build contract blocked.

The next slice should establish those fields from the actual Layer 3 rows and consuming query, write row-count and semantic reconciliation tests, then author a job contract under `docs/ops/aca-data-build-job-rule.md`. Applying schema, running a data build, or changing live tenant rows requires separate authorization. A completed job alone is not signed-in acceptance; capture model readback, stale behavior, and opposite-tenant refusal independently.
