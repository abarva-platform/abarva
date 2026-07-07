// POST /api/tower/synthesis
// Body: (none — Tower context is the whole portfolio)
// Response: plain text — aVa's portfolio-level synthesis quote

import { preflightAnthropicDirectClient } from "@/lib/integrations/ai-egress";
import { getActiveClientRow } from "@/lib/active-client";
import { loadTenantTowerPortfolio } from "@/lib/reasoning/tenant-tower-portfolio";
import {
  buildTowerSynthesisContext,
  towerStateHash,
} from "@/lib/reasoning/tower-synthesis-context-builder";
import { recordSynthesisEvent } from "@/lib/reasoning/synthesis-telemetry";
import { computeSynthesisEtag } from "@/lib/reasoning/synthesis-etag";
import { registerSynthesisCache } from "@/lib/reasoning/synthesis-cache-registry";
import { AGENT_DEMO_SYSTEM_BLOCK } from "@/lib/agent/demo-context";
import { getUserContextPromptBlock } from "@/lib/agent/userContext";
import { FOUR_LAYER_REASONING_INSTRUCTIONS } from "@/lib/intelligence/synthesis/instructionLayer";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  formatUserProgramAccessPolicyForPrompt,
  loadUserProgramAccessPolicy,
} from "@/lib/auth/program-access-policy";
import {
  formatRestrictedOutputPolicyForPrompt,
  sanitizeRestrictedFinancialText,
} from "@/lib/agent/restricted-output-policy";
import { composeAllAgentDoctrineBlock } from "@/lib/agent/all-agent-doctrine";
import {
  assertVisibleAnswerContract,
  VISIBLE_ANSWER_CONTRACT_PROMPT,
} from "@/lib/agent/visible-answer-contract";

// Simple in-memory cache: key → text response
// In production this would be Redis; for demo an in-process cache is sufficient.
const synthesisCache = new Map<string, string>();
const cacheCreatedAt = new Map<string, number>();
registerSynthesisCache("tower", synthesisCache, cacheCreatedAt);

// aVa Fix C (stuck state): hard upstream timeout for tower synthesis. When
// the model stream stalls we cancel the request and emit an honest, user-facing
// message instead of leaving the UI hung at "aVa is thinking...". 30s matches
// the working API timeout policy elsewhere in this codebase.
export const TOWER_SYNTHESIS_TIMEOUT_MS = 30_000;
export const TOWER_SYNTHESIS_TIMEOUT_MESSAGE =
  "aVa could not complete that response in time. Try again or pick a narrower question.";

// aVa Fix C (determinism): tower synthesis uses temperature=0 so the same
// portfolio state produces the same read. The CXO-quality audit (PR #2562)
// flagged the default temperature (~1.0) as the source of contradictory reads.
export const TOWER_SYNTHESIS_TEMPERATURE = 0;

const ATLAS_SYNTHESIS_VOICE_AND_TASK = `${VISIBLE_ANSWER_CONTRACT_PROMPT}

You are aVa, AbarVa's portfolio CIO-of-staff agent on the Tower surface.

Your synthesis task: given the current state of an entire portfolio (every active program plus every active source event), produce a portfolio-level read that names the single highest-leverage move.

aVa voice register:
- Cross-program synthesizer. aVa reasons about the portfolio as a single system.
- Lead with the dependency chain: which one move, if it lands, propagates the most downstream value?
- Reference named programs and source events by their display names, never raw IDs.
- Quantify portfolio scope when relevant (e.g. "across 4 programs and 1 active sourcing event").
- Precise, executive register. No filler. No hedging.

Format: Use the shared agent output contract. Prefer lead-bullets for the Tower quote: one direct lead line, then 2-4 short evidence bullets. No raw markdown emphasis.
`;

