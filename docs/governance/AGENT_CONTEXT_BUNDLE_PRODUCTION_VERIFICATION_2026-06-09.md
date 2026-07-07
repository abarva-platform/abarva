# Agent Context-Bundle Production/Lab Azure Verification — 2026-06-09

> **Honesty notice.** This report records the verification **framework** and a
> **lab structural run**. It does **not** contain live Azure pass/fail numbers,
> because the private Azure Postgres data plane is VNet-only and unreachable
> from a developer workstation. Live per-tenant/per-agent pass/fail, wisdom
> distributions, and the results/failures CSVs are produced by running the
> committed harness **on Azure Container Apps** (command below). No tenant
> results have been fabricated.

## 1. Framework status — READY

The validation framework ships as six merged slices, each with green local
validation (typecheck, eslint, behavior tests, architecture-rules, release
gate):

| Slice | Module | Behavior tests | PR |
|------|--------|----------------|----|
| Trace | `src/lib/agent-trace` | 16 | #3349 ✅ |
| Wisdom rubric | `src/lib/agent-eval` | 9 | #3350 ✅ |
| Golden suites | `src/lib/agent-golden` | 10 | #3353 ✅ |
| Claim/citation validation | `src/lib/agent-claims` | 13 | #3352 ✅ |
| Domain/subdomain matrix | `src/lib/agent-domain-matrix` | 8 | #3354 ✅ |
| Verification runner | `src/lib/agent-verification` | 3 | this PR |

**59 behavior tests**, all passing in CI/lab mode (no DB, no model).

## 2. Lab structural run (real)

`npx tsx scripts/agent-verification/run.ts` →
`docs/build/agent-context-bundle-verification-2026-06-09/verification-summary.json`:

- Tenants (code-derived from `CANONICAL_TENANT_KEYS`): **apex-retail,
  meridian-health, northstar-clinical, first-capital, skyharbor-air,
  lakeshore-holdings** (6).
- **Golden questions: 66** (11 per tenant). **Matrix questions: 4,700**
  (16 domains × 5 subdomains × 10 archetypes, industry-filtered).
- All six framework modules present and wired.

This proves the framework is assembled end to end; it does **not** assert that
any tenant's answers are correct — that needs the live run.

## 3. How to produce live results (Azure Container Apps)

On ACA, where `DATABASE_URL` reaches the private data plane and
`ANTHROPIC_API_KEY` is set:

```
AGENT_VERIFY_LIVE=1 npx tsx scripts/agent-verification/run.ts
```

Wire an HTTP agent driver (`AgentDriver`) that calls the real Nexus
(`/api/v1/nexus/query`) and Sentinel (`/api/intelligence/ask`) endpoints; the
runner drives the golden + matrix questions, applies `assertGoldenQuestion`,
`validateClaimsAndCitations`, and `evaluateAgentResponse` over each live
context-bundle trace, and writes:

- `verification-summary.json` (full live summary)
- `domain-subdomain-results.csv` / `domain-subdomain-failures.csv` (per-question)
- this report, re-rendered with live pass/fail by tenant/agent/surface, citation
  coverage, unsupported-claim count, leakage results, wisdom distribution, top
  failure modes, and the remediation backlog.

## 4. Completion criteria — current state

| Criterion | State | Notes |
|-----------|-------|-------|
| Nexus & Sentinel pass tenant-isolation tests | **enforced in code; live pending** | `detectTenantLeakage` + per-question isolation assertion; auto-fail on leakage |
| Claude never receives raw user-only prompts on governed surfaces | **proven by design** | both paths assemble a bundle before the model call; trace hashes the exact model input and asserts `retrievalPrecededModel` |
| Agent-ready rows are the only default context source | **upheld by existing governance** | `buildValidatedAgentContextBundle` / `evaluateGovernedObject` filter; trace records excluded objects by reason |
| Restricted rows used only when policy allows | **enforced by governance layer** | trace exclusion reasons include `restricted` / `missing_policy` |
| Every answer has trace evidence | **wired** | Sentinel ask + Nexus query emit a trace per answer; live coverage measured by the run |
| Citation gap resolved or justified | **detector shipped** | rubric `missingCitations` + claim validation flag backend-grounded answers with no citations |
| SkyHarbor passes all applicable tests | **suite present; live pending** | SkyHarbor golden + matrix questions generated; live pass/fail on ACA |
| Lakeshore passes applicable tests or gaps classified | **suite present; live pending** | Lakeshore is canonical (`diversified`); ingestion-state gaps classified by the live run |

