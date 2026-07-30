# Knowledge Target Read-Model Contracts — airline-demo-new

Object shapes only — **no implementation, no DDL, no React**. Each contract below follows the same shape
`CONSUMPTION_PROJECTION_REGISTRY.json` already uses (`projection_name`, `consumers`, `purpose`,
`source_publication`, `build_gate`, `partial_data_behavior`, `key_fields`, `required_metadata`) so that these
can be pasted into that registry with minimal translation, plus a `target_fields` block naming every field the
matrix's UI rows actually need. Every contract also states the `state_machine` a consumer must respect and the
`does_not_own` boundary, matching Enterprise IA's rule that a projection may denormalize but never invent.

Cross-references: `GAP-##` = `KNOWLEDGE_DATA_MODEL_GAP_REGISTER.md`. `SD-##` = the lineage audit's
`semantic-defects.csv`.

---

## 1. `consumption.enterprise_identity_v1` (extend existing — closes part of GAP-10)

```
projection_name: consumption.enterprise_identity_v1
consumers: [Home / Knowledge Brief, aVa]
purpose: organization identity, industry, footprint, and airline-domain-specific operating stats,
         each stat independently availability-stated
source_publication: knowledge.organization, metrics.metric_observation
build_gate: required after enterprise wave
does_not_own: fleet/operational counts are NOT computed here; each stat is a pointer to an accepted
              metric_observation_v1 row or a null with availability_state
target_fields (ADDITIVE to the existing registered fields):
  - profile_text: string
  - operating_stats: array<{
      stat_key: string            # e.g. "fleet_count", "daily_departure_count" -- industry-specific,
                                   # not hardcoded to airline; healthcare-demo-new would declare its own set
      label: string
      value: numeric | null
      unit: string | null
      availability_state: enum (see state_machine)
      evidence_ref: string | null
    }>
key_fields: [tenant_key, organization_id, knowledge_baseline_ref]
state_machine: availability_state per stat = available | not_loaded | not_measured | withheld |
               conflicting | stale | not_applicable  (never silently coerced to 0)
required_metadata: [tenant_key, knowledge_baseline_ref, domain_publication_ref,
                     projection_contract_version, as_of_date, authority_state, freshness_state,
                     availability_state, evidence_coverage, content_hash]
```

---

## 2. `consumption.industry_benchmark_v1` (new — closes PROJECTION_MISSING for Brief Benchmarks)

```
projection_name: consumption.industry_benchmark_v1
consumers: [Home / Knowledge Brief]
purpose: external cohort comparison statistics for named tenant metrics, kept structurally
         separate from the tenant's own accepted facts
source_publication: a new publication.industry_benchmark_publication_v1 (licensed third-party
                    corpus, its own accept/publish cycle -- distinct from tenant publication waves)
build_gate: optional; a metric may render without a benchmark row, never the reverse
partial_data_behavior: a benchmark row without a matching tenant metric_observation_v1 value must
                        not render a tenant position on the bar
target_fields:
  - metric_id: string (must resolve 1:1 to metrics.metric_definition)
  - cohort_definition: string
  - cohort_median: numeric
  - cohort_top_quartile: numeric
  - cohort_method: string
  - cohort_vintage: date
  - tenant_value_ref: pointer to consumption.metric_observation_v1 (never a copied literal)
key_fields: [tenant_key, metric_id, cohort_vintage]
state_machine: tenant position renders only when tenant_value_ref resolves to an available metric;
               otherwise render "Not measured" per PARTIAL_DATA_AND_EMPTY_STATE_CONTRACT.md,
               never plot at 0
required_metadata: same baseline_metadata set as every other consumption view, plus a distinct
                    cohort_vintage separate from as_of_date (benchmark data ages independently of
                    tenant data)
```

---

## 3. `consumption.industry_pattern_v1` (new — closes PROJECTION_MISSING for Brief Patterns)

```
projection_name: consumption.industry_pattern_v1
consumers: [Home / Knowledge Brief]
purpose: cross-carrier/cross-industry observed patterns, explicitly linked to the specific
         tenant evidence gaps that would confirm or deny applicability
source_publication: publication.industry_pattern_publication_v1 (new; industry_corpus source_layer
                    per context-corpus-policy.ts)
build_gate: optional
partial_data_behavior: a pattern's applicability claim may not render without at least one real
                        linked_gap_id resolving in consumption.evidence_gap_v1
target_fields:
  - pattern_id: string
  - title: string
  - body: string
  - applicability_rating: enum (high | medium | low)
  - applicability_rationale: string
  - linked_gap_ids: array<string> (must resolve in evidence_gap_v1)
key_fields: [pattern_id, industry, publication_vintage]
state_machine: applicability_rating is only meaningful once every linked_gap_id resolves; a
               pattern with unresolved links renders with rating withheld, not defaulted to "low"
required_metadata: baseline_metadata set, tenant_key optional (industry-level content may be
                    tenant-neutral -- classification=public/internal per governance policy, never
                    a restricted tenant fact)
```

