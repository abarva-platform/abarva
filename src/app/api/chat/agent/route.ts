// /api/chat/agent · Universal agent chat endpoint
//
// Shell Layout Spec v2 §6.3 — this route is the only path to an agent response.
// AGENT_DEMO_SYSTEM_BLOCK is injected on EVERY path so the agent always knows:
//   - the AbarVa platform and 7-phase model
//   - all 6 Apex Retail programs and their current phases
//   - active patterns, Tower pressures, AMS source event
//
// Wave SHELL-V2-1 adds: tenantName, agentName, stage, surfaceContext fields.
// The "Atlas doesn't know Apex Retail" bug is architecturally impossible
// because AGENT_DEMO_SYSTEM_BLOCK is now unconditional.

import Anthropic from "@anthropic-ai/sdk";
import { requireTenancy } from "@/app/api/v1/programs/_auth";
import { getEngagementWithPhaseData } from "@/lib/programs/db-phase-queries";
import { PHASE_LABEL_MAP } from "@/lib/programs/programs-fixture";
import { getTenantSystemBlock } from "@/lib/agent/demo-context";
// TC-PERSISTENCE-INTEGRATION — Phase 1 partial implementation.
// Query enterprise_context_chunks for live tenant context; fall back to
// the hardcoded fixture when no persisted data is available.
import { buildTenantContextBlock } from "@/lib/intelligence/persistence";
import { buildTenantTechnologyContextBlock } from "@/lib/knowledge/tenant-technology-context";
import { getActiveClientRow } from "@/lib/active-client";
import {
  detectCrossTenantWriteIntent,
  formatCrossTenantWriteRefusal,
} from "@/lib/agent/tenant-guardrails";
import { getUserContextPromptBlock } from "@/lib/agent/userContext";
import {
  formatUserProgramAccessPolicyForPrompt,
  loadUserProgramAccessPolicy,
  type UserProgramAccessPolicy,
} from "@/lib/auth/program-access-policy";
import {
  formatUserSourceAccessPolicyForPrompt,
  loadUserSourceAccessPolicy,
  type UserSourceAccessPolicy,
} from "@/lib/auth/source-access-policy";
import {
  formatRestrictedOutputPolicyForPrompt,
  sanitizeRestrictedFinancialText,
  summarizeFinancialValueForPrompt,
  type RestrictedOutputPolicyLike,
} from "@/lib/agent/restricted-output-policy";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { retrieveStageContext, retrieveCategoryContext } from "@/lib/intelligence/agent-retrieval";
import { getRelevantTools } from "@/lib/agent/tools/registry";
import { runToolUseLoop } from "@/lib/agent/streaming/toolUseLoop";
import { FOUR_LAYER_REASONING_INSTRUCTIONS } from "@/lib/intelligence/synthesis/instructionLayer";
import { validateSynthesisOutput } from "@/lib/intelligence/synthesis/outputValidator";
import { recordViolations } from "@/lib/intelligence/synthesis/violationsRecorder";
import { ARTIFACT_CHANNEL_INSTRUCTIONS } from "@/lib/agent/artifacts";
import {
  composeSentinelSystemPrompt,
  isSentinelVoiceDoctrineEnabled,
} from '@/lib/agent/voice-doctrine/sentinel';
import {
  composeNexusSystemPrompt,
  isNexusVoiceDoctrineEnabled,
} from '@/lib/agent/voice-doctrine/nexus';
import {
  composeAtlasSystemPrompt,
  isAtlasVoiceDoctrineEnabled,
} from '@/lib/agent/voice-doctrine/atlas';
import {
  composeStewardSystemPrompt,
  isStewardVoiceDoctrineEnabled,
} from '@/lib/agent/voice-doctrine/steward';
// PR-G surface canonicalization — translates semantic surface keys
// ('programs-detail') into URL-shaped keys ('/programs/<id>') so tool
// resolution and the artifact-channel gate stay aligned.
import { canonicalizeFromBody } from "@/lib/agent/surface";
// Surface 2 PR-A — Phase Intelligence Packs. When the user is on a
// program-detail surface, load the pack for the engagement's current
// phase into Nexus's system block. The pack is opinionated coaching
// knowledge — outcome, right questions, anti-patterns, evidence,
// posture per phase arc — that complements the per-pattern knowledge
// already wired in via demo-context.
import {
  getPhasePack,
  formatPhasePackForPrompt,
  getPhasePackV2,
  formatPhasePackV2ForPrompt,
} from "@/lib/programs/phase-packs";
import {
  getStagePack,
  formatStagePackForPrompt,
} from "@/lib/source/stage-packs";
import { buildSourceLifecycleContract } from "@/lib/lifecycle-operating-system";
import type { SourceStageKey } from "@/lib/source/types";
import {
  AMS_OUTSOURCING_2026_EVENT_ID,
  buildAmsVendorStoryline,
} from "@/lib/source/ams-outsourcing-2026-view";
import { buildAmsBafoView } from "@/lib/source/ams-bafo-view";
// PR-R · broker bundle for Nexus on /programs surfaces — exposes
// the tenant's executive bench + program inventory so Nexus can
// reference real people/roles instead of inventing them. Closes
// founder feedback #1 from the production walk.
import {
  buildProgramsContextBundle,
  formatProgramsBrokerBundleForPrompt,
} from "@/lib/programs/programs-broker-adapter";
import {
  buildEnterpriseAgentContextBundle,
  type EnterpriseAgentContextBundle,
  type EnterpriseAgentName,
} from "@/lib/knowledge/agent-context-broker";
// CB-6 · context-broker for the 4-mode bundle attached to chat
// answers. Server-only; the type-only import path keeps the
// client bundle clean (the panel imports the same types via
// `import type` so the broker's `'server-only'` directive
// never traverses the client graph).
import { getContextBroker } from "@/lib/knowledge/context-broker";
import { getPrivateDataPlaneResource } from "@/lib/knowledge/private-data-plane/registry";
import {
  inferModeForSurface,
  isBrokerMode,
  isModeValidForAuth,
} from "@/lib/knowledge/context-broker/mode-inference";
// OV2-WIRE-AND-FM-PROMPT — failure-mode catalog (universal across Programs
// surfaces) and overlap-candidates block (/programs/new only). The catalog
// is sourced from FAILURE_MODES so the prompt and the catalog cannot drift.
import {
  composeFailureModeBlock,
  composeFailureModeDoctrineBlock,
  composeOverlapBlock,
  composeBriefProgressCadenceDirective,
  composeAttachmentContextBlock,
  composeCrossProgramSignalsBlockForSurface,
  isProgramsSurface,
} from "@/lib/programs/failure-mode-prompt";
import {
  detectBriefOverlap,
  type BriefOverlapInput,
} from "@/lib/programs/origination-overlap";
// OV2-4c · attachment ingestion. The chat composer threads recent
// attachment chips through `surfaceContext.attachments`. We resolve the
// referenced records via `getAttachment`, run text extraction on known
// formats (md / txt / docx), and inject a system-prompt block so the
// agent acknowledges uploads by name and reads parsed content as
// evidence-grade context.
import { getAttachment } from "@/lib/programs/attachments";
import type { AttachmentChipRef } from "@/lib/programs/attachments/types";
import {
  extractAttachmentText,
  type AttachmentTextPreview,
} from "@/lib/programs/attachments/extract-text";
import {
  formatProgramEvidenceForPrompt,
  listProgramEvidenceForPrompt,
} from "@/lib/programs/evidence-context";
import {
  clientKeyToBrokerTenantKey,
  clientKeyToInventorySubstrateKey,
} from "@/lib/agent/tools/intelligence/_shared";
// F0.4: import the commit_program tool module so it self-registers
// at startup. Routes that don't surface this tool will simply not
// expose it in `tools`, but the registration must happen for the
// surface filter to find it.
import "@/lib/agent/tools/program/commitProgram";
// Surface 1 PR2.2 — lookup_person tool registers for /programs/new
// and /demo/programs/new so Steward can resolve role titles ("CIO",
// "VP of Applications") into actual person UUIDs from the seeded
// persons table before calling commit_program.
import "@/lib/agent/tools/program/lookupPerson";
// Surface 1 PR2.3 — register_placeholder_person tool unblocks the
// origination flow when the user names a sponsor or lead who isn't
// seeded yet. Creates a placeholder persons row marked for admin
// follow-up so Steward can proceed with commit_program.
import "@/lib/agent/tools/program/registerPlaceholderPerson";
// Surface 2 PR-C — advance_phase tool for /programs/:id surfaces.
// Closes Crawl Obs #18: gate evaluation runs server-side before any
// advance, so the agent cannot pretend an advance happened when
// hard-gate criteria are unmet. Uses governance.evaluateGate (the
// canonical gate-rule evaluator), NOT pack DoD — the pack stays
// static doctrine; runtime evidence-evaluation is deferred to the
// future knowledge-broker layer.
import "@/lib/agent/tools/program/advancePhase";
// Program crawl enablement — lets Nexus persist/sign off generated artifacts
// so hard gates can read deliverables_v2 instead of chat-only prose.
import "@/lib/agent/tools/program/completeDeliverable";
import "@/lib/agent/tools/program/completeDeliverables";
// Surface 2 PR-Q — navigate_to tool. Registered for every entry
// surface so any agent can take the user somewhere when explicitly
// asked. It must NOT redirect new-program intent to /programs/new;
// origination now stays in the current canvas.
import "@/lib/agent/tools/program/navigateTo";
// Surface 2 PR-INT-C — Sentinel tools for /intelligence surface.
// search_patterns + pattern_neighborhood + evidence_lookup register
// for surface '/intelligence'. Vector retrieval is not live yet
// (GRAPH_VECTOR_READINESS.md); the tools fall back to keyword overlap
// against the static pattern manifest until the broker grows vector
// support. Evidence lookups already route through SentinelBrokerAdapter.
import "@/lib/agent/tools/intelligence/searchPatterns";
import "@/lib/agent/tools/intelligence/patternNeighborhood";
import "@/lib/agent/tools/intelligence/evidenceLookup";
// Surface 2 PR-INT-E — validate_synthesis tool wraps runQualityGates()
// + pattern alignment + contradiction-template detection. Emits
// pattern-match (aligned) and contradiction-flag (fired) artifacts.
import "@/lib/agent/tools/intelligence/validateSynthesis";
// Source surface — commit_source_event tool for Sentinel on /source.
// Creates a DB row in source_events and emits a source-event-created
// artifact + navigate-to for post-commit routing.
import "@/lib/agent/tools/source/commitSourceEvent";
// Lifecycle tools — satisfy hard/soft gate criteria so advance_phase
// can proceed through the full P0→P6 crawl.
import "@/lib/agent/tools/program/completeDeliverable";
import "@/lib/agent/tools/program/createMilestones";
import "@/lib/agent/tools/program/completeModule";
import "@/lib/agent/tools/program/assignSponsor";
import "@/lib/agent/tools/program/completeProgram";
// Wave 4A · workspace artifact drafting. Registers draft_artifact for the
// /strategic-moves/:id/phase/:phase surface so Nexus can generate and persist
// deliverable drafts from the workspace chat.
import "@/lib/agent/tools/program/draftArtifact";

