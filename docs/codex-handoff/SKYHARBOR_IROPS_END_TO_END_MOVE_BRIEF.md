# Codex Brief — SkyHarbor IROPS end-to-end Move (new use case, generated inputs, real artifacts)

## 0. Objective

Run a **complete, organic, end-to-end Strategic Move** on the **SkyHarbor Air** tenant for a **NEW
airline IROPS use case** — generating the **detailed evidence input files** the workflow demands,
uploading them at each phase gate, advancing the Move **organically through every phase (P0→P5)**, and
letting the platform **generate real, grounded artifacts** — proving the newly-deployed **governed
deliverable pipeline** end to end.

**No shortcuts.** Do NOT click pre-built "Board artifacts / View" decks. The whole point is that
artifacts are generated *from real uploaded evidence*, reached organically through the phases. The
engine refuses to fabricate — it will block a charter until real evidence is uploaded and committed.
Honor that: generate detailed, realistic inputs and feed them through properly.

## 1. What is already deployed (context — do not rebuild)

The **Deliverable Quality Transformation** shipped in PR #3801 (merged to `main`, commit
`79b58ea1c`, deployed via `aca-main-deploy`). It is a **single governed pipeline** every deliverable
for every tenant flows through (8 stages):

1. Tenant context broker → 2. Artifact profile registry → 3. Governed generation pass (injected
egress adapter) → 4. Required exhibit generation → 5. **Deliverable Quality Contract** (blocking gate)
→ 6. Renderer selection by profile → 7. Persist → 8. Audit/source trace.

Key code: `src/lib/deliverables/profiles/` (27 profiles incl. 14 Source), `…/quality/` (the contract:
`deliverable-quality-contract.ts`, `assess-deliverable.ts`, gates), `…/synthesis/charter-shaper.ts`,
`src/lib/visual-system/` (`architecture-model.ts`, `architecture-html-renderer.ts`, `storyline-deck.ts`,
`architecture-generation.ts` — the governed ArchitectureModel pass), wired in
`src/lib/deliverables/orchestrator/{generate-service,persistence}.ts`.

**Two feature flags are LIVE-ON for SkyHarbor** (verified set on `job-abarva-deliv-worker`,
`job-abarva-deliv-worker-event`, and the web app `ca-abarva-web-lab-eastus`):
- `ABARVA_FEATURE_DELIVERABLE_STRUCTURED_EXHIBITS_TENANTS=skyharbor,skyharbor-air` — generate the
  ArchitectureModel via the governed pass and render the **premium HTML architecture exhibit**.
- `ABARVA_FEATURE_DELIVERABLE_QUALITY_CONTRACT_TENANTS=skyharbor,skyharbor-air` — **enforce** the
  contract (a non-`client_ready` artifact is quarantined as `internal_draft`).

So when a SkyHarbor **architecture deliverable** (`target_state_architecture`, renderer
`html_architecture`) is generated, the worker will: generate prose → call the governed
ArchitectureModel pass (live, egress-audited) → render the HTML architecture exhibit → enforce the
quality gate. Your job is to reach that point **organically** and verify the output.

## 2. Environment

- App: `https://app.abarva.ai` — signed in as SkyHarbor Air (the session is on this tenant).
- Moves surface: `/strategic-moves`; new move via **+ New Move**; move detail
  `/strategic-moves/{id}`; phase workspace `/strategic-moves/{id}/phase/{n}`.
- Generation runs in the **worker** (`runDeliverableForTenant` in `generate-service.ts` →
  `persistDeliverable`) drained by `job-abarva-deliv-worker-event`.
- Repo: this checkout. SkyHarbor substrate (for realism/grounding):
  `datasets/skyharbor-air-synthetic-v4/` (org/it/apps/systems/infra/data/kpis/outcomes families +
  `source-docs/SkyHarbor_IROPS_Agentic_Roadmap_SYNTHETIC.md`).

## 3. The NEW use case to run

**"SkyHarbor Recovery Command — Crew & Aircraft Recovery Orchestration during IROPS"** — an
AI-product-enablement Move: during irregular operations (weather, ATC, crew/aircraft disruptions),
an agentic recovery-command layer ingests disruption events, proposes crew-legal and
aircraft-feasible recovery options, and an ops controller approves — minimizing passenger
misconnects, crew illegalities, and recovery cost. (Distinct from the existing "Proactive Passenger
Recovery" move — this is the crew/aircraft/network recovery angle.)

## 4. Generate the detailed input/evidence files (grounded, realistic)

The P1 Charter blocks on **5 hard evidence gaps**. GENERATE a detailed, realistic file for each,
grounded in SkyHarbor's airline context (use the substrate under `datasets/skyharbor-air-synthetic-v4/`
as the realism anchor — real system names, org units, KPI shapes). Save them to a working folder
(e.g. `~/Downloads/skyharbor-irops-inputs/`). Schema-valid CSV/XLSX tables auto-commit; free-form
PDF/DOCX enter review-required (still acceptable).

