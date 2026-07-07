# Healthcare Harden Brief — Addendum v2 (Substrate Alignment)

**Supersedes the precondition section of:** [2026-06-04-HEALTHCARE_MODERNIZATION_HARDEN_AUTONOMOUS.md](./2026-06-04-HEALTHCARE_MODERNIZATION_HARDEN_AUTONOMOUS.md)
**Resolves:** Codex escalation `ESCALATE_BLOCKED_PRECONDITION_INVENTORY_wave-0` from PR #3029
**Intent:** Get Codex back to non-stop execution against the *actual* substrate, not the substrate the original brief assumed.

---

## What the precondition gate caught (Codex was right to stop)

Three real mismatches between the original brief and the live system:

| Original brief assumed | Reality |
|---|---|
| Table named `pattern_corpus` | Table is named `genome_patterns` |
| Modernization patterns already loaded (Lakebridge, Well-Architected, etc.) | Zero modernization-specific patterns in DB — June 3 pack was scoped + spec'd, never loaded with content |
| Loader supports the rich schema (doctrine, evidence chain, anti-patterns, graph relationships) | Current `load-authored-genome-seeds.ts` preserves only the classification metadata fields; drops doctrine/evidence/anti-patterns |

The gate did its job. **Do not bypass it.** The fix is to align the brief to reality and add the missing loader capacity, not to lower the precondition bar.

---

## Updated precondition inventory (use these counts, not the v1 brief's)

| Asset | Expected | Actual (live) | Verify via |
|---|---|---|---|
| Total `healthcare_provider` rows in `genome_patterns` | ≥ 11,000 | **11,825** | `SELECT count(*) FROM genome_patterns WHERE vertical='healthcare_provider';` |
| Demo-relevant healthcare rows | ≥ 7,000 | **7,587** | `SELECT count(*) FROM genome_patterns WHERE vertical='healthcare_provider' AND demo_relevant=true;` |
| Healthcare graph edges | ≥ 20,000 | **23,850** | edges table count |
| Modernization-specific patterns | (was assumed loaded) | **0** | `SELECT count(*) FROM genome_patterns WHERE description ILIKE '%lakebridge%' OR description ILIKE '%bladebridge%' OR description ILIKE '%unity catalog%' OR description ILIKE '%epic clarity%';` |
| Loader | `scripts/corpus/load-authored-genome-seeds.ts` writes to `genome_patterns` | ✅ confirmed | Read file header |

**This is good news**: the existing healthcare base is bigger and richer than I estimated. The work is real, just different from the original brief.

---

## Substrate alignment — the small PR that unblocks the 6-wave run

Before resuming the 6-wave hardening loop, land **ONE substrate-alignment PR** with two changes:

### Change A · Loader schema extension

Add a JSONB column to `genome_patterns` for the rich doctrine fields the master prompt requires. Single migration, additive only:

```sql
-- supabase/migrations/<next-timestamp>_genome_patterns_doctrine_context.sql

ALTER TABLE genome_patterns
  ADD COLUMN IF NOT EXISTS doctrine_context JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_genome_patterns_doctrine_context
  ON genome_patterns USING GIN (doctrine_context);

-- Doctrine context shape (what the loader will write):
-- {
--   "doctrine": "<the actual rule>",
--   "triggers": ["<observable condition>", "..."],
--   "applies_when": "<sentence>",
--   "does_not_apply_when": "<sentence>",
--   "decision_owner": "<role>",
--   "supporting_evidence": [
--     {"source_type": "...", "label": "...", "detail": "..."}
--   ],
--   "anti_patterns": ["..."],
--   "failure_modes": ["..."],
--   "decision_artifacts": ["..."],
--   "graph_relationships": [
--     {"relation": "supersedes|depends_on|conflicts_with|implements|refines|extends_pattern|enables_workflow",
--      "target": "<pattern_id>"}
--   ],
--   "personas": ["cdao", "cpo", "cio", ...],
--   "specificity": "tenant_specific | healthcare_specific | industry_canon | generic",
--   "confidence": "high|medium|low"
-- }

COMMENT ON COLUMN genome_patterns.doctrine_context IS
  'Rich decision-grade fields per the master-prompt schema. Empty {} for legacy patterns loaded before 2026-06-04.';
```

**Why one JSONB column instead of N columns:** legacy patterns don't have these fields, so making them NOT NULL columns would break the existing 11,825 rows. JSONB defaults to `{}` for legacy rows and gets populated for new + refined patterns. Cheap to query (GIN index), cheap to extend, cheap to retire if we ever consolidate.

### Change B · Loader enhancement

Update `scripts/corpus/load-authored-genome-seeds.ts` to:

