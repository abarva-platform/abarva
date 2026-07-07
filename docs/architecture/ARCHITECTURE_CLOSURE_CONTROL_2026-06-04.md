# Architecture Closure Control

Status: execution-control packet

Owner: AbarVa founder/operator

Backlog rows: T029, T030, T031, T032, T033, T034, T035, T041, T043, T186, T187, T189, T194, T195, T199, T200

## Purpose

This packet turns the remaining Architecture backlog into a closure-ready evidence plan. The rows below already have meaningful implementation on main, but they cannot be marked Done until live, external, or production evidence exists. This document defines the exact evidence required to close each row without overstating readiness.

## Closure Rule

Do not mark an Architecture row Done unless all three are true:

- the implementation or operational artifact is merged to main,
- the live or external proof listed in this packet exists,
- and the tracker note includes PR, commit, command output, deployment evidence, or external evidence.

If a row depends on Azure, Clerk, a status provider, an external pen-test vendor, Anthropic provider telemetry, or live data-plane proof, keep it In progress until that evidence is captured.

## Architecture Rows

| Row | Current closure blocker | Existing repo proof path | Done evidence required |
| --- | --- | --- | --- |
| T029 | Azure tenant IaC has not been proven in the target subscription. | `npm run azure:client-tenant-iac:verify` | Target-subscription what-if/deploy output, parameter file used, resource group/subscription id, and rollback/deletion posture. |
| T030 | Tenant-scoped connection resolution still needs live private Postgres and secret projection evidence. | `npm run data-plane:tenant-connection:verify` | Key Vault or secret projection proof, successful client-scoped private Postgres smoke, negative missing-secret fail-closed smoke, and request-local tenant scope evidence. |
| T031 | External pen test is not complete. | `npm run security:pen-test-readiness:verify` | Vendor selected, rules of engagement signed, test completed, final report received, critical/high findings remediated or accepted, and retest evidence captured. |
| T032 | Scanner foundation is merged, but live Presidio/Azure DLP/Purview adapter and live quarantine proof are not captured. | `src/lib/security/preingest-sensitive-scanner.ts` | Live scanner adapter proof, OCR-sensitive sample proof where needed, quarantine table/ledger proof, and end-to-end upload quarantine evidence. |
| T033 | Usage metering exists, but durable caps and scheduled reporting are not evidenced. | `src/lib/admin/customer-admin-read-model.ts` | Durable cap settings, cap-alert delivery proof, weekly report schedule proof, and customer/admin report screenshot or exported packet. |
| T034 | Clerk SSO contract exists, but live enterprise SSO is not proven. | `npm run auth:clerk-sso:verify` and `npm run auth:fakeclient-sso:verify` | Clerk Organization, SAML/OIDC config, domain verification, test roster sign-in, role mapping, tenant isolation, and sign-out proof. |
| T035 | Admin ops surface exists, but live job execution controls are not complete. | `node scripts/admin/verify-admin-ops-surface.mjs` | Production job runner, approval capture, locks/retries/idempotency, immutable audit writes, and successful re-index/migration/backfill dry-run evidence. |
| T041 | Immutable audit-log foundation exists, but live WORM proof is missing. | `npm run azure:immutable-audit-log:verify` | Azure what-if/deploy output, append proof, denied delete/overwrite proof, retention settings, and app-wide audit-writer routing evidence. |
| T043 | Public status foundation exists, but external provider and monitor-backed proof are missing. | `node scripts/ops/verify-status-page-readiness.mjs` | External status provider, monitor-backed uptime feed, subscriber notification setup, and synthetic incident/maintenance-window drill. |
| T186 | Parser fallback orchestrator exists, but real fallback services and ledger persistence are not proven. | `src/lib/ingestion/parser-fallback-runtime.ts` | Marker deployment proof, approved LlamaParse path with third-party consent, persisted processing ledger proof, and end-to-end fallback run. |
| T187 | Anthropic prompt-cache controls exist, but live provider usage proof is missing. | `docs/build/ANTHROPIC_PROMPT_CACHE_2026-06-03.md` | Repeated parsed-document or agent-system call evidence showing cache creation/read tokens in provider usage metadata. |
| T189 | Parse metadata and dashboard foundation exist, but full per-document cost dashboard is not complete. | `docs/build/COST_PER_DOCUMENT_DASHBOARD_2026-06-03.md` | Target data-plane migration proof, durable parse metadata for a real document, document-bound chat cost, cache-hit economics, and admin/customer dashboard or report proof. |
| T194 | Defender gate foundation exists, but live Defender scan-result tags are not proven. | `npm run azure:defender-storage-malware:verify` | Clean and malicious upload samples with Defender scan-result tags, quarantine behavior, worker tag-reader evidence, and audit event proof. |
| T195 | Small-PDF native handoff exists, but live object-storage and Anthropic proof are missing. | `src/app/api/chat/agent/route.ts` | Authenticated Azure/object-storage PDF retrieval, threshold proof, Anthropic native-document call proof, and cost/latency comparison packet. |
| T199 | Raw-mode escape hatch exists, but live object-storage and Anthropic proof are missing. | `src/components/agent/AGENT_DOCK.md` | Explicit operator acknowledgement, stored PDF retrieval, Anthropic native-document call proof, cost warning visibility, and uncommitted review result proof. |
| T200 | Persistent parse-cache contract exists, but production durable reuse proof is missing. | `docs/architecture/azure/PERSISTENT_PARSE_CACHE_CONTRACT.md` | Production Postgres/Azure/evidence-ledger store proof, schema/worker wiring, cross-session reuse proof, and tenant-isolation cache key proof. |

## Closure Sequence

| Wave | Rows | Why this order |
| --- | --- | --- |
| 1. Identity and tenant substrate | T034, T029, T030, T041 | SSO, tenant IaC, tenant connection resolution, and immutable audit log are prerequisites for trustworthy pilot operations. |
| 2. Upload and document processing | T032, T186, T194, T195, T199, T200 | Data loading and document parsing must be safe before broader client data refresh work. |
| 3. Cost, usage, and ops control | T033, T035, T187, T189 | Operators need usage, cost, cache, and job controls after the substrate and processing paths are live. |
| 4. External assurance and communications | T031, T043 | Pen test and status-provider work depend on the production target being real enough to test and communicate. |

## Evidence Folder Convention

Store proof under dated folders in `audit-artifacts/architecture/` or a linked private evidence vault when evidence contains secrets, tenant data, screenshots with identities, or vendor reports.

Recommended names:

- `audit-artifacts/architecture/t034-clerk-sso-YYYY-MM-DD/`
- `audit-artifacts/architecture/t029-client-tenant-iac-YYYY-MM-DD/`
- `audit-artifacts/architecture/t194-defender-malware-YYYY-MM-DD/`
- `audit-artifacts/architecture/t031-pen-test-YYYY-MM-DD/`

Do not commit secrets, private tenant data, raw pen-test reports, live access tokens, or customer-identifying screenshots to the public repository.

## Operator Checklist

1. Pick one closure wave.
2. Run the existing verifier listed in the row.
3. Capture live or external evidence in the approved evidence location.
4. Add a release record only if code, runbooks, scripts, or release-relevant docs change.
5. Update `/Users/anand/Downloads/ABARVA_PILOT_READINESS_PLAN.xlsx` with the exact PR, command, evidence path, and status.
6. Mark Done only when implementation and evidence both exist.

## Current Truth

Architecture is not blocked by lack of planning. It is blocked by live-environment proof, external-provider setup, and human/vendor actions. This packet is the closure map; it does not itself complete the 16 rows.
