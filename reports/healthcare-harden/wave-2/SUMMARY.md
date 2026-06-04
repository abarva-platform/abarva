# Wave 2 CDAO Modernization Charter Pack Summary

Generated 350 governed corpus patterns across 9 CDAO modernization-charter batches.

| Batch | Patterns | File |
|---|---:|---|
| CDAO-SEQ modernization wave sequencing | 45 | `scripts/corpus/generated/healthcare-cdao-wave2/cdao-seq-modernization-wave-sequencing.jsonl` |
| CDAO-RACI joint decision rights | 40 | `scripts/corpus/generated/healthcare-cdao-wave2/cdao-raci-joint-decision-rights.jsonl` |
| CDAO-CASE modernization business case | 45 | `scripts/corpus/generated/healthcare-cdao-wave2/cdao-case-modernization-business-case.jsonl` |
| CDAO-PRIOR where-to-start prioritization | 40 | `scripts/corpus/generated/healthcare-cdao-wave2/cdao-prior-where-to-start-prioritization.jsonl` |
| CDAO-SCOPE foundation versus build scoping | 35 | `scripts/corpus/generated/healthcare-cdao-wave2/cdao-scope-foundation-versus-build-scoping.jsonl` |
| CDAO-TCO modernization TCO model | 50 | `scripts/corpus/generated/healthcare-cdao-wave2/cdao-tco-modernization-tco-model.jsonl` |
| CDAO-SKILL skills and team transition | 30 | `scripts/corpus/generated/healthcare-cdao-wave2/cdao-skill-skills-and-team-transition.jsonl` |
| CDAO-SUNSET legacy sunset planning | 35 | `scripts/corpus/generated/healthcare-cdao-wave2/cdao-sunset-legacy-sunset-planning.jsonl` |
| CDAO-CONTRACT modernization-induced contract renegotiation | 30 | `scripts/corpus/generated/healthcare-cdao-wave2/cdao-contract-modernization-induced-contract-renegotiation.jsonl` |

## Loader Path

Patterns are authored as JSONL for `/api/admin/context-layer/corpus-import`, the governed admin loader lane. Default operator flow is validation-only; commit requires explicit attestation.

## Scope

This pack adds CDAO operating doctrine for sequencing, decision rights, business case, prioritization, foundation scoping, TCO, skills transition, legacy sunset, and modernization-induced contract renegotiation.

## Known Limits

- This is an authored corpus artifact and local loader validation target; live commit still requires an authenticated admin upload.
- Tenant-specific Meridian facts are intentionally deferred to Wave 6.
- Live retrieval eval is intentionally deferred until the corpus rows are committed through the governed loader.