## 5. Proof obligations

### Azure-only / no Supabase
- `npm run audit:architecture-rules` passed on **every** PR in this workstream
  (the GitHub "Azure/Anthropic architecture rules" gate). No Supabase runtime
  imports, env requirements, host literals, or `ALLOW_LEGACY_SUPABASE_CORPUS`
  fallbacks were introduced. All persistence uses the Azure/Postgres data plane
  via `getAzureWriteFluentClient()`.

### No destructive operations
- The only schema change is `supabase/migrations/20260609090000_agent_context_traces_v1.sql`
  — a single **append-only** table with immutability triggers (UPDATE/DELETE
  raise), `REVOKE UPDATE, DELETE`, and no `DROP`/`TRUNCATE`/`DELETE` of any
  existing object. The "Fresh Postgres migration replay" gate passed.
- No DNS, Vercel, Supabase, drain/search/freeze, or account-shutdown logic was
  touched. All other slices are pure libraries + tests + docs.

### Reasoning provider
- Reasoning remains Anthropic/Claude through the audited egress path; the trace
  hooks observe the existing model calls and never add or change a provider.

## 6. Remediation backlog (by lane) — pre-live

The live run will populate per-question failures; the standing backlog before it
runs:

- **ingestion/data-load:** confirm which tenants (esp. Lakeshore, Northstar,
  First Capital) actually have agent-ready Azure data; `NOT_LOADED` answerability
  hypotheses are reconciled here.
- **retrieval/indexing:** measured by golden/matrix retrieval assertions on ACA.
- **answer-prompt/synthesis:** rubric below-threshold answers route here.
- **binder/pattern validation:** inject a live `PatternCatalog` so phantom-id
  detection runs (cross-namespace already works from the trace).
- **tenant isolation:** leakage findings (auto-fail) route here.
- **provenance/source-state:** citation-gap + unsupported-claim findings.
- **ui/module-binding:** wire Nexus route to surface validation findings on its
  SSE payload (Sentinel already does); instrument the `it_productivity` Sentinel
  sub-path and Source/Tower synthesis surfaces.

## 7. Machine-readable + human-readable outputs

- `docs/build/agent-context-bundle-verification-2026-06-09/verification-summary.json`
- `docs/build/agent-context-bundle-verification-2026-06-09/golden-question-bank.json`
- `docs/build/agent-context-bundle-verification-2026-06-09/domain-subdomain-question-bank.json`
- `docs/build/agent-context-bundle-verification-2026-06-09/sample-evaluations.json`
- `domain-subdomain-results.csv` / `domain-subdomain-failures.csv` (header-only
  until the live ACA run populates rows)

## Executive summary

The context-bundle spine is **instrumented and observable**: every governed
Nexus/Sentinel answer now emits a trace proving Claude ran downstream of
retrieval, recording included vs excluded context with governance reasons and a
hashed model input. On top of it sit a wisdom rubric, claim/citation + namespace
validation, cross-tenant leakage detection, executable golden suites for all six
canonical tenants, and a 4,700-question expert consultant matrix — all
code-derived and lab-tested. The **one remaining step** is executing the harness
against live Azure data on Azure Container Apps to turn the answerability
hypotheses into measured pass/fail and to populate the results/failures CSVs.
That step is intentionally not faked here.
