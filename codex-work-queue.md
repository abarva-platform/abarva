# AbarVa · Codex Work Queue

**Purpose:** Discrete, well-specified tasks for Codex to run in parallel to Claude Code's current stream without collision.
**Date:** April 19, 2026
**Current Claude Code stream:** Pack B Phase 6 (retrieval merge) → Pack D principles 1-3 → Pack G Phase 3 → Pack H enterprise depth

---

## Coordination protocol (read first)

### Branch naming
Codex creates branches with `codex/` prefix so worktree ownership is unambiguous:
- `codex/pack-j-realistic-seeds`
- `codex/pack-k-helix-integration`
- `codex/pack-g-templates`
- `codex/pack-l-deliverable-specs`

### Commit discipline
- One semantic unit per commit. Run `npm run build && npm run typecheck` before committing.
- Commit message format: `feat(seed): ...` or `feat(templates): ...` matching existing convention.
- Final PR title format: `[Codex] Pack J · Meridian + First Capital + Apex realistic portfolios`.

### Don't touch
- Agent pipeline files: `src/lib/agent/*`
- Nexus system prompts: `src/prompts/*`
- Migration files older than 029 (Claude Code owns historical migrations)
- UI component directories outside explicit task scope
- `src/lib/retrieval/*` (Claude Code mid-refactor)

### Merge protocol
- Codex branches do NOT auto-merge. Open PR, Anand reviews, merges to `main` after Claude Code's concurrent work settles.
- If Codex needs something from a Claude Code branch, don't cherry-pick — wait for merge to main.

---

## Task 1 · Pack J Realistic Portfolio Seeds (START IMMEDIATELY AFTER PACK H MIGRATIONS APPLY)

### Inputs
- **Spec:** `/pack-docs/abarva-pack-realistic-portfolio.md` (copy from `/mnt/user-data/outputs/abarva-pack-realistic-portfolio.md`)
- **Schema reference:** migrations 027, 029 (Pack H enterprise depth + Pack I cross-industry core) applied
- **Existing seed pattern:** `src/scripts/seed/meridian-enterprise.ts` (current thin version — to be expanded)
- **Vendor whitelist:** `src/scripts/seed/_shared/vendor-whitelist.ts` (extend per Pack J Vendor Whitelist section)

### Task
1. **Expand vendor whitelist** per the full list in Pack J (90+ named vendors). Add `FORBIDDEN_CLIENT_NAMES` re-check at the top of every seed file. Add pricing metadata columns to each vendor entry: `pricing_model` (`per_seat` | `per_api_call` | `platform_fee` | `hybrid`), `typical_monthly_range_enterprise: [min, max]`, `contract_terms_typical: string[]`.
2. **Rewrite `meridian-enterprise.ts`** to load 42 use cases per the Pack J Meridian section. Every row must include:
   - `vendor_product` (from whitelist)
   - `status` (`production` | `scaling_pilot` | `pilot` | `stalled` | `research` | `shadow`)
   - `adoption_pct` where applicable
   - `monthly_cost_usd`
   - `verified_value_text` or `value_unverified: true`
   - `is_demo_data: true`
3. **Expand Meridian shadow AI to 16 entries** (Pack J lists 9; Pack L bundled extras says expand to 16). Add 7 more: students/residents using ChatGPT, offshore DevOps on personal Codeium accounts, finance using unsanctioned Copilot Studio, a specific physician named in incident log, data science team on Claude consumer, marketing ops on Zapier AI, legal ops on DocuSign AI Navigator.
4. **Create `firstcapital-enterprise.ts`** from the Pack J First Capital section. 34 use cases + expand shadow AI from 4 to 10.
5. **Create `apex-enterprise.ts`** from the Pack J Apex section. 29 use cases + expand shadow AI from 5 to 9.
6. **Populate 14 Meridian + 13 First Capital + 11 Apex active AI projects** per Pack J. Each project row includes: `name`, `vendor_ecosystem`, `budget_usd`, `phase_current`, `phase_total`, `pct_complete`, `next_milestone`.
7. **Populate contradictions** per Pack J (9 Meridian, 6 First Capital, 5 Apex). Each includes `severity`, `type`, `description`, `evidence_refs: text[]`.
8. **Populate monthly cost breakdowns** per Pack J cost tables. Insert into `cost_centers` + `spend_breakdown` for 12 months historical.

