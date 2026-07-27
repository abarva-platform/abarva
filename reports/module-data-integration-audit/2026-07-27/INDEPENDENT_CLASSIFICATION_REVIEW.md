# Independent Classification Review

> Scope: static repository audit only. No Azure resources, production data, schemas, APIs, dashboards, migrations, or tenant records were mutated.

## Review Verdict

Conditional pass for PR #5679 as an audit baseline, not as migration authority.

The first generated package was not acceptable because code-reference extraction had created code-only pseudo objects such as incidental words from prose and SQL snippets. The generator was corrected so inventory rows come only from parsed migration DDL. Focused code references remain consumer evidence only.

After correction, the inventory is materially cleaner:

| Measure | Result |
| --- | ---: |
| Persisted objects reviewed | 131 |
| Moves objects | 11 |
| Source objects | 50 |
| Tower objects | 70 |
| Retain operational | 72 |
| Promote/link canonical Knowledge | 38 |
| Shared consumption projection | 16 |
| Archive | 5 |
| Replace | 0 |

## Classification Review

| Review Question | Result | Notes |
| --- | --- | --- |
| Are promote/link rows true enterprise objects? | Pass with caveat | Promote/link rows now focus on evidence, extracted facts, contracts, commitments, applications/systems, use cases/programs, metric definitions/observations, risk/control facts, relationship assertions, outcomes, actions, and context facts. Live profiling must still prove current/accepted state before migration. |
| Are the 16 consumption projections enough for shared reporting and aVa later? | Directionally pass | Existing Tower marts, Tower facts/results, context packs, DORA observations, budget rollups, CMDB dependencies, program financials, and vendor spend are captured as the current persisted-object projection candidates. Source and Moves target projections belong to the later Module Integration Target Plan. |
| Is workflow-only state mistakenly promoted? | Pass after correction | Moves templates, Move instances, Move artifacts, artifact review decisions, Source events, approvals, artifact lifecycle states, proposal fact reviews, Tower validation runs, prompt packages, and runtime contract pointers remain operational. |
| Is Source creating a separate reporting truth? | Controlled | Source event workflow stays operational. Accepted proposal facts, contract evidence rows, vendor commitments, value levers/lines/states, and extracted facts are promotion candidates only after identity, tenant, and evidence review. |
| Are Tower metric definitions separated from observations? | Pass | `cio_tower.measures` is classified as metric definition promotion; `cio_tower.facts`, `cio_tower.measure_results`, `tower_dora_metrics`, `tower_program_financials`, and `tower_vendor_spend` are shared-consumption metric observations. |
| Can Moves decisions/outcomes map cleanly later? | Needs live follow-up | Current static DDL shows Moves workflow state and review records, but no direct promoted Moves object in this pass. The target plan should use domain publication/outbox after approval rather than copying draft workflow rows. |
| Are tenant isolation/RLS issues recorded rather than silently accepted? | Pass | Static tenant/user/client markers are recorded per object; unknowns are explicitly flagged for a later read-only Postgres catalog/RLS audit. |
| Does every row have one clear disposition? | Pass | Every row has one of retain operational, promote/link canonical Knowledge, shared consumption projection, archive, or replace. |

## Important Boundaries

- This package authorizes analysis and planning only.
- It does not authorize schema migration, source loading, Azure changes, Cube/Superset/Observable wiring, aVa retrieval changes, or product cutover.
- Promotion/link means "provisional object family that may publish to canonical Knowledge after review"; it does not mean the whole current table becomes the canonical system of record.
- Products remain domain workflow owners. Canonical Knowledge owns enterprise identity and reviewed facts. Consumption projections serve dashboards, aVa, exports, and BI after parity proof.

## Required Next Artifact

After this audit baseline merges, the next artifact should be a Module Integration Target Plan:

```text
Operational workflow tables
        ↓
Domain publication/outbox
        ↓
Canonical identity map
        ↓
Reviewed Knowledge promotion/link
        ↓
Shared consumption projections
        ↓
Cube / Nexus / aVa / Superset / Observable
```

Do not begin module migration until the Healthcare execution path proves the publication and consumption framework with certified loaded data.

## Final Row-Level Spot Check

The final spot check passed:

- All 131 persisted objects appear exactly once.
- Every object has one primary disposition.
- Writable tables and materialized views are distinguished.
- Current focused code consumers are recorded where statically visible.
- Tenant/RLS posture is recorded as static evidence or flagged for live DB/RLS verification.
- All 38 promotion candidates carry a provisional canonical object family and mapping confidence.
- All 16 shared-consumption projections carry consumer and projection cutover guidance.
- All 5 archive items carry archive-only cutover guidance.

## Targeted Correction Patch

The final targeted patch addressed the four review blockers without reopening the approved 131-object inventory:

- Replaced coarse canonical target labels with `provisional_canonical_object_family` and `mapping_confidence`.
- Corrected proposal facts, vendor commitments, contracts, contract evidence, optimization findings, meeting outcomes, value-family rows, and AI-control rows to narrower provisional families or `to_be_mapped_after_live_profile`.
- Clarified that the 16-row projection catalog is the current persisted-object discovery catalog, not the complete future cross-module projection catalog.
- Reconciled the 131-object audit to the 129-row migration backlog: 5 archive-only objects excluded from migration rows, 3 Wave 0 foundation prerequisites added, no audited persisted object missing.
- Narrowed the Moves orchestrator sunset target so `deliverable_runs` is retained as a durable job/run ledger while only `generated_artifacts` authority is a future convergence/sunset candidate.

## Follow-On Package

A separate planning backlog package now exists at `reports/module-migration-sunset-backlog/2026-07-27/`. It tracks path-level migration and sunset candidates separately from the factual 131-object audit. That package is planning-only and does not authorize migration, backfill, dual-write, cutover, archive, drop, Azure mutation, Postgres mutation, or runtime change.
