# Packet 30 Phase 2C Codemod Inventory

Read-only inventory. No runtime code was modified by this artifact.

## Summary

- Generated at: `2026-05-29T17:48:33.288Z`
- Total files in inventory: `305`
- Files with import-helper matches: `153`
- Import-helper matches: `626`
- Files with broad matches: `305`
- Broad matches: `1456`

## Classification Counts

- `DEFER_MANUAL`: 126
- `MIXED_READ_WRITE`: 82
- `MUTATION_WRITE`: 1
- `READ_ONLY_SELECT`: 92
- `READ_WITH_STORAGE`: 4

## Group Counts

- `admin`: 2
- `api_routes`: 35
- `app_routes`: 12
- `db`: 5
- `intelligence`: 31
- `knowledge`: 5
- `other_lib`: 143
- `programs`: 36
- `source`: 34
- `tower`: 2

## 2C Execution Guidance

- `READ_ONLY_SELECT`: candidate for 2C.1 pure read migration.
- `MIXED_READ_WRITE`: candidate for 2C.2 read/write split; do not codemod writes.
- `READ_WITH_STORAGE`: candidate for 2C.3 storage adapter or explicit exception.
- `MUTATION_WRITE`: leave out of read migration unless a read helper is extracted manually.
- `DEFER_MANUAL`: broad-only or ambiguous match; review before touching.
- `TEST_ONLY`: test/reference files only.

## Inventory

