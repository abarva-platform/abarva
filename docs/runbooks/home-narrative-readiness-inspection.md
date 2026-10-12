# Home narrative readiness inspection

Use the existing narrative plan command inside the approved, digest-pinned private ACA operator job with:

```ini
HOME_ECL_NARRATIVE_READINESS_ONLY=true
ECL_DENSE_TENANT_KEY=<declared canonical tenant>
ECL_DENSE_ASSESSMENT_ID=<exact assessment>
HOME_ECL_NARRATIVE_PROJECTION_VERSION=<explicit projection version>
```

Pass `DATABASE_URL` by secret reference. No model key is needed. Confirm the deployed version supports the selected projection version and secure an exclusive operator-job slot first. Keep the observed idle image and restore it after inspection.

The mode opens a repeatable-read, read-only database transaction with tenant scope and bounded SQL timeouts. It uses the actual narrative packet builder and independent readiness ledger. It emits the projection-row count/content hash, source-link coverage, usable/blocked evidence counts and reasons, admitted signal count, and the exact evidence refusal. An empty projection is reported rather than mistaken for a ready packet. The wrapper captures the private inspection report and proof archive.

A completed inspection is not a successful refresh. `governed_evidence_ready` describes only the packet evidence gate. It does not prove publication quality, source review, independent human or Finance attestation, serving approval, activation, or signed-in product behavior. No source rows, readiness rows, narrative, or selectors are written. Write/apply and approved-plan replay modes cannot be combined with inspection.
