# Product Preview Release-Candidate Gates

Status: non-mutating scaffold

Product Preview is the only product/control-plane release-candidate environment before Product Prod. These gates are repo and environment controls; they do not deploy anything by themselves.

## Required Gates

| Gate               | Required evidence                                                                    |
| ------------------ | ------------------------------------------------------------------------------------ |
| Build              | CI build green and image digest recorded                                             |
| Test               | unit, behavior, integration scope, and browser smoke evidence                        |
| Security           | secret scan, dependency audit, no PHI/PII, no client-private data in Product Preview |
| Secret scan        | gitleaks or equivalent pass                                                          |
| IaC validation     | Bicep syntax or what-if output where available                                       |
| Cost/budget        | budget id, thresholds, alert recipients                                              |
| RBAC/policy        | least-privilege RBAC export and policy assignment export                             |
| Observability      | diagnostics, logs, health endpoint, rollback telemetry                               |
| Data boundary      | product/control-plane data only; Client Preprod/Prod data stays private-plane        |
| Release evidence   | release record, pinned image digest, ACA revision export                             |
| Rollback readiness | prior revision or digest and command path                                            |
| Human approval     | explicit approval before Product Prod promotion                                      |

## Stop Conditions

Stop if any gate lacks evidence, if the runtime is Vercel-backed, if Supabase runtime is reintroduced, if Product Preview contains PHI/PII, or if client private data crosses into product/control-plane storage.