export function buildAtlasSynthesisPrompt(
  userContextBlock: string,
  accessPolicyBlock: string,
  restrictedOutputBlock: string,
  demoContextBlock: string,
): string {
  // F0.2 + F0.3 composition.
  return [
    ATLAS_SYNTHESIS_VOICE_AND_TASK,
    composeAllAgentDoctrineBlock({ agentName: "aVa", surface: "/tower" }),
    userContextBlock,
    accessPolicyBlock,
    restrictedOutputBlock,
    FOUR_LAYER_REASONING_INSTRUCTIONS,
    demoContextBlock,
  ]
    .filter((s) => s && s.trim().length > 0)
    .join("\n\n");
}

export interface AtlasSynthesisSnapshot {
  programCount: number;
  sourceEventCount: number;
  pendingGateCount: number;
  activeBlockerCount: number;
  programs: ProgramSummary[];
  sourceEvents: SourceSummary[];
}

/**
 * Compose the synthesis user message from a tenant-scoped portfolio
 * snapshot. Exported for tests — the route file is otherwise hard to
 * exercise without mocking the entire AI stack.
 *
 * aVa Fix A invariant: the tenant display name is always derived from
 * the signed-in tenant's `getActiveClientRow()` — never a hardcoded Apex
 * display name. When the portfolio is empty the model is told honestly,
 * never silently fed another tenant's data.
 */
export function composeAtlasSynthesisUserMessage(
  tenantDisplayName: string,
  snap: AtlasSynthesisSnapshot,
): string {
  const programLines = snap.programs
    .map(
      (p) =>
        `  - "${p.name}" · phase P${p.phase} ${p.phaseLabel} · gate ${p.gateStatus}` +
        (p.openBlockerCount > 0
          ? ` · ${p.openBlockerCount} open blocker(s)`
          : "") +
        (p.linkedSourceEventIds.length > 0
          ? ` · linked source count: ${p.linkedSourceEventIds.length}`
          : ""),
    )
    .join("\n");

  const sourceLines = snap.sourceEvents
    .map(
      (s) =>
        `  - "${s.name}" · stage ${s.stage} · ${s.vendorCount} vendor(s)` +
        (s.activeVendors.length > 0
          ? ` · active: ${s.activeVendors.join(", ")}`
          : "") +
        (s.openBlockerCount > 0
          ? ` · ${s.openBlockerCount} open blocker(s)`
          : "") +
        (s.linkedProgramIds.length > 0
          ? ` · linked program count: ${s.linkedProgramIds.length}`
          : ""),
    )
    .join("\n");

  const portfolioIsEmpty =
    snap.programCount === 0 && snap.sourceEventCount === 0;

  if (portfolioIsEmpty) {
    return [
      `Portfolio snapshot for ${tenantDisplayName}:`,
      `No active programs or source events are wired into the Tower data plane for this tenant yet.`,
      "",
      `Do NOT fabricate program or source-event IDs. Reply with a single direct line stating that the portfolio has no active programs or source events to synthesize, and that aVa will produce a portfolio read once Tower is wired to this tenant's data.`,
    ].join("\n");
  }

  return [
    `Portfolio snapshot for ${tenantDisplayName}:`,
    `${snap.programCount} active program(s), ${snap.sourceEventCount} active source event(s).`,
    `${snap.pendingGateCount} pending gate(s) and ${snap.activeBlockerCount} active blocker(s) across the portfolio.`,
    "",
    `Active programs:`,
    programLines,
    "",
    `Active source events:`,
    sourceLines,
    "",
    `Synthesize aVa's 90-140 word portfolio-level read. Name at least one program and one source event by display name when available. Lead with the highest-leverage dependency chain. Use a direct lead line and 2-4 short evidence bullets.`,
  ].join("\n");
}

interface ProgramSummary {
  id: string;
  name: string;
  phase: number;
  phaseLabel: string;
  gateStatus: string;
  openBlockerCount: number;
  linkedSourceEventIds: string[];
}

