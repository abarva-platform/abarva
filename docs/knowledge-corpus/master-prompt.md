# Master Prompt · Knowledge Corpus Package

**Purpose:** Architecture for the cross-surface knowledge corpus + executable prompts that populate it.

---

## What this package produces

Two layers of work:

**Layer 1 — Architecture (this session):**
6 design documents that lock schema, query contracts, provenance, cross-references, tenant overlay, curation pipeline.

**Layer 2 — Executable curation (subsequent sessions):**
3 prompts that drive population and integration when handed to Claude Code (or research-augmented agents).

---

## Phase order

### Phase 1 · Architecture commits to repo

Files commit to `docs/knowledge-corpus/`:
- KNOWLEDGE_CORPUS_SCHEMA.md (the data model)
- AGENT_QUERY_CONTRACTS.md (how agents read)
- PROVENANCE_AND_VERSIONING.md (Three Tests applied)
- CROSS_REFERENCE_GRAPH.md (relational structure)
- TENANT_OVERLAY_LOGIC.md (tenant-specific filtering)
- CURATION_PIPELINE.md (v0/v1/v2 sourcing strategy)

These are doc-only. No code. No data. They're the binding architecture.

### Phase 2 · Schema implementation

After architecture is locked, ship implementation PRs:
- Database tables or repo file structure per schema
- Curation tooling for editing entries (CMS-like layer or scripted JSON editing)
- Cross-reference enforcement (graph integrity checks)
- Provenance fields on every record
- Versioning (git for repo-committed JSON, or version columns for DB)

This is straightforward implementation work. ~3-5 days.

### Phase 3 · Population executes

Hand the three executable prompts to Claude Code:

**a. CURATION_PROMPT_RETAIL.md** — produces:
  - ~22 retail use cases (front office: 8 · middle office: 7 · back office: 7)
  - ~25 retail patterns (cross-cutting + per-use-case)
  - ~30-40 retail vendors
  - ~10-15 retail SIs
  - ~10 retail regulatory entries
  - All cross-references populated
  - All provenance tags

  Estimated agent run-time: 6-10 hours (depending on research depth).

**b. CURATION_PROMPT_HEALTHCARE.md** — produces:
  - ~23 healthcare use cases (front office: 7 · middle office: 9 · back office: 7)
  - ~25 healthcare patterns
  - ~30-40 healthcare vendors
  - ~10-15 healthcare SIs
  - ~10-15 healthcare regulatory entries
  - All cross-references populated
  - All provenance tags

  Estimated agent run-time: 6-10 hours.

**c. AGENT_INTEGRATION_PROMPT.md** — produces:
  - Sentinel system prompt updates (read use cases, patterns, regulatory)
  - Source system prompt updates (read vendors, SIs)
  - Nexus system prompt updates (read patterns during Move shaping)
  - Tool definitions for each agent (lookupUseCase · findPatternsForUseCase · etc.)
  - Few-shot examples per agent
  - Browser-Chrome verification plan

  Estimated agent run-time: 4-6 hours.

### Phase 4 · Verification

After population + integration:
- Run journey kit Phase 1 against corpus-grounded agents
- Castillo's probes should pass at higher rates than baseline (Tier 1 substrate access improves)
- Specific check: Sentinel cites use case IDs from corpus when answering "what bets should we be considering"

---

## Stop conditions

This package's architecture phase has minimal stop conditions because it's design work. But for Phase 3 population (when prompts execute):

1. **Research source unavailable** — if curation needs source X (analyst report, vendor docs) and access is blocked, halt and request alternative source
2. **Schema gap discovered during population** — if curation surfaces a field the schema doesn't carry, halt and revise schema before continuing
3. **Vendor / SI ambiguity** — if a vendor's status (alive · acquired · defunct) is unclear, halt and confirm
4. **Cross-reference cycle detected** — if pattern A references use case B references pattern A in a way that breaks query contracts, halt and resolve

For Phase 4 (verification):
1. **Probe failure repeats** — if agent probes still fail after corpus integration, halt and investigate (Tier 1 substrate access · Tier 2 instrumentation gap · Tier 3 synthesis)

---

## Hard rules

1. Architecture before population. Don't curate against unstable schema.
2. Real names, real specificity. Generic placeholders break the credibility thesis.
3. Provenance on every claim. No "common knowledge" entries — every fact has a source.
4. Cross-references enforced at write time. Broken references reject before commit.
5. Two industries for v1 (retail + healthcare). Don't drift into financial services in this package.
6. Population prompts are self-contained — they include the schema reminders and provenance rules so curation runs don't drift.

---

## What this package does NOT do

- Does NOT populate the corpus in this session. Population is via prompts in dedicated runs.
- Does NOT modify existing surfaces.
- Does NOT touch the AI Initiatives Substrate Package (different layer).
- Does NOT cover financial services.
- Does NOT build customer-contributed signal layer.
- Does NOT replace any existing agent (Sentinel · Source-agent · Nexus stay; just get more substrate).

---

## Output format

After architecture commits (Phase 1):
- All 6 architecture docs in `docs/knowledge-corpus/`
- Confirmation in chat that schema is locked and ready for implementation

After implementation (Phase 2):
- Implementation PRs merged
- Confirmation that curation tooling is ready to receive populated entries

After population (Phase 3):
- Corpus populated with retail + healthcare entries
- Cross-references verified
- Provenance tags on every record
- Population reports per industry

After integration (Phase 4):
- Agent system prompts updated
- Tools wired
- Journey kit re-runs with corpus-grounded probes
- Quality dashboard begins tracking

---

## Begin

Phase 1 is what this package delivers. Read the 6 architecture docs in order, commit to repo, then proceed to Phase 2 implementation as a separate scoped effort.
