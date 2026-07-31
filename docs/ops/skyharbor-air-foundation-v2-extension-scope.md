# Extending Foundation V2 to skyharbor-air — real scope

## Status

**Phase 0 (freeze) complete** — see
`clients/skyharbor-air/execution/skyharbor-air-source-corpus-v1.0.0.freeze-manifest.json` and
`docs/ops/dual-tenant-knowledge-execution-program.md`'s SkyHarbor entry.

**Phase 1 IaC authored, not executed, as of this PR** — see
`clients/skyharbor-air/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/`.
The templates compile offline (`bicep build` / `bicep build-params`) and define a dedicated boundary
(`rg-abarva-skair-lab-eus2-001`, own VNet/Postgres/storage/Key Vault/6 managed identities) that is not
shared with `airline-demo-new`'s existing infrastructure. No `az` command has been run against real
Azure — no `--what-if`, no `create`. Phase 1 *execution* remains unauthorized and requires its own
explicit go-ahead before any Azure action, per this document's own Phase 1 section below.

## Why this, not the tactical Admin-Loader-connector path

The tactical roadmap (Phase 1–6, `datasets/tenant-inputs/...` → Admin Data Loader → `applications`/
`ai_initiatives`) gets real data in front of users faster, but doesn't implement the actual governed
factory model (source registry → evidence → candidates → review → canonical → publication → baseline →
projections). This document scopes the real thing for skyharbor-air specifically, reusing the pipeline
infrastructure that already exists and is genuinely merged on `main` — `scripts/knowledge/hcdn-job-runner.mjs`
plus `scripts/knowledge/processing/{executor-framework,process-handlers,semantic-gates,review-decision-policy}.mjs`.

**Confirmed before writing this**: that pipeline code is real and reviewed (landed via PR #5730 and
related commits), not throwaway experimentation — the earlier concern about Codex's work applied to the
*data* it loaded for `airline-demo-new`, not this shared machinery. Reusing it is lower-risk than it
looked earlier in this investigation.

## Current disposition (from `dual-tenant-knowledge-execution-program.md`)

| Tenant candidate | State |
|---|---|
| `healthcare-demo-new` | Phase 0 frozen design/source-corpus foundation |
| `airline-demo-new` | Blocked before Phase 0 freeze |
| `skyharbor-air` | **Not a candidate today** — this document proposes adding it |

## The real gap: skyharbor-air's data doesn't live in the shape this pipeline expects

`healthcare-demo-new` and `airline-demo-new` both freeze their source corpus under
`clients/<tenant>/19-template-instantiation-source-corpus/` + `clients/<tenant>/execution/*.freeze-manifest.json`.
skyharbor-air's real, enriched data lives directly in the *active* canonical location
(`datasets/tenant-inputs/active/skyharbor-air/current/`, 26 files, real content, now genuinely rich)
— it was never staged through a "candidate source corpus" freeze step, because that whole flow didn't
exist for this tenant until now. Phase 0 for skyharbor-air means retrofitting a freeze manifest around
data that already exists and is already good, not designing a new corpus from scratch — meaningfully
less work than what healthcare-demo-new or airline-demo-new needed.

## Phased scope

### Phase 0 — Freeze (lightweight, mostly documentation)

