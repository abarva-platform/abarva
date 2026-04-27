# Production Readiness Component Map

Status: active reference
Owner: Steward
Canonical manifest: `docs/build/production-readiness.json`
Canonical admin page: `/admin/production-readiness` (legacy `/platform/admin/production-readiness` 308 redirects here, ADMIN8)

## Purpose

This map prevents readiness drift across parallel AbarVa workstreams. Product
areas may keep local implementation trackers, but readiness status must roll
up to the canonical production readiness manifest.

## Canonical Rule

Use `docs/build/production-readiness.json` as the single machine-readable
readiness source. Do not create duplicate readiness JSON files or a separate
component-specific production readiness page.

## Component Map

| Component | Product surface | Owner agent | Current readiness source | Key files | Related docs | Current blockers | Next readiness action |
|---|---|---|---|---|---|---|---|
| Programs | `/programs`, program detail, phase/module surfaces | Nexus / Steward | `production-readiness.json` component `programs` | `src/app/programs/**`, program read models | Program build slices, build-slices manifest | Full production workflow, live persona coverage, persistence and governance gates remain incomplete | Keep program workflow gates and route smoke tied to canonical manifest |
| Program Workshop Mode | Workshop mode inside Programs | Nexus | `production-readiness.json` component `program_workshop_mode` | Program workshop components and read models | Workshop build slices and verification runbooks | Full workshop-to-deliverable production proof remains incomplete | Keep workshop readiness updates on the canonical component |
| Deliverables / Artifacts | Program deliverables and artifact routes | Sentinel / Steward | `production-readiness.json` component `deliverables_artifacts` | Deliverable renderer and artifact promotion/sign-off routes | Deliverable verification runbooks | Artifact versioning, export/import, evidence governance, and production sign-off remain incomplete | Record artifact readiness only through canonical gates |
| Intelligence | `/intelligence` surfaces | Sentinel / Atlas | `production-readiness.json` component `intelligence` | Intelligence routes and pattern/read-model libraries | Intelligence build slices | Production evidence, live retrieval, and persona validation remain incomplete | Keep Intelligence and Knowledge Fabric impacts separate but linked |
| AI Control Tower | `/tower`, `/operations/portfolio` | Atlas / Steward | `production-readiness.json` component `ai_control_tower` | Tower routes and portfolio surfaces | Control Tower build slices | Production telemetry, live route/persona proof, and governance review remain incomplete | Update Control Tower readiness after route smoke and governance evidence |
| Admin / Setup | `/platform/admin`, admin setup surfaces | Steward | `production-readiness.json` component `admin_setup` | Admin components, setup read models, production readiness page | Admin setup docs and build slices | Live auth mutation, production setup flows, and full governance review remain incomplete | Keep setup and readiness-control updates in the canonical manifest |
| Source / Outsourcing | `/source`, `/source/events/[eventId]` | Nexus / Sentinel / Atlas / Steward | `production-readiness.json` component `source` | `src/components/source/AbarVaSourceDashboard.tsx`, `src/components/source/NexusEngagementCanvas.tsx`, `src/components/source/SourceDataReadinessPanel.tsx`, `src/lib/source/nexus-api.ts`, `src/lib/source/context-builder.ts`, `src/lib/source/agent-validation-report.ts`, `src/lib/source/workflow-validation-report.ts`, `src/lib/source/agent-missions.ts`, `src/lib/source/agent-mission-report.ts` | `docs/abarva-source/SOURCE_PRODUCTION_READINESS_TRACKER.md`, `docs/abarva-source/SOURCE_LAYERED_PROGRESS_TRACKER.md`, Source pattern packs, Source implementation reviews | No production upload/evidence pipeline, no model-assisted Source Nexus runtime, no full workflow engine, no production persistence, production-domain visual QA incomplete | Use the unified manifest as the Source readiness spine; local Source trackers are supporting detail only |
| Data / Evidence / Knowledge Fabric | Evidence, knowledge, dataset, and retrieval foundations | Sentinel / Steward | `production-readiness.json` component `data_evidence_knowledge_fabric` | Evidence/data/trust read models | Trust, evidence, and enterprise deployment runbooks | Production evidence ledger, live ingestion, retrieval, and trust enforcement remain incomplete | Promote only after live evidence and governance gates pass |
| Solution Intelligence | Solution recommendation and architecture surfaces | Atlas / Nexus | `production-readiness.json` component `solution_intelligence` | Solution intelligence read models and workshop bridge | Solution workshop verification runbooks | Full production loop from recommendation to artifact is not fully certified | Keep solution readiness tied to validated workshop and architecture flows |
| Agent Runtime | Agent mission, dispatch, policy, and runtime contracts | Nexus / Sentinel / Atlas / Steward | `production-readiness.json` component `agent_runtime` | Agent mission queues, runtime policy gate, dispatch read models | Runtime architecture docs and agent mission model | Live agent orchestration, scheduler/background jobs, persistence, and audit enforcement remain incomplete | Record deterministic read-model progress without claiming live runtime readiness |
| Model Gateway | Model provider and egress policy | Steward | `production-readiness.json` component `model_gateway` | Model gateway policy contracts | Model gateway build slices | Live gateway module and audit path are not implemented | Do not mark ready until live gateway and policy enforcement exist |
| Ingestion / Parsing | Upload, parse, classify, convert-to-evidence | Sentinel / Steward | `production-readiness.json` component `ingestion_parsing` | Upload/parsing routes and future pipeline modules | Data/evidence and Source readiness docs | Production upload/parsing/classification is not certified | Keep Source data readiness separate from real upload/parsing readiness |
| Audit / Governance | Audit events, policy gates, approvals, governance | Steward | `production-readiness.json` component `audit_governance` | Audit and policy read models | Audit, trust, and runtime safety docs | Production persistence and enforcement are not fully wired | Promote only after durable audit and governance evidence exists |
| Validation / QA | Tests, route smoke, persona crawlers, validation gates | Steward | `production-readiness.json` component `validation_qa` | Jest suites, route smoke inventory, validator tests | Verification runbooks and build slices | CI-backed route smoke, persona crawler, and security scans remain incomplete | Add automated validation evidence without overstating production readiness |
| Production / Deployment | Vercel deployment, private deployment, observability | Steward | `production-readiness.json` component `production_deployment` | Production readiness page, deployment-status ingestion, deployment runbooks | PROD3/PROD4/PROD5, CLOUD and enterprise deployment runbooks | Live deploy polling, route smoke, DNS, observability, rollback review, and production security review remain incomplete | Add real provider/status ingestion only after secure server-side configuration is approved |