// ── Agent voice map ────────────────────────────────────────────────────────────

const AGENT_VOICE: Record<string, string> = {
  Nexus:    "You are Nexus, AbarVa's program orchestrator. You guide program phases, track gates, surface blockers, and drive deliverable quality.",
  Sentinel: "You are Sentinel, AbarVa's intelligence librarian. You validate AI patterns, assess source events, and curate the knowledge library.",
  Atlas:    "You are Atlas, AbarVa's portfolio CIO-of-staff. You monitor pressures, triage signals, and give executive-level portfolio clarity.",
  Steward:  "You are Steward, AbarVa's governance and setup agent. You manage connectors, users, and policy compliance.",
};

const DEFAULT_VOICE = "You are an AbarVa AI advisor. Be direct, specific, and actionable.";
const DEFAULT_AGENT_RESPONSE_MAX_TOKENS = 2048;
const PROGRAM_AGENT_RESPONSE_MAX_TOKENS = 4096;
const PROGRAM_DELIVERABLE_SAVE_RE = /\b(save|persist|sign\s*off|signed\s*off|complete|approve|submit)\b/i;
const PROGRAM_DELIVERABLE_NOUN_RE = /\b(deliverable|artifact|charter|traceability|roadmap|business\s+case|approval\s+(packet|memo)|funding|readiness|change\s+plan|tower\s+handoff|workshop\s+guide|design\s+spec|discovery\s+synthesis)\b/i;
const PROGRAM_MULTI_DELIVERABLE_RE = /\b(separate\s+signed\s+deliverables|type\s+keys|business_case|funding_approval|sponsor_alignment|readiness_and_change_plan|tower_handoff_plan)\b/i;

export function getAgentResponseTokenBudget(surface: string): number {
  if (
    surface === '/programs' ||
    surface === '/programs/new' ||
    surface === '/strategic-moves/new' ||
    surface.startsWith('/programs/')
  ) {
    return PROGRAM_AGENT_RESPONSE_MAX_TOKENS;
  }

  return DEFAULT_AGENT_RESPONSE_MAX_TOKENS;
}