| # | Gap | File to generate | Must contain |
|---|---|---|---|
| 1 | Operations / IT org structure | `01_it_org_structure.csv` | org unit, owner, role, reporting-to, headcount for SkyHarbor IT/Ops/Network Ops Control |
| 2 | Value & KPI baseline | `02_value_kpi_baseline.csv` | KPI, current value, target, unit, owner, data source (misconnect rate, recovery cost/event, crew-illegality count, OTP, controller manual minutes) |
| 3 | Operational process & decision-flow | `03_operational_process_decision_flow.docx` | the current IROPS recovery process: events in → decisions made → by whom → against which systems (e.g. NetLine/Ops, crew-management, dispatch) and SLAs |
| 4 | Operational event volume & cost | `04_event_volume_cost_baseline.csv` | disruption type, annual event volume, avg recovery cost, penalties, lost revenue, manual effort hours per event |
| 5 | Stakeholder / decision-rights map | `05_stakeholder_decision_rights.csv` | stakeholder, role, decision right (approve/recommend/inform), escalation path (RACI for recovery decisions) |

Make these **detailed and specific** (dozens of rows, real airline terminology, internally
consistent numbers) so the downstream charter, diagnosis, and architecture are richly grounded — not
generic. Also prepare deeper P2/P3 inputs if the workflow asks (current-state systems estate, target
constraints) — the tenant substrate already carries the apps/systems/infra families, so prefer
augmenting with use-case-specific detail.

## 5. Drive the Move end-to-end (organic, phase by phase)

1. **P0 Originate** — create the new Move (`+ New Move`), archetype **AI Product Enablement**,
   tenant SkyHarbor Air, the use case from §3, name a sponsor (e.g. VP Network Operations Control).
2. **P1 Charter** — open the phase workspace. Upload the 5 generated evidence files into their gaps
   (find the file-input elements; CSV schema-valid → auto-commit, docs → review-required → approve
   the parsed evidence). Clear all 5 hard gaps, complete capture (sponsor commitment, stakeholders,
   success metrics, value range, scope), then **pass the P1 gate**.
3. **P2 Discover & Diagnose** — provide/confirm diagnostic evidence; generate the diagnostic readout;
   pass the P2 gate.
4. **P3 Design** — **Approve & Build** the design phase. This generates `target_state_architecture`,
   `solution_design`, `operating_model_design`, `sourcing_strategy`. Because the flags are ON, the
   **Target Architecture** runs through the governed ArchitectureModel pass → **premium HTML
   architecture exhibit** (current→target, named cloud services from the solution, data flow distinct
   from AI control flow, agentic overlay, control points, waves), and the **quality contract**
   enforces (must be `client_ready`, not quarantined).
5. **P4 Roadmap / Business Case** and **P5 Mobilize / Handoff** — generate and pass each gate.

## 6. Verification / acceptance (report honestly, per state)

For each phase, report the **separate ingestion states** (do not collapse to "done"): file generated
→ uploaded → parser accepted → evidence committed → artifact generated → grounded in the uploaded
evidence. Specifically prove:

- The charter was **blocked until** real evidence was uploaded (no fabrication), then cleared.
- The **Target Architecture** rendered as the **premium HTML exhibit** (not prose): it shows the
  current→target physical architecture with **named services drawn from the solution** (airline ops
  systems + the chosen cloud/AI services), **data flow distinct from AI control flow**, the **agentic
  overlay**, control points, and implementation waves — grounded in the SkyHarbor IROPS evidence.
- The **quality contract** result state is **`client_ready`** (and would quarantine if it weren't) —
  check `generated_artifacts.quarantined / quarantine_reason` for the architecture artifact; it must
  be `false`.
- Download/export each artifact and confirm it is genuinely SkyHarbor-IROPS-specific (no generic
  transformation prose, no machinery/phase-labels in the client body, one Open Inputs table).

## 7. Constraints (the bar)

- Organic phase progression only — no clicking pre-built skeleton decks as a shortcut.
- Real, detailed, grounded inputs — generated for THIS use case, consistent and specific.
- Tenant-agnostic pipeline — change nothing per-client in code; everything is data + the live flags.
- If a step is blocked (gate logic, upload sandbox, worker queue), report the exact blocker and state
  rather than faking progress. Capture the artifact ids, the worker run, and the quarantine state as
  evidence.

## 8. Deliverable back

A short report: the new Move id, the 5 generated input files (with row counts), the per-phase
artifacts produced (ids + formats), the **Target Architecture HTML exhibit** (saved/exported), the
quality-contract state for each, and an honest note on anything blocked — proving the governed,
gated, visually-rich pipeline works end-to-end on a real SkyHarbor IROPS use case.
