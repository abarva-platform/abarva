# First Capital Refresh Load Plan

Batch: `fcf-refresh-2026-06-candidate-v1`
Client: `First Capital Financial` / `first-capital`
Prepared: `2026-06-17T00:00:00.000Z`

## Current State

- Local artifact generated: yes.
- Local parse/preflight: pending commands in this run.
- Product loader/API accepted upload: not yet.
- Azure Blob staged originals: not yet.
- Parser extracted cited records/chunks: local structured derivatives staged; live parser proof pending.
- Review queue: required for source docs, inferred agents, productivity baselines, regulatory/risk rows.
- Context committed: not yet.
- Embeddings/search refreshed: not yet.
- Retrieval proven: not yet.
- Insight evaluator run: not yet.

## Candidate Load Sequence

1. Run static synthetic data depth audit.
2. Run First Capital substrate loader dry-run.
3. Stage originals to Azure Blob under the First Capital pilot container.
4. Parse structured CSV/JSON/YAML/JSONL files into records/chunks with row or section citations.
5. Commit First Capital records into tenant-scoped context tables.
6. Commit AI Control Tower monthly refresh rows into `ai_control_*` tables.
7. Refresh embeddings/search.
8. Run signed-in Atlas/Sentinel retrieval proof.
9. Run significance insight evaluator.
10. Archive generated or non-canonical artifacts that lack source provenance.

## Non-Negotiable Gaps Before Live Claims

- Public-company annual/quarterly/investor source evidence is not staged yet.
- Data center/private cloud topology needs richer evidence than contract rows.
- AI Control Tower workbook/API route commit proof is still required.
- Live Azure/Postgres proof must run from a network that can resolve the private host.