- Pin `datasets/tenant-inputs/active/skyharbor-air/current/` at its current commit as the frozen source
  package (content hash per file, already partially present via each file's `source_fingerprint` column).
- Write `clients/skyharbor-air/execution/skyharbor-air-source-corpus-v1.0.0.freeze-manifest.json`
  matching the shape of the healthcare/airline equivalents.
- Independent semantic audit: run `npm run audit:tenant-quality -- --tenant skyharbor-air` (built this
  session) and attach its real output as the audit evidence this gate requires.
- Add `skyharbor-air` to the disposition table in `dual-tenant-knowledge-execution-program.md`.
- **Cost/risk: low.** No Azure action. A few hours of documentation work.

### Phase 1 — Zero-data infrastructure (real cost, needs explicit go-ahead)

- A dedicated Azure boundary for skyharbor-air — **not** shared with `airline-demo-new`'s existing
  `rg-abarva-airdn-lab-eus2-001` infra. The program's own rule: "Sharing tenant data, identities,
  publication state... is not [allowed]." skyharbor-air needs its own resource group, storage account,
  Postgres database (or tenant-isolated schema with RLS), Key Vault, and managed identities (ingest,
  review, publish, read, evaluator, admin) — six identities, matching the pattern in
  `clients/airline-demo-new/18-phase2b3c-azure-lab-implementation/00-implementation-charter/APPROVED_BOUNDARY_SNAPSHOT.json`.
- **IaC authored**: `clients/skyharbor-air/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/`
  (`main.bicep`, `skair-lab-foundation.bicep`, `skair-acr-pull.bicep`, `skair-lab-jobs.bicep`,
  `skair.lab.bicepparam`), adapted from airline-demo-new's working templates with its own address space
  (`10.76.0.0/22`), resource names (`skair` prefix), and Postgres database
  (`abarva_skyharbor_air_knowledge_lab`). Compiles offline; never deployed.
- This is genuinely new billable Azure resource creation. **Do not execute without an explicit,
  separate go-ahead** — same standard applied to every Azure-touching action this session. Writing and
  compiling the templates is safe, reversible, file-only work and is done; running
  `az deployment sub what-if` or `create` against them is the actual checkpoint.
- Plan-only/what-if first, matching the "zero-data infrastructure plan and what-if" language the
  program doc already uses for `healthcare-demo-new`'s next allowed action.

### Phase 2 — PostgreSQL bootstrap

- Apply schemas (source registry, evidence, working, knowledge, metrics, governance, publication,
  consumption, audit, operations) to the new boundary. RLS, grants, constraints, indexes.
- Mechanical once Phase 1 infra exists — the schema definitions are shared/tenant-generic, not
  something to redesign per tenant.

### Phase 3 — Source landing

- Land the frozen `datasets/tenant-inputs/active/skyharbor-air/current/` package via
  `hcdn-job-runner.mjs --process skyharbor-air-source-register-v1 --mode preflight` first, then
  `--mode execute` (requires the explicit `ABARVA_HCDN_EXECUTE_ACK` env var the runner enforces).

### Phase 4 — Parse candidates

- `source-parse-v1` stage. Reconciles parser output against the source manifest; rejected rows quarantine
  with reasons, not silently dropped.

### Phase 5 — Canonical assembly

- `knowledge-normalize-v1` → `entity-resolve-v1` → `knowledge-validate-v1` stages. Identity, provenance,
  confidence, relationships — this is where skyharbor-air's already-built `12_relationships.csv`
  (3,318 rows) and `12b_interview_initiative_metric_crosswalk.csv` become real evidence-linked candidates
  instead of flat files.

### Phase 6 — Graph and metrics

- `domain-publish-v1` stage builds relationship/metric projections from canonical knowledge. No metric
  is calculated by graph projection — values still come from the deterministic layer.

### Phase 7 — Publication

- `baseline-publish-v1` stage. Governance signoff, publication manifest, rollback point.

### Phase 8 — Product certification

- `projection-build-v1` → `home-readmodel-v1` stages, then signed-in proof against Home/Knowledge
  Explorer surfaces for skyharbor-air specifically. Same discipline as Stage 6 on the tactical operating
  sequence built earlier this session — this isn't a new acceptance bar, it's the same one.

## What this does NOT replace

Tower, Moves, and Source's own schemas (`cio_tower.mart_*`, `engagements`/`program_*`,
`data_inventory_records`) are genuinely separate systems, confirmed this session — Foundation V2's
`consumption.*_v1` feeds the Knowledge Explorer specifically, not those three. Extending Foundation V2
to skyharbor-air makes the Knowledge Explorer real for this tenant; it does not substitute for the
Phase 1–4 tactical connector work already scoped on the operating-sequence roadmap for the other
modules.

## Honest effort estimate

Phase 0: hours. Phase 1: real Azure work, needs its own go-ahead, likely a day of careful provisioning
once approved. Phases 2–8: mostly mechanical once 0–1 are done — the pipeline stages are generic and
already built — but each needs real validation, not just "the job exited 0," matching the three-status-
dimension discipline (technical / data-quality / product-usability) established this session.

## Immediate next step

Phase 0 is done. Phase 1's IaC is authored and compiles offline. What remains before Phase 2 can start
is Phase 1 *execution* — actually provisioning `rg-abarva-skair-lab-eus2-001` and everything inside it.
That is real, billable, hard-to-reverse infrastructure creation and requires its own explicit go-ahead
before any `az` command runs — not implied by this document, by Phase 0 landing, or by the IaC existing
as files on disk.