## Source Supporting Detail

Source / Outsourcing uses the canonical manifest for readiness status. The
following Source-specific documents and files are supporting references:

- `docs/abarva-source/SOURCE_PRODUCTION_READINESS_TRACKER.md`
- `docs/abarva-source/SOURCE_LAYERED_PROGRESS_TRACKER.md`
- `docs/abarva-source/pattern-packs/AMS_MANAGED_SERVICES_SOURCING_PATTERN.md`
- `docs/abarva-source/build-pack/33_PRICING_AND_NEGOTIATION_INTELLIGENCE_STANDARD.md`
- `src/components/source/AbarVaSourceDashboard.tsx`
- `src/components/source/NexusEngagementCanvas.tsx`
- `src/components/source/SourceDataReadinessPanel.tsx`
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
- `src/lib/source/nexus-api.ts`
- `src/lib/source/context-builder.ts`
- `src/lib/source/agent-validation-report.ts`
- `src/lib/source/workflow-validation-report.ts`
- `src/lib/source/multi-agent-briefing.ts`
- `src/lib/source/agent-missions.ts`
- `src/lib/source/agent-mission-report.ts`

Those files can explain how Source is advancing, but the production readiness
status remains the `source` component in `docs/build/production-readiness.json`.

## Future Update Discipline

Every future workstream must report:

- production-readiness.json updated: yes/no
- components changed
- prior status
- new status
- gates changed
- blockers added or removed
- next readiness action

If no readiness changed, the final report must say why the canonical manifest
was not updated.
