# Tower projection tables — schema reference

> **This is a reference for the four Tower projection tables.** The governed substrate baseline
> now lives in `supabase/migrations/20260831031000_ecl_substrate_baseline.sql`, generated from
> the lab data plane by `npm run ops:emit-ecl-substrate-baseline`.

## Why this document exists

The Tower projection tables carry foreign keys into shared ECL substrate tables, so the durable
unit of version control is the substrate, not just the four product tables. The baseline migration
therefore includes the referenced schemas, tables, constraints, indexes, functions, views, RLS
state and policies needed for replay.

The direct dependencies that made a four-table-only baseline insufficient are:

| Referenced table | Baseline coverage |
| --- | --- |
| `ecl_projection.projection_entry` | `20260831031000_ecl_substrate_baseline.sql` |
| `ecl_projection.projection_manifest` | `20260831031000_ecl_substrate_baseline.sql` |
| `ecl_context.measure` | `20260831031000_ecl_substrate_baseline.sql` |
| `ecl_context.metric_definition` | `20260831031000_ecl_substrate_baseline.sql` |
| `ecl_context.object` | `20260831031000_ecl_substrate_baseline.sql` |
| `ecl_context.snapshot` | `20260831031000_ecl_substrate_baseline.sql` |
| `ecl_review.review_event` | `20260831031000_ecl_substrate_baseline.sql` |
| `ecl_source.source_record` | `20260831031000_ecl_substrate_baseline.sql` |

## Row-level security

| Table | RLS enabled | Policies |
| --- | --- | --- |
| `tower_ai_portfolio` | true | **1** |
| `tower_command_center` | true | **1** |
| `tower_evidence_queue` | true | **1** |
| `tower_value_chain` | true | **1** |

RLS is enabled on all four tables and each table has a tenant-scoped select policy in the
baseline. The application still sets the tenant context before reads; the database policy now
records the same boundary in the substrate.


## `ecl_projection.tower_ai_portfolio`

### Columns

| Column | Type | Null | Default |
| --- | --- | --- | --- |
| `id` | uuid | NO | `gen_random_uuid()` |
| `tenant_key` | text | NO | — |
| `assessment_id` | text | NO | — |
| `snapshot_id` | uuid | NO | — |
| `projection_manifest_id` | uuid | NO | — |
| `projection_entry_id` | uuid | NO | — |
| `projection_version` | integer | NO | — |
| `row_key` | text | NO | — |
| `use_case_object_id` | uuid | NO | — |
| `tool_object_id` | uuid | YES | — |
| `function_object_id` | uuid | YES | — |
| `use_case_name` | text | NO | — |
| `tool_name` | text | NO | — |
| `business_function` | text | YES | — |
| `licensed_users` | integer | YES | — |
| `active_users` | integer | YES | — |
| `usage_events` | integer | YES | — |
| `monthly_cost_usd` | numeric | YES | — |
| `adoption_rate_percent` | numeric | YES | — |
| `value_state` | text | NO | — |
| `quality_state` | text | NO | — |
| `review_state` | text | NO | — |
| `metric_keys_json` | jsonb | NO | `'[]'::jsonb` |
| `source_refs_json` | jsonb | NO | `'[]'::jsonb` |
| `gap_flags_json` | jsonb | NO | `'[]'::jsonb` |
| `display_payload_json` | jsonb | NO | `'{}'::jsonb` |
| `source_hash` | text | NO | — |
| `created_at` | timestamp with time zone | NO | `now()` |

### Constraints

| Kind | Name | Definition |
| --- | --- | --- |
| check | `tower_ai_portfolio_count_check` | `CHECK (((COALESCE(licensed_users, 0) >= 0) AND (COALESCE(active_users, 0) >= 0) AND (COALESCE(usage_events, 0) >= 0) AND (COALESCE(monthly_cost_usd, (0)::numeric) >= (0)::numeric) AND ((adoption_rate_percent IS NULL) OR ((adoption_rate_percent >= (0)::numeric) AND (adoption_rate_percent <= (100)::numeric)))))` |
| check | `tower_ai_portfolio_quality_state_check` | `CHECK ((quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text])))` |
| check | `tower_ai_portfolio_review_state_check` | `CHECK ((review_state = ANY (ARRAY['not_reviewed'::text, 'reviewed'::text, 'approved'::text, 'rejected'::text])))` |
| check | `tower_ai_portfolio_value_state_check` | `CHECK ((value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text])))` |
| foreign key | `tower_ai_portfolio_entry_fk` | `FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id)` |
| foreign key | `tower_ai_portfolio_function_fk` | `FOREIGN KEY (tenant_key, assessment_id, function_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id)` |
| foreign key | `tower_ai_portfolio_manifest_fk` | `FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id)` |
| foreign key | `tower_ai_portfolio_snapshot_fk` | `FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id)` |
| foreign key | `tower_ai_portfolio_tool_fk` | `FOREIGN KEY (tenant_key, assessment_id, tool_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id)` |
| foreign key | `tower_ai_portfolio_use_case_fk` | `FOREIGN KEY (tenant_key, assessment_id, use_case_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id)` |
| primary key | `tower_ai_portfolio_pkey` | `PRIMARY KEY (id)` |
| unique | `tower_ai_portfolio_unique` | `UNIQUE (tenant_key, assessment_id, projection_version, row_key)` |

