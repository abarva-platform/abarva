# Citation Audit

Status: provisional pass.

Validation performed:

- JSON schema validation passed for all five Pinecone-ready files.
- Research notes contain verified URL registers for every thesis.
- No embeddings were generated and no Pinecone upsert was performed.
- Citations are preserved as metadata fields in every chunk.

| Thesis | Chunks | Word range | Avg words | Research URLs | Research lines |
|---|---:|---:|---:|---:|---:|
| W1 | 17 | 520-584 | 550 | 25 | 92 |
| W2 | 16 | 544-584 | 564 | 30 | 154 |
| W3 | 17 | 521-584 | 552 | 32 | 221 |
| W4 | 17 | 525-556 | 546 | 29 | 84 |
| W5 | 15 | 521-568 | 536 | 24 | 109 |

## Human-Review Flags

- Some worker-provided chunks used source URL metadata without full excerpt-level citation detail; the normalizer converted these to ingestion-compatible citation objects. Before public publication, a human editor should enrich high-visibility chunks with exact excerpt text from the original source.
- W3 and W4 include some forecast-oriented claims; keep them marked as draft until a founder/editor approves the phrasing.
- Vendor and consulting economics claims should be rechecked before external publication if more than 90 days old.
