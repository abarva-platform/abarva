# Client Prod Go / No-Go

Status: scaffold-ready, not executed

Client Prod is a client private data-plane production environment. It is separate from Product Prod and from Client Preprod.

## Production Readiness Checklist

- Client Preprod rehearsal passed or has explicit accepted waiver.
- Client approval recorded.
- Security readiness reviewed.
- Data boundary validated.
- RBAC validated.
- Budget validated.
- Monitoring and diagnostics validated.
- Incident response owner and contact path ready.
- Backup/restore posture accepted.
- Retention and deletion policy accepted.
- Context healthcheck passes.
- Retrieval/citation/context-bundle proof passes.
- No PHI and no unapproved PII.

## No-Go Criteria

- missing client signoff
- public database access without exception
- missing budget/RBAC/policy/diagnostics
- unapproved sensitive data
- wrong-tenant retrieval
- missing rollback owner
- missing incident response path
- unsupported claims in agent answer QA

## Final Signoff

| Decision          | Client owner | AbarVa owner | Security reviewer | Date/time     | Evidence |
| ----------------- | ------------ | ------------ | ----------------- | ------------- | -------- |
| Go / No-Go / Hold | `<name>`     | `<name>`     | `<name>`          | `<timestamp>` | `<path>` |
