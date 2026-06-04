# T031 Pen Test Scope — 2026-06-04

Status: Blocked pending vendor selection and scheduling

Purpose: founder handoff artifact for booking AbarVa's first external
application penetration test without leaving scope or access ambiguous.

## Target Environment

- Repo: `abarva-platform/abarva`
- Primary app host shape: public web application plus authenticated Clerk-backed
  workspace
- Test target preference: preview or explicitly approved pilot-production URL
- Data rule: synthetic or pilot-approved safe data only

## Public Web URLs In Scope

- `GET /`
- `GET /sign-in`
- `GET /auth-redirect`
- `GET /status`

## Auth And Session Endpoints In Scope

- Clerk-hosted sign-in flow backing `/sign-in`
- Clerk session redirect handling via `/auth-redirect`
- Application authorization behavior on authenticated route families:
  - `/home`
  - `/source`
  - `/admin/customer`
  - `/admin/ops`
  - `/platform/admin/*`

## Agent And AI Endpoints In Scope

- `POST /api/chat`
- `POST /api/chat/step`
- `POST /api/chat/agent`
- `POST /api/v1/atlas/chat`
- `POST /api/org-search`
- `POST /api/source/synthesis`
- `POST /api/tower/synthesis`
- `POST /api/programs/synthesis`

## Upload And Document-Handling Endpoints In Scope

- `POST /api/data/upload`
- `POST /api/tower/upload`
- `POST /api/onboarding/upload`
- `GET /api/onboarding/[session]/status`
- `POST /api/programs/[id]/attachments/upload`
- `GET /api/programs/[id]/attachments`
- `GET|DELETE /api/programs/[id]/attachments/[attachmentId]`
- `POST /api/v1/agent/attachments`
- `GET|DELETE /api/v1/agent/attachments/[id]`
- `POST /api/v1/nexus/upload`
- `POST /api/v1/source/[eventId]/artifacts/upload`
- `GET /api/v1/source/[eventId]/artifacts/[artifactCode]/status`
- `POST /api/admin/upload-dataset`
- `POST /api/admin/context-layer/csv-upload`

## High-Risk Route Families To Exercise

- Authenticated operator and founder routes under `/home`, `/source`, and
  `/platform/admin/*`
- Customer-admin read surfaces under `/admin/customer`
- Governance and operational read surfaces under `/admin/ops`
- Document upload, parser fallback, quarantine, and attachment retrieval flows
- AI egress routes that call Anthropic or OpenAI-backed adapters
- Tenant-scoped resource selectors and object-level authorization on Source,
  programs, uploads, and generated artifact flows

## Required Test Accounts

- Viewer
- Operator
- Customer admin
- Internal admin
- Optional SSO-backed test account if a Clerk Organization / enterprise IdP is
  available during the test window

## Explicit Abuse Cases Required

- Session fixation / replay / expired-session handling
- Role downgrade and direct-route access after sign-in
- Tenant isolation and object enumeration across client-scoped objects
- Malicious file upload, MIME confusion, parser fallback abuse, and quarantine
  bypass attempts
- Prompt injection against agent routes and upload-derived context
- Download/export authorization on generated artifacts and attachments

## Azure Review Boundaries

- Azure private data-plane review is evidence-based, not unrestricted owner
  access by default
- Allowed inputs:
  - sanitized ARM / Bicep evidence
  - Azure audit outputs
  - read-only walkthroughs
  - immutable-audit and Defender evidence packets

## Out Of Scope Unless Explicitly Approved

- Cross-client testing against another client's live private data plane
- Load or denial-of-service testing
- Social engineering
- Malware deployment beyond safe test artifacts such as EICAR
- Persistence or destructive writes outside approved test data

## Current Booking Blockers

- Human decision: choose vendor and book window
- Human decision: approve target environment and named test accounts
- Optional but valuable: enable Clerk Organizations / enterprise SSO test path
  for the SSO portion of scope

## Evidence Already Available To The Buyer Or Vendor

- `audit-artifacts/architecture/t034-clerk-sso-2026-06-04/SUMMARY.md`
- `audit-artifacts/architecture/t029-client-tenant-iac-2026-06-04/SUMMARY.md`
- `audit-artifacts/architecture/t030-tenant-connection-resolution-2026-06-04/SUMMARY.md`
- `audit-artifacts/architecture/t041-immutable-audit-log-2026-06-04/SUMMARY.md`
- `audit-artifacts/architecture/t032-preingest-sensitive-scanner-2026-06-04/SUMMARY.md`
- `audit-artifacts/architecture/t194-defender-malware-2026-06-04/SUMMARY.md`
- `audit-artifacts/architecture/t195-small-pdf-native-handoff-2026-06-04/SUMMARY.md`
- `audit-artifacts/architecture/t199-raw-mode-escape-2026-06-04/SUMMARY.md`
