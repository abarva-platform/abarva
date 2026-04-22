# Seed Wave Validation Results

Date: 2026-04-21
Branch: `seed-data-ingestion`

This document records the live validation outputs for the composite-tenant seed wave covering Apex Retail Group, Meridian Health System, and First Capital Financial.

## Commands Run

```bash
NODE_PATH=/Users/anand/Projects/nexus/node_modules npx tsx src/scripts/seed/seed-wave.ts
NODE_PATH=/Users/anand/Projects/nexus/node_modules npx tsx src/scripts/seed/verify-seed-wave.ts
NODE_PATH=/Users/anand/Projects/nexus/node_modules npx tsx src/scripts/seed/smoke-seed-wave.ts
```

Environment note:
- The local worktree did not have its own `.env.local`, so execution used the existing `/Users/anand/Projects/nexus/.env.local` values.

## Verification Output

```text
Apex Retail Group
  vip profiles resolved  · 14
  initiatives w sponsor  · 11
  patterns w evidence    · 7
  benchmark rows sourced · 0
  categories present     · 11

Meridian Health System
  vip profiles resolved  · 10
  initiatives w sponsor  · 9
  patterns w evidence    · 7
  benchmark rows sourced · 0
  categories present     · 11

First Capital Financial
  vip profiles resolved  · 13
  initiatives w sponsor  · 10
  patterns w evidence    · 7
  benchmark rows sourced · 0
  categories present     · 11

Seed wave verification passed.
```

## Smoke Test Output

### 1. Apex CFO

Question:
`Who is the CFO of Apex?`

Answer:
`Daniel Kovač — CFO`

Result:
`PASS`

### 2. Apex Shadow AI Pattern

Question:
`What is the Shadow AI pattern at Apex?`

Answer excerpt:
`7.1 · Pattern: Shadow AI Spend (the narrative anchor) — Apex has accumulated approximately $2.3M in annualized spending across 14 fragmented AI and AI-adjacent tools ...`

Result:
`PASS`

### 3. Meridian Value-Based Care Commitment

Question:
`What is Meridian's value-based care commitment?`

Answer:
`5.2 · Value-Based Care 2030 Progression — Cross-system initiative advancing from 68% to 85% value-based revenue by 2030`

Result:
`PASS`

### 4. Linda Chen-Winters

Question:
`Who is Linda Chen-Winters?`

Answer:
`Linda Chen-Winters — President, Meridian Health Plans`

Result:
`PASS`

### 5. First Capital Regulatory Situation

Question:
`Tell me about First Capital's regulatory situation.`

Answer excerpt:
`6.1 · Pattern: Shadow AI Tool Proliferation in Compliance and Fraud Functions ... | 5.1 · BSA/AML Remediation Program | BSA/AML Consent Order context present in seed.`

Result:
`PASS`

### 6. First Capital CDO

Question:
`Who is First Capital's CDO?`

Answer:
`Ravi Deshmukh — Chief Data Officer`

Result:
`PASS`

## Implementation Notes

1. Client-row compatibility:
   Existing database rows still use the shorter compatibility names `Apex Retail`, `Meridian Health`, and `First Capital` in `clients.name`. This PR keeps those names intact to avoid collateral breakage in existing demo code, while tenant-scoped seed content uses the canonical composite names in `organization`, `current_company`, docs, and source material.

2. Benchmark storage:
   The current target environment did not expose `benchmark_history` in the PostgREST schema cache, so benchmark data was stored and validated through `org_master_data.category='benchmark_data'`. Source attribution is present there for all three tenants.
