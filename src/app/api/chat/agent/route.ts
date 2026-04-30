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
import { getActiveClientRow } from "@/lib/active-client";
import { getUserContextPromptBlock } from "@/lib/agent/userContext";
import { retrieveStageContext, retrieveCategoryContext } from "@/lib/intelligence/agent-retrieval";
import { getRelevantTools } from "@/lib/agent/tools/registry";
import { runToolUseLoop } from "@/lib/agent/streaming/toolUseLoop";
import { FOUR_LAYER_REASONING_INSTRUCTIONS } from "@/lib/intelligence/synthesis/instructionLayer";
import { validateSynthesisOutput } from "@/lib/intelligence/synthesis/outputValidator";
import { recordViolations } from "@/lib/intelligence/synthesis/violationsRecorder";
import { ARTIFACT_CHANNEL_INSTRUCTIONS } from "@/lib/agent/artifacts";
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
import { getPhasePack, formatPhasePackForPrompt } from "@/lib/programs/phase-packs";
import {
  getStagePack,
  formatStagePackForPrompt,
} from "@/lib/source/stage-packs";
import { buildSourceLifecycleContract } from "@/lib/lifecycle-operating-system";
import type { SourceStageKey } from "@/lib/source/types";
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
// OV2-WIRE-AND-FM-PROMPT — failure-mode catalog (universal across Programs
// surfaces) and overlap-candidates block (/programs/new only). The catalog
// is sourced from FAILURE_MODES so the prompt and the catalog cannot drift.
import {
  composeFailureModeBlock,
  composeFailureModeDoctrineBlock,
  composeOverlapBlock,
  composeBriefProgressCadenceDirective,
  composeAttachmentContextBlock,
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
import { clientKeyToBrokerTenantKey } from "@/lib/agent/tools/intelligence/_shared";
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
// Surface 2 PR-Q — navigate_to tool. Registered for every entry
// surface so any agent can take the user somewhere (e.g. Nexus on
// /programs redirects new-program intent to /programs/new where
// Steward owns origination). Closes founder feedback "[Nexus] does
// not help me navigate to phase 1 ... I don't have a navigation
// tool in my current session."
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

// ── Agent voice map ────────────────────────────────────────────────────────────

const AGENT_VOICE: Record<string, string> = {
  Nexus:    "You are Nexus, AbarVa's program orchestrator. You guide program phases, track gates, surface blockers, and drive deliverable quality.",
  Sentinel: "You are Sentinel, AbarVa's intelligence librarian. You validate AI patterns, assess source events, and curate the knowledge library.",
  Atlas:    "You are Atlas, AbarVa's portfolio CIO-of-staff. You monitor pressures, triage signals, and give executive-level portfolio clarity.",
  Steward:  "You are Steward, AbarVa's governance and setup agent. You manage connectors, users, and policy compliance.",
};

const DEFAULT_VOICE = "You are an AbarVa AI advisor. Be direct, specific, and actionable.";

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
  };

  const message = body.message?.trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tenantName          = body.tenantName ?? "Apex Retail Group";
  const agentName           = body.agentName  ?? "Atlas";
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

  const voiceLine = AGENT_VOICE[agentName] ?? DEFAULT_VOICE;

  const contextLines: string[] = [
    `Active tenant: ${tenantName} (locked — this is the user's client account).`,
    surface ? `Current surface: ${surface}.` : "",
    stage   ? `Workflow stage: ${stage}.` : "",
  ].filter(Boolean);

  // Phase Intelligence Pack for the active program's current phase.
  // Resolved alongside programData below; rendered into the system
  // prompt for program-detail surfaces. Null when no pack authored yet.
  let phasePackBlock = '';

  // If we have a programId, enrich with live DB data
  if (programId) {
    try {
      await requireTenancy();
      const programData = await getEngagementWithPhaseData(programId);
      if (programData) {
        const { engagement, evidence, gateApprovals } = programData;
        const phase = engagement.current_phase ?? 0;
        const phaseLabel = PHASE_LABEL_MAP[phase as keyof typeof PHASE_LABEL_MAP] ?? "Unknown";
        const latestGate =
          gateApprovals.length > 0
            ? `${gateApprovals[0].action} by ${gateApprovals[0].actor_name}`
            : "pending";

        contextLines.push(
          `Active program: ${engagement.name} (${programId})`,
          `Current phase: P${phase} ${phaseLabel}`,
          `Evidence items: ${evidence.length} uploaded`,
          `Gate approvals: ${latestGate}`,
        );

        const pack = getPhasePack(phase);
        if (pack) {
          phasePackBlock = formatPhasePackForPrompt(pack);
        }
      }
    } catch {
      // Auth failed or DB error — continue with demo context
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
      sc.valueAtStakeUsd ? `Contract value at stake: $${(Number(sc.valueAtStakeUsd) / 1_000_000).toFixed(1)}M` : '',
    ].filter(Boolean);
    contextLines.push(...eventContextLines);
  }

  // Cross-surface: inject linked program state when on Source surface
  const linkedProgramId = (body.surfaceContext?.linkedProgramCode as string) ?? null;
  if (surface === 'source' && linkedProgramId && linkedProgramId !== programId) {
    try {
      await requireTenancy();
      const linkedData = await getEngagementWithPhaseData(linkedProgramId);
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


  // F0.2 Layer 0 — user context block, composed AFTER role/voice line
  // and BEFORE knowledge/task content so the agent always knows who
  // it's speaking with. Empty string when unauthenticated.
  const userContextBlock = await getUserContextPromptBlock();

  // Surface 1 PR2.5 — resolve the active client so we can scope the
  // demo block to the right tenant. Apex Retail gets the rich
  // multi-program demo context; everyone else gets only the general
  // platform context (avoids Steward/Nexus referencing Apex programs
  // in conversations with Meridian or Arcturus users).
  const activeClient = await getActiveClientRow().catch(() => null);
  const tenantSystemBlock = getTenantSystemBlock(activeClient?.key ?? null);

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
  const artifactInstructions =
    surfacesWithArtifactChannel.has(surface) || isProgramDetailSurface || isSourceSurface(surface)
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
  const isNexusProgramsSurface =
    agentName === 'Nexus' &&
    typeof surface === 'string' &&
    (surface === '/programs' || isProgramDetailSurface);
  if (isNexusProgramsSurface && activeClient?.key) {
    try {
      const brokerBundle = buildProgramsContextBundle({
        tenantKey: activeClient.key,
        programId: programId ?? undefined,
        agentName: 'Nexus',
        surface: 'programs',
      });
      nexusTenantContextBlock = formatProgramsBrokerBundleForPrompt(brokerBundle);
    } catch {
      // Broker failure is non-fatal — Nexus falls through to the
      // existing tenantSystemBlock + page-context lines.
    }
  }
  if (isSourceSurface(surface) && activeClient?.key) {
    try {
      sourceTenantContextBlock = formatSourceBrokerBundleForPrompt(
        buildEnterpriseAgentContextBundle({
          tenantKey: activeClient.key,
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

  const systemPrompt = [
    voiceLine,
    "",
    userContextBlock,
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
    sourceTenantContextBlock,
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
    attachmentContextBlock,
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
    ...(isSourceSurface(surface)
      ? [
          "- SOURCE CONSULTING PARTNER STYLE: short, calm, commercially sharp. No lengthy passages. No intake-form behavior. No 'Acknowledged' opener.",
          "- Default Source reply shape: (1) one-sentence read of what you heard, (2) one sentence on why it matters, (3) exactly ONE next question or action.",
          "- Ask at most ONE question in the chat reply. If several fields are missing, pick the single highest-leverage blocker and let the right pane/artifact cards carry the rest.",
          "- Keep most Source replies under 75 words unless the user explicitly asks for a deep dive, draft, comparison, or executive brief.",
          "- If the user is starting an event, quietly map their words to the five-field intake floor: trigger, decision owner, scope boundary, baseline evidence, stop/approval condition. Do not recite all five unless asked.",
          "- Use known tenant context before asking. If the user names a role and Source tenant context resolves it, use the known person by name and ask only to confirm authority. Never ask 'who is the CIO?' when context names the CIO.",
          "- If the user mistypes a title (for example CIKO when CIO is likely), correct lightly and continue; do not make the typo the center of the reply.",
          "- Let the right pane carry progress, gates, evidence, blockers, and next-step prep. In prose, summarize what changed and the one next missing field.",
          "- If emitting sourcing-stage-progress artifacts, emit valid JSON only; never expose artifact syntax in prose.",
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
          bufferedOutput += text;
          controller.enqueue(encoder.encode(text));
        },
      };
      try {
        await runToolUseLoop({
          client: anthropicClient,
          model: "claude-sonnet-4-6",
          maxTokens: 512,
          system: systemPrompt,
          messages: [
            ...conversationHistory.slice(-10),
            { role: "user", content: message },
          ],
          tools,
          toolContext: {
            request,
            surface,
            surfaceContext: body.surfaceContext,
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

function normalizeEnterpriseAgentName(agentName: string): EnterpriseAgentName {
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
  intake: 0,
  scope: 0,
  sourcing_strategy: 1,
  vendor_responses: 2,
  rfp_rfi_package: 3,
  evaluation: 4,
  orals_bafo: 5,
  selection: 6,
  contract_mobilization: 6,
  value_realization: 7,
};
