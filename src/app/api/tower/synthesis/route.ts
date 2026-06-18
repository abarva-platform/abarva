// POST /api/tower/synthesis
// Body: (none — Tower context is the whole portfolio)
// Response: streaming plain text — Atlas's portfolio-level synthesis quote

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
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  formatUserProgramAccessPolicyForPrompt,
  loadUserProgramAccessPolicy,
} from "@/lib/auth/program-access-policy";
import {
  formatRestrictedOutputPolicyForPrompt,
  sanitizeRestrictedFinancialText,
} from "@/lib/agent/restricted-output-policy";
import {
  buildAtlasSynthesisPrompt,
  composeAtlasSynthesisUserMessage,
  TOWER_SYNTHESIS_TEMPERATURE,
  TOWER_SYNTHESIS_TIMEOUT_MESSAGE,
  TOWER_SYNTHESIS_TIMEOUT_MS,
  type AtlasSynthesisSnapshot,
} from "@/lib/tower/synthesis-route-helpers";

// Simple in-memory cache: key → text response
// In production this would be Redis; for demo an in-process cache is sufficient.
const synthesisCache = new Map<string, string>();
const cacheCreatedAt = new Map<string, number>();
registerSynthesisCache('tower', synthesisCache, cacheCreatedAt);

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
  const tenantDisplayName = activeClient?.name ?? tenancy.clientKey ?? 'the active tenant';

  // Build context up-front so we can attach telemetry counts to both
  // cache-hit and cache-miss responses.
  const ctx = buildTowerSynthesisContext(programInstances, sourceEventInstances);

  // Cache check — keyed on tenant so cached Apex synthesis can never
  // be returned to a different tenant.
  const stateHash = towerStateHash(programInstances, sourceEventInstances);
  const policyCacheKey = accessPolicy.outputPolicy.exactFinancialValues ? 'finance' : 'restricted';
  const cacheKey = `tower:${tenancy.clientKey ?? tenancy.clientId}:${stateHash}:atlas:v2:${policyCacheKey}`;
  const etag = computeSynthesisEtag(cacheKey);
  const ifNoneMatch = request.headers.get('if-none-match');
  const cached = synthesisCache.get(cacheKey);

  // Conditional GET: client already has this exact synthesis cached.
  if (cached && ifNoneMatch && ifNoneMatch === etag) {
    const event = recordSynthesisEvent({
      surface: 'tower',
      instanceId: 'tower',
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

  if (cached) {
    const event = recordSynthesisEvent({
      surface: 'tower',
      instanceId: 'tower',
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
  const accessPolicyBlock = formatUserProgramAccessPolicyForPrompt(accessPolicy);
  const restrictedOutputBlock = formatRestrictedOutputPolicyForPrompt(accessPolicy);
  const demoContextBlock = sanitizeRestrictedFinancialText(AGENT_DEMO_SYSTEM_BLOCK, accessPolicy);
  const systemPrompt = buildAtlasSynthesisPrompt(
    userContextBlock,
    accessPolicyBlock,
    restrictedOutputBlock,
    demoContextBlock,
  );
  const preflight = await preflightAnthropicDirectClient({
    tenantId: tenancy.clientId,
    userId: tenancy.userId,
    workflow: 'tower-synthesis',
    model: 'claude-sonnet-4-6',
    prompt: [systemPrompt, userMessage].join('\n\n'),
    dataClass: accessPolicy.outputPolicy.exactFinancialValues ? 'confidential' : 'internal',
    metadata: { surface: 'tower' },
  });
  if (!preflight.ok) {
    return new Response(preflight.reason, {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
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

  const encoder = new TextEncoder();
  let accumulated = '';

  const event = recordSynthesisEvent({
    surface: 'tower',
    instanceId: 'tower',
    patternId: null,
    cacheHit: false,
    latencyMs: Date.now() - startedAt,
    citationCount: ctx.citations.length,
    contradictionCount: ctx.activeContradictions.length,
    failureModeCount: ctx.failureModes.length,
    gateCount: ctx.gatesSummary.total,
  });

  if (!accessPolicy.outputPolicy.exactFinancialValues) {
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
      // Atlas Fix C: on abort/timeout, surface an honest message rather than a
      // raw 5xx or — worse — silence. The caller's "thinking…" indicator should
      // clear when this body arrives.
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
        "X-Restricted-Output": "financial-values-redacted",
      },
    });
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            accumulated += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (err) {
        // Atlas Fix C: if the upstream times out / aborts, append an honest
        // user-facing message so the chat surface shows a real failure instead
        // of a silent hang. Then close cleanly.
        if (abortController.signal.aborted) {
          const suffix = accumulated.length > 0 ? '\n\n' : '';
          controller.enqueue(
            encoder.encode(`${suffix}${TOWER_SYNTHESIS_TIMEOUT_MESSAGE}`),
          );
          controller.close();
          return;
        }
        clearTimeout(timeoutHandle);
        controller.error(err);
        return;
      } finally {
        clearTimeout(timeoutHandle);
      }
      // Cache the full response after streaming completes
      if (accumulated) {
        synthesisCache.set(cacheKey, sanitizeRestrictedFinancialText(accumulated, accessPolicy));
        cacheCreatedAt.set(cacheKey, Date.now());
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      ETag: etag,
      "X-Cache": "MISS",
      "X-Synthesis-Event-Id": event.id,
    },
  });
}