---

## 4. `consumption.source_registry_summary_v1` (new — closes GAP-13)

```
projection_name: consumption.source_registry_summary_v1
consumers: [Home / Knowledge Brief, Evidence & gaps]
purpose: a consumption-safe, Layer-3-derived summary of what source material this tenant's
         knowledge is built from -- lawfully exposes what source_registry.source (Layer 1/2)
         cannot expose directly per Enterprise IA Sec 5 rule 3
source_publication: publication.active_knowledge_baseline (never source_registry.source directly)
build_gate: required before the Brief "what it stands on" section or the Evidence "where it
            came from" section may render
partial_data_behavior: a source with state=awaited renders with received_date=null and
                        availability_state=not_loaded, never omitted from the list
target_fields:
  - source_name: string
  - received_date: date | null
  - source_kind: enum (structured_extract | interview | streaming_feed | vendor_feed | narrative)
  - source_state: enum (accepted | partial | awaited)
  - used_for_text: string
  - owner_steward: string | null
key_fields: [tenant_key, source_id, knowledge_baseline_ref]
state_machine: source_state drives display color exactly as PARTIAL_DATA_AND_EMPTY_STATE_CONTRACT.md
               already specifies (accepted=trusted, partial=amber, awaited=stone/absent)
required_metadata: baseline_metadata set
```

---

## 5. `consumption.evidence_gap_v1` (existing, registered — re-verification contract, closes GAP-01)

No shape change required. The **contract already correctly specifies**: `business_impact` required, severity
required, `partial_data_behavior: "missing is explicit, never converted to zero"`. What must change is the
**pipeline behind it**, verified against this acceptance test:

```
acceptance_test:
  given: risk-register.csv has 650 rows (source-verified, SD-05)
  when: the risk -> knowledge.risk -> publication.risk_control_publication_v1 ->
        consumption.evidence_gap_v1 pipeline runs
  then: consumption.evidence_gap_v1 row count must be > 0 and its row-count-to-source ratio must
        be independently re-derived and stated (not just re-asserted), matching the same
        "measured, not copied" standard the lineage audit applied to relationships (Sec 7)
does_not_own: severity scoring logic stays in the risk-register source; this projection only
              carries the accepted, published result forward
additional target_fields needed for the matrix's UI rows (Explore Risks table):
  - control_count: integer
  - last_tested_date: date | null
  - control_state: enum (controlled | partial | none)
```

---

## 6. `consumption.metric_observation_v1` (existing, registered — naming + shape contract, closes GAP-02)

```
projection_name: consumption.metric_observation_v1        # THE ONE name -- retire metric_catalog_v1
consumers: [Cube, Tower, Home]
purpose: governed metric observations with explicit current/target pairing and null semantics
source_publication: metrics.metric_definition, metrics.metric_observation
build_gate: required before Cube certification (already stated in the registry)
partial_data_behavior: value null when unavailable (already stated) -- EXTEND to:
  target_value null when no target is set, independently of whether current_value is null
target_fields (clarify/extend the existing single "value" field):
  - metric_id: string
  - period: string
  - current_value: numeric | null
  - target_value: numeric | null
  - target_date: date | null
  - disclosure_level: enum (board | operational)
  - observed_date: date | null
  - availability_state: enum (per PARTIAL_DATA_AND_EMPTY_STATE_CONTRACT.md)
key_fields: [tenant_key, metric_id, period, baseline_ref]
state_machine: a metric with no observation renders "Not measured" (never 0); a metric with an
               observation but no target renders "Target not set" distinctly from "Not measured"
required_metadata: existing baseline_metadata set
acceptance_test:
  given: kpi-sla-catalog.csv has 420 rows (source-verified, SD-06)
  when: the KPI pipeline runs end to end under this single name
  then: metric_observation_v1 row count must be > 0, independently re-derived against the
        420-row source, under this name only -- no parallel metric_catalog_v1 table may exist
        after this fix
```

---

## 7. `consumption.data_product_inventory_v1` (register the existing populated table — closes half of GAP-04 / SD-04)

