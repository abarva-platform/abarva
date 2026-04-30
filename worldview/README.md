# AbarVa Worldview Corpus

Generated chunk-first corpus for AbarVa's strategic worldview. The canonical retrieval unit is the chunk; long-form markdown is assembled from chunk files for human reading.

## Theses

| Thesis | Title | Canonical chunk file | Pinecone export |
|---|---|---|---|
| W1 | Foundation Models as the Next Enterprise OS | `chunks/W1_chunks.json` | `pinecone-ready/W1_pinecone.json` |
| W2 | The Future of Knowledge Work | `chunks/W2_chunks.json` | `pinecone-ready/W2_pinecone.json` |
| W3 | ERP in the AI Era | `chunks/W3_chunks.json` | `pinecone-ready/W3_pinecone.json` |
| W4 | Software and Consulting Industry Restructuring | `chunks/W4_chunks.json` | `pinecone-ready/W4_pinecone.json` |
| W5 | AbarVa's Consulting-Displacement Vector | `chunks/W5_chunks.json` | `pinecone-ready/W5_pinecone.json` |

## Retrieval Contract

- Namespace: `worldview`
- Embedding target: `text-embedding-3-large`
- Dimension target: `3072`
- Status: draft until `synthesis/quality_gate_report.md` clears human-review items.

## Design Principle

Postgres holds facts. Pinecone holds meaning. The graph holds relationships. The worldview corpus is meaning-first: each chunk contains one complete strategic argument with citations, AbarVa framing, implications, and audience metadata.
