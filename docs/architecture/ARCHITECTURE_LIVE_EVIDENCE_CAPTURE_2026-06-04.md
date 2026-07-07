# Architecture Live Evidence Capture

Status: execution-control runbook

Owner: AbarVa founder/operator

Backlog rows: T029, T030, T031, T032, T033, T034, T035, T041, T043, T186, T187, T189, T194, T195, T199, T200

Related control: `docs/architecture/ARCHITECTURE_CLOSURE_CONTROL_2026-06-04.md`

## Purpose

The Architecture backlog is no longer blocked by missing design. The remaining work is live proof: Azure, Clerk, Anthropic, document-processing, status-provider, and external-vendor evidence. This runbook translates the closure-control packet into an operator execution path so each row can move from In progress to Done only when evidence exists.

## Non-Negotiable Closure Rule

Do not mark any row Done from this runbook alone. A row closes only when:

- the implementation or operational artifact is merged to main,
- the live or external proof for that row is captured in the approved evidence location,
- sensitive material is stored outside the public repository when required,
- and `/Users/anand/Downloads/ABARVA_PILOT_READINESS_PLAN.xlsx` names the PR, commit, command, evidence path, and remaining risk.

## Evidence Location

Use `audit-artifacts/architecture/<task-id>-<slug>-YYYY-MM-DD/` for non-sensitive proof. Use the private evidence vault for secrets, identities, vendor reports, live screenshots, tenant data, or customer-specific logs. In the public repo, commit only sanitized indexes, command manifests, or redacted summaries.

Every evidence folder should include:

- `README.md` with task id, operator, date, environment, and summary.
- `commands.log` with exact commands run, with secrets redacted.
- `results.json` or `results.md` with pass/fail outcomes.
- `redactions.md` explaining what was withheld and why.
- `rollback.md` when the task changes Azure, Clerk, status-provider, or production settings.

## Wave 1: Identity And Tenant Substrate

Run these first because they decide whether the pilot environment is trustworthy enough for client data reload.

| Row | Evidence command or action | Done evidence |
| --- | --- | --- |
| T034 | `npm run auth:clerk-sso:verify` and `npm run auth:fakeclient-sso:verify` | Clerk Organization, SAML/OIDC config, domain verification, test roster sign-in, group-to-role mapping, tenant isolation, and sign-out proof. |
| T029 | `npm run azure:client-tenant-iac:verify` plus target-subscription what-if | Bicep or Terraform parameters, subscription/resource group id, what-if/deploy output, rollback or deletion posture. |
| T030 | `npm run data-plane:tenant-connection:verify` plus private Postgres smoke | Key Vault or secret projection proof, positive client-scoped query, negative missing-secret fail-closed query, request-local tenant scope proof. |
| T041 | `npm run azure:immutable-audit-log:verify` plus WORM mutation attempt | Azure what-if/deploy output, append proof, denied delete/overwrite proof, retention settings, app-wide audit-writer routing proof. |

Wave 1 exit gate: one client can authenticate, resolve only its own private data-plane connection, write immutable audit evidence, and fail closed when secrets or tenant scope are absent.

## Wave 2: Upload And Document Processing

Run after Wave 1 so every upload and parser proof is tied to the right client boundary.

| Row | Evidence command or action | Done evidence |
| --- | --- | --- |
| T032 | Live Presidio, Azure DLP, or Purview scanner adapter run | Sensitive sample detection, OCR-sensitive case where needed, quarantine ledger proof, blocked parse proof. |
| T194 | `npm run azure:defender-storage-malware:verify` plus clean and malicious samples | Defender scan-result tags for clean and malicious uploads, quarantine behavior, worker tag-reader proof, audit event proof. |
| T186 | Marker and consented LlamaParse fallback drill | Marker deployment proof, third-party consent packet for LlamaParse, persisted processing ledger proof, fallback run result. |
| T195 | Small-PDF native Claude handoff drill | Authenticated object-storage retrieval, threshold proof, Anthropic native-document call proof, cost and latency comparison. |
| T199 | Raw-mode escape-hatch drill | Explicit operator acknowledgement, stored PDF retrieval, cost warning visibility, Anthropic native-document proof, parser-bug review result. |
| T200 | Durable parse-cache reuse drill | Production Postgres/Azure/evidence-ledger store proof, schema or worker wiring, cross-session reuse proof, tenant-isolated cache key proof. |

Wave 2 exit gate: a client document can be uploaded, scanned, quarantined when sensitive or malicious, routed through the correct parser, and reused from durable cache without crossing client scope.

## Wave 3: Cost, Usage, And Ops Control

Run after document processing is proven, because cost and operations evidence should reference real document and agent activity.

| Row | Evidence command or action | Done evidence |
| --- | --- | --- |
| T033 | Usage cap and weekly report drill | Durable cap settings, cap-alert delivery proof, scheduled weekly report proof, customer/admin report screenshot or export. |
| T187 | Repeated Anthropic parsed-document or agent-system prompt run | Provider metadata showing prompt cache creation tokens and cache read tokens for repeated calls. |
| T189 | Per-document economics drill | Durable parse metadata for a real document, document-bound chat cost, cache-hit economics, admin/customer dashboard or report proof. |
| T035 | Admin ops dry-run through the production job runner | Approval capture, locks, retries, idempotency, immutable audit write, re-index/migration/backfill dry-run result. |

Wave 3 exit gate: operators can explain document economics, cap usage, verify prompt-cache behavior, and run governed operational jobs without direct database access.

## Wave 4: External Assurance And Communications

Run once the target environment is stable enough for outside assurance and customer-facing uptime communication.

| Row | Evidence command or action | Done evidence |
| --- | --- | --- |
| T031 | External pen-test vendor engagement | Vendor selected, rules of engagement signed, test completed, final report received, critical/high remediation or risk acceptance, retest evidence. |
| T043 | External status-provider drill | Status provider configured, monitor-backed uptime feed, subscriber notification setup, synthetic incident and maintenance-window drill. |

Wave 4 exit gate: customers can receive service communications, and external security assurance has been completed against the real pilot target.

## Founder Or External Work Required

These rows require Anand, vendor, or external-account action before they can be Done:

- T031 needs vendor selection, signed rules of engagement, final report, and remediation acceptance.
- T034 needs live Clerk Organization and SSO/domain configuration.
- T043 needs a status-provider account and subscriber/monitor configuration.
- T029, T030, T041, T194 need live Azure subscription access and target-environment proof.
- T187, T195, T199 need live Anthropic usage evidence.
- T186 may need customer consent for third-party LlamaParse processing.

## QA Discipline

For each closure attempt:

1. Run the existing repo verifier named by the closure-control packet.
2. Run the live command or external action listed above.
3. Save sanitized command output and a redaction note.
4. Rerun the verifier after any code or runbook change.
5. Run `npm run release:check -- --base origin/main --head HEAD` before opening a release-relevant PR.
6. Update the tracker only with the truthful state: Done for complete evidence, In progress for partial proof or external dependency.

## Current Truth

This runbook does not close the Architecture rows by itself. It makes the next Architecture execution pass deterministic: which command to run, what evidence to capture, where to store it, and which rows still need Anand, Azure, Clerk, Anthropic, status-provider, or external-vendor action.