interface SourceSummary {
  id: string;
  name: string;
  stage: string;
  vendorCount: number;
  activeVendors: string[];
  openBlockerCount: number;
  linkedProgramIds: string[];
}

export async function POST(request: Request) {
  // Tower has no body parameters — context is the whole portfolio. We still
  // read the request to honour the If-None-Match header for ETag short-circuit.
  const startedAt = Date.now();
  let accessPolicy;
  let tenancy;
  try {
    tenancy = await requireTenancy();
    accessPolicy = await loadUserProgramAccessPolicy(tenancy);
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  // Atlas Fix A (2026-05-30) — load portfolio inputs scoped to the
  // signed-in tenant. Apex Retail fixture is ONLY returned for
  // `apexretail` under the `tower_synthesis_apex_demo_fixture` flag.
  // Other tenants get empty arrays — no silent Apex fallback. The
  // tenant's canonical display name is pulled from the active client
  // row for the user message header.
  const portfolio = loadTenantTowerPortfolio(tenancy);
  const { programInstances, sourceEventInstances } = portfolio;
  const activeClient = await getActiveClientRow();
  const tenantDisplayName =
    activeClient?.name ?? tenancy.clientKey ?? "the active tenant";

  // Build context up-front so we can attach telemetry counts to both
  // cache-hit and cache-miss responses.
  const ctx = buildTowerSynthesisContext(
    programInstances,
    sourceEventInstances,
  );

  // Cache check — keyed on tenant so cached Apex synthesis can never
  // be returned to a different tenant.
  const stateHash = towerStateHash(programInstances, sourceEventInstances);
  const policyCacheKey = accessPolicy.outputPolicy.exactFinancialValues
    ? "finance"
    : "restricted";
  const cacheKey = `tower:${tenancy.clientKey ?? tenancy.clientId}:${stateHash}:atlas:v2:${policyCacheKey}`;
  const etag = computeSynthesisEtag(cacheKey);
  const ifNoneMatch = request.headers.get("if-none-match");
  const cached = synthesisCache.get(cacheKey);
  const cachedVisibleContract = cached
    ? assertVisibleAnswerContract(
        sanitizeRestrictedFinancialText(cached, accessPolicy),
      )
    : null;
  if (cached && cachedVisibleContract && !cachedVisibleContract.passed) {
    synthesisCache.delete(cacheKey);
    cacheCreatedAt.delete(cacheKey);
  }

  // Conditional GET: client already has this exact synthesis cached.
  if (
    cached &&
    cachedVisibleContract?.passed &&
    ifNoneMatch &&
    ifNoneMatch === etag
  ) {
    const event = recordSynthesisEvent({
      surface: "tower",
      instanceId: "tower",
      patternId: null,
      cacheHit: true,
      latencyMs: Date.now() - startedAt,
      citationCount: ctx.citations.length,
      contradictionCount: ctx.activeContradictions.length,
      failureModeCount: ctx.failureModes.length,
      gateCount: ctx.gatesSummary.total,
    });
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "X-Cache": "HIT",
        "X-Synthesis-Event-Id": event.id,
      },
    });
  }

  if (cached && cachedVisibleContract?.passed) {
    const event = recordSynthesisEvent({
      surface: "tower",
      instanceId: "tower",
      patternId: null,
      cacheHit: true,
      latencyMs: Date.now() - startedAt,
      citationCount: ctx.citations.length,
      contradictionCount: ctx.activeContradictions.length,
      failureModeCount: ctx.failureModes.length,
      gateCount: ctx.gatesSummary.total,
    });
    return new Response(sanitizeRestrictedFinancialText(cached, accessPolicy), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ETag: etag,
        "X-Cache": "HIT",
        "X-Synthesis-Event-Id": event.id,
      },
    });
  }

  const snap = ctx.instanceSnapshot as unknown as AtlasSynthesisSnapshot;
  const userMessage = composeAtlasSynthesisUserMessage(tenantDisplayName, snap);

  // F0.2 Layer 0
  const userContextBlock = await getUserContextPromptBlock();
  const accessPolicyBlock =
    formatUserProgramAccessPolicyForPrompt(accessPolicy);
  const restrictedOutputBlock =
    formatRestrictedOutputPolicyForPrompt(accessPolicy);
  const demoContextBlock = sanitizeRestrictedFinancialText(
    AGENT_DEMO_SYSTEM_BLOCK,
    accessPolicy,
  );
  const systemPrompt = buildAtlasSynthesisPrompt(
    userContextBlock,
    accessPolicyBlock,
    restrictedOutputBlock,
    demoContextBlock,
  );
  const preflight = await preflightAnthropicDirectClient({
    tenantId: tenancy.clientId,
    userId: tenancy.userId,
    workflow: "tower-synthesis",
    model: "claude-sonnet-4-6",
    prompt: [systemPrompt, userMessage].join("\n\n"),
    dataClass: accessPolicy.outputPolicy.exactFinancialValues
      ? "confidential"
      : "internal",
    metadata: { surface: "tower" },
  });
  if (!preflight.ok) {
    return new Response(preflight.reason, {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const client = preflight.client;

  // Atlas Fix C: wrap the upstream stream in an AbortController with an
  // explicit timeout. On timeout we abort the upstream, clear the spinner, and
  // surface an honest message. Never leave the UI hanging.
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(
    () => abortController.abort(),
    TOWER_SYNTHESIS_TIMEOUT_MS,
  );

  const stream = await client.messages.stream(
    {
      model: "claude-sonnet-4-6",
      temperature: TOWER_SYNTHESIS_TEMPERATURE,
      max_tokens: 350,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    },
    { signal: abortController.signal },
  );

  let accumulated = "";

  const event = recordSynthesisEvent({
    surface: "tower",
    instanceId: "tower",
    patternId: null,
    cacheHit: false,
    latencyMs: Date.now() - startedAt,
    citationCount: ctx.citations.length,
    contradictionCount: ctx.activeContradictions.length,
    failureModeCount: ctx.failureModes.length,
    gateCount: ctx.gatesSummary.total,
  });

  let timedOut = false;
  try {
    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        accumulated += chunk.delta.text;
      }
    }
  } catch (err) {
    // aVa Fix C: on abort/timeout, surface an honest message rather than a
    // raw 5xx or silence. The caller's "thinking..." indicator should clear
    // when this body arrives.
    if (abortController.signal.aborted) {
      timedOut = true;
    } else {
      clearTimeout(timeoutHandle);
      throw err;
    }
  } finally {
    clearTimeout(timeoutHandle);
  }
  if (timedOut) {
    return new Response(TOWER_SYNTHESIS_TIMEOUT_MESSAGE, {
      status: 504,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Cache": "MISS",
        "X-Synthesis-Event-Id": event.id,
        "X-Synthesis-Timeout": "true",
      },
    });
  }

  const safeText = sanitizeRestrictedFinancialText(accumulated, accessPolicy);
  const visibleContract = assertVisibleAnswerContract(safeText);
  if (!visibleContract.passed) {
    return Response.json(
      {
        error: "visible_answer_contract_failed",
        detail:
          "aVa blocked this answer before display because it exposed non-user-facing answer language.",
        version: visibleContract.version,
        violations: visibleContract.violations,
      },
      { status: 422 },
    );
  }
  if (safeText) {
    synthesisCache.set(cacheKey, safeText);
    cacheCreatedAt.set(cacheKey, Date.now());
  }

  return new Response(safeText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ETag: etag,
      "X-Cache": "MISS",
      "X-Synthesis-Event-Id": event.id,
      ...(accessPolicy.outputPolicy.exactFinancialValues
        ? {}
        : { "X-Restricted-Output": "financial-values-redacted" }),
    },
  });
}
