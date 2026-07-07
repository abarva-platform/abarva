# Knowledge-Corpus Remediation Tracker — 2026-06-09

**Workstream:** Agent context-bundle validation framework — prove the
context-bundle spine works end to end and that Nexus/Sentinel responses are
wise, grounded, cited, source-aware, and tenant-safe, validated against
production/lab Azure data (not manual chat testing).

**Architecture truth (binding):** Azure/Postgres via `DATABASE_URL` is the
runtime data plane; Azure Search / Blob / Postgres only; Claude/Anthropic is
the governed reasoning provider; no Supabase runtime, no Supabase fallback.
This lane is eval / observability / answer-quality validation only — it does
not change DNS, Vercel, Supabase, drain/search/freeze, or shutdown logic.

## Status legend

- ✅ Done — merged, CI green
- 🟡 Partial — code landed, live Azure proof pending (private DB is VNet-only,
  unreachable from localhost; must run on Azure Container Apps)
- ⬜ Not started

## Slice ledger

| PR | Title | Status | Notes |
|----|-------|--------|-------|
| 1 | Trace governed Nexus/Sentinel context bundles | ✅ | Merged #3349; live ACA DB persistence still to confirm on Azure |
| 2 | Add golden tenant question suites for governed agents | ✅ | Merged #3353; 6 tenants × 11 = 66 questions, code-derived |
| 3 | Add response wisdom evaluation rubric | ✅ | Merged #3350; subjective dims need Anthropic judge on ACA |
| 4 | Validate governed agent claims and citations | ✅ | Merged #3352; live phantom catalog needs ACA |
| 5 | Record production Azure context-bundle verification | 🟡 | Framework + lab structural run + report landed; live ACA run pending |
| 6 | Domain/subdomain expert consultant question matrix | ✅ | Merged #3354; 4,700 questions across 6 tenants |

**All six slices merged except PR-5 (this PR). 59 behavior tests across the
framework, all green. The one remaining action is the live Azure run on ACA —
see `docs/governance/AGENT_CONTEXT_BUNDLE_PRODUCTION_VERIFICATION_2026-06-09.md`.**

## Active tenants (from code, not hand-typed)

Source of truth: `src/config/tenants/CANONICAL_TENANTS.ts` +
`src/lib/tenant/aliases.ts` (`CANONICAL_TENANT_KEYS`).

| Canonical key | App client key | Broker key | Industry |
|---------------|----------------|------------|----------|
| `apex-retail` | `apexretail` | `apex-retail` | retail |
| `meridian-health` | `meridian` | `meridian` | healthcare_provider (PHS-shape) |
| `northstar-clinical` | `northstar` | `northstar-clinical` | healthcare_medtech |
| `first-capital` | `arcturus` | `first-capital` | financial_services_banking |
| `skyharbor-air` | `skyharbor` | `skyharbor-air` | airline |
| `lakeshore-holdings` | `lakeshore` | `lakeshore-holdings` | diversified / private_holdings |

**Correction (2026-06-09, PR-4):** `lakeshore-holdings` **is** a canonical
tenant in `CANONICAL_TENANTS` (industry `diversified`, scope `private_holdings`)
— an earlier scan truncated the list. Golden suites (PR-2) and the matrix (PR-6)
derive tenants from `CANONICAL_TENANT_KEYS` in code, so Lakeshore is included
automatically. Whether Lakeshore has **loaded Azure data** is a separate
ingestion-state question answered by the PR-5 live run. **Morgan Street** is
NOT a canonical tenant (build-doc scaffolding only). PHS = Meridian's shape.

## Execution log

### PR-1 — Trace governed Nexus/Sentinel context bundles · 🟡 candidate

- **What landed:**
  - `public.agent_context_traces` append-only table (RLS per tenant key,
    immutable by trigger, IDs + sha256 model-input hash only — no raw prompts,
    PHI/PII, or source text). Migration
    `supabase/migrations/20260609090000_agent_context_traces_v1.sql`.
  - `src/lib/agent-trace/` spine: full `AgentContextTrace` contract (every
    brief field), pure builders for Nexus/Sentinel, sha256 model-input hashing,
    redacted-by-default mode, lab-mode structured-log fallback, repository.
  - Non-blocking emission wired into the Nexus orchestrator/route and the
    Sentinel intelligence ask route. Model input captured at the exact model
    call (proves Claude is downstream of retrieval).
