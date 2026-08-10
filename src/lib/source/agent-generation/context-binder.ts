// Agent generation · context binder
//
// Pulls everything a prompt template needs to generate an artifact
// body: tenant identity, event metadata, all per-event substrate.
// Tenant-scoped via the existing canvas-substrate queries (RLS holds).
//
// Pure function over the substrate query layer — no caching, no
// memoization. Each generation call gets a fresh read so a body
// generated after Mark-met flips reflects the latest state.

import {
  listArtifactStatesForEvent,
  listEvidenceStatesForEvent,
  listGateCriterionStatesForEvent,
} from "@/lib/source/canvas-substrate/queries";
import {
  getSourcingEvent,
  isUuid,
  resolveSourceEventUuidForClient,
} from "@/lib/source/queries";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { getActiveClientRow } from "@/lib/active-client";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { listAppInventoryRecords } from "@/lib/admin/setup-data-broker";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { nextSourceStage } from "@/lib/source/constants";
import { resolveArchetypeForEvent } from "@/lib/source/archetypes/event-archetype-resolver";
import { buildArchetypeAdvisoryBlock } from "./archetype-advisory";
import { getAuthoritativeVendorProposalFacts } from "@/lib/source/vendor-proposals/vendor-proposal-facts";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getSourceStageGuidebook } from "@/lib/source/stage-guidebooks/repository";
import type { SourceCategoryId } from "@/lib/source/taxonomy/category-taxonomy";
import type {
  SourceAppInventoryEntry,
  SourceGenerationContext,
  SourceGenerationUploadedArtifact,
} from "./types";

/**
 * Build the read-only context snapshot for a generation call.
 *
 * Returns null if the event can't be resolved or the active client
 * doesn't match — the caller renders a 404 / 403 from there.
 */