### Acceptance
- `npm run seed:enterprise -- --clients meridian,firstcapital,apex --refresh` completes without error.
- Each client's use case count matches Pack J spec exactly (42 / 34 / 29).
- Every row has `is_demo_data: true`.
- No row references forbidden names (CADE, McKinsey, BCG, Accenture, Deloitte, Bain, Huron, Navigant, Presbyterian, PHS, MD Anderson, CommonSpirit, HP Inc, Meridian Health System dupe, First Capital Financial dupe).
- Vendor whitelist guard throws on any violation at seed time.
- Monthly cost totals reconcile: Meridian ≈ $9.5M, First Capital ≈ $6.8M, Apex ≈ $4.2M.

### Scope boundaries — DO NOT
- Touch agent or retrieval code
- Modify existing migrations (add new one only if a field is missing)
- Add UI elements
- Change the forbidden-name guard logic (only add to the vendor whitelist)

### Estimated effort
1-2 days for Codex. Blocks on Pack H migrations applying first.

---

## Task 2 · Pack K Helix Therapeutics + Meridian Augmentation

### Prerequisites
- Task 1 complete (Pack J seeds for all three clients)
- Pack H migrations applied
- Pack K pharma vendor whitelist additions applied

### Inputs
- **Spec:** `/pack-docs/abarva-pack-pharma-augmentation.md`
- **Precedent seed pattern:** Task 1's `meridian-enterprise.ts`

### Task
1. **Expand vendor whitelist** with 30+ pharma vendors per Pack K (Recursion, Insitro, Atomwise, Absci, AlphaFold/OpenFold, Medable, Saama, Signant Health, Medidata Rave, Veeva Vault CDMS/RIM/PromoMats/QualityOne, Veeva CRM, Deep 6 AI, Aetion, Flatiron, Komodo Health, Nference, Ontosight, IQVIA, Prime Scholar, Pharmora, Quinten Health, Yseop, Aktana, Trinity Life Sciences, Doximity Insights, Within3, TrialCard, Rockwell FactoryTalk, Dassault, TraceLink AI, PTC, Siemens, Tempus Next).
2. **Create `helix-enterprise.ts`** with 38 use cases per Pack K: 8 research & discovery, 6 clinical ops, 4 regulatory/safety, 6 commercial, 4 medical affairs, 4 manufacturing, 6 corporate. Plus 12 active projects, 7 contradictions, 5 shadow AI entries.
3. **Create `helix-meridian-integration.ts`** that writes 8 shared touchpoints per Pack K Integration section:
   - 47 Helix trials running at Meridian sites (update `trial_partnerships`)
   - $8.4M/yr RWE license (Meridian `cost_centers` revenue line)
   - 180 MSL visits/quarter (append to Meridian `clinical_workflows` data)
   - Patient recruitment funnel edge via Deep 6 AI
   - Shared vendor entries for Tempus Next + Flatiron
   - 8 Helix drugs on Meridian formulary (cross-reference)
   - ~340 medical info queries/month from Meridian to Helix
4. **Graph edges (Neo4j):** Write Cypher MERGE statements per Pack K graph section. Edges: `PARTNERS_WITH`, `LICENSES_DATA_FROM`, `ENGAGES_SPECIALISTS_AT`, `SHARES_VENDOR`, `ON_FORMULARY_AT`.
5. **Retroactive Meridian enrichment:** append research partnership revenue ($22M/year from 4 pharma partners, Helix = $8.4M), add 3 other pharma partners as lightweight composites (Axiom Biologics $6.2M, Sentara Pharma $4.8M, Altus Life Sciences $2.6M — all composite, none on forbidden list).
6. **Industry classifier:** extend `clients.industry_code` to include `PHARMA`. Extend `domain-router.ts` with 5 pharma keyword blocks per Pack K (pharma_discovery, pharma_clinical, pharma_regulatory, pharma_commercial, pharma_medaffairs). Codex owns the constants file only — not the router logic.

