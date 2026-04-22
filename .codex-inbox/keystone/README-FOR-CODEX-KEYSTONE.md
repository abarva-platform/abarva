# Codex Handoff · Keystone Energy Holdings Seed Ingestion

**Task name:** `seed-keystone-utility` (or `seed-wave-utility-expansion` depending on preference)

**Priority:** Queue after Data Ground Truth Surface Phase 1 completes. Not urgent. No demo dependency.

**Estimated effort:** Should be substantially simpler than the original three-tenant seed wave since the pipeline, parser, and schema decisions are already established in PR #22 on the `seed-data-ingestion` work.

---

## What this is

Keystone Energy Holdings is the **fourth composite tenant** in the AbarVa library — a regulated utility holding company modeled at Exelon scale. It complements the three existing composites:

- **Apex Retail Group** (retail, Target-class)
- **Meridian Health System** (healthcare, Intermountain-class)
- **First Capital Financial** (financial services, Truist-class)
- **Keystone Energy Holdings** (regulated utility, Exelon-class) ← NEW

**Strategic context.** This composite is built specifically to support a Tim Peterson (Exelon EVP Chief Customer and Technology Officer) test drive. Tim is Anand's former boss and a mentor-class network relationship. The utility composite exists to signal relationship investment rather than purely demonstrate product capability. Parallel capability demonstration is fully covered by the existing three composites.

## What Codex needs to do

Follow the **exact same ingestion pattern** established for the first three composites in PR #22:

1. Parse the spec markdown at `docs/specs/_meta/seed-data/keystone-energy-holdings-comprehensive-seed.md` (file will be placed here)
2. Extend the seed-wave library (`src/scripts/seed/seed-wave-lib.ts`) to recognize the Keystone tenant OR create a Keystone-specific ingestion script modeled on the existing pattern
3. Ingest into Supabase following the same schema and upsert patterns used for the three existing tenants
4. Run verification: all executives resolve, initiatives have sponsors, patterns have evidence, all required `org_master_data` categories populated
5. Run smoke tests (see Part 14.10 of the spec for the 8 smoke test queries)
6. Document validation results at `docs/specs/_meta/seed-data/keystone-seed-validation-results.md`
7. Open PR with summary matching PR #22 structure

## Files to place in repo

Single spec file:
- `docs/specs/_meta/seed-data/keystone-energy-holdings-comprehensive-seed.md`

Optional ingestion scripts (if extending beyond existing seed-wave-lib capability):
- `src/scripts/seed/seed-keystone.ts`
- `src/scripts/seed/smoke-keystone.ts`

## Preserved caveats from PR #22

The following caveats documented in PR #22 apply equally to Keystone:

1. **Short client name.** Use `clients.name = "Keystone Energy Holdings"` (not a longer form) to match the established compatibility pattern for Apex, Meridian, First Capital. Full legal name "Keystone Energy Holdings, Inc." lives in `legal_name` and spec content.

2. **Benchmark data location.** Benchmark data goes into `org_master_data.benchmark_data` (JSONB) rather than `benchmark_history` (table still missing from PostgREST schema cache in current environment). Same workaround as prior seeds.

3. **Idempotency required.** All upsert paths keyed on stable identifiers, re-runnable without creating duplicates. Same standard as prior seeds.

## Specifics unique to Keystone

**Six operating subsidiaries as sub-org structure.** Unlike the prior three composites, Keystone has six named operating subsidiaries (Riverbend Electric, Keystone Electric & Gas, Commonwealth Power & Light, Potomac Energy Services, Atlantic Shore Electric, Delmarva Power Services), each with its own President. These should be registered in the org structure. Consider: should each subsidiary be a separate entity in `org_master_data` with its own hierarchy, or all rolled up under the Keystone parent? My recommendation: roll up under Keystone parent, but make subsidiary names queryable via `org_master_data.category='subsidiary_structure'`.

**Multi-jurisdictional regulator registration.** Keystone operates under 6 state/DC PUCs + FERC + NERC + PJM. These are not `persons` or executives — they are external regulatory bodies. Should be registered as `knowledge_sources` or in `org_master_data.category='regulatory_environment'`.

**VIP profile for Jonathan Aldridge.** Jonathan Aldridge (EVP Chief Customer and Technology Officer, the Tim-analog) is the primary VIP for this tenant, analogous to Maria Delgado for Apex. Apply full VIP profile depth.

## Smoke tests to run post-ingestion

Per Part 14.10 of the spec:

1. "Who is the CEO of Keystone?" → Marcus W. Kittrell
2. "Who is the Chief Customer and Technology Officer?" → Jonathan Aldridge
3. "What is Keystone's large load interconnection queue?" → 32 GW with context
4. "What is the capital investment plan?" → $37B through 2028
5. "Tell me about Keystone's shadow AI pattern." → 11 tools, $1.6M, specific vendors
6. "How many operating subsidiaries does Keystone have?" → Six, named
7. "Who is the CEO of Keystone Electric & Gas?" → Reginald Chatmon
8. "What is Keystone's clean energy commitment?" → Scope 1/2 net zero by 2040

## Non-goals for this task

**No demo narrative.** Do not build engagement scripts, greeting flows, scenario orchestration, or demo phase artifacts for Keystone in this task. Demo narrative is a future artifact to be authored at the time a Keystone-tenant demo is scheduled. This task is purely data layer.

**No cross-tenant pattern library updates.** The seven Keystone patterns should be registered within the Keystone tenant scope. Any future cross-tenant pattern synthesis (e.g., "Shadow AI observed across four industries") is Atlas/Tower W5 work and not part of this seed task.

**No UI polish.** This is a data-layer task. UI rendering of the Keystone tenant uses the same surfaces as existing tenants; no new rendering work needed.

## Expected output

When Codex completes this task:
- One new PR, structure matching PR #22
- Spec file committed at canonical path
- Keystone tenant ingested and query-able in Supabase
- 8 smoke tests passing, documented in validation results
- Tenant accessible via existing platform shell (`clients` table has Keystone)
- Pattern library extended with 7 Keystone patterns
- Benchmark data present in `org_master_data.benchmark_data`
- VIP profile for Jonathan Aldridge populated

Total ingestion time should be substantially less than the original three-tenant wave since the pipeline pattern is already proven.

---

**END OF HANDOFF**

*Anand reviews and merges. Standard governance discipline per established pattern.*
