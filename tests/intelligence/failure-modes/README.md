# Intelligence failure-mode regression suite — INT-RGS

Per `docs/build/intelligence/CLAUDE_CODE_INTELLIGENCE_KICKOFF.md`
§5, this suite is the per-stage merge gate for any PR that
touches `src/app/intelligence/**`,
`src/components/intelligence/**`, `src/lib/intelligence/**`,
`src/lib/knowledge/**`, or `src/lib/agent/tools/intelligence/**`.

## Run

```bash
npx jest tests/intelligence/failure-modes
```

## Layout

- `fixtures/questions.ts` — 50-question fixture set (15 cold-CIO,
  15 tenant-grounded, 10 cross-corpus, 5 voice-drift probes, 5
  honesty probes)
- `_helpers/runQuestion.ts` — shared helper that runs a question
  through the broker and returns `{ bundle, systemPrompt }`
- `fm01-mode-discrimination.test.ts` — FM #1 (Indistinguishable from ChatGPT)
- `fm02-empty-state.test.ts` — FM #2 (Empty-state collapse)
- `fm03-provenance.test.ts` — FM #3 (Provenance buried)
- `fm04-voice-drift.test.ts` — FM #4 (Voice drift)
- `fm05-search-results-page.test.ts` — FM #5 (placeholder, LLM-dependent)
- `fm06-tenant-context-unused.test.ts` — FM #6 (Tenant-context unused)
- `fm07-browse-without-thesis.test.ts` — FM #7 (Browse mode without thesis)
- `fm08-failure-narrative-absent.test.ts` — FM #8 (Failure-mode narrative absent)
- `fm09-cross-corpus-missing.test.ts` — FM #9 (Cross-corpus reasoning missing)
- `fm10-demo-fragile.test.ts` — FM #10 (Demo-fragile; Wave-1 acceptance gate)

## Wave plan

**Wave 1 acceptance** — current floor:
- ≥35 of 50 questions complete broker assembly without throwing
  (`fm10-demo-fragile.test.ts`)
- All non-LLM-dependent FM tests pass

**Wave 2 acceptance** — gated on:
- `OPENAI_API_KEY` (CB-2) for embedding job
- `PINECONE_API_KEY` (CB-3) for vector retrieval
- Codex-generated worldview chunks ingested
- CB-6 wires the post-hoc voice-drift validator

Wave 2 lifts:
- ≥45 of 50 questions pass full LLM-output checks
- The `it.todo` placeholders in fm01/fm03/fm04/fm05/fm06/fm09/fm10
  flip to live assertions

## How to extend

1. Add a question to the appropriate category array in
   `fixtures/questions.ts` (keep distribution at 15/15/10/5/5)
2. Tag its `failureModeProbes` so existing FM tests pick it up
3. If the question exercises a new failure-mode behavior not
   covered by existing tests, add a new `fmXX-*.test.ts` file

## Test discipline

- No snapshots — assertions are explicit and value-based
- Bundle-shape tests run against the CB-1 broker stub (no LLM,
  no Pinecone)
- Voice-doctrine tests run against canned anti-pattern + doctrine
  responses from `AGENT_VOICE_SENTINEL.md` §5
- Real LLM-output assertions are tagged `it.todo()` until CB-6
  ships