### Acceptance
- `npm run seed:enterprise -- --clients helix --refresh` runs clean.
- `npm run seed:integrate -- --source helix --target meridian` runs clean.
- Cypher edges visible in Neo4j browser: `MATCH (h:Client {name:'Helix Therapeutics'})-[r]-(m:Client {name:'Meridian Health System'}) RETURN r` returns 5+ edges.
- Meridian cost centers show research partnership revenue line of $22M/yr.
- Helix monthly total ≈ $10.1M.

### Scope boundaries — DO NOT
- Modify existing Meridian use cases (only append research revenue + trial partnerships + MSL visits)
- Touch Nexus prompts or retrieval logic
- Add UI surfaces

### Estimated effort
1-1.5 days. Depends on Task 1 complete.

---

## Task 3 · Pack G Templates (20 Domain CSV + Excel Bundles)

### Prerequisites
- Migration 029 applied (Pack I cross-industry tables exist)

### Inputs
- **Spec:** `/pack-docs/abarva-pack-tower-onboarding.md` (Phase 2 — templates section)
- **Extended spec:** Pack I Phase 6 (20 domain templates)
- **Schema source:** `src/scripts/templates/schema.ts`

### Task
1. **Build schema-driven template generator** at `src/scripts/templates/build.ts`. Reads `schema.ts` which defines column specs per domain.
2. **Generate 20 domain CSV templates**:
   - Cross-industry (5): `client-infra.csv`, `client-apps.csv`, `client-data.csv`, `client-cost.csv`, `client-eng.csv`
   - Healthcare (4): `client-rcm.csv`, `client-provops.csv`, `client-clinical.csv`, `client-px.csv`
   - FinServ (4): `client-claims.csv`, `client-fraud.csv`, `client-cs.csv`, `client-digitalbanking.csv`
   - Retail (5): `client-supplychain.csv`, `client-stores.csv`, `client-ecommerce.csv`, `client-pricing.csv`, `client-returns.csv`
   - Pharma (2+): `client-pharma-discovery.csv`, `client-pharma-clinical.csv`
3. **Generate Excel bundle with cell validation** using `xlsx` library. Per-industry bundles:
   - `tower-bundle-healthcare.xlsx` (cross-industry + healthcare sheets)
   - `tower-bundle-finserv.xlsx` (cross-industry + FS sheets)
   - `tower-bundle-retail.xlsx` (cross-industry + retail sheets)
   - `tower-bundle-pharma.xlsx` (cross-industry + pharma sheets)
   - `tower-bundle-master.xlsx` (all sheets, for power users)
4. **Generate JSON bundle** per industry for API consumption.
5. **Add npm script:** `"templates:build": "tsx src/scripts/templates/build.ts"`.
6. **Write output to `/public/templates/`** so they're downloadable at runtime.
7. **Add README.md** at `/public/templates/README.md` documenting format, required vs optional columns, example rows.

### Acceptance
- `npm run templates:build` completes, writes 20 CSVs + 5 XLSXs + 4 JSON bundles + 1 master XLSX.
- Each file has header row + 2 example rows.
- Column validation rules applied in XLSX (data types, enum dropdowns for categorical fields).
- All file paths returned by build script log.

