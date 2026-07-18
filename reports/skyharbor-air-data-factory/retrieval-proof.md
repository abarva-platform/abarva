# Airline Demo Retrieval Proof

Status: PASS_LOCAL_CANDIDATE_PREVIEW

This proves generated candidate retrieval chunks are tenant-scoped, lineage-backed, and candidate-preview-only. It does not prove Azure/Postgres read-back or signed-in product retrieval.

- Candidate chunks exist: pass - 4600 chunks
- Candidate retrieval scope only: pass - retrieval_scope checked
- Default active retrieval excluded: pass - default_runtime_visible checked
- Chunk lineage exists: pass - fact/evidence lineage checked
- Azure/Postgres not mutated: pass - manifest boundary checked
