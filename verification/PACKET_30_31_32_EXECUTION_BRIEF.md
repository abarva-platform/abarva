# Packet 30/31/32 Execution Brief

Status: ACTIVE
Timestamp: 2026-05-28
Primary worktree: /private/tmp/nexus-packet-30-architectural-consolidation
C1 audit worktree: /private/tmp/nexus-packet-32-c1-state-audit
Source branch: origin/docs/strategic-packets-30-31-32 at 6d64473d1

## Source Documents Read

Read in required order:

1. docs/build/PACKET_31_ARCHITECTURAL_CONSTITUTION_AND_OPERATING_MODEL.md
2. docs/build/delta-pilot/PACKET_30_ARCHITECTURAL_CONSOLIDATION.md
3. docs/build/PACKET_32_MULTI_TENANT_PRODUCTIZATION.md sections 15, 18, and 19

Scope nuance: Packet 32 lists C8 404 remediation as P1, but the founder execution prompt explicitly elevates C8 Phase 1 into the P0 execution order. I will treat that as founder override, while preserving Packet 31 authority.

## Interpreted Packet 31 Invariants

- Layering is mandatory: presentation -> orchestration -> domain -> data. Presentation never touches DB/model APIs; orchestration validates and composes; domain owns business logic; data owns adapters/clients.
- Tenant resolution has one entry point: `resolveTenant()`. Tenant ID is a parameter, never hidden global state.
- Tenant boundaries must be defended in middleware/auth, resolver/service, and database query/RLS layers.
- Runtime data-plane reads must go through one adapter per substrate type, with Azure as canonical for tenant context.
- Model calls must go through model clients and write AI egress audit with tenant context.
- Retrieval must return sources plus a `CoverageReport`; coverage categories map Tier-1 question types to required substrate segments.
- Public-facing changes need release records with `## Audit Evidence`.
- Customer-specific features are either productized behind configuration/feature flags or quarantined under `src/customers/<customer>/`; they do not contaminate core architecture.
- Change authority follows trust classes A-G. Architecture-affecting, cross-tenant, migration, schema, public API, and production-data-risk changes escalate.
- Three-attempt and time-box rules apply. If the same failure persists after three attempts, stop and write a status report.

## Planned Branches / Worktrees

Created:

- Branch: codex/packet-30-architectural-consolidation
  Worktree: /private/tmp/nexus-packet-30-architectural-consolidation
  Use: Packet 30 Phase 0, then phase-by-phase Packet 30/31 execution.

- Branch: codex/packet-32-c1-state-audit
  Worktree: /private/tmp/nexus-packet-32-c1-state-audit
  Use: Packet 32 C1 read-only multi-tenant state audit.

Planned after Packet 30/31 gates:

- codex/packet-31-operating-model
- codex/packet-32-p0-c2-healthcare-overlay
- codex/packet-32-p0-c8-404-remediation
- codex/packet-32-p0-c4-readonly-customer-admin
- codex/packet-32-p0-c5-csv-upload-connector
- codex/packet-32-p0-c6-observability-alerts
- codex/packet-32-p0-c9-phs-compliance
- codex/packet-32-p0-c12-sentinel-feedback
- codex/packet-32-p0-c13-security-baseline

## Exact P0 Scope

Packet 30:

- Phase 0 current-state audit only.
- Phase 1 tenant resolution consolidation.
- Phase 2 stale data-plane path removal and Azure read adapter.
- Phase 3 question-to-segment coverage contract.
- Phase 4 SkyHarbor verifier rebuild.
- Phase 5 partial-evidence prompting policy.
- Phase 6 e2e validation.
- Phase 7 demo readiness lock.

Packet 31 follow-up deliverables:

- CLAUDE.md / AGENTS.md architectural authority updates as specified.
- Repo hygiene files: ADR template, invariants, deployment tiers, customer enhancement decision tree, incident response, tenant provisioning playbook.
- Promotion automation stubs.
- Any release/operating-model artifacts required by the above.