```
projection_name: consumption.data_product_inventory_v1
consumers: [Home / Intelligence / Cube DataAnalyticsEstate]
purpose: accepted data-product inventory with stewardship, certification and sensitivity
source_publication: publication.data_publication_v1   # must be declared explicitly -- today it
                                                        # is not, which is the entire defect
build_gate: required before Explore Data products table or Cube DataAnalyticsEstate.data_product_count render
partial_data_behavior: no zero substitution for missing steward/certification
target_fields:
  - data_product_id: string
  - domain: string
  - steward: string | null
  - certification_state: enum (certified | provisional | uncertified)
  - sensitivity: enum (internal | personal_data | restricted)
  - consumer_count: integer
  - refresh_cadence: string
key_fields: [tenant_key, data_product_id, content_hash]
required_metadata: baseline_metadata set
acceptance_test:
  given: data-product source rows measured at 1,250 (per CANONICAL_TO_PUBLICATION_MAPPING.xlsx's
         own confirmed mapping to domain_summary_v1) vs. an undeclared 6,580-row table the Cube
         model actually reads today (SD-04)
  when: this projection is registered
  then: EITHER the 1,250-row mapping is corrected to explain the 6,580-row multiplier with a
        documented transformation, OR the object is redefined at whatever grain the 6,580 rows
        actually represent, and CONSUMPTION_PROJECTION_REGISTRY.json is updated to match reality,
        not the other way around
```

---

## 8. `consumption.technology_estate_v1` (register or retire — closes the other half of GAP-04)

```
projection_name: consumption.technology_estate_v1
consumers: [Cube TechnologyEstate]
purpose: UNCLEAR -- row count (1,405) is identical to application_inventory_v1's, suggesting this
         may be a denormalized copy rather than a distinct object. Must be resolved before being
         registered, not registered as-is.
acceptance_test:
  given: technology_estate_v1 has 1,405 rows, identical to application_inventory_v1's 1,405
  when: this object is investigated
  then: EITHER prove it is a genuinely distinct infra/integration object with its own source
        lineage (in which case register it with a real source_publication), OR confirm it is a
        denormalized copy of application_inventory_v1 (in which case retire it and point
        TechnologyEstate.legacy_platform_count at application_inventory_v1 directly, and fix the
        Cube YAML's TechnologyEstate.integration_count sql_table override, which already reads
        relationship_edge_v1 instead of this table -- an internal inconsistency independent of
        the tenant's own data)
```

---

## 9. `consumption.infrastructure_inventory_v1` (new — closes the largest single gap, SD-03)

```
projection_name: consumption.infrastructure_inventory_v1
consumers: [Home / Intelligence, Cube (new measure needed)]
purpose: infrastructure/cloud platform inventory -- the single largest source family in the
         corpus (10,000 rows) with zero current representation anywhere downstream
source_publication: a new publication.infrastructure_publication_v1 (knowledge.platform already
                    exists as a canonical object per Enterprise IA Sec 4 -- this closes the
                    missing publication+projection layer on top of an object that already exists)
build_gate: required before Explore Infrastructure and cloud table renders
partial_data_behavior: no zero substitution for missing owner/recovery-objective
target_fields:
  - platform_id: string
  - owner: string | null
  - hosting_model: enum (matches application_inventory_v1's existing hosting_model enum for
                         cross-object consistency: on_prem | private_cloud | aws | azure | saas |
                         hybrid | edge | mainframe)
  - criticality: enum (tier_1 | tier_2 | tier_3)
  - run_cost: numeric | null
  - recovery_objective: string | null
key_fields: [tenant_key, platform_id, content_hash]
required_metadata: baseline_metadata set
acceptance_test:
  given: cloud-infrastructure-inventory.csv has 10,000 rows (source-verified)
  when: this projection is built
  then: row count must be > 0 and independently re-derived against the 10,000-row source,
        registered in CONSUMPTION_PROJECTION_REGISTRY.json with a real source_publication
```

---

## 10. `relationship_node_v1` / `relationship_edge_v1` (extend existing — closes GAP-07's graph half, and the SD-08/SD-14 filtering requirement)