### Indexes

- `idx_tower_ai_portfolio_use_case` — `CREATE INDEX idx_tower_ai_portfolio_use_case ON ecl_projection.tower_ai_portfolio USING btree (tenant_key, assessment_id, use_case_object_id)`
- `tower_ai_portfolio_pkey` — `CREATE UNIQUE INDEX tower_ai_portfolio_pkey ON ecl_projection.tower_ai_portfolio USING btree (id)`
- `tower_ai_portfolio_unique` — `CREATE UNIQUE INDEX tower_ai_portfolio_unique ON ecl_projection.tower_ai_portfolio USING btree (tenant_key, assessment_id, projection_version, row_key)`

## `ecl_projection.tower_command_center`

### Columns

| Column | Type | Null | Default |
| --- | --- | --- | --- |
| `id` | uuid | NO | `gen_random_uuid()` |
| `tenant_key` | text | NO | — |
| `assessment_id` | text | NO | — |
| `snapshot_id` | uuid | NO | — |
| `projection_manifest_id` | uuid | NO | — |
| `projection_version` | integer | NO | — |
| `row_key` | text | NO | — |
| `page_key` | text | NO | — |
| `row_type` | text | NO | — |
| `primary_object_id` | uuid | YES | — |
| `claim_id` | text | YES | — |
| `claim_gate_status` | text | NO | `'not_applicable'::text` |
| `claim_gate_reason_code` | text | YES | — |
| `claim_gate_reason_detail` | text | YES | — |
| `next_gate` | text | YES | — |
| `evidence_needed_json` | jsonb | NO | `'[]'::jsonb` |
| `funded_amount_usd` | numeric | YES | — |
| `promised_value_usd` | numeric | YES | — |
| `usage_supported_value_usd` | numeric | YES | — |
| `finance_validated_value_usd` | numeric | YES | — |
| `claimable_value_usd` | numeric | YES | — |
| `blocked_value_usd` | numeric | YES | — |
| `proof_maturity_score` | integer | YES | — |
| `risk_pressure_score` | integer | YES | — |
| `usage_strength_score` | integer | YES | — |
| `owner_role` | text | YES | — |
| `handoff_module` | text | YES | — |
| `value_state` | text | NO | — |
| `quality_state` | text | NO | — |
| `metric_keys_json` | jsonb | NO | `'[]'::jsonb` |
| `source_refs_json` | jsonb | NO | `'[]'::jsonb` |
| `gap_flags_json` | jsonb | NO | `'[]'::jsonb` |
| `display_payload_json` | jsonb | NO | `'{}'::jsonb` |
| `source_hash` | text | NO | — |
| `created_at` | timestamp with time zone | NO | `now()` |
| `projection_entry_id` | uuid | YES | — |

### Constraints