Packet 32 P0, in founder-provided order:

1. C2 healthcare overlay: Codex builds loader, validation, loading/verifier path only. Founder authors packs.
2. C8 Phase 1: 404 remediation.
3. C4 Phase 1: read-only customer admin.
4. C5: CSV upload connector.
5. C6 Phase 1: observability foundation plus tenant-bleed alert.
6. C9: PHS compliance schema.
7. C12: thumbs up/down on Sentinel answers.
8. C13: security baseline, Defender, vulnerability scanning, and documented evidence.

Packet 32 C1:

- Read-only multi-tenant substrate state audit in parallel.
- Output only `verification/MULTI_TENANT_STATE_AUDIT.md`.
- No runtime code, migrations, product docs, config, scripts, or tests.

## Explicit Non-Goals

- No Packet 32 P1+ work without founder confirmation.
- No production data mutation via runtime app.
- No weakening of tenant-isolation guards.
- No new external vendor dependency without release-note flagging and authority review.
- No force-push to main, red-CI merge, hook bypass, or release-record edits after merge.
- No architecture invariant changes without explicit proposed amendment and approval.
- No claiming "deployed" unless PR merge, production deployment, production alias, live smoke, deployment ID, and smoke artifact are all recorded.

## Acceptance Gates

Packet 30:

- Phase 0 audit doc and Mermaid dependency graph exist and are complete.
- Phase 1 tenant resolver tests, retriever tests, STRESS-P0-001 smoke, lint, typecheck, CI, production deploy, and tenant-isolation smoke pass.
- Phase 2 zero Supabase imports in runtime, data-plane tests, ESLint guard, production smoke pass.
- Phase 3 all 25 Tier-1 categories mapped; coverage tests and production source-segment smoke pass.
- Phase 4 verifier unit/integration tests pass; three stable runs show zero `fail-harness`.
- Phase 5 partial-evidence tests pass; unavailable admission rate <10%; three 25-question runs each >=23/25.
- Phase 6 validation reports exist and pass SkyHarbor, Apex, Meridian, cross-tenant, load, and no-tenant checks.
- Phase 7 demo readiness certificate exists and founder review says demo is GO.

Packet 31:

- §5 deliverables created with release records where appropriate.
- Invariants are surfaced in AGENTS/CLAUDE and docs/architecture.
- ADR and operating-model artifacts exist.

Packet 32 P0 closure:

- C1 audit complete.
- Healthcare overlay loader/verifier path ready for founder-authored packs.
- C8 Phase 1 404 remediation complete.
- C4 read-only customer admin shipped.
- C5 CSV upload works end-to-end.
- C6 observability foundation deployed with tenant-bleed alert.
- C9 PHS compliance profile shipped.
- C12 Sentinel feedback wired.
- C13 security baseline evidence documented.

## Deploy / Rollback Plan

- Each phase/runtime PR gets a release record with `## Audit Evidence` and rollback plan before merge.
- Classes A-C may auto-merge on green CI and required smoke evidence.
- Class D opens PR for human review.
- Classes E-G require explicit approval before merge/deploy.
- Production deploy follows merge only; runtime changes require production alias inspection and live smoke.
- Rollback is revert PR, redeploy, and document in `verification/INCIDENT_LOG.md` if production is affected.
- For ask-route changes, prefer staged/rolling deployment per Packet 30, watching 5xx and tenant-bleed alerts.

## Immediate Execution Plan

1. Start Packet 30 Phase 0 audit in the primary worktree.
2. Start Packet 32 C1 audit in the audit worktree in parallel.
3. Do not begin Packet 30 Phase 1 until Phase 0 deliverables are complete and reviewed per the Packet 30 gate, unless founder review is unavailable for 24 hours and Packet 30 R9 autoproceed is invoked with logging.
