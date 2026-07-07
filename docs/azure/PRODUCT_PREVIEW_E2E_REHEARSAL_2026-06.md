# Product Preview End-To-End Rehearsal

## Purpose

This packet defines ENV-11: the Product Preview end-to-end rehearsal. It turns a release candidate into a product proof by checking the browser, APIs, context layer, retrieval, citations, artifacts, audit traces, and module readiness.

It is intentionally non-mutating. Do not deploy, run migrations, shift traffic, load data, accept known defects, declare Preview go, or promote to Product Prod from this packet without explicit approval.

Machine-readable companion: `docs/azure/PRODUCT_PREVIEW_E2E_REHEARSAL_2026-06.json`.

Verifier: `npm run azure:product-preview-e2e-rehearsal:verify`.

## Rehearsal Surfaces

The rehearsal covers:

- signed-in browser flows
- API health
- programs and Moves APIs
- context health check
- tenant-scoped retrieval
- citation rendering
- artifact/file cabinet
- Responsible AI acknowledgement
- audit trace

## Module Matrix

### Intelligence

- Brief loads
- Enterprise Context tab loads
- Vendor tab loads
- Sentinel answer uses a validated context bundle
- Citations are visible
- Unsupported claims are flagged

### Moves

- Portfolio loads
- Move detail loads
- P0 origination create works
- Phase workspace loads
- Approval gate audit is visible
- Generated artifact is downloadable

### Source

- Source home loads
- Source event list loads
- Source event detail loads
- Uploaded artifact metadata is visible
- Retrieval sources are tenant-scoped

### Tower

- Tower home loads
- Module readiness matches context health
- Audit or ledger links are visible
- Cross-tenant counts are not shown

## Context And Data Readiness Assertions

The rehearsal must prove:

- source files are staged
- source metadata is registered
- records are present
- facts are current and active
- chunks are current and active
- no orphan facts exist
- no duplicate active facts exist
- search index is refreshed
- tenant-scoped retrieval passes
- citation metadata is present
- promotion status is calculated
- `agent_ready` appears only where eligible
- context-bundle trace hashes are emitted before model calls

Do not call chunks-only data ready. Do not call facts-only data ready. Do not call indexed-only data ready. Context-bundle proven is the real bar.

PHI is not accepted. PII is not accepted.

## Security Assertions

The rehearsal must prove:

- no PHI
- no PII
- no Vercel runtime headers
- no Supabase runtime
- wrong-tenant context is excluded
- `not_reviewed`, blocked, and quarantined context are excluded
- restricted context is included only when policy allows it

## Required Evidence

The evidence bundle must include:

- release candidate identity
- signed-in browser screenshots
- API response archive
- context health check report
- retrieval trace report
- context-bundle trace hashes
- citation evidence register
- artifact download receipts
- module readiness summary
- defect backlog
- go/no-go decision
- rollback command

## Approval Boundary

Explicit approval is required before:

- starting the Product Preview end-to-end rehearsal
- using client-approved redacted data
- accepting known defects
- declaring Preview go
- promoting a release candidate to Product Prod

## Command Templates

These are templates only. Do not run without approval.

```bash
npm run qa:agent-grounding:live
```

```bash
npm run qa:agent-quality:live
```

```bash
curl -I "https://<PRODUCT_PREVIEW_HOST>/"
curl "https://<PRODUCT_PREVIEW_HOST>/api/health"
```

## Completion Bar

ENV-11 is scaffold-ready when this packet and verifier exist, pass CI, and are wired into the production-readiness gate.

ENV-11 is complete only after Product Preview exists, a real release candidate is deployed there, and the full rehearsal evidence bundle is captured with a go/no-go decision.
