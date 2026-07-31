# Tenant Knowledge Execution Program

Status: Phase 0 control document. This document defines the execution path; it
does not authorize Azure, PostgreSQL, ingestion, publication, or runtime changes.

Formerly "Dual-Tenant Knowledge Execution Program" — renamed 2026-07-31 when a
third candidate (`skyharbor-air`) was added. No other document or code
references the old title text; only the filename is unchanged, to avoid link
rot.

## Current Disposition

| Tenant candidate | Current state | Next allowed action | Blocked action |
| --- | --- | --- | --- |
| `healthcare-demo-new` | Phase 0 frozen design/source-corpus foundation | Zero-data infrastructure plan and what-if | Data landing, parser execution, product wiring |
| `airline-demo-new` | Blocked before Phase 0 freeze | Remediate source corpus and rerun independent audit | Freeze, provision, load, publish |
| `skyharbor-air` | Phase 0 frozen, Phase 1 provisioned, Phase 2 schema applied and independently verified (ledger + sha256 cross-check) | Deeper RLS/table readback once a merged image is available, then source landing (Phase 3) | Parser execution, publication, product wiring |

The healthcare candidate was the reference implementation for the execution
factory. skyharbor-air reaches an equivalent Phase 0 state via a different
path — its source package was never staged through a separate candidate
directory; it was frozen in place from the already-enriched, already-governed
canonical dataset (every addition went through its own PR and release record).
Neither inherits the other's approval, and airline-demo-new inherits nothing
from either — it remains blocked on its own remediation.

## Non-Negotiable Model

AbarVa's information path remains:

1. Client intake, organized by source owner.
2. Source adapters, one per intake tab or evidence family.
3. Canonical enterprise model, the source of truth.
4. Product projections for Home, Intelligence, Moves, Source, Tower, Learn, and
   export.

No product owns data. Home does not own applications, Source does not own
vendors, Tower does not own value, Moves does not own programs, and
Intelligence does not own facts. Products consume governed projections from the
canonical model.

## Execution Lifecycle

| Phase | Purpose | Exit gate |
| --- | --- | --- |
| Phase 0: freeze | Pin source package, manifest, hashes, hidden truth, crosswalk, review reports, expected scale, and boundaries | Package merged; independent semantic audit pass; hashes match; no cross-tenant IDs; source/evaluator separation proven |
| Phase 1: zero-data infrastructure | Create isolated tenant data plane design and plan/what-if only | No public DB access; tenant key required; evaluator storage isolated; identity/RBAC plan ready; digest-pinned jobs |
| Phase 2: PostgreSQL bootstrap | Apply schemas only after approval: source registry, evidence, working, knowledge, metrics, governance, publication, consumption, audit, operations | RLS, grants, constraints, indexes, and reconciliation views pass with no enterprise facts |
| Phase 3: source landing | Land immutable source corpus into tenant-specific storage | Source manifests, hashes, sensitivity, owner, and source family validation pass |
| Phase 4: parse candidates | Parse sources into working candidate facts and evidence | Parser output reconciles to source manifests; rejected rows are quarantined with reasons |
| Phase 5: canonical assembly | Promote reviewed facts into canonical Knowledge | Identity, provenance, confidence, relationships, and hidden-truth reconciliation pass |
| Phase 6: graph and metrics | Build relationship and metric projections from canonical Knowledge | Graph endpoint quality and metric lineage pass; no metric is calculated by graph projection |
| Phase 7: publication | Publish certified baselines and product read models | Governance signoff, publication manifest, and rollback point captured |
| Phase 8: product certification | Test Home, Intelligence, Moves, Source, Tower, and export against the published baseline | Signed-in proof and answer/evidence certification pass |

## Planned Physical Boundaries

| Domain | Role |
| --- | --- |
| Azure Database for PostgreSQL | Operational system of record for source registry, evidence, working, canonical Knowledge, metrics, governance, publication, consumption, audit, and operations schemas |
| `pgvector` | Retrieval support inside the governed Postgres substrate |
| Apache AGE | Graph projection only; not the authoritative fact store |
| Cube | Metric contract layer after canonical metrics exist |
| Superset | Internal analytics and operational inspection after baseline publication |
| Observable | Executive artifacts after publication contracts are stable |
| Grafana | Platform operations only, not business intelligence |

Databricks/Delta Lake is not in the critical path for this execution slice.

## Required Tenant Isolation

Each tenant data plane must have its own:

- resource group or equivalent deployment boundary;
- storage account and immutable evidence containers;
- Postgres database or tenant-isolated schema set with RLS;
- Key Vault or secret boundary;
- managed identities for source loader, parser worker, knowledge worker,
  publisher, runtime reader, operations admin, and evaluator;
