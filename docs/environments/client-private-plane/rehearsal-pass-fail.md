# Client Preprod Rehearsal Pass / Fail

Status: scaffold-ready, not executed

## Pass Criteria

- environment identity resolves correctly
- private data-plane boundary is intact
- budget, RBAC, policy, tags, Key Vault, diagnostics, and private networking evidence exists
- source files are staged in Azure Blob
- source files are registered in Postgres metadata
- records, facts, chunks, and current views are committed
- no orphan facts
- no duplicate active facts
- search index is refreshed
- tenant-scoped retrieval works
- citation metadata is present
- promotion status is calculated without auto-promoting `agent_ready`
- context bundle trace proves wrong-tenant, blocked, quarantined, and superseded rows are excluded

## Fail Criteria

- PHI appears
- unapproved PII appears
- client private data appears in product/control-plane storage
- public database access is enabled without approved exception
- missing budget, RBAC, policy, diagnostic, or Key Vault evidence
- chunks-only, facts-only, or indexed-only data is called ready
- context bundle proof is missing

## Decision

| Decision           | Reviewer | Evidence   | Notes     |
| ------------------ | -------- | ---------- | --------- |
| Pass / Fail / Hold | `<name>` | `<report>` | `<notes>` |