export async function buildSourceGenerationContext(
  eventIdOrCode: string,
  options: { requestedClientId?: string | null } = {},
): Promise<SourceGenerationContext | null> {
  const activeClient = await getActiveClientRow(
    options.requestedClientId,
  ).catch(() => null);
  let event = await getSourcingEvent(eventIdOrCode, options.requestedClientId);
  if (!event && activeClient) {
    const resolvedEventId = await resolveSourceEventUuidForClient(
      eventIdOrCode,
      activeClient.key,
    ).catch(() => null);
    if (resolvedEventId) {
      event = await getSourcingEvent(
        resolvedEventId,
        options.requestedClientId,
      );
    }
  }
  if (!event) return null;

  const tenantName = resolveSourceGenerationTenantName({
    activeClientName: activeClient?.name,
    canonicalName: canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }),
    eventAccountName: event.accountName,
    eventCode: event.code,
    eventName: event.name,
  });

  let substrateEventId = event.id;
  if (!isUuid(substrateEventId)) {
    if (!activeClient) return null;
    substrateEventId =
      (await resolveSourceEventUuidForClient(
        eventIdOrCode,
        activeClient.key,
      ).catch(() => null)) ??
      (event.code && event.code !== eventIdOrCode
        ? await resolveSourceEventUuidForClient(
            event.code,
            activeClient.key,
          ).catch(() => null)
        : null) ??
      substrateEventId;
  }
  if (!isUuid(substrateEventId)) return null;

  // The substrate queries take a UUID. event.id is always a UUID
  // even when the URL slug is a code.
  // Real, server-resolved identity for the tenant-scoped vendor-proposal-
  // facts session (RLS/tenant-isolation workstream, PR A) — never a
  // client-supplied value. currentUser is Clerk-session-derived, same as
  // every vendor-proposal-facts route.
  const currentUser = await getCurrentUser().catch(() => null);

  const [
    artifactStates,
    gateCriteria,
    evidence,
    uploadedEvidence,
    authoritativeVendorProposalFacts,
    currentStageGuidebook,
    nextStageGuidebook,
  ] = await Promise.all([
    listArtifactStatesForEvent(substrateEventId),
    listGateCriterionStatesForEvent(substrateEventId),
    listEvidenceStatesForEvent(substrateEventId),
    activeClient?.key
      ? listUploadedEvidenceForGeneration(substrateEventId, activeClient.key)
      : Promise.resolve([]),
    activeClient?.key
      ? getAuthoritativeVendorProposalFacts(
          {
            tenantKey: activeClient.key,
            role: currentUser?.primaryRole ?? "member",
            userId: currentUser?.clerkUserId ?? "unknown",
          },
          { eventId: substrateEventId },
        ).catch(() => [])
      : Promise.resolve([]),
    activeClient?.key
      ? getSourceStageGuidebook(event.currentStageKey, activeClient.key).catch(
          () => null,
        )
      : Promise.resolve(null),
    activeClient?.key && nextSourceStage(event.currentStageKey)
      ? getSourceStageGuidebook(
          nextSourceStage(event.currentStageKey)!,
          activeClient.key,
        ).catch(() => null)
      : Promise.resolve(null),
  ]);

  // Pull the company's application inventory through the sanctioned broker seam
  // so d04 pre-populates from the real systems estate instead of a blank stub.
  // The active client key (e.g. 'apexretail') must be translated to the substrate
  // key (e.g. 'apex-retail') first, or the read returns zero rows. Degrades to an
  // empty inventory when nothing is loaded — never fatal to generation.
  const substrateKey = activeClient?.key
    ? clientKeyToInventorySubstrateKey(activeClient.key)
    : null;
  const appInventoryRows = substrateKey
    ? await listAppInventoryRecords(substrateKey).catch(() => [])
    : [];
  const enterpriseAppInventory: SourceAppInventoryEntry[] =
    appInventoryRows.map((row) => ({
      appId: row.recordId,
      name: row.name,
      tier: row.tier,
      owner: row.owner,
      vendor: row.vendor,
      criticality: row.criticality,
      notes: row.notes,
    }));

  // Revive the dormant archetype playbook: resolve the event's sourcing
  // archetype from its live classifier category (event_type as fallback) and
  // pre-format its commercial intelligence so deliverable prompts carry
  // archetype-SPECIFIC traps/levers/challenges instead of generic advisor prose.
  // Refuses to guess when the category isn't mapped — advisory stays empty.
  const archetypeResolution = resolveArchetypeForEvent({
    categoryId: (event.classifiedCategory ?? null) as SourceCategoryId | null,
    eventType: event.archetype ?? null,
  });
  const archetypeAdvisory = buildArchetypeAdvisoryBlock(
    archetypeResolution.archetype,
  );

  return {
    tenantKey: activeClient?.key ?? "unknown",
    tenantName,
    event: {
      id: substrateEventId,
      code: event.code,
      name: event.name,
      archetype: event.archetype ?? null,
      classifiedCategory: event.classifiedCategory ?? null,
      rigor: event.rigor ?? null,
      currentStageKey: event.currentStageKey,
      statusLabel: event.statusLabel,
      owner: event.owner ?? null,
      // SourcingEventDetail exposes synopsis + problemStatement which
      // capture the trigger + scope narrative produced at intake time.
      triggerDescription: extractTrigger(event.problemStatement) ?? null,
      scopeDescription: event.problemStatement ?? null,
      estimatedValueUsd: event.valueAtStakeUsd ?? null,
    },
    artifactStates,
    gateCriteria,
    evidence,
    uploadedEvidence,
    archetypeAdvisory,
    enterpriseAppInventory,
    authoritativeVendorProposalFacts,
    currentStageGuidebook,
    nextStageGuidebook,
  };
}

function resolveSourceGenerationTenantName(args: {
  activeClientName?: string | null;
  canonicalName?: string | null;
  eventAccountName?: string | null;
  eventCode?: string | null;
  eventName?: string | null;
}): string {
  const activeClientName = cleanTenantLabel(args.activeClientName);
  const canonicalName = cleanTenantLabel(args.canonicalName);
  const eventAccountName = cleanTenantLabel(args.eventAccountName);
  const eventDerivedName = inferSourceEventTenantName({
    eventCode: args.eventCode,
    eventName: args.eventName,
  });

  if (eventDerivedName && isDemoPlaceholder(eventAccountName)) {
    return eventDerivedName;
  }

  if (eventAccountName && isDemoPlaceholder(canonicalName)) {
    return eventAccountName;
  }

  if (eventDerivedName && isDemoPlaceholder(canonicalName)) {
    return eventDerivedName;
  }

  return (
    canonicalName ??
    activeClientName ??
    eventAccountName ??
    eventDerivedName ??
    "AbarVa Client"
  );
}

