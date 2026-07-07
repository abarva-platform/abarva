# Derived Answerability — 2026-06-09 (Workstream D)

Replaces the hardcoded `expectedAnswerability` constants in the golden suites and
the domain/subdomain matrix with a status **derived from measured pipeline
state**. This is the fix for "the answerability tag doesn't tell me *why*."

## The model — loaded → indexed → retrievable → cited

`deriveAnswerability(signals)` (`src/lib/agent-data-coverage/answerability.ts`)
maps measured signals to exactly one status, each with a reason and a
remediation lane:

| Status | Meaning | Lane |
|--------|---------|------|
| `NOT_TESTED` | not exercised against data yet | — |
| `NOT_LOADED` | no committed facts for the dimension | ingestion_data_load |
| `CONTENT_GAP` | rows exist but the required content is absent | ingestion_data_load |
| `INDEXING_GAP` | loaded, not indexed | retrieval_indexing |
| `RETRIEVAL_GAP` | indexed, query returned nothing | retrieval_indexing |
| `CONTEXT_BUNDLE_GAP` | retrieved, excluded from the validated bundle | provenance_source_state |
| `CITATION_RENDERING_GAP` | in bundle, no/unrendered citations | ui_module_binding |
| `CLAIM_SUPPORT_GAP` | claims not supported by evidence | answer_prompt_synthesis |
| `ANSWERED_AND_GROUNDED` | full pipeline passed | — |

Signals come from the PR-1 trace (`retrieved_*`, `excluded_objects`,
`citation_objects_emitted`), `governed_object_readiness`
(`retrievability`, `cited_render_verified_at`), and PR-4 claim validation. The
live harness on Azure Container Apps supplies them; this library is pure and
unit-tested.

## What changed

- `src/lib/agent-golden/types.ts` and `src/lib/agent-domain-matrix/types.ts`:
  `Answerability` now aliases the derived `AnswerabilityStatus` (the 10 measured
  statuses), not the old `FULLY/PARTIALLY/NOT_LOADED` trio.
- `suites.ts` / `matrix.ts`: every blanket `PARTIALLY_ANSWERABLE` /
  `FULLY_ANSWERABLE` hypothesis is now **`NOT_TESTED`** (honest — not measured
  yet). Designed negative tests keep `NOT_LOADED`.

No question is ever labelled FULLY/PARTIALLY answerable by a constant again — the
status is measured or explicitly `NOT_TESTED`.