| Kind | Name | Definition |
| --- | --- | --- |
| check | `tower_command_center_claim_gate_status_check` | `CHECK ((claim_gate_status = ANY (ARRAY['claimable'::text, 'gated'::text, 'blocked'::text, 'not_applicable'::text])))` |
| check | `tower_command_center_gate_reason_check` | `CHECK ((((claim_gate_status = ANY (ARRAY['gated'::text, 'blocked'::text])) AND (claim_gate_reason_code IS NOT NULL)) OR (claim_gate_status = ANY (ARRAY['claimable'::text, 'not_applicable'::text]))))` |
| check | `tower_command_center_money_nonnegative_check` | `CHECK (((COALESCE(funded_amount_usd, (0)::numeric) >= (0)::numeric) AND (COALESCE(promised_value_usd, (0)::numeric) >= (0)::numeric) AND (COALESCE(usage_supported_value_usd, (0)::numeric) >= (0)::numeric) AND (COALESCE(finance_validated_value_usd, (0)::numeric) >= (0)::numeric) AND (COALESCE(claimable_value_usd, (0)::numeric) >= (0)::numeric) AND (COALESCE(blocked_value_usd, (0)::numeric) >= (0)::numeric)))` |
| check | `tower_command_center_page_key_check` | `CHECK ((page_key = ANY (ARRAY['command_center'::text, 'value_proof'::text, 'decision_lanes'::text, 'evidence'::text, 'recommended_actions'::text, 'ai_portfolio'::text, 'cost_lens'::text, 'risk_lens'::text, 'adoption_lens'::text])))` |
| check | `tower_command_center_quality_state_check` | `CHECK ((quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text])))` |
| check | `tower_command_center_scores_check` | `CHECK ((((proof_maturity_score IS NULL) OR ((proof_maturity_score >= 0) AND (proof_maturity_score <= 100))) AND ((risk_pressure_score IS NULL) OR ((risk_pressure_score >= 0) AND (risk_pressure_score <= 100))) AND ((usage_strength_score IS NULL) OR ((usage_strength_score >= 0) AND (usage_strength_score <= 100)))))` |
| check | `tower_command_center_value_state_check` | `CHECK ((value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text])))` |
| foreign key | `tower_command_center_entry_fk` | `FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id) NOT VALID` |
| foreign key | `tower_command_center_manifest_fk` | `FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id)` |
| foreign key | `tower_command_center_primary_object_fk` | `FOREIGN KEY (tenant_key, assessment_id, primary_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id)` |
| foreign key | `tower_command_center_snapshot_fk` | `FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id)` |
| primary key | `tower_command_center_pkey` | `PRIMARY KEY (id)` |
| unique | `tower_command_center_unique` | `UNIQUE (tenant_key, assessment_id, projection_version, page_key, row_key)` |

### Indexes

- `idx_tower_command_center_gate` — `CREATE INDEX idx_tower_command_center_gate ON ecl_projection.tower_command_center USING btree (tenant_key, assessment_id, claim_gate_status, claim_gate_reason_code)`
- `idx_tower_command_center_page` — `CREATE INDEX idx_tower_command_center_page ON ecl_projection.tower_command_center USING btree (tenant_key, assessment_id, projection_version, page_key)`
- `tower_command_center_pkey` — `CREATE UNIQUE INDEX tower_command_center_pkey ON ecl_projection.tower_command_center USING btree (id)`
- `tower_command_center_unique` — `CREATE UNIQUE INDEX tower_command_center_unique ON ecl_projection.tower_command_center USING btree (tenant_key, assessment_id, projection_version, page_key, row_key)`

## `ecl_projection.tower_evidence_queue`

### Columns

| Column | Type | Null | Default |
| --- | --- | --- | --- |
| `id` | uuid | NO | `gen_random_uuid()` |
| `tenant_key` | text | NO | — |
| `assessment_id` | text | NO | — |
| `snapshot_id` | uuid | NO | — |
| `projection_manifest_id` | uuid | NO | — |
| `projection_entry_id` | uuid | NO | — |
| `projection_version` | integer | NO | — |
| `row_key` | text | NO | — |
| `page_key` | text | NO | — |
| `row_type` | text | NO | — |
| `primary_object_id` | uuid | YES | — |
| `claim_id` | text | NO | — |
| `claim_gate_status` | text | NO | — |
| `claim_gate_reason_code` | text | NO | — |
| `claim_gate_reason_detail` | text | NO | — |
| `evidence_needed_json` | jsonb | NO | `'[]'::jsonb` |
| `next_gate` | text | NO | — |
| `owner_role` | text | NO | — |
| `due_date` | date | YES | — |
| `related_measure_id` | uuid | YES | — |
| `source_record_id` | uuid | YES | — |
| `review_event_id` | uuid | YES | — |
| `evidence_state` | text | NO | — |
| `priority_score` | integer | NO | `50` |
| `source_refs_json` | jsonb | NO | `'[]'::jsonb` |
| `gap_flags_json` | jsonb | NO | `'[]'::jsonb` |
| `display_payload_json` | jsonb | NO | `'{}'::jsonb` |
| `source_hash` | text | NO | — |
| `created_at` | timestamp with time zone | NO | `now()` |

### Constraints

