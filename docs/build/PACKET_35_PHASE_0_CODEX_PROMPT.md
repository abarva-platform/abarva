# Packet 35 Phase 0 — Codex Execution Prompt

**Purpose:** Hand this prompt to Codex to execute the schema reconciliation (ADR-0001) followed by the Packet 35 Phase 1 audit. After Phase 0 closes, Phase 1 audit runs against a clean canonical schema.

---

## The Prompt

```
You are authorized to execute Packet 35 Phase 0 (Schema Reconciliation)
followed by Phase 1 (Industry Corpus Audit) end-to-end with full
deploy privileges.

AUTHORITY SOURCE:
  - Packet 31 §4.3 (AI authority matrix) — class D and E approved per this prompt
  - Packet 30 §2 (rolling-release and CI policies) — apply
  - ADR-0001 (Canonical Pattern Storage) — your decision blueprint

READING ORDER (read end-to-end before starting):
  1. docs/architecture/adr/0001-canonical-pattern-storage.md
  2. docs/build/PACKET_35_RETAIL_ADJACENT_CORPUS_AUDIT_GENERATE_VALIDATE.md
  3. docs/build/PACKET_31_ARCHITECTURAL_CONSTITUTION_AND_OPERATING_MODEL.md
     (sections §1.2 invariants, §3.3 ADR process, §4.3 authority matrix)

EXECUTION ORDER:

PHASE 0A — DIAGNOSTIC (read-only, 30 minutes)
  1. Confirm whether retrieval actually reads from
     canonical_industry_ai_patterns. Either:
     a. Grep src/lib/knowledge/ and src/lib/agents/ for table references
     b. Instrument the retrieval path with a debug log
     c. Sign in as cio@apex-retail.example.com, ask a question
        designed to retrieve a canonical pattern, inspect sources panel

  2. Document the finding in
     verification/phase-0/RETRIEVAL_PATH_DIAGNOSTIC.md

  3. If finding is "canonical_industry_ai_patterns is NOT retrieved":
     - This is a P0 finding
     - It means the 312 patterns are dead code today
     - Phase 0B migration MUST wire retrieval correctly
     - Note in release record

  4. If finding is "canonical_industry_ai_patterns IS retrieved":
     - Document retrieval shape
     - Phase 0B migration preserves the retrieval path

PHASE 0B — SCHEMA MIGRATION (full code changes, ADR-0001 execution)
  Execute every step in ADR-0001 §Implementation Steps:

  1. Audit actual current schemas of corpus_patterns family
  2. Write migration scripts in scripts/migrations/0001-canonical-pattern-storage/
  3. Update retrieval code to read from corpus_patterns + corpus_pattern_embeddings
  4. Run migration in dev/staging first
  5. Verify SkyHarbor smoke (Packet 30 Phase 1 standard)
  6. Production migration with Vercel rolling release per Packet 30 §5.7
  7. Smoke test SkyHarbor + Apex post-migration
  8. Mark deprecated tables read-only, schedule 30-day drop
  9. CI guard: fail on new INSERT/UPDATE to deprecated tables
  10. Update Packet 31 §1.4 single-source-of-truth declaration
  11. Author release record with ## Audit Evidence section

  Apply ADR-0001 §Acceptance Criteria as the gate.

PHASE 0B SPECIAL CARE:
  - When migrating 28 legacy pattern_packs rows, surface each to founder
    for "industry-applicable vs client-specific" classification. Do not
    auto-classify.
  - Preserve every original ID as provenance.legacy_id
  - SkyHarbor smoke is the highest-risk regression — verify FIRST in
    staging, then 10% rolling release, then 50%, then 100%
  - Embedding regeneration: only re-key by pattern_id; do NOT re-embed
    content unless content changed

PHASE 0C — UPDATE PACKET 35 PHASE 1 AUDIT
  Once schema reconciled:
  1. Update Packet 35 §2.2 audit queries to read from corpus_patterns
  2. Execute Phase 1 audit per Packet 35 §2 (read-only inventory)
  3. Produce docs/architecture/audits/INDUSTRY_CORPUS_AUDIT_2026-05-29.md
     per Packet 35 §2.4 specification

PHASE 0 SCOPE BOUNDARIES:
  ✅ Schema reconciliation (ADR-0001)
  ✅ Retrieval code refactor
  ✅ Migration of existing 312 + 28 + airline overlay content
  ✅ Phase 1 audit per Packet 35 §2
  ✅ Production rolling release
  ✅ Release records per Packet 31 I8

  ❌ Do NOT begin Packet 35 Phase 2 (pattern generation) yet
  ❌ Do NOT touch Apex substrate refresh — separate workstream
  ❌ Do NOT modify Packet 34 — separate workstream
  ❌ Do NOT extend retrieval to support tenant-specific overlay subscriptions
     beyond what ADR-0001 specifies — that's a separate ADR if needed
  ❌ Do NOT alter framework_overlays or data_segment_industry_context tables
     beyond noting their state in audit — they're out of scope

AUTHORITY (pre-approved per Packet 31 §4.3):
  ✅ Class A/B/C changes auto-merge after CI green
  ✅ Class D changes (the migration scripts, retrieval refactor) merge after CI
     + you post a status summary
  ✅ Class E (the ADR execution itself) approved by this prompt
  ✅ Full deploy privileges with rolling release per Packet 30 §5.7

  ❌ Class F (cross-tenant impacting) requires founder ping mid-execution if
     surfaces — none expected, but R8 escalation if so
  ❌ Class G (data destruction) NOT authorized — deprecated tables go read-only,
     not deleted, in this phase

ESCALATION RULES:
  - Packet 30 R8 three-attempt rule applies
  - Packet 31 §4.9 time-boxing: 90 min diagnosis, 4 hr prototype, then re-plan
  - R8 mandatory invocations:
    * SkyHarbor smoke fails post-migration (rollback + report)
    * Apex cross-industry retrieval breaks
    * Any tenant-bleed observed
    * Migration data loss detected
  - Otherwise execute autonomously per ADR-0001 acceptance criteria

CADENCE:
  - Status post at end of Phase 0A diagnostic (with retrieval-path finding)
  - Status post at start of Phase 0B (migration plan + risk assessment)
  - Status post per migration PR merged + deployed
  - Final status when Phase 0C audit document committed
  - Use env -u GH_TOKEN gh ... for all GitHub CLI work

ROLLBACK POLICY:
  - Every migration PR includes explicit rollback steps in release record
  - Schema-altering migrations include DOWN migrations
  - If rollback required, deprecated tables flip back to read-write,
    retrieval reverts, document in verification/INCIDENT_LOG.md

DEFINITION OF DONE (Phase 0 closes when all true):
  □ Retrieval path diagnostic documented
  □ All 312 canonical_industry_ai_patterns migrated with provenance
  □ All 28 pattern_packs migrated (with founder classification)
  □ Airline overlay chunks migrated to corpus_patterns + embeddings
  □ SkyHarbor production smoke green
  □ Apex production smoke green (cross-industry patterns retrievable)
  □ Old tables flagged DEPRECATED, read-only, 30-day drop scheduled
  □ Retrieval code reads from canonical path
  □ CI guard active for deprecated-table writes
  □ Packet 31 §1.4 updated
  □ Packet 35 §2.2 queries updated
  □ Phase 1 audit document committed at
    docs/architecture/audits/INDUSTRY_CORPUS_AUDIT_2026-05-29.md
  □ All release records committed with Audit Evidence
  □ Phase 0 closure summary posted

When Phase 0 closes: STOP. Do not auto-proceed to Packet 35 Phase 2.
Founder reviews audit findings + Phase 0 closure before authorizing
Phase 2 Wave 1 (retail corpus generation).

Begin with Phase 0A diagnostic.
```

