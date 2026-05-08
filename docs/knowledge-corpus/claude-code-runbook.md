# Claude Code Runbook · Knowledge Corpus Package

This is the orchestration prompt for Claude Code to execute the package end-to-end.

---

## Pre-flight

1. Open Claude Code: `cd ~/Projects/nexus && claude`
2. Set model: `/model opus`
3. Confirm clean main: `git status`
4. Confirm GH access: `gh auth status`
5. Confirm browser-chrome MCP loaded
6. Paste the prompt below

---

## The prompt

```
You are executing the Knowledge Corpus Package for AbarVa.

This package has TWO execution phases that may run in DIFFERENT SESSIONS:

PHASE 1 (this session) — Architecture lands as committed docs.
PHASE 2 (subsequent sessions) — Curation prompts execute against populated infrastructure.

Don't try to do both in one session. Phase 2 needs schema implementation + curation tooling that ships AFTER Phase 1 architecture is reviewed and committed.

REQUIRED READING (read in order):

1. /docs/knowledge-corpus-package/README.md
2. /docs/knowledge-corpus-package/master-prompt.md
3. /docs/knowledge-corpus-package/KNOWLEDGE_CORPUS_SCHEMA.md
4. /docs/knowledge-corpus-package/AGENT_QUERY_CONTRACTS.md
5. /docs/knowledge-corpus-package/PROVENANCE_AND_VERSIONING.md
6. /docs/knowledge-corpus-package/CROSS_REFERENCE_GRAPH.md
7. /docs/knowledge-corpus-package/TENANT_OVERLAY_LOGIC.md
8. /docs/knowledge-corpus-package/CURATION_PIPELINE.md
9. /docs/knowledge-corpus-package/CURATION_PROMPT_RETAIL.md (executable; not for THIS session)
10. /docs/knowledge-corpus-package/CURATION_PROMPT_HEALTHCARE.md (executable; not for THIS session)
11. /docs/knowledge-corpus-package/AGENT_INTEGRATION_PROMPT.md (executable; not for THIS session)

After reading, execute Phase 1 only.

---

## Phase 1 · Architecture commits

Phase 1 work:

1. Confirm package is at /docs/knowledge-corpus-package/ in repo. If not, commit the package files there.
2. Move architecture files (the 6 design docs) to /docs/knowledge-corpus/:
   - KNOWLEDGE_CORPUS_SCHEMA.md
   - AGENT_QUERY_CONTRACTS.md
   - PROVENANCE_AND_VERSIONING.md
   - CROSS_REFERENCE_GRAPH.md
   - TENANT_OVERLAY_LOGIC.md
   - CURATION_PIPELINE.md
3. Commit with message: "docs(knowledge-corpus): land architecture for cross-surface knowledge corpus"
4. Open PR. CI green. Merge.

Output to chat:
"Phase 1 complete. Architecture committed to docs/knowledge-corpus/. Ready for Phase 2 implementation work in next session."

Halt after Phase 1.

---

## Phase 2 (subsequent sessions only)

These run in separate Claude Code sessions, each scoped to one prompt:

Session A — Schema implementation
- Build corpus directory structure
- Build curation tooling (JSON validation, cross-reference enforcement, index generation)
- Tests
- Estimated 3-5 days

Session B — Retail curation
- Hand CURATION_PROMPT_RETAIL.md
- Research-augmented agent populates retail entities
- Estimated 6-10 hours of agent run time

Session C — Healthcare curation
- Hand CURATION_PROMPT_HEALTHCARE.md
- Research-augmented agent populates healthcare entities
- Estimated 6-10 hours of agent run time

Sessions B and C can run in parallel.

Session D — Agent integration
- Hand AGENT_INTEGRATION_PROMPT.md
- Wires Sentinel, Source-agent, Nexus to corpus
- Estimated 1-2 days
- Depends on B and C complete

Session E — Journey kit re-run
- Run journey kit Phase 1 against corpus-wired agents
- Verify probes pass at higher rates
- Capture corpus-grounded sample responses
- Estimated half day

---

## Stop conditions

Phase 1 stop conditions are minimal — it's doc commits.

Phase 2 stop conditions per individual prompts (see each prompt's stop conditions section).

For Phase 1:
- Existing /docs/knowledge-corpus/ directory has conflicting content → halt for review
- Schema doc has fields that conflict with existing AbarVa data models → halt for reconciliation

---

## Hard rules

1. Phase 1 ONLY in this session. Do not begin Phase 2 work.
2. Architecture docs are doctrine — no code in Phase 1.
3. Every architecture doc commits to /docs/knowledge-corpus/ unchanged from package.
4. Phase 2 prompts are handed to dedicated curation/implementation sessions.
5. Phase 2 sessions B and C (retail and healthcare curation) can parallelize.
6. Phase 2 session D (agent integration) blocks on B+C completion.

---

## What this runbook does NOT do

- Does not populate corpus in this session
- Does not implement schema infrastructure in this session
- Does not wire agents in this session
- Does not modify existing AbarVa surfaces
- Does not change Intelligence / Source / Moves UI

---

## Begin

Read 11 package files. Then commit architecture docs (6 of them) to /docs/knowledge-corpus/. Halt. Confirm in chat.
```

---

## End of runbook

Phase 1 expected duration: ~30 minutes (mostly file moves and PR).

Phase 2 calendar (across separate sessions):
- Session A (schema implementation): 3-5 days
- Session B (retail curation): 6-10 hours
- Session C (healthcare curation): 6-10 hours, parallel with B
- Session D (agent integration): 1-2 days
- Session E (journey kit verification): half day

Total: ~1-2 weeks from Phase 1 commit to full corpus-grounded agent operation.