| Kind | Name | Definition |
| --- | --- | --- |
| check | `tower_evidence_queue_gate_status_check` | `CHECK ((claim_gate_status = ANY (ARRAY['gated'::text, 'blocked'::text])))` |
| check | `tower_evidence_queue_page_check` | `CHECK ((page_key = ANY (ARRAY['evidence'::text, 'recommended_actions'::text, 'risk_lens'::text])))` |
| check | `tower_evidence_queue_payload_check` | `CHECK (((COALESCE(jsonb_array_length(evidence_needed_json), 0) > 0) AND (claim_gate_reason_code <> ''::text) AND (claim_gate_reason_detail <> ''::text) AND (next_gate <> ''::text)))` |
| check | `tower_evidence_queue_priority_check` | `CHECK (((priority_score >= 0) AND (priority_score <= 100)))` |
| foreign key | `tower_evidence_queue_entry_fk` | `FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id)` |
| foreign key | `tower_evidence_queue_manifest_fk` | `FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id)` |
| foreign key | `tower_evidence_queue_measure_fk` | `FOREIGN KEY (tenant_key, assessment_id, related_measure_id) REFERENCES ecl_context.measure(tenant_key, assessment_id, id)` |
| foreign key | `tower_evidence_queue_primary_object_fk` | `FOREIGN KEY (tenant_key, assessment_id, primary_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id)` |
| foreign key | `tower_evidence_queue_review_event_fk` | `FOREIGN KEY (tenant_key, assessment_id, review_event_id) REFERENCES ecl_review.review_event(tenant_key, assessment_id, id)` |
| foreign key | `tower_evidence_queue_snapshot_fk` | `FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id)` |
| foreign key | `tower_evidence_queue_source_record_fk` | `FOREIGN KEY (tenant_key, assessment_id, source_record_id) REFERENCES ecl_source.source_record(tenant_key, assessment_id, id)` |
| primary key | `tower_evidence_queue_pkey` | `PRIMARY KEY (id)` |
| unique | `tower_evidence_queue_unique` | `UNIQUE (tenant_key, assessment_id, projection_version, page_key, row_key)` |

### Indexes

- `idx_tower_evidence_queue_gate` — `CREATE INDEX idx_tower_evidence_queue_gate ON ecl_projection.tower_evidence_queue USING btree (tenant_key, assessment_id, claim_gate_status, claim_gate_reason_code)`
- `idx_tower_evidence_queue_page` — `CREATE INDEX idx_tower_evidence_queue_page ON ecl_projection.tower_evidence_queue USING btree (tenant_key, assessment_id, projection_version, page_key)`
- `tower_evidence_queue_pkey` — `CREATE UNIQUE INDEX tower_evidence_queue_pkey ON ecl_projection.tower_evidence_queue USING btree (id)`
- `tower_evidence_queue_unique` — `CREATE UNIQUE INDEX tower_evidence_queue_unique ON ecl_projection.tower_evidence_queue USING btree (tenant_key, assessment_id, projection_version, page_key, row_key)`

## `ecl_projection.tower_value_chain`

### Columns

| Column | Type | Null | Default |
| --- | --- | --- | --- |
| `id` | uuid | NO | `gen_random_uuid()` |
| `tenant_key` | text | NO | — |
| `assessment_id` | text | NO | — |
| `snapshot_id` | uuid | NO | — |
| `projection_manifest_id` | uuid | NO | — |
| `projection_entry_id` | uuid | NO | — |
| `projection_version` | integer | NO | — |
| `row_key` | text | NO | — |
| `page_key` | text | NO | — |
| `row_type` | text | NO | — |
| `primary_object_id` | uuid | YES | — |
| `claim_id` | text | NO | — |
| `observation_key` | text | NO | — |
| `metric_key` | text | NO | — |
| `measure_id` | uuid | YES | — |
| `source_record_id` | uuid | YES | — |
| `review_event_id` | uuid | YES | — |
| `evidence_state` | text | NO | — |
| `claim_gate_status` | text | NO | — |
| `claim_gate_reason_code` | text | YES | — |
| `claim_gate_reason_detail` | text | YES | — |
| `next_gate` | text | YES | — |
| `evidence_needed_json` | jsonb | NO | `'[]'::jsonb` |
| `baseline_value` | numeric | YES | — |
| `current_value` | numeric | YES | — |
| `target_value` | numeric | YES | — |
| `claimable_value_usd` | numeric | NO | `0` |
| `blocked_value_usd` | numeric | NO | `0` |
| `value_state` | text | NO | — |
| `quality_state` | text | NO | — |
| `source_refs_json` | jsonb | NO | `'[]'::jsonb` |
| `display_payload_json` | jsonb | NO | `'{}'::jsonb` |
| `gap_flags_json` | jsonb | NO | `'[]'::jsonb` |
| `source_hash` | text | NO | — |
| `created_at` | timestamp with time zone | NO | `now()` |

