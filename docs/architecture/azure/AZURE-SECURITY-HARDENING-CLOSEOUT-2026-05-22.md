# Azure Security Hardening Closeout

Date: 2026-05-22
Status: closed

## Result

The Azure lab security hardening backlog is closed.

Final audit:

```text
pass: 103
attention: 0
fail: 0
total: 103
```

## Closed Items

| Original item | Final state |
|---|---|
| Service Bus public access | Disabled. Runtime cut over to Premium namespace with private endpoint. Old Standard namespace also locked down. |
| Service Bus local auth | Disabled on active Premium namespace and old Standard namespace. |
| Key Vault public access | Disabled, default deny. |
| Azure AI Search public access | Disabled with private endpoint. |
| Azure AI Search local auth | Disabled after managed-identity/RBAC proof. |
| Cosmos local auth | Disabled; no active app/job Cosmos env references. |
| Storage RBAC broad scope | Narrowed to container-level scope. |
| Service Bus sender broad scope | Narrowed to queue-level scopes. |
| Service Bus receiver broad scope | Narrowed to queue-level scopes. |

## Runtime Proof

| Gate | Result |
|---|---|
| Authenticated Azure health | Pass, HTTP 200 |
| Connectivity smoke | Pass for Postgres, Blob, Service Bus, Key Vault, Azure AI Search |
| Premium Service Bus smoke | Pass after public/local auth disabled |
| Event Grid ingestion | Pass on Premium namespace |
| Queue hygiene | Active 0, dead-letter 0 on Premium queues after ingestion smoke |
| Security audit | Pass, zero attention |

## Notes

The old Standard Service Bus namespace is no longer referenced by the active
app/jobs or Event Grid subscription. It remains available only as a short
rollback artifact and should be deleted after the observation window if no
rollback is needed.
