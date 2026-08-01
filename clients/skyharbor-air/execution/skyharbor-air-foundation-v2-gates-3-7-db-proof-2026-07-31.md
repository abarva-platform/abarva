# SkyHarbor Air Foundation V2 Gates 3-7 DB Proof

Date: 2026-07-31

Tenant: `skyharbor-air`

Scope: isolated lab database execution in `rg-abarva-skair-lab-eus2-001`.

Classification: database-backed execution proof for review, publication, baseline, projection, read-model, reconciliation, and metric parity. This is not signed-in product-surface proof.

Correction, 2026-08-01: this evidence proves sparse accepted-candidate publication and readback only. It does not prove full source-to-consumption parity, does not prove application inventory/details publication, and must not be used as a full data-load certification. Source rows and fields outside the accepted subset still require explicit downstream disposition proof before any load-complete status is claimed.

## Source State

- Source files: 40
- Source records: 140,773
- Source field values: 1,437,376
- Parser executions: 1
- Source-level unexplained variance: 0

## Review Ledger

- Review decisions: 11,228
- Accepted: 40
- Deferred: 11,188
- Rejected: 0
- Approved batch classes: `auto_accept_eligible`, `batch_review_required`
- Approved batches: 4
- Total batches: 44
- Dry-run package hash: `2983ef19ec237d5cc7641ae06259592eb6bd204f61b83e075e1ece89f698bb05`
- Candidate manifest hash: `1443d477894574bf08c534a583bb1d49ff38765b35b618f07bf1ce928f573613`

## Repair Findings

Review apply first failed correctly on `review_decision_guard_failed` with `stale_candidate_hash` for accepted entity candidates. The earliest broken transition was stale stored candidate hashes, not stale review decisions. A technical repair recomputed stored entity candidate hashes and the dry-run package hashes remained stable.

Projection build then failed on a missing publisher grant for `governance.evidence_gap`. Reconciliation audit failed on a missing evaluator grant for `consumption.consumer_reconciliation_ledger`. Both were repaired with least-privilege grants: publisher can select/insert/update evidence gaps, and evaluator can insert/update reconciliation ledger rows without delete or Knowledge mutation.

## DB Execution Results

- Review apply: passed
- Accepted applied: 40
- Knowledge entities: 2
- Knowledge facts: 20
- Knowledge relationships: 0
- Domain publication: passed
- Domain publication ref: `skyharbor-air-source-corpus-v1.0.0:enterprise:domain-publication-v1`
- Domain publication source content hash: `0165deca7284f032fedeb83d8b57fde9e5f4a11f80ce0102a7bab15f96dd6a2f`
- Baseline: passed
- Active baseline: `skyharbor-air-source-corpus-v1.0.0:knowledge-baseline-v1`
- Baseline hash: `b77993253922bc5cf070ac874913279e79a4bba265495eb77dd0ce99f0340d50`

## Consumption Projection Readback

- `enterprise_brief_v1`: 1
- `enterprise_identity_v1`: 1
- `domain_summary_v1`: 2
- `application_inventory_v1`: 0
- `search_document_v1`: 20
- `module_knowledge_packet_v1`: 1
- `relationship_node_v1`: 2
- Other projection contracts: 0 rows where unsupported by accepted content

Application-domain parity was not proven. The zero-row application projection was treated as unsupported by accepted content in this run, but that is not equivalent to proving that application source rows were fully parsed, persisted, dispositioned, and published. A stricter source-to-consumption coverage gate is required before this evidence can support a load-complete claim.

## Reconciliation And Parity

- Reconciliation audit: passed
- Mutated Knowledge: false
- Failed reconciliation rows: 0
- Metric parity passed count: 4
- Metric parity failed count: 0
- Metric parity not-applicable count: 4

Passing measures:

- `application_count`: cube 0, canonical 0
- `vendor_count`: cube 0, canonical 0
- `accepted_relationship_count`: cube 0, canonical 0
- `open_critical_gap_count`: cube 0, canonical 0

Not-applicable measures:

- `critical_application_count`
- `end_of_life_application_count`
- `data_product_count`
- `program_at_risk_count`

## Deployment Boundary

This proof used isolated ACA job executions and the dedicated lab database. It did not deploy or shift `app.abarva.ai` traffic, did not run execute mode outside approved DB jobs, and did not change the boundary snapshot as part of this evidence record.

Next proof state: merge the code repairs through the repo-owned deploy lane, wait for the digest-pinned ACA image, rerun the affected job path on that image, and then perform signed-in runtime proof before claiming product-surface readiness.