---

## What I'd watch for in Codex's first status update

After Phase 0A diagnostic, Codex will post the retrieval-path finding. Three possible outcomes:

### Outcome 1 (best) — `canonical_industry_ai_patterns` IS retrieved
- Migration preserves working state
- 312 patterns aren't dead code
- Phase 0B proceeds as ADR specifies
- SkyHarbor smoke unlikely to regress

### Outcome 2 (worst) — `canonical_industry_ai_patterns` is NOT retrieved
- 312 patterns are decorative
- SkyHarbor airline overlay is the only thing actually being retrieved (from `enterprise_context_chunks`)
- Means today's Sentinel reasoning across Apex/Meridian/etc. is essentially bare-LLM + tenant substrate only
- Migration becomes more urgent because it wires the patterns into the retrieval path for the first time
- Phase 0B retrieval refactor is the key step

### Outcome 3 (likely middle) — partial retrieval
- Some retrievers query `canonical_industry_ai_patterns` for specific use cases
- Vector retrieval uses `enterprise_context_chunks` overlay rows for others
- Inconsistent across modules
- Migration consolidates and consistencizes

**Whichever outcome lands, ADR-0001 stays the destination.** Outcome only changes how dramatic the "before vs after" delta is.

---

## What you do while Codex runs Phase 0

1. **Read ADR-0001 §D.4** (migration scope) carefully. If you disagree with how the 28 legacy `pattern_packs` should classify, edit the ADR before Codex starts. Codex will surface each row for your call when it migrates, but having priors documented helps.

2. **Sleep through Phase 0A.** Diagnostic is 30 min, posts a finding. You read the finding when you wake up.

3. **Approve Phase 0B start.** A 30-second "proceed" once you've read the diagnostic. Codex then runs migration autonomously.

4. **Read the SkyHarbor smoke result.** Critical regression check.

5. **Classify the 28 legacy rows when surfaced.** Maybe 30-60 minutes of judgment calls.

6. **Read the final Phase 0C audit document.** This is the foundation for Packet 35 Phase 2 (retail generation). Make sure the gap map matches your strategic priorities before authorizing Wave 1.

---

## What comes after Phase 0 closes

Per Packet 35 §3-§6:

- **Phase 1 audit** is now embedded in Phase 0C (the audit doc Codex produces)
- **Phase 2 Wave 1** (retail strategy through e-commerce, ~895 patterns) authorized via separate prompt
- **Each wave** through Wave 5 follows the same author → review → next-wave pattern
- **Phase 3 validation gauntlet** runs after Wave 5
- **Then** Apex substrate refresh
- **Then** Packet 34 comprehensive browser crawl

Phase 0 is the unblocker. Everything downstream stalls until it lands.

---

## Net summary

- **ADR-0001 written.** `corpus_patterns` is the canonical destination. Migration path explicit. SkyHarbor regression risk explicitly managed.
- **Codex execution prompt ready.** Pre-approved authority for the migration. Mandatory R8 escalations defined. SkyHarbor smoke is the gating check.
- **Outcomes from Phase 0A diagnostic** will dictate urgency — the worst case actually accelerates the value of migrating because it means patterns aren't reaching Sentinel today.
- **Phase 0 closes with a clean canonical pattern store + an audit document** that tells you exactly where to start the retail corpus generation.

---

When you're ready, hand the prompt above to Codex. Reply with the Phase 0A diagnostic finding once it lands and we'll calibrate the migration risk together.
