# Environment Ownership RACI

Status: scaffold-ready

| Activity                          | Founder | Product | Platform | Security | Client owner |
| --------------------------------- | ------- | ------- | -------- | -------- | ------------ |
| Product Dev planning              | A       | R       | C        | C        | I            |
| Product Preview release candidate | A       | R       | R        | C        | I            |
| Product Prod cutover              | A       | R       | R        | A        | I            |
| Client Preprod rehearsal          | A       | R       | R        | A        | A            |
| Client Prod go/no-go              | A       | C       | R        | A        | A            |
| Budget review                     | A       | C       | R        | C        | C            |
| RBAC review                       | A       | I       | R        | A        | C            |
| Policy drift review               | A       | I       | R        | A        | I            |
| Incident response                 | A       | C       | R        | A        | A            |

Legend: R = responsible, A = accountable, C = consulted, I = informed.

Broad RBAC, budgets, subscription creation, DNS, Product Prod traffic shifts, and client-prod data actions require explicit approval.
