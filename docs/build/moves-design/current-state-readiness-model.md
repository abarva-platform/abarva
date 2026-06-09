# Current-State Document-Readiness Model (Moves P0/P1/P2)

**Status:** design · 2026-06-09
**Driver:** Originate a _real_ Move — "AI-Powered Product Development Lifecycle" (SkyHarbor Air) — whose charter actually requests and tracks the real current-state inputs (DORA metrics, IT-systems inventory, IT org, etc.). No seeded moves.
**Design principle:** reuse the substrate that already exists; close the one real gap (a per-phase, user-supplied document-readiness model). Pilot-grade, not demo.

---

## 1. The gap this closes

Today the Moves module has **no concept of "current-state documents the user must supply"**:

- `WorkflowStep.required_user_inputs[]` exists but is **purely descriptive** — no DB binding, no tracking, no enforcement, no UI.
- Gate criteria (`governance.ts` `GATE_RULES` + PhasePack `gate_criteria[]`) are **artifact-centric**: they check _"is the charter signed off"_, never _"did the user provide the DORA baseline / IT org / systems inventory that the charter is supposed to be built on."_
- The charter sections (`PHASE_CANVAS_SECTIONS` in `StrategicMovePhaseClient.tsx`) are populated by chat, with no notion of the evidence they should rest on.

Result: a charter can advance on prose alone. For a pilot we want the charter to **name the current-state evidence it needs, show what's provided vs missing, and let the user supply it** (paperclip), with an **honest ingestion-state ladder** (never claim "loaded" before it's committed + retrievable — per AGENTS.md context-ingestion truth standard).

## 2. What already exists (reuse, do not rebuild)

| Need                      | Existing backing table(s)                                                                                           | Source doc              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| DORA engineering baseline | `tower_dora_metrics` (deploy_freq, lead_time, change_fail_rate, mttr)                                               | CI/CD export CSV        |
| Delivery quality / MTTR   | `tower_itsm_records` (incidents/changes, mttr_minutes, change_success)                                              | ServiceNow ITSM export  |
| IT systems & dependencies | `tower_cmdb_cis`, `tower_cmdb_dependencies`                                                                         | CMDB export             |
| IT / engineering org      | `tower_workforce`, `enterprise_graph_edges` (reports_to)                                                            | HRIS export / org chart |
| AI tooling adoption       | `tower_ai_tool_usage`, `tower_claude_code_usage`                                                                    | tool admin export       |
| Toolchain / throughput    | `tower_jira_issues`                                                                                                 | Jira export             |
| Segment coverage/health   | `data_inventory_segments` (coverage_score, health_state per segment: it_landscape, org_structure, it_financials, …) | computed                |
| Citations / trust         | `evidence_ledger` (append-only, every claim cites a source)                                                         | —                       |
| Upload intake             | `POST /api/programs/workspace/[moveId]/upload` → `program_attachments` → async chunk → `program_evidence_items`     | paperclip               |

Design precedents to mirror: `src/lib/programs/workshop-readiness.ts` (deterministic `evidenceToCapture[]` per workshop) and `docs/build/moves-design/discovery-engine-design.md` (P2 maturity model, 8 dimensions, two-gap model).

**The only missing seam:** upload → _classify_ → _commit to the domain table_ (a DORA CSV lands as an attachment + RAG chunks today, but is **not** parsed into `tower_dora_metrics`).

## 3. Current-state evidence families (for this Move type)

For "AI across the product-development lifecycle":

| Family key              | Evidence                                                     | Backing source                                        | Phase first required | Severity       |
| ----------------------- | ------------------------------------------------------------ | ----------------------------------------------------- | -------------------- | -------------- |
| `eng_performance_dora`  | DORA 4-metric baseline                                       | `tower_dora_metrics` / upload CSV                     | P1                   | hard           |
| `it_org_structure`      | Eng/IT org: teams, levels, contractor ratio, decision rights | `tower_workforce` + `enterprise_graph_edges` / upload | P1                   | hard           |
| `stakeholder_map`       | Named decision-rights map                                    | `program_evidence_items` / charter                    | P1                   | hard           |
| `it_systems_landscape`  | App/system inventory + dependencies the SDLC touches         | `tower_cmdb_cis` / upload                             | P1                   | soft → P2 hard |
| `delivery_quality_itsm` | Incidents/changes, MTTR, change-success                      | `tower_itsm_records` / upload                         | P2                   | soft           |
| `ai_tooling_adoption`   | Current AI dev-tool penetration                              | `tower_ai_tool_usage` / upload                        | P2                   | soft           |
| `toolchain_process`     | SDLC workflow / throughput                                   | `tower_jira_issues` / upload                          | P2                   | soft           |

Phase intent:

