# Domain / Subdomain Expert Consultant Question Matrix — 2026-06-09

Proves Nexus/Sentinel can behave like an **expert consultant** across loaded
client context + industry corpus — not just answer a handful of generic tenant
questions. For every active canonical tenant, a domain × subdomain × archetype
matrix is generated from code.

## Tenants (code-derived)

Built from `CANONICAL_TENANT_KEYS`, so the matrix automatically covers Apex,
Meridian/PHS, Northstar, First Capital, **SkyHarbor**, and **Lakeshore** (the
four brief-required tenants — Apex, Meridian/PHS, SkyHarbor, Lakeshore — are all
present).

## Structure

- **16 domains** (industry-filtered where applicable): enterprise leadership &
  operating model, finance, FP&A, treasury, procurement, supply chain, IT
  organization, infrastructure/cloud, ERP/enterprise apps, data & analytics,
  AI/automation, security/risk/controls, vendor & contract management,
  transformation portfolio, value realization, industry operations.
- **5 subdomains per domain.**
- **10 question archetypes per subdomain** (the brief's ten): simple factual ·
  current-state architecture · org/ownership · systems/platforms · KPI/metric ·
  vendor/contract · risk/control · improvement opportunity · benchmark/pattern ·
  missing-evidence (negative test).

This yields **≥10 questions per subdomain** and **4,700 questions** across the
six canonical tenants (supply-chain is industry-filtered, so healthcare-provider
and banking tenants get 15 domains, others 16). Full bank:
`docs/build/agent-context-bundle-verification-2026-06-09/domain-subdomain-question-bank.json`.

## Tags per question

`tenant_key`, `domain`, `subdomain`, `archetype`, `expected_answerability`
(`FULLY_ANSWERABLE` / `PARTIALLY_ANSWERABLE` / `NOT_LOADED` — a hypothesis the
PR-5 Azure run reconciles), `requiredSourceTypes`, `expectedCitationTypes`,
`negativeTest`, `tenantIsolationTest`.

**Expected answers are not fabricated.** Answerability is a hypothesis; ground
truth comes from each tenant's Azure-loaded context in the live run. A domain
with no loadable evidence is classified `NOT_LOADED` / `PARTIALLY_ANSWERABLE`,
not invented.

## What the live test verifies (per question)

Did retrieval find relevant tenant context? · relevant corpus/industry patterns?
· did the answer cite the right tenant evidence? · the right pattern/evidence
objects (in the active namespace)? · avoid generic consulting filler? · say "not
loaded"/"partially loaded" when evidence is missing? · avoid cross-tenant
leakage? · avoid unsupported benchmark claims? · produce consultant-quality
guidance grounded in the sources?

## Consultant-quality scoring (1–5)

Scored by the **PR-3 rubric** + an injected **Anthropic judge** in the PR-5
harness, across: directness · executive usefulness · domain expertise ·
specificity to tenant · evidence grounding · corpus/pattern use · risk/failure-
mode awareness · actionability · caveat discipline · no hallucination. Any answer
that reads as generic consulting filler without citations fails.

## Outputs

- `docs/build/agent-context-bundle-verification-2026-06-09/domain-subdomain-question-bank.json` — full bank (generated).
- `docs/build/agent-context-bundle-verification-2026-06-09/domain-subdomain-results.csv` — header-only template; **rows populated by the PR-5 live ACA run** (never faked).
- `docs/build/agent-context-bundle-verification-2026-06-09/domain-subdomain-failures.csv` — header-only template; populated live.

## How to run

- **Lab mode (CI):** `npm run test:behaviors` →
  `src/__tests__/behaviors/agent-domain-matrix.test.ts` validates the taxonomy,
  archetype completeness, industry filtering, and code-derived tenant coverage.
- **Live mode (Azure Container Apps):** the PR-5 harness imports
  `buildExpertMatrix()`, drives each question through the real agent, scores via
  the rubric + judge, and writes `results.csv` / `failures.csv` with a
  remediation lane per failure. Requires a real `DATABASE_URL` reachable inside
  Azure.
