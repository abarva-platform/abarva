# Telemetry and Observability Standard

## Purpose

This standard defines how Nexus records operational signals without turning logs into a shadow data store or leaking client data. It applies to app telemetry, agent quality signals, workflow events, and admin observability reports.

## Event Shape

Every new telemetry event should have:

| Field            | Requirement                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `event_name`     | Stable snake_case name describing what happened                                           |
| `occurred_at`    | ISO timestamp from the server where possible                                              |
| `client_id`      | Required for client-scoped activity; omit only for public or internal-only control events |
| `actor_id`       | User or service actor when available; use a non-sensitive service name for automated jobs |
| `surface`        | Route, module, workflow, or agent surface                                                 |
| `correlation_id` | Request, job, or workflow id that ties related events together                            |
| `outcome`        | `success`, `failure`, `blocked`, `skipped`, or `partial`                                  |
| `reason_code`    | Stable code for blocked, skipped, partial, or failure states                              |

## Data Minimization

- Do not log raw PHI, raw PII, secrets, private documents, prompts containing client data, or full model responses.
- Prefer identifiers, counts, hashes, classification labels, and short reason codes.
- Store evidence pointers rather than evidence bodies unless the destination is explicitly approved for that data class.
- Redact user-entered text before telemetry leaves the request boundary unless the route is specifically designed to capture an approved audit artifact.

## Client Boundaries

Client-scoped telemetry must carry `client_id` and must not mix events across clients in a single unscoped query. Cross-client dashboards are platform-admin surfaces and must aggregate or filter by explicit authorization.

## Required Operational Signals

| Surface                          | Required signals                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Authentication and authorization | Denied access, role mismatch, cross-client scope rejection                                               |
| Agent decision support           | Human gate shown, citation coverage, missing-data banner, high-risk classification, override disposition |
| Ingestion and processing         | File accepted, file quarantined, parsing blocked, anomaly clarification requested, processing completed  |
| Release controls                 | Release-check result, architecture-boundary result, secret scan result, compliance scan result           |
| Background jobs                  | Job started, retried, failed, completed, dead-lettered                                                   |

## Severity and Alerting

Use severity only for operational response:

| Severity   | Use when                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------ |
| `info`     | Expected workflow progress or non-sensitive audit trail                                    |
| `warn`     | User-visible degradation, missing optional dependency, retryable failure, policy near-miss |
| `error`    | Failed user workflow, failed job, denied critical dependency, or blocked release gate      |
| `critical` | Cross-client exposure, secret exposure, data-loss risk, or production outage               |

## Naming Rules

- Use snake_case names, for example `source_vendor_recommendation_blocked`.
- Use past-tense names for facts that happened and present-tense names only for gauges.
- Do not include client names, user names, or dynamic ids in event names.
- Version event payloads with an explicit `schema_version` when downstream consumers depend on the shape.

## Review Checklist

- Event payload is useful without carrying raw sensitive data.
- Client-scoped events include `client_id`.
- Failure and blocked paths are observable, not only success paths.
- Correlation id is available for multi-step workflows.
- Any new dashboard or report states whether it is client-scoped or platform-admin-only.