### Scope boundaries — DO NOT
- Touch the Tower UI or upload flow (that's Pack G Phase 4 — Claude Code owns)
- Implement the upload classifier (Pack G Phase 5)
- Add data beyond example rows

### Estimated effort
1-1.5 days. Parallelizes with Tasks 1-2.

---

## Task 4 · Pack L Deliverable Specifications

### Prerequisites
- Migration 033 applied (Pack L tables: `deliverable_types`, `deliverables`, `deliverable_versions`)

### Inputs
- **Spec:** `/pack-docs/abarva-pack-topics-deliverables.md` (Phase 3)

### Task
1. **Create seed file** `src/scripts/seed/deliverable-specs.ts` that upserts 5 deliverable type specifications:
   - `business_case` — full spec with all 10 sections, quality rubric with 6 weighted dimensions, generation prompt template
   - `current_state_assessment` — 8 sections, rubric, prompt
   - `target_state_architecture` — 8 sections, rubric, prompt
   - `roadmap` — 8 sections, rubric, prompt
   - `vendor_evaluation_scorecard` — 9 sections, rubric, prompt
2. **Create seed file** `src/scripts/seed/topic-library.ts` that upserts 4 topics per Pack L Phase 2:
   - `analytics_modernization` (specced fully in Pack L)
   - `ai_governance_implementation` (specced fully)
   - `prior_authorization_automation` (outlined — write spec following Analytics Modernization pattern, 8 diagnostic questions, full vendor landscape: Cohere Health, myNEXUS, Rhyme, Availity, Epic native, Palmetto GBA, Infinx)
   - `vendor_consolidation_ai` (outlined — write spec following same pattern, capability mapping framework, contract stacking, transition risk analysis)
3. **Every deliverable type must have:**
   - `template_structure` as ordered JSONB with section keys, titles, length requirements, required components
   - `required_data_inputs` as JSONB specifying engagement + client + topic dependencies
   - `quality_rubric` as JSONB with weighted dimensions (must sum to 100) and threshold definitions
   - `generation_prompt_template` as TEXT with variables like `${engagement.id}`, `${client.financial_profile}`, `${topic.vendor_landscape}`
4. **Every topic must have:** triggers, patterns, vendor landscape, diagnostic questions, contradictions, phase playbook (0-4), typical deliverables, success signals, failure modes.
5. **Add npm scripts:** `"seed:deliverables": "tsx src/scripts/seed/deliverable-specs.ts"` and `"seed:topics": "tsx src/scripts/seed/topic-library.ts"`.

### Acceptance
- Both seed scripts run clean.
- `SELECT count(*) FROM deliverable_types;` returns 5 with `maturity = 'production'`.
- `SELECT count(*) FROM engagement_topics;` returns 4.
- Every deliverable type's quality_rubric weights sum to 100.
- All topics have ≥ 6 diagnostic questions and ≥ 3 common contradictions.
- No forbidden names anywhere.

### Scope boundaries — DO NOT
- Build the generation pipeline (Claude Code owns — Pack L Phase 4)
- Add UI surfaces (Claude Code owns — Pack L Phase 5)
- Change graph schema

### Estimated effort
1.5-2 days. Independent of Tasks 1-3 as long as migration 033 applies.

---

## Suggested sequence

1. **Start Task 1 immediately** after Pack H migrations apply (Claude Code flagged this as a gated item — approve first).
2. **Task 3 in parallel** — Pack G templates don't depend on Task 1 once migration 029 applies.
3. **Task 2 after Task 1** — pharma depends on healthcare seed pattern.
4. **Task 4 after migration 033** applies (Claude Code will apply this as part of Pack L Phase 1).

If all four run clean, you get:
- 4 composite clients fully populated at realistic enterprise scale
- 20 downloadable templates for real-client onboarding
- 5 deliverable specifications + 4 topic intelligence packs live
- Cross-client intelligence edges between Helix and Meridian

That's ~5-6 days of Codex work running in parallel to Claude Code. At the end, Claude Code needs to do the integration work (retrieval routing, UI surfaces, generation pipeline) — but the data + specs are done.

---

## Reporting

Codex should commit after each acceptance section passes, push the branch, open PR. No auto-merge. Anand approves each PR after reviewing diff + confirming acceptance.

End each task with a brief status post:
```
✅ Task N complete — {branch} pushed, PR #X opened
   Acceptance: all N criteria met
   Rows inserted: {count} across {tables}
   Next: {next task} gated on {dependency}
```
