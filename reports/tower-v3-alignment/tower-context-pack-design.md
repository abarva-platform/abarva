# TowerContextPack Source-of-Truth Design

Generated: 2026-07-15T19:45:01.239Z

## Selected Path

**Path A - Derived Tower Projection** is selected for the near-term migration.

Reason: Tower already depends heavily on `cio_tower` for dashboard/chat parity. Retiring it immediately would create avoidable product risk. The right migration is to make `cio_tower` a derived projection only.

## Target Flow

```text
standard-2026-07-v3 source templates / source adapters
-> Evidence Registry
-> Canonical Facts
-> Entity Profiles
-> Relationship Graph
-> Context Gaps / Confidence
-> TowerContextPack
-> derived cio_tower projection
-> TowerMetricRecord / TowerValueRecord / TowerValueClaim
-> Tower UI / Tower aVa
```

## Required Projection Lineage

Every Tower-visible derived row must carry:

- tenant_key
- source_standard
- source_dimension
- source_adapter, if applicable
- source_row_id
- evidence_registry_id
- canonical_fact_id
- entity_profile_id
- relationship_edge_id
- context_gap_id, if applicable
- tower_context_pack_id
- active_candidate_status
- confidence
- as_of_date
- calculation_method, for metrics/value
- safe_to_display
- value_claim_status

## TowerMetricRecord

```ts
type TowerMetricRecord = {
  metric_id: string;
  metric_name: string;
  metric_family: string;
  business_owner: string;
  data_owner: string;
  source_system: string;
  source_dimension: string;
  evidence_registry_id: string;
  baseline_status: "missing" | "directional" | "measured" | "attested";
  baseline_value: number | string | null;
  target_value: number | string | null;
  current_value: number | string | null;
  measurement_frequency: string;
  calculation_method: string;
  confidence: number;
  gap_status:
    | "none"
    | "needs_evidence"
    | "needs_owner"
    | "needs_method"
    | "blocked";
  active_candidate_status: "active" | "candidate";
};
```

## TowerValueRecord

```ts
type TowerValueRecord = {
  value_record_id: string;
  initiative_id: string;
  business_function: string;
  owner: string;
  metric_id: string;
  baseline_value: number | null;
  baseline_evidence_id: string | null;
  target_value: number | null;
  promised_value: number | null;
  forecast_value: number | null;
  measured_value: number | null;
  realized_value: number | null;
  calculation_method: string;
  evidence_refs: string[];
  risk_ids: string[];
  control_ids: string[];
  source_handoff_id: string | null;
  moves_handoff_id: string | null;
  status:
    | "hypothesis"
    | "planned"
    | "tracked"
    | "measured"
    | "realized"
    | "blocked";
  caveats: string[];
  active_candidate_status: "active" | "candidate";
};
```

## TowerValueClaim

```ts
type TowerValueClaim = {
  claim_id: string;
  claim_text: string;
  claim_type:
    | "hypothesis"
    | "target"
    | "forecast"
    | "measured"
    | "realized"
    | "roi";
  claim_status: "safe" | "caveated" | "blocked";
  supported_by_evidence: boolean;
  supporting_evidence_refs: string[];
  unsupported_reason: string | null;
  visible_to_user: boolean;
  caveat_text: string;
};
```

## Runtime rule

Tower UI and Tower aVa may consume a derived projection only after the projection proves the source row, evidence, canonical fact, entity, relationship, context gap, confidence, active/candidate state, and value-claim status.
