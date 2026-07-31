# Extending Foundation V2 to skyharbor-air — real scope

## Status

**Phase 0 (freeze) complete** — see
`clients/skyharbor-air/execution/skyharbor-air-source-corpus-v1.0.0.freeze-manifest.json` and
`docs/ops/dual-tenant-knowledge-execution-program.md`'s SkyHarbor entry.

**Phase 1 (zero-data infrastructure) provisioned and independently verified, 2026-07-31.** See
`clients/skyharbor-air/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/`.
`az deployment sub what-if` ran clean against the live `abarva-lab-sub` subscription first (55 Create /
0 Modify / 0 Delete, fully isolated to the new resource group), then `az deployment sub create` actually
provisioned the dedicated boundary — not shared with `airline-demo-new`'s existing infrastructure.
Independently re-verified via direct `az resource list` / `az resource show` / `az role assignment list`
queries (not trusted from the deployment exit code alone): resource group `rg-abarva-skair-lab-eus2-001`
(`provisioningState: Succeeded`), all 6 managed identities, both storage accounts (`stabskairlabeus2001`,
`stabskairevaleus2001`) with their full container sets, Key Vault `kv-abarva-skair-lab-eus2` (confirmed
correctly rejecting non-private-network access — `publicNetworkAccess: Disabled` working as designed),
VNet + 3 private DNS zones/links + 3 private endpoints, Postgres Flexible Server, Container Apps
environment, all 14 ACA job definitions, Defender-for-Storage malware scanning enabled on the operational
storage account (confirmed via direct resource query — the legacy `az security atp storage show` CLI
alias reported a stale/incorrect `false`), and AcrPull granted to the new managed identities on the
shared ACR (confirmed via `az role assignment list --assignee <principalId>` for at least one identity).

Known gap: the generated Postgres admin password could not be stored in the new Key Vault from this
session — the vault correctly rejected the write because it's not on an approved private-network path
(the same `publicNetworkAccess: Disabled` posture verified above). The password sits in a
locally-permissioned (`chmod 600`) temp file pending manual placement into Key Vault via an approved
path. Day-to-day pipeline auth uses managed-identity/AAD, not this password, so nothing is blocked by
this gap — it's an operational follow-up, not a Phase 1 defect.

Phase 2 onward (PostgreSQL schema bootstrap, source landing, parse, canonical assembly, graph/metrics,
publication, product certification) has not started.

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
- **Done, 2026-07-31**: `clients/skyharbor-air/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/`
  (`main.bicep`, `skair-lab-foundation.bicep`, `skair-acr-pull.bicep`, `skair-lab-jobs.bicep`,
  `skair-defender-storage-malware.bicep`, `skair.lab.bicepparam`), adapted from airline-demo-new's
  working templates with its own address space (`10.76.0.0/22`), resource names (`skair` prefix), and
  Postgres database (`abarva_skyharbor_air_knowledge_lab`). What-if verified clean, then created and
  independently re-verified against the live subscription — see Status section above for the full
  evidence list.
- This was genuinely new billable Azure resource creation, executed only after explicit go-ahead
  ("focus is skyharbor now...end to end", "i have already approved the start") — same standard applied
  to every Azure-touching action this session.
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

Phase 0 and Phase 1 are both done. `rg-abarva-skair-lab-eus2-001` exists and is independently verified.
Next is Phase 2 (PostgreSQL schema bootstrap) — apply the source registry, evidence, working, knowledge,
metrics, governance, publication, consumption, audit, and operations schemas to the new Postgres server,
with RLS/grants/constraints/indexes. Mechanical once decided, but each stage still needs real evidence,
not just an exit code — same discipline applied to Phase 1.