function cleanTenantLabel(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function isDemoPlaceholder(value: string | null): boolean {
  return Boolean(
    value &&
    /\b(?:retail|healthcare|financial services|clinical technology|airline|industrial)\s+demo\b/i.test(
      value,
    ),
  );
}

function inferSourceEventTenantName(args: {
  eventCode?: string | null;
  eventName?: string | null;
}): string | null {
  const text = `${args.eventCode ?? ""} ${args.eventName ?? ""}`;
  if (/\bSKYH\b|SkyHarbor/i.test(text)) return "SkyHarbor Global";
  return null;
}

/**
 * Strip lines that are internal operational metadata — not authored content
 * meant for client-facing documents. These header lines appear in
 * demo-seeded bodies (e.g. "**Evidence label:** synthetic_demo") and must
 * never surface in downloads, exports, or upstream generation prompts.
 */
const INTERNAL_METADATA_LINE_RE =
  /^\*\*(?:Evidence label|CXO review status|Data classification|Review stage|Seed source|Internal label):\*\*/i;

export function sanitizeArtifactBodyForExport(body: string): string {
  return body
    .split("\n")
    .filter((line) => !INTERNAL_METADATA_LINE_RE.test(line.trim()))
    .join("\n")
    .trimStart();
}

/**
 * Pluck approved-or-richer bodies from the substrate, keyed by code.
 * The prompt builder uses this to bind upstream artifacts into the
 * user message. Pre-approval-status bodies are still included if a
 * body exists — the user may have authored content but not yet flipped
 * the status pill, and the agent should still consume what's there.
 */
export function collectUpstreamBodies(
  ctx: SourceGenerationContext,
  codes: string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const code of codes) {
    const row = ctx.artifactStates.find((a) => a.artifactCode === code);
    if (row?.body && row.body.trim().length > 0) {
      out[code] = sanitizeArtifactBodyForExport(row.body);
    }
  }
  return out;
}

/**
 * Cheap heuristic — pull the first sentence-ish out of scope_description
 * to surface the trigger in the prompt without dragging in the whole
 * narrative. The intake form's trigger field gets concatenated into
 * scope_description on event creation.
 */
function extractTrigger(scope: string | null | undefined): string | null {
  if (!scope) return null;
  const triggerLine = scope
    .split("\n")
    .find((line) => /trigger|why\s*now/i.test(line));
  return triggerLine?.replace(/^[^:]*:\s*/, "").trim() || null;
}

/**
 * Uploaded-evidence read for the generation context. tenantKey is REQUIRED
 * and re-checked at every join hop below (source_artifacts, then
 * source_artifact_chunks/source_artifact_facts) — never just trusted from
 * sourceEventId alone. This closes a join-safety gap found during the
 * RLS/tenant-isolation workstream's scope discovery: the artifact_id-keyed
 * second hop previously carried no independent tenant check at all, relying
 * entirely on the first hop's event scoping already being correct upstream.
 * Defense in depth: `buildSourceGenerationContext` already resolves
 * `substrateEventId` scoped to `activeClient.key` before calling this, so
 * this is a second, independent check, not the only one.
 */
