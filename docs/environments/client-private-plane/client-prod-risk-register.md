# Client Prod Risk Register

Status: scaffold-ready, not executed

| Risk id     | Risk                                                   | Severity | Control                                          | Owner                 | Status  |
| ----------- | ------------------------------------------------------ | -------- | ------------------------------------------------ | --------------------- | ------- |
| CP-RISK-001 | Client private data crosses into product/control plane | Critical | private-plane boundary and evidence review       | Platform/Security     | Planned |
| CP-RISK-002 | PHI or unapproved PII appears                          | Critical | intake policy and review gate                    | Client owner/Security | Planned |
| CP-RISK-003 | Wrong-tenant retrieval                                 | Critical | tenant-scoped retrieval and context bundle trace | Product               | Planned |
| CP-RISK-004 | Duplicate active facts                                 | High     | deterministic fact key and duplicate gate        | Data platform         | Planned |
| CP-RISK-005 | Public data service exposure                           | High     | policy/private endpoint checks                   | Platform              | Planned |
| CP-RISK-006 | Missing rollback evidence                              | High     | rollback packet and signoff                      | Release owner         | Planned |
| CP-RISK-007 | Budget overrun                                         | Medium   | budget alerts and monthly review                 | Finance/Platform      | Planned |
