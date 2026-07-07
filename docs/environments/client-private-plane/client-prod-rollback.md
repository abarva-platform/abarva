# Client Prod Rollback

Status: scaffold-ready, not executed

Rollback planning must exist before Client Prod is approved.

## Rollback Triggers

- failed health check
- failed context healthcheck
- tenant isolation failure
- search index corruption
- wrong artifact exposure
- RBAC/policy drift
- incident response trigger
- client request

## Rollback Steps

1. Pause new ingestion and search refresh.
2. Preserve audit logs and evidence exports.
3. Revert app/runtime revision if applicable.
4. Restore previous database/search/blob state only through approved restore plan.
5. Disable affected agent context bundle path if retrieval is unsafe.
6. Notify client owner and AbarVa owner.
7. Record incident, root cause, and recovery evidence.

## Evidence

Rollback evidence must include owner, timestamp, command/runbook reference, affected client, affected environment, and validation after rollback.
