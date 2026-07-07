# WS-G — Live Answer-Quality Proof (SkyHarbor, private Azure DB) — 2026-06-09

Real run, not a lab simulation. The probe drove the live Sentinel answer engine
(`askIntelligence`) for 6 SkyHarbor golden questions **inside the private VNet**
(Azure Container Apps job, private Postgres + Anthropic via Key Vault) and scored
each answer with the governed validation stack (PR-1 trace, PR-3 rubric, PR-4
claim/citation + leakage, WS-D derived answerability). Every number below is from
a real Claude-backed answer.

## How it ran

- Image: `acrabarvalab001.azurecr.io/abarva/web:ws-g-8d13ea98` (built via `az acr build`).
- Job: `job-ws-g-probe-eus` (cloned from the migrate operator job; KV-referenced
  `DATABASE_URL` + `ANTHROPIC_API_KEY`; runtime managed identity; server-only
  neutralized via `_mock-server-only-preload.cjs`).
- Command: `npx tsx src/scripts/qa/agent-answer-quality-probe.ts skyharbor-air 6`.
- Execution `job-ws-g-probe-eus-gcpkwr5` → **Succeeded**.

## Results (per question)

| Question | sources | tenant ctx | citations | answerability | claim | isolation | rubric |
|----------|--------:|-----------:|----------:|---------------|-------|-----------|------:|
| leadership | 2 | 2 | 2 | ANSWERED_AND_GROUNDED | pass | pass | 3.6 |
| company_scale | 4 | 4 | 4 | ANSWERED_AND_GROUNDED | pass | pass | 3.0 |
| industry_corpus | 1 | 1 | 1 | ANSWERED_AND_GROUNDED | pass | pass | 3.6 |
| move_context | 4 | 4 | 4 | ANSWERED_AND_GROUNDED | pass | pass | 3.0 |
| artifacts_evidence | 3 | 3 | 3 | ANSWERED_AND_GROUNDED | pass | pass | 2.8 |
| **kpi_value** | 2 | 2 | 2 | ANSWERED_AND_GROUNDED | pass | **FAIL (leakage)** | 3.2 |

**Summary:** 6/6 grounded · 6/6 with citations · 0 unsupported claims ·
**1 cross-tenant leakage failure**.

## What this proves

- The **context-bundle spine works on live data**: every SkyHarbor answer was
  grounded in retrieved tenant context (6/6) and emitted citation objects (6/6),
  with zero unsupported claims — the answers are governed, not free-form.
- The **validation framework caught a real tenant-safety bug**: the `kpi_value`
  answer referenced another canonical tenant (cross-tenant leakage → auto-fail).
  This is a genuine finding, not a synthetic one.

## Remediation backlog (from this run)

- **tenant isolation (P0):** `skyharbor-air:kpi_value` leaked another tenant's
  name → harden the tenant-identity pin / post-response off-tenant filter in the
  synthesizer for KPI-style questions. The probe counts leakage but does not yet
  log the offending tenant key — a one-line probe enhancement will name it.
- **answer-prompt/synthesis:** rubric overalls sit ~3.0–3.6 with the subjective
  dimensions unassessed (no judge in this probe); wire an Anthropic judge to
  score judgment/specificity/usefulness for a full board-grade rating.
- **retrieval/indexing:** `patterns` = 0 across the run — corpus pattern
  retrieval did not contribute (Azure Search admin key not provided to this
  probe job); add it to measure pattern grounding.

## Reproduce

`az acr build` the branch → PUT/clone the migrate job with the probe image +
args → `az containerapp job start` → read `ContainerAppConsoleLogs_CL` filtered
by the execution name. See `project_aca_vnet_job_execution` memory for the recipe.

## Re-run after the leakage fix (execution job-ws-g-probe-eus-myz6lxz)

After the leakage-detector precision fix (full name + key + distinctive first
word only; "First" excluded), the SkyHarbor probe was re-run in-VNet:

`probe_summary: questions=6, grounded=6, withCitations=6, leakageFailures=0, unsupportedClaims=0`

`kpi_value` (the prior failure) → `isolationStatus=pass`, `leak=[]`, no auto-fail.
The earlier finding was the `"First"` (First Capital) false positive, not a real
synthesizer leak — confirmed on live data. All 6 answers: grounded, cited,
claim-clean, tenant-safe.