| File | Classification | Group | Import Matches | Broad Matches | Tables | Notes |
|---|---:|---:|---:|---:|---|---|
| src/lib/admin/release-ledger.ts | DEFER_MANUAL | admin | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/admin/setup-data-broker.ts | DEFER_MANUAL | admin | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/app/api/onboarding/[session]/commit/route.ts | DEFER_MANUAL | api_routes | 3 | 3 | - | no static table names detected |
| src/app/api/onboarding/[session]/status/route.ts | DEFER_MANUAL | api_routes | 3 | 3 | - | no static table names detected |
| src/app/api/onboarding/upload/route.ts | DEFER_MANUAL | api_routes | 3 | 3 | - | no static table names detected |
| src/app/(maestro)/admin/onboarding/[session]/confirm/page.tsx | DEFER_MANUAL | app_routes | 3 | 3 | - | no static table names detected |
| src/app/_dev/agent-dock/page.tsx | DEFER_MANUAL | app_routes | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/app/(maestro)/admin/instruments/InstrumentAdminClient.tsx | DEFER_MANUAL | app_routes | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/app/(maestro)/platform/page.tsx | DEFER_MANUAL | app_routes | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence/db/client.ts | DEFER_MANUAL | intelligence | 4 | 4 | - | no static table names detected |
| src/lib/intelligence/pattern-deliverable-query.ts | DEFER_MANUAL | intelligence | 0 | 4 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence/ask/classifier.ts | DEFER_MANUAL | intelligence | 0 | 3 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence/sentinel-pattern-detections.ts | DEFER_MANUAL | intelligence | 0 | 3 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence/canonical/agent-grounding-disclosure.ts | DEFER_MANUAL | intelligence | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence/tenant-metric-fixtures.ts | DEFER_MANUAL | intelligence | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence/ai-program-failure-modes.ts | DEFER_MANUAL | intelligence | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence/ask/retrievers/pattern.ts | DEFER_MANUAL | intelligence | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence/ask/retrievers/vendor.ts | DEFER_MANUAL | intelligence | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence/atlas-synthesis.ts | DEFER_MANUAL | intelligence | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence/canonical/normalizers.ts | DEFER_MANUAL | intelligence | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence/canonical/scoped-corpus-pattern-index.ts | DEFER_MANUAL | intelligence | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence/citation-renderer.ts | DEFER_MANUAL | intelligence | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence/metric-records.ts | DEFER_MANUAL | intelligence | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence/synthesis/violationsRecorder.ts | DEFER_MANUAL | intelligence | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/knowledge/agent-context-broker.ts | DEFER_MANUAL | knowledge | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/knowledge/context-broker/broker.ts | DEFER_MANUAL | knowledge | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/knowledge/enterprise-data-room-persistence.ts | DEFER_MANUAL | knowledge | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/agent/voice-doctrine/sentinel.ts | DEFER_MANUAL | other_lib | 0 | 5 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/solutions/ai-failure-modes-solution-map.ts | DEFER_MANUAL | other_lib | 0 | 5 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/deliverables/evidence-registry.ts | DEFER_MANUAL | other_lib | 0 | 4 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/solutions/healthcare-ai-archetypes.ts | DEFER_MANUAL | other_lib | 0 | 4 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/agents/sentinel-reasoning/intent-classifier.ts | DEFER_MANUAL | other_lib | 0 | 3 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/crawl/persona-switcher.ts | DEFER_MANUAL | other_lib | 0 | 3 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/solutions/analytics-modernization-components.ts | DEFER_MANUAL | other_lib | 0 | 3 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/solutions/solution-archetype-registry.ts | DEFER_MANUAL | other_lib | 0 | 3 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/tenant/aliases.ts | DEFER_MANUAL | other_lib | 0 | 3 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/agent/markdownTokens.tsx | DEFER_MANUAL | other_lib | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/agent/response-shape.ts | DEFER_MANUAL | other_lib | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/architecture/evidence-ledger-mvp.ts | DEFER_MANUAL | other_lib | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/architecture/knowledge-fabric/vector-store.ts | DEFER_MANUAL | other_lib | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/architecture/tool-invocation-audit.ts | DEFER_MANUAL | other_lib | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/architecture/unified-audit-events.ts | DEFER_MANUAL | other_lib | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/corpus/retrieval.ts | DEFER_MANUAL | other_lib | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/deliverables/structured.ts | DEFER_MANUAL | other_lib | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/qa/cross-surface-consistency.ts | DEFER_MANUAL | other_lib | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/reasoning/contradiction-resolution-state.ts | DEFER_MANUAL | other_lib | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/reasoning/failure-mode-detector.ts | DEFER_MANUAL | other_lib | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/solutions/ai-led-pdlc-components.ts | DEFER_MANUAL | other_lib | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/agent/mission-workflow-handoff.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/agent/output-discipline/few-shot-prompt.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/agent/tenant-guardrails.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/agent/tools/program/completeDeliverable.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/agent/tools/program/completeDeliverables.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/agent/tools/program/draftArtifact.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/architecture/evidence-claim-support.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/architecture/evidence-ledger-tenant-stub.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/architecture/knowledge-fabric/object-store.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/architecture/knowledge-fabric/relational-store.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/architecture/mission-context-bridge.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/architecture/model-gateway-live-provider-stub.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/architecture/model-gateway-stub.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/architecture/tenant-model-provider-policy.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/architecture/unified-context-builder.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/artifacts/render-engine.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/auth/module-access.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/context-ingestion/extractors/index.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/context-ingestion/schema-mapper.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/corpus/embedding.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/corpus/industry-scope.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/depth/lint-service.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/depth/rubrics/shared.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/instruments/render.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/integrity/tenant-rescope.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/intelligence-v3/stages-data.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/nexus/assembler.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/nexus/specialists/intake.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/nexus/voiceFilter.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/notifications/dispatch.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/notifications/email.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/parallel-run/invariant-diff.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/public-site/public-patterns.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/reasoning/cross-instance-reasoner.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/reasoning/synthesis-telemetry-stats.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/reasoning/weekly-digest.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/sentinel/canonical-grounding.ts | DEFER_MANUAL | other_lib | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/programs/programs-auth-mode-server.ts | DEFER_MANUAL | programs | 4 | 4 | - | no static table names detected |
| src/lib/programs/approval-person-resolver.ts | DEFER_MANUAL | programs | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/programs/deliverable-evidence-trace.ts | DEFER_MANUAL | programs | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/programs/phase-gate-advancement-flow.ts | DEFER_MANUAL | programs | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/programs/transformers.ts | DEFER_MANUAL | programs | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/programs/workshop-readiness.ts | DEFER_MANUAL | programs | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/programs/decomposition/workflow-decomposition.ts | DEFER_MANUAL | programs | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/programs/enhancement-seed-writer.ts | DEFER_MANUAL | programs | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/programs/expert-kernel/artifact-quality-rubric.ts | DEFER_MANUAL | programs | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/programs/expert-kernel/exports/board-grade/svg-architecture.ts | DEFER_MANUAL | programs | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/programs/expert-kernel/rate-card/demo-rate-card-packs.ts | DEFER_MANUAL | programs | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/programs/program-artifact-inventory.ts | DEFER_MANUAL | programs | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/programs/program-resume-state.ts | DEFER_MANUAL | programs | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/programs/programs-control-tower-signals.ts | DEFER_MANUAL | programs | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/programs/sme-recommendations.ts | DEFER_MANUAL | programs | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/canvas-substrate/queries.ts | DEFER_MANUAL | source | 1 | 1 | - | no static table names detected |
| src/lib/source/bafo-negotiation.ts | DEFER_MANUAL | source | 0 | 8 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/commercial-signals.ts | DEFER_MANUAL | source | 0 | 6 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/agent-validation-runner.ts | DEFER_MANUAL | source | 0 | 5 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/exports/index.ts | DEFER_MANUAL | source | 0 | 5 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/pricing-normalization.ts | DEFER_MANUAL | source | 0 | 4 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/context-builder.ts | DEFER_MANUAL | source | 0 | 3 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/agent-mission-report.ts | DEFER_MANUAL | source | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/agent-missions.ts | DEFER_MANUAL | source | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/commercial-mission-adapter.ts | DEFER_MANUAL | source | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/executive-decision-summary.ts | DEFER_MANUAL | source | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/multi-agent-briefing.ts | DEFER_MANUAL | source | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/nexus-api.ts | DEFER_MANUAL | source | 0 | 2 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/adapters/apex-retail-adapter.ts | DEFER_MANUAL | source | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/agent-validation-fixtures.ts | DEFER_MANUAL | source | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/decision-queue/bundle.ts | DEFER_MANUAL | source | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/exports/payloads/ai-clause-gap-payload.ts | DEFER_MANUAL | source | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/exports/payloads/scorecard-payload.ts | DEFER_MANUAL | source | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/exports/renderers/pricing-template-docx.ts | DEFER_MANUAL | source | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/exports/renderers/pricing-template-pdf.tsx | DEFER_MANUAL | source | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/portfolio-filtering.ts | DEFER_MANUAL | source | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/source-answer-engine.ts | DEFER_MANUAL | source | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/source-commercial-summary.ts | DEFER_MANUAL | source | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/vendor-response-completeness.ts | DEFER_MANUAL | source | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/vendor-selection-readiness.ts | DEFER_MANUAL | source | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/lib/source/workflow-validation-runner.ts | DEFER_MANUAL | source | 0 | 1 | - | broad-only match; usually Array.from or unrelated .from usage |
| src/app/api/v1/source/[eventId]/artifacts/generate/route.ts | MIXED_READ_WRITE | api_routes | 4 | 8 | source_events | - |
| src/app/api/v1/source/[eventId]/artifacts/upload/route.ts | MIXED_READ_WRITE | api_routes | 4 | 8 | source_events | - |
| src/app/api/notifications/dispatch/route.ts | MIXED_READ_WRITE | api_routes | 4 | 6 | platform_notification_deliveries | - |
| src/app/api/programs/[id]/attachments/upload/route.ts | MIXED_READ_WRITE | api_routes | 3 | 6 | - | no static table names detected |
| src/app/api/programs/workspace/[moveId]/upload/route.ts | MIXED_READ_WRITE | api_routes | 3 | 6 | - | no static table names detected |
| src/app/api/v1/agent/attachments/route.ts | MIXED_READ_WRITE | api_routes | 3 | 6 | - | no static table names detected |
| src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/body/route.ts | MIXED_READ_WRITE | api_routes | 3 | 6 | source_event_artifact_states, source_events | - |
| src/app/api/v1/threads/[threadId]/attach/route.ts | MIXED_READ_WRITE | api_routes | 3 | 5 | engagements, intelligence_threads | - |
| src/app/api/tower/upload/route.ts | MIXED_READ_WRITE | api_routes | 3 | 4 | - | no static table names detected |
| src/app/api/v1/programs/[programId]/risks/[riskId]/route.ts | MIXED_READ_WRITE | api_routes | 0 | 1 | program_risks | - |
| src/lib/db/engagement.ts | MIXED_READ_WRITE | db | 12 | 25 | engagements | - |
| src/lib/db/person.ts | MIXED_READ_WRITE | db | 7 | 14 | persons | - |
| src/lib/db/relationship-note.ts | MIXED_READ_WRITE | db | 5 | 9 | relationship_notes | - |
| src/lib/db/turn.ts | MIXED_READ_WRITE | db | 4 | 6 | turns | - |
| src/lib/intelligence/ask/session-memory.ts | MIXED_READ_WRITE | intelligence | 13 | 24 | intelligence_ask_sessions, intelligence_ask_turns, move_instances | - |
| src/lib/intelligence/synthesis/violationsSupabaseBackend.ts | MIXED_READ_WRITE | intelligence | 4 | 6 | agent_quality_violation_events | - |
| src/lib/intelligence/db/signalRepository.ts | MIXED_READ_WRITE | intelligence | 0 | 8 | contradictions, portfolio_signals | - |
| src/lib/intelligence/db/threadRepository.ts | MIXED_READ_WRITE | intelligence | 0 | 7 | intelligence_thread_turns, intelligence_threads | - |
| src/lib/intelligence/db/bookmarkRepository.ts | MIXED_READ_WRITE | intelligence | 0 | 6 | user_bookmarks, user_pinned_signals | delete method present; may be Array.delete or Supabase delete |
| src/lib/intelligence/db/sessionLogRepository.ts | MIXED_READ_WRITE | intelligence | 0 | 6 | intelligence_mode_toggle_events, intelligence_session_log, intelligence_surface_content_registry | - |
| src/lib/intelligence/db/artifactRepository.ts | MIXED_READ_WRITE | intelligence | 0 | 5 | intelligence_artifacts | delete method present; may be Array.delete or Supabase delete |
| src/lib/intelligence/db/turnRepository.ts | MIXED_READ_WRITE | intelligence | 0 | 5 | intelligence_thread_turns, intelligence_threads | - |
| src/lib/decisions/auto-linker.ts | MIXED_READ_WRITE | other_lib | 8 | 16 | decision_thread_links, decision_threads | - |
| src/lib/topics/db.ts | MIXED_READ_WRITE | other_lib | 8 | 16 | engagement_topics, engagement_topics_map | delete method present; may be Array.delete or Supabase delete |
| src/lib/deliverables/generate.ts | MIXED_READ_WRITE | other_lib | 8 | 15 | engagements | - |
| src/lib/deliverables/v2-generator.ts | MIXED_READ_WRITE | other_lib | 7 | 18 | deliverable_types, deliverable_versions, deliverables_v2, engagement_topics, engagement_topics_map, engagements, persons | - |
| src/lib/nexus/gateLifecycle.ts | MIXED_READ_WRITE | other_lib | 6 | 16 | deliverable_types, deliverable_versions, deliverables_v2, engagements, module_state_log, persons | - |
| src/lib/agent/tools/program/commitProgram.ts | MIXED_READ_WRITE | other_lib | 6 | 15 | engagement_participants, engagements, module_state_log, pattern_match_logs, persons, program_approval_requests | delete method present; may be Array.delete or Supabase delete |
| src/lib/evidence/ledger.ts | MIXED_READ_WRITE | other_lib | 6 | 10 | evidence_ledger | - |
| src/lib/security/quarantine-audit-supabase.ts | MIXED_READ_WRITE | other_lib | 5 | 10 | sensitive_upload_audit | - |
| src/lib/data-plane/write-adapters/programsWriteAdapter.ts | MIXED_READ_WRITE | other_lib | 4 | 15 | deliverable_versions, deliverables_v2, engagement_participants, engagements, founder_approval_requests, module_state_log, phase_snapshots, program_modules | - |
| src/lib/data-plane/write-adapters/sourceWriteAdapter.ts | MIXED_READ_WRITE | other_lib | 4 | 12 | agent_attachment, source_event_approvals, source_event_artifact_states, source_event_gate_criterion_states, source_event_participants, source_events | - |
| src/lib/data-plane/write-adapters/atlasRepositoryWriteAdapter.ts | MIXED_READ_WRITE | other_lib | 4 | 9 | atlas_message_traces, atlas_observations, atlas_reasoning_traces, atlas_threads | - |
| src/lib/billing/stripe.ts | MIXED_READ_WRITE | other_lib | 4 | 8 | clients, engagements, invoices | - |
| src/lib/data-plane/write-adapters/adminWriteAdapter.ts | MIXED_READ_WRITE | other_lib | 4 | 8 | engagement_participants, person_client_memberships, persons | - |
| src/lib/data-plane/write-adapters/attachmentsWriteAdapter.ts | MIXED_READ_WRITE | other_lib | 4 | 7 | - | no static table names detected |
| src/lib/data-plane/write-adapters/deliverableWriteAdapter.ts | MIXED_READ_WRITE | other_lib | 4 | 7 | deliverable_types, deliverable_versions, deliverables_v2 | - |
| src/lib/data-plane/write-adapters/sourcingWorkItemsWriteAdapter.ts | MIXED_READ_WRITE | other_lib | 4 | 6 | sourcing_work_items | - |
| src/lib/data-plane/write-adapters/uploadsWriteAdapter.ts | MIXED_READ_WRITE | other_lib | 4 | 6 | - | no static table names detected |
| src/lib/data-plane/write-adapters/webhookWriteAdapter.ts | MIXED_READ_WRITE | other_lib | 4 | 6 | engagements, invoices | - |
| src/lib/notifications/store.ts | MIXED_READ_WRITE | other_lib | 4 | 6 | platform_notification_events | - |
| src/lib/data-plane/write-adapters/engageTurnWriteAdapter.ts | MIXED_READ_WRITE | other_lib | 4 | 5 | - | no static table names detected |
| src/lib/data-plane/write-adapters/expertReviewsWriteAdapter.ts | MIXED_READ_WRITE | other_lib | 4 | 5 | expert_reviews | - |
| src/lib/data-plane/write-adapters/sourceArtifactsWriteAdapter.ts | MIXED_READ_WRITE | other_lib | 4 | 5 | source_artifacts | - |
| src/lib/data-plane/write-adapters/supabaseWriteAdapter.ts | MIXED_READ_WRITE | other_lib | 4 | 5 | - | no static table names detected |
| src/lib/data-plane/write-adapters/threadWriteAdapter.ts | MIXED_READ_WRITE | other_lib | 4 | 5 | intelligence_threads | - |
| src/lib/deliverables/live-sync.ts | MIXED_READ_WRITE | other_lib | 3 | 7 | deliverable_versions, deliverables_v2 | - |
| src/lib/agent/maestro-extractor.ts | MIXED_READ_WRITE | other_lib | 3 | 6 | persons | - |
| src/lib/agent/tools/program/assignSponsor.ts | MIXED_READ_WRITE | other_lib | 3 | 6 | engagement_participants | - |
| src/lib/rls/rls-audit.ts | MIXED_READ_WRITE | other_lib | 3 | 6 | admin_audit_log, clients | - |
| src/lib/agent/tools/program/completeProgram.ts | MIXED_READ_WRITE | other_lib | 3 | 5 | engagements, module_state_log | - |
| src/lib/agent/tools/program/completeModule.ts | MIXED_READ_WRITE | other_lib | 3 | 4 | program_modules | - |
| src/lib/agent/tools/program/registerPlaceholderPerson.ts | MIXED_READ_WRITE | other_lib | 3 | 4 | persons | - |
| src/lib/agent/tools/source/commitSourceEvent.ts | MIXED_READ_WRITE | other_lib | 3 | 4 | source_event_participants | - |
| src/lib/agent/trace.ts | MIXED_READ_WRITE | other_lib | 3 | 4 | turn_traces | - |
| src/lib/artifacts/repository.ts | MIXED_READ_WRITE | other_lib | 3 | 4 | generated_artifacts | - |
| src/lib/audit/log.ts | MIXED_READ_WRITE | other_lib | 3 | 4 | audit_log | - |
| src/lib/integrations/ai-egress/supabase-audit.ts | MIXED_READ_WRITE | other_lib | 3 | 4 | ai_egress_audit | - |
| src/lib/onboarding/apex-p18-pack-ingestion.ts | MIXED_READ_WRITE | other_lib | 0 | 9 | clients, enterprise_context_chunks, onboarding_upload_sessions | - |
| src/lib/data/ingest.ts | MIXED_READ_WRITE | other_lib | 0 | 2 | - | no static table names detected |
| src/lib/workshops/render.ts | MIXED_READ_WRITE | other_lib | 0 | 2 | - | no static table names detected |
| src/lib/programs/mutations.ts | MIXED_READ_WRITE | programs | 16 | 38 | clients, deliverable_types, deliverable_versions, deliverables_v2, engagements, module_state_log, pattern_match_logs, program_milestones, program_modules, program_risks, program_work_items | - |
| src/lib/programs/governance.ts | MIXED_READ_WRITE | programs | 8 | 21 | deliverable_versions, deliverables_v2, engagement_participants, founder_approval_requests, maestro_oversight_flags, program_approval_requests, program_evidence_items, program_milestones, program_modules | - |
| src/lib/programs/nexus.ts | MIXED_READ_WRITE | programs | 8 | 17 | deliverables_v2, engagement_topics, maestro_oversight_flags, pattern_match_logs, program_modules, program_threads | - |
| src/lib/programs/origination-submit.ts | MIXED_READ_WRITE | programs | 7 | 16 | engagement_participants, engagements, persons, program_approval_requests, turns | delete method present; may be Array.delete or Supabase delete |
| src/lib/programs/approval.ts | MIXED_READ_WRITE | programs | 7 | 14 | engagements, program_approval_requests | - |
| src/lib/programs/execute.ts | MIXED_READ_WRITE | programs | 7 | 13 | deliverables_v2, maestro_oversight_flags, program_work_items | - |
| src/lib/programs/attachments/index.ts | MIXED_READ_WRITE | programs | 7 | 11 | program_attachments | - |
| src/lib/programs/origination-drafts.ts | MIXED_READ_WRITE | programs | 5 | 12 | program_origination_drafts | - |
| src/lib/programs/classifier.ts | MIXED_READ_WRITE | programs | 4 | 6 | engagement_topics, pattern_match_logs | - |
| src/lib/programs/strategic-moves-preferences.ts | MIXED_READ_WRITE | programs | 3 | 6 | tower_user_preferences | - |
| src/lib/programs/audit-log.ts | MIXED_READ_WRITE | programs | 3 | 4 | program_audit_log | - |
| src/lib/programs/doc-parser.ts | MIXED_READ_WRITE | programs | 3 | 4 | enterprise_context_chunks | - |
| src/lib/programs/evidence-ingestion.ts | MIXED_READ_WRITE | programs | 3 | 4 | program_evidence_items | - |
| src/lib/programs/exports/audit.ts | MIXED_READ_WRITE | programs | 3 | 4 | program_export_log | - |
| src/lib/source/value-chain.ts | MIXED_READ_WRITE | source | 11 | 20 | source_events, source_value_chain, source_value_states | - |
| src/lib/source/artifact-registry/index.ts | MIXED_READ_WRITE | source | 8 | 14 | source_artifacts | - |
| src/lib/source/queries.ts | MIXED_READ_WRITE | source | 5 | 10 | source-artifacts, source_event_artifact_states, source_event_evidence_states, source_event_gate_criterion_states, source_events | - |
| src/lib/source/pricing-submissions/dao.ts | MIXED_READ_WRITE | source | 5 | 8 | source_event_pricing_submissions | delete method present; may be Array.delete or Supabase delete |
| src/lib/source/artifact-registry/text-parser.ts | MIXED_READ_WRITE | source | 3 | 9 | source_artifact_chunks, source_artifact_facts, source_meeting_outcomes, source_pricing_components, source_requirements, source_vendor_commitments | - |
| src/lib/tower/ingest-portfolio.ts | MIXED_READ_WRITE | tower | 3 | 4 | use_cases | - |
| src/lib/tower/outcome-context-writeback/persist.ts | MIXED_READ_WRITE | tower | 3 | 4 | - | no static table names detected |
| src/lib/supabase-server.ts | MUTATION_WRITE | other_lib | 1 | 1 | - | no static table names detected; delete method present; may be Array.delete or Supabase delete |
| src/app/api/v1/programs/[programId]/generate/route.ts | READ_ONLY_SELECT | api_routes | 6 | 11 | deliverables_v2, engagement_topics, engagements, pattern_match_logs, persons | - |
| src/app/api/admin/users/provision/route.ts | READ_ONLY_SELECT | api_routes | 4 | 6 | engagement_participants, engagements | - |
| src/app/api/knowledge/chunk/route.ts | READ_ONLY_SELECT | api_routes | 3 | 6 | knowledge_chunks, knowledge_sources | - |
| src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/route.ts | READ_ONLY_SELECT | api_routes | 3 | 5 | deliverable_versions, deliverables_v2 | - |
| src/app/api/programs/phase-gate/route.ts | READ_ONLY_SELECT | api_routes | 3 | 5 | engagements | - |
| src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/status/route.ts | READ_ONLY_SELECT | api_routes | 3 | 5 | source_event_artifact_states, source_events | - |
| src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/route.ts | READ_ONLY_SELECT | api_routes | 3 | 5 | source_event_gate_criterion_states, source_events | - |
| src/app/api/admin/quarantine/[id]/hard-delete/route.ts | READ_ONLY_SELECT | api_routes | 3 | 4 | sensitive_upload_audit | - |
| src/app/api/admin/quarantine/[id]/release/route.ts | READ_ONLY_SELECT | api_routes | 3 | 4 | sensitive_upload_audit | - |
| src/app/api/admin/seed-clerk-metadata/route.ts | READ_ONLY_SELECT | api_routes | 3 | 4 | persons | - |
| src/app/api/engage/[engagementId]/turn/route.ts | READ_ONLY_SELECT | api_routes | 3 | 4 | engagements | - |
| src/app/api/health/route.ts | READ_ONLY_SELECT | api_routes | 3 | 4 | engagements | - |
| src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts | READ_ONLY_SELECT | api_routes | 3 | 4 | source_event_artifact_states | - |
| src/app/api/v1/source/[eventId]/stage/route.ts | READ_ONLY_SELECT | api_routes | 3 | 4 | source_events | - |
| src/app/api/v1/source/events/[eventId]/approve/route.ts | READ_ONLY_SELECT | api_routes | 3 | 4 | source_events | - |
| src/app/api/admin/parallel-run-invariants/route.ts | READ_ONLY_SELECT | api_routes | 0 | 2 | - | no static table names detected |
| src/app/api/v1/intelligence/brief/render-pdf/route.ts | READ_ONLY_SELECT | api_routes | 0 | 1 | - | no static table names detected |
| src/app/api/v1/programs/[programId]/advance/route.ts | READ_ONLY_SELECT | api_routes | 0 | 1 | founder_approval_requests | - |
| src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-pdf/route.ts | READ_ONLY_SELECT | api_routes | 0 | 1 | - | no static table names detected |
| src/app/api/v1/source/[eventId]/cxo-report/route.ts | READ_ONLY_SELECT | api_routes | 0 | 1 | - | no static table names detected |
| src/app/api/v1/source/[eventId]/deal-pack/route.ts | READ_ONLY_SELECT | api_routes | 0 | 1 | - | no static table names detected |
| src/app/(maestro)/engagements/[engagementId]/page.tsx | READ_ONLY_SELECT | app_routes | 3 | 7 | contradictions, deliverables_v2, engagements | - |
| src/app/(maestro)/engagements/[engagementId]/deliverables/[deliverableId]/page.tsx | READ_ONLY_SELECT | app_routes | 3 | 6 | deliverable_types, deliverable_versions, deliverables_v2 | - |
| src/app/(maestro)/engagements/[engagementId]/charter/page.tsx | READ_ONLY_SELECT | app_routes | 3 | 5 | deliverable_versions, deliverables_v2 | - |
| src/app/(maestro)/engagements/[engagementId]/deliverables/page.tsx | READ_ONLY_SELECT | app_routes | 3 | 5 | deliverable_versions, deliverables_v2 | - |
| src/app/(maestro)/engagements/[engagementId]/turns/page.tsx | READ_ONLY_SELECT | app_routes | 3 | 4 | turns | - |
| src/app/(maestro)/evidence-ledger/page.tsx | READ_ONLY_SELECT | app_routes | 3 | 4 | evidence_ledger | - |
| src/app/sponsor/page.tsx | READ_ONLY_SELECT | app_routes | 3 | 4 | engagements | - |
| src/app/programs/expert-kernel/expert-review/export/route.ts | READ_ONLY_SELECT | app_routes | 0 | 1 | - | no static table names detected |
| src/lib/db/team.ts | READ_ONLY_SELECT | db | 5 | 11 | engagements, team_memberships | - |
| src/lib/intelligence/loadKpiDetail.ts | READ_ONLY_SELECT | intelligence | 4 | 12 | benchmark_cohorts, evidence, kpis, pattern_packs, telemetry_sources | - |
| src/lib/intelligence/library.ts | READ_ONLY_SELECT | intelligence | 3 | 8 | clients, engagement_topics, knowledge_sources | - |
| src/lib/intelligence/canonical/runtime-pattern-index.ts | READ_ONLY_SELECT | intelligence | 3 | 4 | - | no static table names detected |
| src/lib/intelligence/retrieval/structuredRetriever.ts | READ_ONLY_SELECT | intelligence | 0 | 5 | clients, knowledge_sources, spend_breakdown, tech_projects, tech_stack_items | - |
| src/lib/intelligence/db/foundationRepository.ts | READ_ONLY_SELECT | intelligence | 0 | 3 | clients, persons | - |
| src/lib/intelligence/retrieval/graphRetriever.ts | READ_ONLY_SELECT | intelligence | 0 | 3 | applications, contradictions, use_cases | - |
| src/lib/intelligence/db/emergentRepository.ts | READ_ONLY_SELECT | intelligence | 0 | 2 | emergent_patterns | - |
| src/lib/intelligence/persistence.ts | READ_ONLY_SELECT | intelligence | 0 | 1 | enterprise_context_chunks | - |
| src/lib/knowledge/tenant-data/supabase-adapter.ts | READ_ONLY_SELECT | knowledge | 4 | 9 | data_inventory_records, enterprise_context_chunks | - |
| src/lib/knowledge/tenant-data/graph-traversal.ts | READ_ONLY_SELECT | knowledge | 4 | 8 | - | no static table names detected |
| src/lib/data-plane/read-adapters/atlasRepositoryReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 18 | applications, atlas_message_traces, atlas_observations, atlas_threads, clients, cohort_benchmarks, cohort_peers, engagements, portfolio_aggregates, signal_evidence_chains, signal_firings, use_cases | - |
| src/lib/executive-profiles/loadExecutiveProfile.ts | READ_ONLY_SELECT | other_lib | 4 | 13 | executive_career_history, executive_demo_persona_overrides, executive_interaction_log, executive_profiles, executive_public_statements, executive_relationships | - |
| src/lib/data-plane/read-adapters/towerAggregateReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 12 | clients, contradictions, use_case_cost_metrics, use_case_risk, use_case_usage_metrics, use_case_value_metrics, use_cases | - |
| src/lib/data-plane/read-adapters/intelligenceCorpusReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 10 | clients, contradictions, genome_patterns, intelligence_graph_edges, knowledge_sources, use_cases | - |
| src/lib/atlas/tower-grounding.ts | READ_ONLY_SELECT | other_lib | 4 | 9 | ai_initiative_decisions, ai_initiative_kpis, ai_initiative_scenarios, ai_initiative_stakeholder_notes, clients | - |
| src/lib/data-plane/read-adapters/enterpriseSummaryReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 9 | staff_augmentation, tech_projects, tech_stack_items, volumetrics_snapshots | - |
| src/lib/data-plane/read-adapters/sourceEventsReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 9 | source_events | - |
| src/lib/data-plane/read-adapters/towerPageReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 9 | ai_initiatives, engagements, source_events | - |
| src/lib/data-plane/read-adapters/towerSubstrateReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 9 | ai_initiatives, clients | - |
| src/lib/data-plane/read-adapters/intelligenceStagesReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 8 | ai_initiative_decisions, ai_initiative_kpis, ai_initiative_vendors | - |
| src/lib/data-plane/read-adapters/sourceCanvasSubstrateReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 8 | source_event_artifact_states, source_event_evidence_states, source_event_gate_criterion_states | - |
| src/lib/data-plane/read-adapters/supabaseReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 8 | clients, engagements | - |
| src/lib/graph/cross-client.ts | READ_ONLY_SELECT | other_lib | 4 | 8 | client_partnerships, tech_stack_items | - |
| src/lib/auth/maestro.ts | READ_ONLY_SELECT | other_lib | 4 | 7 | persons | - |
| src/lib/auth/program-access-policy.ts | READ_ONLY_SELECT | other_lib | 4 | 7 | engagement_participants, person_client_memberships | - |
| src/lib/auth/source-access-policy.ts | READ_ONLY_SELECT | other_lib | 4 | 7 | person_client_memberships, source_event_participants | - |
| src/lib/data-plane/read-adapters/homeAttentionReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 7 | contradictions, engagements, turns | - |
| src/lib/data-plane/read-adapters/sourcingWorkItemsReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 7 | sourcing_work_items | - |
| src/lib/data-plane/read-adapters/vipProfileReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 7 | vip_profiles | - |
| src/lib/agent/retrieval.ts | READ_ONLY_SELECT | other_lib | 4 | 6 | clients, enterprise_context_chunks | - |
| src/lib/data-plane/read-adapters/intelligenceVendorsReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 6 | ai_initiative_vendors | - |
| src/lib/data-plane/read-adapters/programsReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 6 | engagements | - |
| src/lib/data-plane/read-adapters/strategicMovesPreferencesReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 6 | tower_user_preferences | - |
| src/lib/enterprise-context/intelligence-read-model.ts | READ_ONLY_SELECT | other_lib | 4 | 6 | - | no static table names detected |
| src/lib/data-plane/read-adapters/expertReviewsReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 5 | expert_reviews | - |
| src/lib/data-plane/read-adapters/outcomeLedgerReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 5 | outcome_ledger | - |
| src/lib/data-plane/read-adapters/turnTraceReadAdapter.ts | READ_ONLY_SELECT | other_lib | 4 | 5 | turn_traces | - |
| src/lib/engagements/list-summary.ts | READ_ONLY_SELECT | other_lib | 3 | 14 | clients, contradictions, deliverables_v2, engagement_topics, engagement_topics_map, engagements, turns | - |
| src/lib/nexus/sessionContext.ts | READ_ONLY_SELECT | other_lib | 3 | 7 | clients, engagements, persons, vip_profiles | - |
| src/lib/agent/prompts/_shared/user-context.ts | READ_ONLY_SELECT | other_lib | 3 | 6 | vip_profiles | - |
| src/lib/auth/current-user.ts | READ_ONLY_SELECT | other_lib | 3 | 6 | clients, person_client_memberships, persons | - |
| src/lib/data-plane/read-adapters/sourceDecisionQueueReadAdapter.ts | READ_ONLY_SELECT | other_lib | 3 | 6 | data_inventory_records, data_inventory_segments | - |
| src/lib/agent/prompts/_shared/maestro-context.ts | READ_ONLY_SELECT | other_lib | 3 | 5 | persons, relationship_notes | - |
| src/lib/agent/prompts/_shared/topic-intelligence.ts | READ_ONLY_SELECT | other_lib | 3 | 5 | engagement_topics, engagement_topics_map | - |
| src/lib/nexus/specialists/value.ts | READ_ONLY_SELECT | other_lib | 3 | 5 | spend_breakdown, tech_projects | - |
| src/lib/agent/tools/program/lookupPerson.ts | READ_ONLY_SELECT | other_lib | 3 | 4 | persons | - |
| src/lib/agent/userContext.ts | READ_ONLY_SELECT | other_lib | 3 | 4 | engagements | - |
| src/lib/enterprise-context/retrieval.ts | READ_ONLY_SELECT | other_lib | 3 | 4 | enterprise_context_chunks | - |
| src/lib/evidence/citations.ts | READ_ONLY_SELECT | other_lib | 3 | 4 | evidence_ledger | - |
| src/lib/integrations/ai-egress/tenant-policy.ts | READ_ONLY_SELECT | other_lib | 3 | 4 | clients | - |
| src/lib/azure-connectivity/smoke.ts | READ_ONLY_SELECT | other_lib | 0 | 1 | 1 | - |
| src/lib/azure-search/tenant-context-backfill.ts | READ_ONLY_SELECT | other_lib | 0 | 1 | - | no static table names detected |
| src/lib/corpus/azure-search.ts | READ_ONLY_SELECT | other_lib | 0 | 1 | - | no static table names detected |
| src/lib/programs/queries.ts | READ_ONLY_SELECT | programs | 1 | 7 | founder_approval_requests, maestro_oversight_flags, program_milestones, program_modules, program_risks, program_work_items | - |
| src/lib/programs/expert-kernel/exports/board-grade/pptx-renderer.ts | READ_ONLY_SELECT | programs | 0 | 1 | - | no static table names detected |
| src/lib/programs/expert-kernel/exports/board-grade/svg-raster.ts | READ_ONLY_SELECT | programs | 0 | 1 | - | no static table names detected |
| src/lib/programs/exports/renderers/html.ts | READ_ONLY_SELECT | programs | 0 | 1 | - | no static table names detected |
| src/lib/programs/exports/renderers/pdf.tsx | READ_ONLY_SELECT | programs | 0 | 1 | - | no static table names detected |
| src/lib/programs/exports/renderers/xlsx.ts | READ_ONLY_SELECT | programs | 0 | 1 | - | no static table names detected |
| src/lib/source/exports/dispatch.ts | READ_ONLY_SELECT | source | 0 | 5 | - | no static table names detected |
| src/lib/source/pricing-submissions/parser.ts | READ_ONLY_SELECT | source | 0 | 2 | - | no static table names detected |
| src/lib/source/exports/cxo-report/source-cxo-narrative-pptx.ts | READ_ONLY_SELECT | source | 0 | 1 | - | no static table names detected |
| src/app/api/programs/[id]/attachments/[attachmentId]/route.ts | READ_WITH_STORAGE | api_routes | 3 | 4 | - | no static table names detected |
| src/lib/pilot-dashboard/aggregates.ts | READ_WITH_STORAGE | other_lib | 3 | 4 | turn_traces | - |
| src/lib/security/quarantine-audit-data-plane.ts | READ_WITH_STORAGE | other_lib | 3 | 4 | - | no static table names detected |
| src/lib/programs/attachments/extract-text.ts | READ_WITH_STORAGE | programs | 3 | 5 | - | no static table names detected |