- evaluator storage separated from parser/runtime access;
- ACA job definitions and digest-pinned images;
- audit logs and proof bundles.

Sharing implementation templates is allowed. Sharing tenant data, identities,
publication state, hidden truth, evaluator artifacts, or runtime-read access is
not.

## Phase 0 Healthcare Freeze

Healthcare is frozen by:

- `clients/healthcare-demo-new/execution/healthcare-demo-new-source-corpus-v1.0.0.freeze-manifest.json`
- review ZIP SHA-256:
  `1c6a5aa2a265168e59ff03c2ccbdddaaef4c680c86c3fb628737957559396352`
- package manifest:
  `clients/healthcare-demo-new/19-template-instantiation-source-corpus/PACKAGE_MANIFEST.json`
- validation reports under:
  `clients/healthcare-demo-new/19-template-instantiation-source-corpus/05-validation/`

This freeze does not load data, provision cloud resources, add a runtime tenant
key, or wire any product surface.

## Phase 0 SkyHarbor Freeze

SkyHarbor is frozen by:

- `clients/skyharbor-air/execution/skyharbor-air-source-corpus-v1.0.0.freeze-manifest.json`
- semantic audit evidence:
  `clients/skyharbor-air/execution/skyharbor-air-tenant-quality-audit-2026-07-31.json`
  (`npm run audit:tenant-quality -- --tenant skyharbor-air` — 14/26 files `PRODUCT_USABLE`, 12
  `USABLE_WITH_LIMITATIONS` with named findings, 0 `NOT_USABLE`)
- source package: `datasets/tenant-inputs/active/skyharbor-air/current/` (26 files) +
  `datasets/tenant-inputs/skyharbor-air/interviews/executive_interviews.csv` (510 rows)

Unlike Healthcare and Airline, SkyHarbor has no restricted-evaluator hidden-truth/crosswalk package
yet — recorded as a real, unfilled gap in the freeze manifest, not fabricated to match the template
shape. This freeze does not load data, provision cloud resources, add a runtime tenant key, or wire
any product surface.

## Phase 1 SkyHarbor Zero-Data Infrastructure

Provisioned and independently verified 2026-07-31. IaC at
`clients/skyharbor-air/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/`.
`az deployment sub what-if` ran clean (55 Create / 0 Modify / 0 Delete) before `az deployment sub create`
actually provisioned the dedicated boundary `rg-abarva-skair-lab-eus2-001` — not shared with
`airline-demo-new`'s infrastructure. Verified independently via direct `az resource list` / `az resource
show` / `az role assignment list` queries, not trusted from the deployment exit code alone. Full evidence
list in `docs/ops/skyharbor-air-foundation-v2-extension-scope.md`'s Status section. No source data has
landed yet.

## Phase 2 SkyHarbor PostgreSQL Bootstrap

Applied and independently verified 2026-07-31. The dedicated Postgres server is authoritative for this
lane (not the shared `db-migration-lab.yml` workflow, which targets only the shared control-plane
database). Applied exactly one migration —
`supabase/migrations/20260729015000_knowledge_publication_consumption_phase3c2e.sql` (source_registry,
evidence, working, knowledge, metrics, governance, publication, consumption, audit, operations schemas,
RLS keyed on `tenant_key`) — via a new parameterized, VNet-internal ACA job
(`job-skair-private-operator-lab`), never the full 301-migration set. Verified via a separate readback
execution (`db:migrate:ledger`): `totalApplied: 1`, and the recorded sha256 matches the on-disk file
byte-for-byte. Deeper RLS/table-level readback is written but blocked on a merged image — see
`docs/releases/records/2026-07-31-skyharbor-air-foundation-v2-phase2-schema-bootstrap.md` for full
evidence. No source data has landed yet — Phase 3 (source landing) is next.

## Airline Block

Airline is blocked by:

- `clients/airline-demo-new/execution/airline-demo-new-source-corpus-v1.0.0.blocked-manifest.json`

Airline can proceed only after its current package receives an independent
semantic audit pass and a freeze manifest equivalent to the healthcare one.

## Gate Discipline

Do not collapse these states:

- package exists;
- package is frozen;
- infrastructure is planned;
- infrastructure is applied;
- source files landed;
- parser ran;
- facts reconciled;
- Knowledge baseline published;
- product read model refreshed;
- signed-in product certification passed.

Each state needs its own proof. Anything else is how old, thin, or stale data
quietly becomes a product claim.