async function listUploadedEvidenceForGeneration(
  sourceEventId: string,
  tenantKey: string,
): Promise<SourceGenerationUploadedArtifact[]> {
  const supabase = getAzureReadFluentClient();
  const { data: artifactRows, error: artifactError } = await supabase
    .from("source_artifacts")
    .select(
      "id, original_name, artifact_family, source_format, parse_status, evidence_state, stage_key, created_at, source_origin",
    )
    .eq("source_event_id", sourceEventId)
    .eq("tenant_key", tenantKey)
    .eq("source_origin", "uploaded")
    .order("created_at", { ascending: false })
    .limit(200);
  if (artifactError || !artifactRows?.length) return [];

  const latestRowsByName = new Map<string, unknown>();
  for (const row of artifactRows) {
    const typed = row as {
      id?: unknown;
      original_name?: unknown;
      source_origin?: unknown;
    };
    if (String(typed.source_origin ?? "uploaded") !== "uploaded") continue;
    const key = String(typed.original_name ?? typed.id ?? "")
      .toLowerCase()
      .trim();
    if (!key || latestRowsByName.has(key)) continue;
    latestRowsByName.set(key, row);
  }
  const latestArtifactRows = Array.from(latestRowsByName.values()).sort(
    (a, b) => {
      const left = String((a as { created_at?: unknown }).created_at ?? "");
      const right = String((b as { created_at?: unknown }).created_at ?? "");
      return left.localeCompare(right);
    },
  );

  const artifactIds = latestArtifactRows
    .map((row) => String((row as { id?: unknown }).id ?? ""))
    .filter(Boolean);
  if (artifactIds.length === 0) return [];

  const [chunksResult, factsResult] = await Promise.all([
    supabase
      .from("source_artifact_chunks")
      .select("artifact_id, chunk_text, chunk_kind, confidence")
      .in("artifact_id", artifactIds)
      .eq("tenant_key", tenantKey)
      .order("confidence", { ascending: false })
      .limit(160),
    supabase
      .from("source_artifact_facts")
      .select("artifact_id, fact_type, fact_key, fact_value, confidence")
      .in("artifact_id", artifactIds)
      .eq("tenant_key", tenantKey)
      .order("confidence", { ascending: false })
      .limit(160),
  ]);

  const chunksByArtifact = new Map<string, string[]>();
  for (const row of chunksResult.data ?? []) {
    const artifactId = String(
      (row as { artifact_id?: unknown }).artifact_id ?? "",
    );
    const chunkText = String((row as { chunk_text?: unknown }).chunk_text ?? "")
      .replace(/\s+/g, " ")
      .trim();
    if (!artifactId || !chunkText) continue;
    const list = chunksByArtifact.get(artifactId) ?? [];
    if (list.length < 5) {
      list.push(chunkText.slice(0, 900));
      chunksByArtifact.set(artifactId, list);
    }
  }

  const factsByArtifact = new Map<string, string[]>();
  for (const row of factsResult.data ?? []) {
    const typed = row as {
      artifact_id?: unknown;
      fact_type?: unknown;
      fact_key?: unknown;
      fact_value?: unknown;
    };
    const artifactId = String(typed.artifact_id ?? "");
    if (!artifactId) continue;
    const factType = String(typed.fact_type ?? "fact");
    const factKey = String(typed.fact_key ?? "unknown");
    const factValue =
      typeof typed.fact_value === "string"
        ? typed.fact_value
        : JSON.stringify(typed.fact_value ?? {});
    const list = factsByArtifact.get(artifactId) ?? [];
    if (list.length < 5) {
      list.push(`${factType}/${factKey}: ${factValue.slice(0, 700)}`);
      factsByArtifact.set(artifactId, list);
    }
  }

  return latestArtifactRows.map((row) => {
    const typed = row as {
      id: string;
      original_name: string | null;
      artifact_family: string | null;
      source_format: string | null;
      parse_status: string | null;
      evidence_state: string | null;
      stage_key: SourceGenerationUploadedArtifact["stageKey"];
    };
    return {
      id: typed.id,
      originalName: typed.original_name ?? typed.id,
      artifactFamily: typed.artifact_family ?? "other",
      sourceFormat: typed.source_format ?? "unknown",
      parseStatus: typed.parse_status ?? "pending",
      evidenceState: typed.evidence_state ?? "unparsed",
      stageKey: typed.stage_key ?? "strategy",
      chunkExcerpts: chunksByArtifact.get(typed.id) ?? [],
      factSummaries: factsByArtifact.get(typed.id) ?? [],
    };
  });
}
