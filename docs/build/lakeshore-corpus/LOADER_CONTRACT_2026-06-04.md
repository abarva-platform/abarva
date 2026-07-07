# Lakeshore Corpus Loader Contract

Date: 2026-06-04
Loader: `scripts/load-genome-wave.ts`

## Contract Decision

The autonomous execution brief names `pattern_corpus`,
`pattern_nodes`, and `pattern_edges`. The live repository and accepted
ADR-0001 canonical storage decision use the `corpus_patterns` family instead.

This loader follows the accepted repo architecture:

- Relational pattern store: `public.corpus_patterns`
- Pattern content: `public.corpus_pattern_content`
- Version snapshot: `public.corpus_pattern_versions`
- Graph relationships: `public.corpus_pattern_relationships`
- Vector / hybrid search: Azure AI Search index `lakeshore-patterns-v1`

No Pinecone path is used.

## Loader Inputs

The loader consumes one JSON object per line, matching the master prompt's
pattern schema. Metadata lines with `{"__meta": true, ...}` are ignored.

Required invocation shape:

```bash
npx tsx scripts/load-genome-wave.ts \
  --input <wave-jsonl> \
  --tenant lakeshore \
  --domain D01 \
  --wave 1
```

Dry-run is the default. Add `--commit` to write:

```bash
npx tsx scripts/load-genome-wave.ts \
  --input <wave-jsonl> \
  --tenant lakeshore \
  --domain D01 \
  --wave 1 \
  --ensure-index \
  --commit
```

Index-only preflight:

```bash
npx tsx scripts/load-genome-wave.ts \
  --ensure-index-only \
  --index-name lakeshore-patterns-v1
```

## Mapping

| Prompt field | Storage target |
| --- | --- |
| `id` | `corpus_patterns.slug` after slug normalization |
| `title` | `corpus_patterns.title` |
| `domain` + `category` | `corpus_patterns.category` as `<domain>:<category>` |
| `confidence` | `corpus_patterns.confidence` as `high=0.92`, `medium=0.78`, `low=0.62` |
| `summary`, `doctrine`, trigger/failure material | `corpus_pattern_content.markdown_body` and structured JSON |
| `supporting_evidence` | `corpus_pattern_content.evidence_jsonb` |
| full original schema | `corpus_pattern_versions.snapshot_jsonb` |
| `related_patterns` and `graph_relationships` | `corpus_pattern_relationships` when both endpoints are present in the loaded wave |
| `embedding_text` | Embedding input for Azure AI Search document vector |

Relationships to patterns outside the loaded batch are counted as unresolved
and preserved in `synthesis_jsonb` for later cross-wave linking.

## Verified Preflight

- Master prompt copied into the clean worktree with 612 lines.
- Autonomous execution brief copied into the clean worktree with 368 lines.
- Loader dry-run passed against the master prompt exemplar.
- Azure AI Search index `lakeshore-patterns-v1` exists on
  `srchlakeshorepilotlsh001`.
- Live Lakeshore client row exists:
  `f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61` /
  `tenant_key='lakeshore-holdings'`.

## Remaining Gate Before Full Wave Load

Wave generation and critique still need to run before any large commit. The
loader is ready for dry-run validation against each generated wave first, then
`--commit` after critique approval.