- **P0 Originate** — lightweight. No hard current-state. Surface a _manifest preview_: "to charter this, you'll need: DORA baseline, IT org, systems inventory." Sets expectations; nothing blocks.
- **P1 Charter** — hard: `eng_performance_dora`, `it_org_structure`, `stakeholder_map` (the Stakeholders, Success-metrics and Value-range sections can't be honest without them). Soft: `it_systems_landscape`.
- **P2 Diagnose** — all families, quantified + maturity-scored → feeds `discovery_report` "Current State Baseline (quantified metrics with source citations)".

## 4. Readiness data model (minimal new schema)

**v1 = compute-on-the-fly, no migration.** A pure resolver answers, per required family for `(moveId, clientId, phase)`:

```
status ∈ { committed | parsing | staged | missing }
```

honest ladder (AGENTS.md): `staged` = attachment uploaded; `parsing` = chunked / extraction queued; `committed` = rows actually in the backing tower\_\* table for this client_id; (retrieval proof handled by the existing retrieval path). The panel **never** shows "committed" until rows exist.

Satisfaction check per family:

1. committed rows in backing table for `client_id`? → `committed`
2. else attachment in `program_attachments` classified to this family, extraction done? → `parsing`
3. else attachment staged but not yet parsed? → `staged`
4. else → `missing`

Persist only the **requirement→attachment link** when a doc is supplied (a thin `family` tag on the attachment + an in-row note), so we avoid a new table and avoid drift. If a durable per-move ledger is wanted later, add `move_current_state_requirements(move_id, family, phase, severity, status, source_attachment_id, last_checked)` — deferred.

## 5. Resolver + registry (code shape)

- `src/lib/programs/current-state-readiness.ts`
  - `CURRENT_STATE_FAMILIES: Record<FamilyKey, FamilySpec>` — label, why-needed, backing table, source-doc hint, accepted mime/format.
  - `requiredFamiliesForPhase(moveType, phase): RequiredFamily[]` (with severity).
  - `resolveCurrentStateReadiness(ctx, moveId, phase): Promise<ReadinessReport>` → `{ families: [{key,label,severity,status,backing,whyNeeded,attachmentId?}], coverageScore, hardGaps[], softGaps[] }`.
  - Pure + deterministic seed for the registry; the resolver does read-only counts against tower tables / attachments. Unit-tested with a mocked fluent client.
- Mirrors `workshop-readiness.ts` exactly in spirit (deterministic request list + status), so it's idiomatic.

## 6. UI surface

New **"Current-state readiness"** region in `StrategicMovePhaseClient.tsx`, beside Gate criteria:

- P0: manifest preview (read-only "what you'll need").
- P1/P2: each family as a row → status chip (Committed / Parsing / Staged / Missing) + why-needed + a **"Provide…"** paperclip that calls the existing upload route with a `family` hint.
- Hard `missing` families render as **soft blockers** next to the gate ("Charter can advance, but DORA baseline is unprovided — Success metrics will be unsourced").
- Honest copy throughout (received ≠ committed ≠ retrievable).

Served via `GET /api/v1/programs/[id]/current-state-readiness?phase=N` (thin wrapper over the resolver).

## 7. Ingest ladder (the missing classify→commit seam)

Upload (exists) → staged → chunked (exists) → **[NEW] classify to family** (mime + filename + header sniff; cheap, deterministic for CSV) → **[NEW] per-family parser** commits rows to the tower table → segment coverage refresh → readiness flips `committed`.

- v1 parsers: **CSV families with tested deterministic mapping** (DORA first, then CMDB, workforce). XLSX/PDF org charts stay `staged` / review-required (never auto-committed) — per the bulk-loader contract.
- Every committed row also writes an `evidence_ledger` entry (`source_type: document_extract`, `source_ref: {attachmentId, row}`).

## 8. Build slices (step by step)

| Slice  | Scope                                                                                                                                                                       | Migration?   | Deploy?            |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------ |
| **S1** | This design doc                                                                                                                                                             | no           | no                 |
| **S2** | `current-state-readiness.ts` registry + resolver + unit tests                                                                                                               | no           | no                 |
| **S3** | Readiness panel in workspace + `GET …/current-state-readiness` route                                                                                                        | no           | yes                |
| **S4** | Upload `family` hint + attachment→requirement link + honest status ladder                                                                                                   | maybe (thin) | yes                |
| **S5** | DORA CSV parser → `tower_dora_metrics` commit + evidence_ledger + coverage refresh + retrieval proof                                                                        | maybe        | yes (ACA, in-VNet) |
| **S6** | Originate the REAL SkyHarbor "AI-Powered Product Development Lifecycle" Move P0→P1 through the panel; supply a real DORA CSV; prove readiness flips Committed + retrievable | no           | live verify        |

P2 Diagnose maturity model = separate arc, reuses `discovery-engine-design.md`.

## 9. Boundaries honored

- Identity vs context separation intact: this is **context/evidence**, supplied via the **governed upload path** only (no backdoor writes; the operator-persona identity work stays separate).
- Single-tenant: readiness is scoped to `ctx.clientId`; no cross-tenant reads.
- Truth standard: states reported separately; no "loaded" until committed + retrievable; CSV-only auto-commit in v1, binaries stay review-required.
- No seeded move: S6 originates for real.
  </content>
  </invoke>
