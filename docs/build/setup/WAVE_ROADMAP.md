# Setup Wave Roadmap

| Wave | Title | Status | Catalog entries | Dependency | Notes |
|---|---|---|---|---|---|
| S0 | Audit + roadmap + skeleton plans | in-progress | docs only | none | creates execution ledger after Session 1 spec merge |
| W1 | Shell ownership + connectors foundation | planned | SET-IDX-CONN | S0 | makes `/admin/**` the canonical connector family |
| W2 | Connector detail + reconnect/auth | planned | connector detail states + reconnect flow | W1 | converges auth and health semantics |
| W3 | Microsoft Graph live | planned | first live connector path | W2 | unblocks Tower live M365 and Intelligence signal realism |
| W4 | GitHub + Anthropic connectors | planned | additional connector classes | W3 | extends developer and model telemetry coverage |
| W5 | Users + audit | planned | users, invite, audit | W1 | closes access-control and audit trail surfaces |
| W6 | Policies + governance | planned | policies, tenant, architecture governance | W5 | closes control-plane story |
