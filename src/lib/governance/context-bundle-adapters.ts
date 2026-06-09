// =============================================================================
// Context & Corpus Governance — bundle-shape adapters (PR-5)
// -----------------------------------------------------------------------------
// Map the historical bundle shapes onto GovernedCandidate so they can flow
// through buildValidatedAgentContextBundle. Each adapter is conservative: an
// existing item whose governance fields aren't known yet defaults to the
// truthful floor (not_reviewed / committed_not_indexed) — never to agent_ready.
// =============================================================================

import type { Classification, SourceLayer } from "./context-corpus-policy";
import type { GovernedCandidate } from "./agent-context-bundle";

// Loosely-typed views of the source shapes so this module doesn't hard-import
// their declarations (and create coupling/cycles). Only the fields we map.
interface EnterpriseItemView {
  id: string;
  kind?: string;
  title?: string;
  summary?: string;
  tenantKey?: string;
  sourceBasis?: string;
  dataClassification?: string;
  linkedEvidence?: Array<{ citationLocator?: string }>;
}
interface EnterpriseBundleView {
  tenantKey: string;
  items: EnterpriseItemView[];
}
interface AskSourceView {
  id: string | null;
  name?: string;
  type?: string;
  confidence?: number;
}

/** EnterpriseDataClassification (incl. 'synthetic') -> canonical Classification. */
function mapClassification(raw: string | undefined): Classification {
  switch (raw) {
    case "public":
      return "public";
    case "confidential":
      return "confidential";
    case "restricted":
      return "restricted";
    case "synthetic":
    case "internal":
    default:
      return "internal";
  }
}

/** Broker item kind -> a governed source layer (best-effort, defaults safe). */
function mapSourceLayer(kind: string | undefined): SourceLayer {
  switch (kind) {
    case "kpi_metric":
      return "kpi";
    case "cross_program_signal":
      return "signal";
    default:
      return "tenant_context";
  }
}

/** One broker item -> a conservative GovernedCandidate. */
export function fromEnterpriseItem(
  item: EnterpriseItemView,
  clientKey: string,
  tenantId: string | null,
): GovernedCandidate {
  const citations = (item.linkedEvidence ?? [])
    .map((e) => e.citationLocator)
    .filter((c): c is string => typeof c === "string" && c.length > 0);
  return {
    id: item.id,
    client_key: clientKey,
    tenant_id: tenantId,
    source_layer: mapSourceLayer(item.kind),
    source_basis: item.sourceBasis ?? null,
    classification: mapClassification(item.dataClassification),
    retrievability: "committed_not_indexed",
    agent_readiness_status: "not_reviewed",
    confidence_level: null,
    cited_render_verified_at: null,
    title: item.title,
    citations,
  };
}

/** A broker `EnterpriseAgentContextBundle` -> governed candidates. */
export function fromEnterpriseBundle(
  bundle: EnterpriseBundleView,
  clientKey: string,
  tenantId: string | null,
): GovernedCandidate[] {
  return bundle.items.map((i) => fromEnterpriseItem(i, clientKey, tenantId));
}

/** A Sentinel `AskSource` -> a conservative GovernedCandidate. */
export function fromAskSource(
  source: AskSourceView,
  clientKey: string,
  tenantId: string | null,
): GovernedCandidate {
  return {
    id: source.id ?? `asksource:${source.name ?? "unknown"}`,
    client_key: clientKey,
    tenant_id: tenantId,
    source_layer: "tenant_context",
    source_basis: source.name ?? null,
    classification: "internal",
    retrievability: "committed_not_indexed",
    agent_readiness_status: "not_reviewed",
    confidence_level:
      typeof source.confidence === "number"
        ? source.confidence >= 0.75
          ? "high"
          : source.confidence >= 0.4
            ? "medium"
            : "low"
        : null,
    cited_render_verified_at: null,
    title: source.name,
    citations: source.id ? [source.id] : [],
  };
}
