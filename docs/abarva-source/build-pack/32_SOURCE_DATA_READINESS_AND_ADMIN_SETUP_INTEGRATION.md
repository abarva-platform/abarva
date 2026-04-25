# 32 Source Data Readiness And Admin Setup Integration

## Purpose

This file defines how AbarVa Source uses the broader AbarVa Admin/Setup data readiness layer. Source must not create a standalone setup process. Source consumes platform readiness state to decide whether a sourcing event has enough usable evidence to proceed.

## 1. Product Principle

AbarVa Admin/Setup owns platform-level readiness for:

- Data onboarding.
- Connector setup.
- Dataset readiness.
- Permissions.
- Parsing status.
- Evidence usability.

AbarVa Source consumes those platform capabilities. Source translates readiness into sourcing-specific workflow impact, artifact tier, agent recommendations, scorecard confidence, vendor evaluation readiness, pricing readiness, and value ledger confidence.

Source does not decide that data is usable evidence by itself. Source asks the platform readiness and evidence layers whether data is missing, loaded, parsed, available, usable, low confidence, stale, access restricted, waived, or not applicable.

## 2. Source Should Not Duplicate Setup

Source should not create its own:

- Connector setup.
- Dataset inventory.
- Tenant access controls.
- Parsing pipeline.
- Evidence store.
- File management system.

Source should show sourcing-specific readiness derived from Admin/Setup. If the user needs to resolve a data gap, Source can explain the gap and route the user to the Admin/Setup-owned action, but it should not invent a second setup workflow inside Source.

## 3. Data Readiness States

Use these readiness states consistently:

- Missing: required data is not present and no request is active.
- Requested: data has been requested from an owner or source system.
- Uploaded: a file exists, but it has not necessarily been loaded or parsed.
- Connected: a connector or source system connection exists.
- Loaded: data has entered the platform, but may not be parsed or validated.
- Parsed: data has been parsed into usable structures, but may not be validated evidence.
- Available: data can be viewed or retrieved, but may not be evidence-grade.
- Usable Evidence: data is validated enough to support Source claims, citations, artifacts, scorecards, or decisions.
- Low Confidence: data exists but quality, completeness, source provenance, or extraction confidence is weak.
- Stale: data is old enough to affect sourcing confidence.
- Access Restricted: data exists but the current user or agent cannot access it.
- Not Applicable: the data category is not needed for the sourcing event.
- Waived: the required data gap was explicitly waived with owner, reason, and audit trail.

Loaded data is not the same as usable evidence. Available data is not the same as validated evidence. Source must distinguish these states before recommending artifact generation, scorecard moves, vendor decisions, pricing normalization, or value claims.

## 4. Source Sourcing Data Requirements

Source maps sourcing needs to platform dataset domains. Admin/Setup owns onboarding and readiness. Source consumes the readiness state.

### AMS Required Data

Application Managed Services sourcing requires:

- Application inventory.
- Application criticality.
- Business and IT ownership.
- Ticket history.
- Incident, problem, service request, and enhancement volumes.
- Current vendor or internal cost.
- Support hours.
- SLA expectations.
- Retained roles.
- Vendor contracts.

Recommended platform dataset domains include application portfolio, service management, finance/cost baseline, organization/ownership, SLA/contract repository, and retained-organization model.

### IMS Required Data

Infrastructure Managed Services sourcing requires:

- Infrastructure inventory.
- Cloud/on-prem split.
- Incident volumes.
- Monitoring coverage.
- Patching status.
- Backup/DR requirements.
- Current support cost.
- Vendor contracts.
- SLA expectations.

Recommended platform dataset domains include infrastructure CMDB, cloud inventory, monitoring/observability, service management, backup/DR, finance/cost baseline, and contract repository.

### Data Platform Managed Services Required Data

Data Platform Managed Services sourcing requires:

- Data platform inventory.
- Pipeline inventory.
- Report/dashboard inventory.
- Refresh/SLA history.
- Data quality incidents.
- Platform cost.
- Support tickets.
- Governance/access requirements.
- Vendor contracts.

Recommended platform dataset domains include data platform inventory, pipeline catalog, BI/report catalog, data quality, service management, finance/cost baseline, governance/access, and contract repository.

## 5. Source Data Readiness Panel

A future Source event panel should be named:

Data Readiness for This Event

For each required data category, show:

- Required, recommended, or optional.
- Setup status.
- Evidence usability.
- Owner.
- Source system/file.
- Last updated.
- Confidence.
- Impact on workflow.
- Nexus recommendation.
- Steward/Admin handoff.

Examples:

- Ticket History - Missing - Blocks Rich-tier RFP.
- Vendor Contracts - Loaded, parsing pending - Cannot cite yet.
- Application Inventory - Usable Evidence - Available for Scope/RFP.

Do not implement this panel in this slice. This file defines the contract only.

## 6. Agent Behavior

### Nexus

Nexus uses data readiness to determine artifact tier and next action. Nexus must not claim evidence exists if Admin/Setup says it is not usable. Nexus recommends the minimum data request or Steward handoff needed to move the sourcing event forward.

### Steward

Steward owns the setup/admin readiness explanation. Steward identifies connector, dataset, access, and parsing blockers and routes the admin action.

### Sentinel

Sentinel validates whether available data is usable evidence. Sentinel flags low-confidence, stale, restricted, or uncited data before Source relies on it.

### Atlas

Atlas summarizes data readiness implications for executives. Atlas highlights the value, risk, and decision impact of missing or weak evidence.

## 7. Workflow Impact

Data readiness affects:

- RFP tier: Rich, Outline, or Stub.
- Stage-gate readiness.
- Scorecard confidence.
- Vendor evaluation readiness.
- Pricing normalization readiness.
- Value ledger confidence.
- Workflow validation outcomes.

Examples:

- Cannot generate Rich-tier RFP without ticket history and SLA baseline.
- Cannot cite vendor contract before parsing/validation.
- Cannot normalize pricing without baseline volume assumptions.
- Cannot mark value realized without evidence and measurement owner.

If readiness is missing, low confidence, stale, restricted, or waived, Source should reflect that state in workflow validation and agent responses.

## 8. Admin/Setup Handoff

The intended handoff pattern is:

1. Source user clicks Resolve Data Gap.
2. Nexus explains the missing data and sourcing impact.
3. Steward opens or references the Admin/Setup readiness action.
4. User or admin uploads or connects data.
5. Admin/Setup updates readiness status.
6. Source event readiness updates.

Do not implement this UI in this slice. This file defines the handoff contract only.

## 9. Production Readiness Implication

Source cannot be production-ready until:

- Admin/Setup data readiness model exists.
- Source can consume readiness state.
- Attachments/files can become usable evidence.
- Evidence/citation status is visible.
- Tenant and permissions are enforced.

Until those conditions are met, Source may show deterministic readiness states and seeded examples, but it must not present production-grade evidence claims.

## 10. Acceptance Criteria

This spec is complete when:

- Source/Admin data responsibility split is clear.
- Readiness states are defined.
- AMS, IMS, and Data Platform Managed Services data requirements are mapped.
- Agent behavior is defined.
- Workflow impact is defined.
- Production readiness implications are clear.

## Non-Implementation Boundary

This file does not approve runtime code, UI, API routes, model calls, upload/parsing implementation, new Admin/Setup UI, duplicate Source setup process, `/programs`, `/preview`, `/demo`, `ProgramSurface`, or `src/lib/programs/mock.ts` work.
