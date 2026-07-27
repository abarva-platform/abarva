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
| Are promote/link rows true enterprise objects? | Pass with caveat | Promote/link rows now focus on evidence, extracted facts, contracts, commitments, vendors, applications/systems, use cases/programs, metric definitions, risk/control facts, and context facts. Live profiling must still prove current/accepted state before migration. |
| Are the 16 consumption projections enough for shared reporting and aVa later? | Directionally pass | Existing Tower marts, Tower facts/results, context packs, DORA observations, budget rollups, CMDB dependencies, program financials, and vendor spend are captured as projection candidates. This is enough for a target plan, not enough for cutover. |
| Is workflow-only state mistakenly promoted? | Pass after correction | Moves templates, Move instances, Move artifacts, artifact review decisions, Source events, approvals, artifact lifecycle states, proposal fact reviews, Tower validation runs, prompt packages, and runtime contract pointers remain operational. |
| Is Source creating a separate reporting truth? | Controlled | Source event workflow stays operational. Accepted proposal facts, contract evidence rows, vendor commitments, value levers/lines/states, and extracted facts are promotion candidates only after identity, tenant, and evidence review. |
| Are Tower metric definitions separated from observations? | Pass | `cio_tower.measures` is classified as metric definition promotion; `cio_tower.facts`, `cio_tower.measure_results`, `tower_dora_metrics`, `tower_program_financials`, and `tower_vendor_spend` are shared-consumption metric observations. |
| Can Moves decisions/outcomes map cleanly later? | Needs live follow-up | Current static DDL shows Moves workflow state and review records, but no direct promoted Moves object in this pass. The target plan should use domain publication/outbox after approval rather than copying draft workflow rows. |
| Are tenant isolation/RLS issues recorded rather than silently accepted? | Pass | Static tenant/user/client markers are recorded per object; unknowns are explicitly flagged for a later read-only Postgres catalog/RLS audit. |
| Does every row have one clear disposition? | Pass | Every row has one of retain operational, promote/link canonical Knowledge, shared consumption projection, archive, or replace. |

## Important Boundaries

- This package authorizes analysis and planning only.
- It does not authorize schema migration, source loading, Azure changes, Cube/Superset/Observable wiring, aVa retrieval changes, or product cutover.
- Promotion/link means "candidate object family that may publish to canonical Knowledge after review"; it does not mean the whole current table becomes the canonical system of record.
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