### Constraints

| Kind | Name | Definition |
| --- | --- | --- |
| check | `tower_value_chain_gate_payload_check` | `CHECK ((((claim_gate_status = ANY (ARRAY['gated'::text, 'blocked'::text])) AND (claim_gate_reason_code IS NOT NULL) AND (claim_gate_reason_detail IS NOT NULL) AND (next_gate IS NOT NULL) AND (COALESCE(jsonb_array_length(evidence_needed_json), 0) > 0)) OR ((claim_gate_status = ANY (ARRAY['claimable'::text, 'not_applicable'::text])) AND (claim_gate_reason_code IS NULL) AND (claim_gate_reason_detail IS NULL) AND (next_gate IS NULL) AND (COALESCE(jsonb_array_length(evidence_needed_json), 0) = 0))))` |
| check | `tower_value_chain_gate_status_check` | `CHECK ((claim_gate_status = ANY (ARRAY['claimable'::text, 'gated'::text, 'blocked'::text, 'not_applicable'::text])))` |
| check | `tower_value_chain_money_nonnegative_check` | `CHECK (((claimable_value_usd >= (0)::numeric) AND (blocked_value_usd >= (0)::numeric)))` |
| check | `tower_value_chain_page_check` | `CHECK ((page_key = ANY (ARRAY['value_proof'::text, 'decision_lanes'::text, 'cost_lens'::text])))` |
| check | `tower_value_chain_quality_state_check` | `CHECK ((quality_state = ANY (ARRAY['passed'::text, 'warning'::text, 'blocked'::text])))` |
| check | `tower_value_chain_value_state_check` | `CHECK ((value_state = ANY (ARRAY['known'::text, 'estimated'::text, 'unknown'::text, 'not_applicable'::text, 'conflicting'::text])))` |
| foreign key | `tower_value_chain_entry_fk` | `FOREIGN KEY (tenant_key, assessment_id, projection_entry_id) REFERENCES ecl_projection.projection_entry(tenant_key, assessment_id, id)` |
| foreign key | `tower_value_chain_manifest_fk` | `FOREIGN KEY (projection_manifest_id) REFERENCES ecl_projection.projection_manifest(id)` |
| foreign key | `tower_value_chain_measure_fk` | `FOREIGN KEY (tenant_key, assessment_id, measure_id) REFERENCES ecl_context.measure(tenant_key, assessment_id, id)` |
| foreign key | `tower_value_chain_metric_fk` | `FOREIGN KEY (tenant_key, metric_key) REFERENCES ecl_context.metric_definition(tenant_key, metric_key)` |
| foreign key | `tower_value_chain_primary_object_fk` | `FOREIGN KEY (tenant_key, assessment_id, primary_object_id) REFERENCES ecl_context.object(tenant_key, assessment_id, id)` |
| foreign key | `tower_value_chain_review_event_fk` | `FOREIGN KEY (tenant_key, assessment_id, review_event_id) REFERENCES ecl_review.review_event(tenant_key, assessment_id, id)` |
| foreign key | `tower_value_chain_snapshot_fk` | `FOREIGN KEY (tenant_key, assessment_id, snapshot_id) REFERENCES ecl_context.snapshot(tenant_key, assessment_id, id)` |
| foreign key | `tower_value_chain_source_record_fk` | `FOREIGN KEY (tenant_key, assessment_id, source_record_id) REFERENCES ecl_source.source_record(tenant_key, assessment_id, id)` |
| primary key | `tower_value_chain_pkey` | `PRIMARY KEY (id)` |
| unique | `tower_value_chain_unique` | `UNIQUE (tenant_key, assessment_id, projection_version, page_key, row_key)` |

### Indexes

- `idx_tower_value_chain_metric` — `CREATE INDEX idx_tower_value_chain_metric ON ecl_projection.tower_value_chain USING btree (tenant_key, metric_key)`
- `idx_tower_value_chain_page` — `CREATE INDEX idx_tower_value_chain_page ON ecl_projection.tower_value_chain USING btree (tenant_key, assessment_id, projection_version, page_key)`
- `tower_value_chain_pkey` — `CREATE UNIQUE INDEX tower_value_chain_pkey ON ecl_projection.tower_value_chain USING btree (id)`
- `tower_value_chain_unique` — `CREATE UNIQUE INDEX tower_value_chain_unique ON ecl_projection.tower_value_chain USING btree (tenant_key, assessment_id, projection_version, page_key, row_key)`