```
# Existing registered objects. Two changes needed:

change_A (closes GAP-07):
  add field: state_scope: enum (current | target)
  add field: target_approval_state: enum (proposed | approved) | null   # null when state_scope=current
  rule: a node/edge representing a proposed or approved future state is a SEPARATE row from its
        current-state counterpart, joined by a "replaces" relationship_type, never a mutated
        in-place row (Enterprise IA rule: adapters/projections do not overwrite, they add rows)

change_B (closes the SD-08/SD-14 filtering requirement):
  add field: endpoint_catalog_backed: boolean
  rule: any node/edge whose source object_type has no ID-backed catalog (today: `capability`,
        `service_tower`) must carry endpoint_catalog_backed=false and MUST NOT set
        authority_state=accepted until a real catalog exists; UI must render these visually
        distinct from ordinary accepted nodes even if displayed at all (matrix row: Graph canvas
        nodes)

acceptance_test (change_B):
  given: 3,000 of 60,000 relationship rows originate from a free-text `capability` field with no
         backing catalog anywhere in the 25-file corpus (SD-08); 9,000 more from `service_tower`,
         label-consistent but not ID-backed (SD-14)
  when: the accepted-edge population is re-derived
  then: query the count of accepted relationship_node_v1/edge_v1 rows where
        endpoint_catalog_backed=false and authority_state=accepted -- this count MUST be 0 after
        the fix (either a real catalog is added, or these rows are excluded from accepted)
```

---

## 11. `consumption.relationship_evidence_v1` (extend existing — closes the edge-drawer half of GAP-10)

```
# Existing registered, populated object. Field extension only:
add fields:
  - confidence: enum (high | medium | low)
  - review_state: enum (pending | reviewed)
  - authority_state_detail: enum (authoritative | not_authoritative)
  - effective_from: date
  - effective_to: date | null
rule: every field above must resolve for every edge that is authority_state=accepted before that
      edge's evidence drawer may render anything beyond the source citation
```

---

## 12. `governance.decision` and `governance.contradiction` (new canonical objects — closes GAP-06)

Not a consumption projection first — this is a **Layer 3 canonical model addition**, per Enterprise IA's own
rule that relationships and object types live in Layer 3, never invented at the product layer.

```
canonical_object: Decision  (new; ID prefix DEC-001)
  fields: decision_id, title, owner, readiness_state (see GAP-05), closes_on_gap_ids[]
  relationships: Decision blocked_by Evidence.gap ; Decision advances Program/Initiative

canonical_object: Contradiction  (new; ID prefix CTR-001)
  fields: contradiction_id, statement_a, statement_a_source_ref, statement_b,
          statement_b_source_ref, owner, opened_date, downstream_effect_text
  relationships: Contradiction contests Fact | Metric | RelationshipAssertion ;
                 Contradiction blocks Decision

# Once ratified in Layer 3, the consumption-layer shapes are straightforward:
projection_name: consumption.decision_readiness_v1 (new)
projection_name: consumption.contradiction_v1 (new)
  both following the standard baseline_metadata + key_fields + required_metadata pattern used
  by every other projection in this package
```

---

## 13. `consumption.module_knowledge_packet_v1` (existing, registered — population contract, closes GAP-03)

No shape change. `AVA_KNOWLEDGE_PACKET_MAPPING.xlsx` already specifies the correct shape (packet_header,
tenant_context, facts, relationships, metrics, evidence, gaps, safety sections). What's needed:

```
acceptance_test:
  given: module_knowledge_packet_v1 is registered but absent from the reported populated-object
         breakdown for airline-demo-new (lineage audit Sec 2, Sec 8)
  when: the packet-build job runs for each of (Home, Source, Moves, Tower, Intelligence)
  then: for EACH target module, packet_hash must resolve to >=1 row with all required header
        fields populated (knowledge_baseline_ref, domain_publication_versions,
        consumption_projection_versions), and every accepted_fact_ref/relationship_edge/
        evidence_ref inside it must independently resolve in its own source projection --
        run this AFTER GAP-01 and GAP-02 close, since a packet assembled from broken
        evidence_gap_v1/metric_observation_v1 inputs would itself be wrong even if "populated"
does_not_own: the packet must never contain a narrative claim without a citable ref inside it --
              this is enforced today at the governance-policy layer by
              buildValidatedAgentContextBundle / evaluateGovernedObject, which is real,
              shipped code, not a gap
```

---

## Objects intentionally NOT given a target read-model contract here

Per the ground rules, the following are correctly **operational UI tables**, not canonical/projection
objects, and belong in application-layer schema, never in `CONSUMPTION_PROJECTION_REGISTRY.json`:
`saved_view` (Explore/Saved views), `ava_suggested_question` (aVa), `ava_dock_preference` (aVa),
`relationship_preset_query` (Relationships). Their shapes are simple enough not to need a formal contract
document; each is named with its minimal field list in `KNOWLEDGE_DATA_MODEL_GAP_REGISTER.md`'s P3 section.
