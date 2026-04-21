# Keystone Seed Validation Results

Date: 2026-04-21
Branch: `seed-keystone-utility`
Tenant: `Keystone Energy Holdings`

## Summary

- Keystone seeded cleanly into Supabase using the existing seed-wave pipeline extended for the regulated-utility composite.
- Verification passed across all four seed-wave tenants after Keystone landed.
- All 8 Keystone smoke tests passed, confirming that the seeded tenant resolves the expected executive, pattern, benchmark, subsidiary, and sustainability context.

## Commands run

```bash
npx tsx src/scripts/seed/seed-wave.ts --tenant keystone
npx tsx src/scripts/seed/verify-seed-wave.ts
npx tsx src/scripts/seed/smoke-seed-wave.ts
```

## Seed result

```text
Keystone Energy Holdings
  client row     · 63931f84-4fc8-4d13-baac-aa16b035bff2 (Keystone Energy Holdings / Keystone Energy Holdings, Inc.)
  people         · 41
  vip profiles   · 12
  initiatives    · 21
  patterns       · 7
  benchmarks     · 0
  prior programs · 2
  knowledge rows · 50
```

Notes:

- `benchmark_history` remains unavailable through the current PostgREST schema cache path, so benchmark facts are stored under `org_master_data.category='benchmark_data'`, consistent with the earlier seed-wave tenants.
- The Keystone spec narrative says "twenty-two named initiatives," but the canonical markdown currently contains 21 explicit initiative blocks (`6.1.1` through `6.6.2`). Ingestion preserves the document as written and does not invent a 22nd initiative.
- The Keystone spec says the named-person set should produce "approximately 42" records. The canonical markdown currently resolves to 41 named people after deduplication, which is consistent with the actual named records present in Parts 2, 4, and 5.

## Verification output

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

Keystone Energy Holdings
  vip profiles resolved  · 12
  initiatives w sponsor  · 21
  patterns w evidence    · 7
  benchmark rows sourced · 0
  categories present     · 14

Seed wave verification passed.
```

## Keystone smoke outputs

```text
Q: Who is the CEO of Keystone?
A: Marcus W. Kittrell — President and Chief Executive Officer
PASS: yes

Q: Who is the Chief Customer and Technology Officer?
A: Jonathan Aldridge — EVP and Chief Customer and Technology Officer (THE TIM-ANALOG ROLE)
PASS: yes

Q: What is Keystone's large load interconnection queue?
A: 7.2 · Pattern: Data Center Load Interconnection Queue Bottleneck — Keystone's interconnection queue has grown from 14 GW in early 2024 to 32 GW by late 2025, with study-phase processing time averaging 18 months against a target of 9 months. Real economic opportunity cost from queue delay combined with customer rate impact concerns from accelerated capital requirements create cross-functional tension between Utility Operations (study throughput), Regulatory Affairs (tariff design), Finance (financing pace), and Customer Service (affordability communications). — Interconnection queue data: 32 GW pending as of December 2025 (from 14 GW January 2024) | Study-phase duration data: average 18 months, target 9 months | Transmission engineering staff capacity data: 247 engineers for study phase work, need assessed at 390 | Large-load tariff filings: Illinois (submitted March 2026), Maryland (in preparation), Pennsylvania (in preparation), New Jersey (scoping) | FERC engagement: active participation in PJM co-location rulemaking (FERC Order on PJM, December 2025) | Financial impact: estimated $1.4B in delayed revenue opportunity; estimated $340M in accelerated transmission investment requiring rate recovery | Customer rate impact modeling: projected residential rate increase of 4-6% over 2026-2028 if all allocated to general customer base without large-load cost allocation | Queue data from interconnection management system | Capacity data from HR workforce systems | Tariff data from regulatory affairs filing records | FERC/PJM engagement from federal regulatory affairs logs | Financial impact modeling from Finance strategy work | Customer rate impact from rate case modeling | Cross-functional decisioning required: Utility Operations cannot resolve unilaterally; Regulatory Affairs cannot resolve unilaterally; Finance cannot resolve unilaterally; the path forward requires coordinated action | This is the single most consequential cross-functional decision facing Keystone in 2026
PASS: yes

Q: What is the capital investment plan?
A: **Capital investment plan (2025-2028):** $37B, a 9% increase over the prior four-year outlook
PASS: yes

Q: Tell me about Keystone's shadow AI pattern.
A: 7.1 · Pattern: Shadow AI in Customer Operations and Grid Analytics — Keystone has accumulated approximately $1.6M in annualized spending across 11 fragmented AI and AI-adjacent tools authorized by individual teams without central oversight, despite the stated enterprise AI Platform and Governance Program. — Procurement records showing 11 distinct vendor engagements under the $150K threshold that does not require CIO-level review | Specific vendors including: an AI customer-service summarization tool used by three subsidiaries' call center operations, a document analysis tool used by regulatory affairs, a code generation assistant used in portions of IT and data engineering, a generative AI writing tool used by communications and rate case support staff, a predictive maintenance analytics tool deployed in field operations, a transcription tool used in legal and executive meetings, a meeting assistant used by multiple executive assistants, a sales enablement tool adopted by the commercial accounts function, an outage communications draft tool piloted in one subsidiary's customer service, a general-purpose AI assistant seat allocation that has grown beyond central authorization, and a storm forecasting analytics tool piloted by two subsidiaries independently | Team members using these tools span 17 identified functional teams across Customer Operations, Rate Case Support, Regulatory Affairs, Field Operations, IT, Data Engineering, Communications, Legal, and Executive Support | Contractual review status: 7 of 11 have auto-renewal clauses; 4 of 11 have data sharing terms that were not reviewed by Legal for critical infrastructure data implications | Financial impact: approximately $1.6M in annual spend visible in procurement data; indirect productivity impact unquantified; critical infrastructure data exposure risk unquantified | Procurement data aggregated across tool purchases below central review threshold | Vendor categorization applied to identify AI-adjacent tools | Team usage inferred from single-sign-on logs and expense reports | Contract review status pulled from legal database gaps | Contradiction detection: Jonathan Aldridge's first-month communications affirming enterprise AI governance reconciled against evidence of decentralized procurement continuing post-affirmation | Central AI investment (forthcoming Enterprise AI Platform and Governance Program) being undermined by decentralized spend predating it | Governance gap between AI strategy articulation (February 2026) and operational control | Critical infrastructure data sharing and cybersecurity risk from unreviewed contracts (especially concerning given NERC CIP compliance implications) | Opportunity cost of fragmented tools vs centralized platform | Pattern has analog in Apex Retail Group (Shadow AI) and First Capital Financial (Shadow AI in Compliance), suggesting cross-industry decisioning challenge
PASS: yes

Q: How many operating subsidiaries does Keystone have?
A: Riverbend Electric Company | Keystone Electric & Gas | Commonwealth Power & Light | Potomac Energy Services | Atlantic Shore Electric | Delmarva Power Services
PASS: yes

Q: Who is the CEO of Keystone Electric & Gas?
A: Reginald Chatmon — President, Keystone Electric & Gas (Maryland)
PASS: yes

Q: What is Keystone's clean energy commitment?
A: Scope 1 and Scope 2 net zero by 2040, Scope 3 net zero by 2050
PASS: yes
```