export function selectInitialDeliverableToolChoice(surface: string, message: string, toolNames: ReadonlySet<string>) {
  if (!isProgramsSurface(surface)) return false;
  if (!PROGRAM_DELIVERABLE_SAVE_RE.test(message) || !PROGRAM_DELIVERABLE_NOUN_RE.test(message)) return false;
  if (PROGRAM_MULTI_DELIVERABLE_RE.test(message) && toolNames.has('complete_deliverables')) {
    return { type: 'tool' as const, name: 'complete_deliverables' };
  }
  if (toolNames.has('complete_deliverable')) return { type: 'tool' as const, name: 'complete_deliverable' };
  return false;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: string;
    // Legacy compat
    context?: string;
    // Wave SHELL-V2-1 fields (preferred)
    tenantName?: string;
    agentName?: string;
    surface?: string;
    stage?: string;
    surfaceContext?: Record<string, unknown>;
    programId?: string;
    /** Prior conversation turns for multi-turn context. Capped at 10. */
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    /** Wave 1 inline files — text extracted client-side, passed directly in body. */
    inlineFiles?: Array<{ name: string; content: string | null; sizeBytes?: number; mimeType?: string }>;
  };

  const message = body.message?.trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tenantName          =
    canonicalClientDisplayName({ name: body.tenantName }) ?? "Apex Retail Group";
  const agentName           = body.agentName  ?? null;
  const stage               = body.stage      ?? null;
  // PR-G surface canonicalization. Two surface-key conventions exist
  // in the codebase: semantic ('programs-detail') from
  // AppShell/AtlasPageStateProvider, and URL-shaped ('/programs/<id>')
  // from tools and the artifact-channel gate. canonicalizeFromBody
  // resolves to the URL-shaped form when a programId is available, so
  // tool resolution and the artifact gate stay aligned with their
  // registered patterns.
  const surfaceContext = (body.surfaceContext ?? {}) as Record<string, unknown>;
  const { surface, programId } = canonicalizeFromBody({
    surface: body.surface,
    programId: body.programId,
    surfaceContext,
  });
  const conversationHistory = body.conversationHistory ?? [];

  // ── Build system prompt ─────────────────────────────────────────────────────
  //
  // Three layers:
  //   1. Agent voice (who the LLM is)
  //   2. Page context (tenant, surface, stage, program data if available)
  //   3. AGENT_DEMO_SYSTEM_BLOCK (unconditional — platform + Apex demo context)

  // INT-VOICE: for Sentinel on Intelligence surfaces, replace the
  // one-line voice prompt with the full doctrine spec (sample
  // exchanges + banned phrases + structural requirement +
  // honesty modes). Doctrine is gated behind
  // `SENTINEL_VOICE_DOCTRINE_DRAFT`; default-on in dev/staging,
  // default-off in production until founder signs off.
  let voiceLine = (agentName ? AGENT_VOICE[agentName] : undefined) ?? DEFAULT_VOICE;
  if (
    agentName === 'Sentinel' &&
    typeof surface === 'string' &&
    surface.startsWith('/intelligence') &&
    isSentinelVoiceDoctrineEnabled()
  ) {
    const inferredMode = surface.startsWith('/programs')
      ? 'full'
      : surface.startsWith('/admin')
        ? 'tenant'
        : 'corpus';
    voiceLine = composeSentinelSystemPrompt({
      mode: inferredMode,
      tenantKey: null,
      surface,
      vectorIndexPending: true,
      worldviewPending: true,
      worldviewHitsPresent: false,
    });
  }

  // Phase 4 doctrine wiring — Nexus on Moves/Programs surfaces.
  if (
    agentName === 'Nexus' &&
    typeof surface === 'string' &&
    (surface.startsWith('/moves') || surface.startsWith('/programs') || surface.startsWith('/strategic-moves')) &&
    isNexusVoiceDoctrineEnabled()
  ) {
    voiceLine = composeNexusSystemPrompt({ surface });
  }

  // Phase 4 doctrine wiring — Atlas on Tower surface.
  if (
    agentName === 'Atlas' &&
    typeof surface === 'string' &&
    surface.startsWith('/tower') &&
    isAtlasVoiceDoctrineEnabled()
  ) {
    voiceLine = composeAtlasSystemPrompt({ surface });
  }

  // Phase 4 doctrine wiring — Steward on Setup/Admin surface.
  if (
    agentName === 'Steward' &&
    typeof surface === 'string' &&
    surface.startsWith('/admin') &&
    isStewardVoiceDoctrineEnabled()
  ) {
    voiceLine = composeStewardSystemPrompt({ surface });
  }

  const contextLines: string[] = [
    `Active tenant: ${tenantName} (locked — this is the user's client account).`,
    surface ? `Current surface: ${surface}.` : "",
    stage   ? `Workflow stage: ${stage}.` : "",
  ].filter(Boolean);

  // Phase Intelligence Pack for the active program's current phase.
  // Resolved alongside programData below; rendered into the system
  // prompt for program-detail surfaces. Null when no pack authored yet.
  let phasePackBlock = '';

  // Resolve active client row once here — used for tenant isolation in
  // getEngagementWithPhaseData calls below AND for the demo context block later.
  const activeClient = await getActiveClientRow().catch(() => null);
  const activeClientDisplayName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ?? tenantName;
  const tenancy = await requireTenancy().catch(() => null);
  const programAccessPolicy: UserProgramAccessPolicy | null = tenancy
    ? await loadUserProgramAccessPolicy(tenancy, { programId }).catch(() => null)
    : null;
  const sourceAccessPolicy: UserSourceAccessPolicy | null = tenancy && activeClient && isSourceSurface(surface)
    ? await loadUserSourceAccessPolicy(tenancy, { activeClientKey: activeClient.key }).catch(() => null)
    : null;
  const userAccessPolicy = sourceAccessPolicy ?? programAccessPolicy;
  const userAccessPolicyBlock = sourceAccessPolicy
    ? formatUserSourceAccessPolicyForPrompt(sourceAccessPolicy)
    : programAccessPolicy
      ? formatUserProgramAccessPolicyForPrompt(programAccessPolicy)
      : '';
  const restrictedOutputPolicyBlock = formatRestrictedOutputPolicyForPrompt(userAccessPolicy);

  // If we have a programId, enrich with live DB data
  if (programId) {
    try {
      if (!tenancy) throw new Error('tenancy unavailable');
      const programData = await getEngagementWithPhaseData(programId, activeClient?.id ?? null, tenancy);
      if (programData) {
        const { engagement, evidence, gateApprovals } = programData;
        const currentPhase = engagement.current_phase ?? 0;
        const viewedPhase = readPromptPhaseFromSurfaceContext(surfaceContext, stage);
        const promptPhase = viewedPhase ?? currentPhase;
        const currentPhaseLabel =
          PHASE_LABEL_MAP[currentPhase as keyof typeof PHASE_LABEL_MAP] ?? "Unknown";
        const promptPhaseLabel =
          PHASE_LABEL_MAP[promptPhase as keyof typeof PHASE_LABEL_MAP] ?? "Unknown";
        const latestGate =
          gateApprovals.length > 0
            ? `${gateApprovals[0].action} by ${gateApprovals[0].actor_name}`
            : "pending";

        contextLines.push(
          `Active program: ${engagement.name} (${programId})`,
          `Current phase: P${currentPhase} ${currentPhaseLabel}`,
          viewedPhase !== null && viewedPhase !== currentPhase
            ? `Viewed phase canvas: P${viewedPhase} ${promptPhaseLabel}`
            : "",
          engagement.sponsor
            ? `Executive sponsor: ${engagement.sponsor.name}${engagement.sponsor.role ? ` (${engagement.sponsor.role})` : ""}`
            : "Executive sponsor: not recorded on the engagement row",
          engagement.lead
            ? `Program lead: ${engagement.lead.name}${engagement.lead.role ? ` (${engagement.lead.role})` : ""}`
            : "Program lead: not recorded on the engagement row",
          `Evidence items: ${evidence.length} uploaded`,
          `Gate approvals: ${latestGate}`,
        );

        // Phase pack — V2 when PHASE_PACK_V2=true, else V1 (T-D.2)
        const useV2Pack = process.env.PHASE_PACK_V2 !== 'false';
        if (useV2Pack) {
          const packV2 = getPhasePackV2(promptPhase);
          if (packV2) {
            phasePackBlock = formatPhasePackV2ForPrompt(packV2);
          }
        } else {
          const pack = getPhasePack(promptPhase);
          if (pack) {
            phasePackBlock = formatPhasePackForPrompt(pack);
          }
        }
      }
    } catch {
      // Auth failed or DB error — continue with demo context
    }
  }

  // Strategic-moves surfaces — load phase pack by surface + phase context.
  // /strategic-moves/new always loads P0 (origination).
  // /strategic-moves/:id loads the pack for surfaceContext.phase (P1–P5).
  // The useV2Pack flag applies here too (T-D.2 migration bridge).
  const useV2Pack = process.env.PHASE_PACK_V2 !== 'false';
  if (!phasePackBlock) {
    let smPhase: number | null = null;
    if (surface === '/strategic-moves/new') {
      smPhase = 0;
    } else if (surface.startsWith('/strategic-moves/') && surface.length > '/strategic-moves/'.length) {
      // Workspace surface — phase comes from surfaceContext.phase
      const sp = surfaceContext.phase;
      if (typeof sp === 'number' && sp >= 0 && sp <= 5) {
        smPhase = sp;
      }
    }
    if (smPhase !== null) {
      if (useV2Pack) {
        const packV2 = getPhasePackV2(smPhase);
        if (packV2) phasePackBlock = formatPhasePackV2ForPrompt(packV2);
      } else {
        const p0Pack = getPhasePack(smPhase);
        if (p0Pack) phasePackBlock = formatPhasePackForPrompt(p0Pack);
      }
    }
  }

  // If we have source event context, enrich with live event data.
  // Reuse the surfaceContext extracted above (PR-G surface canonicalization
  // already aliased it as `surfaceContext`).
  const sc = surfaceContext;
  if (sc.eventName) {
    const eventContextLines = [
      `Active source event: ${sc.eventName} (${sc.eventCode ?? ''})`,
      sc.currentStage ? `Event current stage: ${sc.currentStage}` : '',
      sc.blocker ? `Active blocker on this event: ${sc.blocker}` : 'No active blockers recorded on this event.',
      sc.valueAtStakeUsd
        ? summarizeFinancialValueForPrompt(
            'Contract value at stake',
            `$${(Number(sc.valueAtStakeUsd) / 1_000_000).toFixed(1)}M`,
            userAccessPolicy,
          )
        : '',
    ].filter(Boolean);
    contextLines.push(...eventContextLines);
  }

  // Cross-surface: inject linked program state when on Source surface
  const linkedProgramId = (body.surfaceContext?.linkedProgramCode as string) ?? null;
  if (surface === 'source' && linkedProgramId && linkedProgramId !== programId) {
    try {
      if (!tenancy) throw new Error('tenancy unavailable');
      const linkedData = await getEngagementWithPhaseData(linkedProgramId, activeClient?.id ?? null, tenancy);
      if (linkedData) {
        const { engagement: linkedEng, evidence: linkedEv, gateApprovals: linkedGates } = linkedData;
        const linkedPhase = linkedEng.current_phase ?? 0;
        const linkedPhaseLabel = PHASE_LABEL_MAP[linkedPhase as keyof typeof PHASE_LABEL_MAP] ?? 'Unknown';
        const linkedLatestGate = linkedGates.length > 0
          ? `${linkedGates[0].action} by ${linkedGates[0].actor_name}`
          : 'pending';
        contextLines.push(
          `Linked program (cross-surface): ${linkedEng.name} (${linkedProgramId})`,
          `  Current phase: P${linkedPhase} ${linkedPhaseLabel}`,
          `  Evidence items: ${linkedEv.length}`,
          `  Latest gate action: ${linkedLatestGate}`,
          `  Note: this source event outcome directly affects the linked program gate criteria.`,
        );
      }
    } catch {
      // Auth or DB error — proceed without linked program enrichment
    }
  }

  const categoryPlaybook = retrieveCategoryContext(
    [
      (body.surfaceContext?.eventName as string) ?? '',
      (body.surfaceContext?.eventType as string) ?? '',
      message,
    ].join(' '),
    (body.surfaceContext?.eventType as string) ?? undefined,
  );

  const stagePlaybook = retrieveStageContext(stage);
  const sourceStagePackBlock = buildSourceStagePackBlock({
    surface,
    sourceStageKey: typeof sc.currentStageKey === 'string' ? sc.currentStageKey : undefined,
    eventName: typeof sc.eventName === 'string' ? sc.eventName : undefined,
  });
  const sourceOperatingDoctrineBlock = buildSourceOperatingDoctrineBlock({
    surface,
    hasEvent: Boolean(sc.eventName),
  });
  const sourceEventSeedBlock = buildSourceEventSeedPromptBlock(surfaceContext);


  // F0.2 Layer 0 — user context block, composed AFTER role/voice line
  // and BEFORE knowledge/task content so the agent always knows who
  // it's speaking with. Empty string when unauthenticated.
  const userContextBlock = await getUserContextPromptBlock();

  // Surface 1 PR2.5 — resolve the active client so we can scope the
  // demo block to the right tenant. Apex Retail gets the rich
  // multi-program demo context; everyone else gets only the general
  // platform context (avoids Steward/Nexus referencing Apex programs
  // in conversations with Meridian or Arcturus users).
  // activeClient already resolved above for tenant isolation in getEngagementWithPhaseData.
  const sourceClientKey = isSourceSurface(surface)
    ? resolveSourceClientKey(surfaceContext)
    : null;
  const effectiveClientKey = sourceClientKey ?? activeClient?.key ?? null;
  const crossTenantWriteIntent =
    isProgramsSurface(surface) || surface === '/home'
      ? detectCrossTenantWriteIntent({
          message,
          activeClientKey: activeClient?.key ?? null,
          activeClientName: activeClientDisplayName,
        })
      : null;
  if (crossTenantWriteIntent) {
    return new Response(formatCrossTenantWriteRefusal(crossTenantWriteIntent), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
  // TC-PERSISTENCE-INTEGRATION: resolve the inventory-substrate key (apex-retail
  // form) so we can query enterprise_context_chunks. Falls back to the hardcoded
  // fixture when no persisted chunks are available (pre-embed or unknown tenant).
  const tenantInventoryKey = effectiveClientKey
    ? clientKeyToInventorySubstrateKey(effectiveClientKey)
    : null;
  const brokerTenantKey = tenantInventoryKey;
  const programEvidenceLedgerBlock =
    programId && tenancy
      ? await listProgramEvidenceForPrompt(tenancy, programId)
          .then(formatProgramEvidenceForPrompt)
          .catch(() => '')
      : '';
  const requestedMode = readClientSuppliedMode(surfaceContext);
  const bundleMode =
    requestedMode && isModeValidForAuth(requestedMode, brokerTenantKey)
      ? requestedMode
      : inferModeForSurface({ surface, tenantKey: brokerTenantKey });
  const contextBundleForTurn = await assembleContextBundleForTurn({
    query: message,
    mode: bundleMode,
    tenantKey: brokerTenantKey,
  });
  const contextBundleForOutput = sanitizeContextBundleForOutput(contextBundleForTurn, userAccessPolicy);
  const contextBundleArtifact = serializeContextBundleArtifact(contextBundleForOutput);
  const contextBundlePromptBlock = formatContextBundleReceiptForPrompt(contextBundleForOutput, userAccessPolicy);
  const privateDataPlane = getPrivateDataPlaneResource(tenantInventoryKey);
  const privateDataPlaneBlock = privateDataPlane
    ? [
        'PRIVATE DATA PLANE CONTEXT:',
        `- Tenant key: ${privateDataPlane.tenantKey}`,
        `- Data plane id: ${privateDataPlane.dataPlaneId}`,
        `- Private schema: ${privateDataPlane.privateSchema}`,
        `- Private Pinecone index: ${privateDataPlane.privatePineconeIndex ?? 'not available'}`,
        `- Vector status: ${privateDataPlane.vectorStatus}`,
        `- Retrieval posture: ${privateDataPlane.status}. ${privateDataPlane.notes}`,
        '- In your answer, distinguish private client facts from shared AbarVa corpus knowledge in natural language.',
      ].join('\n')
    : '';
  const tenantSystemBlock =
    privateDataPlane
      ? ''
      : ((await buildTenantContextBlock(tenantInventoryKey)) ??
          getTenantSystemBlock(effectiveClientKey));
  const tenantTechnologyContextBlock =
    agentName === 'Sentinel' && typeof surface === 'string' && surface.startsWith('/intelligence')
      ? await buildTenantTechnologyContextBlock(tenantInventoryKey, message, {
          tenantName: activeClientDisplayName,
          limit: 10,
        })
      : '';

  // Surface 1 PR2 / Surface 2 PR2 — artifact-channel instructions are
  // composed for surfaces that have a reactive workspace ready to
  // consume them. The check supports literal surface keys (Surface 1)
  // AND the canonical programs-detail pattern (Surface 2 — any
  // /programs/<id> surface that isn't /programs/new).
  // Artifact channel enabled across all four agent-centric surfaces:
  //   /programs/new (Surface 1, Steward)
  //   /programs (PR-I, Nexus list)
  //   /programs/<id> (PR-F, Nexus detail — matched via regex below)
  //   /home (PR-J, Atlas portfolio)
  //   /intelligence (PR-INT-B, Sentinel knowledge)
  //   /source (Sentinel sourcing)
  //   /tower (PR-T, Atlas control tower)
  // Each was added in its respective PR; the conflict between PR-J
  // and PR-INT-B was resolved here by keeping both surfaces.
  const surfacesWithArtifactChannel = new Set([
    '/programs/new',
    '/demo/programs/new',
    '/strategic-moves/new',
    '/programs',
    '/home',
    '/intelligence',
    '/source',
    '/tower',
  ]);
  const isProgramDetailSurface =
    typeof surface === 'string' &&
    /^\/programs\/[^/]+$/.test(surface) &&
    surface !== '/programs/new';
  // Wave 4A: workspace phase surfaces follow the pattern /strategic-moves/<id>/phase/<n>
  const isWorkspacePhaceSurface =
    typeof surface === 'string' &&
    /^\/strategic-moves\/[^/]+\/phase\/[1-5]$/.test(surface);
  const artifactInstructions =
    surfacesWithArtifactChannel.has(surface) || isProgramDetailSurface || isSourceSurface(surface) || isWorkspacePhaceSurface
      ? ARTIFACT_CHANNEL_INSTRUCTIONS
      : '';

  // PR-R · founder feedback #1 — Nexus on /programs surfaces now
  // receives tenant org-structure context (executive bench + program
  // inventory) from the broker so it can resolve roles ("CIO", "VP
  // of Applications") into actual named people without making them
  // up. Scoped narrowly: only Nexus, only /programs and
  // /programs/<id>, only when the active tenant has a data room
  // (broker returns '' for unknown tenants).
  let nexusTenantContextBlock = '';
  let sourceTenantContextBlock = '';
  // TD-7 · cross-program-signal artifacts. The broker bundle's
  // cross_program_signal items are surfaced as their own system-prompt
  // block so the agent has the canonical signalId / title / programs /
  // severity / recommendation to copy verbatim into a
  // `cross-program-signal` artifact when the user's question makes the
  // signal relevant. Empty string when the bundle has no signals.
  let crossProgramSignalsBlock = '';
  const isNexusProgramsSurface =
    agentName === 'Nexus' &&
    typeof surface === 'string' &&
    (surface === '/programs' || isProgramDetailSurface);
  if (isNexusProgramsSurface && activeClient?.key && !privateDataPlane) {
    try {
      const brokerBundle = buildProgramsContextBundle({
        tenantKey: clientKeyToBrokerTenantKey(activeClient.key),
        programId: programId ?? undefined,
        agentName: 'Nexus',
        surface: 'programs',
      });
      nexusTenantContextBlock = formatProgramsBrokerBundleForPrompt(brokerBundle);
      crossProgramSignalsBlock = composeCrossProgramSignalsBlockForSurface(
        surface,
        brokerBundle.items,
      );
    } catch {
      // Broker failure is non-fatal — Nexus falls through to the
      // existing tenantSystemBlock + page-context lines.
    }
  }
  if (isSourceSurface(surface) && effectiveClientKey) {
    try {
      sourceTenantContextBlock = formatSourceBrokerBundleForPrompt(
        buildEnterpriseAgentContextBundle({
          tenantKey: effectiveClientKey,
          agentName: normalizeEnterpriseAgentName(agentName),
          surface: 'source',
          includeGraphNeighborhood: false,
          allowL4RawContext: false,
          requestedDomains: [
            'people_org',
            'system_landscape',
            'vendor_contracts',
            'sourcing_lifecycle',
            'evidence_provenance',
          ],
        }),
      );
    } catch {
      // Source can still answer from seeded portfolio and stage doctrine.
    }
  }

  // OV2-WIRE-AND-FM-PROMPT Part 1 — failure-mode catalog block. Universal
  // across all Programs surfaces (`/programs*`, `/demo/programs*`, `/tower*`).
  // Empty string elsewhere; the prompt-array filter strips it cleanly.
  const failureModeBlock = composeFailureModeBlock(surface);

  // OV2-FM-DOCTRINE — emission doctrine for `failure-mode-flagged`. Same
  // surface gate as the catalog. Catalog tells the agent WHAT the 10 are;
  // doctrine tells the agent HOW to flag them (when, when-not, severity,
  // field grounding, cadence, relationship to `anti-pattern-flag`). Both
  // must be in the prompt for the agent to fire correctly.
  const failureModeDoctrineBlock = composeFailureModeDoctrineBlock(surface);

  // OV2-WIRE-AND-FM-PROMPT Part 2 — overlap candidates block on
  // `/programs/new` and `/demo/programs/new` only. Reads draft brief
  // signals from `surfaceContext.briefSnapshot` (when the client posts
  // them), maps to BriefOverlapInput, calls detectBriefOverlap, and
  // surfaces the top 3 matches. Empty string when the client hasn't
  // sent brief signals yet — the wiring is forward-compatible.
  let overlapCandidatesBlock = '';
  const isOriginationSurface =
    surface === '/programs/new' || surface === '/demo/programs/new';
  if (isOriginationSurface && activeClient?.key) {
    const overlapInput = buildBriefOverlapInput(
      clientKeyToBrokerTenantKey(activeClient.key),
      surfaceContext,
    );
    if (overlapInput) {
      try {
        const matches = detectBriefOverlap(overlapInput).slice(0, 3);
        overlapCandidatesBlock = composeOverlapBlock(matches);
      } catch {
        // Broker failure is non-fatal — drop the block.
      }
    }
  }

  // Cadence directive that nudges Steward to emit `brief-progress` on
  // every brief-refining turn. Empty string off origination surfaces.
  const briefProgressCadenceDirective =
    composeBriefProgressCadenceDirective(surface);

  // OV2-4c · attachment context block. Resolve the chips on
  // surfaceContext.attachments to AttachmentRecords (so we read the
  // server-trusted storage path, not the client's claim), extract text
  // from known formats, and compose a system-prompt block. Failures are
  // non-fatal: a parse error on one attachment never breaks the turn —
  // we log and skip, and the agent still sees the chip line.
  const attachmentContextBlock = await buildAttachmentContextBlock({
    surface,
    surfaceAttachments: extractSurfaceAttachments(surfaceContext),
    activeProgramId: programId,
  });

  // Wave 1 · inline files block. Client extracted text via FileReader
  // and passed it in the request body. No DB lookup needed.
  const inlineFilesBlock = (() => {
    const files = body.inlineFiles;
    if (!files || files.length === 0) return '';
    const lines: string[] = ['--- INLINE ATTACHMENTS ---'];
    for (const f of files) {
      lines.push(`FILE: ${f.name}${f.sizeBytes != null ? ` (${Math.round(f.sizeBytes / 1024)}KB)` : ''}`);
      if (f.content) {
        // Cap at 8000 chars to protect context budget.
        const preview = f.content.length > 8000 ? f.content.slice(0, 8000) + '\n[...truncated]' : f.content;
        lines.push(preview);
      } else {
        lines.push('[Binary file — content not text-extractable client-side. Acknowledge by name and ask user to describe key points.]');
      }
      lines.push('');
    }
    lines.push('--- END INLINE ATTACHMENTS ---');
    return lines.join('\n');
  })();

  const systemPrompt = [
    voiceLine,
    "",
    userContextBlock,
    userAccessPolicyBlock,
    "",
    restrictedOutputPolicyBlock,
    "",
    // OV2-WIRE-AND-FM-PROMPT Part 1 — universal failure-mode catalog
    // for Programs surfaces. Positioned AFTER user context (Layer 0)
    // and BEFORE four-layer reasoning so the agent always knows what
    // it exists to prevent before it reasons.
    failureModeBlock,
    "",
    // OV2-FM-DOCTRINE — emission doctrine for `failure-mode-flagged`.
    // Injected IMMEDIATELY AFTER the catalog so the agent reads WHAT
    // the 10 are, then HOW to flag them. Same Programs-surface gate.
    failureModeDoctrineBlock,
    "",
    // F0.3 — four-layer reasoning + scope policy + integrity contract.
    // Composed AFTER user context (Layer 0) and BEFORE knowledge / task.
    FOUR_LAYER_REASONING_INSTRUCTIONS,
    "",
    artifactInstructions,
    "",
    // PR-R · tenant org-structure block for Nexus on /programs
    // surfaces. Empty string on every other surface/agent.
    nexusTenantContextBlock,
    "",
    // TD-7 · cross-program-signal block for Nexus on /programs surfaces.
    // Lists the canonical multi-program dependency / conflict signals
    // (sourced from the broker bundle's cross_program_signal items) so
    // the agent can emit a `cross-program-signal` artifact grounded in
    // tenant data when relevant. Empty string elsewhere.
    crossProgramSignalsBlock,
    "",
    sourceTenantContextBlock,
    "",
    tenantTechnologyContextBlock,
    "",
    privateDataPlaneBlock,
    "",
    contextBundlePromptBlock,
    "",
    sourceEventSeedBlock,
    "",
    // OV2-WIRE-AND-FM-PROMPT Part 2 — overlap candidates on
    // /programs/new only. Empty string elsewhere or when no candidates.
    overlapCandidatesBlock,
    "",
    // OV2-4c · attachment context. Lists the most recent N attachments
    // the user has uploaded (chip + parsed snippet for known formats).
    // Positioned AFTER broker / overlap context (so the agent sees
    // tenant truth before user-supplied uploads) and BEFORE phase pack
    // / response guidelines. Empty string off Programs surfaces or when
    // no attachments are in flight.
    programEvidenceLedgerBlock,
    "",
    // OV2-4c · in-turn attachment context. This covers attachments
    // passed on the current chat turn; the evidence ledger above covers
    // persisted uploads from earlier turns/sessions.
    attachmentContextBlock,
    "",
    // Wave 1 · inline files passed directly in the request body.
    // Non-empty on any surface when the user attached a file via the
    // inline paperclip (Tower, Source, Intelligence, etc.).
    inlineFilesBlock,
    "",
    // Phase Intelligence Pack — only rendered on program-detail surfaces
    // where a pack has been authored for the engagement's current phase.
    // Empty string for other surfaces / phases without a pack yet.
    phasePackBlock,
    "",
    sourceOperatingDoctrineBlock,
    "",
    sourceStagePackBlock,
    "",
    "Page context:",
    ...contextLines,
    categoryPlaybook ? `\nService category context:\n${categoryPlaybook}` : "",
    stagePlaybook ? `\nCurrent stage guidance:\n${stagePlaybook}` : "",
    "",
    "Response guidelines:",
    "- Keep responses under 200 words. Be direct, specific, actionable.",
    "- Reference tenant and program names from context.",
    "- Never say you don't have specific information about the tenant — use the demo context below.",
    "- TENANT SAFETY: the active tenant is locked. If the user asks to create, copy, sponsor, or submit a program for any other client, refuse clearly and generically: 'This session can only originate programs for <active tenant>. I cannot create or sponsor a program for another client from here. No record was created.' Do not name or retrieve another client's executives, sponsors, programs, or datasets. Do not ask follow-up details for the other client.",
    "- CONTEXT SOURCE DISCIPLINE: when retrieval context is present, separate private client facts from shared AbarVa corpus/worldview knowledge. Say 'From the private client data...' for tenant-specific facts and 'From AbarVa's shared corpus...' for reusable doctrine. Never blur them.",
    "- ACCESS DISCIPLINE: program visibility, approval rights, and financial visibility are hard control-plane rules from USER ACCESS POLICY. Do not claim the user can see, approve, publish, or create records unless that policy says so.",
    "- CANVAS CONTINUITY: if the user wants to start, scope, or create a new program, do not navigate them to /programs/new. Continue in this same canvas: confirm the intent, collect sponsor, lead, target outcome, and timeline, use lookup_person/register_placeholder_person/commit_program when available, and only mention the program detail link after the brief is submitted.",
    ...(isProgramsSurface(surface)
      ? [
          "- PROGRAM ORIGINATION STYLE: ease into intake. Ask at most ONE question per reply. If several fields are missing, pick the highest-leverage blocker and let the right pane carry the checklist.",
          "- Keep new-program intake replies under 90 words unless the user explicitly asks for a deep draft, options analysis, or executive brief.",
          "- When there are multiple valid paths, show 2-3 short options and include 'type your own'. Do not stack sponsor, lead, scope, baseline, and timeline questions in one turn.",
          "- If the user misspells a role or name, correct lightly and continue. Do not make the typo the center of the reply.",
          "- Do not mention UUIDs, database IDs, person IDs, or internal lookup mechanics in user-facing prose. Say 'I'll confirm Sarah Chen and Rick Stewart in Meridian's people records' rather than 'I'll get their UUIDs'.",
          "- ORIGINATION PEOPLE RULES: a program submission needs at least one sponsor resolved in the active tenant's people records. The signed-in user can be the program owner/lead when appropriate because they are already registered. If the user names a new sponsor or lead who is not yet registered, offer to register that person as a placeholder inside the active tenant only; explain that tenant admin approval will review the placeholder before the program becomes active.",
          "- PHASE ADVANCE APPROVALS: if the user explicitly says a sponsor/admin approves a phase gate and USER ACCESS POLICY says 'Can approve gates: yes', call advance_phase with self_approve_if_authorized=true. If the policy does not grant approval rights, do not self-approve; create/request approval and say which approver must act.",
          "- LIFECYCLE LABEL DISCIPLINE: never call P4 'Build', P5 'Activate', or P6 'Operate'. The locked labels are P4 Execution Roadmap, P5 Approval & Mobilization, and P6 Tower Handoff. If you need to mention external execution, say execution happens outside AbarVa and P4 builds the executable roadmap only.",
          "- DELIVERABLE PERSISTENCE DISCIPLINE: for phase deliverables, do not generate a huge hidden complete_deliverable payload. Save bounded executive-grade content: either a concise markdown artifact under 6,000 characters or the tool's content_outline array with the key sections, decisions, gate proofs, risks, and follow-ups. Then summarize what was saved in chat. Never spend a turn silently composing a full consulting deck inside tool JSON.",
          "- DELIVERABLE FAILURE HONESTY: if complete_deliverable or complete_deliverables fails, do not say 'nothing is lost' unless a durable draft row was actually persisted. Say the draft remains visible in this conversation but is not saved yet, name the platform error if available, and offer one retry after the platform fix.",
          "- P0 DELIVERABLE KEY DISCIPLINE: when saving the accepted P0 seed, use deliverable_type_key='origination_brief'. Do not save a P0 seed, program brief, or origination package as discovery_report; discovery_report is reserved for P1 after current-state evidence is gathered.",
          "- BASELINE FIDELITY DISCIPLINE: when generating or saving deliverables, preserve exact non-financial baseline values, units, sources, grain, methods, owners, and dates from uploaded evidence or signed prior deliverables. Do not replace them with benchmark, peer, demo, or model-inferred numbers. If evidence conflicts, name the conflict and use the latest uploaded/signed evidence as controlling. If the value is missing, write 'missing' and ask for evidence; never invent operational metrics.",
          "- MULTI-ARTIFACT PACKAGE DISCIPLINE: if the user asks to save several deliverables in one phase package, use complete_deliverables once instead of calling complete_deliverable repeatedly. This is especially important for P5 Approval & Mobilization packages: business_case, funding_approval, sponsor_alignment, readiness_and_change_plan, and tower_handoff_plan.",
          "- P6 COMPLETION DISCIPLINE: if the user asks to complete P6 setup, close Tower Handoff, or finish the program after the Tower execution tracking contract is signed, call complete_program. Do not treat 'already at P6' as complete; completion is a lifecycle_state write.",
          "- P4 MILESTONE PERSISTENCE: when drafting an execution roadmap with critical milestones, save the roadmap deliverable and then call create_milestones so P4→P5 gate checks can read structured milestone rows. Do not rely on milestone prose inside the roadmap alone.",
          "- During origination, emit `brief-progress` artifacts as fields become known so the right rail updates while the chat continues.",
          "- BASELINE DISCIPLINE: if the user gives a value claim like '30% faster', 'better quality', 'cost takeout', or 'improve speed', do NOT treat the target outcome as complete until you ask what baseline proves it. Suggest 2-4 concrete metrics only when helpful, such as analytics cycle time, data-lineage completeness, prior-auth automation rate, coding accuracy, Epic/claims match rate, VBC measure latency, DORA lead time, deployment frequency, change-failure rate, or MTTR. Never invent current baseline numbers.",
          "- BASELINE RISK CARD: when a value target is named without baseline evidence, emit a `failure-mode-flagged` artifact for failureModeId 9, failureModeName 'Inability to measure outcomes and impact', phase 0, severity 'soft'. The detected signal should name the missing baseline; the redirect should make baseline capture a P0/P1 exit criterion.",
          "- After commit_program succeeds, state clearly: 'Submitted for approval: <program name>. Status: waiting on tenant-admin approval. Phase 0 unlocks after Setup approval.' Do not mention the raw program id, database id, UUID, or internal URL in chat prose; the page can expose navigation separately.",
          "- If commit_program fails, do not send the user to admin as the first recovery. Name the missing platform field if known, retry only once when the field can be derived, and say 'I still have the brief in this conversation' instead of 'nothing is lost' unless a draft was persisted.",
          "- If the user asks for exact financial details and their access policy says financial visibility is restricted, do not provide the values. Give a qualitative risk/readiness summary and say the exact values require finance/admin entitlement.",
        ]
      : []),
    // M-06 · voice drift filter — banned phrases surfaced in QA audit (2026-04-30).
    // These phrases signal sycophancy or assistant-mode framing that undermines the
    // senior-practitioner voice. Absolute ban, no exceptions.
    "- NEVER use citation annotation tags like [tenant-specific: ...] or [user-context: ...] in chat prose. Those annotations belong in synthesis artifacts only. Speak the citation in natural language instead.",
    "- BANNED PHRASES (never use, no exceptions): \"Good question\", \"Great question\", \"Great instinct\", \"Great point\", \"I'd be happy to\", \"I'd love to\", \"Certainly!\", \"Absolutely!\", \"Of course!\", \"That's a great\", \"leverage\" (as a verb), \"unlock\" (as a metaphor). Start responses with a direct statement, not a compliment.",
    // PR-S · founder feedback #2 — chat was rendering "sql kind of
    // stuff on screen" because the model was wrapping structured
    // observations in code blocks and reciting raw IDs. The chat
    // pane is conversational; the structured workspace is on the
    // RIGHT (artifacts). Keep the chat in flowing prose.
    "- Write in flowing prose. Do NOT use markdown code blocks (``` … ```), SQL/JSON snippets, table outlines, or bracketed identifier dumps in the chat reply. Code blocks make the chat feel like a debugger, not a partner.",
    "- Reference patterns, programs, and people by NAME, not raw ID. Say \"AMS Consolidation\" not \"[PAT-PRG-AMS-CONSOLIDATION-001]\". The right-pane card carries the ID; you carry the conversation.",
    "- Bullet lists are fine sparingly (≤ 3 bullets). When the user asks an open question, lead with one or two sentences before any list.",
    // OV2-4c · attachment doctrine. Always rendered (cheap; the model
    // simply won't act on it when the ATTACHMENTS block is empty).
    "- When the user has just uploaded a file (the ATTACHMENTS block above lists recent uploads), acknowledge it by name in your next reply, briefly summarize what you can read of it, and ask what they'd like done with it. Don't pretend you read content you couldn't parse — for binary formats say something like \"I can see you uploaded {name}, but the content isn't text-parseable yet — can you summarize the key points?\". Reference the attachment by its filename, not by id.",
    // OV2-WIRE-AND-FM-PROMPT Part 2 — brief-progress cadence directive.
    // Empty string off /programs/new so the join-filter strips it.
    briefProgressCadenceDirective,
    // /strategic-moves/new: P0 Originate AH rules + origination style.
    // AH-ORIG-1 through AH-ORIG-6 adapted from the Layer 5 spec.
    ...(surface === '/strategic-moves/new'
      ? [
          "- CONVERSATION ONLY: No tools are available on this surface. Do not attempt to call any tool, register any person, look up any record, or execute any system action. Everything happens through conversation text alone. Never say 'I wasn't able to execute' or 'I don't have a tool confirmation' — there are no tools to confirm.",
          "- P0 ORIGINATE STYLE: guide the user through 7 scaffold steps in order. Ask at most ONE question per reply. Never suggest a name, sponsor, or executive unless it comes from an org chart the user uploaded or an explicit user statement naming the person.",
          "- AH-ORIG-1 (SPONSOR): NEVER propose any sponsor candidate name unless the user has explicitly named the person in this conversation, or they appear in a document the user pasted or uploaded. If no name is provided, ask: 'Can you name the exec who owns this function?' Do not attempt to look up people via any system or tool.",
          "- AH-ORIG-2 (ARCHETYPE): when classifier confidence is low or no_match, NEVER state an archetype as definitive. Always flag uncertainty explicitly: 'This classification is tentative — [reason]. Let me ask a clarifying question before I lock in the archetype.'",
          "- AH-ORIG-3 (VALUE): NEVER state any dollar figure, percentage, or quantified outcome as validated at P0. Always label numeric claims 'UNVALIDATED_HYPOTHESIS' and add a caveat: 'We'll validate this against your baseline in P2.'",
          "- AH-ORIG-4 (BENCHMARKS): NEVER state a benchmark figure as fact without citing a specific AbarVa pattern library entry (e.g., 'per industry pattern PAT-IND-003'). Say 'Per [specific pattern citation], the range for [metric] is approximately [range].'",
          "- AH-ORIG-5 (SPONSOR SECTION): NEVER populate the sponsor section of the brief without citing the source of the name in the same message. Source must be the user's own words or a document they shared.",
          "- AH-ORIG-6 (STEP COMPLETION): NEVER mark a scaffold step complete without user confirmation. Extract content and show it; wait for explicit confirmation ('Yes, that's right') or implicit acceptance before proceeding.",
          "- P0 SCAFFOLD STEPS: there are 7 steps — (1) What's the bet / hypothesis, (2) Archetype classification, (3) Sponsor candidate, (4) Scope / boundary, (5) Evidence family selection, (6) Value hypothesis seed, (7) Foundation readiness (F1–F4 checks). Complete them in order.",
          "- FOUNDATION READINESS: F1 = data readiness, F2 = operating model clarity, F3 = sponsor commitment, F4 = change capacity. Ask the user to confirm each check directly; never infer status from indirect signals.",
        ]
      : []),
    ...(isSourceSurface(surface)
      ? [
          "- SOURCE CONSULTING PARTNER STYLE: short, calm, commercially sharp. No lengthy passages. No intake-form behavior. No 'Acknowledged' opener.",
          "- Default Source reply shape: (1) one-sentence read of what you heard, (2) one sentence on why it matters, (3) exactly ONE next question or action.",
          "- Ask at most ONE question in the chat reply. If several fields are missing, pick the single highest-leverage blocker and let the right pane/artifact cards carry the rest.",
          "- Keep most Source replies under 75 words unless the user explicitly asks for a deep dive, draft, comparison, or executive brief.",
          "- If the user is starting an event, quietly map their words to the five-field intake floor: trigger, decision owner, scope boundary, baseline evidence, stop/approval condition. Do not recite all five unless asked.",
          "- Use known tenant context before asking. If the user names a role and Source tenant context resolves it, use the known person by name and ask only to confirm authority. Never ask 'who is the CIO?' when context names the CIO.",
          "- If SOURCE EVENT PAGE SEED CONTEXT is present, use that page-local event, vendor, BAFO, committee, gate, and risk data before saying information is missing.",
          "- If the user mistypes a title (for example CIKO when CIO is likely), correct lightly and continue; do not make the typo the center of the reply.",
          "- Let the right pane carry progress, gates, evidence, blockers, and next-step prep. In prose, summarize what changed and the one next missing field.",
          "- If emitting sourcing-stage-progress artifacts, emit valid JSON only; never expose artifact syntax in prose.",
          "- When commit_source_event succeeds, do not vaguely say 'pending approval'. Name the event code, say it is visible in the Source operating queue and /source/events approval queue, and state: tenant admin approves the intake record; S0 exit is co-signed by the decision owner and sourcing lead.",
        ]
      : []),
    tenantSystemBlock,
  ]
    .filter((s) => s !== '' && s !== undefined && s !== null)
    .join("\n");

  // ── Stream response (F0.4 tool-use loop) ────────────────────────────────────
  //
  // The route now runs through the multi-turn tool-use loop. Tools
  // available to the agent are filtered by the current surface — on
  // /programs/new the agent gets `commit_program`; other surfaces get
  // an empty tool list and the loop degenerates to a single text turn.

  const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const tools = getRelevantTools(surface);
  const toolNames = new Set(tools.map((tool) => tool.name));
  const selectedInitialToolChoice = selectInitialDeliverableToolChoice(surface, message, toolNames);
  const initialToolChoice = selectedInitialToolChoice || undefined;

  // ── CB-6 · context-bundle assembly ──────────────────────────────────────────
  //
  // Server-only: assemble the ContextBundle that grounds this turn so
  // the chat surface can render the "Context Assembled" panel beside
  // the answer. Mode resolution prefers a client-supplied
  // `surfaceContext.contextBundleMode` (the 4-mode toggle's choice),
  // falling back to the per-surface default in `inferModeForSurface`.
  //
  // The bundle is emitted as the first artifact in the response stream
  // via the artifact-channel grammar, so the client-side parser
  // (AtlasPageStateProvider) can intercept it before any text turns
  // are rendered. Failures are non-fatal: the route always streams
  // an answer, even if bundle assembly errored — the panel falls
  // through to its cold-start state.
  const encoder = new TextEncoder();
  // F0.3 — buffer the streamed output for post-hoc validation. The
  // validator runs AFTER streaming completes; it never blocks the
  // client. Violations are logged to the in-memory ring buffer
  // (synthesis_violations recorder) for telemetry.
  let bufferedOutput = "";
  const readable = new ReadableStream({
    async start(controller) {
      // Tools (commit_program) and the loop both write through this sink.
      // Tool-side writes carry surface-specific sentinels (e.g. the
      // `[[program-created:<id>]]` navigation hint emitted by
      // commit_program); loop-side writes are agent text deltas.
      const writer = {
        write(text: string) {
          const safeText = sanitizeRestrictedFinancialText(text, userAccessPolicy);
          bufferedOutput += safeText;
          controller.enqueue(encoder.encode(safeText));
        },
      };
      try {
        // CB-6 / CB-10 · emit the assembled context bundle as the
        // first artifact in the response. The client-side parser
        // (AtlasPageStateProvider) catches `context-bundle` and stores
        // the bundle on per-conversation state for the panel render.
        // We bypass the `writer` sink (and therefore the F0.3 text
        // validator) — bundles are not synthesis output, they're
        // server-grounded retrieval evidence the panel renders.
        // assembleContextBundleArtifact always returns a string
        // (CB-10) — on broker throw it emits a placeholder generic
        // bundle with the failure as a warning, so the panel can
        // distinguish "no retrieval needed" from "retrieval errored."
        controller.enqueue(encoder.encode(contextBundleArtifact));
        await runToolUseLoop({
          client: anthropicClient,
          model: "claude-sonnet-4-6",
          maxTokens: getAgentResponseTokenBudget(surface),
          system: systemPrompt,
          messages: [
            ...conversationHistory.slice(-10),
            { role: "user", content: message },
          ],
          tools,
          initialToolChoice,
          toolContext: {
            request,
            surface,
            surfaceContext: body.surfaceContext,
            clientKey: activeClient?.key ?? undefined,
            userId: tenancy?.userId,
            accessPolicy: sourceAccessPolicy
              ? {
                  accessLevel: sourceAccessPolicy.accessLevel,
                  programIdsAllowed: null,
                  canCreateSourceEvents: sourceAccessPolicy.canCreateSourceEvents,
                  canApproveSourceStages: sourceAccessPolicy.canApproveSourceStages,
                  canApproveAward: sourceAccessPolicy.canApproveAward,
                  canPublishSourcingArtifacts: sourceAccessPolicy.canPublishSourcingArtifacts,
                  canViewFinancialData: sourceAccessPolicy.canViewFinancialData,
                }
              : programAccessPolicy
                ? {
                    accessLevel: programAccessPolicy.accessLevel,
                    programIdsAllowed: programAccessPolicy.programIdsAllowed,
                    canCreatePrograms: programAccessPolicy.canCreatePrograms,
                    canApproveGates: programAccessPolicy.canApproveGates,
                    canPublishDeliverables: programAccessPolicy.canPublishDeliverables,
                    canViewFinancialData: programAccessPolicy.canViewFinancialData,
                  }
                : undefined,
            writer,
          },
          writer,
        });
      } catch (err) {
        // Surface tool/stream errors to the client honestly rather
        // than silently truncating the response.
        const errMessage = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`\n\n[stream error: ${errMessage}]`),
        );
      } finally {
        controller.close();
        // F0.3 post-hoc validation — non-blocking, telemetry-only.
        // The structural mechanism for action-claim integrity is F0.4
        // tool-use; this catches the four classes the validator covers.
        try {
          const result = validateSynthesisOutput(bufferedOutput, {
            hasRetrieval: Boolean(categoryPlaybook || stagePlaybook),
          });
          if (result.violations.length > 0 || bufferedOutput.length > 0) {
            recordViolations({
              route: '/api/chat/agent',
              surface,
              violations: result.violations,
              responseLength: bufferedOutput.length,
            });
          }
        } catch {
          // Telemetry MUST NOT raise. Swallow.
        }
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}

function isSourceSurface(surface: string): boolean {
  return surface === '/source' || surface.startsWith('/source/');
}

/**
 * CB-6 · pull the optional `contextBundleMode` field off
 * `surfaceContext` (set by the chat composer's 4-mode toggle).
 * Unknown / malformed values are dropped so the route falls back
 * to inferred mode.
 */
function readClientSuppliedMode(
  surfaceContext: Record<string, unknown>,
): import("@/lib/knowledge/context-broker").BrokerMode | null {
  const raw = surfaceContext.contextBundleMode;
  return isBrokerMode(raw) ? raw : null;
}

function readPromptPhaseFromSurfaceContext(
  surfaceContext: Record<string, unknown>,
  stage: string | null,
): number | null {
  const rawPhase = surfaceContext.phase;
  if (typeof rawPhase === 'number' && Number.isInteger(rawPhase) && rawPhase >= 0 && rawPhase <= 6) {
    return rawPhase;
  }
  if (typeof rawPhase === 'string' && /^[0-6]$/.test(rawPhase)) {
    return Number(rawPhase);
  }
  if (stage) {
    const match = /^P([0-6])$/.exec(stage);
    if (match) return Number(match[1]);
  }
  return null;
}

/**
 * CB-6 / CB-10 · assemble the ContextBundle for the current turn and
 * serialize it as a `[[artifact:context-bundle]]` envelope.
 *
 * Always returns a serialized envelope — never `null`. CB-10 changes
 * the failure mode: when the broker throws (Pinecone outage, missing
 * adapter, malformed input), we emit a `mode='generic'` placeholder
 * bundle with a warning that explains the failure. The chat turn
 * continues to stream the LLM response; the panel renders the empty
 * bundle plus the warning so the user can distinguish "no retrieval
 * was needed" from "retrieval errored." Prior to CB-10 the route
 * returned `null` and the panel fell through silently to cold-start.
 */
async function assembleContextBundleForTurn(input: {
  query: string;
  mode: import("@/lib/knowledge/context-broker").BrokerMode;
  tenantKey: string | null;
}): Promise<import("@/lib/knowledge/context-broker").ContextBundle> {
  try {
    return await getContextBroker().assemble({
      query: input.query,
      mode: input.mode,
      tenantKey: input.tenantKey ?? undefined,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn('[chat/agent] context_bundle_assembly_failed', {
      mode: input.mode,
      tenantKey: input.tenantKey,
      message: reason,
    });
    // CB-10 · emit a placeholder generic bundle so the panel renders
    // an explicit "context unavailable" state. We deliberately use
    // `mode: 'generic'` (not the requested mode) so the panel takes
    // the single-line empty path and the warning string carries the
    // failure detail. `tenantKey` is null on this branch — there is
    // no successfully-resolved tenant to attribute the bundle to.
    return {
      query: input.query,
      mode: 'generic' as const,
      tenantKey: null,
      facts: [],
      graphPaths: [],
      semanticChunks: [],
      corpusPatterns: [],
      worldviewChunks: [],
      provenance: [],
      warnings: [
        `Context assembly failed: ${reason}. Answering without retrieved context.`,
      ],
      infoTags: [],
      retrievalTrace: {
        tenant_key: null,
        data_plane_id: null,
        schema: null,
        pinecone_index: null,
        retrieved_private_ids: [],
        shared_corpus_ids: [],
        private_fact_ids: [],
        private_chunk_ids: [],
        graph_root_ids: [],
      },
      assembledAt: new Date().toISOString(),
    };
  }
}

function serializeContextBundleArtifact(
  bundle: import("@/lib/knowledge/context-broker").ContextBundle,
): string {
  const json = JSON.stringify({ bundle });
  return `[[artifact:context-bundle]]${json}[[/artifact]]`;
}

function sanitizeContextBundleForOutput(
  bundle: import("@/lib/knowledge/context-broker").ContextBundle,
  accessPolicy?: RestrictedOutputPolicyLike | null,
): import("@/lib/knowledge/context-broker").ContextBundle {
  if (accessPolicy?.outputPolicy.exactFinancialValues) return bundle;
  return {
    ...bundle,
    facts: bundle.facts.map((fact) => ({
      ...fact,
      title: sanitizeRestrictedFinancialText(fact.title, accessPolicy),
      caveat: fact.caveat ? sanitizeRestrictedFinancialText(fact.caveat, accessPolicy) : fact.caveat,
      payload: sanitizePayloadForOutput(fact.payload, accessPolicy),
    })),
    semanticChunks: bundle.semanticChunks.map((hit) => ({
      ...hit,
      chunk: {
        ...hit.chunk,
        text: sanitizeRestrictedFinancialText(hit.chunk.text, accessPolicy),
      },
    })),
    graphPaths: bundle.graphPaths.map((path) => {
      if ('nodes' in path) {
        return {
          ...path,
          nodes: path.nodes.map((node) => ({
            ...node,
            title: sanitizeRestrictedFinancialText(node.title, accessPolicy),
            payload: sanitizePayloadForOutput(node.payload, accessPolicy),
          })),
          edges: path.edges.map((edge) => ({
            ...edge,
            payload: edge.payload ? sanitizePayloadForOutput(edge.payload, accessPolicy) : edge.payload,
          })),
        };
      }
      return {
        ...path,
        edges: path.edges.map((edge) => ({
          ...edge,
          payload: edge.payload ? sanitizePayloadForOutput(edge.payload, accessPolicy) : edge.payload,
        })),
      };
    }),
    provenance: bundle.provenance.map((entry) => ({
      ...entry,
      sourceId: accessPolicy?.outputPolicy.restrictedSourceIds === false
        ? sanitizeRestrictedFinancialText(entry.sourceId, accessPolicy)
        : entry.sourceId,
      sourceDoc: entry.sourceDoc ? sanitizeRestrictedFinancialText(entry.sourceDoc, accessPolicy) : entry.sourceDoc,
    })),
  };
}

function sanitizePayloadForOutput(
  payload: Record<string, unknown>,
  accessPolicy?: RestrictedOutputPolicyLike | null,
): Record<string, unknown> {
  if (accessPolicy?.outputPolicy.exactFinancialValues) return payload;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      out[key] = sanitizeRestrictedFinancialText(value, accessPolicy);
    } else if (typeof value === 'number' && /(budget|spend|cost|revenue|margin|roi|npv|irr|payback|financial|amount|value)/i.test(key)) {
      out[key] = '[restricted financial value]';
    } else if (Array.isArray(value)) {
      out[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeRestrictedFinancialText(item, accessPolicy)
          : item && typeof item === 'object'
            ? sanitizePayloadForOutput(item as Record<string, unknown>, accessPolicy)
            : item,
      );
    } else if (value && typeof value === 'object') {
      out[key] = sanitizePayloadForOutput(value as Record<string, unknown>, accessPolicy);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function formatContextBundleReceiptForPrompt(
  bundle: import("@/lib/knowledge/context-broker").ContextBundle,
  accessPolicy?: RestrictedOutputPolicyLike | null,
): string {
  const trace = bundle.retrievalTrace;
  if (!trace && bundle.facts.length === 0 && bundle.semanticChunks.length === 0) {
    return '';
  }
  const privateIds = trace?.retrieved_private_ids.slice(0, 12) ?? [];
  const sharedIds = trace?.shared_corpus_ids.slice(0, 12) ?? [];
  const factLines = bundle.facts.slice(0, 6).map((fact) => {
    const caveat = fact.caveat ? ` Caveat: ${fact.caveat}` : '';
    return sanitizeRestrictedFinancialText(`  - ${fact.title} (${fact.recordId}).${caveat}`, accessPolicy);
  });
  const chunkLines = bundle.semanticChunks.slice(0, 4).map((hit) => {
    const text = hit.chunk.text.replace(/\s+/g, ' ').trim().slice(0, 240);
    return sanitizeRestrictedFinancialText(`  - ${hit.chunk.chunkId}: ${text}`, accessPolicy);
  });
  const worldviewLines = bundle.worldviewChunks.slice(0, 4).map((hit) => {
    return `  - ${hit.chunkId}: ${hit.thesisTitle ?? hit.thesisId}${hit.chunkTitle ? ` / ${hit.chunkTitle}` : ''}`;
  });
  return [
    'CONTEXT BROKER RECEIPT:',
    `- Mode: ${bundle.mode}`,
    `- Tenant key: ${trace?.tenant_key ?? bundle.tenantKey ?? 'none'}`,
    `- Data plane id: ${trace?.data_plane_id ?? 'none'}`,
    `- Private schema: ${trace?.schema ?? 'none'}`,
    `- Private Pinecone index: ${trace?.pinecone_index ?? 'none'}`,
    `- Private records/chunks retrieved: ${privateIds.length > 0 ? privateIds.join(', ') : 'none'}`,
    `- Shared corpus chunks retrieved: ${sharedIds.length > 0 ? sharedIds.join(', ') : 'none'}`,
    `- Warnings: ${bundle.warnings.length > 0 ? bundle.warnings.join(' | ') : 'none'}`,
    factLines.length > 0 ? 'Private client facts:' : '',
    ...factLines,
    chunkLines.length > 0 ? 'Private client evidence chunks:' : '',
    ...chunkLines,
    worldviewLines.length > 0 ? 'Shared AbarVa corpus/worldview chunks:' : '',
    ...worldviewLines,
    'Use this receipt to ground the answer. Do not invent private facts not present in retrieved private ids or prompt context.',
  ].filter(Boolean).join('\n');
}

function normalizeEnterpriseAgentName(agentName: string | null): EnterpriseAgentName {
  return agentName === 'Nexus' ||
    agentName === 'Sentinel' ||
    agentName === 'Atlas' ||
    agentName === 'Steward'
    ? agentName
    : 'Sentinel';
}

/** OV2-4c · cap on how many recent attachments we expand into the system prompt. */
const ATTACHMENT_CONTEXT_LIMIT = 3;

/**
 * OV2-4c · pull the attachments array off surfaceContext. The chat
 * composer threads `surfaceContext.attachments: AttachmentChipRef[]`;
 * we defensively reject anything that doesn't look like a chip ref.
 */
function extractSurfaceAttachments(
  surfaceContext: Record<string, unknown>,
): AttachmentChipRef[] {
  const raw = surfaceContext.attachments;
  if (!Array.isArray(raw)) return [];
  const out: AttachmentChipRef[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const id = typeof obj.id === 'string' ? obj.id : '';
    const programId = typeof obj.programId === 'string' ? obj.programId : '';
    const originalName =
      typeof obj.originalName === 'string' ? obj.originalName : '';
    const mimeType = typeof obj.mimeType === 'string' ? obj.mimeType : '';
    const sizeBytes =
      typeof obj.sizeBytes === 'number' && Number.isFinite(obj.sizeBytes)
        ? obj.sizeBytes
        : 0;
    if (!id || !originalName || !mimeType) continue;
    out.push({ id, programId, originalName, mimeType, sizeBytes });
  }
  return out;
}

/**
 * OV2-4c · resolve client-supplied attachment chips to server-trusted
 * AttachmentRecords, extract text from known formats, and compose the
 * system-prompt block. Returns '' when:
 *   - No attachments on the turn.
 *   - The surface is not a Programs surface (uploads only land there).
 * Per-attachment failures are caught + logged + skipped.
 */
async function buildAttachmentContextBlock(input: {
  surface: string;
  surfaceAttachments: readonly AttachmentChipRef[];
  activeProgramId: string | null | undefined;
}): Promise<string> {
  const { surface, surfaceAttachments, activeProgramId } = input;
  if (surfaceAttachments.length === 0) return '';
  // Surface gate — block is Programs-surface-only. The composer also
  // checks this; we short-circuit DB reads here.
  if (!isProgramsSurface(surface)) return '';

  // Cap to the most recent N — the chips arrive in chronological order
  // from the composer, so trim from the head if more than N are present.
  const limited = surfaceAttachments.slice(-ATTACHMENT_CONTEXT_LIMIT).reverse();

  const resolvedChips: AttachmentChipRef[] = [];
  const previews: AttachmentTextPreview[] = [];

  for (const chip of limited) {
    try {
      const record = await getAttachment(chip.id);
      if (!record || record.deletedAt) continue;
      // Defense in depth — when the route knows the active program,
      // require the attachment to belong to it. Cross-program
      // references are silently dropped.
      if (activeProgramId && record.programId !== activeProgramId) continue;

      // Use the server-side record's authoritative metadata, not the
      // client's chip — the chip is just a reference.
      resolvedChips.push({
        id: record.id,
        programId: record.programId,
        originalName: record.originalName,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes,
      });

      try {
        const preview = await extractAttachmentText(record);
        if (preview) previews.push(preview);
      } catch (err) {
        console.warn('[chat/agent] attachment_text_extract_failed', {
          attachmentId: record.id,
          mimeType: record.mimeType,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    } catch (err) {
      console.warn('[chat/agent] attachment_resolve_failed', {
        attachmentId: chip.id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (resolvedChips.length === 0) return '';
  return composeAttachmentContextBlock(surface, resolvedChips, previews);
}

// OV2-WIRE-AND-FM-PROMPT Part 2 — brief-signal extractor. Reads the
// optional `briefSnapshot` shape posted by StewardChat (when the client
// adds it) and maps it to BriefOverlapInput. Returns null when no
// signals are present so the caller skips overlap detection entirely.
//
// briefSnapshot shape (forward-compatible — client may add fields over time):
//   { programName?, sponsor?, classification?, problemStatement?, lead? }
//
// `classification` is the canonical pattern id (e.g. PAT-PRG-CDP-001) when
// the user (or the agent) has classified the program. The overlap
// detector currently does not match on archetype (broker gap; see
// origination-overlap.ts header), but we forward the value so the
// detector lights up automatically when the broker carries pattern ids.
const KNOWN_SYSTEM_TOKENS: readonly string[] = [
  'salesforce',
  'snowflake',
  'sap',
  'oracle',
  'workday',
  'servicenow',
  'segment',
  'twilio',
  'genesys',
  'nice',
  'adobe',
  'databricks',
  'amperity',
];

function extractSystemFootprint(text: string | undefined): string[] {
  if (!text || typeof text !== 'string') return [];
  const lower = text.toLowerCase();
  return KNOWN_SYSTEM_TOKENS.filter((token) => lower.includes(token));
}

function buildBriefOverlapInput(
  tenantKey: string,
  surfaceContext: Record<string, unknown>,
): BriefOverlapInput | null {
  const briefSnapshotRaw = surfaceContext.briefSnapshot;
  if (
    !briefSnapshotRaw ||
    typeof briefSnapshotRaw !== 'object' ||
    Array.isArray(briefSnapshotRaw)
  ) {
    return null;
  }
  const snapshot = briefSnapshotRaw as Record<string, unknown>;

  const sponsorCandidate =
    typeof snapshot.sponsor === 'string' && snapshot.sponsor.trim().length > 0
      ? snapshot.sponsor.trim()
      : undefined;
  const archetypeId =
    typeof snapshot.classification === 'string' &&
    snapshot.classification.trim().length > 0
      ? snapshot.classification.trim()
      : undefined;
  const problemStatement =
    typeof snapshot.problemStatement === 'string'
      ? snapshot.problemStatement
      : '';
  const programName =
    typeof snapshot.programName === 'string' ? snapshot.programName : '';
  const systemFootprint = extractSystemFootprint(
    `${problemStatement} ${programName}`,
  );

  // No usable signal → skip detection entirely (returns empty matches anyway).
  if (!sponsorCandidate && !archetypeId && systemFootprint.length === 0) {
    return null;
  }

  return {
    tenantKey,
    archetypeId,
    sponsorCandidate,
    systemFootprint: systemFootprint.length > 0 ? systemFootprint : undefined,
  };
}

function buildSourceOperatingDoctrineBlock(input: {
  surface: string;
  hasEvent: boolean;
}): string {
  if (!isSourceSurface(input.surface)) return '';

  const mode = input.hasEvent ? 'active event canvas' : 'portfolio intake canvas';

  return [
    'SOURCE OPERATING DOCTRINE',
    `Mode: ${mode}.`,
    'Source is an operating workflow, not a procurement encyclopedia. The agent must help stand up a governed sourcing event with minimum friction.',
    '',
    'Five-field intake floor for standing up a sourcing event:',
    '1. Trigger: why now and consequence of doing nothing.',
    '2. Decision owner: sponsor or approver with scope, budget, and stop/go authority.',
    '3. Scope boundary: in scope, out of scope, first tower/cohort/geography when scope is broad.',
    '4. Baseline evidence: current spend/run-rate, application or service inventory, incumbent/vendor list, contract dates, service pain, transition constraints.',
    '5. Stop/approval condition: savings floor, kill criterion, and who approves intake exit before market contact.',
    '',
    'Simple vs complex rule:',
    '- Simple: answerable in chat, such as naming owner, rough category, deadline, or first scope boundary.',
    '- Complex: requires a meeting, workshop, data pull, vendor review, or uploaded artifact. For complex steps, capture intent and plan first, offer the template/checklist, then ask for the output upload before calling evidence met.',
    '',
    'Partner pacing:',
    '- Be crisp. Do not recap the whole doctrine unless asked.',
    '- Ask one question at a time. A consulting partner sequences the work; they do not hand the client a questionnaire.',
    '- For a simple sourcing intent, give a short read and ask for the single missing fact that unlocks the next workflow step.',
    '- If a user gives a title and tenant context names that role, use the name and ask for confirmation rather than asking who the person is.',
    '- Treat broad scope such as "enterprise all towers" as a useful hypothesis but not yet a boundary. Ask for the first boundary or evidence upload, not a lecture.',
    '- For "what do you know about my company", answer as a short ledger: known tenant facts, known leadership, known systems/contracts, and missing live data. Do not apologize at length.',
    '- Prefer action verbs: register, attach, generate, prepare, review, approve, defer, waive, advance.',
  ].join('\n');
}

function resolveSourceClientKey(surfaceContext: Record<string, unknown>): string | null {
  const eventId = typeof surfaceContext.eventId === 'string' ? surfaceContext.eventId : '';
  const accountName = typeof surfaceContext.accountName === 'string'
    ? surfaceContext.accountName.toLowerCase()
    : '';

  if (eventId === AMS_OUTSOURCING_2026_EVENT_ID || accountName.includes('apex')) {
    return 'apex-retail';
  }
  if (accountName.includes('meridian')) {
    return 'meridian-health';
  }

  return null;
}

function buildSourceEventSeedPromptBlock(surfaceContext: Record<string, unknown>): string {
  const eventId = typeof surfaceContext.eventId === 'string' ? surfaceContext.eventId : '';
  if (eventId !== AMS_OUTSOURCING_2026_EVENT_ID) return '';

  const storyline = buildAmsVendorStoryline();
  const bafo = buildAmsBafoView();

  const vendorLines = storyline.vendors.map((vendor) => {
    const risks = vendor.riskFlags.length > 0
      ? vendor.riskFlags
          .map((risk) => `${risk.severity.toUpperCase()} ${risk.label}: ${risk.detail}`)
          .join('; ')
      : 'No open risk flags';
    return `- ${vendor.vendorLabel}: ${vendor.proposalStatusLabel}; pricing band ${vendor.pricingBandLabel}; risks: ${risks}.`;
  });
  const invitedVendors = bafo.invitedVendors
    .map((vendor) => `${vendor.vendorLabel} (${vendor.responseStatusLabel}; due ${vendor.responseDeadline})`)
    .join('; ');
  const excludedVendors = bafo.notInvitedVendors
    .map((vendor) => `${vendor.vendorLabel}: ${vendor.exclusionReason}`)
    .join('; ');
  const committee = bafo.selectionCommittee
    .map((member) => `${member.name}, ${member.role}`)
    .join('; ');

  return [
    'SOURCE EVENT PAGE SEED CONTEXT (current canvas; deterministic demo seed):',
    `Event: ${storyline.eventName}. Account: Apex Retail. Event ID: ${storyline.eventId}. Linked program: ${storyline.linkedProgramCode}. Current stage: S5 Orals/BAFO.`,
    'Use this page-local context before saying vendor, BAFO, committee, risk, or gate data is missing.',
    'Vendor proposals rendered on the current canvas:',
    ...vendorLines,
    `BAFO invited vendors: ${invitedVendors}.`,
    `Vendors not invited to BAFO: ${excludedVendors}.`,
    `Selection committee: ${committee}.`,
    `BAFO next steps: ${bafo.nextSteps.join('; ')}.`,
    'Weakest-response rule: if asked which vendor response is weakest, name BlueMaster Operations first because it carries a CRITICAL transition plan quality gap; then mention Northstar pricing opacity and ArcVault governance as BAFO risks if useful.',
    `Evidence caveat: ${storyline.evidenceCaveat} ${bafo.evidenceCaveat}`,
  ].join('\n');
}

function formatSourceBrokerBundleForPrompt(bundle: EnterpriseAgentContextBundle): string {
  const tenantSummary = bundle.items.find((i) => i.kind === 'tenant_summary');
  const people = bundle.items.filter((i) => i.kind === 'person');
  const systems = bundle.items.filter((i) => i.kind === 'system');
  const contracts = bundle.items.filter((i) => i.kind === 'vendor_contract');
  const sourcingEvents = bundle.items.filter((i) => i.kind === 'sourcing_event');
  const evidence = bundle.items.filter((i) => i.kind === 'evidence');

  if (!tenantSummary && people.length === 0 && systems.length === 0 && contracts.length === 0 && sourcingEvents.length === 0 && evidence.length === 0) {
    return '';
  }

  const sections: string[] = [
    'SOURCE TENANT CONTEXT (from Enterprise Data Room broker — use before asking the user for known client facts):',
  ];

  if (tenantSummary) {
    sections.push(`Tenant: ${tenantSummary.title}. ${tenantSummary.summary}`);
  }

  if (people.length > 0) {
    sections.push(
      'Known leadership / decision owners:',
      ...people.map((person) => `  - ${person.title}. ${person.summary}`),
    );
  }

  if (systems.length > 0) {
    sections.push(
      'Known technology landscape:',
      ...systems.slice(0, 6).map((system) => `  - ${system.title}. ${system.summary}`),
    );
  }

  if (contracts.length > 0) {
    sections.push(
      'Known vendor / contract context:',
      ...contracts.slice(0, 6).map((contract) => `  - ${contract.title}. ${contract.summary}`),
    );
  }

  if (sourcingEvents.length > 0) {
    sections.push(
      'Known sourcing lifecycle records:',
      ...sourcingEvents.map((event) => `  - ${event.title}. ${event.summary}`),
    );
  }

  if (evidence.length > 0) {
    sections.push(
      'Relevant evidence snippets:',
      ...evidence.slice(0, 4).map((item) => `  - ${item.title}. ${item.summary}`),
    );
  }

  sections.push(
    'When the user references CIO, CFO, CDO, systems, vendors, or contracts, resolve from this context first. If context is synthetic seed, say "seeded context shows..." when asked directly about provenance.',
  );

  return sections.join('\n');
}

function buildSourceStagePackBlock(input: {
  surface: string;
  sourceStageKey?: string;
  eventName?: string;
}): string {
  if (!isSourceSurface(input.surface)) return '';

  const pack = getStagePackForSourceStageKey(input.sourceStageKey)
    ?? (input.eventName ? getStagePack(0) : getStagePack(0));
  if (!pack) return '';

  const lifecycle = buildSourceLifecycleContract(pack);
  const lifecycleSummary = [
    '### Lifecycle operating contract',
    `What good looks like: ${lifecycle.outcome}`,
    `Approval authority: ${lifecycle.approval.authority}.`,
    `Approval decision: ${lifecycle.approval.decision}`,
    `Blocker policy: ${lifecycle.approval.blockerPolicy}`,
    'Step doctrine:',
    ...lifecycle.steps.map((step) => {
      const templates = step.templates.map((template) => template.title).join('; ');
      const evidence = step.evidenceRequired.map((item) => item.label).join('; ');
      return `- ${step.title} [${step.complexity}, ${step.agentWorkMode}]: ${step.intent} Templates: ${templates}. Evidence: ${evidence}.`;
    }),
    'Next-stage primer:',
    `- ${lifecycle.nextPhasePrimer.readinessQuestion}`,
    `- First move: ${lifecycle.nextPhasePrimer.suggestedFirstMove}`,
  ].join('\n');

  return [
    formatStagePackForPrompt(pack),
    '',
    lifecycleSummary,
  ].join('\n');
}

function getStagePackForSourceStageKey(stageKey: string | undefined) {
  if (!stageKey) return null;
  const stage = SOURCE_STAGE_KEY_TO_PACK_STAGE[stageKey as SourceStageKey];
  return getStagePack(stage);
}

const SOURCE_STAGE_KEY_TO_PACK_STAGE: Partial<Record<SourceStageKey, number>> = {
  strategy: 0,
  intake: 0,
  scope: 0,
  rfp: 3,
  responses: 2,
  pricing: 4,
  bafo: 5,
  executive_decision: 6,
  transition: 6,
  value: 7,
  sourcing_strategy: 1,
  vendor_responses: 2,
  rfp_rfi_package: 3,
  evaluation: 4,
  orals_bafo: 5,
  selection: 6,
  contract_mobilization: 6,
  value_realization: 7,
};