- **Validation:** 16/16 behavior tests; tsc clean on touched files; eslint
  clean; `audit:architecture-rules` green; `release:check` green.
- **Evidence:** release record
  `docs/releases/records/2026-06-09-agent-context-bundle-trace.md`.
- **Open / next:** populate `validation_status` (PR-3),
  `claim_validation_status` (PR-4), `tenant_isolation_status` (leakage tests);
  enrich `eligible_datasets` / `missing_context` / pattern `namespace`;
  instrument the `it_productivity` Sentinel sub-path and Source/Tower surfaces;
  confirm live DB persistence on Azure Container Apps after `npm run db:migrate`.

### PR-3 — Add response wisdom evaluation rubric · 🟡 candidate

- **What landed:** pure `src/lib/agent-eval/` rubric — 10 dimensions (5
  deterministic from the trace + answer text, 5 subjective via injected
  judgment), production-ready gate with auto-fail on tenant leakage / unsupported
  critical claim / phantom or cross-namespace pattern citation. Doc
  `docs/governance/AGENT_RESPONSE_EVALUATION_RUBRIC_2026-06-09.md`. Real sample
  output (Apex/Meridian/SkyHarbor; Lakeshore=NOT_LOADED) at
  `docs/build/agent-context-bundle-verification-2026-06-09/sample-evaluations.json`.
- **Validation:** 9/9 behavior tests; sample generator run; tsc/eslint clean;
  architecture-rules + release:check green.
- **Open / next:** wire an Anthropic judge for the subjective dimensions in the
  PR-5 harness (runs on ACA); feed PR-4 claim/namespace findings into the gate.

### PR-4 — Validate governed agent claims and citations · 🟡 candidate

- **What landed:** pure `src/lib/agent-claims/` — claim detection across 10
  taxonomy types, evidence mapping to the trace, namespace-aware pattern
  validation (phantom vs cross-namespace, case-insensitive slug lookup,
  industry-scope grounding), and cross-tenant leakage detection. Sentinel ask
  route now runs validation per answer, stamps `claim_validation_status` /
  `tenant_isolation_status` on the trace, and emits a `validation` event.
- **Validation:** 13/13 behavior tests; tsc/eslint clean; architecture-rules +
  release:check green.
- **Open / next:** inject a live Azure `PatternCatalog` for phantom detection
  in the PR-5 harness; wire the Nexus route to surface findings on its payload.

### PR-2 — Golden tenant question suites · ✅ merged #3353

- Code-derived suites (CANONICAL_TENANT_KEYS), 66 questions across 6 tenants,
  `assertGoldenQuestion`, JSON bank, 10 tests. Live per-tenant pass/fail = PR-5
  on ACA.

### PR-6 — Domain/subdomain expert matrix · ✅ merged #3354

- 16 domains × 5 subdomains × 10 archetypes = 4,700 questions (industry-filtered,
  code-derived), consultant-scoring dims, JSON bank + CSV templates, 8 tests.

### PR-5 — Production/lab Azure verification · 🟡 candidate (this PR)

- Verification runner (injectable agent driver) + summary aggregation + markdown
  report renderer; lab structural run script; the production verification report.
  59 framework behavior tests green. **Live Azure run on ACA is the one
  outstanding action** (private DB unreachable from localhost; no results faked).

## Remediation backlog (by lane)

- **ingestion/data-load:** Lakeshore / Morgan Street not in canonical registry —
  cannot be tested as live tenants until onboarded with Azure-loaded context.
- **retrieval/indexing:** (to be populated by PR-2/PR-5 lab runs).
- **answer-prompt/synthesis:** (to be populated by PR-3).
- **binder/pattern validation:** (to be populated by PR-4).
- **tenant isolation:** (to be populated by leakage tests).
- **provenance/source-state:** (to be populated by PR-4/PR-5).
- **UI/module-binding:** (to be populated by PR-5).