1. Accept the rich doctrine fields from the input JSONL (`doctrine`, `triggers`, `applies_when`, `decision_owner`, `supporting_evidence`, `anti_patterns`, `failure_modes`, `decision_artifacts`, `graph_relationships`, `personas`, `specificity`, `confidence`)
2. Bundle them into a `doctrine_context` JSONB object
3. Upsert to `genome_patterns.doctrine_context` (additive — does NOT alter existing classification fields)
4. Continue writing `description`, `keywords`, `demo_relevant`, `vertical`, `quality_tier`, `quality_score`, etc. exactly as today

Pseudocode for the loader change:

```typescript
const doctrineContext = {
  doctrine: parsed.doctrine,
  triggers: parsed.triggers,
  applies_when: parsed.applies_when,
  does_not_apply_when: parsed.does_not_apply_when,
  decision_owner: parsed.decision_owner,
  supporting_evidence: parsed.supporting_evidence,
  anti_patterns: parsed.anti_patterns,
  failure_modes: parsed.failure_modes,
  decision_artifacts: parsed.decision_artifacts,
  graph_relationships: parsed.graph_relationships,
  personas: parsed.personas,
  specificity: parsed.specificity,
  confidence: parsed.confidence,
};

await client.query(
  `INSERT INTO genome_patterns
     (id, code, name, vertical, description, keywords, demo_relevant,
      quality_tier, quality_score, doctrine_context)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
   ON CONFLICT (id) DO UPDATE SET
     description = EXCLUDED.description,
     keywords = EXCLUDED.keywords,
     quality_tier = EXCLUDED.quality_tier,
     quality_score = EXCLUDED.quality_score,
     doctrine_context = EXCLUDED.doctrine_context,
     updated_at = now()`,
  [id, code, name, vertical, description, keywords, demoRelevant,
   qualityTier, qualityScore, JSON.stringify(doctrineContext)]
);
```

Add a unit test that confirms a sample JSONL with rich fields round-trips through the loader and lands in `doctrine_context` correctly.

### Acceptance for the alignment PR

- [ ] Migration applies cleanly against Azure Postgres
- [ ] Loader handles both old-shape (legacy classification only) and new-shape (with doctrine_context) inputs
- [ ] One sample JSONL pattern round-trips with all 13 rich fields preserved
- [ ] No regression on existing healthcare pattern queries (all 11,825 still return correctly)
- [ ] PR titled: `feat(corpus): doctrine_context JSONB on genome_patterns + loader enhancement`

Codex can ship this in 1-2 hours. After merge, the 6-wave run resumes.

---

## Wave 1 reframe — modernization is "load + harden," not just "harden"

The original brief assumed modernization patterns were already loaded and just needed refining. The reality is they're at zero. Wave 1's structure changes:

| Phase | Original brief | Revised for actual reality |
|---|---|---|
| Phase 1 AUDIT | Audit existing modernization patterns | **SKIP** — nothing to audit; the doc/spec exists but content is zero in DB |
| Phase 2 REFINE | Refine weak modernization patterns | **SKIP** — nothing to refine |
| Phase 3 FILL GAPS | Add gap-fill patterns | **EXPANDED** — this is the full Wave 1. Generate the entire modernization pattern pack content from the June 3 spec |
| Phase 4 CRITIC | Critique new patterns | **MANDATORY** — fresh-context Opus critic on every modernization pattern; this is the credibility wave |
| Phase 5 EVAL | Wave eval ~15 questions | Run the modernization anchor questions from the 100-Q harness |
| Phase 6 LOAD | Load to substrate | Load via the enhanced loader (Change B above) |

**Wave 1 revised target:** ~600-800 NEW modernization patterns covering the full spec:
- Archetype library (6 archetypes × 5-10 patterns each = ~50)
- 3 industry estate profiles (healthcare/retail/airline) × ~40 patterns each = ~120
- 7 R's disposition policy × ~10 patterns each = ~70
- Well-Architected Lakehouse 7 pillars × ~15 patterns each = ~105
- Lakebridge/BladeBridge automation rates per source type = ~30
- SI methodology divergence (5 major SIs × ~10 patterns each) = ~50
- Brickbuilder migration solutions = ~25
- Weighted RFP scorecard patterns = ~30
- Effort heuristics (T-shirt × complexity × automation leverage) = ~50
- Workload inventory schema patterns = ~20
- 3rd-party accelerator coverage (LeapLogic, MigryX, etc.) = ~30
- Anti-patterns for modernization = ~50

That's **~630 patterns minimum** for the modernization pack alone — load-bearing for the CDAO charter pitch.

Use Opus for all of Wave 1. The CDAO will catch any inaccuracy on Databricks methodology, 7 R's framing, or Lakehouse pillar definitions — so the pattern bar must clear that audience.

---

## Updated database query examples (use these in audit phase)

Replace all v1-brief SQL that references `pattern_corpus` with `genome_patterns`. Specifically:

| What to query | Updated SQL |
|---|---|
| Healthcare base count | `SELECT count(*) FROM genome_patterns WHERE vertical='healthcare_provider';` |
| Demo-relevant healthcare | `SELECT count(*) FROM genome_patterns WHERE vertical='healthcare_provider' AND demo_relevant=true;` |
| Modernization pattern check | `SELECT count(*) FROM genome_patterns WHERE doctrine_context @> '{"specificity": "modernization"}'::jsonb;` (after Change B lands) |
| CPO pattern check | `SELECT count(*) FROM genome_patterns WHERE doctrine_context @> '{"personas": ["cpo"]}'::jsonb;` (after Change B lands) |
| Coverage gaps for terms | `SELECT count(*) FROM genome_patterns WHERE description ILIKE '%<term>%';` |

For the v1-brief's "audit existing patterns" workflow in Waves 2 + 4, query `genome_patterns` for the domain prefix (e.g., dom50, dom70-73 for CDAO-relevant) and apply the audit verdict against `doctrine_context` (after Change B, refined patterns will have rich fields; legacy patterns will have empty `{}` and audit verdict will be "REFINE → backfill doctrine_context" rather than KEEP/REFINE/KILL on existing fields).

---

## Wave 2-6 unchanged (just substrate name)

Waves 2 through 6 in the original brief are still correct in **purpose and content**. Only changes:

- s/pattern_corpus/genome_patterns/g throughout
- Audit verdicts now consider both classification-tier fields (existing) AND doctrine_context (new) — most existing patterns will audit as "REFINE → add doctrine_context" rather than KEEP, since the rich fields are zero today
- CPO patterns (Wave 3) are net-new — write doctrine_context directly on creation

The 30 anchor questions stay verbatim. The eval grader stays verbatim. The escalation gates stay verbatim.

---

## Resumption protocol for Codex

1. Land the substrate-alignment PR (Change A + Change B) — ~1-2 hours, focused, safe
2. Verify migration applied cleanly and loader test passes
3. **Resume the 6-wave run on the existing brief** (with this addendum overriding the precondition + Wave 1 sections)
4. Run non-stop through Wave 6
5. Open final harden PR + final readiness report as the original brief specifies

The addendum does NOT relax any escalation gates. Modernization eval still must hit ≥ 9.0/10. CPO eval still must hit ≥ 8.5/10. Citation rate still must hit ≥ 85%. Anti-pattern recognition still must hit ≥ 9/10.

---

## Why this is worth the extra ~2 hours

Codex stopping was correct. The two alternatives were both worse:

| Option | Outcome |
|---|---|
| **Bypass the gate** | Loader silently drops the rich doctrine fields. Wave 1's ~630 modernization patterns land in DB without doctrine, evidence chain, or anti-patterns. Eval grades poorly. We rebuild everything in Wave 7. |
| **Use a compatibility shim (view named pattern_corpus over genome_patterns)** | Adds layer of indirection forever. Future Codex sessions are confused by the dual-naming. Tech debt that never gets paid down. |
| **Substrate alignment (this addendum)** ✅ | One small PR (~2 hours). Brief is now accurate to reality. Future tenants get the same enhanced loader. Doctrine fields are first-class in the schema. |

The 2-hour substrate alignment is the cheapest, cleanest path. The escalation gate just paid for itself.

---

## One-line invocation for Codex to resume

After the substrate-alignment PR merges:

```
Execute docs/build/codex-handoff/2026-06-04-HEALTHCARE_MODERNIZATION_HARDEN_AUTONOMOUS.md
with the substrate-alignment addendum at
docs/build/codex-handoff/2026-06-04-HEALTHCARE_HARDEN_BRIEF_ADDENDUM_v2.md
overriding the precondition + Wave 1 sections. Run non-stop. Report at every
escalation gate. Surface the final readiness report when done.
```

---

## Decision needed from Anand (before Codex resumes)

One open question. Surface to Anand at next reply and proceed once answered:

**Q:** Wave 1 is now ~630 net-new modernization patterns generated from the June 3 spec. Estimated additional ~$25 in model spend and ~3-4 extra hours wall-clock vs the original "harden-only" budget. The total run is now ~$75 / ~12 hours instead of ~$50 / ~8 hours.

Proceed at the revised budget, or cap modernization wave at 300 patterns (cover the core archetypes + 7 R's + 3 industry profiles only, skip the SI methodology divergence and 3rd-party accelerator coverage) to stay within original envelope?

Default if no answer: proceed at revised budget. The modernization content is the load-bearing reason for the entire run; cutting it to stay under budget defeats the purpose.
